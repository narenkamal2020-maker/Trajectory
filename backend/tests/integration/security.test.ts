import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';

let app: Express;
let execute: (sql: string, binds?: any) => Promise<unknown>;
let query: (sql: string, binds?: any) => Promise<any>;
let closePool: () => Promise<void>;
const tag = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const adminEmail = `it-secadmin-${tag}@test.trajectory.dev`;
const aliceEmail = `it-alice-${tag}@test.trajectory.dev`;
const bobEmail = `it-bob-${tag}@test.trajectory.dev`;
const password = 'Str0ngPassword!';
let admin = '', alice = '', bob = '';

beforeAll(async () => {
  const oracle = await import('../../src/config/oracle');
  const { runMigrations } = await import('../../src/db/migrate');
  const { ensureAdmin } = await import('../../src/auth/admin');
  const { createApp } = await import('../../src/app');
  await oracle.initOraclePool();
  await runMigrations({ log: () => {} });
  ({ execute, query, closePool } = oracle as any);
  app = createApp();
  await ensureAdmin(adminEmail, password);
  admin = (await request(app).post('/api/auth/login').send({ email: adminEmail, password })).body.accessToken;
  alice = (await request(app).post('/api/auth/register').send({ email: aliceEmail, password, name: 'Alice', attribution: { source: 'linkedin', campaign: 'launch' } })).body.accessToken;
  bob = (await request(app).post('/api/auth/register').send({ email: bobEmail, password, name: 'Bob' })).body.accessToken;
});

afterAll(async () => {
  await execute(`DELETE FROM CONTACT_MESSAGES WHERE EMAIL LIKE :e`, { e: `%${tag}%` });
  await execute(`DELETE FROM ANALYTICS_EVENTS WHERE SESSION_ID LIKE :s`, { s: `it-${tag}%` });
  await execute(`DELETE FROM AUDIT_LOG WHERE TARGET_ID LIKE :e OR DETAILS LIKE :e`, { e: `%${tag}%` });
  await execute(`DELETE FROM TRAJECTORY_USERS WHERE EMAIL LIKE :e`, { e: `it-%-${tag}@test.trajectory.dev` });
  await closePool();
});

const A = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('audit log & monitoring', () => {
  it('records failed logins and raises an alert on brute force', async () => {
    for (let i = 0; i < 5; i++) await request(app).post('/api/auth/login').send({ email: aliceEmail, password: 'wrong-pass-1' });
    const r = await query(`SELECT ACTION, SEVERITY FROM AUDIT_LOG WHERE TARGET_ID = :e ORDER BY CREATED_AT`, { e: aliceEmail.toLowerCase() });
    const actions = r.rows.map((x: any) => x.ACTION);
    expect(actions.filter((a: string) => a === 'auth.login_failed').length).toBeGreaterThanOrEqual(4);
    expect(r.rows.some((x: any) => x.ACTION === 'auth.bruteforce_suspected' && x.SEVERITY === 'ALERT')).toBe(true);
  });

  it('stores UTM attribution on sign-up', async () => {
    const r = await query(`SELECT SIGNUP_SOURCE FROM TRAJECTORY_USERS WHERE EMAIL = :e`, { e: aliceEmail });
    expect(JSON.parse(r.rows[0].SIGNUP_SOURCE)).toMatchObject({ source: 'linkedin', campaign: 'launch' });
  });

  it('logs denied admin access and exposes the audit log to admins only', async () => {
    expect((await request(app).get('/api/admin/audit').set(A(alice))).status).toBe(403);
    const log = await request(app).get('/api/admin/audit?severity=WARN').set(A(admin));
    expect(log.status).toBe(200);
    expect(log.body.items.some((x: any) => x.action === 'admin.access_denied')).toBe(true);
    expect(log.body.items.every((x: any) => x.severity === 'WARN')).toBe(true);
  });

  it('keeps detailed system status behind admin', async () => {
    expect((await request(app).get('/api/admin/system').set(A(alice))).status).toBe(403);
    const r = await request(app).get('/api/admin/system').set(A(admin));
    expect(r.body).toHaveProperty('database');
  });
});

describe('contact form', () => {
  it('validates input and rejects bots that fill the honeypot', async () => {
    const bad = await request(app).post('/api/contact').send({ name: 'A', email: 'nope', topic: 'support', message: 'short' });
    expect(bad.status).toBe(400);
    expect(bad.body.errors.map((e: any) => e.field)).toEqual(expect.arrayContaining(['name', 'email', 'message']));
    const bot = await request(app).post('/api/contact').send({ name: 'Bot', email: `bot-${tag}@x.dev`, topic: 'other', message: 'buy cheap things now', website: 'spam.example' });
    expect(bot.status).toBe(400);
  });

  it('accepts a message and shows it in the admin inbox', async () => {
    const r = await request(app).post('/api/contact').send({ name: 'Visitor', email: `visitor-${tag}@example.com`, topic: 'privacy', message: 'Please export all of my data.' });
    expect(r.status).toBe(201);
    const inbox = await request(app).get('/api/admin/messages').set(A(admin));
    const msg = inbox.body.find((m: any) => m.id === r.body.id);
    expect(msg).toMatchObject({ topic: 'privacy', status: 'NEW' });
    expect((await request(app).patch(`/api/admin/messages/${r.body.id}`).set(A(admin)).send({ status: 'CLOSED' })).status).toBe(204);
    expect((await request(app).get('/api/admin/messages').set(A(bob))).status).toBe(403);
  });
});

describe('telemetry', () => {
  it('accepts well-formed events and rejects junk', async () => {
    const ok = await request(app).post('/api/telemetry').send({
      sessionId: `it-${tag}-session`,
      events: [{ name: 'page_view', path: '/faq', utm: { source: 'newsletter', campaign: 'oct' } }, { name: 'sign_up' }],
    });
    expect(ok.status).toBe(204);
    expect((await request(app).post('/api/telemetry').send({ sessionId: 'x', events: [] })).status).toBe(400);
    expect((await request(app).post('/api/telemetry').send({ sessionId: `it-${tag}-s2`, events: [{ name: 'DROP TABLE;' }] })).status).toBe(400);
    const stats = await request(app).get('/api/admin/analytics?days=1').set(A(admin));
    expect(stats.body.topPages.some((p: any) => p.path === '/faq')).toBe(true);
    expect(stats.body.sources.some((s: any) => s.source === 'newsletter')).toBe(true);
  });
});

describe('tenant isolation', () => {
  it("users can't read or modify each other's data", async () => {
    const app1 = await request(app).post('/api/applications').set(A(alice)).send({ company: 'Acme', role: 'SWE' });
    expect((await request(app).patch(`/api/applications/${app1.body.id}`).set(A(bob)).send({ stage: 'OFFER' })).status).toBe(404);
    expect((await request(app).delete(`/api/applications/${app1.body.id}`).set(A(bob))).status).toBe(404);
    expect((await request(app).get('/api/applications').set(A(bob))).body).toHaveLength(0);

    const sub = await request(app).post('/api/questions/q-009/submit').set(A(alice)).send({ language: 'python', code: 'def climbStairs(n):\n    return n' });
    expect((await request(app).get(`/api/submissions/${sub.body.submissionId}`).set(A(bob))).status).toBe(404);

    const res = await request(app).post('/api/resumes').set(A(alice)).send({ text: 'Alice Example\nalice@example.com\nEXPERIENCE\n• Built things in Python for 3 years' });
    expect((await request(app).get(`/api/resumes/${res.body.resumeId}`).set(A(bob))).status).toBe(404);
  });

  it('stores resume text encrypted at rest', async () => {
    const r = await query(`SELECT PARSED_TEXT FROM RESUMES r JOIN TRAJECTORY_USERS u ON u.USER_ID = r.USER_ID WHERE u.EMAIL = :e`, { e: aliceEmail });
    const stored = String(r.rows[0].PARSED_TEXT);
    if (process.env.DATA_ENCRYPTION_KEY) {
      expect(stored.startsWith('enc:v1:')).toBe(true);
      expect(stored).not.toContain('alice@example.com');
    }
  });
});

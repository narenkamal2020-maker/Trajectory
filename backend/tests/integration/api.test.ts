/**
 * End-to-end API tests against a real Oracle schema (the one in backend/.env).
 * Each run registers a fresh user, so tests are independent of existing data.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';

let app: Express;
let closePool: () => Promise<void>;
let drain: () => Promise<void>;
let execute: (sql: string, binds?: any) => Promise<unknown>;

const email = `it-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.trajectory.dev`;
const password = 'Sup3rSecret!';
let token = '';
let refreshCookie = '';
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const oracle = await import('../../src/config/oracle');
  const { runMigrations } = await import('../../src/db/migrate');
  const { seedQuestions } = await import('../../src/db/seed');
  const { createApp } = await import('../../src/app');
  ({ drain } = await import('../../src/lib/jobs'));
  await oracle.initOraclePool();
  await runMigrations({ log: () => {} });
  await seedQuestions(() => {});
  closePool = oracle.closePool;
  execute = oracle.execute;
  app = createApp();
});

afterAll(async () => {
  await drain();
  await execute(`DELETE FROM TRAJECTORY_USERS WHERE EMAIL LIKE 'it-%@test.trajectory.dev'`);
  await closePool();
});

describe('health', () => {
  it('reports liveness without leaking internals', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
    expect(Object.keys(r.body).sort()).toEqual(['status', 'time']);
  });

  it('sends security headers', async () => {
    const r = await request(app).get('/api/health');
    expect(r.headers['content-security-policy']).toContain("default-src 'none'");
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
    expect(r.headers['permissions-policy']).toContain('camera=()');
    expect(r.headers['x-powered-by']).toBeUndefined();
  });
});

describe('auth', () => {
  it('rejects weak passwords and malformed emails', async () => {
    const r = await request(app).post('/api/auth/register').send({ email: 'nope', password: 'short', name: 'X' });
    expect(r.status).toBe(400);
    expect(r.body.errors.map((e: any) => e.field)).toEqual(expect.arrayContaining(['email', 'password', 'name']));
  });

  it('registers, returning an access token and an httpOnly refresh cookie', async () => {
    const r = await request(app).post('/api/auth/register').send({ email, password, name: 'Integration Tester' });
    expect(r.status).toBe(201);
    expect(r.body.accessToken).toBeTruthy();
    expect(r.body.refreshToken).toBeUndefined(); // web clients get it only as a cookie
    expect(r.body.requiresOnboarding).toBe(true);
    const cookie = (r.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refreshToken='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    refreshCookie = cookie.split(';')[0];
    token = r.body.accessToken;
  });

  it('rejects duplicate registration', async () => {
    const r = await request(app).post('/api/auth/register').send({ email, password, name: 'Again' });
    expect(r.status).toBe(409);
  });

  it('rejects bad credentials with a generic message', async () => {
    const r = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password1' });
    expect(r.status).toBe(401);
    expect(r.body.message).toBe('Invalid email or password');
  });

  it('protects API routes', async () => {
    expect((await request(app).get('/api/dashboard/overview')).status).toBe(401);
    expect((await request(app).get('/api/dashboard/overview').set('Authorization', 'Bearer garbage')).status).toBe(401);
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const first = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(first.status).toBe(200);
    const rotated = (first.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refreshToken='))!.split(';')[0];
    expect(rotated).not.toBe(refreshCookie);

    // Re-using the old token revokes the whole family.
    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(reuse.status).toBe(401);
    expect((await request(app).post('/api/auth/refresh').set('Cookie', rotated)).status).toBe(401);

    // Native clients receive the refresh token in the body.
    const login = await request(app).post('/api/auth/login').set('x-client-type', 'native').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.refreshToken).toBeTruthy();
    const viaBody = await request(app).post('/api/auth/refresh').set('x-client-type', 'native').send({ refreshToken: login.body.refreshToken });
    expect(viaBody.status).toBe(200);
    token = viaBody.body.accessToken;
  });

  it('returns the current user', async () => {
    const r = await request(app).get('/api/auth/me').set(auth());
    expect(r.status).toBe(200);
    expect(r.body.user.email).toBe(email);
  });
});

describe('onboarding & profile', () => {
  it('saves a profile and resolves the target role', async () => {
    const r = await request(app).put('/api/profile').set(auth()).send({
      targetRole: 'Backend Engineer', experienceLevel: 'Fresh Graduate', targetIndustry: 'FinTech', skills: ['SQL Joins', 'Node.js'],
    });
    expect(r.status).toBe(200);
    expect(r.body.resolvedRole.id).toBe('role-be');
    const status = await request(app).get('/api/onboarding/status').set(auth());
    expect(status.body.profileComplete).toBe(true);
    const me = await request(app).get('/api/auth/me').set(auth());
    expect(me.body.requiresOnboarding).toBe(false);
  });

  it('seeds self-reported skills at a low baseline', async () => {
    const r = await request(app).get('/api/skills').set(auth());
    const sql = r.body.find((s: any) => s.skillId === 'sk-sql-joins');
    expect(sql.proficiency).toBe(20);
  });
});

describe('practice', () => {
  it('lists questions with status', async () => {
    const r = await request(app).get('/api/questions?difficulty=EASY').set(auth());
    expect(r.status).toBe(200);
    expect(r.body.items.length).toBeGreaterThan(5);
    expect(r.body.items.every((q: any) => q.difficulty === 'EASY' && q.status === 'todo')).toBe(true);
  });

  it('shows question detail without hidden tests', async () => {
    const r = await request(app).get('/api/questions/q-001').set(auth());
    expect(r.status).toBe(200);
    expect(r.body.starterCode.javascript).toContain('function twoSum');
    expect(r.body.sampleTests.length).toBe(2);
    expect(r.body.hiddenTestCount).toBe(2);
    expect(JSON.stringify(r.body)).not.toContain('-1, -2, -3'); // a hidden input
  });

  it('404s unknown questions', async () => {
    expect((await request(app).get('/api/questions/q-nope').set(auth())).status).toBe(404);
  });

  it('runs code against sample tests only', async () => {
    const r = await request(app).post('/api/questions/q-001/run').set(auth()).send({
      language: 'python', code: 'def twoSum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen: return [seen[target-x], i]\n        seen[x] = i',
    });
    expect(r.status).toBe(200);
    expect(r.body.verdict).toBe('ACCEPTED');
    expect(r.body.total).toBe(2);
  });

  it('rejects the wrong language for SQL questions', async () => {
    const r = await request(app).post('/api/questions/q-007/run').set(auth()).send({ language: 'python', code: 'x' });
    expect(r.status).toBe(400);
  });

  let skillBefore = 0;
  it('grades a wrong submission without crashing and records it', async () => {
    skillBefore = (await request(app).get('/api/skills').set(auth())).body.find((s: any) => s.skillId === 'sk-hashmap')?.proficiency ?? 0;
    const r = await request(app).post('/api/questions/q-001/submit').set(auth()).send({ language: 'javascript', code: 'function twoSum(){ return [0,0]; }' });
    expect(r.status).toBe(200);
    expect(r.body.verdict).toBe('WRONG');
    expect(r.body.submissionId).toBeTruthy();
  });

  it('accepts a correct submission and raises linked skills', async () => {
    const r = await request(app).post('/api/questions/q-001/submit').set(auth()).send({
      language: 'javascript', timeTakenSec: 420,
      code: 'function twoSum(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { if (m.has(target - nums[i])) return [m.get(target - nums[i]), i]; m.set(nums[i], i); } }',
    });
    expect(r.body.verdict).toBe('ACCEPTED');
    expect(r.body.firstSolve).toBe(true);
    const hashmap = r.body.skillDeltas.find((d: any) => d.skillId === 'sk-hashmap');
    expect(hashmap.after).toBeGreaterThan(skillBefore);
    const list = await request(app).get('/api/questions?status=solved').set(auth());
    expect(list.body.items.map((q: any) => q.id)).toContain('q-001');
  });

  it('accepts a SQL submission', async () => {
    const r = await request(app).post('/api/questions/q-042/submit').set(auth()).send({
      language: 'sql', code: 'SELECT c.name AS Customers FROM Customers c WHERE c.id NOT IN (SELECT customerId FROM Orders) ORDER BY c.name',
    });
    expect(r.body.verdict).toBe('ACCEPTED');
  });

  it('syncs offline submissions idempotently', async () => {
    const item = { clientSubmissionId: `offline-${Date.now()}`, questionId: 'q-009', language: 'python', code: 'def climbStairs(n):\n    a, b = 1, 1\n    for _ in range(n): a, b = b, a + b\n    return a' };
    const first = await request(app).post('/api/practice/sync').set(auth()).send({ submissions: [item] });
    expect(first.body.results[0]).toMatchObject({ ok: true, verdict: 'ACCEPTED', duplicate: false });
    const again = await request(app).post('/api/practice/sync').set(auth()).send({ submissions: [item] });
    expect(again.body.results[0]).toMatchObject({ ok: true, duplicate: true });
  });

  it('serves an offline bundle without hidden tests', async () => {
    const r = await request(app).get('/api/questions/offline-bundle').set(auth());
    expect(r.body.questions.length).toBeGreaterThan(30);
    expect(r.body.questions.every((q: any) => q.sampleTests.every((t: any) => !t.hidden))).toBe(true);
  });

  it('lists submission history', async () => {
    const r = await request(app).get('/api/submissions').set(auth());
    expect(r.body.length).toBe(4);
    const detail = await request(app).get(`/api/submissions/${r.body[0].id}`).set(auth());
    expect(detail.body.code).toBeTruthy();
  });
});

describe('resume', () => {
  it('rejects empty resumes', async () => {
    const r = await request(app).post('/api/resumes').set(auth()).send({ text: 'too short' });
    expect(r.status).toBe(400);
  });

  it('analyzes an uploaded text resume in the background', async () => {
    const resume = [
      'Jamie Doe', 'jamie@example.com | github.com/jamiedoe', '', 'EXPERIENCE',
      'Backend Intern, Acme — Jun 2024 – Aug 2024',
      '• Built REST APIs in Node.js serving 5,000 daily users',
      '• Reduced query latency 30% by adding PostgreSQL indexes',
      '• Responsible for writing documentation', '', 'EDUCATION', 'B.S. Computer Science — 2021 – 2025', '', 'SKILLS', 'Node.js, SQL, Redis, Docker',
    ].join('\n');
    const r = await request(app).post('/api/resumes').set(auth()).attach('resume', Buffer.from(resume), 'resume.txt');
    expect(r.status).toBe(202);
    await drain();
    const latest = await request(app).get('/api/resumes/latest').set(auth());
    expect(latest.body.status).toBe('COMPLETED');
    expect(latest.body.atsScore).toBeGreaterThan(30);
    expect(latest.body.breakdown.length).toBeGreaterThan(5);
    expect(latest.body.parsed.skills.map((s: any) => s.skillId)).toEqual(expect.arrayContaining(['sk-node', 'sk-sql-joins', 'sk-sd-caching', 'sk-docker']));
    expect(latest.body.gaps.length).toBeGreaterThan(0);
    expect(latest.body.interviewQuestions.length).toBeGreaterThan(2);
  });

  it('rejects unsupported file types', async () => {
    const r = await request(app).post('/api/resumes').set(auth()).attach('resume', Buffer.from('MZ'), 'evil.exe');
    expect(r.status).toBe(400);
  });
});

describe('interviews', () => {
  let interviewId = '';
  it('runs a full behavioral interview to completion', async () => {
    const start = await request(app).post('/api/interviews').set(auth()).send({ type: 'BEHAVIORAL' });
    expect(start.status).toBe(201);
    interviewId = start.body.interviewId;
    expect(start.body.totalQuestions).toBe(4);

    const answer = 'When I was on the payments team our project goal was to cut checkout errors. I was responsible for the retry logic. ' +
      'I implemented idempotency keys and I set up alerts because duplicate charges were the main risk. As a result errors dropped 45% and I learned to measure first.';
    let r: any, guard = 0;
    do {
      r = await request(app).post(`/api/interviews/${interviewId}/respond`).set(auth()).send({ answer });
      expect(r.status).toBe(200);
      expect(r.body.feedback.communication).toBeGreaterThan(0);
    } while (!r.body.done && ++guard < 10);
    expect(r.body.done).toBe(true);
    expect(r.body.summary.overall).toBeGreaterThan(0);
  });

  it('rejects answers after completion and shows a transcript', async () => {
    const r = await request(app).post(`/api/interviews/${interviewId}/respond`).set(auth()).send({ answer: 'late' });
    expect(r.status).toBe(400);
    const detail = await request(app).get(`/api/interviews/${interviewId}`).set(auth());
    expect(detail.body.status).toBe('COMPLETED');
    expect(detail.body.messages.filter((m: any) => m.role === 'USER').length).toBeGreaterThanOrEqual(4);
  });

  it('asks a follow-up for a weak answer', async () => {
    const start = await request(app).post('/api/interviews').set(auth()).send({ type: 'SYSTEM_DESIGN' });
    const r = await request(app).post(`/api/interviews/${start.body.interviewId}/respond`).set(auth()).send({ answer: 'I would use a server.' });
    expect(r.body.isFollowUp).toBe(true);
    expect(r.body.questionNumber).toBe(1);
  });

  it("can't read another user's interview", async () => {
    const other = await request(app).post('/api/auth/register').send({ email: `it-${Date.now()}-other@test.trajectory.dev`, password, name: 'Other' });
    const r = await request(app).get(`/api/interviews/${interviewId}`).set('Authorization', `Bearer ${other.body.accessToken}`);
    expect(r.status).toBe(404);
  });
});

describe('applications', () => {
  it('supports CRUD scoped to the owner', async () => {
    const created = await request(app).post('/api/applications').set(auth()).send({ company: 'Acme', role: 'Backend Engineer', appliedDate: '2026-09-30' });
    expect(created.status).toBe(201);
    const id = created.body.id;
    const upd = await request(app).patch(`/api/applications/${id}`).set(auth()).send({ stage: 'INTERVIEW', notes: 'Onsite next week' });
    expect(upd.body.stage).toBe('INTERVIEW');
    expect(upd.body.notes).toBe('Onsite next week');
    expect((await request(app).patch(`/api/applications/${id}`).set(auth()).send({ stage: 'BOGUS' })).status).toBe(400);
    expect((await request(app).get('/api/applications').set(auth())).body).toHaveLength(1);
    expect((await request(app).delete(`/api/applications/${id}`).set(auth())).status).toBe(204);
    expect((await request(app).get('/api/applications').set(auth())).body).toHaveLength(0);
  });
});

describe('dashboard, career, recommendations, analytics', () => {
  it('builds the dashboard from real activity', async () => {
    await drain();
    const r = await request(app).get('/api/dashboard/overview').set(auth());
    expect(r.status).toBe(200);
    expect(r.body.targetRole).toBe('Backend Developer');
    expect(r.body.solvedProblemsCount).toBe(3);
    expect(r.body.readinessPercentage).toBeGreaterThan(0);
    expect(r.body.interviewsCompleted).toBe(1);
    expect(r.body.recommendations.length).toBeGreaterThan(0);
    expect(r.body.recentActivity.length).toBeGreaterThan(0);
  });

  it('computes the career trajectory', async () => {
    const r = await request(app).get('/api/career/trajectory').set(auth());
    expect(r.body.targetRole.id).toBe('role-be');
    expect(r.body.waypoints.length).toBe(r.body.totalWaypoints);
    expect(r.body.adjacentRoles.length).toBe(5);
    expect(r.body.milestones.find((m: any) => m.id === 'profile').done).toBe(true);
  });

  it('returns a skill constellation', async () => {
    const r = await request(app).get('/api/skills/constellation').set(auth());
    expect(r.body.nodes.length).toBeGreaterThan(5);
    expect(new Set(r.body.nodes.map((n: any) => n.status))).toContain('delta');
  });

  it('dismisses a recommendation', async () => {
    const list = await request(app).get('/api/recommendations').set(auth());
    const first = list.body.items[0];
    expect((await request(app).post(`/api/recommendations/${first.id}/dismiss`).set(auth())).status).toBe(204);
    const after = await request(app).get('/api/recommendations').set(auth());
    expect(after.body.items.map((x: any) => `${x.type}:${x.entityId}`)).not.toContain(`${first.type}:${first.entityId}`);
  });

  it('serves analytics', async () => {
    const r = await request(app).get('/api/analytics/overview?days=30').set(auth());
    expect(r.body.totals.solved).toBe(3);
    expect(r.body.totals.streakDays).toBe(1);
    expect(r.body.heatmap).toHaveLength(90);
    expect(r.body.heatmap[89].submissions).toBeGreaterThan(0);
    expect(r.body.byDifficulty.find((d: any) => d.difficulty === 'EASY').solved).toBe(3);
    expect(r.body.timeline.length).toBeGreaterThanOrEqual(1);
    expect(r.body.interviews.length).toBe(1);
  });

  it('logs ML training events for each learning interaction', async () => {
    const { query } = await import('../../src/config/oracle');
    const r = await query<any>(
      `SELECT EVENT_TYPE, COUNT(*) AS N FROM ML_EVENTS e JOIN TRAJECTORY_USERS u ON u.USER_ID = e.USER_ID WHERE u.EMAIL = :email GROUP BY EVENT_TYPE`,
      { email }
    );
    const counts = Object.fromEntries((r.rows ?? []).map((x: any) => [x.EVENT_TYPE, Number(x.N)]));
    expect(counts.SUBMISSION).toBe(4);
    expect(counts.RESUME).toBe(1);
    expect(counts.INTERVIEW_ANSWER).toBeGreaterThanOrEqual(5);
  });
});

describe('errors', () => {
  it('returns JSON 404 for unknown routes and 400 for malformed JSON', async () => {
    expect((await request(app).get('/api/does-not-exist').set(auth())).status).toBe(404);
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400);
  });
});

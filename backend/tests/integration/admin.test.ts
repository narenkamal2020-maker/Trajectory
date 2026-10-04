import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';

let app: Express;
let execute: (sql: string, binds?: any) => Promise<unknown>;
let closePool: () => Promise<void>;
const tag = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const adminEmail = `it-admin-${tag}@test.trajectory.dev`;
const userEmail = `it-user-${tag}@test.trajectory.dev`;
const password = 'Adm1nPassword!';
let adminToken = '', userToken = '', adminId = '', userId = '';
let topicId = '', skillId = '', questionId = '';
const A = () => ({ Authorization: `Bearer ${adminToken}` });
const U = () => ({ Authorization: `Bearer ${userToken}` });

const question = (over: Record<string, unknown> = {}) => ({
  title: `Sum of Squares ${tag}`,
  description: 'Return the sum of the squares of the integers in `nums`.',
  difficulty: 'EASY',
  categoryId: topicId,
  type: 'CODE',
  tags: ['math'],
  hints: ['Square each number, then add them up.'],
  skills: [{ skillId, weight: 1 }],
  code: { functionName: 'sumSquares', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int' },
  tests: [
    { args: [[1, 2, 3]], expected: 14 },
    { args: [[]], expected: 0, hidden: true },
    { args: [[-2, 5]], expected: 29, hidden: true },
  ],
  reference: { language: 'python', code: 'def sumSquares(nums):\n    return sum(x * x for x in nums)' },
  ...over,
});

beforeAll(async () => {
  const oracle = await import('../../src/config/oracle');
  const { runMigrations } = await import('../../src/db/migrate');
  const { ensureAdmin } = await import('../../src/auth/admin');
  const { createApp } = await import('../../src/app');
  await oracle.initOraclePool();
  await runMigrations({ log: () => {} });
  execute = oracle.execute;
  closePool = oracle.closePool;
  app = createApp();
  await ensureAdmin(adminEmail, password, 'IT Admin');
  const a = await request(app).post('/api/auth/login').send({ email: adminEmail, password });
  adminToken = a.body.accessToken; adminId = a.body.user.id;
  const u = await request(app).post('/api/auth/register').send({ email: userEmail, password, name: 'IT Learner' });
  userToken = u.body.accessToken; userId = u.body.user.id;
});

afterAll(async () => {
  if (questionId) {
    await execute(`DELETE FROM SUBMISSIONS WHERE QUESTION_ID = :q`, { q: questionId });
    await execute(`DELETE FROM QUESTIONS WHERE QUESTION_ID = :q`, { q: questionId });
  }
  await execute(`DELETE FROM QUESTIONS WHERE CATEGORY_ID = :c`, { c: topicId });
  await execute(`DELETE FROM TRAJECTORY_USERS WHERE EMAIL LIKE :e`, { e: `it-%-${tag}@test.trajectory.dev` });
  await execute(`DELETE FROM USER_SKILLS WHERE SKILL_ID = :s`, { s: skillId });
  await execute(`DELETE FROM SKILLS WHERE SKILL_ID = :s`, { s: skillId });
  await execute(`DELETE FROM SKILL_CATEGORIES WHERE CATEGORY_ID = :c`, { c: topicId });
  await closePool();
});

describe('admin access', () => {
  it('exposes the role on the session', async () => {
    const me = await request(app).get('/api/auth/me').set(A());
    expect(me.body.user.role).toBe('ADMIN');
    const learner = await request(app).get('/api/auth/me').set(U());
    expect(learner.body.user.role).toBe('USER');
  });

  it('forbids regular users and anonymous requests', async () => {
    expect((await request(app).get('/api/admin/stats').set(U())).status).toBe(403);
    expect((await request(app).get('/api/admin/users').set(U())).status).toBe(403);
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });

  it('serves platform stats', async () => {
    const r = await request(app).get('/api/admin/stats').set(A());
    expect(r.status).toBe(200);
    expect(r.body.users).toBeGreaterThanOrEqual(2);
    expect(r.body.questions).toBeGreaterThan(30);
  });
});

describe('user management', () => {
  it('lists and searches users with activity stats', async () => {
    const r = await request(app).get(`/api/admin/users?search=${encodeURIComponent(userEmail)}`).set(A());
    expect(r.body.total).toBe(1);
    expect(r.body.items[0]).toMatchObject({ email: userEmail, role: 'USER', active: true, solved: 0 });
    const detail = await request(app).get(`/api/admin/users/${userId}`).set(A());
    expect(detail.body.email).toBe(userEmail);
    expect(Array.isArray(detail.body.recentSubmissions)).toBe(true);
  });

  it("won't let an admin demote or deactivate themselves", async () => {
    expect((await request(app).patch(`/api/admin/users/${adminId}`).set(A()).send({ role: 'USER' })).status).toBe(400);
    expect((await request(app).patch(`/api/admin/users/${adminId}`).set(A()).send({ active: false })).status).toBe(400);
  });

  it('promotion takes effect immediately, and so does demotion', async () => {
    await request(app).patch(`/api/admin/users/${userId}`).set(A()).send({ role: 'ADMIN' }).expect(200);
    expect((await request(app).get('/api/admin/stats').set(U())).status).toBe(200);
    await request(app).patch(`/api/admin/users/${userId}`).set(A()).send({ role: 'USER' }).expect(200);
    // Same (still valid) access token — role is re-checked against the database.
    expect((await request(app).get('/api/admin/stats').set(U())).status).toBe(403);
  });
});

describe('topics, skills and questions', () => {
  it('creates a topic and a skill', async () => {
    const t = await request(app).post('/api/admin/topics').set(A()).send({ name: `Bit Tricks ${tag}`, parentId: 'cat-dsa' });
    expect(t.status).toBe(201);
    topicId = t.body.id;
    expect((await request(app).post('/api/admin/topics').set(A()).send({ name: `Bit Tricks ${tag}` })).status).toBe(409);
    const s = await request(app).post('/api/admin/skills').set(A()).send({ categoryId: topicId, name: 'Bit Manipulation' });
    expect(s.status).toBe(201);
    skillId = s.body.id;
    const topics = await request(app).get('/api/admin/topics').set(A());
    const mine = topics.body.find((x: any) => x.id === topicId);
    expect(mine.parentId).toBe('cat-dsa');
    expect(mine.skills.map((k: any) => k.id)).toContain(skillId);
  });

  it('rejects malformed questions with field errors', async () => {
    const r = await request(app).post('/api/admin/questions').set(A()).send(question({ tests: [{ args: [1, 2], expected: 3 }], skills: [] }));
    expect(r.status).toBe(400);
    expect(r.body.errors.map((e: any) => e.field)).toEqual(expect.arrayContaining(['skills', 'tests.0.args']));
  });

  it('rejects a question whose reference solution fails its tests', async () => {
    const r = await request(app).post('/api/admin/questions').set(A())
      .send(question({ reference: { language: 'python', code: 'def sumSquares(nums):\n    return sum(nums)' } }));
    expect(r.status).toBe(400);
    expect(r.body.details.failures.length).toBeGreaterThan(0);
  });

  it('saves a validated question that learners can immediately practice', async () => {
    const r = await request(app).post('/api/admin/questions').set(A()).send(question());
    expect(r.status).toBe(201);
    expect(r.body.validation).toMatchObject({ passed: 3, total: 3 });
    questionId = r.body.id;

    const detail = await request(app).get(`/api/questions/${questionId}`).set(U());
    expect(detail.body.starterCode.javascript).toContain('function sumSquares(nums)');
    expect(detail.body.sampleTests).toHaveLength(1);
    expect(detail.body.hiddenTestCount).toBe(2);

    const sub = await request(app).post(`/api/questions/${questionId}/submit`).set(U())
      .send({ language: 'javascript', code: 'function sumSquares(nums){ return nums.reduce((a, x) => a + x * x, 0); }' });
    expect(sub.body.verdict).toBe('ACCEPTED');
    expect(sub.body.skillDeltas[0].skillId).toBe(skillId);
  });

  it('edits a question and returns hidden tests to the editor', async () => {
    const r = await request(app).put(`/api/admin/questions/${questionId}`).set(A()).send(question({ difficulty: 'MEDIUM' }));
    expect(r.status).toBe(200);
    const full = await request(app).get(`/api/admin/questions/${questionId}`).set(A());
    expect(full.body.difficulty).toBe('MEDIUM');
    expect(full.body.tests.filter((t: any) => t.hidden)).toHaveLength(2);
  });

  it('deactivating a question hides it from learners', async () => {
    await request(app).patch(`/api/admin/questions/${questionId}`).set(A()).send({ active: false }).expect(204);
    expect((await request(app).get(`/api/questions/${questionId}`).set(U())).status).toBe(404);
    await request(app).patch(`/api/admin/questions/${questionId}`).set(A()).send({ active: true }).expect(204);
    expect((await request(app).get(`/api/questions/${questionId}`).set(U())).status).toBe(200);
  });

  it('bulk-imports, reporting each item separately', async () => {
    const r = await request(app).post('/api/admin/questions/import').set(A()).send({
      questions: [
        question({ title: `Import OK ${tag}` }),
        question({ title: `Import Bad Ref ${tag}`, reference: { language: 'python', code: 'def sumSquares(nums):\n    return 0' } }),
        { title: 'Missing everything' },
      ],
    });
    expect(r.body.imported).toBe(1);
    expect(r.body.failed).toBe(2);
    expect(r.body.results[1].error).toMatch(/reference solution/);
  });

  it('refuses to delete topics or skills that are in use', async () => {
    expect((await request(app).delete(`/api/admin/topics/${topicId}`).set(A())).status).toBe(409);
    expect((await request(app).delete(`/api/admin/skills/${skillId}`).set(A())).status).toBe(409);
  });
});

describe('deactivation', () => {
  it('locks a deactivated user out and revokes their sessions', async () => {
    await request(app).patch(`/api/admin/users/${userId}`).set(A()).send({ active: false }).expect(200);
    expect((await request(app).post('/api/auth/login').send({ email: userEmail, password })).status).toBe(401);
    await request(app).patch(`/api/admin/users/${userId}`).set(A()).send({ active: true }).expect(200);
    expect((await request(app).post('/api/auth/login').send({ email: userEmail, password })).status).toBe(200);
  });
});

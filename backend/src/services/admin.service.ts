import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { query, withTransaction } from '../config/oracle';
import { cache } from '../lib/cache';
import { badRequest, conflict, notFound } from '../lib/http';
import { num, parseJson } from '../lib/util';
import { getRunner, type ExecutionResult, type Language } from '../engine/executor';
import { upsertQuestion } from '../db/seed';
import type { QuestionDef } from '../db/data/questions';

// ───────────────────────────── Schemas ─────────────────────────────
const valueType = z.enum(['int', 'float', 'bool', 'string', 'int[]', 'string[]', 'int[][]', 'string[][]', 'ListNode', 'TreeNode']);
const identifier = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,63}$/, 'Must be a valid identifier');

export const questionInput = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(20000),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  categoryId: z.string().min(1),
  type: z.enum(['CODE', 'SQL']),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(12).default([]),
  hints: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
  constraints: z.string().max(2000).optional().nullable(),
  timeLimitMs: z.number().int().min(200).max(10000).default(2000),
  skills: z.array(z.object({ skillId: z.string().min(1), weight: z.number().min(0.1).max(1) })).min(1, 'Link at least one skill').max(6),
  code: z.object({
    functionName: identifier,
    params: z.array(z.object({ name: identifier, type: valueType })).min(1).max(6),
    returnType: valueType,
    compare: z.enum(['exact', 'unordered', 'unorderedNested', 'float']).default('exact'),
  }).optional(),
  sql: z.object({ setup: z.string().min(10).max(20000), orderMatters: z.boolean().default(true) }).optional(),
  tests: z.array(z.object({ args: z.array(z.unknown()).optional(), expected: z.unknown(), hidden: z.boolean().default(false) })).min(1).max(30),
  reference: z.object({ language: z.enum(['javascript', 'python', 'sql']), code: z.string().min(1).max(50000) }),
}).superRefine((q, ctx) => {
  if (q.type === 'CODE') {
    if (!q.code) ctx.addIssue({ code: 'custom', path: ['code'], message: 'Function signature is required for coding questions' });
    else q.tests.forEach((t, i) => {
      if (!Array.isArray(t.args) || t.args.length !== q.code!.params.length)
        ctx.addIssue({ code: 'custom', path: ['tests', i, 'args'], message: `Expected ${q.code!.params.length} argument(s)` });
    });
    if (q.reference.language === 'sql') ctx.addIssue({ code: 'custom', path: ['reference', 'language'], message: 'Use JavaScript or Python' });
  } else {
    if (!q.sql) ctx.addIssue({ code: 'custom', path: ['sql'], message: 'Schema setup is required for SQL questions' });
    if (q.reference.language !== 'sql') ctx.addIssue({ code: 'custom', path: ['reference', 'language'], message: 'SQL questions need a SQL reference' });
    q.tests.forEach((t, i) => { if (!Array.isArray(t.expected)) ctx.addIssue({ code: 'custom', path: ['tests', i, 'expected'], message: 'Expected rows must be an array of rows' }); });
  }
  if (!q.tests.some((t) => !t.hidden)) ctx.addIssue({ code: 'custom', path: ['tests'], message: 'Add at least one visible (sample) test' });
});
export type QuestionInput = z.infer<typeof questionInput>;

const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item'; // ids stay within VARCHAR2(36)

function toDefinition(id: string, q: QuestionInput): QuestionDef {
  return {
    id, title: q.title, description: q.description, difficulty: q.difficulty, categoryId: q.categoryId,
    skills: q.skills.map((s) => [s.skillId, s.weight]), tags: q.tags, hints: q.hints, constraints: q.constraints ?? undefined,
    timeLimitMs: q.timeLimitMs, type: q.type,
    code: q.type === 'CODE' ? q.code : undefined,
    sql: q.type === 'SQL' ? q.sql : undefined,
    tests: q.tests.map((t) => ({ args: t.args, expected: t.expected, hidden: t.hidden })),
    reference: { [q.reference.language]: q.reference.code },
  };
}

/** Catalog, question and every per-user derived cache (recommendations, dashboards) depend on content. */
const invalidateContent = () => cache.clear();

async function assertRefs(q: QuestionInput) {
  const cat = await query(`SELECT 1 FROM SKILL_CATEGORIES WHERE CATEGORY_ID = :id`, { id: q.categoryId });
  if (!cat.rows?.length) throw badRequest(`Unknown topic: ${q.categoryId}`);
  const ids = q.skills.map((s) => s.skillId);
  const found = await query<{ SKILL_ID: string }>(`SELECT SKILL_ID FROM SKILLS WHERE SKILL_ID IN (${ids.map((_, i) => `:s${i}`).join(',')})`,
    Object.fromEntries(ids.map((v, i) => [`s${i}`, v])));
  const known = new Set((found.rows ?? []).map((r) => r.SKILL_ID));
  const missing = ids.filter((i) => !known.has(i));
  if (missing.length) throw badRequest(`Unknown skill(s): ${missing.join(', ')}`);
}

// ───────────────────────────── Service ─────────────────────────────
export const AdminService = {
  async stats() {
    const r = await query<any>(`SELECT
      (SELECT COUNT(*) FROM TRAJECTORY_USERS) AS USERS,
      (SELECT COUNT(*) FROM TRAJECTORY_USERS WHERE CREATED_AT > SYSTIMESTAMP - INTERVAL '7' DAY) AS NEW_USERS_7D,
      (SELECT COUNT(DISTINCT USER_ID) FROM SUBMISSIONS WHERE SUBMITTED_AT > SYSTIMESTAMP - INTERVAL '7' DAY) AS ACTIVE_7D,
      (SELECT COUNT(*) FROM SUBMISSIONS) AS SUBMISSIONS,
      (SELECT COUNT(*) FROM INTERVIEWS WHERE STATUS = 'COMPLETED') AS INTERVIEWS,
      (SELECT COUNT(*) FROM RESUMES) AS RESUMES,
      (SELECT COUNT(*) FROM QUESTIONS WHERE IS_ACTIVE = 1) AS QUESTIONS,
      (SELECT COUNT(*) FROM SKILL_CATEGORIES) AS TOPICS,
      (SELECT COUNT(*) FROM SKILLS) AS SKILLS
      FROM DUAL`);
    const x = r.rows?.[0] ?? {};
    return {
      users: num(x.USERS), newUsers7d: num(x.NEW_USERS_7D), activeUsers7d: num(x.ACTIVE_7D), submissions: num(x.SUBMISSIONS),
      interviews: num(x.INTERVIEWS), resumes: num(x.RESUMES), questions: num(x.QUESTIONS), topics: num(x.TOPICS), skills: num(x.SKILLS),
    };
  },

  // ── Users ──
  async users(f: { search?: string; role?: string; status?: string; page: number; pageSize: number }) {
    const where: string[] = ['1 = 1'];
    const binds: Record<string, any> = {};
    if (f.search) { where.push(`(LOWER(u.EMAIL) LIKE :q OR LOWER(u.FULL_NAME) LIKE :q)`); binds.q = `%${f.search.toLowerCase()}%`; }
    if (f.role) { where.push('u.USER_ROLE = :role'); binds.role = f.role; }
    if (f.status) { where.push('u.IS_ACTIVE = :active'); binds.active = f.status === 'active' ? 1 : 0; }
    const total = await query<any>(`SELECT COUNT(*) AS N FROM TRAJECTORY_USERS u WHERE ${where.join(' AND ')}`, binds);
    const r = await query<any>(
      `SELECT u.USER_ID, u.EMAIL, u.FULL_NAME, u.USER_ROLE, u.IS_ACTIVE, u.CREATED_AT, p.TARGET_ROLE, p.EXPERIENCE_LEVEL,
         (SELECT COUNT(DISTINCT s.QUESTION_ID) FROM SUBMISSIONS s WHERE s.USER_ID = u.USER_ID AND s.STATUS = 'ACCEPTED') AS SOLVED,
         (SELECT COUNT(*) FROM SUBMISSIONS s WHERE s.USER_ID = u.USER_ID) AS SUBMISSIONS,
         (SELECT COUNT(*) FROM INTERVIEWS i WHERE i.USER_ID = u.USER_ID AND i.STATUS = 'COMPLETED') AS INTERVIEWS,
         (SELECT MAX(s.SUBMITTED_AT) FROM SUBMISSIONS s WHERE s.USER_ID = u.USER_ID) AS LAST_ACTIVE
       FROM TRAJECTORY_USERS u LEFT JOIN PROFILES p ON p.USER_ID = u.USER_ID
       WHERE ${where.join(' AND ')}
       ORDER BY u.CREATED_AT DESC OFFSET :off ROWS FETCH NEXT :lim ROWS ONLY`,
      { ...binds, off: (f.page - 1) * f.pageSize, lim: f.pageSize }
    );
    return {
      total: num(total.rows?.[0]?.N),
      page: f.page,
      pageSize: f.pageSize,
      items: (r.rows ?? []).map((u) => ({
        id: u.USER_ID, email: u.EMAIL, name: u.FULL_NAME, role: u.USER_ROLE, active: !!u.IS_ACTIVE,
        targetRole: u.TARGET_ROLE ?? null, experienceLevel: u.EXPERIENCE_LEVEL ?? null,
        solved: num(u.SOLVED), submissions: num(u.SUBMISSIONS), interviews: num(u.INTERVIEWS),
        createdAt: new Date(u.CREATED_AT).toISOString(), lastActive: u.LAST_ACTIVE ? new Date(u.LAST_ACTIVE).toISOString() : null,
      })),
    };
  },

  async user(id: string) {
    const u = (await query<any>(
      `SELECT u.*, p.TARGET_ROLE, p.EXPERIENCE_LEVEL, p.TARGET_INDUSTRY, p.GITHUB_URL, p.LINKEDIN_URL
       FROM TRAJECTORY_USERS u LEFT JOIN PROFILES p ON p.USER_ID = u.USER_ID WHERE u.USER_ID = :id`, { id }
    )).rows?.[0];
    if (!u) throw notFound('User');
    const [skills, subs, interviews, resume] = await Promise.all([
      query<any>(`SELECT s.NAME, us.PROFICIENCY, us.ATTEMPTS FROM USER_SKILLS us JOIN SKILLS s ON s.SKILL_ID = us.SKILL_ID WHERE us.USER_ID = :id ORDER BY us.PROFICIENCY DESC FETCH FIRST 12 ROWS ONLY`, { id }),
      query<any>(`SELECT q.TITLE, s.STATUS, s.LANGUAGE, s.SUBMITTED_AT FROM SUBMISSIONS s JOIN QUESTIONS q ON q.QUESTION_ID = s.QUESTION_ID WHERE s.USER_ID = :id ORDER BY s.SUBMITTED_AT DESC FETCH FIRST 10 ROWS ONLY`, { id }),
      query<any>(`SELECT INTERVIEW_TYPE, STATUS, OVERALL_SCORE, CREATED_AT FROM INTERVIEWS WHERE USER_ID = :id ORDER BY CREATED_AT DESC FETCH FIRST 10 ROWS ONLY`, { id }),
      query<any>(`SELECT FILE_NAME, ATS_SCORE, ANALYSIS_STATUS, CREATED_AT FROM RESUMES WHERE USER_ID = :id ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`, { id }),
    ]);
    const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);
    return {
      id: u.USER_ID, email: u.EMAIL, name: u.FULL_NAME, role: u.USER_ROLE, active: !!u.IS_ACTIVE, createdAt: iso(u.CREATED_AT),
      profile: { targetRole: u.TARGET_ROLE ?? null, experienceLevel: u.EXPERIENCE_LEVEL ?? null, targetIndustry: u.TARGET_INDUSTRY ?? null, githubUrl: u.GITHUB_URL ?? null, linkedinUrl: u.LINKEDIN_URL ?? null },
      skills: (skills.rows ?? []).map((s) => ({ name: s.NAME, proficiency: num(s.PROFICIENCY), attempts: num(s.ATTEMPTS) })),
      recentSubmissions: (subs.rows ?? []).map((s) => ({ title: s.TITLE, status: s.STATUS, language: s.LANGUAGE, at: iso(s.SUBMITTED_AT) })),
      interviews: (interviews.rows ?? []).map((i) => ({ type: i.INTERVIEW_TYPE, status: i.STATUS, overall: i.OVERALL_SCORE === null ? null : num(i.OVERALL_SCORE), at: iso(i.CREATED_AT) })),
      resume: resume.rows?.[0] ? { fileName: resume.rows[0].FILE_NAME, atsScore: resume.rows[0].ATS_SCORE === null ? null : num(resume.rows[0].ATS_SCORE), status: resume.rows[0].ANALYSIS_STATUS, at: iso(resume.rows[0].CREATED_AT) } : null,
    };
  },

  async updateUser(actorId: string, id: string, patch: { role?: 'USER' | 'ADMIN'; active?: boolean }) {
    if (id === actorId && (patch.role === 'USER' || patch.active === false)) throw badRequest("You can't demote or deactivate your own account");
    const exists = await query(`SELECT 1 FROM TRAJECTORY_USERS WHERE USER_ID = :id`, { id });
    if (!exists.rows?.length) throw notFound('User');
    await withTransaction(async (conn) => {
      if (patch.role) await conn.execute(`UPDATE TRAJECTORY_USERS SET USER_ROLE = :role, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :id`, { role: patch.role, id });
      if (patch.active !== undefined) {
        await conn.execute(`UPDATE TRAJECTORY_USERS SET IS_ACTIVE = :a, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :id`, { a: patch.active ? 1 : 0, id });
        // Deactivation signs the user out everywhere (refresh tokens revoked; access tokens expire within minutes).
        if (!patch.active) await conn.execute(`UPDATE REFRESH_TOKENS SET REVOKED = 1 WHERE USER_ID = :id`, { id });
      }
    });
    return AdminService.user(id);
  },

  // ── Topics & skills ──
  async topics() {
    const [cats, skills] = await Promise.all([
      query<any>(`SELECT c.CATEGORY_ID, c.NAME, c.PARENT_ID, c.ICON, c.DISPLAY_ORDER,
                    (SELECT COUNT(*) FROM QUESTIONS q WHERE q.CATEGORY_ID = c.CATEGORY_ID) AS QUESTIONS
                  FROM SKILL_CATEGORIES c ORDER BY c.DISPLAY_ORDER, c.NAME`),
      query<any>(`SELECT s.SKILL_ID, s.NAME, s.CATEGORY_ID, s.DESCRIPTION,
                    (SELECT COUNT(*) FROM QUESTION_SKILLS qs WHERE qs.SKILL_ID = s.SKILL_ID) AS QUESTIONS
                  FROM SKILLS s ORDER BY s.NAME`),
    ]);
    const skillsBy = new Map<string, any[]>();
    for (const s of skills.rows ?? []) {
      const list = skillsBy.get(s.CATEGORY_ID) ?? [];
      list.push({ id: s.SKILL_ID, name: s.NAME, description: s.DESCRIPTION ?? null, questions: num(s.QUESTIONS) });
      skillsBy.set(s.CATEGORY_ID, list);
    }
    return (cats.rows ?? []).map((c) => ({
      id: c.CATEGORY_ID, name: c.NAME, parentId: c.PARENT_ID ?? null, icon: c.ICON ?? null, order: num(c.DISPLAY_ORDER),
      questions: num(c.QUESTIONS), skills: skillsBy.get(c.CATEGORY_ID) ?? [],
    }));
  },

  async createTopic(input: { name: string; parentId?: string | null; icon?: string | null }) {
    if (input.parentId) {
      const p = await query(`SELECT 1 FROM SKILL_CATEGORIES WHERE CATEGORY_ID = :id`, { id: input.parentId });
      if (!p.rows?.length) throw badRequest('Parent topic not found');
    }
    const dup = await query(`SELECT 1 FROM SKILL_CATEGORIES WHERE LOWER(NAME) = :n`, { n: input.name.toLowerCase() });
    if (dup.rows?.length) throw conflict('A topic with this name already exists');
    const id = `cat-${slug(input.name)}-${uuidv4().slice(0, 4)}`;
    const order = await query<any>(`SELECT NVL(MAX(DISPLAY_ORDER), 0) + 1 AS N FROM SKILL_CATEGORIES WHERE ${input.parentId ? 'PARENT_ID = :p' : 'PARENT_ID IS NULL'}`, input.parentId ? { p: input.parentId } : {});
    await withTransaction((conn) => conn.execute(
      `INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, ICON, DISPLAY_ORDER) VALUES (:id, :name, :parentId, :icon, :ord)`,
      { id, name: input.name, parentId: input.parentId ?? null, icon: input.icon ?? null, ord: num(order.rows?.[0]?.N, 1) }
    ));
    invalidateContent();
    return { id, name: input.name, parentId: input.parentId ?? null };
  },

  async renameTopic(id: string, name: string) {
    const r = await withTransaction((conn) => conn.execute(`UPDATE SKILL_CATEGORIES SET NAME = :name WHERE CATEGORY_ID = :id`, { name, id }));
    if (!r.rowsAffected) throw notFound('Topic');
    invalidateContent();
  },

  async deleteTopic(id: string) {
    const r = await query<any>(`SELECT
      (SELECT COUNT(*) FROM SKILLS WHERE CATEGORY_ID = :id) AS SKILLS,
      (SELECT COUNT(*) FROM QUESTIONS WHERE CATEGORY_ID = :id) AS QUESTIONS,
      (SELECT COUNT(*) FROM SKILL_CATEGORIES WHERE PARENT_ID = :id) AS CHILDREN FROM DUAL`, { id });
    const x = r.rows?.[0];
    if (num(x?.SKILLS) || num(x?.QUESTIONS) || num(x?.CHILDREN)) throw conflict('Only empty topics can be deleted (move or remove its skills, questions and sub-topics first)');
    const d = await withTransaction((conn) => conn.execute(`DELETE FROM SKILL_CATEGORIES WHERE CATEGORY_ID = :id`, { id }));
    if (!d.rowsAffected) throw notFound('Topic');
    invalidateContent();
  },

  async createSkill(input: { categoryId: string; name: string; description?: string | null }) {
    const cat = await query(`SELECT 1 FROM SKILL_CATEGORIES WHERE CATEGORY_ID = :id`, { id: input.categoryId });
    if (!cat.rows?.length) throw badRequest('Topic not found');
    const id = `sk-${slug(input.name)}-${uuidv4().slice(0, 4)}`;
    try {
      await withTransaction((conn) => conn.execute(
        `INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME, DESCRIPTION) VALUES (:id, :categoryId, :name, :description)`,
        { id, categoryId: input.categoryId, name: input.name, description: input.description ?? null }
      ));
    } catch (err: any) {
      if (String(err.message).includes('ORA-00001')) throw conflict('This topic already has a skill with that name');
      throw err;
    }
    invalidateContent();
    return { id, name: input.name, categoryId: input.categoryId };
  },

  async deleteSkill(id: string) {
    const r = await query<any>(`SELECT
      (SELECT COUNT(*) FROM QUESTION_SKILLS WHERE SKILL_ID = :id) AS Q,
      (SELECT COUNT(*) FROM JOB_ROLE_SKILLS WHERE SKILL_ID = :id) AS R,
      (SELECT COUNT(*) FROM USER_SKILLS WHERE SKILL_ID = :id) AS U FROM DUAL`, { id });
    const x = r.rows?.[0];
    if (num(x?.Q) || num(x?.R) || num(x?.U)) throw conflict('This skill is in use by questions, role requirements or learner progress and cannot be deleted');
    const d = await withTransaction((conn) => conn.execute(`DELETE FROM SKILLS WHERE SKILL_ID = :id`, { id }));
    if (!d.rowsAffected) throw notFound('Skill');
    invalidateContent();
  },

  // ── Questions ──
  async questions(f: { search?: string; categoryId?: string; status?: string }) {
    const where = ['1 = 1'];
    const binds: Record<string, any> = {};
    if (f.search) { where.push('LOWER(q.TITLE) LIKE :s'); binds.s = `%${f.search.toLowerCase()}%`; }
    if (f.categoryId) { where.push('q.CATEGORY_ID = :c'); binds.c = f.categoryId; }
    if (f.status) { where.push('q.IS_ACTIVE = :a'); binds.a = f.status === 'active' ? 1 : 0; }
    const r = await query<any>(
      `SELECT q.QUESTION_ID, q.TITLE, q.DIFFICULTY, q.QUESTION_TYPE, q.CATEGORY_ID, c.NAME AS CATEGORY_NAME, q.IS_ACTIVE,
              q.TOTAL_ATTEMPTS, q.SOLVE_RATE, q.CREATED_BY, q.UPDATED_AT,
              (SELECT COUNT(*) FROM TEST_CASES t WHERE t.QUESTION_ID = q.QUESTION_ID) AS TESTS
       FROM QUESTIONS q JOIN SKILL_CATEGORIES c ON c.CATEGORY_ID = q.CATEGORY_ID
       WHERE ${where.join(' AND ')} ORDER BY q.CREATED_AT DESC, q.TITLE`,
      binds
    );
    return (r.rows ?? []).map((q) => ({
      id: q.QUESTION_ID, title: q.TITLE, difficulty: q.DIFFICULTY, type: q.QUESTION_TYPE, categoryId: q.CATEGORY_ID, categoryName: q.CATEGORY_NAME,
      active: !!q.IS_ACTIVE, attempts: num(q.TOTAL_ATTEMPTS), solveRate: q.SOLVE_RATE === null ? null : num(q.SOLVE_RATE),
      tests: num(q.TESTS), source: q.CREATED_BY ? 'admin' : 'bank', updatedAt: q.UPDATED_AT ? new Date(q.UPDATED_AT).toISOString() : null,
    }));
  },

  /** Full question for the editor, including hidden tests. */
  async question(id: string) {
    const q = (await query<any>(`SELECT * FROM QUESTIONS WHERE QUESTION_ID = :id`, { id })).rows?.[0];
    if (!q) throw notFound('Question');
    const [skills, tests] = await Promise.all([
      query<any>(`SELECT SKILL_ID, WEIGHT FROM QUESTION_SKILLS WHERE QUESTION_ID = :id`, { id }),
      query<any>(`SELECT INPUT_DATA, EXPECTED_OUT, IS_HIDDEN FROM TEST_CASES WHERE QUESTION_ID = :id ORDER BY DISPLAY_ORDER`, { id }),
    ]);
    const meta = parseJson<any>(q.HARNESS_META, {});
    return {
      id: q.QUESTION_ID, title: q.TITLE, description: q.DESCRIPTION, difficulty: q.DIFFICULTY, categoryId: q.CATEGORY_ID, type: q.QUESTION_TYPE,
      tags: String(q.TAGS ?? '').split(',').filter(Boolean), hints: parseJson<string[]>(q.HINTS, []), constraints: q.CONSTRAINTS_TXT ?? null,
      timeLimitMs: num(q.TIME_LIMIT_MS, 2000), active: !!q.IS_ACTIVE,
      reference: q.REFERENCE_CODE ? { language: q.REFERENCE_LANG, code: q.REFERENCE_CODE } : null,
      skills: (skills.rows ?? []).map((s) => ({ skillId: s.SKILL_ID, weight: num(s.WEIGHT, 1) })),
      code: q.QUESTION_TYPE === 'CODE' ? meta : undefined,
      sql: q.QUESTION_TYPE === 'SQL' ? meta : undefined,
      tests: (tests.rows ?? []).map((t) => ({ args: parseJson(t.INPUT_DATA, null) ?? undefined, expected: parseJson(t.EXPECTED_OUT, null), hidden: !!t.IS_HIDDEN })),
    };
  },

  /** Run the reference solution against every test. Questions only save when this passes. */
  async validate(q: QuestionInput): Promise<ExecutionResult> {
    const def = toDefinition('validate', q);
    return getRunner({ pythonBin: env.PYTHON_BIN, maxConcurrency: env.EXEC_MAX_CONCURRENCY }).run({
      language: q.reference.language as Language,
      code: q.reference.code,
      tests: def.tests.map((t, i) => ({ id: `t${i + 1}`, args: t.args, expected: t.expected, hidden: false })),
      timeLimitMs: q.timeLimitMs,
      code_meta: def.code,
      sql_meta: def.sql,
    });
  },

  async saveQuestion(actorId: string, input: QuestionInput, id?: string) {
    await assertRefs(input);
    if (id) {
      const exists = await query(`SELECT 1 FROM QUESTIONS WHERE QUESTION_ID = :id`, { id });
      if (!exists.rows?.length) throw notFound('Question');
    }
    const result = await AdminService.validate(input);
    if (result.verdict !== 'ACCEPTED') {
      throw badRequest('The reference solution does not pass every test — fix the tests or the solution before saving', {
        verdict: result.verdict, compileError: result.compileError ?? null,
        failures: result.cases.filter((c) => c.status !== 'PASS').map((c) => ({ test: c.caseId, status: c.status, expected: c.expected, actual: c.actual, error: c.error })),
      });
    }
    const qid = id ?? `q-${uuidv4().slice(0, 8)}`;
    await withTransaction(async (conn) => {
      await upsertQuestion(conn, toDefinition(qid, input), actorId);
      if (!id) await conn.execute(`UPDATE QUESTIONS SET UPDATED_AT = NULL WHERE QUESTION_ID = :id`, { id: qid });
    });
    invalidateContent();
    return { id: qid, validation: { passed: result.passed, total: result.total, executionTimeMs: result.executionTimeMs } };
  },

  /** Bulk import: each question is validated independently; valid ones are saved. */
  async importQuestions(actorId: string, items: unknown[]) {
    const results: Array<{ index: number; title: string | null; ok: boolean; id?: string; error?: string }> = [];
    for (const [index, raw] of items.entries()) {
      const title = typeof (raw as any)?.title === 'string' ? (raw as any).title : null;
      const parsed = questionInput.safeParse(raw);
      if (!parsed.success) {
        results.push({ index, title, ok: false, error: parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
        continue;
      }
      try {
        const saved = await AdminService.saveQuestion(actorId, parsed.data);
        results.push({ index, title, ok: true, id: saved.id });
      } catch (err: any) {
        const failures = err?.details?.failures as Array<{ test: string; status: string }> | undefined;
        results.push({ index, title, ok: false, error: err.message + (failures?.length ? ` (${failures.map((f) => `${f.test}: ${f.status}`).join(', ')})` : '') });
      }
    }
    return { imported: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
  },

  async setQuestionActive(id: string, active: boolean) {
    const r = await withTransaction((conn) => conn.execute(`UPDATE QUESTIONS SET IS_ACTIVE = :a, UPDATED_AT = CURRENT_TIMESTAMP WHERE QUESTION_ID = :id`, { a: active ? 1 : 0, id }));
    if (!r.rowsAffected) throw notFound('Question');
    invalidateContent();
  },
};

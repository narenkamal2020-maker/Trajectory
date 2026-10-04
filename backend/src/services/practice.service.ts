import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { query, withTransaction } from '../config/oracle';
import { cache } from '../lib/cache';
import { enqueue } from '../lib/jobs';
import { badRequest, notFound } from '../lib/http';
import { num, parseJson, round } from '../lib/util';
import { getRunner, type CodeMeta, type ExecutionResult, type Language, type SqlMeta, type TestCaseInput } from '../engine/executor';
import type { Difficulty } from '../engine/skills';
import { CatalogService } from './catalog.service';
import { SkillService, type SkillDelta } from './skill.service';
import { logMlEvent } from '../ml/events';
import { AnalyticsService } from './analytics.service';
import { difficultyCode } from '../ml/client';

const runner = () => getRunner({ pythonBin: env.PYTHON_BIN, maxConcurrency: env.EXEC_MAX_CONCURRENCY });

interface LoadedQuestion {
  id: string; title: string; difficulty: Difficulty; type: 'CODE' | 'SQL'; timeLimitMs: number;
  meta: CodeMeta | SqlMeta; tests: TestCaseInput[]; solveRate: number | null;
}

async function loadQuestion(questionId: string): Promise<LoadedQuestion> {
  return cache.wrap(`question:${questionId}`, 5 * 60 * 1000, async () => {
    const q = await query<any>(
      `SELECT QUESTION_ID, TITLE, DIFFICULTY, QUESTION_TYPE, TIME_LIMIT_MS, HARNESS_META, SOLVE_RATE FROM QUESTIONS WHERE QUESTION_ID = :questionId AND IS_ACTIVE = 1`,
      { questionId }
    );
    const row = q.rows?.[0];
    if (!row) throw notFound('Question');
    const tc = await query<any>(
      `SELECT TEST_CASE_ID, INPUT_DATA, EXPECTED_OUT, IS_HIDDEN FROM TEST_CASES WHERE QUESTION_ID = :questionId ORDER BY DISPLAY_ORDER`,
      { questionId }
    );
    return {
      id: row.QUESTION_ID, title: row.TITLE, difficulty: row.DIFFICULTY, type: row.QUESTION_TYPE,
      timeLimitMs: num(row.TIME_LIMIT_MS, 2000), meta: parseJson(row.HARNESS_META, {} as CodeMeta),
      solveRate: row.SOLVE_RATE === null ? null : num(row.SOLVE_RATE) / 100,
      tests: (tc.rows ?? []).map((t) => ({
        id: t.TEST_CASE_ID, args: parseJson(t.INPUT_DATA, null) ?? undefined, expected: parseJson(t.EXPECTED_OUT, null), hidden: !!t.IS_HIDDEN,
      })),
    };
  });
}

function validateLanguage(q: LoadedQuestion, language: Language) {
  if (q.type === 'SQL' && language !== 'sql') throw badRequest('This is a SQL question — submit SQL');
  if (q.type === 'CODE' && language === 'sql') throw badRequest('Choose JavaScript or Python for this question');
}

async function execute(q: LoadedQuestion, language: Language, code: string, tests: TestCaseInput[]): Promise<ExecutionResult> {
  if (code.length > 50_000) throw badRequest('Code too long (50 KB max)');
  return runner().run({
    language, code, tests, timeLimitMs: q.timeLimitMs,
    code_meta: q.type === 'CODE' ? (q.meta as CodeMeta) : undefined,
    sql_meta: q.type === 'SQL' ? (q.meta as SqlMeta) : undefined,
  });
}

/** Features describing the learner *before* the attempt (no label leakage). */
async function solveFeatures(userId: string, questionId: string, difficulty: Difficulty, solveRate: number | null) {
  const [links, skills, prior] = await Promise.all([
    CatalogService.questionSkills(questionId),
    SkillService.rows(userId),
    query<any>(`SELECT COUNT(*) AS N FROM SUBMISSIONS WHERE USER_ID = :userId AND QUESTION_ID = :questionId`, { userId, questionId }),
  ]);
  const byId = new Map(skills.map((s) => [s.skillId, s]));
  const totalW = links.reduce((n, l) => n + l.weight, 0) || 1;
  const profs = links.map((l) => byId.get(l.skillId)?.proficiency ?? 0);
  const last = links.map((l) => byId.get(l.skillId)?.lastPracticed?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0);
  return {
    proficiency: round(links.reduce((n, l) => n + (byId.get(l.skillId)?.proficiency ?? 0) * l.weight, 0) / totalW, 2),
    min_proficiency: profs.length ? Math.min(...profs) : 0,
    difficulty: difficultyCode(difficulty),
    attempts_on_skill: links.reduce((n, l) => n + (byId.get(l.skillId)?.attempts ?? 0), 0),
    prior_attempts_on_question: num(prior.rows?.[0]?.N),
    solve_rate: solveRate ?? 0.5,
    days_since_practice: last ? round((Date.now() - last) / 86400_000, 2) : 365,
  };
}

export interface SubmitOptions { usedHint?: boolean; timeTakenSec?: number; clientSubmissionId?: string; sessionId?: string }

export const PracticeService = {
  async list(userId: string, f: { difficulty?: string; categoryId?: string; skillId?: string; status?: string; search?: string; type?: string }) {
    const [index, status] = await Promise.all([
      CatalogService.questionIndex(),
      query<any>(
        `SELECT QUESTION_ID, MAX(CASE WHEN STATUS = 'ACCEPTED' THEN 1 ELSE 0 END) AS SOLVED, COUNT(*) AS ATTEMPTS
         FROM SUBMISSIONS WHERE USER_ID = :userId GROUP BY QUESTION_ID`,
        { userId }
      ),
    ]);
    const mine = new Map((status.rows ?? []).map((r) => [r.QUESTION_ID, { solved: !!num(r.SOLVED), attempts: num(r.ATTEMPTS) }]));
    const search = f.search?.toLowerCase();
    const items = index
      .map((q) => {
        const m = mine.get(q.id);
        return { ...q, status: m?.solved ? 'solved' : m ? 'attempted' : 'todo', myAttempts: m?.attempts ?? 0 };
      })
      .filter((q) =>
        (!f.difficulty || q.difficulty === f.difficulty) &&
        (!f.categoryId || q.categoryId === f.categoryId) &&
        (!f.skillId || q.skillIds.includes(f.skillId)) &&
        (!f.status || q.status === f.status) &&
        (!f.type || q.type === f.type) &&
        (!search || q.title.toLowerCase().includes(search) || q.tags.some((t) => t.includes(search)))
      );
    return {
      items,
      counts: {
        total: index.length,
        solved: items.filter((q) => q.status === 'solved').length,
        byDifficulty: { EASY: items.filter((q) => q.difficulty === 'EASY').length, MEDIUM: items.filter((q) => q.difficulty === 'MEDIUM').length, HARD: items.filter((q) => q.difficulty === 'HARD').length },
      },
    };
  },

  async detail(userId: string, questionId: string) {
    const r = await query<any>(
      `SELECT q.*, c.NAME AS CATEGORY_NAME FROM QUESTIONS q JOIN SKILL_CATEGORIES c ON c.CATEGORY_ID = q.CATEGORY_ID
       WHERE q.QUESTION_ID = :questionId AND q.IS_ACTIVE = 1`,
      { questionId }
    );
    const q = r.rows?.[0];
    if (!q) throw notFound('Question');
    const [loaded, links, catalog, subs] = await Promise.all([
      loadQuestion(questionId),
      CatalogService.questionSkills(questionId),
      CatalogService.skillMap(),
      query<any>(
        `SELECT SUBMISSION_ID, LANGUAGE, STATUS, TESTS_PASSED, TESTS_TOTAL, SUBMITTED_AT FROM SUBMISSIONS
         WHERE USER_ID = :userId AND QUESTION_ID = :questionId ORDER BY SUBMITTED_AT DESC FETCH FIRST 10 ROWS ONLY`,
        { userId, questionId }
      ),
    ]);
    const meta = loaded.meta as CodeMeta;
    return {
      id: q.QUESTION_ID,
      title: q.TITLE,
      description: q.DESCRIPTION,
      difficulty: q.DIFFICULTY,
      type: q.QUESTION_TYPE,
      categoryId: q.CATEGORY_ID,
      categoryName: q.CATEGORY_NAME,
      tags: String(q.TAGS ?? '').split(',').filter(Boolean),
      constraints: q.CONSTRAINTS_TXT ?? null,
      examples: parseJson(q.EXAMPLES, []),
      hints: parseJson<string[]>(q.HINTS, []),
      timeLimitMs: num(q.TIME_LIMIT_MS),
      solveRate: q.SOLVE_RATE === null ? null : num(q.SOLVE_RATE),
      totalAttempts: num(q.TOTAL_ATTEMPTS),
      starterCode: parseJson<Record<string, string>>(q.STARTER_CODE, {}),
      languages: q.QUESTION_TYPE === 'SQL' ? ['sql'] : ['javascript', 'python'],
      signature: q.QUESTION_TYPE === 'CODE' ? { functionName: meta.functionName, params: meta.params, returnType: meta.returnType } : null,
      schema: q.QUESTION_TYPE === 'SQL' ? (loaded.meta as SqlMeta).setup : null,
      skills: links.map((l) => ({ id: l.skillId, name: catalog.get(l.skillId)?.name ?? l.skillId, weight: l.weight })),
      sampleTests: loaded.tests.filter((t) => !t.hidden).map((t) => ({ id: t.id, args: t.args ?? null, expected: t.expected })),
      hiddenTestCount: loaded.tests.filter((t) => t.hidden).length,
      mySubmissions: (subs.rows ?? []).map((s) => ({
        id: s.SUBMISSION_ID, language: s.LANGUAGE, status: s.STATUS, passed: num(s.TESTS_PASSED), total: num(s.TESTS_TOTAL),
        submittedAt: new Date(s.SUBMITTED_AT).toISOString(),
      })),
    };
  },

  /** Package the public half of a question for offline use (desktop/PWA). Hidden tests stay server-side. */
  async offlineBundle() {
    const index = await CatalogService.questionIndex();
    const items = await Promise.all(index.map(async (q) => {
      const r = await query<any>(`SELECT DESCRIPTION, HINTS, EXAMPLES, STARTER_CODE, CONSTRAINTS_TXT FROM QUESTIONS WHERE QUESTION_ID = :id`, { id: q.id });
      const row = r.rows?.[0] ?? {};
      const loaded = await loadQuestion(q.id);
      return {
        ...q,
        description: row.DESCRIPTION,
        constraints: row.CONSTRAINTS_TXT ?? null,
        hints: parseJson(row.HINTS, []),
        examples: parseJson(row.EXAMPLES, []),
        starterCode: parseJson(row.STARTER_CODE, {}),
        timeLimitMs: loaded.timeLimitMs,
        meta: loaded.meta,
        sampleTests: loaded.tests.filter((t) => !t.hidden),
        hiddenTestCount: loaded.tests.filter((t) => t.hidden).length,
      };
    }));
    return { version: new Date().toISOString(), questions: items };
  },

  /** Run against sample tests (plus optional custom inputs whose expected value is unknown). */
  async run(questionId: string, language: Language, code: string) {
    const q = await loadQuestion(questionId);
    validateLanguage(q, language);
    return execute(q, language, code, q.tests.filter((t) => !t.hidden));
  },

  async submit(userId: string, questionId: string, language: Language, code: string, opts: SubmitOptions = {}) {
    if (opts.clientSubmissionId) {
      const dup = await query<any>(
        `SELECT SUBMISSION_ID, STATUS, TESTS_PASSED, TESTS_TOTAL FROM SUBMISSIONS WHERE USER_ID = :userId AND CLIENT_SUBMISSION_ID = :cid`,
        { userId, cid: opts.clientSubmissionId }
      );
      const d = dup.rows?.[0];
      if (d) return { duplicate: true, submissionId: d.SUBMISSION_ID, verdict: d.STATUS, passed: num(d.TESTS_PASSED), total: num(d.TESTS_TOTAL) };
    }

    const q = await loadQuestion(questionId);
    validateLanguage(q, language);
    const [features, solvedBefore] = await Promise.all([
      solveFeatures(userId, questionId, q.difficulty, q.solveRate),
      query<any>(`SELECT COUNT(*) AS N FROM SUBMISSIONS WHERE USER_ID = :userId AND QUESTION_ID = :questionId AND STATUS = 'ACCEPTED'`, { userId, questionId }),
    ]);
    const alreadySolved = num(solvedBefore.rows?.[0]?.N) > 0;
    const result = await execute(q, language, code, q.tests);
    const score = result.total ? result.passed / result.total : 0;
    const submissionId = uuidv4();
    const usedHint = !!opts.usedHint;

    let skillDeltas: SkillDelta[] = [];
    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO SUBMISSIONS (SUBMISSION_ID, USER_ID, QUESTION_ID, SESSION_ID, CODE, LANGUAGE, STATUS, SCORE, TIME_TAKEN_SEC,
           TESTS_PASSED, TESTS_TOTAL, USED_HINT, AI_FEEDBACK, CLIENT_SUBMISSION_ID)
         VALUES (:id, :userId, :questionId, :sessionId, :code, :language, :status, :score, :timeTaken, :passed, :total, :usedHint, :feedback, :cid)`,
        {
          id: submissionId, userId, questionId, sessionId: opts.sessionId ?? null,
          code: { val: code, type: oracledb.CLOB }, language, status: result.verdict, score: round(score * 100, 2),
          timeTaken: opts.timeTakenSec ?? null, passed: result.passed, total: result.total, usedHint: usedHint ? 1 : 0,
          feedback: { val: JSON.stringify({ executionTimeMs: result.executionTimeMs, compileError: result.compileError ?? null }), type: oracledb.CLOB },
          cid: opts.clientSubmissionId ?? null,
        }
      );
      skillDeltas = await SkillService.applyAttempt(conn, userId, { questionId, difficulty: q.difficulty, score, usedHint, alreadySolved });
      await conn.execute(
        `UPDATE QUESTIONS SET TOTAL_ATTEMPTS = TOTAL_ATTEMPTS + 1,
           SOLVE_RATE = (SELECT ROUND(100 * COUNT(CASE WHEN STATUS = 'ACCEPTED' THEN 1 END) / COUNT(*), 2) FROM SUBMISSIONS WHERE QUESTION_ID = :questionId),
           AVG_TIME_SEC = (SELECT ROUND(AVG(TIME_TAKEN_SEC), 2) FROM SUBMISSIONS WHERE QUESTION_ID = :questionId AND STATUS = 'ACCEPTED' AND TIME_TAKEN_SEC IS NOT NULL)
         WHERE QUESTION_ID = :questionId`,
        { questionId }
      );
    });

    await logMlEvent(userId, 'SUBMISSION', questionId, { ...features, used_hint: usedHint ? 1 : 0, language }, result.verdict === 'ACCEPTED' ? 1 : 0);
    cache.invalidateUser(userId);
    cache.invalidatePrefix('catalog:questions');
    cache.invalidatePrefix(`question:${questionId}`);
    enqueue(`snapshot:${userId}`, () => AnalyticsService.refreshSnapshot(userId));

    return {
      submissionId,
      firstSolve: result.verdict === 'ACCEPTED' && !alreadySolved,
      ...result,
      skillDeltas,
    };
  },

  /** Replay offline submissions. Each is re-graded server-side; duplicates are ignored. */
  async sync(userId: string, items: Array<{ clientSubmissionId: string; questionId: string; language: Language; code: string; usedHint?: boolean; timeTakenSec?: number }>) {
    const results = [];
    for (const it of items.slice(0, 50)) {
      try {
        const r = await PracticeService.submit(userId, it.questionId, it.language, it.code, it);
        results.push({ clientSubmissionId: it.clientSubmissionId, ok: true, verdict: (r as any).verdict, duplicate: !!(r as any).duplicate });
      } catch (err: any) {
        results.push({ clientSubmissionId: it.clientSubmissionId, ok: false, error: err.message });
      }
    }
    return { results };
  },

  async history(userId: string, limit = 30) {
    const r = await query<any>(
      `SELECT s.SUBMISSION_ID, s.QUESTION_ID, q.TITLE, q.DIFFICULTY, s.LANGUAGE, s.STATUS, s.TESTS_PASSED, s.TESTS_TOTAL, s.SUBMITTED_AT
       FROM SUBMISSIONS s JOIN QUESTIONS q ON q.QUESTION_ID = s.QUESTION_ID
       WHERE s.USER_ID = :userId ORDER BY s.SUBMITTED_AT DESC FETCH FIRST :lim ROWS ONLY`,
      { userId, lim: Math.min(100, limit) }
    );
    return (r.rows ?? []).map((s) => ({
      id: s.SUBMISSION_ID, questionId: s.QUESTION_ID, title: s.TITLE, difficulty: s.DIFFICULTY, language: s.LANGUAGE,
      status: s.STATUS, passed: num(s.TESTS_PASSED), total: num(s.TESTS_TOTAL), submittedAt: new Date(s.SUBMITTED_AT).toISOString(),
    }));
  },

  async submissionDetail(userId: string, submissionId: string) {
    const r = await query<any>(`SELECT * FROM SUBMISSIONS WHERE SUBMISSION_ID = :submissionId AND USER_ID = :userId`, { submissionId, userId });
    const s = r.rows?.[0];
    if (!s) throw notFound('Submission');
    return {
      id: s.SUBMISSION_ID, questionId: s.QUESTION_ID, language: s.LANGUAGE, code: s.CODE, status: s.STATUS,
      passed: num(s.TESTS_PASSED), total: num(s.TESTS_TOTAL), submittedAt: new Date(s.SUBMITTED_AT).toISOString(),
    };
  },
};

import { query } from '../config/oracle';
import { cache, userKey } from '../lib/cache';
import { computeStreak, dayKey, num, parseJson, round } from '../lib/util';
import { SnapshotRepository } from '../db/repositories/snapshot.repository';
import { ApplicationRepository } from '../db/repositories/application.repository';
import { TrajectoryService } from './trajectory.service';
import { CatalogService } from './catalog.service';

async function activeDays(userId: string): Promise<Map<string, { submissions: number; accepted: number }>> {
  const r = await query<any>(
    `SELECT TO_CHAR(SUBMITTED_AT, 'YYYY-MM-DD') AS D, COUNT(*) AS N, COUNT(CASE WHEN STATUS = 'ACCEPTED' THEN 1 END) AS A
     FROM SUBMISSIONS WHERE USER_ID = :userId AND SUBMITTED_AT >= SYSTIMESTAMP - INTERVAL '365' DAY(3)
     GROUP BY TO_CHAR(SUBMITTED_AT, 'YYYY-MM-DD')`,
    { userId }
  );
  return new Map((r.rows ?? []).map((x) => [x.D as string, { submissions: num(x.N), accepted: num(x.A) }]));
}

function longestStreak(days: string[]): number {
  const sorted = [...days].sort();
  let best = 0, cur = 0, prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(d);
    cur = prev !== null && t - prev === 86400_000 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = t;
  }
  return best;
}

export const AnalyticsService = {
  async totals(userId: string) {
    const [r, days] = await Promise.all([
      query<any>(
        `SELECT COUNT(*) AS TOTAL, COUNT(CASE WHEN STATUS = 'ACCEPTED' THEN 1 END) AS ACCEPTED,
                COUNT(DISTINCT CASE WHEN STATUS = 'ACCEPTED' THEN QUESTION_ID END) AS SOLVED,
                AVG(CASE WHEN STATUS = 'ACCEPTED' THEN TIME_TAKEN_SEC END) AS AVG_SOLVE_SEC
         FROM SUBMISSIONS WHERE USER_ID = :userId`,
        { userId }
      ),
      activeDays(userId),
    ]);
    const row = r.rows?.[0] ?? {};
    const total = num(row.TOTAL), accepted = num(row.ACCEPTED);
    return {
      submissions: total,
      accepted,
      solved: num(row.SOLVED),
      accuracy: total ? round((accepted / total) * 100) : 0,
      avgSolveSeconds: row.AVG_SOLVE_SEC === null ? null : round(num(row.AVG_SOLVE_SEC)),
      streakDays: computeStreak(days.keys()),
      longestStreak: longestStreak([...days.keys()]),
      activeDays: days,
    };
  },

  /** Persist today's rollup — called after each submission/interview (via the job queue). */
  async refreshSnapshot(userId: string, date = new Date()): Promise<void> {
    const [t, ready] = await Promise.all([AnalyticsService.totals(userId), TrajectoryService.readiness(userId)]);
    const avgProf = ready.proficiency.size ? [...ready.proficiency.values()].reduce((a, b) => a + b, 0) / ready.proficiency.size : 0;
    await SnapshotRepository.upsert({
      userId,
      snapshotDate: dayKey(date),
      questionsDone: t.solved,
      accuracy: t.accuracy,
      streakDays: t.streakDays,
      overallScore: ready.readiness,
      skillsJson: { readiness: ready.readiness, remainingGap: ready.remainingGap, avgProficiency: round(avgProf), roleId: ready.role?.id ?? null },
    });
    cache.invalidateUser(userId);
  },

  async overview(userId: string, days = 30) {
    return cache.wrap(userKey(userId, `analytics:${days}`), 60_000, async () => {
      const [totals, snaps, cat, diff, lang, interviews, pipeline, categories] = await Promise.all([
        AnalyticsService.totals(userId),
        SnapshotRepository.getHistory(userId, days),
        query<any>(
          `SELECT NVL(pc.CATEGORY_ID, c.CATEGORY_ID) AS CAT_ID, NVL(pc.NAME, c.NAME) AS CAT_NAME,
                  ROUND(AVG(us.PROFICIENCY), 1) AS AVG_PROF, COUNT(*) AS SKILLS
           FROM USER_SKILLS us JOIN SKILLS s ON s.SKILL_ID = us.SKILL_ID
           JOIN SKILL_CATEGORIES c ON c.CATEGORY_ID = s.CATEGORY_ID
           LEFT JOIN SKILL_CATEGORIES pc ON pc.CATEGORY_ID = c.PARENT_ID
           WHERE us.USER_ID = :userId
           GROUP BY NVL(pc.CATEGORY_ID, c.CATEGORY_ID), NVL(pc.NAME, c.NAME) ORDER BY AVG_PROF DESC`,
          { userId }
        ),
        query<any>(
          `SELECT q.DIFFICULTY, COUNT(DISTINCT s.QUESTION_ID) AS ATTEMPTED,
                  COUNT(DISTINCT CASE WHEN s.STATUS = 'ACCEPTED' THEN s.QUESTION_ID END) AS SOLVED
           FROM SUBMISSIONS s JOIN QUESTIONS q ON q.QUESTION_ID = s.QUESTION_ID WHERE s.USER_ID = :userId GROUP BY q.DIFFICULTY`,
          { userId }
        ),
        query<any>(`SELECT LANGUAGE, COUNT(*) AS N FROM SUBMISSIONS WHERE USER_ID = :userId GROUP BY LANGUAGE`, { userId }),
        query<any>(
          `SELECT INTERVIEW_ID, INTERVIEW_TYPE, OVERALL_SCORE, COMMUNICATION_SCR, TECHNICAL_SCR, PROBLEM_SOLVING_SCR, COMPLETED_AT
           FROM INTERVIEWS WHERE USER_ID = :userId AND STATUS = 'COMPLETED' ORDER BY COMPLETED_AT`,
          { userId }
        ),
        ApplicationRepository.getStageMetrics(userId),
        CatalogService.questionIndex(),
      ]);

      // Activity heatmap for the last 90 days (zero-filled).
      const heatmap: Array<{ date: string; submissions: number; accepted: number }> = [];
      const today = new Date();
      for (let i = 89; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        const k = dayKey(d);
        heatmap.push({ date: k, ...(totals.activeDays.get(k) ?? { submissions: 0, accepted: 0 }) });
      }

      const totalsByDiff = { EASY: 0, MEDIUM: 0, HARD: 0 } as Record<string, number>;
      categories.forEach((q) => { totalsByDiff[q.difficulty]++; });
      const s = pipeline.applicationsByStage;
      const reachedOA = s.OA + s.INTERVIEW + s.OFFER + s.HIRED;
      const reachedInterview = s.INTERVIEW + s.OFFER + s.HIRED;
      const reachedOffer = s.OFFER + s.HIRED;
      const pct = (a: number, b: number) => (b ? round((a / b) * 100) : 0);

      const { activeDays: _omit, ...totalsOut } = totals;
      return {
        totals: totalsOut,
        timeline: snaps.map((x) => ({
          date: dayKey(new Date(x.SNAPSHOT_DATE)),
          solved: num(x.QUESTIONS_DONE),
          accuracy: x.ACCURACY === null ? null : num(x.ACCURACY),
          readiness: x.OVERALL_SCORE === null ? null : num(x.OVERALL_SCORE),
          avgProficiency: num(parseJson<any>(x.SKILLS_JSON, {}).avgProficiency, 0),
        })),
        heatmap,
        byCategory: (cat.rows ?? []).map((x) => ({ categoryId: x.CAT_ID, name: x.CAT_NAME, avgProficiency: num(x.AVG_PROF), skills: num(x.SKILLS) })),
        byDifficulty: ['EASY', 'MEDIUM', 'HARD'].map((d) => {
          const row = (diff.rows ?? []).find((x) => x.DIFFICULTY === d);
          return { difficulty: d, solved: num(row?.SOLVED), attempted: num(row?.ATTEMPTED), available: totalsByDiff[d] };
        }),
        languages: (lang.rows ?? []).map((x) => ({ language: x.LANGUAGE, submissions: num(x.N) })),
        interviews: (interviews.rows ?? []).map((x) => ({
          id: x.INTERVIEW_ID, type: x.INTERVIEW_TYPE, overall: num(x.OVERALL_SCORE), communication: num(x.COMMUNICATION_SCR),
          technical: num(x.TECHNICAL_SCR), problemSolving: num(x.PROBLEM_SOLVING_SCR), completedAt: new Date(x.COMPLETED_AT).toISOString(),
        })),
        pipeline: {
          ...pipeline,
          funnel: [
            { stage: 'Applied', count: pipeline.totalApplications, rate: 100 },
            { stage: 'Online assessment', count: reachedOA, rate: pct(reachedOA, pipeline.totalApplications) },
            { stage: 'Interview', count: reachedInterview, rate: pct(reachedInterview, pipeline.totalApplications) },
            { stage: 'Offer', count: reachedOffer, rate: pct(reachedOffer, pipeline.totalApplications) },
          ],
        },
      };
    });
  },
};

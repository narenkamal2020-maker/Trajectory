import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/oracle';
import { cache, userKey } from '../lib/cache';
import { num, parseJson } from '../lib/util';
import { generateRecommendations, type Recommendation } from '../engine/recommendations';
import { CatalogService } from './catalog.service';
import { SkillService } from './skill.service';
import { TrajectoryService } from './trajectory.service';
import { mlClient, difficultyCode, type SolveFeatures } from '../ml/client';
import { logMlEvent } from '../ml/events';
import { INTERVIEW_BANK } from '../engine/interview-bank';

// Skill → interview type that exercises it most often (first match in bank order).
const INTERVIEW_FOR_SKILL = new Map<string, string>();
for (const q of INTERVIEW_BANK) for (const s of q.skillIds) if (!INTERVIEW_FOR_SKILL.has(s)) INTERVIEW_FOR_SKILL.set(s, q.type);

export interface StoredRecommendation extends Recommendation { id: string; createdAt: string }

async function buildContext(userId: string) {
  const [ready, skillRows, catalog, index, subs, interviews, resume, apps] = await Promise.all([
    TrajectoryService.readiness(userId),
    SkillService.rows(userId),
    CatalogService.skillMap(),
    CatalogService.questionIndex(),
    query<any>(
      `SELECT QUESTION_ID, MAX(CASE WHEN STATUS = 'ACCEPTED' THEN 1 ELSE 0 END) AS SOLVED, COUNT(*) AS N FROM SUBMISSIONS WHERE USER_ID = :userId GROUP BY QUESTION_ID`,
      { userId }
    ),
    query<any>(`SELECT INTERVIEW_TYPE, OVERALL_SCORE, COMMUNICATION_SCR, TECHNICAL_SCR, COMPLETED_AT FROM INTERVIEWS WHERE USER_ID = :userId AND STATUS = 'COMPLETED'`, { userId }),
    query<any>(`SELECT ATS_SCORE, ANALYSIS_STATUS, DETECTED_GAPS FROM RESUMES WHERE USER_ID = :userId ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`, { userId }),
    query<any>(`SELECT COUNT(*) AS N FROM APPLICATIONS WHERE USER_ID = :userId`, { userId }),
  ]);
  const subMap = new Map((subs.rows ?? []).map((r) => [r.QUESTION_ID, { solved: !!num(r.SOLVED), attempts: num(r.N) }]));
  const skills = new Map(skillRows.map((s) => [s.skillId, { proficiency: s.proficiency, attempts: s.attempts, lastPracticed: s.lastPracticed, name: catalog.get(s.skillId)?.name ?? s.skillId }]));
  const questions = index.map((q) => ({
    id: q.id, title: q.title, difficulty: q.difficulty, skillIds: q.skillIds,
    solved: subMap.get(q.id)?.solved ?? false, attempted: subMap.has(q.id),
  }));

  // ML: score every unsolved question in one batch. Null → rules only.
  const unsolved = index.filter((q) => !subMap.get(q.id)?.solved);
  const rows: SolveFeatures[] = unsolved.map((q) => {
    const profs = q.skillIds.map((id) => skills.get(id)?.proficiency ?? 0);
    const last = q.skillIds.map((id) => skills.get(id)?.lastPracticed?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0);
    return {
      proficiency: profs.length ? profs.reduce((a, b) => a + b, 0) / profs.length : 0,
      min_proficiency: profs.length ? Math.min(...profs) : 0,
      difficulty: difficultyCode(q.difficulty),
      attempts_on_skill: q.skillIds.reduce((n, id) => n + (skills.get(id)?.attempts ?? 0), 0),
      prior_attempts_on_question: subMap.get(q.id)?.attempts ?? 0,
      solve_rate: q.solveRate === null ? 0.5 : q.solveRate / 100,
      days_since_practice: last ? (Date.now() - last) / 86400_000 : 365,
    };
  });
  const probs = await mlClient.solveProbabilities(rows);
  const probMap = probs ? new Map(unsolved.map((q, i) => [q.id, probs[i]])) : null;

  const res = resume.rows?.[0];
  return {
    now: new Date(),
    targetRole: ready.role?.title ?? null,
    roleRequirements: ready.role?.requirements ?? [],
    skills,
    questions,
    interviews: (interviews.rows ?? []).map((i) => ({
      type: i.INTERVIEW_TYPE, overall: i.OVERALL_SCORE === null ? null : num(i.OVERALL_SCORE),
      communication: i.COMMUNICATION_SCR === null ? null : num(i.COMMUNICATION_SCR),
      technical: i.TECHNICAL_SCR === null ? null : num(i.TECHNICAL_SCR),
      completedAt: i.COMPLETED_AT ? new Date(i.COMPLETED_AT) : null,
    })),
    resume: res ? { atsScore: res.ATS_SCORE === null ? null : num(res.ATS_SCORE), status: res.ANALYSIS_STATUS, gaps: parseJson<string[]>(res.DETECTED_GAPS, []) } : null,
    readiness: ready.readiness,
    applicationsCount: num(apps.rows?.[0]?.N),
    solveProbability: probMap ? (id: string) => probMap.get(id) : undefined,
    interviewForSkill: (skillId: string) => INTERVIEW_FOR_SKILL.get(skillId),
    mlActive: !!probMap,
  };
}

export const RecommendationService = {
  /** Current recommendations (regenerated at most once a minute per user). */
  async list(userId: string, limit = 8): Promise<{ items: StoredRecommendation[]; engine: 'rules' | 'rules+ml' }> {
    return cache.wrap(userKey(userId, `recs:${limit}`), 60_000, async () => {
      const ctx = await buildContext(userId);
      const dismissed = await query<any>(
        `SELECT REC_TYPE, ENTITY_ID FROM RECOMMENDATIONS WHERE USER_ID = :userId AND IS_DISMISSED = 1 AND CREATED_AT > SYSTIMESTAMP - INTERVAL '7' DAY`,
        { userId }
      );
      const hidden = new Set((dismissed.rows ?? []).map((d) => `${d.REC_TYPE}:${d.ENTITY_ID ?? ''}`));
      const recs = generateRecommendations(ctx, limit + hidden.size).filter((r) => !hidden.has(`${r.type}:${r.entityId ?? ''}`)).slice(0, limit);

      // Persist the active set so dismissals and click-through can be tracked.
      const stored: StoredRecommendation[] = [];
      await withTransaction(async (conn) => {
        await conn.execute(`DELETE FROM RECOMMENDATIONS WHERE USER_ID = :userId AND IS_DISMISSED = 0`, { userId });
        for (const r of recs) {
          const id = uuidv4();
          await conn.execute(
            `INSERT INTO RECOMMENDATIONS (REC_ID, USER_ID, REC_TYPE, ENTITY_ID, TITLE, REASON, SCORE, EXPIRES_AT)
             VALUES (:id, :userId, :type, :entityId, :title, :reason, :score, SYSTIMESTAMP + INTERVAL '1' DAY)`,
            { id, userId, type: r.type, entityId: r.entityId, title: r.title.slice(0, 500), reason: r.reason.slice(0, 1000), score: Math.min(0.9999, r.score) }
          );
          stored.push({ ...r, id, createdAt: new Date().toISOString() });
        }
      });
      return { items: stored, engine: ctx.mlActive ? 'rules+ml' : 'rules' };
    });
  },

  async dismiss(userId: string, recId: string): Promise<void> {
    await withTransaction((conn) => conn.execute(`UPDATE RECOMMENDATIONS SET IS_DISMISSED = 1 WHERE REC_ID = :recId AND USER_ID = :userId`, { recId, userId }));
    cache.invalidatePrefix(userKey(userId, 'recs'));
  },

  async recordClick(userId: string, recId: string): Promise<void> {
    const r = await query<any>(`SELECT REC_TYPE, ENTITY_ID, SCORE FROM RECOMMENDATIONS WHERE REC_ID = :recId AND USER_ID = :userId`, { recId, userId });
    const rec = r.rows?.[0];
    if (rec) await logMlEvent(userId, 'RECOMMENDATION_CLICK', recId, { rec_type: rec.REC_TYPE, entity_id: rec.ENTITY_ID, score: num(rec.SCORE) }, 1);
  },
};

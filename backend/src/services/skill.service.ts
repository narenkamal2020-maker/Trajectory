import type oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/oracle';
import { num } from '../lib/util';
import { updateProficiency, blendInterviewScore, band, type Difficulty } from '../engine/skills';
import { CatalogService } from './catalog.service';

export interface UserSkillView {
  skillId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  proficiency: number;
  attempts: number;
  correct: number;
  lastPracticed: string | null;
  band: ReturnType<typeof band>;
}

export interface SkillDelta { skillId: string; name: string; before: number; after: number; delta: number }

export const SkillService = {
  async rows(userId: string) {
    const r = await query<any>(
      `SELECT SKILL_ID, PROFICIENCY, ATTEMPTS, CORRECT, LAST_PRACTICED FROM USER_SKILLS WHERE USER_ID = :userId`,
      { userId }
    );
    return (r.rows ?? []).map((x) => ({
      skillId: x.SKILL_ID as string,
      proficiency: num(x.PROFICIENCY),
      attempts: num(x.ATTEMPTS),
      correct: num(x.CORRECT),
      lastPracticed: x.LAST_PRACTICED ? new Date(x.LAST_PRACTICED) : null,
    }));
  },

  async proficiencyMap(userId: string): Promise<Map<string, number>> {
    return new Map((await SkillService.rows(userId)).map((r) => [r.skillId, r.proficiency]));
  },

  /** Every practiced skill joined with catalog names, strongest first. */
  async list(userId: string): Promise<UserSkillView[]> {
    const [rows, catalog] = await Promise.all([SkillService.rows(userId), CatalogService.skillMap()]);
    return rows
      .filter((r) => catalog.has(r.skillId))
      .map((r) => {
        const s = catalog.get(r.skillId)!;
        return {
          skillId: r.skillId, name: s.name, categoryId: s.categoryId, categoryName: s.categoryName,
          proficiency: r.proficiency, attempts: r.attempts, correct: r.correct,
          lastPracticed: r.lastPracticed?.toISOString() ?? null, band: band(r.proficiency),
        };
      })
      .sort((a, b) => b.proficiency - a.proficiency);
  },

  /**
   * Apply one graded attempt to every skill linked to the question, inside the caller's
   * transaction so the submission row and the skill updates commit together.
   */
  async applyAttempt(
    conn: oracledb.Connection,
    userId: string,
    o: { questionId: string; difficulty: Difficulty; score: number; usedHint: boolean; alreadySolved: boolean }
  ): Promise<SkillDelta[]> {
    const [links, catalog] = await Promise.all([CatalogService.questionSkills(o.questionId), CatalogService.skillMap()]);
    const deltas: SkillDelta[] = [];
    const now = new Date();
    for (const link of links) {
      const cur = await conn.execute<any>(
        `SELECT PROFICIENCY, ATTEMPTS FROM USER_SKILLS WHERE USER_ID = :userId AND SKILL_ID = :skillId FOR UPDATE`,
        { userId, skillId: link.skillId }
      );
      const row = cur.rows?.[0];
      const before = row ? num(row.PROFICIENCY) : 0;
      const { proficiency } = updateProficiency(
        { proficiency: before, attempts: row ? num(row.ATTEMPTS) : 0 },
        { difficulty: o.difficulty, score: o.score, weight: link.weight, usedHint: o.usedHint, alreadySolved: o.alreadySolved }
      );
      const correctInc = o.score >= 1 ? 1 : 0;
      if (row) {
        await conn.execute(
          `UPDATE USER_SKILLS SET PROFICIENCY = :p, ATTEMPTS = ATTEMPTS + 1, CORRECT = CORRECT + :c, LAST_PRACTICED = :now, UPDATED_AT = :now
           WHERE USER_ID = :userId AND SKILL_ID = :skillId`,
          { p: proficiency, c: correctInc, now, userId, skillId: link.skillId }
        );
      } else {
        await conn.execute(
          `INSERT INTO USER_SKILLS (USER_SKILL_ID, USER_ID, SKILL_ID, PROFICIENCY, ATTEMPTS, CORRECT, LAST_PRACTICED)
           VALUES (:id, :userId, :skillId, :p, 1, :c, :now)`,
          { id: uuidv4(), userId, skillId: link.skillId, p: proficiency, c: correctInc, now }
        );
      }
      deltas.push({ skillId: link.skillId, name: catalog.get(link.skillId)?.name ?? link.skillId, before, after: proficiency, delta: Math.round((proficiency - before) * 100) / 100 });
    }
    return deltas;
  },

  /** Blend an interview score into the skills that interview exercised. */
  async applyInterviewSignal(userId: string, skillIds: string[], score: number): Promise<void> {
    if (!skillIds.length) return;
    await withTransaction(async (conn) => {
      for (const skillId of skillIds) {
        const cur = await conn.execute<any>(`SELECT PROFICIENCY, ATTEMPTS FROM USER_SKILLS WHERE USER_ID = :userId AND SKILL_ID = :skillId`, { userId, skillId });
        const row = cur.rows?.[0];
        const before = row ? num(row.PROFICIENCY) : 0;
        const { proficiency } = blendInterviewScore({ proficiency: before, attempts: row ? num(row.ATTEMPTS) : 0 }, score);
        if (row) {
          await conn.execute(`UPDATE USER_SKILLS SET PROFICIENCY = :p, ATTEMPTS = ATTEMPTS + 1, LAST_PRACTICED = CURRENT_TIMESTAMP, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId AND SKILL_ID = :skillId`, { p: proficiency, userId, skillId });
        } else {
          await conn.execute(`INSERT INTO USER_SKILLS (USER_SKILL_ID, USER_ID, SKILL_ID, PROFICIENCY, ATTEMPTS, CORRECT, LAST_PRACTICED) VALUES (:id, :userId, :skillId, :p, 1, 0, CURRENT_TIMESTAMP)`, { id: uuidv4(), userId, skillId, p: proficiency });
        }
      }
    });
  },

  /** Skills found on a resume get a modest starting point (never lowers existing proficiency). */
  async seedFromResume(userId: string, skillIds: string[], baseline = 30): Promise<number> {
    if (!skillIds.length) return 0;
    let seeded = 0;
    await withTransaction(async (conn) => {
      for (const skillId of skillIds) {
        const r = await conn.execute(
          `MERGE INTO USER_SKILLS t USING (SELECT :userId AS USER_ID, :skillId AS SKILL_ID FROM DUAL) s
             ON (t.USER_ID = s.USER_ID AND t.SKILL_ID = s.SKILL_ID)
           WHEN MATCHED THEN UPDATE SET PROFICIENCY = :baseline, UPDATED_AT = CURRENT_TIMESTAMP WHERE t.PROFICIENCY < :baseline
           WHEN NOT MATCHED THEN INSERT (USER_SKILL_ID, USER_ID, SKILL_ID, PROFICIENCY, ATTEMPTS, CORRECT)
             VALUES (:id, :userId, :skillId, :baseline, 0, 0)`,
          { userId, skillId, baseline, id: uuidv4() }
        );
        seeded += r.rowsAffected ?? 0;
      }
    });
    return seeded;
  },
};

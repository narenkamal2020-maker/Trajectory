import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../oracle';

export interface UserSkill {
  USER_SKILL_ID: string;
  USER_ID: string;
  SKILL_ID: string;
  SKILL_NAME?: string;
  CATEGORY_NAME?: string;
  PROFICIENCY: number;
  ATTEMPTS: number;
  CORRECT: number;
  LAST_PRACTICED?: Date;
  UPDATED_AT: Date;
}

export interface SkillCategory {
  CATEGORY_ID: string;
  NAME: string;
  PARENT_ID?: string;
  ICON?: string;
  DISPLAY_ORDER: number;
}

export interface Skill {
  SKILL_ID: string;
  CATEGORY_ID: string;
  NAME: string;
  DESCRIPTION?: string;
}

export const SkillRepository = {
  async getAllCategories(): Promise<SkillCategory[]> {
    const result = await query<SkillCategory>(
      `SELECT * FROM SKILL_CATEGORIES ORDER BY DISPLAY_ORDER`
    );
    return (result.rows ?? []) as SkillCategory[];
  },

  async getSkillsByCategory(categoryId: string): Promise<Skill[]> {
    const result = await query<Skill>(
      `SELECT * FROM SKILLS WHERE CATEGORY_ID = :categoryId ORDER BY NAME`,
      { categoryId }
    );
    return (result.rows ?? []) as Skill[];
  },

  async getUserSkills(userId: string): Promise<UserSkill[]> {
    const result = await query<UserSkill>(
      `SELECT us.*, s.NAME as SKILL_NAME, sc.NAME as CATEGORY_NAME
       FROM USER_SKILLS us
       JOIN SKILLS s ON us.SKILL_ID = s.SKILL_ID
       JOIN SKILL_CATEGORIES sc ON s.CATEGORY_ID = sc.CATEGORY_ID
       WHERE us.USER_ID = :userId
       ORDER BY us.PROFICIENCY DESC`,
      { userId }
    );
    return (result.rows ?? []) as UserSkill[];
  },

  async getUserSkillSummary(userId: string): Promise<Array<{
    categoryName: string;
    categoryId: string;
    avgProficiency: number;
    skillCount: number;
  }>> {
    const result = await query(
      `SELECT sc.CATEGORY_ID, sc.NAME as CATEGORY_NAME,
              ROUND(AVG(us.PROFICIENCY), 1) as AVG_PROFICIENCY,
              COUNT(us.SKILL_ID) as SKILL_COUNT
       FROM USER_SKILLS us
       JOIN SKILLS s ON us.SKILL_ID = s.SKILL_ID
       JOIN SKILL_CATEGORIES sc ON s.CATEGORY_ID = sc.CATEGORY_ID
       WHERE us.USER_ID = :userId
       GROUP BY sc.CATEGORY_ID, sc.NAME
       ORDER BY AVG_PROFICIENCY DESC`,
      { userId }
    );
    return (result.rows ?? []) as any[];
  },

  async upsertUserSkill(userId: string, skillId: string, correct: boolean, proficiencyDelta: number): Promise<void> {
    const result = await query(
      `SELECT USER_SKILL_ID, PROFICIENCY, ATTEMPTS, CORRECT FROM USER_SKILLS
       WHERE USER_ID = :userId AND SKILL_ID = :skillId`,
      { userId, skillId }
    );

    const now = new Date();
    if (result.rows && result.rows.length > 0) {
      const existing = result.rows[0] as any;
      const newProficiency = Math.min(100, Math.max(0, Number(existing.PROFICIENCY) + proficiencyDelta));
      await execute(
        `UPDATE USER_SKILLS SET
          PROFICIENCY = :proficiency,
          ATTEMPTS = ATTEMPTS + 1,
          CORRECT = CORRECT + :correctInc,
          LAST_PRACTICED = :now,
          UPDATED_AT = :now
         WHERE USER_ID = :userId AND SKILL_ID = :skillId`,
        {
          proficiency: newProficiency,
          correctInc: correct ? 1 : 0,
          now,
          userId,
          skillId,
        }
      );
    } else {
      const userSkillId = uuidv4();
      const initialProficiency = Math.min(100, Math.max(0, proficiencyDelta));
      await execute(
        `INSERT INTO USER_SKILLS (USER_SKILL_ID, USER_ID, SKILL_ID, PROFICIENCY, ATTEMPTS, CORRECT, LAST_PRACTICED, CREATED_AT, UPDATED_AT)
         VALUES (:userSkillId, :userId, :skillId, :proficiency, 1, :correctInc, :now, :now, :now)`,
        {
          userSkillId,
          userId,
          skillId,
          proficiency: initialProficiency,
          correctInc: correct ? 1 : 0,
          now,
        }
      );
    }
  },

  async getWeakSkills(userId: string, limit = 5): Promise<UserSkill[]> {
    const result = await query<UserSkill>(
      `SELECT us.*, s.NAME as SKILL_NAME, sc.NAME as CATEGORY_NAME
       FROM USER_SKILLS us
       JOIN SKILLS s ON us.SKILL_ID = s.SKILL_ID
       JOIN SKILL_CATEGORIES sc ON s.CATEGORY_ID = sc.CATEGORY_ID
       WHERE us.USER_ID = :userId
       ORDER BY us.PROFICIENCY ASC
       FETCH FIRST :lim ROWS ONLY`,
      { userId, lim: limit }
    );
    return (result.rows ?? []) as UserSkill[];
  },
};

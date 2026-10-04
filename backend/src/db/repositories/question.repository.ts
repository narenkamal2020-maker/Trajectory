import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../oracle';

export interface Question {
  QUESTION_ID: string;
  TITLE: string;
  DESCRIPTION: string;
  DIFFICULTY: 'EASY' | 'MEDIUM' | 'HARD';
  CATEGORY_ID: string;
  CATEGORY_NAME?: string;
  TAGS?: string;
  CONSTRAINTS_TXT?: string;
  EXAMPLES?: string;
  HINTS?: string;
  EDITORIAL?: string;
  TIME_LIMIT_MS: number;
  MEMORY_MB: number;
  SOLVE_RATE?: number;
  AVG_TIME_SEC?: number;
  TOTAL_ATTEMPTS: number;
  IS_ACTIVE: number;
  CREATED_AT: Date;
}

export interface TestCase {
  TEST_CASE_ID: string;
  QUESTION_ID: string;
  INPUT_DATA?: string;
  EXPECTED_OUT?: string;
  IS_HIDDEN: number;
  DISPLAY_ORDER: number;
}

export interface QuestionFilters {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  categoryId?: string;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
}

export const QuestionRepository = {
  async findById(questionId: string): Promise<Question | null> {
    const result = await query<Question>(
      `SELECT q.*, sc.NAME as CATEGORY_NAME
       FROM QUESTIONS q
       JOIN SKILL_CATEGORIES sc ON q.CATEGORY_ID = sc.CATEGORY_ID
       WHERE q.QUESTION_ID = :questionId AND q.IS_ACTIVE = 1`,
      { questionId }
    );
    return (result.rows?.[0] as Question) ?? null;
  },

  async findMany(filters: QuestionFilters = {}): Promise<Question[]> {
    const conditions: string[] = ['q.IS_ACTIVE = 1'];
    const binds: Record<string, any> = {};

    if (filters.difficulty) {
      conditions.push('q.DIFFICULTY = :difficulty');
      binds.difficulty = filters.difficulty;
    }
    if (filters.categoryId) {
      conditions.push('q.CATEGORY_ID = :categoryId');
      binds.categoryId = filters.categoryId;
    }
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      // Oracle IN clause with dynamic bind variables
      const placeholders = filters.excludeIds.map((_, i) => `:excl${i}`).join(',');
      conditions.push(`q.QUESTION_ID NOT IN (${placeholders})`);
      filters.excludeIds.forEach((id, i) => { binds[`excl${i}`] = id; });
    }

    const where = conditions.join(' AND ');
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;
    binds.limit = limit;
    binds.offset = offset;

    const result = await query<Question>(
      `SELECT q.*, sc.NAME as CATEGORY_NAME
       FROM QUESTIONS q
       JOIN SKILL_CATEGORIES sc ON q.CATEGORY_ID = sc.CATEGORY_ID
       WHERE ${where}
       ORDER BY q.CREATED_AT DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      binds
    );
    return (result.rows ?? []) as Question[];
  },

  async getTestCases(questionId: string, includeHidden = false): Promise<TestCase[]> {
    const sql = includeHidden
      ? `SELECT * FROM TEST_CASES WHERE QUESTION_ID = :questionId ORDER BY DISPLAY_ORDER`
      : `SELECT * FROM TEST_CASES WHERE QUESTION_ID = :questionId AND IS_HIDDEN = 0 ORDER BY DISPLAY_ORDER`;
    const result = await query<TestCase>(sql, { questionId });
    return (result.rows ?? []) as TestCase[];
  },

  async getQuestionSkills(questionId: string): Promise<Array<{ SKILL_ID: string; SKILL_NAME: string; WEIGHT: number }>> {
    const result = await query(
      `SELECT qs.SKILL_ID, s.NAME as SKILL_NAME, qs.WEIGHT
       FROM QUESTION_SKILLS qs
       JOIN SKILLS s ON qs.SKILL_ID = s.SKILL_ID
       WHERE qs.QUESTION_ID = :questionId`,
      { questionId }
    );
    return (result.rows ?? []) as any[];
  },

  async updateStats(questionId: string, accepted: boolean, timeTaken: number): Promise<void> {
    await execute(
      `UPDATE QUESTIONS SET
        TOTAL_ATTEMPTS = TOTAL_ATTEMPTS + 1,
        SOLVE_RATE = (
          SELECT ROUND(
            (COUNT(CASE WHEN STATUS = 'ACCEPTED' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0),
            2
          ) FROM SUBMISSIONS WHERE QUESTION_ID = :questionId
        ),
        AVG_TIME_SEC = (
          SELECT ROUND(AVG(TIME_TAKEN_SEC), 2)
          FROM SUBMISSIONS WHERE QUESTION_ID = :questionId AND TIME_TAKEN_SEC IS NOT NULL
        )
       WHERE QUESTION_ID = :questionId`,
      { questionId }
    );
  },
};

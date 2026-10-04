import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../../config/oracle';

export interface ProgressSnapshot {
  SNAPSHOT_ID: string;
  USER_ID: string;
  SNAPSHOT_DATE: Date;
  QUESTIONS_DONE: number;
  ACCURACY?: number;
  STREAK_DAYS: number;
  OVERALL_SCORE?: number;
  SKILLS_JSON?: string;
  CREATED_AT: Date;
}

export interface UpsertSnapshotData {
  userId: string;
  snapshotDate: string; // YYYY-MM-DD
  questionsDone: number;
  accuracy?: number;
  streakDays: number;
  overallScore?: number;
  skillsJson?: any;
}

export const SnapshotRepository = {
  async getHistory(userId: string, days = 30): Promise<ProgressSnapshot[]> {
    const res = await query<ProgressSnapshot>(
      `SELECT * FROM PROGRESS_SNAPSHOTS
       WHERE USER_ID = :userId
         AND SNAPSHOT_DATE >= TRUNC(CURRENT_TIMESTAMP) - :days
       ORDER BY SNAPSHOT_DATE ASC`,
      { userId, days }
    );
    return (res.rows ?? []) as ProgressSnapshot[];
  },

  async upsert(data: UpsertSnapshotData): Promise<void> {
    const jsonStr = data.skillsJson ? (typeof data.skillsJson === 'string' ? data.skillsJson : JSON.stringify(data.skillsJson)) : null;
    const snapshotId = uuidv4();
    const now = new Date();

    await execute(
      `MERGE INTO PROGRESS_SNAPSHOTS ps
       USING (SELECT :userId AS USER_ID, TO_DATE(:snapshotDate, 'YYYY-MM-DD') AS SNAPSHOT_DATE FROM DUAL) src
       ON (ps.USER_ID = src.USER_ID AND ps.SNAPSHOT_DATE = src.SNAPSHOT_DATE)
       WHEN MATCHED THEN
         UPDATE SET
           ps.QUESTIONS_DONE = :questionsDone,
           ps.ACCURACY = :accuracy,
           ps.STREAK_DAYS = :streakDays,
           ps.OVERALL_SCORE = :overallScore,
           ps.SKILLS_JSON = :jsonStr
       WHEN NOT MATCHED THEN
         INSERT (
           SNAPSHOT_ID, USER_ID, SNAPSHOT_DATE, QUESTIONS_DONE,
           ACCURACY, STREAK_DAYS, OVERALL_SCORE, SKILLS_JSON, CREATED_AT
         ) VALUES (
           :snapshotId, :userId, TO_DATE(:snapshotDate, 'YYYY-MM-DD'), :questionsDone,
           :accuracy, :streakDays, :overallScore, :jsonStr, :now
         )`,
      {
        userId: data.userId,
        snapshotDate: data.snapshotDate,
        questionsDone: data.questionsDone,
        accuracy: data.accuracy ?? null,
        streakDays: data.streakDays,
        overallScore: data.overallScore ?? null,
        jsonStr,
        snapshotId,
        now,
      }
    );
  }
};

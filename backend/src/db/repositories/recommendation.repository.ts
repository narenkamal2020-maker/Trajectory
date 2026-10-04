import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../oracle';

export type RecommendationType = 'QUESTION' | 'TOPIC' | 'INTERVIEW' | 'RESOURCE' | 'RESUME' | 'CAREER';

export interface Recommendation {
  REC_ID: string;
  USER_ID: string;
  REC_TYPE: RecommendationType;
  ENTITY_ID?: string;
  TITLE?: string;
  REASON?: string;
  SCORE: number;
  IS_DISMISSED: number;
  CREATED_AT: Date;
  EXPIRES_AT?: Date;
}

export interface CreateRecommendationData {
  userId: string;
  recType: RecommendationType;
  entityId?: string;
  title: string;
  reason?: string;
  score?: number;
  expiresAt?: Date;
}

export const RecommendationRepository = {
  async findActiveByUser(userId: string, limit = 10): Promise<Recommendation[]> {
    const res = await query<Recommendation>(
      `SELECT * FROM RECOMMENDATIONS
       WHERE USER_ID = :userId
         AND IS_DISMISSED = 0
         AND (EXPIRES_AT IS NULL OR EXPIRES_AT > CURRENT_TIMESTAMP)
       ORDER BY SCORE DESC, CREATED_AT DESC
       FETCH FIRST :lim ROWS ONLY`,
      { userId, lim: limit }
    );
    return (res.rows ?? []) as Recommendation[];
  },

  async create(data: CreateRecommendationData): Promise<Recommendation> {
    const recId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO RECOMMENDATIONS (
        REC_ID, USER_ID, REC_TYPE, ENTITY_ID, TITLE, REASON, SCORE, IS_DISMISSED, CREATED_AT, EXPIRES_AT
      ) VALUES (
        :recId, :userId, :recType, :entityId, :title, :reason, :score, 0, :now, :expiresAt
      )`,
      {
        recId,
        userId: data.userId,
        recType: data.recType,
        entityId: data.entityId ?? null,
        title: data.title,
        reason: data.reason ?? null,
        score: data.score ?? 0,
        now,
        expiresAt: data.expiresAt ?? null,
      }
    );

    const res = await query<Recommendation>(
      `SELECT * FROM RECOMMENDATIONS WHERE REC_ID = :recId`,
      { recId }
    );
    return res.rows![0];
  },

  async dismiss(recId: string, userId: string): Promise<void> {
    await execute(
      `UPDATE RECOMMENDATIONS SET IS_DISMISSED = 1 WHERE REC_ID = :recId AND USER_ID = :userId`,
      { recId, userId }
    );
  }
};

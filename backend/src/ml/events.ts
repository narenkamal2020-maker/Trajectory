/**
 * Training-data collection. Every learning event is logged with the features that were known
 * *before* the outcome, plus the outcome label, so models can be trained without leakage.
 */
import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { execute } from '../config/oracle';
import { logger } from '../config/logger';

export type MlEventType = 'SUBMISSION' | 'INTERVIEW_ANSWER' | 'RESUME' | 'RECOMMENDATION_CLICK';

export async function logMlEvent(
  userId: string,
  type: MlEventType,
  entityId: string | null,
  features: Record<string, unknown>,
  label: number | null
): Promise<void> {
  try {
    await execute(
      `INSERT INTO ML_EVENTS (EVENT_ID, USER_ID, EVENT_TYPE, ENTITY_ID, FEATURES, LABEL)
       VALUES (:id, :userId, :type, :entityId, :features, :label)`,
      { id: uuidv4(), userId, type, entityId, features: { val: JSON.stringify(features), type: oracledb.CLOB }, label }
    );
  } catch (err: any) {
    // Never let analytics logging break a user-facing request.
    logger.warn(`Failed to log ML event: ${err.message}`);
  }
}

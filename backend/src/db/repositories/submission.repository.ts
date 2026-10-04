import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../oracle';

export type SubmissionStatus = 'PENDING' | 'ACCEPTED' | 'WRONG' | 'TLE' | 'MLE' | 'ERROR' | 'PARTIAL';
export type SessionType = 'PRACTICE' | 'TIMED' | 'INTERVIEW' | 'REVIEW';

export interface PracticeSession {
  SESSION_ID: string;
  USER_ID: string;
  STARTED_AT: Date;
  ENDED_AT?: Date;
  SESSION_TYPE: SessionType;
}

export interface Submission {
  SUBMISSION_ID: string;
  USER_ID: string;
  QUESTION_ID: string;
  SESSION_ID?: string;
  CODE?: string;
  LANGUAGE?: string;
  STATUS: SubmissionStatus;
  SCORE?: number;
  TIME_TAKEN_SEC?: number;
  TESTS_PASSED: number;
  TESTS_TOTAL: number;
  USED_HINT: number;
  AI_FEEDBACK?: string;
  SUBMITTED_AT: Date;
}

export interface CreateSubmissionData {
  userId: string;
  questionId: string;
  sessionId?: string;
  code?: string;
  language?: string;
  status: SubmissionStatus;
  score?: number;
  timeTakenSec?: number;
  testsPassed: number;
  testsTotal: number;
  usedHint?: boolean;
  aiFeedback?: string;
}

export const SubmissionRepository = {
  async createSession(userId: string, sessionType: SessionType = 'PRACTICE'): Promise<PracticeSession> {
    const sessionId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO PRACTICE_SESSIONS (SESSION_ID, USER_ID, STARTED_AT, SESSION_TYPE)
       VALUES (:sessionId, :userId, :now, :sessionType)`,
      { sessionId, userId, now, sessionType }
    );
    const res = await query<PracticeSession>(
      `SELECT * FROM PRACTICE_SESSIONS WHERE SESSION_ID = :sessionId`,
      { sessionId }
    );
    return res.rows![0];
  },

  async endSession(sessionId: string): Promise<void> {
    await execute(
      `UPDATE PRACTICE_SESSIONS SET ENDED_AT = CURRENT_TIMESTAMP WHERE SESSION_ID = :sessionId`,
      { sessionId }
    );
  },

  async create(data: CreateSubmissionData): Promise<Submission> {
    const submissionId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO SUBMISSIONS (
        SUBMISSION_ID, USER_ID, QUESTION_ID, SESSION_ID, CODE, LANGUAGE,
        STATUS, SCORE, TIME_TAKEN_SEC, TESTS_PASSED, TESTS_TOTAL, USED_HINT,
        AI_FEEDBACK, SUBMITTED_AT
      ) VALUES (
        :submissionId, :userId, :questionId, :sessionId, :code, :language,
        :status, :score, :timeTakenSec, :testsPassed, :testsTotal, :usedHint,
        :aiFeedback, :now
      )`,
      {
        submissionId,
        userId: data.userId,
        questionId: data.questionId,
        sessionId: data.sessionId ?? null,
        code: data.code ?? null,
        language: data.language ?? null,
        status: data.status,
        score: data.score ?? null,
        timeTakenSec: data.timeTakenSec ?? null,
        testsPassed: data.testsPassed,
        testsTotal: data.testsTotal,
        usedHint: data.usedHint ? 1 : 0,
        aiFeedback: data.aiFeedback ?? null,
        now,
      }
    );

    const res = await query<Submission>(
      `SELECT * FROM SUBMISSIONS WHERE SUBMISSION_ID = :submissionId`,
      { submissionId }
    );
    return res.rows![0];
  },

  async findById(submissionId: string): Promise<Submission | null> {
    const res = await query<Submission>(
      `SELECT * FROM SUBMISSIONS WHERE SUBMISSION_ID = :submissionId`,
      { submissionId }
    );
    return res.rows?.[0] ?? null;
  },

  async findByUser(userId: string, limit = 20, offset = 0): Promise<Submission[]> {
    const res = await query<Submission>(
      `SELECT s.*, q.TITLE as QUESTION_TITLE, q.DIFFICULTY as QUESTION_DIFFICULTY
       FROM SUBMISSIONS s
       JOIN QUESTIONS q ON s.QUESTION_ID = q.QUESTION_ID
       WHERE s.USER_ID = :userId
       ORDER BY s.SUBMITTED_AT DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { userId, offset, limit }
    );
    return (res.rows ?? []) as Submission[];
  },

  async getUserStats(userId: string): Promise<{
    totalSubmissions: number;
    acceptedCount: number;
    uniqueQuestionsSolved: number;
    avgAccuracy: number;
  }> {
    const res = await query(
      `SELECT
        COUNT(*) as TOTAL_SUBS,
        COUNT(CASE WHEN STATUS = 'ACCEPTED' THEN 1 END) as ACCEPTED_COUNT,
        COUNT(DISTINCT CASE WHEN STATUS = 'ACCEPTED' THEN QUESTION_ID END) as UNIQUE_SOLVED,
        ROUND(AVG(CASE WHEN STATUS = 'ACCEPTED' THEN 100.0 ELSE 0.0 END), 2) as ACCURACY
       FROM SUBMISSIONS
       WHERE USER_ID = :userId`,
      { userId }
    );
    const row = res.rows?.[0] as any;
    return {
      totalSubmissions: Number(row?.TOTAL_SUBS ?? 0),
      acceptedCount: Number(row?.ACCEPTED_COUNT ?? 0),
      uniqueQuestionsSolved: Number(row?.UNIQUE_SOLVED ?? 0),
      avgAccuracy: Number(row?.ACCURACY ?? 0),
    };
  }
};

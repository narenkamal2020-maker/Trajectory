import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../oracle';

export type InterviewType = 'TECHNICAL' | 'DSA' | 'SQL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'ROLE_SPECIFIC';
export type InterviewStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type MessageRole = 'SYSTEM' | 'INTERVIEWER' | 'USER';

export interface Interview {
  INTERVIEW_ID: string;
  USER_ID: string;
  INTERVIEW_TYPE: InterviewType;
  JOB_PROFILE?: string;
  STATUS: InterviewStatus;
  OVERALL_SCORE?: number;
  COMMUNICATION_SCR?: number;
  TECHNICAL_SCR?: number;
  PROBLEM_SOLVING_SCR?: number;
  DURATION_SEC?: number;
  CREATED_AT: Date;
  COMPLETED_AT?: Date;
}

export interface InterviewMessage {
  MESSAGE_ID: string;
  INTERVIEW_ID: string;
  ROLE: MessageRole;
  CONTENT: string;
  EVAL_FEEDBACK?: string;
  CREATED_AT: Date;
}

export interface CreateInterviewData {
  userId: string;
  interviewType: InterviewType;
  jobProfile?: string;
}

export const InterviewRepository = {
  async create(data: CreateInterviewData): Promise<Interview> {
    const interviewId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO INTERVIEWS (INTERVIEW_ID, USER_ID, INTERVIEW_TYPE, JOB_PROFILE, STATUS, CREATED_AT)
       VALUES (:interviewId, :userId, :interviewType, :jobProfile, 'IN_PROGRESS', :now)`,
      {
        interviewId,
        userId: data.userId,
        interviewType: data.interviewType,
        jobProfile: data.jobProfile ?? null,
        now,
      }
    );

    const res = await query<Interview>(
      `SELECT * FROM INTERVIEWS WHERE INTERVIEW_ID = :interviewId`,
      { interviewId }
    );
    return res.rows![0];
  },

  async findById(interviewId: string): Promise<Interview | null> {
    const res = await query<Interview>(
      `SELECT * FROM INTERVIEWS WHERE INTERVIEW_ID = :interviewId`,
      { interviewId }
    );
    return res.rows?.[0] ?? null;
  },

  async findByUser(userId: string, limit = 10): Promise<Interview[]> {
    const res = await query<Interview>(
      `SELECT * FROM INTERVIEWS
       WHERE USER_ID = :userId
       ORDER BY CREATED_AT DESC
       FETCH FIRST :lim ROWS ONLY`,
      { userId, lim: limit }
    );
    return (res.rows ?? []) as Interview[];
  },

  async addMessage(
    interviewId: string,
    role: MessageRole,
    content: string,
    evalFeedback?: string
  ): Promise<InterviewMessage> {
    const messageId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO INTERVIEW_MESSAGES (MESSAGE_ID, INTERVIEW_ID, ROLE, CONTENT, EVAL_FEEDBACK, CREATED_AT)
       VALUES (:messageId, :interviewId, :role, :content, :evalFeedback, :now)`,
      {
        messageId,
        interviewId,
        role,
        content,
        evalFeedback: evalFeedback ?? null,
        now,
      }
    );

    const res = await query<InterviewMessage>(
      `SELECT * FROM INTERVIEW_MESSAGES WHERE MESSAGE_ID = :messageId`,
      { messageId }
    );
    return res.rows![0];
  },

  async getMessages(interviewId: string): Promise<InterviewMessage[]> {
    const res = await query<InterviewMessage>(
      `SELECT * FROM INTERVIEW_MESSAGES
       WHERE INTERVIEW_ID = :interviewId
       ORDER BY CREATED_AT ASC`,
      { interviewId }
    );
    return (res.rows ?? []) as InterviewMessage[];
  },

  async finalize(
    interviewId: string,
    scores: {
      overallScore: number;
      communicationScore: number;
      technicalScore: number;
      problemSolvingScore: number;
      durationSec?: number;
    }
  ): Promise<Interview> {
    const now = new Date();
    await execute(
      `UPDATE INTERVIEWS SET
        STATUS = 'COMPLETED',
        OVERALL_SCORE = :overallScore,
        COMMUNICATION_SCR = :communicationScore,
        TECHNICAL_SCR = :technicalScore,
        PROBLEM_SOLVING_SCR = :problemSolvingScore,
        DURATION_SEC = :durationSec,
        COMPLETED_AT = :now
       WHERE INTERVIEW_ID = :interviewId`,
      {
        overallScore: scores.overallScore,
        communicationScore: scores.communicationScore,
        technicalScore: scores.technicalScore,
        problemSolvingScore: scores.problemSolvingScore,
        durationSec: scores.durationSec ?? null,
        now,
        interviewId,
      }
    );

    return (await this.findById(interviewId))!;
  },
};

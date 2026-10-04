import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../../config/oracle';

export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Resume {
  RESUME_ID: string;
  USER_ID: string;
  FILE_NAME?: string;
  FILE_PATH?: string;
  PARSED_TEXT?: string;
  PARSED_METADATA?: string;
  ATS_SCORE?: number;
  DETECTED_GAPS?: string;
  SUGGESTIONS?: string;
  INTERVIEW_QUESTIONS?: string;
  ANALYSIS_STATUS: AnalysisStatus;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface CreateResumeData {
  userId: string;
  fileName?: string;
  filePath?: string;
  parsedText?: string;
  parsedMetadata?: string;
}

export interface UpdateResumeAnalysisData {
  atsScore?: number;
  detectedGaps?: any;
  suggestions?: any;
  interviewQuestions?: any;
  status: AnalysisStatus;
}

export const ResumeRepository = {
  async findLatestByUserId(userId: string): Promise<Resume | null> {
    const res = await query<Resume>(
      `SELECT * FROM RESUMES
       WHERE USER_ID = :userId
       ORDER BY CREATED_AT DESC
       FETCH FIRST 1 ROWS ONLY`,
      { userId }
    );
    return res.rows?.[0] ?? null;
  },

  async findById(resumeId: string): Promise<Resume | null> {
    const res = await query<Resume>(
      `SELECT * FROM RESUMES WHERE RESUME_ID = :resumeId`,
      { resumeId }
    );
    return res.rows?.[0] ?? null;
  },

  async create(data: CreateResumeData): Promise<Resume> {
    const resumeId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO RESUMES (
        RESUME_ID, USER_ID, FILE_NAME, FILE_PATH, PARSED_TEXT,
        PARSED_METADATA, ANALYSIS_STATUS, CREATED_AT, UPDATED_AT
      ) VALUES (
        :resumeId, :userId, :fileName, :filePath, :parsedText,
        :parsedMetadata, 'PENDING', :now, :now
      )`,
      {
        resumeId,
        userId: data.userId,
        fileName: data.fileName ?? null,
        filePath: data.filePath ?? null,
        parsedText: data.parsedText ?? null,
        parsedMetadata: data.parsedMetadata ?? null,
        now,
      }
    );

    return (await this.findById(resumeId))!;
  },

  async updateAnalysis(resumeId: string, data: UpdateResumeAnalysisData): Promise<Resume> {
    const now = new Date();
    await execute(
      `UPDATE RESUMES SET
        ATS_SCORE = :atsScore,
        DETECTED_GAPS = :detectedGaps,
        SUGGESTIONS = :suggestions,
        INTERVIEW_QUESTIONS = :interviewQuestions,
        ANALYSIS_STATUS = :status,
        UPDATED_AT = :now
       WHERE RESUME_ID = :resumeId`,
      {
        atsScore: data.atsScore ?? null,
        detectedGaps: data.detectedGaps ? (typeof data.detectedGaps === 'string' ? data.detectedGaps : JSON.stringify(data.detectedGaps)) : null,
        suggestions: data.suggestions ? (typeof data.suggestions === 'string' ? data.suggestions : JSON.stringify(data.suggestions)) : null,
        interviewQuestions: data.interviewQuestions ? (typeof data.interviewQuestions === 'string' ? data.interviewQuestions : JSON.stringify(data.interviewQuestions)) : null,
        status: data.status,
        now,
        resumeId,
      }
    );

    return (await this.findById(resumeId))!;
  },
};

import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../../config/oracle';

export type ApplicationStage = 'APPLIED' | 'OA' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED';

export interface Application {
  APP_ID: string;
  USER_ID: string;
  COMPANY_NAME: string;
  JOB_TITLE: string;
  STAGE: ApplicationStage;
  SALARY_PACKAGE?: string;
  JOB_DESC_TEXT?: string;
  APPLIED_DATE: Date;
  REMINDER_DATE?: Date;
  NOTES?: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface CreateApplicationData {
  userId: string;
  companyName: string;
  jobTitle: string;
  stage?: ApplicationStage;
  salaryPackage?: string;
  jobDescText?: string;
  appliedDate?: Date;
  reminderDate?: Date;
  notes?: string;
}

export interface UpdateApplicationData {
  companyName?: string;
  jobTitle?: string;
  stage?: ApplicationStage;
  salaryPackage?: string;
  jobDescText?: string;
  appliedDate?: Date;
  reminderDate?: Date;
  notes?: string;
}

export const ApplicationRepository = {
  async findById(appId: string): Promise<Application | null> {
    const res = await query<Application>(
      `SELECT * FROM APPLICATIONS WHERE APP_ID = :appId`,
      { appId }
    );
    return res.rows?.[0] ?? null;
  },

  async findByUser(userId: string): Promise<Application[]> {
    const res = await query<Application>(
      `SELECT * FROM APPLICATIONS
       WHERE USER_ID = :userId
       ORDER BY CREATED_AT DESC`,
      { userId }
    );
    return (res.rows ?? []) as Application[];
  },

  async create(data: CreateApplicationData): Promise<Application> {
    const appId = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO APPLICATIONS (
        APP_ID, USER_ID, COMPANY_NAME, JOB_TITLE, STAGE, SALARY_PACKAGE,
        JOB_DESC_TEXT, APPLIED_DATE, REMINDER_DATE, NOTES, CREATED_AT, UPDATED_AT
      ) VALUES (
        :appId, :userId, :companyName, :jobTitle, :stage, :salaryPackage,
        :jobDescText, :appliedDate, :reminderDate, :notes, :now, :now
      )`,
      {
        appId,
        userId: data.userId,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        stage: data.stage ?? 'APPLIED',
        salaryPackage: data.salaryPackage ?? null,
        jobDescText: data.jobDescText ?? null,
        appliedDate: data.appliedDate ?? now,
        reminderDate: data.reminderDate ?? null,
        notes: data.notes ?? null,
        now,
      }
    );

    return (await this.findById(appId))!;
  },

  async update(appId: string, data: UpdateApplicationData): Promise<Application> {
    const existing = await this.findById(appId);
    if (!existing) {
      throw new Error(`Application ${appId} not found`);
    }

    const now = new Date();
    await execute(
      `UPDATE APPLICATIONS SET
        COMPANY_NAME = :companyName,
        JOB_TITLE = :jobTitle,
        STAGE = :stage,
        SALARY_PACKAGE = :salaryPackage,
        JOB_DESC_TEXT = :jobDescText,
        APPLIED_DATE = :appliedDate,
        REMINDER_DATE = :reminderDate,
        NOTES = :notes,
        UPDATED_AT = :now
       WHERE APP_ID = :appId`,
      {
        companyName: data.companyName ?? existing.COMPANY_NAME,
        jobTitle: data.jobTitle ?? existing.JOB_TITLE,
        stage: data.stage ?? existing.STAGE,
        salaryPackage: data.salaryPackage !== undefined ? data.salaryPackage : existing.SALARY_PACKAGE,
        jobDescText: data.jobDescText !== undefined ? data.jobDescText : existing.JOB_DESC_TEXT,
        appliedDate: data.appliedDate ?? existing.APPLIED_DATE,
        reminderDate: data.reminderDate !== undefined ? data.reminderDate : existing.REMINDER_DATE,
        notes: data.notes !== undefined ? data.notes : existing.NOTES,
        now,
        appId,
      }
    );

    return (await this.findById(appId))!;
  },

  async delete(appId: string): Promise<void> {
    await execute(
      `DELETE FROM APPLICATIONS WHERE APP_ID = :appId`,
      { appId }
    );
  },

  async getStageMetrics(userId: string): Promise<{
    totalApplications: number;
    applicationsByStage: Record<string, number>;
  }> {
    const res = await query(
      `SELECT STAGE, COUNT(*) as STAGE_COUNT
       FROM APPLICATIONS
       WHERE USER_ID = :userId
       GROUP BY STAGE`,
      { userId }
    );

    const applicationsByStage: Record<string, number> = {
      APPLIED: 0,
      OA: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      HIRED: 0,
    };

    let total = 0;
    for (const row of (res.rows ?? []) as any[]) {
      const count = Number(row.STAGE_COUNT ?? 0);
      applicationsByStage[row.STAGE] = count;
      total += count;
    }

    return {
      totalApplications: total,
      applicationsByStage,
    };
  }
};

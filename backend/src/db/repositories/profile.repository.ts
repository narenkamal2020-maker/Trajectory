import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../oracle';

export interface Profile {
  PROFILE_ID: string;
  USER_ID: string;
  TARGET_ROLE?: string;
  EXPERIENCE_LEVEL?: string;
  TARGET_INDUSTRY?: string;
  BIO?: string;
  GITHUB_URL?: string;
  LINKEDIN_URL?: string;
  ONBOARDING_DONE: number;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface UpsertProfileData {
  userId: string;
  targetRole: string;
  targetIndustry: string;
  experienceLevel: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export const ProfileRepository = {
  async findByUserId(userId: string): Promise<Profile | null> {
    const result = await query<Profile>(
      `SELECT * FROM PROFILES WHERE USER_ID = :userId`,
      { userId }
    );
    return (result.rows?.[0] as Profile) ?? null;
  },

  async upsert(data: UpsertProfileData): Promise<Profile> {
    const existing = await this.findByUserId(data.userId);
    const now = new Date();

    if (existing) {
      await execute(
        `UPDATE PROFILES SET
          TARGET_ROLE = :targetRole,
          TARGET_INDUSTRY = :targetIndustry,
          EXPERIENCE_LEVEL = :experienceLevel,
          BIO = :bio,
          GITHUB_URL = :githubUrl,
          LINKEDIN_URL = :linkedinUrl,
          UPDATED_AT = :now
         WHERE USER_ID = :userId`,
        {
          targetRole: data.targetRole,
          targetIndustry: data.targetIndustry,
          experienceLevel: data.experienceLevel,
          bio: data.bio ?? null,
          githubUrl: data.githubUrl ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
          now,
          userId: data.userId,
        }
      );
    } else {
      const profileId = uuidv4();
      await execute(
        `INSERT INTO PROFILES (PROFILE_ID, USER_ID, TARGET_ROLE, TARGET_INDUSTRY, EXPERIENCE_LEVEL, BIO, GITHUB_URL, LINKEDIN_URL, CREATED_AT, UPDATED_AT)
         VALUES (:profileId, :userId, :targetRole, :targetIndustry, :experienceLevel, :bio, :githubUrl, :linkedinUrl, :createdAt, :updatedAt)`,
        {
          profileId,
          userId: data.userId,
          targetRole: data.targetRole,
          targetIndustry: data.targetIndustry,
          experienceLevel: data.experienceLevel,
          bio: data.bio ?? null,
          githubUrl: data.githubUrl ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
          createdAt: now,
          updatedAt: now,
        }
      );
    }
    return (await this.findByUserId(data.userId))!;
  },

  async setOnboardingDone(userId: string): Promise<void> {
    await execute(
      `UPDATE PROFILES SET ONBOARDING_DONE = 1, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId`,
      { userId }
    );
  },

  async isOnboardingComplete(userId: string): Promise<boolean> {
    const profile = await this.findByUserId(userId);
    if (!profile) return false;
    return Boolean(
      profile.TARGET_ROLE &&
      profile.TARGET_INDUSTRY &&
      profile.EXPERIENCE_LEVEL
    );
  },
};

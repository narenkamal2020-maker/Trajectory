import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/oracle';
import { cache } from '../lib/cache';
import { parseJson } from '../lib/util';
import { CatalogService } from './catalog.service';
import { SkillService } from './skill.service';

export interface ProfileInput {
  targetRole: string;
  experienceLevel: string;
  targetIndustry?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
}

export interface ProfileView {
  targetRole: string | null;
  resolvedRole: { id: string; title: string } | null;
  experienceLevel: string | null;
  targetIndustry: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  onboardingDone: boolean;
}

async function rawProfile(userId: string) {
  const r = await query<any>(`SELECT * FROM PROFILES WHERE USER_ID = :userId`, { userId });
  return r.rows?.[0] ?? null;
}

export const ProfileService = {
  async get(userId: string): Promise<ProfileView | null> {
    const p = await rawProfile(userId);
    if (!p) return null;
    const role = await CatalogService.resolveRole(p.TARGET_ROLE);
    return {
      targetRole: p.TARGET_ROLE ?? null,
      resolvedRole: role ? { id: role.id, title: role.title } : null,
      experienceLevel: p.EXPERIENCE_LEVEL ?? null,
      targetIndustry: p.TARGET_INDUSTRY ?? null,
      bio: p.BIO ?? null,
      githubUrl: p.GITHUB_URL ?? null,
      linkedinUrl: p.LINKEDIN_URL ?? null,
      skills: parseJson<string[]>(p.SKILLS_JSON, []),
      onboardingDone: !!p.ONBOARDING_DONE,
    };
  },

  async upsert(userId: string, input: ProfileInput): Promise<ProfileView> {
    const role = await CatalogService.resolveRole(input.targetRole);
    const binds = {
      userId,
      targetRole: input.targetRole,
      experienceLevel: input.experienceLevel,
      targetIndustry: input.targetIndustry ?? null,
      bio: { val: input.bio ?? null, type: oracledb.CLOB },
      githubUrl: input.githubUrl || null,
      linkedinUrl: input.linkedinUrl || null,
      skills: { val: JSON.stringify(input.skills ?? []), type: oracledb.CLOB },
    };
    await withTransaction(async (conn) => {
      const exists = await conn.execute<any>(`SELECT 1 FROM PROFILES WHERE USER_ID = :userId`, { userId });
      if (exists.rows?.length) {
        await conn.execute(
          `UPDATE PROFILES SET TARGET_ROLE = :targetRole, EXPERIENCE_LEVEL = :experienceLevel, TARGET_INDUSTRY = :targetIndustry,
             BIO = :bio, GITHUB_URL = :githubUrl, LINKEDIN_URL = :linkedinUrl, SKILLS_JSON = :skills, ONBOARDING_DONE = 1,
             UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId`,
          binds
        );
      } else {
        await conn.execute(
          `INSERT INTO PROFILES (PROFILE_ID, USER_ID, TARGET_ROLE, EXPERIENCE_LEVEL, TARGET_INDUSTRY, BIO, GITHUB_URL, LINKEDIN_URL, SKILLS_JSON, ONBOARDING_DONE)
           VALUES (:profileId, :userId, :targetRole, :experienceLevel, :targetIndustry, :bio, :githubUrl, :linkedinUrl, :skills, 1)`,
          { ...binds, profileId: uuidv4() }
        );
      }
      if (role) {
        await conn.execute(`UPDATE USER_TARGET_ROLES SET IS_PRIMARY = 0 WHERE USER_ID = :userId`, { userId });
        await conn.execute(
          `MERGE INTO USER_TARGET_ROLES t USING (SELECT :userId AS USER_ID, :roleId AS ROLE_ID FROM DUAL) s
             ON (t.USER_ID = s.USER_ID AND t.ROLE_ID = s.ROLE_ID)
           WHEN MATCHED THEN UPDATE SET IS_PRIMARY = 1
           WHEN NOT MATCHED THEN INSERT (USER_ROLE_ID, USER_ID, ROLE_ID, IS_PRIMARY) VALUES (:id, :userId, :roleId, 1)`,
          { userId, roleId: role.id, id: uuidv4() }
        );
      }
    });

    // Self-reported skills give a small head start (resume evidence gives more, practice gives the rest).
    if (input.skills?.length) {
      const catalog = await CatalogService.skills();
      const wanted = new Set(input.skills.map((s) => s.toLowerCase().trim()));
      const ids = catalog.filter((s) => wanted.has(s.name.toLowerCase()) || [...wanted].some((w) => w.length > 2 && s.name.toLowerCase().includes(w))).map((s) => s.id);
      await SkillService.seedFromResume(userId, [...new Set(ids)], 20);
    }

    cache.invalidateUser(userId);
    return (await ProfileService.get(userId))!;
  },

  async onboardingStatus(userId: string) {
    const [profile, resume] = await Promise.all([
      ProfileService.get(userId),
      query<any>(`SELECT ANALYSIS_STATUS FROM RESUMES WHERE USER_ID = :userId ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`, { userId }),
    ]);
    const profileComplete = !!(profile?.targetRole && profile.experienceLevel);
    const resumeStatus: string | null = resume.rows?.[0]?.ANALYSIS_STATUS ?? null;
    const nextStep = !profileComplete
      ? 'Tell us your target role and experience level.'
      : !resumeStatus
        ? 'Upload your resume (optional) to calibrate your skill map.'
        : resumeStatus === 'PENDING' || resumeStatus === 'PROCESSING'
          ? 'Your resume is being analyzed…'
          : 'All set — head to your dashboard.';
    return {
      isComplete: profileComplete,
      profileComplete,
      resumeUploaded: !!resumeStatus,
      resumeAnalysisStatus: resumeStatus?.toLowerCase() ?? null,
      profile,
      nextStep,
    };
  },
};

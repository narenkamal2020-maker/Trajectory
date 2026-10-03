import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export interface OnboardingGuardRequest extends AuthRequest {
  onboardingStatus?: {
    profileComplete: boolean;
    resumeUploaded: boolean;
    analysisComplete: boolean;
  };
}

export const onboardingGuard = (allowPartial: boolean = false) => {
  return async (req: OnboardingGuardRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const [profile, latestResume] = await Promise.all([
        prisma.userProfile.findUnique({ where: { user_id: userId } }),
        prisma.resume.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'desc' } })
      ]);

      const profileComplete = Boolean(profile && profile.target_role && profile.target_industry && profile.experience_level && profile.skills?.length);
      const resumeUploaded = Boolean(latestResume);
      const analysisComplete = Boolean(latestResume?.ats_score !== null);

      req.onboardingStatus = { profileComplete, resumeUploaded, analysisComplete };

      if (!allowPartial && (!profileComplete || !resumeUploaded)) {
        logger.warn(`[${userId}] Onboarding guard: Incomplete onboarding - profile: ${profileComplete}, resume: ${resumeUploaded}`);
        return res.status(403).json({
          statusCode: 403,
          message: 'Onboarding must be completed first',
          required: {
            profileComplete,
            resumeUploaded,
            analysisComplete
          }
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

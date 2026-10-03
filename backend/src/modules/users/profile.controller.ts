import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthRequest } from '../../auth/auth.middleware';
import { z } from 'zod';
import { analysisQueue } from '../../workers/queue';
import { validateOnboardingProfile, getOnboardingProgress } from '../../services/onboarding.service';

const profileSchema = z.object({
  targetRole: z.string().min(1, 'Target role is required').max(100),
  targetIndustry: z.string().min(1, 'Target industry is required').max(100),
  experienceLevel: z.string().min(1, 'Experience level is required').max(100),
  skills: z.array(z.string().min(1).max(50)).min(1, 'At least one skill required').max(20, 'Maximum 20 skills'),
  academicProjectSummary: z.string().max(1000).optional()
});

export const upsertProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = profileSchema.parse(req.body);
    const userId = req.user!.id;

    const profile = await prisma.userProfile.upsert({
      where: { user_id: userId },
      update: {
        target_role: data.targetRole,
        target_industry: data.targetIndustry,
        experience_level: data.experienceLevel,
        skills: data.skills,
        academic_project_summary: data.academicProjectSummary,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        target_role: data.targetRole,
        target_industry: data.targetIndustry,
        experience_level: data.experienceLevel,
        skills: data.skills,
        academic_project_summary: data.academicProjectSummary
      }
    });

    const latestResume = await prisma.resume.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    if (latestResume) {
      await analysisQueue.add('profile-analysis', { userId, resumeId: latestResume.id }, {
        priority: 10,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86400 }
      });
    }

    const isProfileValid = await validateOnboardingProfile(userId);
    res.status(200).json({ 
      profile, 
      analysisQueued: Boolean(latestResume),
      onboardingComplete: isProfileValid && Boolean(latestResume)
    });
  } catch (err) {
    next(err);
  }
};

export const getOnboardingStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const progress = await getOnboardingProgress(userId);
    res.json(progress);
  } catch (err) {
    next(err);
  }
};

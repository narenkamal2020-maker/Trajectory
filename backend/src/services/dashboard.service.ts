import { prisma } from '../config/prisma';
import { CacheService } from './cache.service';
import { logger } from '../config/logger';

export const buildDashboardOverview = async (userId: string) => {
  const cached = await CacheService.getDashboard(userId);
  if (cached) {
    logger.debug(`Dashboard cache hit for user ${userId}`);
    return cached;
  }

  logger.info(`Building fresh dashboard for user ${userId}`);

  const [profile, latestResume, user, applications, interviews] = await Promise.all([
    prisma.userProfile.findUnique({ where: { user_id: userId } }),
    prisma.resume.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'desc' } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.application.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 100 }),
    prisma.mockInterview.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 50 })
  ]);

  if (!profile || !latestResume || !user) {
    logger.warn(`Onboarding required for user ${userId}: profile=${Boolean(profile)}, resume=${Boolean(latestResume)}`);
    return { requiresOnboarding: true };
  }

  const atsScore = latestResume.ats_score ?? 0;
  const actionableSuggestions = latestResume.actionable_suggestions ?? {
    resumeFixes: [
      'We are still analyzing your resume. Please check back shortly for tailored recommendations.'
    ],
    profileMilestones: [
      'Complete your onboarding details to unlock your personalized launch plan.'
    ]
  };
  const personalizedQuestions = latestResume.personalized_questions ?? [
    'Tell me about your most recent technical project and the tradeoffs you made.'
  ];

  const applicationsByStage = applications.reduce((acc: any, app) => {
    acc[app.stage] = (acc[app.stage] || 0) + 1;
    return acc;
  }, {});

  const overview = {
    requiresOnboarding: false,
    user: { name: user.name, email: user.email },
    careerBlueprint: {
      targetRole: profile.target_role,
      targetIndustry: profile.target_industry,
      experienceLevel: profile.experience_level,
      skills: profile.skills,
      atsCompatibilityScore: atsScore,
      metricsSummary: atsScore > 75 ? 'Ready for technical pipeline' : 'Needs resume optimization'
    },
    actionableSuggestions,
    personalizedQuestions,
    pipelineMetrics: {
      totalApplications: applications.length,
      applicationsByStage,
      interviewsCompleted: interviews.length,
      bestScore: interviews.length > 0 ? Math.max(...interviews.map((i: any) => i.overall_score || 0)) : null,
      averageScore: interviews.length > 0
        ? (interviews.reduce((sum: number, i: any) => sum + (i.overall_score || 0), 0) / interviews.length).toFixed(1)
        : null
    },
    generatedAt: new Date().toISOString()
  };

  await CacheService.setDashboard(userId, overview);
  logger.info(`Dashboard cached for user ${userId}`);

  return overview;
};

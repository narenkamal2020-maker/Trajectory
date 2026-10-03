import { prisma } from '../config/prisma';

export interface OnboardingProgress {
  userId: string;
  isComplete: boolean;
  profileComplete: boolean;
  resumeUploaded: boolean;
  profileData?: {
    targetRole: string;
    targetIndustry: string;
    experienceLevel: string;
    skillsCount: number;
  };
  resumeAnalysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  nextStep: string;
}

export const validateOnboardingProfile = async (userId: string): Promise<boolean> => {
  const profile = await prisma.userProfile.findUnique({
    where: { user_id: userId }
  });

  if (!profile) return false;
  if (!profile.target_role || !profile.target_industry || !profile.experience_level) return false;
  if (!profile.skills || profile.skills.length === 0) return false;

  return true;
};

export const getOnboardingProgress = async (userId: string): Promise<OnboardingProgress> => {
  const [profile, latestResume] = await Promise.all([
    prisma.userProfile.findUnique({ where: { user_id: userId } }),
    prisma.resume.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'desc' } })
  ]);

  const profileComplete = profile && profile.target_role && profile.target_industry && profile.experience_level && profile.skills?.length > 0;
  const resumeUploaded = Boolean(latestResume);
  const isComplete = profileComplete && resumeUploaded && latestResume?.ats_score !== null;

  let resumeAnalysisStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
  if (latestResume) {
    if (latestResume.ats_score !== null) {
      resumeAnalysisStatus = 'completed';
    } else {
      resumeAnalysisStatus = 'processing';
    }
  }

  return {
    userId,
    isComplete,
    profileComplete: Boolean(profileComplete),
    resumeUploaded,
    profileData: profileComplete
      ? {
          targetRole: profile!.target_role,
          targetIndustry: profile!.target_industry,
          experienceLevel: profile!.experience_level,
          skillsCount: profile!.skills?.length || 0
        }
      : undefined,
    resumeAnalysisStatus,
    nextStep: !profileComplete
      ? 'Complete your professional profile with target role, industry, experience level, and key skills.'
      : !resumeUploaded
      ? 'Upload your resume to unlock AI-powered career insights.'
      : resumeAnalysisStatus === 'processing'
      ? 'Your resume is being analyzed. Check back in a few moments for personalized recommendations.'
      : 'Your onboarding is complete! View your career dashboard and start your journey.'
  };
};

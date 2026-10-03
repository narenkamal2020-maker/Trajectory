export interface OnboardingFlowState {
  profileComplete: boolean;
  resumeUploaded: boolean;
  aiAnalysisComplete: boolean;
  dashboardReady: boolean;
}

export interface DashboardResponse {
  requiresOnboarding: boolean;
  user: { name: string; email: string };
  careerBlueprint: {
    targetRole: string;
    targetIndustry: string;
    experienceLevel: string;
    atsCompatibilityScore: number;
    metricsSummary: string;
  };
  actionableSuggestions: {
    resumeFixes: string[];
    profileMilestones: string[];
  };
  personalizedQuestions: string[];
  pipelineMetrics?: {
    totalApplications: number;
    applicationsByStage: Record<string, number>;
    interviewsCompleted: number;
    bestScore: number | null;
  };
  generatedAt: string;
}

export interface OnboardingStatusResponse {
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
  resumeAnalysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  nextStep: string;
}

export interface QueueJobPayload {
  userId: string;
  resumeId?: string;
}

export interface LLMAnalysisOutput {
  atsScore: number;
  detectedGaps: string[];
  actionableSuggestions: string[];
  personalizedQuestions: string[];
}

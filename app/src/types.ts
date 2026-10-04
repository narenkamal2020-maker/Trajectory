export type NavigationTab = 
  | 'overview' 
  | 'practice' 
  | 'interview' 
  | 'resume' 
  | 'applications' 
  | 'settings';

export interface UserSkillProficiency {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 0 - 100
  attempts: number;
  correct: number;
  lastPracticed?: string;
}

export interface QuestionItem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  solveRate: number;
  avgTimeSec: number;
  solved: boolean;
  description: string;
  hints: string[];
  starterCode: {
    typescript: string;
    python: string;
  };
  sampleCases: Array<{
    input: string;
    expected: string;
  }>;
}

export interface ApplicationItem {
  id: string;
  company: string;
  role: string;
  stage: 'APPLIED' | 'OA' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED';
  salaryPackage?: string;
  appliedDate: string;
  reminderDate?: string;
  notes?: string;
}

export interface InterviewSession {
  id: string;
  type: 'TECHNICAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL' | 'DSA';
  jobProfile: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  overallScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  problemSolvingScore?: number;
  durationSec?: number;
  messages: Array<{
    role: 'SYSTEM' | 'INTERVIEWER' | 'USER';
    content: string;
    evalFeedback?: string;
  }>;
}

/** API response types (mirror backend/src/services/*). */

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Language = 'javascript' | 'python' | 'sql';
export type Verdict = 'ACCEPTED' | 'WRONG' | 'PARTIAL' | 'TLE' | 'ERROR';
export type Stage = 'APPLIED' | 'OA' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED';
export type InterviewType = 'TECHNICAL' | 'DSA' | 'SQL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'ROLE_SPECIFIC';

export interface User { id: string; email: string; name: string; avatarUrl: string | null; role: 'USER' | 'ADMIN'; createdAt: string }

export interface AuthResponse { accessToken: string; refreshToken?: string; user: User; requiresOnboarding: boolean }

export interface Profile {
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

export interface Recommendation {
  id: string;
  type: 'QUESTION' | 'TOPIC' | 'INTERVIEW' | 'RESOURCE' | 'RESUME' | 'CAREER';
  entityId: string | null;
  title: string;
  reason: string;
  score: number;
  source: 'rules' | 'ml';
}

export interface Waypoint {
  skillId: string; skillName: string; categoryName?: string; required: number; current: number; gap: number; importance: number; cleared: boolean;
}

export interface Milestone { id: string; label: string; done: boolean; detail: string }

export interface DashboardOverview {
  user: { name: string; email: string } | null;
  readinessPercentage: number;
  trajectoryVelocityDays: number | null;
  currentRole: string;
  targetRole: string;
  clearedWaypointsCount: number;
  totalWaypointsCount: number;
  solvedProblemsCount: number;
  streakDays: number;
  topPercentile: number;
  techSkillsScore: number;
  mockScore: number;
  codeVelocityMinutes: number | null;
  systemDesignScore: number;
  accuracy: number;
  submissions: number;
  interviewsCompleted: number;
  bestInterviewScore: number | null;
  atsScore: number | null;
  resumeStatus: string | null;
  applicationsCount: number;
  nextWaypoints: Waypoint[];
  milestones: Milestone[];
  recommendations: Recommendation[];
  recommendationEngine: 'rules' | 'rules+ml';
  recentActivity: Array<{ kind: 'SUBMISSION' | 'INTERVIEW' | 'RESUME'; title: string; detail: string; at: string | null }>;
}

export interface QuestionListItem {
  id: string; title: string; difficulty: Difficulty; categoryId: string; categoryName: string; type: 'CODE' | 'SQL';
  tags: string[]; skillIds: string[]; solveRate: number | null; totalAttempts: number; status: 'solved' | 'attempted' | 'todo'; myAttempts: number;
}

export interface QuestionList {
  items: QuestionListItem[];
  counts: { total: number; solved: number; byDifficulty: Record<Difficulty, number> };
}

export interface QuestionDetail {
  id: string; title: string; description: string; difficulty: Difficulty; type: 'CODE' | 'SQL';
  categoryId: string; categoryName: string; tags: string[]; constraints: string | null;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  hints: string[]; timeLimitMs: number; solveRate: number | null; totalAttempts: number;
  starterCode: Partial<Record<Language, string>>;
  languages: Language[];
  signature: { functionName: string; params: Array<{ name: string; type: string }>; returnType: string } | null;
  schema: string | null;
  skills: Array<{ id: string; name: string; weight: number }>;
  sampleTests: Array<{ id: string; args: unknown[] | null; expected: unknown }>;
  hiddenTestCount: number;
  mySubmissions: Array<{ id: string; language: Language; status: Verdict; passed: number; total: number; submittedAt: string }>;
}

export interface CaseResult {
  caseId: string; status: 'PASS' | 'FAIL' | 'ERROR' | 'TLE'; timeMs: number; hidden: boolean;
  input?: string; expected?: string; actual?: string; error?: string;
}

export interface ExecutionResult {
  verdict: Verdict; passed: number; total: number; executionTimeMs: number; cases: CaseResult[]; stdout: string; compileError?: string;
}

export interface SubmitResult extends ExecutionResult {
  submissionId: string;
  firstSolve: boolean;
  skillDeltas: Array<{ skillId: string; name: string; before: number; after: number; delta: number }>;
  duplicate?: boolean;
  /** Set when the submission was queued offline. */
  queued?: boolean;
}

export interface SkillView {
  skillId: string; name: string; categoryId: string; categoryName: string; proficiency: number; attempts: number; correct: number;
  lastPracticed: string | null; band: 'novice' | 'developing' | 'proficient' | 'expert';
}

export interface ConstellationNode {
  id: string; name: string; categoryId: string; categoryName: string; currentLevel: number; targetLevel: number | null;
  importance: number | null; attempts: number; correct: number; lastPracticed: string | null; status: 'verified' | 'delta' | 'locked' | 'exceeds' | 'practiced';
}

export interface Career {
  targetRole: { id: string; title: string; level: string | null } | null;
  currentRole: string | null;
  readiness: number;
  waypoints: Waypoint[];
  clearedWaypoints: number;
  totalWaypoints: number;
  remainingGap: number;
  velocityPerDay: number | null;
  etaDays: number | null;
  adjacentRoles: Array<{ roleId: string; title: string; readiness: number; cleared: number; total: number }>;
  milestones: Milestone[];
  roleFit: Array<{ role: string; probability: number }> | null;
  history: Array<{ date: string; remainingGap: number }>;
}

export interface AnswerFeedback {
  technical: number; communication: number; problemSolving: number; overall: number; coverage: number;
  matchedConcepts: string[]; missedConcepts: string[]; strengths: string[]; improvements: string[]; needsFollowUp: boolean; source: 'rules' | 'llm';
}

export interface Telemetry { distributedDepth: number; adversarialDefenseStability: number; articulationAndPacing: number }

export interface InterviewSummary {
  technical: number; communication: number; problemSolving: number; overall: number;
  strengths: string[]; improvements: string[]; durationSec: number; questionsAnswered: number; totalQuestions: number; verdict: string;
}

export interface InterviewStart {
  interviewId: string; type: InterviewType; intro: string; question: string; questionNumber: number; totalQuestions: number; evaluator: string; telemetry: Telemetry;
}

export interface InterviewReply {
  feedback: AnswerFeedback; reply: string; done: boolean; questionNumber: number; totalQuestions: number; isFollowUp: boolean;
  telemetry: Telemetry; summary: InterviewSummary | null;
}

export interface InterviewListItem {
  id: string; type: InterviewType; jobProfile: string | null; status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  overall: number | null; communication: number | null; technical: number | null; problemSolving: number | null;
  durationSec: number | null; createdAt: string; completedAt: string | null;
}

export interface InterviewDetail {
  id: string; type: InterviewType; status: InterviewListItem['status']; jobProfile: string | null;
  questionNumber: number; totalQuestions: number; summary: InterviewSummary | null;
  messages: Array<{ role: 'SYSTEM' | 'INTERVIEWER' | 'USER'; content: string; feedback: AnswerFeedback | null; createdAt: string }>;
  telemetry: Telemetry;
}

export interface ResumeView {
  id: string; fileName: string; status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; atsScore: number | null;
  breakdown: Array<{ check: string; score: number; max: number; detail: string }>;
  parsed: {
    contact: { email: string | null; phone: string | null; links: string[] };
    sections: string[]; skills: Array<{ skillId: string; label: string }>; experienceMonths: number;
    education: { degree: string | null; gpa: string | null };
    bullets: { total: number; quantified: number; strongVerb: number; weakPhrases: number; avgWords: number };
    wordCount: number;
  } | null;
  roleFit: Array<{ role: string; probability: number }> | null;
  targetRole: string | null;
  gaps: string[]; suggestions: string[]; interviewQuestions: string[]; createdAt: string; updatedAt: string;
}

export interface Application {
  id: string; company: string; role: string; stage: Stage; salaryPackage: string | null; jobDescription: string | null;
  appliedDate: string | null; reminderDate: string | null; notes: string | null; updatedAt: string;
}

export interface Analytics {
  totals: { submissions: number; accepted: number; solved: number; accuracy: number; avgSolveSeconds: number | null; streakDays: number; longestStreak: number };
  timeline: Array<{ date: string; solved: number; accuracy: number | null; readiness: number | null; avgProficiency: number }>;
  heatmap: Array<{ date: string; submissions: number; accepted: number }>;
  byCategory: Array<{ categoryId: string; name: string; avgProficiency: number; skills: number }>;
  byDifficulty: Array<{ difficulty: Difficulty; solved: number; attempted: number; available: number }>;
  languages: Array<{ language: Language; submissions: number }>;
  interviews: Array<{ id: string; type: InterviewType; overall: number; communication: number; technical: number; problemSolving: number; completedAt: string }>;
  pipeline: { totalApplications: number; applicationsByStage: Record<Stage, number>; funnel: Array<{ stage: string; count: number; rate: number }> };
}

export interface OfflineQuestion extends QuestionListItem {
  description: string; constraints: string | null; hints: string[]; examples: QuestionDetail['examples'];
  starterCode: QuestionDetail['starterCode']; timeLimitMs: number; meta: unknown;
  sampleTests: Array<{ id: string; args?: unknown[]; expected: unknown; hidden?: boolean }>; hiddenTestCount: number;
}

export interface DownloadItem {
  platform: 'android' | 'windows' | 'mac' | 'linux';
  file: string; sizeBytes: number; version: string | null; updatedAt: string; url: string;
}

// ── Admin ──
export interface AdminStats { users: number; newUsers7d: number; activeUsers7d: number; submissions: number; interviews: number; resumes: number; questions: number; topics: number; skills: number }
export interface AdminUserRow {
  id: string; email: string; name: string; role: 'USER' | 'ADMIN'; active: boolean; targetRole: string | null; experienceLevel: string | null;
  solved: number; submissions: number; interviews: number; createdAt: string; lastActive: string | null;
}
export interface AdminUserDetail {
  id: string; email: string; name: string; role: 'USER' | 'ADMIN'; active: boolean; createdAt: string | null;
  profile: { targetRole: string | null; experienceLevel: string | null; targetIndustry: string | null; githubUrl: string | null; linkedinUrl: string | null };
  skills: Array<{ name: string; proficiency: number; attempts: number }>;
  recentSubmissions: Array<{ title: string; status: Verdict; language: Language; at: string | null }>;
  interviews: Array<{ type: InterviewType; status: string; overall: number | null; at: string | null }>;
  resume: { fileName: string; atsScore: number | null; status: string; at: string | null } | null;
}
export interface AdminTopic {
  id: string; name: string; parentId: string | null; icon: string | null; order: number; questions: number;
  skills: Array<{ id: string; name: string; description: string | null; questions: number }>;
}
export interface AdminQuestionRow {
  id: string; title: string; difficulty: Difficulty; type: 'CODE' | 'SQL'; categoryId: string; categoryName: string; active: boolean;
  attempts: number; solveRate: number | null; tests: number; source: 'admin' | 'bank'; updatedAt: string | null;
}
export type ValueType = 'int' | 'float' | 'bool' | 'string' | 'int[]' | 'string[]' | 'int[][]' | 'string[][]' | 'ListNode' | 'TreeNode';
export interface AdminQuestionInput {
  title: string; description: string; difficulty: Difficulty; categoryId: string; type: 'CODE' | 'SQL';
  tags: string[]; hints: string[]; constraints?: string | null; timeLimitMs: number;
  skills: Array<{ skillId: string; weight: number }>;
  code?: { functionName: string; params: Array<{ name: string; type: ValueType }>; returnType: ValueType; compare: 'exact' | 'unordered' | 'unorderedNested' | 'float' };
  sql?: { setup: string; orderMatters: boolean };
  tests: Array<{ args?: unknown[]; expected: unknown; hidden: boolean }>;
  reference: { language: Language; code: string };
}
export interface AdminQuestionFull extends Omit<AdminQuestionInput, 'reference'> { id: string; active: boolean; reference: { language: Language; code: string } | null }

export interface AdminAudit {
  last24h: { INFO: number; WARN: number; ALERT: number };
  items: Array<{ id: string; action: string; severity: 'INFO' | 'WARN' | 'ALERT'; actorId: string | null; actorEmail: string | null; targetType: string | null; targetId: string | null; ip: string | null; details: unknown; createdAt: string }>;
}
export interface AdminMessage { id: string; userId: string | null; name: string; email: string; topic: string; message: string; status: 'NEW' | 'READ' | 'CLOSED'; createdAt: string }
export interface SiteAnalytics {
  days: number;
  totals: { events: number; sessions: number; pageViews: number; signups: number };
  topPages: Array<{ path: string; views: number }>;
  topEvents: Array<{ name: string; count: number }>;
  sources: Array<{ source: string; medium: string; campaign: string; sessions: number }>;
  signupsBySource: Array<{ source: string; count: number }>;
  daily: Array<{ date: string; views: number; sessions: number }>;
}

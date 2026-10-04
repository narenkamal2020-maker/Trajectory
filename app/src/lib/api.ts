import { getServerUrl, isNativeShell, loadRefreshToken, saveRefreshToken } from './platform';
import type * as T from './types';

export class ApiError extends Error {
  status: number;
  fields?: Array<{ field: string; message: string }>;
  details?: any;
  constructor(status: number, message: string, fields?: Array<{ field: string; message: string }>, details?: unknown) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.details = details;
  }
  /** True when the request never reached the server (offline, DNS, CORS, server down). */
  get isNetwork() { return this.status === 0; }
}

type AuthListener = (state: { user: T.User | null; requiresOnboarding: boolean }) => void;

class ApiClient {
  private accessToken: string | null = null;
  private refreshing: Promise<boolean> | null = null;
  private listeners = new Set<AuthListener>();

  onAuthChange(fn: AuthListener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(user: T.User | null, requiresOnboarding = false) { this.listeners.forEach((l) => l({ user, requiresOnboarding })); }

  get base() { return getServerUrl(); }
  get hasSession() { return !!this.accessToken; }

  private headers(extra?: HeadersInit): Headers {
    const h = new Headers(extra);
    if (this.accessToken) h.set('Authorization', `Bearer ${this.accessToken}`);
    if (isNativeShell()) h.set('x-client-type', 'native');
    return h;
  }

  private async raw(path: string, init: RequestInit = {}): Promise<Response> {
    try {
      return await fetch(`${this.base}${path}`, { ...init, credentials: 'include', headers: this.headers(init.headers) });
    } catch {
      throw new ApiError(0, 'Cannot reach the Trajectory server. Check your connection.');
    }
  }

  private async parse<R>(res: Response): Promise<R> {
    if (res.status === 204) return undefined as R;
    const text = await res.text();
    const body = text ? JSON.parse(text) : undefined;
    if (!res.ok) throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`, body?.errors, body?.details);
    return body as R;
  }

  async request<R>(path: string, init: RequestInit = {}, retry = true): Promise<R> {
    const res = await this.raw(path, init);
    if (res.status === 401 && retry && !path.startsWith('/auth/')) {
      if (await this.refresh()) return this.request<R>(path, init, false);
      this.accessToken = null;
      this.emit(null);
    }
    return this.parse<R>(res);
  }

  private json<R>(path: string, method: string, body?: unknown) {
    return this.request<R>(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  }

  // ── Session ──
  private async adopt(res: T.AuthResponse) {
    this.accessToken = res.accessToken;
    if (res.refreshToken) await saveRefreshToken(res.refreshToken);
    this.emit(res.user, res.requiresOnboarding);
    return res;
  }

  /** Single-flight refresh: concurrent 401s share one refresh request. */
  refresh(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = (async () => {
        try {
          const stored = await loadRefreshToken();
          const res = await this.raw('/auth/refresh', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stored ? { refreshToken: stored } : {}),
          });
          if (!res.ok) { await saveRefreshToken(null); return false; }
          await this.adopt(await res.json());
          return true;
        } catch {
          return false;
        } finally {
          setTimeout(() => { this.refreshing = null; }, 0);
        }
      })();
    }
    return this.refreshing;
  }

  async login(email: string, password: string) {
    return this.adopt(await this.parse<T.AuthResponse>(await this.raw('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    })));
  }

  async register(name: string, email: string, password: string, attribution?: Record<string, string | undefined>) {
    return this.adopt(await this.parse<T.AuthResponse>(await this.raw('/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, attribution }),
    })));
  }

  // ── Public ──
  contact(m: { name: string; email: string; topic: string; message: string; website?: string }) { return this.json<{ id: string }>('/contact', 'POST', m); }

  async logout() {
    const stored = await loadRefreshToken();
    try {
      await this.raw('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stored ? { refreshToken: stored } : {}) });
    } catch { /* offline logout still clears local state */ }
    this.accessToken = null;
    await saveRefreshToken(null);
    this.emit(null);
  }

  me() { return this.request<{ user: T.User; requiresOnboarding: boolean; hasResume: boolean }>('/auth/me'); }
  changePassword(currentPassword: string, newPassword: string) { return this.json<void>('/auth/change-password', 'POST', { currentPassword, newPassword }); }
  // ── Admin ──
  admin = {
    stats: () => this.request<T.AdminStats>('/admin/stats'),
    audit: (p: { severity?: string; action?: string } = {}) => {
      const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as Array<[string, string]>).toString();
      return this.request<T.AdminAudit>(`/admin/audit${qs ? `?${qs}` : ''}`);
    },
    messages: () => this.request<T.AdminMessage[]>('/admin/messages'),
    setMessageStatus: (id: string, status: 'NEW' | 'READ' | 'CLOSED') => this.json<void>(`/admin/messages/${id}`, 'PATCH', { status }),
    siteAnalytics: (days = 30) => this.request<T.SiteAnalytics>(`/admin/analytics?days=${days}`),
    users: (p: { search?: string; role?: string; status?: string; page?: number }) => {
      const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();
      return this.request<{ total: number; page: number; pageSize: number; items: T.AdminUserRow[] }>(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    user: (id: string) => this.request<T.AdminUserDetail>(`/admin/users/${id}`),
    updateUser: (id: string, patch: { role?: 'USER' | 'ADMIN'; active?: boolean }) => this.json<T.AdminUserDetail>(`/admin/users/${id}`, 'PATCH', patch),
    topics: () => this.request<T.AdminTopic[]>('/admin/topics'),
    createTopic: (t: { name: string; parentId?: string | null }) => this.json<{ id: string }>('/admin/topics', 'POST', t),
    renameTopic: (id: string, name: string) => this.json<void>(`/admin/topics/${id}`, 'PATCH', { name }),
    deleteTopic: (id: string) => this.json<void>(`/admin/topics/${id}`, 'DELETE'),
    createSkill: (s: { categoryId: string; name: string; description?: string }) => this.json<{ id: string }>('/admin/skills', 'POST', s),
    deleteSkill: (id: string) => this.json<void>(`/admin/skills/${id}`, 'DELETE'),
    questions: (p: { search?: string; categoryId?: string; status?: string } = {}) => {
      const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as Array<[string, string]>).toString();
      return this.request<T.AdminQuestionRow[]>(`/admin/questions${qs ? `?${qs}` : ''}`);
    },
    question: (id: string) => this.request<T.AdminQuestionFull>(`/admin/questions/${id}`),
    validate: (q: T.AdminQuestionInput) => this.json<T.ExecutionResult>('/admin/questions/validate', 'POST', q),
    createQuestion: (q: T.AdminQuestionInput) => this.json<{ id: string }>('/admin/questions', 'POST', q),
    updateQuestion: (id: string, q: T.AdminQuestionInput) => this.json<{ id: string }>(`/admin/questions/${id}`, 'PUT', q),
    setQuestionActive: (id: string, active: boolean) => this.json<void>(`/admin/questions/${id}`, 'PATCH', { active }),
    importQuestions: (questions: unknown[]) =>
      this.json<{ imported: number; failed: number; results: Array<{ index: number; title: string | null; ok: boolean; id?: string; error?: string }> }>('/admin/questions/import', 'POST', { questions }),
  };

  // ── App downloads (public) ──
  downloads() { return this.request<T.DownloadItem[]>('/downloads'); }
  /** Absolute URL for a download, valid in the browser and in the native shells. */
  downloadUrl(item: T.DownloadItem) { return /^https:\/\//.test(item.url) ? item.url : this.base.replace(/\/api$/, '') + item.url; }

  health() { return this.request<{ status: string; time: string }>('/health'); }
  /** Admin-only engine details (database / ML service / LLM provider). */
  systemStatus() { return this.request<{ status: string; database: string; ml: string; llm: string }>('/admin/system'); }

  // ── Profile ──
  profile() { return this.request<T.Profile | null>('/profile'); }
  saveProfile(p: { targetRole: string; experienceLevel: string; targetIndustry?: string; bio?: string; githubUrl?: string; linkedinUrl?: string; skills?: string[] }) {
    return this.json<T.Profile>('/profile', 'PUT', p);
  }
  roles() { return this.request<Array<{ id: string; title: string; level: string | null; skills: number }>>('/catalog/roles'); }
  categories() { return this.request<Array<{ id: string; name: string; parentId: string | null }>>('/catalog/categories'); }

  // ── Dashboard / career / analytics ──
  dashboard() { return this.request<T.DashboardOverview>('/dashboard/overview'); }
  career() { return this.request<T.Career>('/career/trajectory'); }
  analytics(days = 30) { return this.request<T.Analytics>(`/analytics/overview?days=${days}`); }
  skills() { return this.request<T.SkillView[]>('/skills'); }
  constellation() { return this.request<{ targetRole: string | null; readiness: number; nodes: T.ConstellationNode[] }>('/skills/constellation'); }
  recommendations() { return this.request<{ items: T.Recommendation[]; engine: string }>('/recommendations'); }
  dismissRecommendation(id: string) { return this.json<void>(`/recommendations/${id}/dismiss`, 'POST'); }
  clickRecommendation(id: string) { return this.json<void>(`/recommendations/${id}/click`, 'POST').catch(() => undefined); }

  // ── Practice ──
  questions(params: Record<string, string | undefined> = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as Array<[string, string]>).toString();
    return this.request<T.QuestionList>(`/questions${qs ? `?${qs}` : ''}`);
  }
  question(id: string) { return this.request<T.QuestionDetail>(`/questions/${id}`); }
  offlineBundle() { return this.request<{ version: string; questions: T.OfflineQuestion[] }>('/questions/offline-bundle'); }
  run(id: string, language: T.Language, code: string) { return this.json<T.ExecutionResult>(`/questions/${id}/run`, 'POST', { language, code }); }
  submit(id: string, body: { language: T.Language; code: string; usedHint?: boolean; timeTakenSec?: number; clientSubmissionId?: string }) {
    return this.json<T.SubmitResult>(`/questions/${id}/submit`, 'POST', body);
  }
  sync(submissions: Array<{ clientSubmissionId: string; questionId: string; language: T.Language; code: string; usedHint?: boolean; timeTakenSec?: number }>) {
    return this.json<{ results: Array<{ clientSubmissionId: string; ok: boolean; verdict?: T.Verdict; duplicate?: boolean; error?: string }> }>('/practice/sync', 'POST', { submissions });
  }
  submissions(limit = 30) {
    return this.request<Array<{ id: string; questionId: string; title: string; difficulty: T.Difficulty; language: T.Language; status: T.Verdict; passed: number; total: number; submittedAt: string }>>(`/submissions?limit=${limit}`);
  }

  // ── Interviews ──
  interviewTypes() { return this.request<Array<{ type: T.InterviewType; label: string; questions: number }>>('/interviews/types'); }
  interviews() { return this.request<T.InterviewListItem[]>('/interviews'); }
  interview(id: string) { return this.request<T.InterviewDetail>(`/interviews/${id}`); }
  startInterview(type: T.InterviewType, jobProfile?: string) { return this.json<T.InterviewStart>('/interviews', 'POST', { type, jobProfile }); }
  answer(id: string, answer: string) { return this.json<T.InterviewReply>(`/interviews/${id}/respond`, 'POST', { answer }); }
  finishInterview(id: string) { return this.json<T.InterviewSummary | null>(`/interviews/${id}/finalize`, 'POST'); }

  // ── Resume ──
  uploadResume(file: File) {
    const fd = new FormData();
    fd.append('resume', file);
    return this.request<{ resumeId: string; status: string }>('/resumes', { method: 'POST', body: fd });
  }
  pasteResume(text: string) { return this.json<{ resumeId: string; status: string }>('/resumes', 'POST', { text, fileName: 'pasted-resume.txt' }); }
  latestResume() { return this.request<T.ResumeView | null>('/resumes/latest'); }
  reanalyzeResume(id: string) { return this.json<{ resumeId: string }>(`/resumes/${id}/reanalyze`, 'POST'); }

  // ── Applications ──
  applications() { return this.request<T.Application[]>('/applications'); }
  createApplication(a: Partial<T.Application> & { company: string; role: string }) { return this.json<T.Application>('/applications', 'POST', a); }
  updateApplication(id: string, a: Partial<T.Application>) { return this.json<T.Application>(`/applications/${id}`, 'PATCH', a); }
  deleteApplication(id: string) { return this.json<void>(`/applications/${id}`, 'DELETE'); }
}

export const api = new ApiClient();

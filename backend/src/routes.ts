import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { handler, userId, badRequest } from './lib/http';
import { authenticate } from './auth/auth.middleware';
import { apiLimiter, executionLimiter, uploadLimiter, interviewLimiter } from './middleware/rate-limiter.middleware';
import { ProfileService } from './services/profile.service';
import { CatalogService } from './services/catalog.service';
import { SkillService } from './services/skill.service';
import { PracticeService } from './services/practice.service';
import { InterviewService } from './services/interview.service';
import { ResumeService, extractText } from './services/resume.service';
import { ApplicationService } from './services/application.service';
import { AnalyticsService } from './services/analytics.service';
import { TrajectoryService } from './services/trajectory.service';
import { RecommendationService } from './services/recommendation.service';
import { DashboardService } from './services/dashboard.service';
import { computeReadiness } from './engine/trajectory';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(pdf|docx|txt|md)$/i.test(file.originalname) ||
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.mimetype);
    ok ? cb(null, true) : cb(new Error('UNSUPPORTED_FILE_TYPE'));
  },
});

const language = z.enum(['javascript', 'python', 'sql']);
const stage = z.enum(['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'HIRED']);
const interviewType = z.enum(['TECHNICAL', 'DSA', 'SQL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'ROLE_SPECIFIC']);
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}/).nullable().optional();
const appSchema = z.object({
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  stage: stage.optional(),
  salaryPackage: z.string().max(100).nullable().optional(),
  jobDescription: z.string().max(20000).nullable().optional(),
  appliedDate: dateStr,
  reminderDate: dateStr,
  notes: z.string().max(5000).nullable().optional(),
});

export const api = Router();
api.use(authenticate, apiLimiter);

// ── Profile & onboarding ──
api.get('/profile', handler(async (req, res) => res.json(await ProfileService.get(userId(req)))));
api.put('/profile', handler(async (req, res) => {
  const body = z.object({
    targetRole: z.string().trim().min(2).max(100),
    experienceLevel: z.string().trim().min(2).max(50),
    targetIndustry: z.string().trim().max(100).optional(),
    bio: z.string().max(2000).optional(),
    githubUrl: z.string().url().max(500).optional().or(z.literal('')),
    linkedinUrl: z.string().url().max(500).optional().or(z.literal('')),
    skills: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  }).parse(req.body);
  res.json(await ProfileService.upsert(userId(req), body));
}));
api.get('/onboarding/status', handler(async (req, res) => res.json(await ProfileService.onboardingStatus(userId(req)))));

// ── Catalog ──
api.get('/catalog/roles', handler(async (_req, res) => {
  const roles = await CatalogService.roles();
  res.json(roles.map((r) => ({ id: r.id, title: r.title, level: r.level, skills: r.requirements.length })));
}));
api.get('/catalog/categories', handler(async (_req, res) => res.json(await CatalogService.categories())));

// ── Dashboard ──
api.get('/dashboard/overview', handler(async (req, res) => res.json(await DashboardService.overview(userId(req)))));

// ── Skills ──
api.get('/skills', handler(async (req, res) => res.json(await SkillService.list(userId(req)))));
/** Skill constellation: every skill relevant to the user (target-role skills + practiced skills) with status. */
api.get('/skills/constellation', handler(async (req, res) => {
  const uid = userId(req);
  const [ready, catalog, mine] = await Promise.all([TrajectoryService.readiness(uid), CatalogService.skillMap(), SkillService.list(uid)]);
  const req_ = new Map((ready.role?.requirements ?? []).map((r) => [r.skillId, r]));
  const ids = new Set([...req_.keys(), ...mine.map((m) => m.skillId)]);
  const mineMap = new Map(mine.map((m) => [m.skillId, m]));
  const nodes = [...ids].filter((id) => catalog.has(id)).map((id) => {
    const s = catalog.get(id)!, m = mineMap.get(id), r = req_.get(id);
    const current = m?.proficiency ?? 0;
    const target = r?.minProf ?? null;
    const status = !m ? 'locked' : target === null ? 'practiced' : current >= target + 10 ? 'exceeds' : current >= target ? 'verified' : 'delta';
    return {
      id, name: s.name, categoryId: s.categoryId, categoryName: s.categoryName,
      currentLevel: Math.round(current), targetLevel: target, importance: r?.importance ?? null,
      attempts: m?.attempts ?? 0, correct: m?.correct ?? 0, lastPracticed: m?.lastPracticed ?? null, status,
    };
  });
  res.json({ targetRole: ready.role?.title ?? null, readiness: ready.readiness, nodes: nodes.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0)) });
}));

// ── Practice ──
api.get('/questions', handler(async (req, res) => {
  const q = z.object({
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(), categoryId: z.string().optional(), skillId: z.string().optional(),
    status: z.enum(['solved', 'attempted', 'todo']).optional(), search: z.string().max(100).optional(), type: z.enum(['CODE', 'SQL']).optional(),
  }).parse(req.query);
  res.json(await PracticeService.list(userId(req), q));
}));
api.get('/questions/offline-bundle', handler(async (_req, res) => res.json(await PracticeService.offlineBundle())));
api.get('/questions/:id', handler(async (req, res) => res.json(await PracticeService.detail(userId(req), req.params.id))));
api.post('/questions/:id/run', executionLimiter, handler(async (req, res) => {
  const body = z.object({ language, code: z.string().min(1).max(50_000) }).parse(req.body);
  res.json(await PracticeService.run(req.params.id, body.language, body.code));
}));
api.post('/questions/:id/submit', executionLimiter, handler(async (req, res) => {
  const body = z.object({
    language, code: z.string().min(1).max(50_000), usedHint: z.boolean().optional(),
    timeTakenSec: z.number().min(0).max(86400).optional(), clientSubmissionId: z.string().max(64).optional(),
  }).parse(req.body);
  res.json(await PracticeService.submit(userId(req), req.params.id, body.language, body.code, body));
}));
api.post('/practice/sync', executionLimiter, handler(async (req, res) => {
  const body = z.object({
    submissions: z.array(z.object({
      clientSubmissionId: z.string().min(8).max(64), questionId: z.string(), language, code: z.string().min(1).max(50_000),
      usedHint: z.boolean().optional(), timeTakenSec: z.number().min(0).max(86400).optional(),
    })).max(50),
  }).parse(req.body);
  res.json(await PracticeService.sync(userId(req), body.submissions));
}));
api.get('/submissions', handler(async (req, res) => res.json(await PracticeService.history(userId(req), Number(req.query.limit ?? 30)))));
api.get('/submissions/:id', handler(async (req, res) => res.json(await PracticeService.submissionDetail(userId(req), req.params.id))));

// ── Recommendations ──
api.get('/recommendations', handler(async (req, res) => res.json(await RecommendationService.list(userId(req)))));
api.post('/recommendations/:id/dismiss', handler(async (req, res) => { await RecommendationService.dismiss(userId(req), req.params.id); res.status(204).end(); }));
api.post('/recommendations/:id/click', handler(async (req, res) => { await RecommendationService.recordClick(userId(req), req.params.id); res.status(204).end(); }));

// ── Interviews ──
api.get('/interviews/types', handler(async (_req, res) => res.json(InterviewService.types())));
api.get('/interviews', handler(async (req, res) => res.json(await InterviewService.list(userId(req)))));
api.post('/interviews', interviewLimiter, handler(async (req, res) => {
  const body = z.object({ type: interviewType, jobProfile: z.string().max(200).optional() }).parse(req.body);
  res.status(201).json(await InterviewService.start(userId(req), body.type, body.jobProfile));
}));
api.get('/interviews/:id', handler(async (req, res) => res.json(await InterviewService.detail(userId(req), req.params.id))));
api.post('/interviews/:id/respond', interviewLimiter, handler(async (req, res) => {
  const body = z.object({ answer: z.string().trim().min(1, 'Answer cannot be empty').max(20000) }).parse(req.body);
  res.json(await InterviewService.respond(userId(req), req.params.id, body.answer));
}));
api.post('/interviews/:id/finalize', handler(async (req, res) => res.json(await InterviewService.finalize(userId(req), req.params.id))));

// ── Resumes ──
api.post('/resumes', uploadLimiter, upload.single('resume'), handler(async (req, res) => {
  let text: string, fileName: string;
  if (req.file) {
    text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    fileName = req.file.originalname;
  } else {
    const body = z.object({ text: z.string().min(1).max(200_000), fileName: z.string().max(255).optional() }).parse(req.body);
    text = body.text; fileName = body.fileName ?? 'pasted-resume.txt';
  }
  res.status(202).json(await ResumeService.submit(userId(req), { text, fileName }));
}));
api.get('/resumes', handler(async (req, res) => res.json(await ResumeService.history(userId(req)))));
api.get('/resumes/latest', handler(async (req, res) => res.json(await ResumeService.latest(userId(req)))));
api.get('/resumes/:id', handler(async (req, res) => res.json(await ResumeService.get(userId(req), req.params.id))));
api.post('/resumes/:id/reanalyze', uploadLimiter, handler(async (req, res) => res.status(202).json(await ResumeService.reanalyze(userId(req), req.params.id))));

// ── Applications ──
api.get('/applications', handler(async (req, res) => res.json(await ApplicationService.list(userId(req)))));
api.post('/applications', handler(async (req, res) => res.status(201).json(await ApplicationService.create(userId(req), appSchema.parse(req.body)))));
api.patch('/applications/:id', handler(async (req, res) => res.json(await ApplicationService.update(userId(req), req.params.id, appSchema.partial().parse(req.body)))));
api.delete('/applications/:id', handler(async (req, res) => { await ApplicationService.remove(userId(req), req.params.id); res.status(204).end(); }));

// ── Career & analytics ──
api.get('/career/trajectory', handler(async (req, res) => res.json(await TrajectoryService.career(userId(req)))));
api.get('/career/roles/:roleId', handler(async (req, res) => {
  const roles = await CatalogService.roles();
  const role = roles.find((r) => r.id === req.params.roleId);
  if (!role) throw badRequest('Unknown role');
  const prof = await SkillService.proficiencyMap(userId(req));
  res.json({ role: { id: role.id, title: role.title, level: role.level }, ...computeReadiness(role.requirements, prof) });
}));
api.get('/analytics/overview', handler(async (req, res) => {
  const days = z.coerce.number().int().min(7).max(365).default(30).parse(req.query.days ?? 30);
  res.json(await AnalyticsService.overview(userId(req), days));
}));

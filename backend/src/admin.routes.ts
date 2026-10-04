import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from './auth/auth.middleware';
import { requireAdmin } from './auth/admin';
import { apiLimiter } from './middleware/rate-limiter.middleware';
import { handler, userId } from './lib/http';
import { AdminService, questionInput } from './services/admin.service';
import { InsightsService } from './services/insights.service';
import { audit } from './lib/audit';

export const adminRouter = Router();
adminRouter.use(authenticate, apiLimiter, requireAdmin);

adminRouter.get('/stats', handler(async (_req, res) => res.json(await AdminService.stats())));

// ── Users ──
adminRouter.get('/users', handler(async (req, res) => {
  const q = z.object({
    search: z.string().max(100).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(5).max(100).default(25),
  }).parse(req.query);
  res.json(await AdminService.users(q));
}));
adminRouter.get('/users/:id', handler(async (req, res) => res.json(await AdminService.user(req.params.id))));
adminRouter.patch('/users/:id', handler(async (req, res) => {
  const body = z.object({ role: z.enum(['USER', 'ADMIN']).optional(), active: z.boolean().optional() })
    .refine((b) => b.role !== undefined || b.active !== undefined, 'Nothing to update').parse(req.body);
  const updated = await AdminService.updateUser(userId(req), req.params.id, body);
  await audit(req, { action: 'admin.user_updated', actorId: userId(req), targetType: 'user', targetId: req.params.id, severity: body.role ? 'WARN' : 'INFO', details: body });
  res.json(updated);
}));

// ── Topics & skills ──
const name = z.string().trim().min(2).max(100);
adminRouter.get('/topics', handler(async (_req, res) => res.json(await AdminService.topics())));
adminRouter.post('/topics', handler(async (req, res) => {
  const body = z.object({ name, parentId: z.string().nullable().optional(), icon: z.string().max(100).nullable().optional() }).parse(req.body);
  const topic = await AdminService.createTopic(body);
  await audit(req, { action: 'admin.topic_created', actorId: userId(req), targetType: 'topic', targetId: topic.id, details: { name: body.name } });
  res.status(201).json(topic);
}));
adminRouter.patch('/topics/:id', handler(async (req, res) => {
  const n = z.object({ name }).parse(req.body).name;
  await AdminService.renameTopic(req.params.id, n);
  await audit(req, { action: 'admin.topic_renamed', actorId: userId(req), targetType: 'topic', targetId: req.params.id, details: { name: n } });
  res.status(204).end();
}));
adminRouter.delete('/topics/:id', handler(async (req, res) => {
  await AdminService.deleteTopic(req.params.id);
  await audit(req, { action: 'admin.topic_deleted', actorId: userId(req), targetType: 'topic', targetId: req.params.id });
  res.status(204).end();
}));
adminRouter.post('/skills', handler(async (req, res) => {
  const body = z.object({ categoryId: z.string().min(1), name, description: z.string().max(500).nullable().optional() }).parse(req.body);
  const skill = await AdminService.createSkill(body);
  await audit(req, { action: 'admin.skill_created', actorId: userId(req), targetType: 'skill', targetId: skill.id, details: { name: body.name } });
  res.status(201).json(skill);
}));
adminRouter.delete('/skills/:id', handler(async (req, res) => {
  await AdminService.deleteSkill(req.params.id);
  await audit(req, { action: 'admin.skill_deleted', actorId: userId(req), targetType: 'skill', targetId: req.params.id });
  res.status(204).end();
}));

// ── Questions ──
adminRouter.get('/questions', handler(async (req, res) => {
  const q = z.object({ search: z.string().max(100).optional(), categoryId: z.string().optional(), status: z.enum(['active', 'inactive']).optional() }).parse(req.query);
  res.json(await AdminService.questions(q));
}));
adminRouter.get('/questions/:id', handler(async (req, res) => res.json(await AdminService.question(req.params.id))));
adminRouter.post('/questions/validate', handler(async (req, res) => res.json(await AdminService.validate(questionInput.parse(req.body)))));
adminRouter.post('/questions/import', handler(async (req, res) => {
  const body = z.object({ questions: z.array(z.unknown()).min(1).max(100) }).parse(req.body);
  const r = await AdminService.importQuestions(userId(req), body.questions);
  await audit(req, { action: 'admin.questions_imported', actorId: userId(req), targetType: 'question', details: { imported: r.imported, failed: r.failed, ids: r.results.filter((x) => x.ok).map((x) => x.id) } });
  res.json(r);
}));
adminRouter.post('/questions', handler(async (req, res) => {
  const saved = await AdminService.saveQuestion(userId(req), questionInput.parse(req.body));
  await audit(req, { action: 'admin.question_created', actorId: userId(req), targetType: 'question', targetId: saved.id });
  res.status(201).json(saved);
}));
adminRouter.put('/questions/:id', handler(async (req, res) => {
  const saved = await AdminService.saveQuestion(userId(req), questionInput.parse(req.body), req.params.id);
  await audit(req, { action: 'admin.question_updated', actorId: userId(req), targetType: 'question', targetId: req.params.id });
  res.json(saved);
}));
adminRouter.patch('/questions/:id', handler(async (req, res) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  await AdminService.setQuestionActive(req.params.id, active);
  await audit(req, { action: active ? 'admin.question_published' : 'admin.question_hidden', actorId: userId(req), targetType: 'question', targetId: req.params.id });
  res.status(204).end();
}));

// ── Audit log, inbox, analytics ──
adminRouter.get('/audit', handler(async (req, res) => {
  const q = z.object({ severity: z.enum(['INFO', 'WARN', 'ALERT']).optional(), action: z.string().max(60).optional(), limit: z.coerce.number().int().min(10).max(500).default(100) }).parse(req.query);
  res.json(await InsightsService.auditLog(q));
}));
adminRouter.get('/messages', handler(async (_req, res) => res.json(await InsightsService.messages())));
adminRouter.patch('/messages/:id', handler(async (req, res) => {
  const { status } = z.object({ status: z.enum(['NEW', 'READ', 'CLOSED']) }).parse(req.body);
  await InsightsService.setMessageStatus(req.params.id, status);
  res.status(204).end();
}));
adminRouter.get('/analytics', handler(async (req, res) => {
  const days = z.coerce.number().int().min(1).max(365).default(30).parse(req.query.days ?? 30);
  res.json(await InsightsService.siteAnalytics(days));
}));

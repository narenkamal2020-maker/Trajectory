/** Unauthenticated endpoints: contact form and consent-gated telemetry. */
import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handler } from './lib/http';
import { verifyAccessToken } from './auth/auth.service';
import { InsightsService } from './services/insights.service';
import { audit } from './lib/audit';

const skip = () => process.env.NODE_ENV === 'test';
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, skip, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { statusCode: 429, message: 'Too many messages — please try again later.' } });
const telemetryLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, skip, standardHeaders: 'draft-7', legacyHeaders: false });

/** Optional identity: attach the user if a valid token is present, otherwise stay anonymous. */
function optionalUser(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  try { return verifyAccessToken(h.slice(7)).id; } catch { return null; }
}

const short = (n: number) => z.string().trim().max(n);

export const publicRouter = Router();

publicRouter.post('/contact', contactLimiter, handler<Request>(async (req, res) => {
  const body = z.object({
    name: short(100).min(2, 'Please enter your name'),
    email: z.string().trim().email('Enter a valid email').max(255),
    topic: z.enum(['support', 'feedback', 'partnership', 'privacy', 'other']),
    message: short(5000).min(10, 'Tell us a little more (10+ characters)'),
    website: z.string().max(0).optional(), // honeypot — real users never fill it
  }).parse(req.body);
  const { id } = await InsightsService.createMessage({ ...body, userId: optionalUser(req) });
  if (body.topic === 'privacy') await audit(req, { action: 'privacy.request_received', severity: 'WARN', targetType: 'message', targetId: id });
  res.status(201).json({ id });
}));

const event = z.object({
  name: z.string().regex(/^[a-z0-9_.:-]{1,60}$/),
  path: short(200).optional(),
  utm: z.object({ source: short(100).optional(), medium: short(100).optional(), campaign: short(100).optional() }).optional(),
  referrer: short(200).optional(),
  props: z.record(z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});

publicRouter.post('/telemetry', telemetryLimiter, handler<Request>(async (req, res) => {
  // The client only sends this after the visitor accepts analytics cookies (see CookieBanner).
  const body = z.object({ sessionId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/), events: z.array(event).min(1).max(20) }).parse(req.body);
  await InsightsService.recordEvents(body.sessionId, optionalUser(req), body.events);
  res.status(204).end();
}));

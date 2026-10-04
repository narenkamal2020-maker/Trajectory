import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';
import type { AuthedRequest } from '../lib/http';

const skip = () => process.env.NODE_ENV === 'test';
const byUser = (req: Request) => (req as AuthedRequest).user?.id ?? ipKeyGenerator(req.ip ?? '');

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { statusCode: 429, message: 'Too many authentication attempts, please try again in 15 minutes' },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  skip,
  keyGenerator: byUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/** Code execution is CPU-heavy: 30 runs/submits per minute per user. */
export const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  skip,
  keyGenerator: byUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { statusCode: 429, message: 'Too many code runs — wait a moment and try again' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  skip,
  keyGenerator: byUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { statusCode: 429, message: 'Resume analysis limit reached (10 per hour). Please try again later.' },
});

/** Interview answers may call a paid LLM: 120 answers/hour per user. */
export const interviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 120,
  skip,
  keyGenerator: byUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { statusCode: 429, message: 'Interview limit reached for this hour — take a break and come back soon.' },
});

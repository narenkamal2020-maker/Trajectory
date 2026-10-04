import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AuthService, type AuthResult } from './auth.service';
import { authenticate } from './auth.middleware';
import { authLimiter } from '../middleware/rate-limiter.middleware';
import { handler, userId, unauthorized, HttpError } from '../lib/http';
import { audit, recordLoginFailure, clearLoginFailures } from '../lib/audit';

const password = z.string().min(8, 'Password must be at least 8 characters').max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const utm = z.object({
  source: z.string().max(100).optional(), medium: z.string().max(100).optional(),
  campaign: z.string().max(100).optional(), referrer: z.string().max(200).optional(),
}).partial().optional();
const registerSchema = z.object({
  email: z.string().email().max(255),
  password,
  name: z.string().trim().min(2).max(100),
  attribution: utm,
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });

const COOKIE = 'refreshToken';

/** Native clients (desktop/mobile) can't use cookies across origins, so they get the token in the body. */
const isNative = (req: Request) => req.get('x-client-type') === 'native';

function respond(req: Request, res: Response, result: AuthResult, status = 200) {
  res.cookie(COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_DAYS * 86400_000,
  });
  const { refreshToken, ...body } = result;
  res.status(status).json(isNative(req) ? { ...body, refreshToken } : body);
}

const readRefresh = (req: Request): string | undefined => req.cookies?.[COOKIE] ?? req.body?.refreshToken;

export const authRouter = Router();

authRouter.post('/register', authLimiter, handler<Request>(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await AuthService.register(body);
  await audit(req, { action: 'auth.register', actorId: result.user.id, targetType: 'user', targetId: result.user.id, details: body.attribution ? { attribution: body.attribution } : undefined });
  respond(req, res, result, 201);
}));

authRouter.post('/login', authLimiter, handler<Request>(async (req, res) => {
  const body = loginSchema.parse(req.body);
  try {
    const result = await AuthService.login(body);
    clearLoginFailures(body.email);
    await audit(req, { action: result.user.role === 'ADMIN' ? 'auth.admin_login' : 'auth.login', actorId: result.user.id, targetType: 'user', targetId: result.user.id });
    respond(req, res, result);
  } catch (err) {
    if (err instanceof HttpError && err.statusCode === 401) await recordLoginFailure(req, body.email);
    throw err;
  }
}));

authRouter.post('/refresh', handler<Request>(async (req, res) => {
  const token = readRefresh(req);
  if (!token) throw unauthorized('Refresh token missing');
  try {
    respond(req, res, await AuthService.refresh(token));
  } catch (err) {
    if (err instanceof HttpError && /reuse/i.test(err.message)) {
      await audit(req, { action: 'auth.refresh_token_reuse', severity: 'ALERT', targetType: 'session', details: { note: 'All sessions for the account were revoked' } });
    }
    throw err;
  }
}));

authRouter.post('/logout', handler<Request>(async (req, res) => {
  await AuthService.logout(readRefresh(req));
  res.clearCookie(COOKIE, { path: '/api/auth' });
  res.status(204).end();
}));

authRouter.get('/me', authenticate, handler(async (req, res) => {
  res.json(await AuthService.me(userId(req)));
}));

authRouter.post('/change-password', authenticate, authLimiter, handler(async (req, res) => {
  const body = z.object({ currentPassword: z.string(), newPassword: password }).parse(req.body);
  await AuthService.changePassword(userId(req), body.currentPassword, body.newPassword);
  await audit(req, { action: 'auth.password_changed', actorId: userId(req), targetType: 'user', targetId: userId(req), severity: 'WARN' });
  res.clearCookie(COOKIE, { path: '/api/auth' });
  res.status(204).end();
}));

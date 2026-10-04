import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './auth.service';
import type { AuthedRequest } from '../lib/http';

/** Require a valid Bearer access token. Responds 401 so clients know to refresh. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ statusCode: 401, message: 'Access token required' });
  try {
    (req as AuthedRequest).user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ statusCode: 401, message: 'Invalid or expired access token', code: 'TOKEN_EXPIRED' });
  }
}

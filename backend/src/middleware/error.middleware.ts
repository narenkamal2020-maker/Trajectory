import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { logger } from '../config/logger';
import { HttpError } from '../lib/http';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader('x-request-id', id);
  (req as any).requestId = id;
  next();
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ statusCode: 404, message: `Route ${req.method} ${req.path} not found` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const rid = (req as any).requestId as string | undefined;
  const timestamp = new Date().toISOString();
  const send = (status: number, body: Record<string, unknown>) =>
    res.status(status).json({ statusCode: status, ...body, requestId: rid, timestamp });

  if (err instanceof ZodError) {
    return send(400, {
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message, code: e.code })),
    });
  }
  if (err instanceof HttpError) {
    if (err.statusCode >= 500) logger.error(`[${rid}] ${err.message}`);
    return send(err.statusCode, { message: err.message, ...(err.details ? { details: err.details } : {}) });
  }
  if (err instanceof MulterError) {
    return send(400, { message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5 MB)' : err.message });
  }
  if (err?.type === 'entity.parse.failed') return send(400, { message: 'Malformed JSON body' });
  if (err?.type === 'entity.too.large') return send(413, { message: 'Request body too large' });
  if (err?.message === 'UNSUPPORTED_FILE_TYPE') return send(400, { message: 'Only PDF, DOCX or TXT files are allowed' });

  logger.error(`[${rid}] ${req.method} ${req.originalUrl} failed`, { error: err?.message, stack: err?.stack });
  const isDb = typeof err?.message === 'string' && /^(ORA|NJS|DPI)-\d+/.test(err.message);
  return send(500, {
    message: isDb ? 'Database operation failed' : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { error: err?.message } : {}),
  });
}

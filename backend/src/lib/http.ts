import type { Request, Response, NextFunction, RequestHandler } from 'express';

export class HttpError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Authentication required') => new HttpError(401, msg);
export const forbidden = (msg = 'Forbidden') => new HttpError(403, msg);
export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`);
export const conflict = (msg: string) => new HttpError(409, msg);

export interface AuthedRequest extends Request {
  user: { id: string; email: string };
}

/** Wrap an async handler so rejections reach the error middleware. */
export function handler<R extends Request = AuthedRequest>(
  fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req as R, res, next).catch(next);
  };
}

export const userId = (req: Request): string => (req as AuthedRequest).user.id;

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ZodError } from 'zod';

export interface APIError {
  statusCode: number;
  message: string;
  errors?: any;
  requestId?: string;
  timestamp: string;
}

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
  const timestamp = new Date().toISOString();

  logger.error(`[${requestId}] ${req.method} ${req.url}`, { error: err.message, stack: err.stack });

  // Hide internal database errors from frontend
  const isPrismaError = err.code && err.code.startsWith('P');
  if (isPrismaError) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Database operation failed',
      requestId,
      timestamp
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code
    }));
    return res.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      errors: formatted,
      requestId,
      timestamp
    });
  }

  // Handle custom API errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      requestId,
      timestamp
    });
  }

  // Default error
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    requestId,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};


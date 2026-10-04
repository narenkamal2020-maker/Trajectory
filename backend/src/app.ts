import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { allowedOrigins } from './config/env';
import { isPoolReady } from './config/oracle';
import { authRouter } from './auth/auth.controller';
import { api } from './routes';
import { downloadsRouter } from './downloads';
import { adminRouter } from './admin.routes';
import { publicRouter } from './public.routes';
import { securityHeaders } from './middleware/security-headers';
import { authenticate } from './auth/auth.middleware';
import { requireAdmin } from './auth/admin';
import { errorMiddleware, notFoundHandler, requestId } from './middleware/error.middleware';
import { mlClient } from './ml/client';
import { llmEnabled, llmModelName } from './ai/llm';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(cors({
    // Browsers on the configured origins, plus the desktop (file://, "null") and mobile (capacitor://) shells.
    origin: (origin, cb) => {
      if (!origin || origin === 'null' || allowedOrigins.includes(origin) || /^(capacitor|ionic|app):\/\//.test(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin)) cb(null, true);
      else cb(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(securityHeaders);

  // Public health check: liveness only — no versions, model names or topology.
  app.get('/api/health', (_req, res) => {
    res.json({ status: isPoolReady() ? 'ok' : 'degraded', time: new Date().toISOString() });
  });
  // Detailed system status for administrators.
  app.get('/api/admin/system', authenticate, requireAdmin, async (_req, res) => {
    const ml = await mlClient.health();
    res.json({
      status: isPoolReady() ? 'ok' : 'degraded',
      database: isPoolReady() ? 'up' : 'down',
      ml: ml ? 'up' : 'down (rule-based fallback active)',
      llm: llmEnabled() ? llmModelName() : 'disabled (rule-based engines)',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/downloads', downloadsRouter); // public: install links work before sign-in
  app.use('/api', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', api);

  // Optionally serve the built web app from the same origin (single-container deployment).
  const staticDir = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;
  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { index: false, maxAge: '1h', setHeaders: (res, file) => {
      if (/[\\/]assets[\\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } }));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use(notFoundHandler);
  app.use(errorMiddleware);
  return app;
}

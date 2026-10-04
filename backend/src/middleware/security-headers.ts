import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/** Origins the web app may load media/fonts from (landing page videos + Google Fonts). */
const MEDIA_CDN = 'https://d8j0ntlcm91z4.cloudfront.net';

const APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // CodeMirror and framer-motion inject inline styles.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `media-src 'self' ${MEDIA_CDN}`,
  "connect-src 'self'",
  // Offline JS runner uses a blob: Web Worker; the PWA service worker is same-origin.
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const API_CSP = "default-src 'none'; frame-ancestors 'none'";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const isApi = req.path.startsWith('/api/');
  res.setHeader('Content-Security-Policy', isApi ? API_CSP : APP_CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', isApi ? 'no-referrer' : 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=(), usb=(), microphone=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (!isApi) res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

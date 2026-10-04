import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Trajectory'),

  // Oracle
  ORACLE_USER: z.string().min(1),
  ORACLE_PASSWORD: z.string().min(1),
  ORACLE_CONNECTION_STRING: z.string().min(1), // e.g. localhost:1521/XEPDB1, or a full TLS descriptor
  // Oracle Autonomous Database with mutual TLS: folder holding ewallet.pem (+ tnsnames.ora) and its password
  ORACLE_WALLET_DIR: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  ORACLE_WALLET_PASSWORD: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  // Least privilege: when the API connects as a DML-only user, set ORACLE_SCHEMA to the owning
  // schema. Migrations are then skipped at boot and must run as the owner (npm run db:migrate).
  ORACLE_SCHEMA: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^[A-Za-z][A-Za-z0-9_$#]{0,29}$/).optional()),

  // JWT
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(7),

  // CORS — comma-separated list of allowed origins
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // LLM (optional). 'none' uses the built-in rule-based engines.
  LLM_PROVIDER: z.enum(['openai', 'ollama', 'none']).default('none'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.1'),

  // Python ML inference service (optional — falls back to rules when down)
  // A bare host:port (e.g. Render's private-service address) gets http:// added.
  ML_SERVICE_URL: z.string().default('http://localhost:8000').transform((u) => (/^https?:\/\//.test(u) ? u : `http://${u}`).replace(/\/+$/, '')),

  // Code execution
  PYTHON_BIN: z.string().default(process.platform === 'win32' ? 'python' : 'python3'),
  EXEC_MAX_CONCURRENCY: z.coerce.number().default(4),

  UPLOADS_DIR: z.string().default('uploads'),
  // Published app installers (APK, desktop) served at /api/downloads
  DOWNLOADS_DIR: z.string().default('downloads'),
  // Comma-separated installer URLs hosted elsewhere (e.g. GitHub Release assets) — for hosts with
  // ephemeral disks such as Render. Listed alongside files in DOWNLOADS_DIR.
  DOWNLOAD_URLS: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  // 32-byte key (hex or base64) for field-level encryption of resumes. Required in production.
  DATA_ENCRYPTION_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  // Load the shipped question bank at startup: only into an empty database (default), every boot, or never.
  SEED_ON_BOOT: z.enum(['if-empty', 'always', 'off']).default('if-empty'),

  // Optional: ensure this admin account exists at startup (e.g. first container boot)
  // (empty strings — e.g. unset docker-compose variables — count as "not set")
  ADMIN_EMAIL: z.preprocess((v) => (v === '' ? undefined : v), z.string().email().optional()),
  ADMIN_PASSWORD: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(8).optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.DATA_ENCRYPTION_KEY) {
  console.error('❌ DATA_ENCRYPTION_KEY is required in production (resume data is encrypted at rest).');
  process.exit(1);
}

export const env = parsed.data;
export const allowedOrigins = env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean);

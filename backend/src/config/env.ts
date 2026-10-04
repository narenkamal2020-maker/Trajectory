import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Oracle SQL
  ORACLE_USER: z.string().min(1),
  ORACLE_PASSWORD: z.string().min(1),
  ORACLE_CONNECTION_STRING: z.string().min(1), // e.g. localhost:1521/XEPDB1

  // JWT
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),

  // CORS
  FRONTEND_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // AI Provider (Language Model)
  LLM_PROVIDER: z.enum(['openai', 'local', 'none']).default('none'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // ML Service
  ML_SERVICE_URL: z.string().url().default('http://localhost:8000'),

  // File storage
  UPLOADS_DIR: z.string().default('uploads'),

  // App
  APP_NAME: z.string().default('Trajectory'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;

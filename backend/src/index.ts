import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initOraclePool, closePool } from './config/oracle';
import { runMigrations } from './db/migrate';
import { drain } from './lib/jobs';
import { ensureAdmin } from './auth/admin';
import { query } from './config/oracle';
import { seedQuestions } from './db/seed';

async function main() {
  await initOraclePool();
  // Apply pending migrations on boot so a fresh deployment is usable immediately.
  if (env.ORACLE_SCHEMA) logger.info(`Least-privilege mode (schema ${env.ORACLE_SCHEMA}): skipping boot migrations — run them as the owner`);
  else await runMigrations({ log: (m) => logger.info(m) });
  if (env.SEED_ON_BOOT !== 'off' && !env.ORACLE_SCHEMA) {
    const N = (await query<{ N: number }>(`SELECT COUNT(*) AS N FROM QUESTIONS`)).rows?.[0]?.N ?? 0;
    if (env.SEED_ON_BOOT === 'always' || Number(N) === 0) await seedQuestions((m) => logger.info(m));
  }
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    logger.info(`Admin account ${await ensureAdmin(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)}: ${env.ADMIN_EMAIL}`);
  }

  const server = createApp().listen(env.PORT, () => {
    logger.info(`🚀 ${env.APP_NAME} API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close();
    await Promise.race([drain(), new Promise((r) => setTimeout(r, 10_000))]);
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
  process.exit(1);
});

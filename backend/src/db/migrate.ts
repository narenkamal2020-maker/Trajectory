/**
 * Minimal SQL migration runner for Oracle.
 *   npm run db:migrate           apply pending migrations
 *   npm run db:migrate -- --reset   drop every table in the schema first (dev only)
 */
import fs from 'fs';
import path from 'path';
import { initOraclePool, closePool, query, withTransaction, execute } from '../config/oracle';
import { env } from '../config/env';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/** Split a SQL file into statements. Statements end with ';' at end of line (or EOF). */
export function splitSql(sql: string): string[] {
  const withoutComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  return withoutComments
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.toUpperCase() !== 'COMMIT');
}

async function tableExists(name: string): Promise<boolean> {
  const r = await query<{ N: number }>(`SELECT COUNT(*) AS N FROM USER_TABLES WHERE TABLE_NAME = :name`, { name });
  return Number(r.rows?.[0]?.N ?? 0) > 0;
}

async function resetSchema(): Promise<void> {
  if (env.NODE_ENV === 'production') throw new Error('Refusing to reset schema in production');
  const r = await query<{ TABLE_NAME: string }>(`SELECT TABLE_NAME FROM USER_TABLES`);
  for (const row of r.rows ?? []) {
    await execute(`DROP TABLE "${row.TABLE_NAME}" CASCADE CONSTRAINTS PURGE`);
  }
  console.log(`Dropped ${r.rows?.length ?? 0} tables`);
}

export async function runMigrations({ reset = false, log = console.log } = {}): Promise<string[]> {
  if (env.ORACLE_SCHEMA) {
    log('ORACLE_SCHEMA is set (DML-only runtime user): migrations must be run by the schema owner');
    return [];
  }
  if (reset) await resetSchema();

  if (!(await tableExists('SCHEMA_MIGRATIONS'))) {
    await execute(`CREATE TABLE SCHEMA_MIGRATIONS (
      FILENAME   VARCHAR2(200) PRIMARY KEY,
      APPLIED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  }

  const done = new Set(
    ((await query<{ FILENAME: string }>(`SELECT FILENAME FROM SCHEMA_MIGRATIONS`)).rows ?? []).map((r) => r.FILENAME)
  );
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];

  for (const file of files) {
    if (done.has(file)) continue;
    const statements = splitSql(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    log(`→ ${file} (${statements.length} statements)`);
    // Oracle DDL auto-commits, so a failure mid-file leaves earlier DDL applied.
    // We stop immediately and report the failing statement.
    for (const [i, stmt] of statements.entries()) {
      try {
        await withTransaction((conn) => conn.execute(stmt));
      } catch (err: any) {
        throw new Error(`${file} statement #${i + 1} failed: ${err.message}\n${stmt.slice(0, 300)}`);
      }
    }
    await execute(`INSERT INTO SCHEMA_MIGRATIONS (FILENAME) VALUES (:f)`, { f: file });
    applied.push(file);
  }
  log(applied.length ? `Applied ${applied.length} migration(s)` : 'Schema up to date');
  return applied;
}

if (require.main === module) {
  (async () => {
    try {
      await initOraclePool();
      await runMigrations({ reset: process.argv.includes('--reset') });
    } catch (err: any) {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    } finally {
      await closePool();
    }
  })();
}

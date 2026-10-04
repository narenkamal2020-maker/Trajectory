/**
 * Grant a runtime (DML-only) database user access to every table in this schema.
 * Run as the schema owner after migrations:   npm run db:grant -- --app-user TRAJECTORY_APP
 * The app user needs only CREATE SESSION (see docs/database-security.md).
 */
import { initOraclePool, closePool, query, execute } from '../config/oracle';

(async () => {
  const i = process.argv.indexOf('--app-user');
  const appUser = i > -1 ? process.argv[i + 1]?.toUpperCase() : undefined;
  if (!appUser || !/^[A-Z][A-Z0-9_$#]{0,29}$/.test(appUser)) {
    console.error('Usage: npm run db:grant -- --app-user TRAJECTORY_APP');
    process.exit(1);
  }
  try {
    await initOraclePool();
    const tables = (await query<{ TABLE_NAME: string }>(`SELECT TABLE_NAME FROM USER_TABLES`)).rows ?? [];
    for (const t of tables) {
      // Identifiers come from the data dictionary and a validated name, never from user input.
      const priv = t.TABLE_NAME === 'SCHEMA_MIGRATIONS' ? 'SELECT' : 'SELECT, INSERT, UPDATE, DELETE';
      await execute(`GRANT ${priv} ON "${t.TABLE_NAME}" TO ${appUser}`);
    }
    console.log(`Granted DML on ${tables.length} tables to ${appUser} (read-only on SCHEMA_MIGRATIONS). No DDL rights granted.`);
  } catch (err: any) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();

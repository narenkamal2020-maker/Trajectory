/**
 * Create (or promote / reset) an administrator account.
 *   npm run admin:create -- --email admin@example.com [--password "..."] [--name "Jane Admin"]
 * Without --password a strong random password is generated and printed once.
 */
import { initOraclePool, closePool } from '../config/oracle';
import { runMigrations } from './migrate';
import { ensureAdmin, generatePassword } from '../auth/admin';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

(async () => {
  const email = arg('email');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- --email admin@example.com [--password "..."] [--name "Name"]');
    process.exit(1);
  }
  const password = arg('password') ?? generatePassword();
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error('Password must be 8+ characters with a letter and a number.');
    process.exit(1);
  }
  try {
    await initOraclePool();
    await runMigrations({ log: () => {} });
    const result = await ensureAdmin(email, password, arg('name'));
    console.log(`Admin ${result}: ${email}`);
    if (!arg('password')) console.log(`Password (shown once — store it in a password manager): ${password}`);
  } catch (err: any) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();

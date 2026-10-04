import oracledb from 'oracledb';
import { env } from './env';
import { logger } from './logger';

// node-oracledb 6+ runs in "thin" mode by default — no Oracle Instant Client needed.
oracledb.autoCommit = false;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool: oracledb.Pool | null = null;

export async function initOraclePool(): Promise<void> {
  if (pool) return;
  pool = await oracledb.createPool({
    user: env.ORACLE_USER,
    password: env.ORACLE_PASSWORD,
    connectString: env.ORACLE_CONNECTION_STRING,
    // Autonomous Database (mTLS): thin mode reads ewallet.pem and tnsnames.ora from this folder.
    ...(env.ORACLE_WALLET_DIR ? {
      configDir: env.ORACLE_WALLET_DIR,
      walletLocation: env.ORACLE_WALLET_DIR,
      walletPassword: env.ORACLE_WALLET_PASSWORD,
    } : {}),
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60,
    // Runtime user without ownership: resolve unqualified table names in the owner's schema.
    ...(env.ORACLE_SCHEMA ? {
      sessionCallback: (conn: oracledb.Connection, _tag: string, cb: (err?: Error) => void) => {
        conn.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${env.ORACLE_SCHEMA}`).then(() => cb(), cb);
      },
    } : {}),
  });
  logger.info('Oracle DB pool initialized');
}

export function isPoolReady(): boolean {
  return pool !== null;
}

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) throw new Error('Oracle pool not initialized. Call initOraclePool() first.');
  return pool.getConnection();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(5);
    pool = null;
    logger.info('Oracle pool closed');
  }
}

/** Execute a read query and release the connection. */
export async function query<T = any>(
  sql: string,
  binds: oracledb.BindParameters = [],
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  const conn = await getConnection();
  try {
    return await conn.execute<T>(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT, ...options });
  } finally {
    await conn.close();
  }
}

/** Execute a single write (INSERT/UPDATE/DELETE/MERGE) and commit. */
export async function execute(
  sql: string,
  binds: oracledb.BindParameters = []
): Promise<oracledb.Result<unknown>> {
  return withTransaction((conn) => conn.execute(sql, binds));
}

/** Run several statements atomically on one connection. */
export async function withTransaction<T>(fn: (conn: oracledb.Connection) => Promise<T>): Promise<T> {
  const conn = await getConnection();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/** Backwards-compatible helper used by older repositories. */
export async function transaction(
  operations: Array<{ sql: string; binds?: oracledb.BindParameters }>
): Promise<void> {
  await withTransaction(async (conn) => {
    for (const op of operations) await conn.execute(op.sql, op.binds ?? []);
  });
}

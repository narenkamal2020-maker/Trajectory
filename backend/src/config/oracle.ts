import oracledb from 'oracledb';
import { env } from './env';
import { logger } from './logger';

// Use thin mode — no Oracle Client installation required
oracledb.initOracleClient = undefined as any;

let pool: oracledb.Pool | null = null;

export async function initOraclePool(): Promise<void> {
  try {
    oracledb.autoCommit = false;
    oracledb.fetchAsString = [oracledb.CLOB];

    pool = await oracledb.createPool({
      user: env.ORACLE_USER,
      password: env.ORACLE_PASSWORD,
      connectString: env.ORACLE_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 60,
    });

    logger.info('Oracle DB pool initialized successfully');
  } catch (err: any) {
    logger.error('Failed to initialize Oracle pool:', err.message);
    throw err;
  }
}

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    throw new Error('Oracle pool not initialized. Call initOraclePool() first.');
  }
  return pool.getConnection();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(0);
    pool = null;
    logger.info('Oracle pool closed');
  }
}

/**
 * Execute a single query and release the connection.
 */
export async function query<T = any>(
  sql: string,
  binds: oracledb.BindParameters = [],
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  const conn = await getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return result;
  } finally {
    await conn.close();
  }
}

/**
 * Execute a write (INSERT/UPDATE/DELETE) and commit.
 */
export async function execute(
  sql: string,
  binds: oracledb.BindParameters = []
): Promise<oracledb.Result<unknown>> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * Execute multiple statements in a single transaction.
 */
export async function transaction(
  operations: Array<{ sql: string; binds?: oracledb.BindParameters }>
): Promise<void> {
  const conn = await getConnection();
  try {
    for (const op of operations) {
      await conn.execute(op.sql, op.binds ?? [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

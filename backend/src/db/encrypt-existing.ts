/** Encrypt legacy plaintext resume data in place. Idempotent.  npm run data:encrypt */
import oracledb from 'oracledb';
import { initOraclePool, closePool, query, withTransaction } from '../config/oracle';
import { encryptField, encryptionEnabled, isEncrypted } from '../lib/crypto';

(async () => {
  try {
    if (!encryptionEnabled()) throw new Error('Set DATA_ENCRYPTION_KEY first');
    await initOraclePool();
    const r = await query<any>(`SELECT RESUME_ID, PARSED_TEXT, PARSED_METADATA FROM RESUMES`);
    let n = 0;
    await withTransaction(async (conn) => {
      for (const row of r.rows ?? []) {
        const text = row.PARSED_TEXT && !isEncrypted(row.PARSED_TEXT) ? encryptField(row.PARSED_TEXT) : row.PARSED_TEXT;
        const meta = row.PARSED_METADATA && !isEncrypted(row.PARSED_METADATA) ? encryptField(row.PARSED_METADATA) : row.PARSED_METADATA;
        if (text === row.PARSED_TEXT && meta === row.PARSED_METADATA) continue;
        await conn.execute(`UPDATE RESUMES SET PARSED_TEXT = :t, PARSED_METADATA = :m WHERE RESUME_ID = :id`,
          { t: { val: text, type: oracledb.CLOB }, m: { val: meta, type: oracledb.CLOB }, id: row.RESUME_ID });
        n++;
      }
    });
    console.log(`Encrypted ${n} resume row(s); ${(r.rows?.length ?? 0) - n} already encrypted or empty.`);
  } catch (err: any) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();

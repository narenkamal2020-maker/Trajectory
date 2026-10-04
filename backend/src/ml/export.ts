/**
 * Export collected training data for the ML pipeline (ml/train.py).
 *   npm run ml:export            → ../ml/data/submissions.csv, ../ml/data/resumes.jsonl
 * User ids are replaced with a salted hash so exported files carry no direct identifiers.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initOraclePool, closePool, query } from '../config/oracle';
import { env } from '../config/env';
import { parseJson } from '../lib/util';
import { decryptField } from '../lib/crypto';

export const SOLVE_FEATURES = [
  'proficiency', 'min_proficiency', 'difficulty', 'attempts_on_skill',
  'prior_attempts_on_question', 'solve_rate', 'days_since_practice',
] as const;

const pseudonym = (id: string) => crypto.createHmac('sha256', env.JWT_SECRET).update(id).digest('hex').slice(0, 16);

export async function exportTrainingData(outDir: string) {
  fs.mkdirSync(outDir, { recursive: true });

  const subs = await query<any>(
    `SELECT USER_ID, ENTITY_ID, FEATURES, LABEL, CREATED_AT FROM ML_EVENTS WHERE EVENT_TYPE = 'SUBMISSION' ORDER BY CREATED_AT`
  );
  const header = ['user', 'question_id', ...SOLVE_FEATURES, 'used_hint', 'label', 'created_at'];
  const lines = [header.join(',')];
  for (const r of subs.rows ?? []) {
    const f = parseJson<Record<string, unknown>>(r.FEATURES, {});
    lines.push([
      pseudonym(r.USER_ID), r.ENTITY_ID,
      ...SOLVE_FEATURES.map((k) => Number(f[k] ?? 0)),
      Number(f.used_hint ?? 0), Number(r.LABEL ?? 0), new Date(r.CREATED_AT).toISOString(),
    ].join(','));
  }
  fs.writeFileSync(path.join(outDir, 'submissions.csv'), lines.join('\n') + '\n');

  // Resumes labelled with the role the user is targeting (weak label, useful once volume grows).
  const resumes = await query<any>(
    `SELECT r.USER_ID, r.PARSED_TEXT, p.TARGET_ROLE FROM RESUMES r JOIN PROFILES p ON p.USER_ID = r.USER_ID
     WHERE r.ANALYSIS_STATUS = 'COMPLETED' AND p.TARGET_ROLE IS NOT NULL`
  );
  const { CatalogService } = await import('../services/catalog.service');
  const out = fs.createWriteStream(path.join(outDir, 'resumes.jsonl'));
  let nResumes = 0;
  for (const r of resumes.rows ?? []) {
    const role = await CatalogService.resolveRole(r.TARGET_ROLE);
    if (!role) continue;
    out.write(JSON.stringify({ user: pseudonym(r.USER_ID), role: role.title, text: (decryptField(r.PARSED_TEXT) ?? '').slice(0, 20000) }) + '\n');
    nResumes++;
  }
  await new Promise((res) => out.end(res));
  return { submissions: subs.rows?.length ?? 0, resumes: nResumes };
}

if (require.main === module) {
  (async () => {
    try {
      await initOraclePool();
      const dir = path.resolve(__dirname, '../../../ml/data');
      const n = await exportTrainingData(dir);
      console.log(`Exported ${n.submissions} submission events and ${n.resumes} resumes to ${dir}`);
    } catch (err: any) {
      console.error('Export failed:', err.message);
      process.exitCode = 1;
    } finally {
      await closePool();
    }
  })();
}

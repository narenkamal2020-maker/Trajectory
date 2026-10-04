/**
 * Oracle Data Pump backup / restore for the Trajectory schema.
 *
 *   npm run db:backup                                   # full schema export (+ retention pruning)
 *   npm run db:restore -- --file trajectory-....dmp --yes        # in-place restore (replaces tables)
 *   npm run db:restore -- --file trajectory-....dmp --into TRAJECTORY_RESTORE   # restore to another schema
 *
 * One-time setup (as SYSDBA, in the pluggable database):
 *   CREATE DIRECTORY TRAJECTORY_BACKUP AS '/path/to/backups';
 *   GRANT READ, WRITE ON DIRECTORY TRAJECTORY_BACKUP TO trajectory;
 * Credentials are passed to expdp/impdp through a temporary parameter file (never the command line).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { env } from '../config/env';
import { initOraclePool, closePool, query } from '../config/oracle';

const DIRECTORY = process.env.BACKUP_DIRECTORY ?? 'TRAJECTORY_BACKUP';
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS ?? 14);
const ident = /^[A-Za-z][A-Za-z0-9_$#]{0,29}$/;

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function runDataPump(tool: 'expdp' | 'impdp', params: string[]): void {
  const parfile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'trj-dp-')), 'job.par');
  const pw = env.ORACLE_PASSWORD.replace(/"/g, '');
  fs.writeFileSync(parfile, [`userid=${env.ORACLE_USER}/"${pw}"@${env.ORACLE_CONNECTION_STRING}`, ...params].join('\n'), { mode: 0o600 });
  try {
    const r = spawnSync(tool, [`parfile=${parfile}`], { stdio: 'inherit', shell: false });
    if (r.error) throw new Error(`${tool} not found — install Oracle client tools or run from the database host (${r.error.message})`);
    if (r.status !== 0) throw new Error(`${tool} exited with code ${r.status}`);
  } finally {
    fs.rmSync(path.dirname(parfile), { recursive: true, force: true });
  }
}

async function directoryPath(): Promise<string | null> {
  const r = await query<{ DIRECTORY_PATH: string }>(`SELECT DIRECTORY_PATH FROM ALL_DIRECTORIES WHERE DIRECTORY_NAME = :d`, { d: DIRECTORY });
  return r.rows?.[0]?.DIRECTORY_PATH ?? null;
}

async function backup() {
  if (env.ORACLE_SCHEMA) throw new Error('Run backups with the schema owner credentials, not the DML-only runtime user');
  const dir = await directoryPath();
  if (!dir) throw new Error(`Oracle directory ${DIRECTORY} not found or not granted (see header of this file)`);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const file = `trajectory-${stamp}.dmp`;
  runDataPump('expdp', [`schemas=${env.ORACLE_USER}`, `directory=${DIRECTORY}`, `dumpfile=${file}`, `logfile=${file.replace('.dmp', '.export.log')}`, 'flashback_time=systimestamp']);
  console.log(`\nBackup written: ${path.join(dir, file)}`);

  // Retention: prune old dumps when the directory is on this machine.
  if (fs.existsSync(dir)) {
    const cutoff = Date.now() - RETENTION_DAYS * 86400_000;
    for (const f of fs.readdirSync(dir)) {
      if (!/^trajectory-\d{8}-\d{6}\.(dmp|export\.log|import\.log)$/i.test(f)) continue;
      const full = path.join(dir, f);
      if (fs.statSync(full).mtimeMs < cutoff) { fs.rmSync(full); console.log(`Pruned ${f} (older than ${RETENTION_DAYS} days)`); }
    }
  }
}

async function restore() {
  const file = arg('file');
  const into = arg('into')?.toUpperCase();
  if (!file || !/^trajectory-\d{8}-\d{6}\.dmp$/i.test(file)) throw new Error('Pass --file trajectory-YYYYMMDD-HHMMSS.dmp (a file in the backup directory)');
  if (into && !ident.test(into)) throw new Error('Invalid --into schema name');
  if (!into && !process.argv.includes('--yes')) throw new Error('In-place restore REPLACES all tables. Re-run with --yes to confirm, or use --into <SCHEMA>.');
  const params = [`directory=${DIRECTORY}`, `dumpfile=${file}`, `logfile=${file.replace('.dmp', '.import.log')}`];
  if (into) params.push(`remap_schema=${env.ORACLE_USER.toUpperCase()}:${into}`);
  else params.push(`schemas=${env.ORACLE_USER}`, 'table_exists_action=replace');
  runDataPump('impdp', params);
  console.log(`\nRestore complete${into ? ` into schema ${into}` : ''}.`);
}

(async () => {
  try {
    await initOraclePool();
    if (process.argv.includes('restore')) await restore();
    else await backup();
  } catch (err: any) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();

/**
 * Audit log + lightweight security monitoring.
 * - audit(): append-only record of security-relevant and administrative actions.
 * - Failed-login tracking raises an ALERT entry (and a SECURITY log line for log shippers)
 *   when one IP or account crosses a threshold inside a sliding window.
 */
import type { Request } from 'express';
import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { execute } from '../config/oracle';
import { logger } from '../config/logger';

export type Severity = 'INFO' | 'WARN' | 'ALERT';

export interface AuditEntry {
  action: string;
  actorId?: string | null;
  targetType?: string;
  targetId?: string | null;
  severity?: Severity;
  details?: Record<string, unknown>;
}

const clientIp = (req?: Request) => (req ? String(req.ip ?? req.socket?.remoteAddress ?? '').slice(0, 64) : null);
const userAgent = (req?: Request) => (req ? String(req.get('user-agent') ?? '').slice(0, 300) : null);

export async function audit(req: Request | undefined, e: AuditEntry): Promise<void> {
  const severity = e.severity ?? 'INFO';
  if (severity !== 'INFO') logger.warn(`SECURITY ${severity} ${e.action}`, { actor: e.actorId, target: e.targetId, ip: clientIp(req), ...e.details });
  try {
    await execute(
      `INSERT INTO AUDIT_LOG (AUDIT_ID, ACTOR_ID, ACTION, TARGET_TYPE, TARGET_ID, SEVERITY, IP_ADDRESS, USER_AGENT, DETAILS)
       VALUES (:id, :actor, :action, :ttype, :tid, :sev, :ip, :ua, :details)`,
      {
        id: uuidv4(), actor: e.actorId ?? null, action: e.action.slice(0, 60), ttype: e.targetType ?? null,
        tid: e.targetId ? String(e.targetId).slice(0, 64) : null, sev: severity, ip: clientIp(req), ua: userAgent(req),
        details: { val: e.details ? JSON.stringify(e.details) : null, type: oracledb.CLOB },
      }
    );
  } catch (err: any) {
    // Never let audit failures break the request — but make them loud.
    logger.error(`Audit write failed for ${e.action}: ${err.message}`);
  }
}

// ── Failed-login monitoring ──
const WINDOW_MS = 10 * 60 * 1000;
const THRESHOLD = 5;
const failures = new Map<string, number[]>();

function bump(key: string): number {
  const now = Date.now();
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  failures.set(key, list);
  if (failures.size > 10_000) failures.delete(failures.keys().next().value!);
  return list.length;
}

export async function recordLoginFailure(req: Request, email: string): Promise<void> {
  const ipCount = bump(`ip:${clientIp(req)}`);
  const acctCount = bump(`acct:${email.toLowerCase()}`);
  const alert = ipCount === THRESHOLD || acctCount === THRESHOLD;
  await audit(req, {
    action: alert ? 'auth.bruteforce_suspected' : 'auth.login_failed',
    severity: alert ? 'ALERT' : 'WARN',
    targetType: 'account',
    targetId: email.toLowerCase().slice(0, 64),
    details: { failuresFromIp: ipCount, failuresForAccount: acctCount, windowMinutes: WINDOW_MS / 60000 },
  });
}

export function clearLoginFailures(email: string) {
  failures.delete(`acct:${email.toLowerCase()}`);
}

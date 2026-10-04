import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../config/oracle';
import type { AuthedRequest } from '../lib/http';
import { audit } from '../lib/audit';

/**
 * Require an ADMIN. The role is re-read from the database on every request (not trusted from the
 * token), so demoting or deactivating an admin takes effect immediately.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = (req as AuthedRequest).user?.id;
    const r = await query<{ USER_ROLE: string; IS_ACTIVE: number }>(
      `SELECT USER_ROLE, IS_ACTIVE FROM TRAJECTORY_USERS WHERE USER_ID = :id`, { id }
    );
    const row = r.rows?.[0];
    if (!row || !row.IS_ACTIVE || row.USER_ROLE !== 'ADMIN') {
      await audit(req, { action: 'admin.access_denied', actorId: id ?? null, severity: 'WARN', targetType: 'route', targetId: req.originalUrl.slice(0, 64) });
      return res.status(403).json({ statusCode: 403, message: 'Administrator access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function generatePassword(): string {
  // 20 chars, guaranteed letter + digit (meets the password policy).
  return 'A' + crypto.randomBytes(15).toString('base64url').slice(0, 18) + '7';
}

/** Create an admin account, or promote/reset an existing one. Returns whether it was created. */
export async function ensureAdmin(email: string, password: string, name = 'Administrator'): Promise<'created' | 'updated'> {
  const e = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 12);
  const existing = await query<{ USER_ID: string }>(`SELECT USER_ID FROM TRAJECTORY_USERS WHERE EMAIL = :e`, { e });
  if (existing.rows?.[0]) {
    await execute(
      `UPDATE TRAJECTORY_USERS SET USER_ROLE = 'ADMIN', IS_ACTIVE = 1, PASSWORD_HASH = :hash, UPDATED_AT = CURRENT_TIMESTAMP WHERE EMAIL = :e`,
      { hash, e }
    );
    return 'updated';
  }
  await execute(
    `INSERT INTO TRAJECTORY_USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, USER_ROLE) VALUES (:id, :e, :hash, :name, 'ADMIN')`,
    { id: uuidv4(), e, hash, name }
  );
  return 'created';
}

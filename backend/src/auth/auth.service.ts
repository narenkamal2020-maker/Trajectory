import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { query, execute, withTransaction } from '../config/oracle';
import { UserRepository, type User } from '../db/repositories/user.repository';
import { ProfileRepository } from '../db/repositories/profile.repository';
import { ResumeRepository } from '../db/repositories/resume.repository';
import { HttpError, conflict, unauthorized } from '../lib/http';

const BCRYPT_ROUNDS = 12;
// Pre-computed hash so login timing doesn't reveal whether an email exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 4);

export interface PublicUser { id: string; email: string; name: string; avatarUrl: string | null; role: 'USER' | 'ADMIN'; createdAt: string }

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
  requiresOnboarding: boolean;
}

const toPublic = (u: User): PublicUser => ({
  id: u.USER_ID,
  email: u.EMAIL,
  name: u.FULL_NAME,
  avatarUrl: u.AVATAR_URL ?? null,
  role: u.USER_ROLE === 'ADMIN' ? 'ADMIN' : 'USER',
  createdAt: new Date(u.CREATED_AT).toISOString(),
});

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export function signAccessToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): { id: string; email: string } {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  if (!payload.sub) throw new Error('Malformed token');
  return { id: String(payload.sub), email: String(payload.email) };
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(48).toString('base64url');
  const expires = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86400_000);
  await execute(
    `INSERT INTO REFRESH_TOKENS (TOKEN_ID, USER_ID, TOKEN_HASH, EXPIRES_AT) VALUES (:id, :userId, :hash, :expires)`,
    { id: uuidv4(), userId, hash: hashToken(token), expires }
  );
  return token;
}

export async function requiresOnboarding(userId: string): Promise<boolean> {
  const profile = await ProfileRepository.findByUserId(userId);
  return !(profile && profile.TARGET_ROLE && profile.EXPERIENCE_LEVEL);
}

async function buildResult(user: User): Promise<AuthResult> {
  const pub = toPublic(user);
  const [refreshToken, onboarding] = await Promise.all([issueRefreshToken(user.USER_ID), requiresOnboarding(user.USER_ID)]);
  return { accessToken: signAccessToken(pub), refreshToken, user: pub, requiresOnboarding: onboarding };
}

export const AuthService = {
  async register(data: { email: string; password: string; name: string; attribution?: Record<string, string | undefined> }): Promise<AuthResult> {
    const email = data.email.trim().toLowerCase();
    if (await UserRepository.findByEmail(email)) throw conflict('An account with this email already exists');
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    try {
      const user = await UserRepository.create({ email, passwordHash, fullName: data.name.trim() });
      if (data.attribution && Object.values(data.attribution).some(Boolean)) {
        await execute(`UPDATE TRAJECTORY_USERS SET SIGNUP_SOURCE = :src WHERE USER_ID = :id`, { src: JSON.stringify(data.attribution).slice(0, 1000), id: user.USER_ID });
      }
      return buildResult(user);
    } catch (err: any) {
      if (String(err?.message).includes('ORA-00001')) throw conflict('An account with this email already exists');
      throw err;
    }
  },

  async login(data: { email: string; password: string }): Promise<AuthResult> {
    const user = await UserRepository.findByEmail(data.email.trim().toLowerCase());
    const ok = await bcrypt.compare(data.password, user?.PASSWORD_HASH ?? DUMMY_HASH);
    if (!user || !ok) throw unauthorized('Invalid email or password');
    return buildResult(user);
  },

  /** Rotate a refresh token. Presenting an already-revoked token revokes the whole family. */
  async refresh(token: string): Promise<AuthResult> {
    const hash = hashToken(token);
    const res = await query<{ TOKEN_ID: string; USER_ID: string; EXPIRES_AT: Date; REVOKED: number }>(
      `SELECT TOKEN_ID, USER_ID, EXPIRES_AT, REVOKED FROM REFRESH_TOKENS WHERE TOKEN_HASH = :hash`,
      { hash }
    );
    const row = res.rows?.[0];
    if (!row) throw unauthorized('Invalid refresh token');
    if (row.REVOKED) {
      await execute(`UPDATE REFRESH_TOKENS SET REVOKED = 1 WHERE USER_ID = :u`, { u: row.USER_ID });
      throw unauthorized('Refresh token reuse detected; all sessions were signed out');
    }
    if (new Date(row.EXPIRES_AT).getTime() < Date.now()) throw unauthorized('Refresh token expired');

    const user = await UserRepository.findById(row.USER_ID);
    if (!user) throw unauthorized('Account no longer exists');
    await execute(`UPDATE REFRESH_TOKENS SET REVOKED = 1 WHERE TOKEN_ID = :id`, { id: row.TOKEN_ID });
    return buildResult(user);
  },

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await execute(`UPDATE REFRESH_TOKENS SET REVOKED = 1 WHERE TOKEN_HASH = :hash`, { hash: hashToken(token) });
  },

  async me(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new HttpError(404, 'User not found');
    const [profile, resume] = await Promise.all([
      ProfileRepository.findByUserId(userId),
      ResumeRepository.findLatestByUserId(userId),
    ]);
    return {
      user: toPublic(user),
      requiresOnboarding: !(profile && profile.TARGET_ROLE && profile.EXPERIENCE_LEVEL),
      hasResume: !!resume,
    };
  },

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await UserRepository.findById(userId);
    if (!user || !(await bcrypt.compare(current, user.PASSWORD_HASH))) throw unauthorized('Current password is incorrect');
    const hash = await bcrypt.hash(next, BCRYPT_ROUNDS);
    await withTransaction(async (conn) => {
      await conn.execute(`UPDATE TRAJECTORY_USERS SET PASSWORD_HASH = :hash, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId`, { hash, userId });
      await conn.execute(`UPDATE REFRESH_TOKENS SET REVOKED = 1 WHERE USER_ID = :userId`, { userId });
    });
  },
};

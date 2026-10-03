import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
  requiresOnboarding: boolean;
};

export class AuthService {
  static async register(data: any): Promise<AuthPayload> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw { statusCode: 400, message: 'Email already in use' };

    const password_hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        name: data.name
      }
    });

    return this.buildAuthResponse(user);
  }

  static async login(data: any): Promise<AuthPayload> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw { statusCode: 401, message: 'Invalid credentials' };

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) throw { statusCode: 401, message: 'Invalid credentials' };

    return this.buildAuthResponse(user);
  }

  static async refreshToken(token: string): Promise<AuthPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw new Error();
      return this.buildAuthResponse(user);
    } catch (e) {
      throw { statusCode: 403, message: 'Invalid refresh token' };
    }
  }

  private static async buildAuthResponse(user: any): Promise<AuthPayload> {
    const [profile, latestResume] = await Promise.all([
      prisma.userProfile.findUnique({ where: { user_id: user.id } }),
      prisma.resume.findFirst({ where: { user_id: user.id }, orderBy: { created_at: 'desc' } })
    ]);

    const requiresOnboarding = !profile || !latestResume;
    const accessToken = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      requiresOnboarding,
      user: { id: user.id, name: user.name, email: user.email }
    };
  }
}

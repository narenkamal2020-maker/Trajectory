import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const { accessToken, refreshToken, user, requiresOnboarding } = await AuthService.register(data);
    
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user, requiresOnboarding });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken, user, requiresOnboarding } = await AuthService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user, requiresOnboarding });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token missing' });

    const { accessToken, refreshToken, user, requiresOnboarding } = await AuthService.refreshToken(token);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user, requiresOnboarding });
  } catch (err) {
    next(err);
  }
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

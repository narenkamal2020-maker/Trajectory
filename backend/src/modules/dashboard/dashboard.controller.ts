import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { buildDashboardOverview } from '../../services/dashboard.service';

export const getOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const overview = await buildDashboardOverview(req.user!.id);
    res.json(overview);
  } catch (err) {
    next(err);
  }
};

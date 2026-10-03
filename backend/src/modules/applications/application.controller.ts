import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { z } from 'zod';
import { AuthRequest } from '../../auth/auth.middleware';

const appSchema = z.object({
  company_name: z.string().min(1),
  job_title: z.string().min(1),
  stage: z.enum(['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
  salary_package: z.string().optional(),
  job_description_text: z.string().optional(),
  reminder_date: z.string().datetime().optional()
});

export const createApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = appSchema.parse(req.body);
    const app = await prisma.application.create({
      data: {
        ...data,
        user_id: req.user!.id
      }
    });
    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
};

export const getApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apps = await prisma.application.findMany({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

export const getDashboardAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    // Fast grouped aggregates
    const stageCounts = await prisma.application.groupBy({
      by: ['stage'],
      where: { user_id: userId },
      _count: { id: true }
    });

    // We can add raw SQL or more aggregations if needed
    const total = stageCounts.reduce((acc, curr) => acc + curr._count.id, 0);

    res.json({
      total_applications: total,
      funnel: stageCounts.map(sc => ({ stage: sc.stage, count: sc._count.id }))
    });
  } catch (err) {
    next(err);
  }
};

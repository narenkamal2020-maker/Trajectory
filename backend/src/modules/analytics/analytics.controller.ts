import { Request, Response, NextFunction } from 'express';
import { SnapshotRepository, RecommendationRepository, SubmissionRepository } from '../../db/repositories';

export const getTrajectoryAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.USER_ID;
    const [history, recommendations, userStats] = await Promise.all([
      SnapshotRepository.getHistory(userId, 30),
      RecommendationRepository.findActiveByUser(userId, 5),
      SubmissionRepository.getUserStats(userId),
    ]);

    res.json({
      history,
      recommendations,
      stats: userStats,
    });
  } catch (err) {
    next(err);
  }
};

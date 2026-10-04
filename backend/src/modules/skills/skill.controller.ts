import { Request, Response, NextFunction } from 'express';
import { SkillRepository } from '../../db/repositories';

export const getSkillCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await SkillRepository.getAllCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

export const getUserSkills = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.USER_ID;
    const [skills, summary, weakSkills] = await Promise.all([
      SkillRepository.getUserSkills(userId),
      SkillRepository.getUserSkillSummary(userId),
      SkillRepository.getWeakSkills(userId, 5),
    ]);
    res.json({ skills, summary, weakSkills });
  } catch (err) {
    next(err);
  }
};

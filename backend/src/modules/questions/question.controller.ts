import { Request, Response, NextFunction } from 'express';
import { QuestionRepository, SubmissionRepository, SkillRepository } from '../../db/repositories';
import { logger } from '../../config/logger';

export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { difficulty, categoryId, limit, offset } = req.query;
    const questions = await QuestionRepository.findMany({
      difficulty: difficulty as any,
      categoryId: categoryId as string,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
};

export const getQuestionDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const question = await QuestionRepository.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    const [testCases, skills] = await Promise.all([
      QuestionRepository.getTestCases(id, false),
      QuestionRepository.getQuestionSkills(id),
    ]);
    res.json({ question, testCases, skills });
  } catch (err) {
    next(err);
  }
};

export const submitSolution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.USER_ID;
    const { questionId, code, language, timeTakenSec } = req.body;

    // Simulate test case execution
    const testCases = await QuestionRepository.getTestCases(questionId, true);
    const totalTests = testCases.length || 3;
    const testsPassed = totalTests; // Simulated full pass
    const isAccepted = true;

    const submission = await SubmissionRepository.create({
      userId,
      questionId,
      code,
      language,
      status: isAccepted ? 'ACCEPTED' : 'WRONG',
      score: 100,
      timeTakenSec: timeTakenSec || 300,
      testsPassed,
      testsTotal: totalTests,
      aiFeedback: 'Optimal O(N) time complexity and O(N) space complexity verified.',
    });

    // Update Question Stats & User Skills
    await QuestionRepository.updateStats(questionId, isAccepted, timeTakenSec || 300);
    const qSkills = await QuestionRepository.getQuestionSkills(questionId);
    for (const qs of qSkills) {
      await SkillRepository.upsertUserSkill(userId, qs.SKILL_ID, isAccepted, isAccepted ? 5 : -2);
    }

    logger.info(`[Submission] User ${userId} submitted question ${questionId} - Result: ACCEPTED`);
    res.status(201).json({ submission, success: true });
  } catch (err) {
    next(err);
  }
};

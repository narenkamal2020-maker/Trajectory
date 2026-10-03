import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthRequest } from '../../auth/auth.middleware';
import { z } from 'zod';

// Mock LLM integrations
const generateFirstQuestion = async (jobProfile: string) => `Tell me about your experience related to ${jobProfile}?`;
const evaluateResponseAndGenerateNext = async (text: string) => ({
  feedback: { strength: 'Good clarity', weakness: 'Lacked STAR method' },
  nextQuestion: 'Can you provide a specific example where you resolved a conflict?'
});
const finalizeEvaluation = async (history: any[]) => ({
  overall: 85, comms: 88, tech: 80, problem_solving: 87
});

const startSchema = z.object({
  job_profile: z.string(),
  application_id: z.string().optional()
});

export const startInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = startSchema.parse(req.body);
    const interview = await prisma.mockInterview.create({
      data: {
        user_id: req.user!.id,
        job_profile: data.job_profile,
        application_id: data.application_id
      }
    });

    const initialQ = await generateFirstQuestion(data.job_profile);

    await prisma.interviewChatHistory.create({
      data: {
        interview_id: interview.id,
        role: 'INTERVIEWER',
        message_content: initialQ
      }
    });

    res.status(201).json({ interview_id: interview.id, question: initialQ });
  } catch (err) {
    next(err);
  }
};

export const respondToInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    // Save user response
    await prisma.interviewChatHistory.create({
      data: { interview_id: id, role: 'USER', message_content: text }
    });

    // Evaluate & Get next question
    const result = await evaluateResponseAndGenerateNext(text);

    // Save interviewer response
    const nextMsg = await prisma.interviewChatHistory.create({
      data: { 
        interview_id: id, 
        role: 'INTERVIEWER', 
        message_content: result.nextQuestion,
        evaluation_feedback: result.feedback
      }
    });

    res.json(nextMsg);
  } catch (err) {
    next(err);
  }
};

export const finalizeInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const history = await prisma.interviewChatHistory.findMany({ where: { interview_id: id }, orderBy: { timestamp: 'asc' }});
    
    const scores = await finalizeEvaluation(history);

    const updated = await prisma.mockInterview.update({
      where: { id },
      data: {
        overall_score: scores.overall,
        communication_score: scores.comms,
        technical_score: scores.tech,
        problem_solving_score: scores.problem_solving
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

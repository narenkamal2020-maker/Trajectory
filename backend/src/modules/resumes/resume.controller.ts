import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import pdfParse from 'pdf-parse';
import { AuthRequest } from '../../auth/auth.middleware';
import { analysisQueue } from '../../workers/queue';
import { logger } from '../../config/logger';
import { redis } from '../../config/redis';

const extractResumeMetadata = (text: string) => {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const wordCount = text.split(/\s+/).length;
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/\+?1?\s*\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/);
  const urlMatch = text.match(/https?:\/\/[^\s]+/);

  return {
    lineCount: lines.length,
    wordCount,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    website: urlMatch ? urlMatch[0] : null,
    estimatedLength: wordCount < 150 ? 'brief' : wordCount > 700 ? 'lengthy' : 'standard'
  };
};

export const uploadAndAnalyze = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    logger.info(`[${req.user!.id}] Processing resume upload: ${req.file.originalname}`);

    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);
    const text = data.text.trim();

    if (text.length < 50) {
      logger.warn(`[${req.user!.id}] Resume text too short (${text.length} chars)`);
      return res.status(400).json({ error: 'Resume file appears to be empty or corrupted' });
    }

    const metadata = extractResumeMetadata(text);

    const resume = await prisma.resume.create({
      data: {
        user_id: req.user!.id,
        file_url: `s3://launchlane-resumes/${Date.now()}-${req.file.originalname}`,
        parsed_text: text,
        parsed_json_data: { metadata, textLength: text.length, fileName: req.file.originalname }
      }
    });

    logger.info(`[${req.user!.id}] Resume created: ${resume.id}, text length: ${text.length}`);

    await analysisQueue.add(
      'resume-analysis',
      { userId: req.user!.id, resumeId: resume.id },
      { priority: 10, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );

    await redis.del(`user:dashboard:cache:${req.user!.id}`);

    res.status(201).json({
      message: 'Resume uploaded, processing started.',
      resumeId: resume.id,
      metadata,
      analysisQueued: true
    });
  } catch (err) {
    logger.error(`[${req.user!.id}] Resume upload failed:`, err);
    next(err);
  }
};

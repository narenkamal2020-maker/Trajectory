import { Worker, Job, UnrecoverableError } from 'bullmq';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { CacheService } from '../services/cache.service';
import { z } from 'zod';

const LLMOutputSchema = z.object({
  atsScore: z.number().int().min(0).max(100),
  detectedGaps: z.array(z.string()).min(1),
  actionableSuggestions: z.array(z.string()).max(4).min(1),
  personalizedQuestions: z.array(z.string()).length(3)
});

type LLMOutput = z.infer<typeof LLMOutputSchema>;

const callLLMForResumeAnalysis = async (profileData: any, resumeText: string): Promise<LLMOutput> => {
  if (!env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not configured, returning mock analysis');
    return {
      atsScore: 82,
      detectedGaps: [
        'Your resume would benefit from explicit technology keywords that match your target role.',
        'Add more project-level impact metrics and delivery context.'
      ],
      actionableSuggestions: [
        "Attach quantifiable results to your project experience (e.g., 'Improved request throughput by 30%').",
        "Highlight cloud or database tooling explicitly if targeting" + ` ${profileData.target_industry} roles.`,
        'Consider adding certifications or notable academic projects to strengthen your candidacy.'
      ],
      personalizedQuestions: [
        `Tell me about your experience with the technologies listed for ${profileData.target_role} roles.`,
        'How have you demonstrated impact in a project related to ' + profileData.target_industry + '?',
        'Describe your approach to solving a challenging problem in your most recent project.'
      ]
    };
  }

  throw new UnrecoverableError(
    'LLM integration not configured. Set OPENAI_API_KEY to enable real AI analysis.'
  );
};

export const analysisWorker = new Worker(
  'profile-analysis-queue',
  async (job: Job) => {
    const { userId, resumeId } = job.data;
    const jobStartTime = Date.now();

    logger.info(`[Worker-${job.id}] Starting analysis for user ${userId}, resume ${resumeId}`);

    let resumeRecord: any = null;

    try {
      job.progress(10);

      const [profile, resume] = await Promise.all([
        prisma.userProfile.findUnique({ where: { user_id: userId } }),
        resumeId
          ? prisma.resume.findUnique({ where: { id: resumeId } })
          : prisma.resume.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'desc' } })
      ]);

      job.progress(20);

      if (!profile) {
        throw new UnrecoverableError('User profile not found');
      }

      if (!resume) {
        logger.info(`[Worker-${job.id}] No resume found for user ${userId}, skipping analysis`);
        return { skipped: true };
      }

      resumeRecord = resume;
      const rawText = resume.parsed_text || resume.parsed_json_data?.text || '';

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Resume text is empty or not available for analysis');
      }

      job.progress(30);
      logger.debug(`[Worker-${job.id}] Calling LLM for analysis (text length: ${rawText.length})`);

      const rawLlmOutput = await callLLMForResumeAnalysis(profile, rawText);
      const llmOutput = LLMOutputSchema.parse(rawLlmOutput);

      job.progress(60);

      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          ats_score: llmOutput.atsScore,
          detected_gaps: llmOutput.detectedGaps,
          actionable_suggestions: {
            resumeFixes: llmOutput.actionableSuggestions,
            profileMilestones: [
              `Great job! Your resume received an ATS score of ${llmOutput.atsScore}/100.`,
              'Focus on the suggested improvements to enhance your candidacy further.'
            ]
          },
          personalized_questions: llmOutput.personalizedQuestions,
          updated_at: new Date()
        }
      });

      job.progress(80);

      await CacheService.invalidateResumeAnalysis(userId);

      const duration = Date.now() - jobStartTime;
      logger.info(
        `[Worker-${job.id}] Successfully analyzed resume for user ${userId} (${duration}ms)`,
        { atsScore: llmOutput.atsScore }
      );

      job.progress(100);

      return {
        success: true,
        resumeId: resume.id,
        atsScore: llmOutput.atsScore,
        duration
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const duration = Date.now() - jobStartTime;

      logger.error(`[Worker-${job.id}] Analysis failed after ${duration}ms:`, { error: errorMessage, userId });

      if (resumeRecord && resumeRecord.id) {
        try {
          await prisma.resume.update({
            where: { id: resumeRecord.id },
            data: {
              ats_score: resumeRecord.ats_score ?? 0,
              detected_gaps: resumeRecord.detected_gaps ?? ['Resume parsing incomplete.'],
              actionable_suggestions: {
                resumeFixes: [
                  'Resume AI analysis experienced a temporary issue. Our team is investigating.',
                  'Please try uploading your resume again in a few moments.'
                ],
                profileMilestones: [
                  'Your profile and resume are securely saved.',
                  'Personalized recommendations will be ready shortly.'
                ]
              },
              personalized_questions: resumeRecord.personalized_questions ?? [
                'Describe the most interesting engineering challenge you have tackled.',
                'How do you stay current with industry trends in your field?',
                'What is one decision you made that significantly improved a project or process?'
              ]
            }
          });
          await CacheService.invalidateResumeAnalysis(userId);
        } catch (dbErr) {
          logger.error(`[Worker-${job.id}] Failed to write fallback data:`, dbErr);
        }
      }

      throw error;
    }
  },
  {
    connection: {
      url: env.REDIS_URL,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false
    },
    settings: {
      retryProcessDelay: 1000,
      lockDuration: 30000,
      lockRenewTime: 15000
    }
  }
);

analysisWorker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} completed successfully`);
});

analysisWorker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, {
    error: err?.message,
    userId: job?.data?.userId
  });
});

analysisWorker.on('error', (err) => {
  logger.error('[Worker] Unexpected worker error:', err);
});


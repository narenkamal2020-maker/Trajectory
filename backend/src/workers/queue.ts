import { Queue } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const analysisQueue = new Queue('profile-analysis-queue', {
  connection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: true
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 }
  }
});

analysisQueue.on('error', (err) => {
  logger.error('Queue connection error:', err);
});

analysisQueue.on('paused', () => {
  logger.warn('Analysis queue paused');
});

analysisQueue.on('resumed', () => {
  logger.info('Analysis queue resumed');
});

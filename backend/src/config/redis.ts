import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  reconnectOnError: (err) => {
    logger.warn('Redis reconnect attempt due to error', err.message);
    return true;
  }
});

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

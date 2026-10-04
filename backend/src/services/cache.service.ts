import { redis } from '../config/redis';
import { logger } from '../config/logger';

const CACHE_KEYS = {
  DASHBOARD: (userId: string) => `user:dashboard:cache:${userId}`,
  ONBOARDING: (userId: string) => `user:onboarding:status:${userId}`,
  RESUME_ANALYSIS: (resumeId: string) => `resume:analysis:${resumeId}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`
};

const TTL = {
  DASHBOARD: 5 * 60, // 5 minutes
  ONBOARDING: 2 * 60, // 2 minutes
  RESUME_ANALYSIS: 30 * 60, // 30 minutes
  USER_PROFILE: 10 * 60 // 10 minutes
};

export class CacheService {
  static async getOrNull<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (err) {
      logger.warn(`Cache get failed for key ${key}:`, err);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      logger.warn(`Cache set failed for key ${key}:`, err);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn(`Cache delete failed for key ${key}:`, err);
    }
  }

  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.warn(`Cache pattern delete failed for pattern ${pattern}:`, err);
    }
  }

  static async invalidateDashboard(userId: string): Promise<void> {
    await this.delete(CACHE_KEYS.DASHBOARD(userId));
  }

  static async invalidateUserProfile(userId: string): Promise<void> {
    await this.delete(CACHE_KEYS.USER_PROFILE(userId));
    await this.invalidateDashboard(userId);
  }

  static async invalidateResumeAnalysis(userId: string): Promise<void> {
    await this.deletePattern(`resume:analysis:*`);
    await this.invalidateDashboard(userId);
  }

  // Typed cache getters/setters
  static async getDashboard<T>(userId: string): Promise<T | null> {
    return this.getOrNull(CACHE_KEYS.DASHBOARD(userId));
  }

  static async setDashboard<T>(userId: string, value: T): Promise<void> {
    await this.set(CACHE_KEYS.DASHBOARD(userId), value, TTL.DASHBOARD);
  }

  static async getOnboardingStatus<T>(userId: string): Promise<T | null> {
    return this.getOrNull(CACHE_KEYS.ONBOARDING(userId));
  }

  static async setOnboardingStatus<T>(userId: string, value: T): Promise<void> {
    await this.set(CACHE_KEYS.ONBOARDING(userId), value, TTL.ONBOARDING);
  }
}
import { logger } from '../config/logger';

/**
 * In-process background job queue with retries and exponential backoff.
 * Replaces BullMQ/Redis for single-node deployments; the interface is small enough to
 * swap for a distributed queue later without touching callers.
 */
type JobFn = () => Promise<void>;

interface Job { name: string; fn: JobFn; attempt: number; maxAttempts: number }

const queue: Job[] = [];
let running = 0;
const CONCURRENCY = 2;
const BASE_DELAY_MS = 500;
let idleWaiters: Array<() => void> = [];

function pump(): void {
  while (running < CONCURRENCY && queue.length) {
    const job = queue.shift()!;
    running++;
    job.fn()
      .then(() => logger.debug(`job ok: ${job.name}`))
      .catch((err) => {
        if (job.attempt + 1 < job.maxAttempts) {
          const delay = BASE_DELAY_MS * 2 ** job.attempt;
          logger.warn(`job failed (attempt ${job.attempt + 1}/${job.maxAttempts}), retrying in ${delay}ms: ${job.name}`, { error: err?.message });
          setTimeout(() => { queue.push({ ...job, attempt: job.attempt + 1 }); pump(); }, delay);
        } else {
          logger.error(`job failed permanently: ${job.name}`, { error: err?.message });
        }
      })
      .finally(() => {
        running--;
        pump();
        if (running === 0 && queue.length === 0) {
          const w = idleWaiters; idleWaiters = []; w.forEach((r) => r());
        }
      });
  }
}

export function enqueue(name: string, fn: JobFn, maxAttempts = 3): void {
  queue.push({ name, fn, attempt: 0, maxAttempts });
  setImmediate(pump);
}

/** Resolves when no jobs are queued or running (used by tests and graceful shutdown). */
export function drain(): Promise<void> {
  if (running === 0 && queue.length === 0) return Promise.resolve();
  return new Promise((resolve) => idleWaiters.push(resolve));
}

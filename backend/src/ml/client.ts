/**
 * Client for the Python ML inference service (ml/serve.py).
 * Short timeouts + a circuit breaker: if the service is down, callers get `null` immediately
 * and use the rule-based path instead of waiting on every request.
 */
import { env } from '../config/env';
import { logger } from '../config/logger';

const TIMEOUT_MS = 800;
const COOLDOWN_MS = 30_000;
let openUntil = 0;

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (Date.now() < openUntil) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${env.ML_SERVICE_URL}${path}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`ML service ${r.status}`);
    return (await r.json()) as T;
  } catch (err: any) {
    if (Date.now() >= openUntil) logger.info(`ML service unavailable (${err.message}); using rules for ${COOLDOWN_MS / 1000}s`);
    openUntil = Date.now() + COOLDOWN_MS;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface SolveFeatures {
  proficiency: number;      // weighted avg proficiency over the question's skills
  min_proficiency: number;  // weakest linked skill
  difficulty: number;       // 0 easy, 1 medium, 2 hard
  attempts_on_skill: number;
  prior_attempts_on_question: number;
  solve_rate: number;       // global question solve rate 0..1 (0.5 if unknown)
  days_since_practice: number;
}

export const mlClient = {
  /** P(user solves question) for a batch of feature rows. */
  async solveProbabilities(rows: SolveFeatures[]): Promise<number[] | null> {
    if (!rows.length) return [];
    const res = await post<{ probabilities: number[] }>('/predict/solve', { rows });
    return res?.probabilities?.length === rows.length ? res.probabilities : null;
  },

  /** Best-fit roles for a resume text. */
  async roleFit(text: string): Promise<Array<{ role: string; probability: number }> | null> {
    const res = await post<{ roles: Array<{ role: string; probability: number }> }>('/predict/role', { text });
    return res?.roles ?? null;
  },

  async health(): Promise<{ ok: boolean; models?: Record<string, unknown> } | null> {
    if (Date.now() < openUntil) return null;
    try {
      const r = await fetch(`${env.ML_SERVICE_URL}/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      return r.ok ? ((await r.json()) as any) : null;
    } catch {
      return null;
    }
  },

  /** Test hook. */
  resetCircuit() { openUntil = 0; },
};

export const difficultyCode = (d: string) => (d === 'EASY' ? 0 : d === 'MEDIUM' ? 1 : 2);

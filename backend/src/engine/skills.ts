/**
 * Skill proficiency model (0–100), Elo-style.
 * Each question difficulty has a rating; the expected success probability for a learner is a
 * logistic function of (proficiency − rating). After an attempt, proficiency moves toward the
 * observed outcome in proportion to how surprising it was, scaled by the question's skill weight.
 */
import { clamp, round } from '../lib/util';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Calibrated so a learner at proficiency ≈ rating has a 50% chance, and one band below ≈ 25%.
export const DIFFICULTY_RATING: Record<Difficulty, number> = { EASY: 20, MEDIUM: 45, HARD: 70 };
const SCALE = 20;
const BASE_K = 16;

export function expectedSuccess(proficiency: number, difficulty: Difficulty): number {
  return 1 / (1 + Math.exp(-(proficiency - DIFFICULTY_RATING[difficulty]) / SCALE));
}

export interface SkillState { proficiency: number; attempts: number }

export interface AttemptOutcome {
  difficulty: Difficulty;
  /** Fraction of tests passed, 0..1. */
  score: number;
  /** Question → skill relevance weight, 0..1. */
  weight: number;
  usedHint?: boolean;
  /** The user had already solved this question before (practice repeats count less). */
  alreadySolved?: boolean;
}

export function updateProficiency(state: SkillState, o: AttemptOutcome): { proficiency: number; delta: number } {
  const expected = expectedSuccess(state.proficiency, o.difficulty);
  // Partial credit counts, but a full solve is worth noticeably more than "almost".
  let outcome = o.score >= 1 ? 1 : o.score * 0.6;
  if (o.usedHint) outcome *= 0.8;
  let k = BASE_K * o.weight * (state.attempts < 5 ? 1.5 : 1);
  if (o.alreadySolved) k *= 0.3;
  let delta = k * (outcome - expected);
  // Failing never costs more than 6 points in one go — practice should feel safe.
  delta = Math.max(delta, -6);
  const proficiency = round(clamp(state.proficiency + delta, 0, 100), 2);
  return { proficiency, delta: round(proficiency - state.proficiency, 2) };
}

/**
 * Interview evidence: an interview score is itself an estimate of the skill, so proficiency moves
 * toward it as an exponential moving average (faster while the skill has little evidence).
 */
export function blendInterviewScore(state: SkillState, score: number): { proficiency: number; delta: number } {
  const alpha = state.attempts < 3 ? 0.5 : 0.3;
  const proficiency = round(clamp(state.proficiency + alpha * (score - state.proficiency), 0, 100), 2);
  return { proficiency, delta: round(proficiency - state.proficiency, 2) };
}

/** Proficiency band labels used throughout the UI. */
export function band(proficiency: number): 'novice' | 'developing' | 'proficient' | 'expert' {
  if (proficiency >= 85) return 'expert';
  if (proficiency >= 65) return 'proficient';
  if (proficiency >= 35) return 'developing';
  return 'novice';
}

/** Choose the difficulty that gives roughly a 55–75% success chance. */
export function targetDifficulty(proficiency: number): Difficulty {
  if (proficiency < 35) return 'EASY';
  if (proficiency < 60) return 'MEDIUM';
  return 'HARD';
}

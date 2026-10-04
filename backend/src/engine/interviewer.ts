/**
 * Rule-based interview evaluator. Scores each answer on four signals and aggregates them into
 * technical / communication / problem-solving scores. Used directly when no LLM is configured,
 * and as the fallback when the LLM call fails.
 */
import { clamp, round } from '../lib/util';
import type { InterviewQuestion, InterviewType } from './interview-bank';

export interface AnswerEvaluation {
  technical: number;
  communication: number;
  problemSolving: number;
  overall: number;
  coverage: number; // 0..1
  matchedConcepts: string[];
  missedConcepts: string[];
  strengths: string[];
  improvements: string[];
  needsFollowUp: boolean;
  source: 'rules' | 'llm';
}

const FILLERS = ['um', 'uh', 'like', 'basically', 'you know', 'kind of', 'sort of', 'literally', 'actually'];
const REASONING = ['because', 'trade-off', 'tradeoff', 'however', 'therefore', 'so that', 'which means', 'alternatively', 'instead', 'complexity', 'o(', 'first', 'then', 'finally', 'edge case', 'assume', 'depends'];
const STAR = {
  situation: ['when i', 'at my', 'during', 'project', 'team', 'situation', 'we were', 'internship', 'company'],
  task: ['goal', 'responsible', 'needed to', 'task', 'had to', 'my role', 'objective'],
  action: ['i built', 'i decided', 'i implemented', 'i led', 'i wrote', 'i designed', 'i proposed', 'i created', 'i organized', 'i talked', 'i set up', 'i worked'],
  result: ['result', 'as a result', 'reduced', 'increased', 'improved', 'saved', 'shipped', 'launched', 'delivered', 'learned', 'outcome'],
};

const has = (text: string, kw: string) => {
  // Word-boundary match for plain words, substring match for phrases/symbols.
  if (/^[a-z]+$/.test(kw)) return new RegExp(`\\b${kw}`, 'i').test(text);
  return text.includes(kw);
};

export function evaluateAnswer(question: InterviewQuestion, answer: string, isFollowUp = false): AnswerEvaluation {
  const text = answer.toLowerCase().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const sentences = Math.max(1, (answer.match(/[.!?]+(\s|$)/g) ?? []).length);
  const avgSentence = words / sentences;

  const matched = question.concepts.filter((c) => c.keywords.some((k) => has(text, k)));
  const coverage = question.concepts.length ? matched.length / question.concepts.length : 0;

  const numbers = (answer.match(/\b\d+(\.\d+)?\s*(%|x|ms|s|k|m|users|requests|percent)?\b/gi) ?? []).length;
  const specificity = clamp(numbers * 0.25 + (/\b[A-Z][a-zA-Z]+(?:\.js|DB|SQL)?\b/.test(answer) ? 0.2 : 0), 0, 1);

  const fillerCount = FILLERS.reduce((n, f) => n + (text.match(new RegExp(`\\b${f}\\b`, 'g'))?.length ?? 0), 0);
  const fillerRate = words ? fillerCount / words : 0;
  const lengthScore = words < 15 ? words / 15 * 0.4 : words < 40 ? 0.4 + (words - 15) / 25 * 0.5 : words <= 350 ? 1 : Math.max(0.6, 1 - (words - 350) / 500);
  const sentenceScore = avgSentence <= 30 ? 1 : Math.max(0.4, 1 - (avgSentence - 30) / 40);
  const clarity = clamp(lengthScore * 0.5 + sentenceScore * 0.3 + (1 - Math.min(1, fillerRate * 12)) * 0.2, 0, 1);

  const reasoningHits = REASONING.filter((r) => text.includes(r)).length;
  const reasoning = clamp(reasoningHits / 4, 0, 1);

  const isBehavioral = question.type === 'BEHAVIORAL';
  const starHits = Object.values(STAR).filter((kws) => kws.some((k) => text.includes(k))).length;
  const structure = isBehavioral ? starHits / 4 : clamp(reasoningHits / 3, 0, 1);

  const technical = round(clamp((coverage * 0.75 + specificity * 0.25) * 100, 0, 100));
  const communication = round(clamp((clarity * 0.55 + structure * 0.45) * 100, 0, 100));
  const problemSolving = round(clamp((reasoning * 0.5 + coverage * 0.35 + structure * 0.15) * 100, 0, 100));
  const overall = round(overallFor(question.type, { technical, communication, problemSolving }));

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (coverage >= 0.75) strengths.push(`Covered the key ideas: ${matched.map((m) => m.label).join(', ')}.`);
  else if (matched.length) strengths.push(`Touched on ${matched.map((m) => m.label).join(', ')}.`);
  if (numbers >= 2) strengths.push('Backed claims with concrete numbers.');
  if (isBehavioral && starHits >= 3) strengths.push('Clear STAR structure.');
  if (!isBehavioral && reasoningHits >= 3) strengths.push('Explained reasoning and trade-offs.');

  const missed = question.concepts.filter((c) => !matched.includes(c));
  if (missed.length) improvements.push(`Address: ${missed.map((m) => m.label).join(', ')}.`);
  if (words < 40) improvements.push('Expand your answer — aim for 1–2 minutes of explanation.');
  if (words > 400) improvements.push('Tighten the answer; lead with the main point.');
  if (fillerRate > 0.03) improvements.push('Cut filler words ("basically", "like", "um").');
  if (isBehavioral && starHits < 3) improvements.push('Use STAR: Situation, Task, Action (what *you* did), Result.');
  if (isBehavioral && numbers === 0) improvements.push('Quantify the result (time saved, % improvement, users affected).');
  if (!isBehavioral && reasoningHits < 2) improvements.push('Say *why*: state assumptions, complexity and trade-offs explicitly.');

  return {
    technical, communication, problemSolving, overall,
    coverage: round(coverage, 2),
    matchedConcepts: matched.map((m) => m.label),
    missedConcepts: missed.map((m) => m.label),
    strengths, improvements,
    needsFollowUp: !isFollowUp && coverage < 0.5,
    source: 'rules',
  };
}

export function overallFor(type: InterviewType, s: { technical: number; communication: number; problemSolving: number }): number {
  const w = type === 'BEHAVIORAL'
    ? { t: 0.2, c: 0.5, p: 0.3 }
    : type === 'SYSTEM_DESIGN'
      ? { t: 0.4, c: 0.2, p: 0.4 }
      : { t: 0.5, c: 0.2, p: 0.3 };
  return s.technical * w.t + s.communication * w.c + s.problemSolving * w.p;
}

/** Aggregate per-answer evaluations into final interview scores. Follow-up answers count half. */
export function summarizeInterview(type: InterviewType, evals: Array<AnswerEvaluation & { weight?: number }>) {
  if (!evals.length) return { technical: 0, communication: 0, problemSolving: 0, overall: 0, strengths: [], improvements: [] };
  let wsum = 0, t = 0, cm = 0, p = 0;
  for (const e of evals) {
    const w = e.weight ?? 1;
    wsum += w; t += e.technical * w; cm += e.communication * w; p += e.problemSolving * w;
  }
  const scores = { technical: round(t / wsum), communication: round(cm / wsum), problemSolving: round(p / wsum) };
  const tally = (lists: string[][]) => {
    const counts = new Map<string, number>();
    lists.flat().forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 4);
  };
  return {
    ...scores,
    overall: round(overallFor(type, scores)),
    strengths: tally(evals.map((e) => e.strengths)),
    improvements: tally(evals.map((e) => e.improvements)),
  };
}

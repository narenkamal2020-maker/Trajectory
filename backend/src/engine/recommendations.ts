/**
 * Rule-based recommendation engine. Pure: takes a snapshot of the learner's state and returns a
 * ranked list. When an ML solve-probability function is supplied, question choice targets the
 * "productive struggle" zone (~65% success); otherwise it falls back to difficulty bands.
 */
import { targetDifficulty, expectedSuccess, type Difficulty } from './skills';
import type { RoleRequirement } from './trajectory';

export type RecType = 'QUESTION' | 'TOPIC' | 'INTERVIEW' | 'RESOURCE' | 'RESUME' | 'CAREER';

export interface RecContext {
  now: Date;
  targetRole: string | null;
  roleRequirements: RoleRequirement[];
  skills: Map<string, { proficiency: number; attempts: number; lastPracticed: Date | null; name: string }>;
  questions: Array<{ id: string; title: string; difficulty: Difficulty; skillIds: string[]; solved: boolean; attempted: boolean }>;
  interviews: Array<{ type: string; overall: number | null; communication: number | null; technical: number | null; completedAt: Date | null }>;
  resume: { atsScore: number | null; status: string; gaps: string[] } | null;
  readiness: number;
  applicationsCount: number;
  /** Optional ML model: P(solve) for (questionId). */
  solveProbability?: (questionId: string) => number | undefined;
  /** Which mock-interview type exercises a skill (for skills coding questions can't cover). */
  interviewForSkill?: (skillId: string) => string | undefined;
}

export interface Recommendation {
  type: RecType;
  entityId: string | null;
  title: string;
  reason: string;
  score: number; // 0..1 priority
  source: 'rules' | 'ml';
}

const DAY = 86400_000;

const zone = (p: number) =>
  p > 0.85 ? 'should be a quick win' : p >= 0.45 ? 'right in the growth zone' : 'a stretch, so skim the hints first';
const SWEET_SPOT = 0.65;

function pickQuestion(ctx: RecContext, skillId: string, proficiency: number, excludeIds: Set<string>) {
  const candidates = ctx.questions.filter((q) => q.skillIds.includes(skillId) && !q.solved && !excludeIds.has(q.id));
  if (!candidates.length) return null;
  if (ctx.solveProbability) {
    let best: { q: (typeof candidates)[number]; p: number } | null = null;
    for (const q of candidates) {
      const p = ctx.solveProbability(q.id);
      if (p === undefined) continue;
      if (!best || Math.abs(p - SWEET_SPOT) < Math.abs(best.p - SWEET_SPOT)) best = { q, p };
    }
    if (best) return { question: best.q, probability: best.p, source: 'ml' as const };
  }
  const want = targetDifficulty(proficiency);
  const order: Difficulty[] = want === 'EASY' ? ['EASY', 'MEDIUM', 'HARD'] : want === 'MEDIUM' ? ['MEDIUM', 'EASY', 'HARD'] : ['HARD', 'MEDIUM', 'EASY'];
  for (const d of order) {
    const q = candidates.find((c) => c.difficulty === d && !c.attempted) ?? candidates.find((c) => c.difficulty === d);
    if (q) return { question: q, probability: expectedSuccess(proficiency, q.difficulty), source: 'rules' as const };
  }
  return null;
}

export function generateRecommendations(ctx: RecContext, limit = 8): Recommendation[] {
  const recs: Recommendation[] = [];
  const used = new Set<string>();

  // 1. Target-role gaps — the backbone of the plan.
  const gaps = ctx.roleRequirements
    .map((r) => {
      const s = ctx.skills.get(r.skillId);
      const prof = s?.proficiency ?? 0;
      return { r, prof, gap: Math.max(0, r.minProf - prof) };
    })
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap * b.r.importance - a.gap * a.r.importance);

  // Walk every gap: up to 3 targeted problems, plus up to 2 gaps that need another route
  // (a mock interview for skills coding questions can't cover, or concept review).
  let questionRecs = 0, otherRecs = 0;
  const interviewTypesUsed = new Set<string>();
  const role = ctx.targetRole ?? 'your target role';
  for (const g of gaps) {
    if (questionRecs >= 3 && otherRecs >= 2) break;
    const priority = Math.min(1, 0.45 + (g.gap / 100) * 0.4 + g.r.importance * 0.15);
    const pick = questionRecs < 3 ? pickQuestion(ctx, g.r.skillId, g.prof, used) : null;
    if (pick) {
      used.add(pick.question.id);
      questionRecs++;
      recs.push({
        type: 'QUESTION',
        entityId: pick.question.id,
        title: `Solve "${pick.question.title}" (${pick.question.difficulty.toLowerCase()})`,
        reason: `${g.r.skillName} is at ${Math.round(g.prof)}/${g.r.minProf} for ${role}. ` +
          `Estimated success chance ${Math.round(pick.probability * 100)}% — ${zone(pick.probability)}.`,
        score: priority,
        source: pick.source,
      });
      continue;
    }
    if (otherRecs >= 2) continue;
    const hasQuestions = ctx.questions.some((q) => q.skillIds.includes(g.r.skillId));
    if (hasQuestions && questionRecs >= 3) continue; // practice exists; it will surface once current picks are done
    const interviewType = ctx.interviewForSkill?.(g.r.skillId);
    if (interviewType && !interviewTypesUsed.has(interviewType)) {
      interviewTypesUsed.add(interviewType);
      otherRecs++;
      recs.push({
        type: 'INTERVIEW',
        entityId: interviewType,
        title: `Mock interview: ${interviewType.replace('_', ' ').toLowerCase()}`,
        reason: `${g.r.skillName} (${Math.round(g.prof)}/${g.r.minProf}) is assessed through conversation rather than code — ` +
          `a ${interviewType.replace('_', ' ').toLowerCase()} interview exercises it directly.`,
        score: priority * 0.95,
        source: 'rules',
      });
    } else if (!interviewType) {
      otherRecs++;
      recs.push({
        type: 'TOPIC',
        entityId: g.r.skillId,
        title: `Deepen ${g.r.skillName}`,
        reason: hasQuestions
          ? `You've solved every ${g.r.skillName} problem in the bank but are at ${Math.round(g.prof)}/${g.r.minProf}. Re-solve them in a new language or explain them aloud.`
          : `${g.r.skillName} is required for ${role} (needs ${g.r.minProf}, you are at ${Math.round(g.prof)}). Review the concepts and build a small project with it.`,
        score: priority * 0.85,
        source: 'rules',
      });
    }
  }

  // 2. Spaced review: decent skills that haven't been touched in two weeks.
  const stale = [...ctx.skills.entries()]
    .filter(([, s]) => s.proficiency >= 50 && s.lastPracticed && ctx.now.getTime() - s.lastPracticed.getTime() > 14 * DAY)
    .sort((a, b) => a[1].lastPracticed!.getTime() - b[1].lastPracticed!.getTime());
  for (const [skillId, s] of stale.slice(0, 1)) {
    const days = Math.floor((ctx.now.getTime() - s.lastPracticed!.getTime()) / DAY);
    recs.push({
      type: 'TOPIC',
      entityId: skillId,
      title: `Refresh ${s.name}`,
      reason: `Last practiced ${days} days ago. A quick review keeps it from decaying.`,
      score: 0.4,
      source: 'rules',
    });
  }

  // 3. Mock interviews.
  const completed = ctx.interviews.filter((i) => i.completedAt);
  const lastInterview = completed.sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];
  if (!lastInterview) {
    recs.push({
      type: 'INTERVIEW', entityId: 'BEHAVIORAL', title: 'Take your first mock interview',
      reason: 'A baseline interview score unlocks communication insights and sharpens your readiness estimate.',
      score: 0.7, source: 'rules',
    });
  } else {
    const daysSince = (ctx.now.getTime() - lastInterview.completedAt!.getTime()) / DAY;
    const weakComm = (lastInterview.communication ?? 100) < 65;
    const weakTech = (lastInterview.technical ?? 100) < 65;
    if (weakComm || weakTech || daysSince > 7) {
      const type = weakComm ? 'BEHAVIORAL' : weakTech ? 'TECHNICAL' : lastInterview.type;
      recs.push({
        type: 'INTERVIEW', entityId: type,
        title: weakComm ? 'Practice a behavioral interview' : weakTech ? 'Practice a technical interview' : 'Keep interview skills warm',
        reason: weakComm
          ? `Last communication score was ${Math.round(lastInterview.communication!)}. Focus on STAR structure and concrete results.`
          : weakTech
            ? `Last technical score was ${Math.round(lastInterview.technical!)}. Explain trade-offs and complexity explicitly.`
            : `It has been ${Math.floor(daysSince)} days since your last mock interview.`,
        score: weakComm || weakTech ? 0.65 : 0.45, source: 'rules',
      });
    }
  }

  // 4. Resume.
  if (!ctx.resume) {
    recs.push({
      type: 'RESUME', entityId: null, title: 'Upload your resume',
      reason: 'Resume analysis seeds your skill map, flags ATS issues and personalizes interview questions.',
      score: 0.75, source: 'rules',
    });
  } else if (ctx.resume.status === 'COMPLETED' && (ctx.resume.atsScore ?? 0) < 70) {
    const gapText = ctx.resume.gaps.length ? ` Missing keywords: ${ctx.resume.gaps.slice(0, 3).join(', ')}.` : '';
    recs.push({
      type: 'RESUME', entityId: null, title: 'Improve your resume ATS score',
      reason: `Current ATS score is ${Math.round(ctx.resume.atsScore ?? 0)}/100.${gapText}`,
      score: 0.6, source: 'rules',
    });
  }

  // 5. Career moves.
  if (!ctx.targetRole) {
    recs.push({
      type: 'CAREER', entityId: null, title: 'Choose a target role',
      reason: 'Recommendations, readiness and your flight path are all computed against a target role.',
      score: 0.9, source: 'rules',
    });
  } else if (ctx.readiness >= 80 && ctx.applicationsCount < 5) {
    recs.push({
      type: 'CAREER', entityId: null, title: `Start applying for ${ctx.targetRole} roles`,
      reason: `You are ${Math.round(ctx.readiness)}% ready. Track applications in the pipeline to keep momentum.`,
      score: 0.8, source: 'rules',
    });
  }

  // 6. Fallback for brand-new learners with no role requirements data.
  if (!recs.some((r) => r.type === 'QUESTION')) {
    const easy = ctx.questions.find((q) => !q.solved && q.difficulty === 'EASY' && !used.has(q.id));
    if (easy) {
      recs.push({
        type: 'QUESTION', entityId: easy.id, title: `Warm up with "${easy.title}"`,
        reason: 'A quick win to calibrate your skill map.', score: 0.5, source: 'rules',
      });
    }
  }

  const seen = new Set<string>();
  return recs
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      const key = `${r.type}:${r.entityId ?? r.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

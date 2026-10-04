import { describe, it, expect } from 'vitest';
import { updateProficiency, expectedSuccess, blendInterviewScore, targetDifficulty, band } from '../../src/engine/skills';
import { computeReadiness, estimateDaysToReady, rankRoles } from '../../src/engine/trajectory';
import { generateRecommendations, type RecContext } from '../../src/engine/recommendations';
import { evaluateAnswer, summarizeInterview } from '../../src/engine/interviewer';
import { findInterviewQuestion, INTERVIEW_BANK } from '../../src/engine/interview-bank';
import { analyzeResume, parseResume, extractExperienceMonths } from '../../src/engine/resume-parser';
import { computeStreak } from '../../src/lib/util';
import { splitSql } from '../../src/db/migrate';

describe('skill model', () => {
  it('expected success rises with proficiency and falls with difficulty', () => {
    expect(expectedSuccess(45, 'MEDIUM')).toBeCloseTo(0.5, 5);
    expect(expectedSuccess(80, 'MEDIUM')).toBeGreaterThan(expectedSuccess(40, 'MEDIUM'));
    expect(expectedSuccess(50, 'EASY')).toBeGreaterThan(expectedSuccess(50, 'HARD'));
  });

  it('a surprising success moves proficiency more than an expected one', () => {
    const novice = updateProficiency({ proficiency: 10, attempts: 10 }, { difficulty: 'HARD', score: 1, weight: 1 });
    const expert = updateProficiency({ proficiency: 90, attempts: 10 }, { difficulty: 'EASY', score: 1, weight: 1 });
    expect(novice.delta).toBeGreaterThan(expert.delta);
    expect(expert.delta).toBeGreaterThan(0);
  });

  it('failure costs at most 6 points and never goes below 0', () => {
    const r = updateProficiency({ proficiency: 95, attempts: 50 }, { difficulty: 'EASY', score: 0, weight: 1 });
    expect(r.delta).toBeGreaterThanOrEqual(-6);
    expect(updateProficiency({ proficiency: 1, attempts: 1 }, { difficulty: 'HARD', score: 0, weight: 1 }).proficiency).toBeGreaterThanOrEqual(0);
  });

  it('hints, repeats and low weight all dampen gains', () => {
    const base = { proficiency: 40, attempts: 10 };
    const full = updateProficiency(base, { difficulty: 'MEDIUM', score: 1, weight: 1 }).delta;
    expect(updateProficiency(base, { difficulty: 'MEDIUM', score: 1, weight: 1, usedHint: true }).delta).toBeLessThan(full);
    expect(updateProficiency(base, { difficulty: 'MEDIUM', score: 1, weight: 1, alreadySolved: true }).delta).toBeLessThan(full);
    expect(updateProficiency(base, { difficulty: 'MEDIUM', score: 1, weight: 0.3 }).delta).toBeLessThan(full);
  });

  it('partial credit is worth less than a full solve', () => {
    const s = { proficiency: 40, attempts: 10 };
    expect(updateProficiency(s, { difficulty: 'MEDIUM', score: 0.8, weight: 1 }).delta)
      .toBeLessThan(updateProficiency(s, { difficulty: 'MEDIUM', score: 1, weight: 1 }).delta);
  });

  it('interview scores pull proficiency toward the observed score', () => {
    expect(blendInterviewScore({ proficiency: 0, attempts: 0 }, 70).proficiency).toBe(35);
    expect(blendInterviewScore({ proficiency: 80, attempts: 10 }, 40).proficiency).toBe(68);
  });

  it('maps proficiency to bands and target difficulty', () => {
    expect(band(10)).toBe('novice');
    expect(band(90)).toBe('expert');
    expect(targetDifficulty(10)).toBe('EASY');
    expect(targetDifficulty(50)).toBe('MEDIUM');
    expect(targetDifficulty(75)).toBe('HARD');
  });
});

describe('trajectory', () => {
  const reqs = [
    { skillId: 'a', skillName: 'A', minProf: 50, importance: 1 },
    { skillId: 'b', skillName: 'B', minProf: 80, importance: 0.5 },
  ];
  it('computes importance-weighted readiness', () => {
    const r = computeReadiness(reqs, new Map([['a', 50], ['b', 40]]));
    // a: 1.0 * 1, b: 0.5 * 0.5 → 1.25 / 1.5
    expect(r.readiness).toBeCloseTo(83.3, 1);
    expect(r.cleared).toBe(1);
    expect(r.waypoints[0].cleared).toBe(true);
    expect(r.remainingGap).toBe(20);
  });

  it('caps over-achievement at 100% per skill', () => {
    expect(computeReadiness(reqs, new Map([['a', 100], ['b', 100]])).readiness).toBe(100);
    expect(computeReadiness([], new Map()).readiness).toBe(0);
  });

  it('estimates ETA from gap velocity', () => {
    const eta = estimateDaysToReady([{ date: '2026-09-01', remainingGap: 100 }, { date: '2026-09-11', remainingGap: 80 }], 80);
    expect(eta.velocityPerDay).toBe(2);
    expect(eta.etaDays).toBe(40);
    expect(estimateDaysToReady([{ date: '2026-09-01', remainingGap: 50 }], 50).etaDays).toBeNull();
    expect(estimateDaysToReady([], 0).etaDays).toBe(0);
  });

  it('ranks roles by readiness', () => {
    const ranked = rankRoles([
      { roleId: 'x', title: 'X', reqs: [{ skillId: 'a', skillName: 'A', minProf: 50, importance: 1 }] },
      { roleId: 'y', title: 'Y', reqs: [{ skillId: 'b', skillName: 'B', minProf: 50, importance: 1 }] },
    ], new Map([['a', 50]]));
    expect(ranked[0].roleId).toBe('x');
  });
});

describe('recommendations', () => {
  const base = (): RecContext => ({
    now: new Date('2026-10-01T00:00:00Z'),
    targetRole: 'Software Engineer',
    roleRequirements: [
      { skillId: 'sk-hashmap', skillName: 'Hash Maps', minProf: 70, importance: 1 },
      { skillId: 'sk-oop-design', skillName: 'Design Patterns', minProf: 60, importance: 0.8 },
    ],
    skills: new Map([['sk-hashmap', { proficiency: 20, attempts: 3, lastPracticed: new Date('2026-09-30'), name: 'Hash Maps' }]]),
    questions: [
      { id: 'q-easy', title: 'Easy one', difficulty: 'EASY', skillIds: ['sk-hashmap'], solved: false, attempted: false },
      { id: 'q-hard', title: 'Hard one', difficulty: 'HARD', skillIds: ['sk-hashmap'], solved: false, attempted: false },
    ],
    interviews: [],
    resume: null,
    readiness: 20,
    applicationsCount: 0,
    interviewForSkill: (id) => (id === 'sk-oop-design' ? 'TECHNICAL' : undefined),
  });

  it('targets the biggest gap with a difficulty-appropriate question', () => {
    const recs = generateRecommendations(base());
    const q = recs.find((r) => r.type === 'QUESTION')!;
    expect(q.entityId).toBe('q-easy');
    expect(q.source).toBe('rules');
  });

  it('routes non-coding skills to the matching interview', () => {
    const recs = generateRecommendations(base());
    expect(recs.find((r) => r.type === 'INTERVIEW' && r.entityId === 'TECHNICAL')).toBeTruthy();
  });

  it('asks for a resume and a target role when missing', () => {
    const ctx = { ...base(), targetRole: null, roleRequirements: [] };
    const types = generateRecommendations(ctx).map((r) => r.type);
    expect(types).toContain('RESUME');
    expect(types).toContain('CAREER');
  });

  it('uses ML probabilities to pick the question nearest 65% success', () => {
    const ctx = { ...base(), solveProbability: (id: string) => (id === 'q-hard' ? 0.62 : 0.97) };
    const q = generateRecommendations(ctx).find((r) => r.type === 'QUESTION')!;
    expect(q.entityId).toBe('q-hard');
    expect(q.source).toBe('ml');
  });

  it('suggests applying once readiness is high', () => {
    const ctx = { ...base(), readiness: 85, roleRequirements: [] };
    expect(generateRecommendations(ctx).some((r) => r.type === 'CAREER' && r.title.startsWith('Start applying'))).toBe(true);
  });

  it('never returns duplicates', () => {
    const recs = generateRecommendations(base(), 20);
    const keys = recs.map((r) => `${r.type}:${r.entityId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('interview evaluator', () => {
  const q = findInterviewQuestion('beh-impact')!;
  it('rewards a structured, quantified STAR answer over a vague one', () => {
    const strong = evaluateAnswer(q, 'The problem was slow reports for our customers, so our goal was sub-second dashboards. I designed a caching layer with Redis and I implemented incremental SQL aggregation in the database. As a result p95 latency dropped from 9 seconds to 1.2 seconds and daily users increased 25%.');
    const weak = evaluateAnswer(q, 'I did some stuff on a project, basically like it was good.');
    expect(strong.overall).toBeGreaterThan(weak.overall + 25);
    expect(strong.coverage).toBe(1);
    expect(weak.needsFollowUp).toBe(true);
    expect(weak.improvements.join(' ')).toMatch(/STAR/);
  });

  it('never asks a follow-up to a follow-up', () => {
    expect(evaluateAnswer(q, 'short', true).needsFollowUp).toBe(false);
  });

  it('weights follow-ups at half in the summary', () => {
    const e1 = { ...evaluateAnswer(q, 'x'), technical: 100, communication: 100, problemSolving: 100 };
    const e2 = { ...evaluateAnswer(q, 'x'), technical: 0, communication: 0, problemSolving: 0, weight: 0.5 };
    expect(summarizeInterview('BEHAVIORAL', [e1, e2]).technical).toBeCloseTo(66.7, 1);
  });

  it('has a sane bank (unique ids, each type populated)', () => {
    expect(new Set(INTERVIEW_BANK.map((x) => x.id)).size).toBe(INTERVIEW_BANK.length);
    for (const t of ['TECHNICAL', 'DSA', 'SQL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'ROLE_SPECIFIC']) {
      expect(INTERVIEW_BANK.filter((x) => x.type === t).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('resume parser', () => {
  const resume = `Sam Lee
sam@example.com | (415) 555-0100 | github.com/samlee | linkedin.com/in/samlee

EXPERIENCE
Software Engineer, Acme — Jan 2023 – Present
• Built a React and TypeScript dashboard used by 8,000 users
• Reduced AWS costs 22% by migrating jobs to Docker on Kubernetes
• Responsible for on-call
Intern, Beta Corp — Jun 2022 – Aug 2022
• Wrote Python scripts to automate reporting, saving 10 hours per week

EDUCATION
B.Tech Computer Science — 2019 – 2023 — CGPA 8.9/10

SKILLS
Python, SQL, React, Node.js, Redis, GitHub Actions`;

  it('extracts contact, sections and skills', () => {
    const p = parseResume(resume, new Date('2026-10-01'));
    expect(p.contact.email).toBe('sam@example.com');
    expect(p.contact.links.length).toBe(2);
    expect(p.sections).toEqual(expect.arrayContaining(['experience', 'education', 'skills']));
    const ids = p.skills.map((s) => s.skillId);
    expect(ids).toEqual(expect.arrayContaining(['sk-react', 'sk-js', 'sk-python', 'sk-sql-joins', 'sk-docker', 'sk-cloud', 'sk-sd-caching', 'sk-cicd', 'sk-node']));
    expect(p.education.degree).toMatch(/B\.?Tech/i);
    expect(p.education.gpa).toBe('8.9/10');
    expect(p.bullets.total).toBe(4);
    expect(p.bullets.quantified).toBe(3);
    expect(p.bullets.weakPhrases).toBe(1);
  });

  it('merges overlapping date ranges when computing experience', () => {
    // 2019–2023 education overlaps both jobs; Jan 2019 → Oct 2026 merged.
    expect(extractExperienceMonths('Jan 2023 – Mar 2023\nFeb 2023 - Apr 2023', new Date('2026-10-01'))).toBe(4);
    expect(extractExperienceMonths('06/2020 - 08/2020', new Date('2026-10-01'))).toBe(3);
  });

  it('scores and explains, and finds role gaps', () => {
    const a = analyzeResume(resume, {
      targetRole: 'Backend Developer',
      roleSkills: [{ skillId: 'sk-node', skillName: 'Node.js', importance: 1 }, { skillId: 'sk-db-index', skillName: 'Indexing', importance: 1 }],
    });
    expect(a.atsScore).toBeGreaterThan(60);
    expect(a.breakdown.reduce((n, b) => n + b.max, 0)).toBe(100);
    expect(a.gaps).toEqual(['Indexing']);
    expect(a.suggestions.join(' ')).toMatch(/responsible for/);
    expect(a.interviewQuestions.length).toBeGreaterThanOrEqual(3);
  });

  it('scores an empty-ish resume low', () => {
    expect(analyzeResume('hello world this is not a resume').atsScore).toBeLessThan(20);
  });
});

describe('utilities', () => {
  it('computes streaks that survive until the day ends', () => {
    const today = new Date('2026-10-04T12:00:00Z');
    expect(computeStreak(['2026-10-04', '2026-10-03', '2026-10-02'], today)).toBe(3);
    expect(computeStreak(['2026-10-03', '2026-10-02'], today)).toBe(2); // not yet practiced today
    expect(computeStreak(['2026-10-01'], today)).toBe(0);
  });

  it('splits SQL migrations on statement boundaries', () => {
    const stmts = splitSql(`-- comment\nCREATE TABLE A (X NUMBER);\nINSERT INTO A VALUES (1);\n\nCOMMIT;\nCREATE INDEX I ON A(X)`);
    expect(stmts).toEqual(['CREATE TABLE A (X NUMBER)', 'INSERT INTO A VALUES (1)', 'CREATE INDEX I ON A(X)']);
  });
});

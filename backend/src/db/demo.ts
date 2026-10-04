/**
 * Demo account with three weeks of realistic, back-dated activity. Every submission goes through
 * the real grading pipeline (sandboxed execution → skill updates → ML events), so the dashboard,
 * analytics and recommendations show genuine computed values.
 *   npm run db:seed -- --demo     →  demo@trajectory.dev / Trajectory123
 */
import { execute, query } from '../config/oracle';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../services/profile.service';
import { PracticeService } from '../services/practice.service';
import { ResumeService } from '../services/resume.service';
import { InterviewService } from '../services/interview.service';
import { ApplicationService } from '../services/application.service';
import { AnalyticsService } from '../services/analytics.service';
import { drain } from '../lib/jobs';
import { cache } from '../lib/cache';
import { QUESTIONS } from './data/questions';

export const DEMO_EMAIL = 'demo@trajectory.dev';
export const DEMO_PASSWORD = 'Trajectory123';

const SAMPLE_RESUME = `Alex Rivera
alex.rivera@example.com | +1 415 555 0134 | github.com/alexrivera | linkedin.com/in/alexrivera

SUMMARY
Software engineer with 2 years of experience building web platforms in TypeScript, React and Node.js.

EXPERIENCE
Software Engineer, Brightline Labs — Jun 2024 – Present
• Built a real-time analytics dashboard in React and Node.js used by 12,000 users daily
• Reduced API p95 latency by 38% by adding Redis caching and fixing N+1 SQL queries
• Designed REST APIs for the billing service processing $2M monthly
• Mentored 2 interns and led code reviews for a team of 6

Software Engineering Intern, Cloudnest — Jun 2023 – Aug 2023
• Automated CI/CD pipelines with GitHub Actions, cutting deploy time from 25 to 6 minutes
• Worked on Docker-based local development environment

PROJECTS
• Pathfinder — graph visualizer implementing BFS, DFS and Dijkstra in TypeScript (1.2k GitHub stars)
• Ledger — expense tracker with PostgreSQL, Express and JWT authentication

EDUCATION
B.Tech in Computer Science, State Institute of Technology — 2020 – 2024 — CGPA 8.7/10

SKILLS
JavaScript, TypeScript, React, Node.js, Express, Python, SQL, PostgreSQL, Redis, Docker, GitHub Actions, Data Structures & Algorithms
`;

const BEHAVIORAL_ANSWERS = [
  'At my last company our team disagreed about whether to adopt GraphQL for the dashboard project. I listened to my teammate\'s perspective first and asked what problems he wanted to solve. Then I proposed we build a small prototype of both approaches and benchmark them with real data. The REST version was 30% faster for our access patterns, so we agreed to keep REST and add a batching endpoint. As a result we shipped two weeks early, and I learned that data settles debates faster than opinions.',
  'I was responsible for a release that broke the checkout page for about 40 minutes because I skipped a migration check. I owned the mistake immediately, rolled back the deploy and wrote a fix with a regression test. Since then I added an automated migration check to our CI pipeline, and we have not had a similar outage in a year. I learned to treat deploy checklists as code rather than memory.',
  'The project I am most proud of is the analytics dashboard at Brightline. The problem was that customers waited minutes for reports. I designed the caching layer with Redis, implemented incremental aggregation in SQL, and built the React front end. The result was that p95 load time dropped from 9 seconds to 1.2 seconds and daily active users grew 25% in a quarter.',
  'We had one week to deliver a compliance export for a major customer. I listed must-have requirements with the product manager and cut scope to CSV only, deferring PDF formatting. I communicated progress daily to stakeholders. We delivered on time, and the customer renewed their contract.',
  'I needed to learn Kubernetes quickly to migrate our services. I read the official documentation, built a prototype cluster over a weekend, and paired with a platform engineer. Within two weeks I had implemented the deployment manifests, and the migration reduced our hosting cost by 20 percent.',
];

const daysAgo = (n: number, hour = 19) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return d;
};

export async function seedDemoAccount(log = console.log): Promise<void> {
  await execute(`DELETE FROM TRAJECTORY_USERS WHERE EMAIL = :e`, { e: DEMO_EMAIL });
  const { user } = await AuthService.register({ email: DEMO_EMAIL, password: DEMO_PASSWORD, name: 'Alex Rivera' });
  const uid = user.id;
  await ProfileService.upsert(uid, {
    targetRole: 'Software Engineer', experienceLevel: '1-2 Years', targetIndustry: 'SaaS',
    githubUrl: 'https://github.com/alexrivera', skills: ['JavaScript', 'Python', 'SQL'],
  });
  await ResumeService.submit(uid, { text: SAMPLE_RESUME, fileName: 'alex-rivera-resume.pdf' });
  await drain();
  await execute(`UPDATE RESUMES SET CREATED_AT = :d, UPDATED_AT = :d WHERE USER_ID = :userId`, { d: daysAgo(21, 10), userId: uid });
  log('  profile + resume ✓');

  // A three-week practice plan: ~1–3 problems per day, with a few wrong first attempts.
  const plan: Array<{ id: string; day: number; lang: 'javascript' | 'python' | 'sql'; wrongFirst?: boolean; hint?: boolean }> = [
    { id: 'q-001', day: 20, lang: 'javascript' }, { id: 'q-013', day: 20, lang: 'python' },
    { id: 'q-002', day: 19, lang: 'javascript', wrongFirst: true }, { id: 'q-012', day: 18, lang: 'python' },
    { id: 'q-009', day: 17, lang: 'javascript' }, { id: 'q-011', day: 16, lang: 'javascript' }, { id: 'q-019', day: 16, lang: 'python' },
    { id: 'q-032', day: 14, lang: 'python' }, { id: 'q-010', day: 13, lang: 'javascript', wrongFirst: true },
    { id: 'q-023', day: 12, lang: 'javascript' }, { id: 'q-007', day: 12, lang: 'sql' }, { id: 'q-025', day: 11, lang: 'python' },
    { id: 'q-017', day: 10, lang: 'javascript', hint: true }, { id: 'q-016', day: 9, lang: 'javascript', wrongFirst: true },
    { id: 'q-026', day: 8, lang: 'python' }, { id: 'q-042', day: 8, lang: 'sql' }, { id: 'q-003', day: 6, lang: 'python' },
    { id: 'q-014', day: 5, lang: 'javascript' }, { id: 'q-030', day: 4, lang: 'python' }, { id: 'q-021', day: 3, lang: 'javascript', wrongFirst: true },
    { id: 'q-005', day: 2, lang: 'python', hint: true }, { id: 'q-029', day: 1, lang: 'javascript' }, { id: 'q-040', day: 1, lang: 'sql' },
    { id: 'q-035', day: 0, lang: 'python' },
  ];
  const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
  let lastDay = -1;
  for (const p of [...plan].sort((a, b) => b.day - a.day)) {
    const q = byId.get(p.id)!;
    const ref = p.lang === 'sql' ? q.reference.sql! : p.lang === 'python' ? q.reference.python! : q.reference.javascript!;
    if (lastDay !== -1 && p.day !== lastDay) await AnalyticsService.refreshSnapshot(uid, daysAgo(lastDay));
    lastDay = p.day;
    const attempts = p.wrongFirst
      ? [p.lang === 'python' ? `def ${q.code!.functionName}(*args):\n    return None` : `function ${q.code!.functionName}() { return null; }`, ref]
      : [ref];
    for (const [i, code] of attempts.entries()) {
      const r: any = await PracticeService.submit(uid, q.id, p.lang, code, { usedHint: p.hint, timeTakenSec: 300 + Math.round(Math.random() * 900) });
      const at = daysAgo(p.day, 18 + i);
      await execute(`UPDATE SUBMISSIONS SET SUBMITTED_AT = :at WHERE SUBMISSION_ID = :id`, { at, id: r.submissionId });
      await execute(`UPDATE USER_SKILLS SET LAST_PRACTICED = :at WHERE USER_ID = :userId AND LAST_PRACTICED > :at`, { at, userId: uid });
      await execute(`UPDATE ML_EVENTS SET CREATED_AT = :at WHERE USER_ID = :userId AND ENTITY_ID = :q AND CREATED_AT > :at`, { at, userId: uid, q: q.id });
    }
  }
  await drain();
  cache.invalidateUser(uid);
  await AnalyticsService.refreshSnapshot(uid, daysAgo(0));
  log(`  ${plan.length} practice problems ✓`);

  // Two behavioral interviews, a week apart.
  for (const [n, offset] of [[0, 9], [1, 2]] as const) {
    const s = await InterviewService.start(uid, 'BEHAVIORAL');
    let done = false, i = n;
    while (!done) {
      const r = await InterviewService.respond(uid, s.interviewId, BEHAVIORAL_ANSWERS[i % BEHAVIORAL_ANSWERS.length]);
      done = r.done; i++;
    }
    const finished = daysAgo(offset, 20);
    await execute(`UPDATE INTERVIEWS SET CREATED_AT = :c, COMPLETED_AT = :f WHERE INTERVIEW_ID = :id`, { c: new Date(finished.getTime() - 25 * 60_000), f: finished, id: s.interviewId });
  }
  log('  2 mock interviews ✓');

  const apps = [
    { company: 'Stripe', role: 'Software Engineer, Payments', stage: 'INTERVIEW', appliedDate: daysAgo(12) },
    { company: 'Datadog', role: 'Software Engineer II', stage: 'OA', appliedDate: daysAgo(8) },
    { company: 'Vercel', role: 'Frontend Engineer', stage: 'APPLIED', appliedDate: daysAgo(3) },
    { company: 'Atlassian', role: 'Backend Engineer', stage: 'REJECTED', appliedDate: daysAgo(18) },
  ] as const;
  for (const a of apps) {
    await ApplicationService.create(uid, { company: a.company, role: a.role, stage: a.stage, appliedDate: a.appliedDate.toISOString().slice(0, 10) });
  }
  log('  4 applications ✓');

  await drain();
  cache.clear();
  const solved = await query<any>(`SELECT COUNT(DISTINCT QUESTION_ID) AS N FROM SUBMISSIONS WHERE USER_ID = :userId AND STATUS = 'ACCEPTED'`, { userId: uid });
  log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${solved.rows?.[0]?.N} problems solved)`);
}

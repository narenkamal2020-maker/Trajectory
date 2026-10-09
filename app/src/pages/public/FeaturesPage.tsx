import { type ReactNode } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { CodeIcon, MicIcon, LightbulbIcon, ArrowUpRight, DownloadIcon } from '../../landing/icons';
import { Tilt3D } from '../../landing/effects';
import { FadingVideo } from '../../landing/FadingVideo';
import { ScrollAssemble } from '../../landing/ScrollAssemble';
import { LandingLayout } from './LandingLayout';

const ENTER = {
  initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
  animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
};
const after = (delay: number) => ({ duration: 0.8, ease: 'easeOut' as const, delay });

const CAPABILITIES_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4';

interface Capability {
  id: string;
  title: string;
  icon: ReactNode;
  tags: string[];
  body: string;
  detail: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: 'cap-practice',
    title: 'Practice',
    icon: <CodeIcon className="h-5 w-5" />,
    tags: ['JavaScript', 'Python', 'SQL', 'Hidden Tests'],
    body: 'Hand-verified problems run in a secure sandbox with hidden tests. Every submission updates the skills it exercises — weighted by difficulty, hints and repeats. Keeps working offline.',
    detail: [
      '40+ verified problems across JavaScript, Python and SQL',
      'Hidden test suite — no peeking at edge cases in advance',
      'Sandbox execution: no server round-trip for JS; Python + SQL in the desktop app',
      'Per-submission skill update — each attempt moves the relevant skill needle',
      'Download the problem bank and practice fully offline',
    ],
  },
  {
    id: 'cap-interviews',
    title: 'Interviews',
    icon: <MicIcon className="h-5 w-5" />,
    tags: ['Behavioral', 'System Design', 'DSA', 'Live Scoring'],
    body: 'Mock interviews that follow up when an answer misses the point, scored on technical depth, problem solving and communication — with concrete feedback after every answer.',
    detail: [
      'Behavioral, DSA and system design interview types',
      'Follow-up questions when your answer glosses over a key concept',
      'Scored on technical depth, problem solving and communication',
      'Concrete per-answer feedback — not just a rating',
      'Session history so you can compare across attempts',
    ],
  },
  {
    id: 'cap-career',
    title: 'Trajectory',
    icon: <LightbulbIcon className="h-5 w-5" />,
    tags: ['Readiness', 'Resume ATS', 'Skill Map', 'Daily Plan'],
    body: 'Readiness for your target role, an ETA from your real progress, explainable resume scoring, and a daily plan that picks the problems you are most likely to grow from.',
    detail: [
      'Role readiness score — importance-weighted against real job requirements',
      'ETA based on your actual recent pace, not a generic estimate',
      'Resume ATS scoring with line-by-line explainability',
      'Skill map: know exactly which gaps are keeping you under-qualified',
      'Daily plan — the three problems today that will move your readiness the most',
    ],
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick your target role',
    body: 'Choose from a curated list of engineering roles. Trajectory maps what the role actually needs and checks your skills against it.',
  },
  {
    step: '02',
    title: 'Practice and interview daily',
    body: 'Solve problems and run mock interviews. Every session updates your skill map in real time — you always know where you stand.',
  },
  {
    step: '03',
    title: 'Track your readiness',
    body: 'Your dashboard shows an ETA to role-ready, a daily plan, and exactly which gaps to close next. No guessing.',
  },
];

function HowItWorks() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="how-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
      <p className="font-body text-sm text-white/50">// How it works</p>
      <h2 id="how-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
        Three steps to role-ready
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map((h, i) => (
          <motion.div key={h.step}
            initial={reduced ? false : ENTER.initial}
            whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={after(i * 0.12)}
            className="rounded-[1.25rem] border border-white/8 bg-white/[0.02] p-6">
            <span className="font-mono text-xs text-white/30">{h.step}</span>
            <h3 className="mt-3 font-heading text-2xl italic text-white">{h.title}</h3>
            <p className="mt-3 font-body text-sm font-light leading-relaxed text-white/60">{h.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CapabilityDetail({ cap }: { cap: Capability }) {
  return (
    <div className="mt-5 space-y-2">
      {cap.detail.map((d) => (
        <p key={d} className="flex items-start gap-2 font-body text-sm font-light leading-relaxed text-white/60">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden />
          {d}
        </p>
      ))}
    </div>
  );
}

function CapabilitiesSection() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="caps-title" className="relative overflow-hidden">
      <FadingVideo src={CAPABILITIES_VIDEO} className="absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute -right-40 top-1/3 z-[1] h-[500px] w-[500px] rounded-full bg-violet-950/30 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -left-20 bottom-1/4 z-[1] h-80 w-80 rounded-full bg-indigo-950/25 blur-[80px]" aria-hidden />

      <div className="relative z-10 px-6 py-20 md:px-16 lg:px-20">
        <p className="font-body text-sm text-white/60">// Core features</p>
        <h2 id="caps-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
          Everything you need to get hired
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Tilt3D key={c.id} className="min-h-[420px]">
              <motion.article id={c.id}
                initial={reduced ? false : ENTER.initial}
                whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={after(i * 0.15)}
                className="liquid-glass flex h-full flex-col rounded-[1.25rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="icon-glow liquid-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.75rem] text-white">
                    {c.icon}
                  </div>
                  <ul className="flex flex-wrap justify-end gap-1.5">
                    {c.tags.map((t) => (
                      <li key={t} className="liquid-glass whitespace-nowrap rounded-full px-3 py-1 font-body text-[11px] text-white/90">{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1" />
                <h3 className="font-heading text-3xl italic leading-none tracking-[-1px] md:text-4xl">{c.title}</h3>
                <p className="mt-3 font-body text-sm font-light leading-snug text-white/90">{c.body}</p>
                <CapabilityDetail cap={c} />
              </motion.article>
            </Tilt3D>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section aria-label="Download call to action" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-10 text-center">
        <h2 className="font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
          Ready to start?
        </h2>
        <p className="mx-auto mt-4 max-w-md font-body text-base font-light text-white/70">
          Download Trajectory for free and start measuring your career readiness today.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/downloads"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
            <DownloadIcon className="h-4 w-4" /> Download free
          </Link>
          <Link to="/register"
            className="inline-flex items-center gap-2 font-body text-sm font-medium text-white/70 transition-colors hover:text-white">
            Use in browser <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FeaturesPage() {
  useDocumentTitle(
    'Features',
    'Trajectory features — coding practice, mock interviews and career readiness tracking in one place.',
  );

  return (
    <MotionConfig reducedMotion="user">
      <LandingLayout
        label="// Features"
        title="Your career, measured end to end"
        subtitle="Practice coding, run mock interviews, and track your readiness against the role you want — all in one platform."
      >
        <CapabilitiesSection />
        <ScrollAssemble />
        <HowItWorks />
        <CtaBanner />
      </LandingLayout>
    </MotionConfig>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { Link } from '../lib/router';
import { useDocumentTitle } from '../lib/hooks';
import { FadingVideo } from '../landing/FadingVideo';
import { BlurText } from '../landing/BlurText';
import { ScrollAssemble } from '../landing/ScrollAssemble';
import { OrbitScene } from '../components/OrbitScene';
import { ArrowUpRight, Play, ClockIcon, GlobeIcon, CodeIcon, MicIcon, LightbulbIcon } from '../landing/icons';
import { SiteFooter, FloatingContact } from './public/PublicLayout';
import '../landing/landing.css';

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4';
const CAPABILITIES_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4';

const ENTER = {
  initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
  animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
};
const after = (delay: number) => ({ duration: 0.8, ease: 'easeOut' as const, delay });

/** In-page scrolling. Hash links would collide with the app's hash router, so nav uses buttons. */
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const NAV = [
  { label: 'Practice', target: 'cap-practice' },
  { label: 'Interviews', target: 'cap-interviews' },
  { label: 'Career', target: 'cap-career' },
  { label: 'Capabilities', target: 'capabilities' },
];

const ROLES = ['Software', 'Frontend', 'Backend', 'Data', 'DevOps'];

const CAPABILITIES: Array<{ id: string; title: string; icon: ReactNode; tags: string[]; body: string }> = [
  {
    id: 'cap-practice',
    title: 'Practice',
    icon: <CodeIcon className="h-5 w-5" />,
    tags: ['JavaScript', 'Python', 'SQL', 'Hidden Tests'],
    body: 'Hand-verified problems run in a secure sandbox with hidden tests. Every submission updates the skills it exercises — weighted by difficulty, hints and repeats. Keeps working offline.',
  },
  {
    id: 'cap-interviews',
    title: 'Interviews',
    icon: <MicIcon className="h-5 w-5" />,
    tags: ['Behavioral', 'System Design', 'DSA', 'Live Scoring'],
    body: 'Mock interviews that follow up when an answer misses the point, scored on technical depth, problem solving and communication — with concrete feedback after every answer.',
  },
  {
    id: 'cap-career',
    title: 'Trajectory',
    icon: <LightbulbIcon className="h-5 w-5" />,
    tags: ['Readiness', 'Resume ATS', 'Skill Map', 'Daily Plan'],
    body: 'Readiness for your target role, an ETA from your real progress, explainable resume scoring, and a daily plan that picks the problems you are most likely to grow from.',
  },
];

function Navbar() {
  const [menu, setMenu] = useState(false);
  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16">
      <Link to="/" aria-label="Trajectory home" className="liquid-glass flex h-12 w-12 items-center justify-center rounded-full">
        <span className="font-heading text-2xl italic leading-none text-white">t</span>
      </Link>

      <nav aria-label="Primary" className="liquid-glass hidden items-center rounded-full px-1.5 py-1.5 md:flex">
        {NAV.map((n) => (
          <button key={n.label} type="button" onClick={() => scrollTo(n.target)}
            className="cursor-pointer rounded-full px-3 py-2 font-body text-sm font-medium text-white/90 transition-colors hover:text-white">
            {n.label}
          </button>
        ))}
        <Link to="/register" className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black transition-colors hover:bg-white/90">
          Get Started <ArrowUpRight className="h-4 w-4" />
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <Link to="/login" className="liquid-glass inline-flex h-12 items-center rounded-full px-5 font-body text-sm font-medium text-white">
          Sign in
        </Link>
        <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="landing-menu" aria-label={menu ? 'Close menu' : 'Open menu'}
          className="liquid-glass inline-flex h-12 w-12 items-center justify-center rounded-full text-white md:hidden cursor-pointer">
          <span aria-hidden className="relative block h-3.5 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-white transition-transform ${menu ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-white transition-opacity ${menu ? 'opacity-0' : ''}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-white transition-transform ${menu ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </span>
        </button>
      </div>
      {menu && (
        <nav id="landing-menu" aria-label="Mobile" className="liquid-glass-strong absolute left-4 right-4 top-16 rounded-2xl p-3 md:hidden">
          {NAV.map((n) => (
            <button key={n.label} type="button" onClick={() => { setMenu(false); scrollTo(n.target); }}
              className="block w-full rounded-xl px-4 py-3 text-left font-body text-base text-white/90 hover:bg-white/10 cursor-pointer">{n.label}</button>
          ))}
          <Link to="/faq" className="block rounded-xl px-4 py-3 font-body text-base text-white/90 hover:bg-white/10">FAQ</Link>
          <Link to="/contact" className="block rounded-xl px-4 py-3 font-body text-base text-white/90 hover:bg-white/10">Contact</Link>
          <Link to="/register" className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 font-body font-medium text-black">
            Get Started <ArrowUpRight className="h-4 w-4" />
          </Link>
        </nav>
      )}
    </header>
  );
}

/** Sticky call-to-action on phones once the hero's own buttons have scrolled out of view. */
function StickyMobileCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="liquid-glass-strong flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <span className="font-body text-sm text-white/90">Free to start — no card needed</span>
        <Link to="/register" tabIndex={show ? 0 : -1} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black">
          Start Free <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  const [videoFailed, setVideoFailed] = useState(false);
  const reduced = useReducedMotion();
  const enter = reduced ? { initial: false as const, animate: ENTER.animate } : ENTER;
  return (
    <section aria-labelledby="hero-title" className="relative min-h-screen overflow-hidden bg-black md:h-screen">
      {videoFailed ? (
        // Offline (desktop/mobile app) or blocked CDN: fall back to the local 3D orbit scene.
        <OrbitScene className="absolute inset-0 z-0" />
      ) : (
        <FadingVideo src={HERO_VIDEO} onError={() => setVideoFailed(true)}
          className="absolute left-1/2 top-0 z-0 -translate-x-1/2 object-cover object-top"
          style={{ width: '120%', height: '120%' }} />
      )}

      <div className="relative z-10 flex min-h-screen flex-col md:h-full">
        <Navbar />

        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-24 text-center">
          <motion.div {...enter} transition={after(0.4)} className="liquid-glass inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-4">
            <span className="rounded-full bg-white px-2.5 py-0.5 font-body text-xs font-semibold text-black">New</span>
            <span className="font-body text-sm text-white/90">Desktop &amp; Android apps — practice offline, sync later</span>
          </motion.div>

          <div className="mt-6 max-w-3xl">
            <BlurText as="h1" text="Know Exactly How Far You Are From the Job"
              className="font-heading text-6xl italic leading-[0.8] tracking-[-4px] text-white md:text-7xl lg:text-[5.5rem]" />
          </div>
          <span id="hero-title" className="sr-only">Trajectory — career acceleration for software engineers</span>

          <motion.p {...enter} transition={after(0.8)} className="mt-4 max-w-2xl font-body text-sm font-light leading-tight text-white md:text-base">
            Trajectory measures your skills against the role you want, then tells you the next problem to solve,
            the next interview to practice, and the next line to fix on your resume.
          </motion.p>

          <motion.div {...enter} transition={after(1.1)} className="mt-6 flex flex-wrap items-center justify-center gap-6">
            <Link to="/register" className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm font-medium text-white">
              Start Free <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => scrollTo('capabilities')} className="inline-flex cursor-pointer items-center gap-2 font-body text-sm font-medium text-white/90 hover:text-white">
              <Play className="h-3.5 w-3.5" /> See How It Works
            </button>
          </motion.div>

          <motion.div {...enter} transition={after(1.3)} className="mt-8 flex justify-center gap-3 sm:gap-4">
            <div className="liquid-glass w-[160px] rounded-[1.25rem] p-4 text-left sm:w-[220px] sm:p-5">
              <ClockIcon className="h-6 w-6 text-white/90" />
              <div className="mt-4 font-heading text-4xl italic leading-none tracking-[-1px]">40+</div>
              <div className="mt-2 font-body text-sm font-light text-white/80">Verified Problems in JavaScript, Python &amp; SQL</div>
            </div>
            <div className="liquid-glass w-[160px] rounded-[1.25rem] p-4 text-left sm:w-[220px] sm:p-5">
              <GlobeIcon className="h-6 w-6 text-white/90" />
              <div className="mt-4 font-heading text-4xl italic leading-none tracking-[-1px]">6</div>
              <div className="mt-2 font-body text-sm font-light text-white/80">Mock Interview Tracks With Live Scoring</div>
            </div>
          </motion.div>
        </div>

        <motion.div {...enter} transition={after(1.4)} className="flex flex-col items-center gap-4 px-4 pb-8">
          <div className="liquid-glass rounded-full px-4 py-1.5 font-body text-xs text-white/90 md:text-sm">
            Built for engineers preparing for roles in
          </div>
          <ul className="flex flex-wrap justify-center gap-x-12 gap-y-2 md:gap-x-16">
            {ROLES.map((r) => (
              <li key={r} className="font-heading text-2xl italic tracking-tight text-white md:text-3xl">{r}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function Capabilities() {
  const reduced = useReducedMotion();
  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="relative min-h-screen overflow-hidden bg-black">
      <FadingVideo src={CAPABILITIES_VIDEO} className="absolute inset-0 z-0 h-full w-full object-cover" />

      <div className="relative z-10 flex min-h-screen flex-col px-8 pb-10 pt-24 md:px-16 lg:px-20">
        <header className="mb-auto">
          <p className="mb-6 font-body text-sm text-white/80">// Capabilities</p>
          <h2 id="capabilities-title" className="whitespace-pre-line font-heading text-6xl italic leading-[0.9] tracking-[-3px] md:text-7xl lg:text-[6rem]">
            {'Your career,\nmeasured end to end'}
          </h2>
        </header>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <motion.article key={c.id} id={c.id}
              initial={reduced ? false : ENTER.initial}
              whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={after(i * 0.15)}
              className="liquid-glass flex min-h-[360px] scroll-mt-24 flex-col rounded-[1.25rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.75rem] text-white">{c.icon}</div>
                <ul className="flex flex-wrap justify-end gap-1.5">
                  {c.tags.map((t) => (
                    <li key={t} className="liquid-glass whitespace-nowrap rounded-full px-3 py-1 font-body text-[11px] text-white/90">{t}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-1" />
              <h3 className="font-heading text-3xl italic leading-none tracking-[-1px] md:text-4xl">{c.title}</h3>
              <p className="mt-3 max-w-[32ch] font-body text-sm font-light leading-snug text-white/90">{c.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  useDocumentTitle('Your path to the role you want', 'Trajectory measures your skills against the role you want, then tells you the next problem to solve, interview to practice and resume line to fix.');
  return (
    // "user" honours prefers-reduced-motion: transforms/blur are skipped, content appears immediately.
    <MotionConfig reducedMotion="user">
      <div className="landing min-h-screen bg-black text-white">
        <a href="#landing-main" onClick={(e) => { e.preventDefault(); document.getElementById('landing-main')?.focus(); }}
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">Skip to content</a>
        <main id="landing-main" tabIndex={-1} className="outline-none">
          <Hero />
          <ScrollAssemble />
          <Capabilities />
        </main>
        <SiteFooter dark />
        <StickyMobileCta />
        <FloatingContact className="bottom-24 md:bottom-6" />
      </div>
    </MotionConfig>
  );
}

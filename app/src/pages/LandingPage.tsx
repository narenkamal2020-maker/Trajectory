import { useEffect, useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { Link } from '../lib/router';
import { useDocumentTitle } from '../lib/hooks';
import { FadingVideo } from '../landing/FadingVideo';
import { BlurText } from '../landing/BlurText';
import { Spotlight, NumberTicker } from '../landing/effects';
import { OrbitScene } from '../components/OrbitScene';
import {
  ArrowUpRight, ClockIcon, GlobeIcon,
  DownloadIcon, CodeIcon, MicIcon, LightbulbIcon,
} from '../landing/icons';
import { SiteFooter, FloatingContact } from './public/PublicLayout';
import { KineticNav } from '../components/KineticNav';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import '../landing/landing.css';

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4';

const ENTER = {
  initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
  animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
};
const after = (delay: number) => ({ duration: 0.8, ease: 'easeOut' as const, delay });

type Device = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other';

function detectDevice(): Device {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/mac os x|macintosh/i.test(ua)) return 'mac';
  if (/linux/i.test(ua)) return 'linux';
  return 'other';
}

// KineticNav is imported from components/KineticNav — handles both desktop and mobile nav overlay.

// ── Sticky mobile download CTA ────────────────────────────────────────────────

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
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 md:hidden ${show ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="liquid-glass-strong flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <span className="font-body text-sm text-white/90">Free to download — practice offline</span>
        <Link to="/downloads" tabIndex={show ? 0 : -1}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black">
          Download <DownloadIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ device }: { device: Device }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const reduced = useReducedMotion();
  const enter = reduced ? { initial: false as const, animate: ENTER.animate } : ENTER;

  const primaryLabel = device === 'windows' ? 'Download for Windows'
    : device === 'mac' ? 'Download for macOS'
    : device === 'linux' ? 'Download for Linux'
    : device === 'android' ? 'Download APK'
    : device === 'ios' ? 'Get on App Store'
    : 'Download Now';

  return (
    <section aria-labelledby="hero-title" className="relative min-h-screen overflow-hidden bg-black md:h-screen">
      {videoFailed ? (
        <OrbitScene className="absolute inset-0 z-0" />
      ) : (
        <FadingVideo src={HERO_VIDEO} onError={() => setVideoFailed(true)}
          className="absolute left-1/2 top-0 z-0 -translate-x-1/2 object-cover object-top"
          style={{ width: '120%', height: '120%' }} />
      )}
      <Spotlight />

      <div className="relative z-10 flex min-h-screen flex-col md:h-full">
        <KineticNav />

        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-24 text-center">
          <motion.div {...enter} transition={after(0.4)} className="liquid-glass inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-4">
            <span className="rounded-full bg-white px-2.5 py-0.5 font-body text-xs font-semibold text-black">New</span>
            <span className="font-body text-sm text-white/90">Desktop &amp; Android apps — practice offline, sync later</span>
          </motion.div>

          <div className="mt-6 max-w-3xl">
            <BlurText as="h1" text="Know Exactly How Far You Are From the Job"
              className="hero-title-glow font-heading text-6xl italic leading-[0.8] tracking-[-4px] text-white md:text-7xl lg:text-[5.5rem]" />
          </div>
          <span id="hero-title" className="sr-only">Trajectory — career acceleration for software engineers</span>

          <motion.p {...enter} transition={after(0.8)} className="mt-4 max-w-2xl font-body text-sm font-light leading-tight text-white md:text-base">
            Trajectory measures your skills against the role you want, then tells you the next problem to solve,
            the next interview to practice, and the next line to fix on your resume.
          </motion.p>

          <motion.div {...enter} transition={after(1.1)} className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/downloads"
              className="shimmer-btn liquid-glass-strong inline-flex items-center gap-2 rounded-full px-6 py-3 font-body text-sm font-semibold text-white">
              <DownloadIcon className="h-4 w-4" /> {primaryLabel}
            </Link>
            <Link to="/features"
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-white/90 hover:text-white transition-colors">
              See how it works <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          <motion.div {...enter} transition={after(1.3)} className="mt-8 flex justify-center gap-3 sm:gap-4">
            <div className="liquid-glass w-[160px] rounded-[1.25rem] p-4 text-left sm:w-[220px] sm:p-5">
              <ClockIcon className="h-6 w-6 text-white/90" />
              <div className="mt-4 font-heading text-4xl italic leading-none tracking-[-1px]">
                <NumberTicker value={40} suffix="+" />
              </div>
              <div className="mt-2 font-body text-sm font-light text-white/80">Verified Problems in JavaScript, Python &amp; SQL</div>
            </div>
            <div className="liquid-glass w-[160px] rounded-[1.25rem] p-4 text-left sm:w-[220px] sm:p-5">
              <GlobeIcon className="h-6 w-6 text-white/90" />
              <div className="mt-4 font-heading text-4xl italic leading-none tracking-[-1px]">
                <NumberTicker value={5} />
              </div>
              <div className="mt-2 font-body text-sm font-light text-white/80">Platforms — Windows, macOS, Linux, Android, iOS</div>
            </div>
          </motion.div>
        </div>

        <motion.div {...enter} transition={after(1.4)} className="flex flex-col items-center gap-4 px-4 pb-8">
          <p className="liquid-glass rounded-full px-4 py-1.5 font-body text-xs text-white/90 md:text-sm">
            Available for
          </p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 md:gap-x-12" aria-label="Supported platforms">
            {(['Windows', 'macOS', 'Linux', 'Android', 'iOS'] as const).map((p) => (
              <li key={p} className="font-heading text-2xl italic tracking-tight text-white md:text-3xl">{p}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

// ── Features bento grid ───────────────────────────────────────────────────────

function SkillsIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M3 3v18h18v-2H5V3H3zm4 12h2V9H7v6zm4 2h2V7h-2v10zm4-6h2v4h-2v-4zm4-4h2v8h-2V7z"/>
    </svg>
  );
}

function ResumeIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-4h8v2H8v-2zm0-4h8v2H8v-2zm0-4h5v2H8V8z"/>
    </svg>
  );
}

const BENTO_FEATURES = [
  {
    Icon: CodeIcon,
    name: 'Coding Practice',
    description: '40+ verified problems in JavaScript, Python and SQL — with hidden tests and Elo-weighted scoring.',
    to: '/features',
    cta: 'Explore practice',
    className: 'lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3',
    background: (
      <svg viewBox="0 0 400 600" fill="none" className="absolute -bottom-10 -right-8 h-[80%] opacity-20">
        <text x="20" y="120" fontFamily="monospace" fontSize="48" fill="rgba(99,102,241,0.6)">{'</>'}</text>
        <text x="60" y="220" fontFamily="monospace" fontSize="32" fill="rgba(139,92,246,0.5)">{'fn()'}</text>
        <text x="10" y="340" fontFamily="monospace" fontSize="28" fill="rgba(236,72,153,0.4)">{'[ ]'}</text>
        <text x="80" y="460" fontFamily="monospace" fontSize="22" fill="rgba(99,102,241,0.35)">{'#include'}</text>
        <circle cx="320" cy="150" r="60" stroke="rgba(99,102,241,0.2)" strokeWidth="2" fill="none" />
        <circle cx="320" cy="150" r="40" stroke="rgba(139,92,246,0.15)" strokeWidth="1" fill="none" />
      </svg>
    ),
  },
  {
    Icon: MicIcon,
    name: 'Mock Interviews',
    description: 'Behavioral, DSA and system design sessions scored on depth, structure and communication.',
    to: '/features',
    cta: 'See how it works',
    className: 'lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3',
    background: (
      <svg viewBox="0 0 300 300" fill="none" className="absolute -top-8 -right-6 h-[60%] opacity-25">
        {[1,2,3,4,5].map((i) => (
          <rect key={i} x={20 + i * 40} y={220 - i * 30} width="28" height={i * 30} rx="4"
            fill={`rgba(${i % 2 === 0 ? '139,92,246' : '99,102,241'},0.5)`} />
        ))}
      </svg>
    ),
  },
  {
    Icon: LightbulbIcon,
    name: 'Career Readiness',
    description: 'Importance-weighted score against your target role, updated after every session.',
    to: '/features',
    cta: 'View career tools',
    className: 'lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4',
    background: (
      <svg viewBox="0 0 300 200" fill="none" className="absolute right-0 top-0 h-full opacity-20">
        <circle cx="200" cy="100" r="80" stroke="rgba(255,211,113,0.4)" strokeWidth="1.5" fill="none" />
        <circle cx="200" cy="100" r="55" stroke="rgba(255,211,113,0.3)" strokeWidth="1" fill="none" />
        <circle cx="200" cy="100" r="30" fill="rgba(255,211,113,0.12)" />
      </svg>
    ),
  },
  {
    Icon: ResumeIcon,
    name: 'Resume Analysis',
    description: 'ATS score with line-by-line explainability and skill-gap identification.',
    to: '/features',
    cta: 'About resume tools',
    className: 'lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2',
    background: (
      <svg viewBox="0 0 300 200" fill="none" className="absolute right-0 top-0 h-full opacity-20">
        {[40,70,100,130].map((y) => (
          <rect key={y} x="20" y={y} width={`${160 - y / 2}px`} height="10" rx="2"
            fill="rgba(99,102,241,0.4)" />
        ))}
      </svg>
    ),
  },
  {
    Icon: SkillsIcon,
    name: 'Skill Map',
    description: 'Proficiency tracks update per submission. See exactly which gaps are keeping you under-qualified.',
    to: '/features',
    cta: 'Explore skill tracking',
    className: 'lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4',
    background: (
      <svg viewBox="0 0 300 400" fill="none" className="absolute -bottom-4 right-0 h-[70%] opacity-20">
        {[120,80,140,60,110,90].map((h, i) => (
          <rect key={i} x={10 + i * 46} y={280 - h} width="36" height={h} rx="4"
            fill={`rgba(${i % 3 === 0 ? '99,102,241' : i % 3 === 1 ? '139,92,246' : '236,72,153'},0.5)`} />
        ))}
      </svg>
    ),
  },
];

function FeaturesBento() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="bento-title" className="border-t border-white/5 bg-black px-6 py-20 md:px-16 lg:px-20">
      <p className="font-body text-sm text-white/50">// Core capabilities</p>
      <h2 id="bento-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
        Everything in one place
      </h2>
      <motion.div
        className="mt-10"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        <BentoGrid className="lg:grid-rows-3">
          {BENTO_FEATURES.map((f) => (
            <BentoCard key={f.name} {...f} />
          ))}
        </BentoGrid>
      </motion.div>
    </section>
  );
}

// ── Page teaser strip ─────────────────────────────────────────────────────────

const PAGE_TEASERS = [
  {
    to: '/features',
    label: '// Features',
    title: 'Practice, Interviews & Career',
    body: 'Coding problems, mock interviews, resume scoring and readiness tracking — all linked to your target role.',
  },
  {
    to: '/downloads',
    label: '// Downloads',
    title: 'Download for any device',
    body: 'Native apps for Windows, macOS, Linux and Android. iOS coming soon. Practice offline, sync when reconnected.',
  },
  {
    to: '/release-notes',
    label: '// Release Notes',
    title: "What's new",
    body: 'Changelog for every version of the desktop, Android and web app.',
  },
];

function PageTeasers() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="explore-title" className="bg-black px-8 py-20 md:px-16 lg:px-20 border-t border-white/5">
      <h2 id="explore-title" className="font-heading text-3xl italic tracking-[-1px] text-white md:text-4xl">
        Explore Trajectory
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PAGE_TEASERS.map((t, i) => (
          <motion.div key={t.to}
            initial={reduced ? false : ENTER.initial}
            whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={after(i * 0.1)}>
            <Link to={t.to}
              className="liquid-glass group flex h-full flex-col rounded-[1.25rem] p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(255,255,255,0.04)]">
              <p className="font-body text-xs text-white/50">{t.label}</p>
              <h3 className="mt-2 font-heading text-xl italic text-white">{t.title}</h3>
              <p className="mt-2 flex-1 font-body text-sm font-light leading-relaxed text-white/60">{t.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-body text-sm text-white/50 transition-colors group-hover:text-white/80">
                Explore <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  useDocumentTitle(
    'Trajectory',
    'Trajectory — career acceleration for software engineers. Available on Windows, macOS, Linux, Android and iOS.',
  );
  const [device, setDevice] = useState<Device>('other');
  useEffect(() => { setDevice(detectDevice()); }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing min-h-screen bg-black text-white">
        <a href="#landing-main"
          onClick={(e) => { e.preventDefault(); document.getElementById('landing-main')?.focus(); }}
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">
          Skip to content
        </a>
        <main id="landing-main" tabIndex={-1} className="outline-none">
          <Hero device={device} />
          <FeaturesBento />
          <PageTeasers />
        </main>
        <SiteFooter dark />
        <StickyMobileCta />
        <FloatingContact className="bottom-24 md:bottom-6" />
      </div>
    </MotionConfig>
  );
}

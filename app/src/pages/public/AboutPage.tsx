import { MotionConfig } from 'framer-motion';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { SITE } from '../../config/site';
import { LandingLayout } from './LandingLayout';
import { ArrowUpRight } from '../../landing/icons';

const TECH = [
  {
    layer: 'Frontend',
    items: [
      { name: 'React 19 + TypeScript', detail: 'Component library and type safety' },
      { name: 'Vite + Tailwind v4', detail: 'Fast builds and utility-first styling' },
      { name: 'Framer Motion', detail: 'Fluid transitions and reduced-motion support' },
      { name: 'CodeMirror 6', detail: 'In-browser code editor with syntax highlighting' },
    ],
  },
  {
    layer: 'Desktop',
    items: [
      { name: 'Electron 44', detail: 'Windows, macOS and Linux shell' },
      { name: 'electron-builder', detail: 'Signed installers and auto-update' },
      { name: 'Local sandbox runner', detail: 'Offline JavaScript, Python and SQL execution' },
    ],
  },
  {
    layer: 'Mobile',
    items: [
      { name: 'Capacitor 8', detail: 'Native Android and iOS bridge' },
      { name: 'Android Gradle build', detail: 'Signed APK and App Bundle' },
      { name: 'iOS / Xcode project', detail: 'TestFlight and App Store distribution' },
    ],
  },
  {
    layer: 'Backend',
    items: [
      { name: 'Node.js + Express', detail: 'REST API and session handling' },
      { name: 'Oracle Autonomous Database', detail: 'Durable persistence and encryption' },
      { name: 'JWT auth + bcrypt', detail: 'Secure session tokens and password hashing' },
      { name: 'Rate-limiting + CSP headers', detail: 'Request hardening and content security' },
    ],
  },
  {
    layer: 'Machine Learning',
    items: [
      { name: 'Python + scikit-learn', detail: 'Readiness score and role prediction' },
      { name: 'Elo-style proficiency model', detail: 'Difficulty-weighted skill rating per submission' },
      { name: 'Deterministic rubric engine', detail: 'Interview scoring without paid AI APIs' },
    ],
  },
];

const PRINCIPLES = [
  {
    title: 'Honest progress',
    body: 'Every metric shown in the app derives from actual submissions, interview responses and resume analysis — no padded numbers or invented streaks.',
  },
  {
    title: 'Offline first',
    body: 'The desktop and mobile apps work without a network connection. Practice sessions, code execution and progress updates queue locally and sync when you reconnect.',
  },
  {
    title: 'No mandatory AI',
    body: 'Scoring, rubrics and recommendations use deterministic algorithms. An optional LLM layer can refine interview feedback, but the product works entirely without it.',
  },
  {
    title: 'Privacy by design',
    body: 'Resume text is stored encrypted, not the original file. You can request full deletion at any time. We do not sell data or use it to train models.',
  },
  {
    title: 'Open source',
    body: 'The full source code is public on GitHub. You can inspect every algorithm, report issues, suggest improvements and build on the project.',
  },
];

export function AboutPage() {
  useDocumentTitle(
    'About',
    'What Trajectory is, how it works, the technology behind it, and our approach to privacy and open-source development.',
  );

  const ghBase = `https://github.com/${SITE.githubRepo}`;

  return (
    <MotionConfig reducedMotion="user">
      <LandingLayout
        label="// About"
        title="What Trajectory is"
        subtitle="A career-readiness platform for software engineers — coding practice, mock interviews, resume analysis and a measurable path to your target role."
      >
        {/* Mission */}
        <section aria-labelledby="mission-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-body text-sm text-white/50">// The problem we solve</p>
            <h2 id="mission-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
              Interview prep should be measurable
            </h2>
            <div className="mt-8 space-y-5 font-body text-base leading-relaxed text-white/70">
              <p>
                Most interview prep is disconnected. You solve LeetCode in one tab, watch system design videos in
                another, and guess at which skills you still lack. There is no unified signal telling you how
                close you are to being ready for a specific role.
              </p>
              <p>
                Trajectory ties coding practice, mock interviews and resume analysis to the same underlying
                skill model. Every submission updates the skills it exercises. Every interview session moves
                the same needle. The readiness score tells you, in terms of your target role's requirements,
                exactly how far you have left to go.
              </p>
              <p>
                The platform is free, works offline and is open source. Nothing is hidden behind a paywall,
                and no algorithm is opaque.
              </p>
            </div>
          </div>
        </section>

        {/* Design principles */}
        <section aria-labelledby="principles-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <p className="font-body text-sm text-white/50">// How it's built</p>
          <h2 id="principles-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
            Design principles
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title}
                className="rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-6 space-y-3">
                <h3 className="font-heading text-lg italic text-white">{p.title}</h3>
                <p className="font-body text-sm leading-relaxed text-white/60">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology */}
        <section aria-labelledby="tech-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <p className="font-body text-sm text-white/50">// Stack</p>
          <h2 id="tech-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
            Technology
          </h2>
          <div className="mt-10 space-y-10">
            {TECH.map((group) => (
              <div key={group.layer}>
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-white/40">
                  {group.layer}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => (
                    <div key={item.name}
                      className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <p className="font-body text-sm font-medium text-white">{item.name}</p>
                      <p className="mt-1 font-body text-xs leading-relaxed text-white/50">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open source + links */}
        <section aria-labelledby="oss-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-body text-sm text-white/50">// Open source</p>
            <h2 id="oss-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
              Built in public
            </h2>
            <p className="mt-6 font-body text-base leading-relaxed text-white/70">
              Trajectory is developed openly on GitHub. The source code for every component — the web app,
              desktop shell, Android and iOS projects, backend API, ML models and CI pipelines — is in the
              same repository and available under an open-source licence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={ghBase} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
                View on GitHub <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href={`${ghBase}/issues`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Report an issue <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link to="/release-notes"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Changelog
              </Link>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section aria-labelledby="privacy-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-body text-sm text-white/50">// Privacy</p>
            <h2 id="privacy-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
              Your data
            </h2>
            <div className="mt-8 space-y-4 font-body text-base leading-relaxed text-white/70">
              <p>
                We collect only what the product requires: your email address for login, practice and
                interview data to calculate your readiness, and the extracted text from any resume you
                upload. The original resume file is never stored — only the parsed analysis, encrypted at
                rest.
              </p>
              <p>
                We do not sell data, share it with third parties for advertising or use it to train machine
                learning models. Analytics are limited to aggregate page-view counts.
              </p>
              <p>
                You can request deletion of your account and all associated data at any time from the
                contact page. We confirm deletion by email within 30 days.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/privacy"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Privacy policy
              </Link>
              <Link to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Submit a privacy request
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section aria-label="Get started" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <div className="mx-auto max-w-4xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl italic text-white">Ready to get started?</h2>
              <p className="mt-1 font-body text-sm text-white/60">
                Download the app or sign in to the web version.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/downloads"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
                Downloads
              </Link>
              <Link to="/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Sign up free
              </Link>
            </div>
          </div>
        </section>
      </LandingLayout>
    </MotionConfig>
  );
}

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, navigate, usePath } from '../lib/router';
import { DownloadIcon, ArrowUpRight } from '../landing/icons';

const EASE: [number, number, number, number] = [0.65, 0.01, 0.05, 0.99];

const NAV_ITEMS = [
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'Downloads', to: '/downloads' },
  { label: 'Changelog', to: '/release-notes' },
  { label: 'Contact', to: '/contact' },
];

const SECONDARY = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Support', to: '/support' },
  { label: 'Platform Guides', to: '/platform-guides' },
  { label: 'Privacy', to: '/privacy' },
];

// SVG background shapes: one set per nav item, shown on hover
const SHAPES = [
  // About: floating circles
  <svg key="1" viewBox="0 0 400 400" fill="none" className="absolute inset-0 h-full w-full">
    <circle cx="80" cy="120" r="45" fill="rgba(99,102,241,0.12)" />
    <circle cx="310" cy="90" r="70" fill="rgba(139,92,246,0.09)" />
    <circle cx="200" cy="310" r="90" fill="rgba(236,72,153,0.08)" />
    <circle cx="360" cy="290" r="30" fill="rgba(99,102,241,0.12)" />
  </svg>,
  // Features: wave paths
  <svg key="2" viewBox="0 0 400 400" fill="none" className="absolute inset-0 h-full w-full">
    <path d="M0 200 Q100 100 200 200 T 400 200" stroke="rgba(99,102,241,0.18)" strokeWidth="60" />
    <path d="M0 290 Q100 190 200 290 T 400 290" stroke="rgba(139,92,246,0.13)" strokeWidth="40" />
  </svg>,
  // Downloads: grid dots
  <svg key="3" viewBox="0 0 400 400" fill="none" className="absolute inset-0 h-full w-full">
    {[50,150,250,350].map((x) => <circle key={x} cx={x} cy="60" r="7" fill="rgba(99,102,241,0.28)" />)}
    {[100,200,300].map((x) => <circle key={x} cx={x} cy="160" r="11" fill="rgba(139,92,246,0.22)" />)}
    {[50,150,250,350].map((x) => <circle key={x} cx={x} cy="260" r="9" fill="rgba(236,72,153,0.24)" />)}
  </svg>,
  // Changelog: organic blobs
  <svg key="4" viewBox="0 0 400 400" fill="none" className="absolute inset-0 h-full w-full">
    <path d="M100 100 Q150 50 200 100 Q250 150 200 200 Q150 250 100 200 Q50 150 100 100" fill="rgba(99,102,241,0.11)" />
    <path d="M250 210 Q300 160 350 210 Q400 260 350 310 Q300 360 250 310 Q200 260 250 210" fill="rgba(236,72,153,0.09)" />
  </svg>,
  // Contact: diagonal lines
  <svg key="5" viewBox="0 0 400 400" fill="none" className="absolute inset-0 h-full w-full">
    <line x1="0" y1="110" x2="300" y2="400" stroke="rgba(99,102,241,0.14)" strokeWidth="28" />
    <line x1="110" y1="0" x2="400" y2="290" stroke="rgba(139,92,246,0.11)" strokeWidth="22" />
    <line x1="210" y1="0" x2="400" y2="190" stroke="rgba(236,72,153,0.09)" strokeWidth="18" />
  </svg>,
];

/** Minimal cross/plus icon that rotates 45 ° when menu is open. */
function CrossIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      animate={{ rotate: open ? 45 : 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      aria-hidden
    >
      <path d="M7.33 16V0h1.34v16H7.33Z" fill="currentColor" />
      <path d="M16 8.67H0V7.33h16v1.34Z" fill="currentColor" />
    </motion.svg>
  );
}

export function KineticNav() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const path = usePath();
  const reduced = useReducedMotion();

  // Close on route change
  useEffect(() => { setOpen(false); }, [path]);

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const dur = reduced ? 0 : undefined;

  const panelVariants = {
    hidden: { x: '102%' },
    visible: (i: number) => ({
      x: 0,
      transition: { duration: dur ?? 0.575, delay: i * 0.1, ease: EASE },
    }),
    exit: (i: number) => ({
      x: '102%',
      transition: { duration: dur ?? 0.35, delay: (2 - i) * 0.06, ease: EASE },
    }),
  };

  const linkVariants = {
    hidden: { y: '140%', rotate: reduced ? 0 : 8, opacity: 0 },
    visible: (i: number) => ({
      y: 0, rotate: 0, opacity: 1,
      transition: { duration: dur ?? 0.65, delay: 0.3 + i * 0.06, ease: EASE },
    }),
    exit: (i: number) => ({
      y: '80%', opacity: 0,
      transition: { duration: dur ?? 0.3, delay: i * 0.03, ease: EASE },
    }),
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: dur ?? 0.5, delay: 0.55, ease: EASE } },
    exit: { opacity: 0, transition: { duration: dur ?? 0.2 } },
  };

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-4 z-50 flex items-center justify-between px-6 lg:px-14">
        {/* Logo */}
        <Link
          to="/"
          aria-label="Trajectory home"
          className="liquid-glass flex h-11 w-11 items-center justify-center rounded-full"
        >
          <span className="font-heading text-xl italic leading-none text-white">t</span>
        </Link>

        {/* Desktop nav links */}
        <nav aria-label="Primary" className="liquid-glass hidden items-center rounded-full px-1.5 py-1.5 md:flex">
          {NAV_ITEMS.slice(0, 4).map((n) => (
            <Link key={n.to} to={n.to}
              className="rounded-full px-3 py-2 font-body text-sm font-medium text-white/90 transition-colors hover:text-white">
              {n.label}
            </Link>
          ))}
          <Link to="/downloads"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black transition-colors hover:bg-white/90">
            Download <DownloadIcon className="h-3.5 w-3.5" />
          </Link>
        </nav>

        {/* Right: sign-in + menu button */}
        <div className="flex items-center gap-2">
          <Link to="/login"
            className="liquid-glass hidden h-11 items-center rounded-full px-5 font-body text-sm font-medium text-white sm:inline-flex">
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="kinetic-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="liquid-glass inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full px-4 font-body text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <span className="hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
            <CrossIcon open={open} />
          </button>
        </div>
      </header>

      {/* ── Fullscreen overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <div id="kinetic-menu" role="dialog" aria-modal aria-label="Site navigation" className="fixed inset-0 z-[60]">
            {/* Click-outside overlay */}
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
              onClick={() => setOpen(false)}
            />

            {/* Backdrop panels (3 layers slide from right, each a slightly different dark shade) */}
            {(['#0d0d18', '#0a0a14', '#07070f'] as const).map((color, i) => (
              <motion.div
                key={color}
                custom={i}
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0"
                style={{ background: color }}
              />
            ))}

            {/* Background shape (per-hovered item) */}
            <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
              <AnimatePresence mode="wait">
                {hovered !== null && (
                  <motion.div
                    key={hovered}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="absolute inset-0"
                  >
                    {SHAPES[hovered]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menu content */}
            <div className="relative z-10 flex h-full flex-col justify-between px-8 pb-10 pt-28 md:px-16 lg:px-24">
              {/* Primary nav items */}
              <nav aria-label="Menu" className="mt-4">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item, i) => (
                    <li key={item.to} className="overflow-hidden">
                      <motion.div
                        custom={i}
                        variants={linkVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <Link
                          to={item.to}
                          onMouseEnter={() => setHovered(i)}
                          onMouseLeave={() => setHovered(null)}
                          className="group relative inline-flex items-center gap-4 py-2 font-heading text-5xl italic tracking-[-2px] text-white/70 transition-colors hover:text-white md:text-6xl lg:text-7xl"
                          onClick={() => setOpen(false)}
                        >
                          <span className="font-mono text-[11px] tracking-widest text-white/25 transition-colors group-hover:text-white/50">
                            0{i + 1}
                          </span>
                          {item.label}
                          <ArrowUpRight className="h-6 w-6 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100" />
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Bottom row: secondary links + download CTA */}
              <motion.div
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
              >
                <nav aria-label="Secondary" className="flex flex-wrap gap-x-6 gap-y-1">
                  {SECONDARY.map((s) => (
                    <Link key={s.to} to={s.to}
                      onClick={() => setOpen(false)}
                      className="font-body text-sm text-white/40 transition-colors hover:text-white/70">
                      {s.label}
                    </Link>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate('/downloads'); }}
                  className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90 sm:self-auto"
                >
                  Download <DownloadIcon className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

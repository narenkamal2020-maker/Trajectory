import { useState, type ReactNode } from 'react';
import { Link, navigate, usePath } from '../../lib/router';
import { SiteFooter } from './PublicLayout';
import { DownloadIcon } from '../../landing/icons';
import '../../landing/landing.css';

export const LANDING_NAV = [
  { label: 'Features', to: '/features' },
  { label: 'Downloads', to: '/downloads' },
  { label: 'Support', to: '/support' },
  { label: 'About', to: '/about' },
];

export function LandingInnerNav() {
  const [menu, setMenu] = useState(false);
  const path = usePath();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" aria-label="Trajectory home" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <span className="font-heading text-lg italic leading-none text-white">t</span>
          </span>
          <span className="font-heading text-sm italic text-white/70 hidden sm:inline">rajectory</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LANDING_NAV.map((n) => (
            <Link key={n.to} to={n.to}
              aria-current={path === n.to ? 'page' : undefined}
              className={`rounded-full px-3 py-2 font-body text-sm font-medium transition-colors ${
                path === n.to
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}>
              {n.label}
            </Link>
          ))}
          <Link to="/downloads"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black transition-colors hover:bg-white/90">
            Download <DownloadIcon className="h-3.5 w-3.5" />
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link to="/login" className="font-body text-sm text-white/70 hover:text-white transition-colors">
            Sign in
          </Link>
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu}
            aria-controls="landing-inner-menu" aria-label={menu ? 'Close menu' : 'Open menu'}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
              {menu
                ? <><path d="M2 2l14 14M16 2 2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></>
                : <><rect y="3" width="18" height="2" rx="1" /><rect y="8" width="18" height="2" rx="1" /><rect y="13" width="18" height="2" rx="1" /></>}
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <nav id="landing-inner-menu" aria-label="Mobile" className="border-t border-white/10 bg-black px-4 py-3 md:hidden">
          {LANDING_NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setMenu(false)}
              className="block rounded-xl px-4 py-3 font-body text-sm text-white/80 hover:bg-white/5 transition-colors">
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={() => { setMenu(false); navigate('/downloads'); }}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 font-body text-sm font-medium text-black transition-colors hover:bg-white/90">
            Download <DownloadIcon className="h-4 w-4" />
          </button>
        </nav>
      )}
    </header>
  );
}

interface LandingLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  label?: string;
  hero?: ReactNode;
}

export function LandingLayout({ children, title, subtitle, label, hero }: LandingLayoutProps) {
  return (
    <div className="landing min-h-screen bg-black text-white">
      <a href="#landing-inner-main"
        onClick={(e) => { e.preventDefault(); document.getElementById('landing-inner-main')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <LandingInnerNav />
      <main id="landing-inner-main" tabIndex={-1} className="outline-none">
        {hero ?? (
          <div className="relative overflow-hidden border-b border-white/5 px-6 pb-14 pt-16 md:px-16 lg:px-20">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(80,50,200,0.09), transparent 70%)' }}
              aria-hidden
            />
            <div className="relative">
              {label && <p className="mb-3 font-body text-sm text-white/50">{label}</p>}
              <h1 className="font-heading text-5xl italic tracking-[-2px] text-white md:text-6xl lg:text-7xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-4 max-w-xl font-body text-base font-light leading-relaxed text-white/70">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        {children}
      </main>
      <SiteFooter dark />
    </div>
  );
}

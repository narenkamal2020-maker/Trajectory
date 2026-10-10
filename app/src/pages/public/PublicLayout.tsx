import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X, MessageCircle, Mail, MapPin } from 'lucide-react';
import { Link, usePath } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { SITE } from '../../config/site';
import { BackToTop, ScrollProgress, ThemeQuickToggle } from '../../components/extras';
import { cx } from '../../components/ui';

const LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/platform-guides', label: 'Guides' },
  { to: '/release-notes', label: 'Changelog' },
  { to: '/support', label: 'Support' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
];

export function SiteFooter({ dark = false }: { dark?: boolean }) {
  return (
    <footer className={cx('border-t py-8 px-4 text-sm print:hidden', dark ? 'border-white/10 bg-black text-white/70' : 'border-white/10 text-[var(--color-text-secondary)]')}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:items-start justify-between">
        <div className="space-y-2">
          <div className={cx('font-headline font-bold', dark ? 'text-white' : 'text-[var(--color-text-primary)]')}>{SITE.name} <span className="font-normal opacity-70">by {SITE.company}</span></div>
          <a href={`mailto:${SITE.contactEmail}`} className="flex items-center gap-2 hover:underline"><Mail className="w-4 h-4" aria-hidden /> {SITE.contactEmail}</a>
          {SITE.address && <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> <span className="whitespace-pre-line">{SITE.address}</span></p>}
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:underline">{l.label}</Link>)}
        </nav>
      </div>
      <p className="max-w-5xl mx-auto mt-6 text-xs opacity-60">© {new Date().getFullYear()} {SITE.company}. All rights reserved.</p>
    </footer>
  );
}

export function FloatingContact({ className }: { className?: string }) {
  return (
    <Link to="/contact" aria-label="Contact us"
      className={cx('fixed z-40 right-4 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold text-sm print:hidden', className ?? 'bottom-20 sm:bottom-6')}>
      <MessageCircle className="w-4 h-4" aria-hidden /> <span className="hidden sm:inline">Contact</span>
    </Link>
  );
}

/** Shell for public, unauthenticated-friendly pages (legal, contact, FAQ, 404). */
export function PublicLayout({ children }: { children: ReactNode }) {
  const path = usePath();
  const { status } = useAuth();
  const [menu, setMenu] = useState(false);
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [path]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-body">
      <a href="#public-main" onClick={(e) => { e.preventDefault(); document.getElementById('public-main')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[var(--color-primary)] focus:text-[var(--color-on-primary)] focus:rounded">Skip to content</a>
      <ScrollProgress />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--color-bg-base)]/90 backdrop-blur-xl print:static">
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
            <span className="font-headline font-bold text-[var(--color-primary)] tracking-tight">TRAJECTORY</span>
          </Link>
          <nav aria-label="Primary" className="hidden md:flex items-center gap-5 text-sm">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} aria-current={path === l.to ? 'page' : undefined}
                className={cx('hover:text-[var(--color-primary)]', path === l.to ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-secondary)]')}>{l.label}</Link>
            ))}
            <ThemeQuickToggle />
            <Link to={status === 'authenticated' ? '/dashboard' : '/register'} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold">
              {status === 'authenticated' ? 'Open app' : 'Get started'}
            </Link>
          </nav>
          <div className="flex md:hidden items-center gap-1">
            <ThemeQuickToggle />
            <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="public-mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'}
              className="p-2 rounded-lg hover:bg-white/5 cursor-pointer">{menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
          </div>
        </div>
        {menu && (
          <nav id="public-mobile-menu" aria-label="Mobile" className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
            {LINKS.map((l) => <Link key={l.to} to={l.to} className="px-2 py-2.5 rounded-lg hover:bg-white/5">{l.label}</Link>)}
            <Link to={status === 'authenticated' ? '/dashboard' : '/register'} className="mt-2 px-3 py-2.5 rounded-lg text-center bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold">
              {status === 'authenticated' ? 'Open app' : 'Get started'}
            </Link>
          </nav>
        )}
      </header>
      <main id="public-main" tabIndex={-1} className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 outline-none">{children}</main>
      <SiteFooter />
      <FloatingContact />
      <BackToTop className="bottom-36 sm:bottom-20" />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-headline text-xl font-bold mb-3">{title}</h2>
      <div className="space-y-3 text-[var(--color-text-secondary)] leading-relaxed">{children}</div>
    </section>
  );
}

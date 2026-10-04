import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Compass, Code2, Mic, Sparkles, Rocket, BarChart3, FileText, Briefcase, Settings, LogOut, Search, WifiOff,
  RefreshCw, MoreHorizontal, X, User as UserIcon, Cpu, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useOffline } from '../lib/offline-context';
import { navigate, usePath, Link } from '../lib/router';
import { api } from '../lib/api';
import { platformKind } from '../lib/platform';
import type { QuestionListItem } from '../lib/types';
import { cx } from './ui';
import { BackToTop, ThemeQuickToggle } from './extras';

export const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: Compass, mobile: true },
  { path: '/practice', label: 'Practice', icon: Code2, mobile: true },
  { path: '/interviews', label: 'Interviews', icon: Mic, mobile: true },
  { path: '/skills', label: 'Skills', icon: Sparkles, mobile: true },
  { path: '/career', label: 'Career', icon: Rocket, mobile: false },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, mobile: false },
  { path: '/resume', label: 'Resume', icon: FileText, mobile: false },
  { path: '/applications', label: 'Applications', icon: Briefcase, mobile: false },
  { path: '/settings', label: 'Settings', icon: Settings, mobile: false },
];
const ADMIN_NAV = { path: '/admin', label: 'Admin', icon: ShieldCheck, mobile: false };

function useEngineStatus(isAdmin: boolean) {
  const [status, setStatus] = useState<{ ml: boolean; llm: string } | null>(null);
  useEffect(() => {
    let alive = true;
    // Engine internals are admin-only; learners just see connectivity.
    if (!isAdmin) return () => { alive = false; };
    const load = () => api.systemStatus().then((h) => alive && setStatus({ ml: h.ml === 'up', llm: h.llm })).catch(() => alive && setStatus(null));
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [isAdmin]);
  return status;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<QuestionListItem[] | null>(null);
  const items = useMemo(() => {
    const actions = [
      ...NAV.map((n) => ({ label: `Go to ${n.label}`, run: () => navigate(n.path) })),
      { label: 'Start a behavioral mock interview', run: () => navigate('/interviews?start=BEHAVIORAL') },
      { label: 'Start a system design mock interview', run: () => navigate('/interviews?start=SYSTEM_DESIGN') },
      { label: 'Practice: easy problems', run: () => navigate('/practice?difficulty=EASY') },
      { label: 'Upload a new resume', run: () => navigate('/resume') },
      { label: 'Add a job application', run: () => navigate('/applications?new=1') },
    ];
    const s = q.toLowerCase();
    const matchedActions = actions.filter((a) => a.label.toLowerCase().includes(s));
    // Site search: problems by title or tag (only once the user starts typing).
    const matchedQuestions = s.length < 2 ? [] : (questions ?? [])
      .filter((x) => x.title.toLowerCase().includes(s) || x.tags.some((t) => t.includes(s)) || x.categoryName.toLowerCase().includes(s))
      .slice(0, 8)
      .map((x) => ({ label: `Problem: ${x.title} · ${x.difficulty.toLowerCase()}`, run: () => navigate(`/practice/${x.id}`) }));
    return [...matchedActions, ...matchedQuestions];
  }, [q, questions]);
  useEffect(() => {
    if (!open) return;
    setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 0);
    if (!questions) api.questions().then((r) => setQuestions(r.items)).catch(() => setQuestions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4" onClick={onClose} role="presentation">
      <div role="dialog" aria-label="Command palette" className="w-full max-w-xl rounded-2xl bg-[var(--color-surface)] border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b border-white/10">
          <Search className="w-4 h-4 text-[var(--color-primary)]" />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Search problems or run a command…" aria-label="Command"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              if (e.key === 'Enter' && items[sel]) { items[sel].run(); onClose(); }
              if (e.key === 'Escape') onClose();
            }}
            className="flex-1 bg-transparent py-3.5 text-sm text-white focus:outline-none" />
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {items.map((it, i) => (
            <li key={it.label}>
              <button type="button" onMouseEnter={() => setSel(i)} onClick={() => { it.run(); onClose(); }}
                className={cx('w-full text-left px-4 py-2 text-sm cursor-pointer', i === sel ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]')}>
                {it.label}
              </button>
            </li>
          ))}
          {!items.length && <li className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No matching commands</li>}
        </ul>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePath();
  const { user, logout } = useAuth();
  const { online, pendingCount, syncing, syncNow } = useOffline();
  const engine = useEngineStatus(user?.role === 'ADMIN');
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const active = (p: string) => path === p || path.startsWith(p + '/') || path.startsWith(p + '?');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { setMore(false); setMenu(false); }, [path]);

  const nav = user?.role === 'ADMIN' ? [...NAV, ADMIN_NAV] : NAV;
  const initials = (user?.name ?? '?').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-body">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[var(--color-primary)] focus:text-black focus:rounded">Skip to content</a>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-14 z-40 flex items-center justify-between gap-3 px-4 md:px-6 bg-[var(--color-bg-base)]/90 backdrop-blur-xl border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]" aria-hidden />
          <span className="font-headline text-base font-bold tracking-tight text-[var(--color-primary)]">TRAJECTORY</span>
          {platformKind() !== 'web' && <span className="hidden sm:inline font-mono text-[10px] text-[var(--color-text-secondary)] bg-[var(--color-surface-container-high)] px-1.5 py-0.5 rounded">{platformKind()}</span>}
        </Link>

        <button type="button" onClick={() => setPalette(true)}
          className="hidden lg:flex flex-1 max-w-md items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--color-surface-container-low)] border border-white/5 text-[var(--color-text-secondary)] hover:text-white text-xs font-mono cursor-pointer">
          <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Search or run a command…</span>
          <kbd className="bg-[var(--color-surface-container-high)] px-1.5 py-0.5 rounded text-[10px]">Ctrl K</kbd>
        </button>

        <div className="flex items-center gap-2">
          {!online && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 font-mono text-[11px]" role="status">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
          {pendingCount > 0 && (
            <button type="button" onClick={() => syncNow()} disabled={!online || syncing} title="Submissions waiting to sync"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-mono text-[11px] cursor-pointer disabled:cursor-default">
              <RefreshCw className={cx('w-3.5 h-3.5', syncing && 'animate-spin')} /> {pendingCount} queued
            </button>
          )}
          <ThemeQuickToggle />
          {engine && (
            <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface-container-low)] border border-white/5 font-mono text-[11px] text-[var(--color-secondary)]" title={`LLM: ${engine.llm}`}>
              <Cpu className="w-3.5 h-3.5" /> {engine.ml ? 'ML + rules' : 'Rule engine'}
            </span>
          )}
          <div className="relative">
            <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu"
              className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold text-xs flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(255,211,113,0.4)]">
              {initials}
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--color-surface)] border border-white/10 shadow-2xl py-1 z-50">
                <div className="px-3 py-2 border-b border-white/10">
                  <div className="text-sm text-white font-bold truncate">{user?.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</div>
                </div>
                <button role="menuitem" type="button" onClick={() => navigate('/settings')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white cursor-pointer"><UserIcon className="w-4 h-4" /> Profile & settings</button>
                <button role="menuitem" type="button" onClick={() => void logout()} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10 cursor-pointer"><LogOut className="w-4 h-4" /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-60 flex-col justify-between p-3 bg-[var(--color-bg-base)]/95 border-r border-white/10 z-30" aria-label="Primary">
        <nav className="flex flex-col gap-1">
          {nav.map((n) => {
            const I = n.icon;
            return (
              <Link key={n.path} to={n.path} aria-current={active(n.path) ? 'page' : undefined}
                className={cx('flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all',
                  active(n.path) ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold shadow-[0_0_16px_rgba(237,180,11,0.3)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container-low)] hover:text-white')}>
                <I className="w-4 h-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 rounded-xl bg-[var(--color-surface-container-low)] border border-white/5 text-[11px] font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--color-secondary)] font-bold"><span className={cx('w-1.5 h-1.5 rounded-full', online ? 'bg-emerald-400' : 'bg-rose-400')} /> {online ? 'Connected' : 'Offline mode'}</div>
          {engine && <>
            <div className="text-[var(--color-text-muted)]">Evaluator: {engine.llm.startsWith('disabled') ? 'rule-based' : engine.llm}</div>
            <div className="text-[var(--color-text-muted)]">Recommender: {engine.ml ? 'rules + ML' : 'rules'}</div>
          </>}
        </div>
      </aside>

      <main id="main" className="pt-14 md:pl-60 pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 grid grid-cols-5 bg-[var(--color-bg-base)]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
        {NAV.filter((n) => n.mobile).map((n) => {
          const I = n.icon;
          return (
            <Link key={n.path} to={n.path} aria-current={active(n.path) ? 'page' : undefined}
              className={cx('flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono', active(n.path) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')}>
              <I className="w-5 h-5" /> {n.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMore(true)} className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono text-[var(--color-text-muted)] cursor-pointer">
          <MoreHorizontal className="w-5 h-5" /> More
        </button>
      </nav>
      {more && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMore(false)} role="presentation">
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-[var(--color-surface)] border-t border-white/10 p-4 pb-8" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="More">
            <div className="flex justify-between items-center mb-3">
              <span className="font-headline font-bold text-white">More</span>
              <button type="button" aria-label="Close" onClick={() => setMore(false)} className="p-1 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {nav.filter((n) => !n.mobile).map((n) => {
                const I = n.icon;
                return (
                  <Link key={n.path} to={n.path} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--color-surface-container-low)] text-xs text-[var(--color-text-secondary)]">
                    <I className="w-5 h-5 text-[var(--color-primary)]" /> {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <BackToTop />
    </div>
  );
}

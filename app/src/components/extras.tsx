/** Small shared UI helpers: copy button, back-to-top, scroll progress, theme switcher, confirm dialog. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, Check, Copy, Monitor, Moon, Sun, AlertTriangle } from 'lucide-react';
import { ThemeToggle, TOGGLE_STYLES, ToggleGlyph } from './ThemeToggle';
import { useTheme, useToggleStyle, type ThemeMode } from '../lib/theme';
import { Button, cx } from './ui';

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts / older WebViews.
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button type="button" onClick={copy} aria-label={copied ? 'Copied' : label}
      className={cx('inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border border-white/10 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 cursor-pointer print:hidden', className)}>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setY(window.scrollY)); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); };
  }, []);
  return y;
}

export function BackToTop({ className }: { className?: string }) {
  const y = useScrollY();
  if (y < 600) return null;
  return (
    <button type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cx('fixed right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-xl border border-white/10 bg-[var(--color-surface-container-high)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-container-highest)] cursor-pointer print:hidden', className ?? 'bottom-20 md:bottom-6')}>
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}

export function ScrollProgress() {
  const y = useScrollY();
  const max = typeof document === 'undefined' ? 1 : Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const pct = Math.min(100, (y / max) * 100);
  return (
    <div className="fixed top-0 inset-x-0 h-0.5 z-[60] pointer-events-none print:hidden" aria-hidden>
      <div className="h-full bg-[var(--color-primary)] transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  );
}

const MODES: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: 'system', label: 'System', icon: Monitor },
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  return (
    <div role="radiogroup" aria-label="Appearance" className="inline-flex rounded-xl border border-white/10 p-1 bg-[var(--color-surface-container-low)]">
      {MODES.map((m) => (
        <button key={m.mode} type="button" role="radio" aria-checked={mode === m.mode} onClick={() => setMode(m.mode)}
          className={cx('inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm cursor-pointer transition-colors',
            mode === m.mode ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-text-secondary)] hover:text-white')}>
          <m.icon className="w-4 h-4" /> {m.label}
        </button>
      ))}
    </div>
  );
}

/** Header quick toggle: the animated toggle in the style chosen in Settings. */
export function ThemeQuickToggle() {
  return <ThemeToggle className="h-9 w-9 border border-white/10" />;
}

/** Settings: choose which animated toggle appears in the header. */
export function ToggleStylePicker() {
  const [style, setStyle] = useToggleStyle();
  const { resolved } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme toggle style" className="flex flex-wrap gap-2">
      {TOGGLE_STYLES.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={style === s.id} onClick={() => setStyle(s.id)}
          className={cx('flex flex-col items-center gap-2 rounded-xl border px-3 py-3 w-24 cursor-pointer transition-colors',
            style === s.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-white/10 hover:border-white/30')}>
          <ToggleGlyph style={s.id} isDark={resolved === 'dark'} className="h-11 w-11 border border-white/10" />
          <span className="text-xs text-[var(--color-text-secondary)]">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Confirmation dialog (replaces window.confirm) ──
interface ConfirmOptions { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean }
type ConfirmFn = (o: ConfirmOptions) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const confirm = useCallback<ConfirmFn>((o) => new Promise((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };

  useEffect(() => {
    if (!state) return;
    const prev = document.activeElement as HTMLElement | null;
    confirmBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => close(false)} role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-white/10 shadow-2xl p-6">
            <div className="flex gap-3">
              {state.danger && <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />}
              <div>
                <h2 id="confirm-title" className="font-headline font-bold text-white text-lg">{state.title}</h2>
                {state.body && <div id="confirm-body" className="text-sm text-[var(--color-text-secondary)] mt-2">{state.body}</div>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => close(false)}>Cancel</Button>
              <Button ref={confirmBtn} variant={state.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{state.confirmLabel ?? 'Confirm'}</Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);

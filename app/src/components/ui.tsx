/** Shared UI primitives in the Orbital Precision style (see DESIGN.md). */
import { useEffect, useId, useState, type ButtonHTMLAttributes, type Ref, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2, X } from 'lucide-react';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export function Card({ children, className, accent = false, as: Tag = 'section' }: { children: ReactNode; className?: string; accent?: boolean; as?: 'section' | 'div' | 'article' }) {
  return (
    <Tag className={cx('rounded-2xl border shadow-lg p-5 bg-[var(--color-surface-card)] backdrop-blur-md transition-all duration-300',
      accent
        ? 'border-[var(--color-gold-border)] shadow-[0_0_24px_rgba(237,180,11,0.08)]'
        : 'border-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
      className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, eyebrow, action, icon }: { title: ReactNode; eyebrow?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-white/10">
      <div className="min-w-0">
        {eyebrow && <div className="font-mono text-[10px] tracking-wider uppercase text-[var(--color-text-muted)] mb-1">{eyebrow}</div>}
        <h2 className="font-headline font-bold text-base text-white flex items-center gap-2">{icon}{title}</h2>
      </div>
      {action}
    </header>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ variant = 'secondary', loading, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; ref?: Ref<HTMLButtonElement> }) {
  const styles: Record<Variant, string> = {
    primary: 'shimmer-btn bg-[var(--color-primary)] hover:bg-[var(--color-gold)] text-[var(--color-on-primary)] font-bold shadow-[0_0_16px_rgba(237,180,11,0.3)] hover:shadow-[0_0_24px_rgba(237,180,11,0.45)]',
    secondary: 'bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-white border border-white/10 hover:border-white/20',
    ghost: 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30',
  };
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]', styles[variant], className)}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'gold', className }: { children: ReactNode; tone?: 'gold' | 'green' | 'red' | 'blue' | 'muted' | 'orange'; className?: string }) {
  const tones = {
    gold: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30',
    green: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    red: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    blue: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    orange: 'text-[var(--color-secondary)] bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/30',
    muted: 'text-[var(--color-text-secondary)] bg-white/5 border-white/10',
  };
  return <span className={cx('inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border', tones[tone], className)}>{children}</span>;
}

export const difficultyTone = (d: string) => (d === 'EASY' ? 'green' : d === 'MEDIUM' ? 'orange' : 'red') as 'green' | 'orange' | 'red';
export const verdictTone = (v: string) =>
  (v === 'ACCEPTED' ? 'green' : v === 'PARTIAL' ? 'orange' : v === 'TLE' ? 'blue' : 'red') as 'green' | 'orange' | 'blue' | 'red';

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'gold' | 'white' }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className={cx('font-headline text-2xl font-bold mt-0.5', tone === 'gold' ? 'text-[var(--color-primary)]' : 'text-white')}>{value}</div>
      {sub && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, max = 100, marker, label, tone = 'gold' }: { value: number; max?: number; marker?: number; label?: string; tone?: 'gold' | 'green' | 'red' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === 'green' ? 'bg-emerald-400' : tone === 'red' ? 'bg-rose-400' : 'bg-[var(--color-primary)]';
  return (
    <div className="relative w-full h-2 rounded-full bg-[var(--color-surface-container-highest)]" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className={cx('h-full rounded-full transition-[width] duration-700 relative overflow-hidden', color)} style={{ width: `${pct}%` }}>
        {pct > 10 && <div className="progress-shimmer" aria-hidden />}
      </div>
      {marker !== undefined && <div className="absolute -top-1 w-0.5 h-4 bg-white/70 rounded" style={{ left: `${Math.min(100, (marker / max) * 100)}%` }} aria-hidden />}
    </div>
  );
}

/** Circular gauge. */
export function Ring({ value, size = 120, stroke = 10, label, sublabel }: { value: number; size?: number; stroke?: number; label?: ReactNode; sublabel?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, value));
  const glow = pct >= 70 ? `drop-shadow(0 0 ${stroke / 1.5}px var(--color-primary))` : undefined;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden style={{ filter: glow }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-container-highest)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-primary)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-headline font-bold text-white" style={{ fontSize: size / 4.2 }}>{label ?? `${Math.round(pct)}%`}</span>
        {sublabel && <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase">{sublabel}</span>}
      </div>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-text-secondary)] font-mono text-xs" role="status">
      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" /> {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Card className="text-center py-10">
      <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto mb-3" />
      <p className="text-sm text-white mb-1">Something went wrong</p>
      <p className="text-xs text-[var(--color-text-secondary)] mb-4">{error.message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      {icon && <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--color-primary)]">{icon}</div>}
      <p className="text-sm font-bold text-white">{title}</p>
      {body && <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, eyebrow, actions }: { title: string; subtitle?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--color-primary)] mb-1">{eyebrow}</div>}
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const inputCls = 'w-full rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-primary)]/60 focus:ring-2 focus:ring-[var(--color-primary)]/20';

export function Field({ label, error, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const isPassword = rest.type === 'password';
  const [reveal, setReveal] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">{label}</label>
      <div className="relative">
        <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className={cx(inputCls, error && 'border-rose-400/60', isPassword && 'pr-10')} {...rest}
          type={isPassword && reveal ? 'text' : rest.type} />
        {isPassword && (
          <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'Hide password' : 'Show password'} aria-pressed={reveal}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer">
            {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error ? <p id={`${id}-err`} className="text-xs text-rose-300 mt-1">{error}</p> : hint ? <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p> : null}
    </div>
  );
}

export function SelectField({ label, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">{label}</label>
      <select id={id} className={inputCls} {...rest}>{children}</select>
    </div>
  );
}

export function TextArea({ label, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const id = useId();
  return (
    <div>
      {label && <label htmlFor={id} className="block font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">{label}</label>}
      <textarea id={id} className={cx(inputCls, 'resize-y')} {...rest} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={cx('w-full rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[var(--color-surface)]">
          <h2 className="font-headline font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-white/10 text-[var(--color-text-secondary)] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

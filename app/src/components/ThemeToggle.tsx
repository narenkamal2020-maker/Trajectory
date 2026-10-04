/**
 * Animated light/dark toggles (five styles), wired to the app's theme system.
 * Adapted from the Skiper theme-toggle set: colours use the app's tokens, clip-path ids are unique
 * per instance (useId), and motion respects prefers-reduced-motion.
 */
import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme, useToggleStyle, type ToggleStyle } from '../lib/theme';
import { cx } from './ui';

interface GlyphProps { isDark: boolean; duration: number }

/** 1 — "Contrast": a half-moon disc that spins as the halves swap. */
function ContrastGlyph({ isDark, duration }: GlyphProps) {
  const t = { ease: 'easeInOut' as const, duration };
  return (
    <svg viewBox="0 0 240 240" fill="none" aria-hidden className="h-full w-full">
      <motion.g animate={{ rotate: isDark ? -180 : 0 }} transition={t} style={{ originX: '120px', originY: '120px' }}>
        <path d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5" fill="currentColor" />
        <path d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5" fill="var(--toggle-bg)" />
      </motion.g>
      <motion.path animate={{ rotate: isDark ? 180 : 0 }} transition={t} style={{ originX: '120px', originY: '120px' }} fill="currentColor"
        d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 67.5 214.5 120C214.5 172.5 172.5 214.5 120 214.5Z" />
    </svg>
  );
}

/** 2 — "Sunrise": the sun's rays fold away and a shadow carves a crescent moon. */
function SunMoonGlyph({ isDark, duration }: GlyphProps) {
  const id = useId();
  const t = { ease: 'easeInOut' as const, duration };
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" strokeLinecap="round" aria-hidden className="h-full w-full">
      <clipPath id={`${id}-clip`}>
        <motion.path animate={{ y: isDark ? 10 : 0, x: isDark ? -12 : 0 }} transition={t} d="M0-5h30a1 1 0 0 0 9 13v24H0Z" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <motion.circle animate={{ r: isDark ? 10 : 8 }} transition={t} cx="16" cy="16" />
        <motion.g animate={{ rotate: isDark ? -100 : 0, scale: isDark ? 0.5 : 1, opacity: isDark ? 0 : 1 }} transition={t}
          stroke="currentColor" strokeWidth="1.5" style={{ originX: '16px', originY: '16px' }}>
          <path d="M16 5.5v-4" /><path d="M16 30.5v-4" /><path d="M1.5 16h4" /><path d="M26.5 16h4" />
          <path d="m23.4 8.6 2.8-2.8" /><path d="m5.7 26.3 2.9-2.9" /><path d="m5.8 5.8 2.8 2.8" /><path d="m23.4 23.4 2.9 2.9" />
        </motion.g>
      </g>
    </svg>
  );
}

/** 3 — "Dotted sun": a ring of dots fades as the crescent appears. */
function DottedSunGlyph({ isDark, duration }: GlyphProps) {
  const id = useId();
  const t = { ease: 'easeInOut' as const, duration };
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" strokeLinecap="round" aria-hidden className="h-full w-full">
      <clipPath id={`${id}-clip`}>
        <motion.path animate={{ y: isDark ? 14 : 0, x: isDark ? -11 : 0 }} transition={t} d="M0-11h25a1 1 0 0017 13v30H0Z" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <motion.circle animate={{ r: isDark ? 10 : 8 }} transition={t} cx="16" cy="16" />
        <motion.g animate={{ scale: isDark ? 0.5 : 1, opacity: isDark ? 0 : 1 }} transition={t} style={{ originX: '16px', originY: '16px' }}>
          <path d="M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z" />
        </motion.g>
      </g>
    </svg>
  );
}

/** 4 — "Bulb": the filament draws out and the glow lines fade when the light goes off. */
function BulbGlyph({ isDark, duration }: GlyphProps) {
  const t = { ease: 'easeInOut' as const, duration };
  return (
    <svg viewBox="0 0 32 32" strokeWidth="0.7" stroke="currentColor" fill="currentColor" strokeLinecap="round" aria-hidden className="h-full w-full">
      <path strokeWidth="0" d="M9.4 9.9c1.8-1.8 4.1-2.7 6.6-2.7 5.1 0 9.3 4.2 9.3 9.3 0 2.3-.8 4.4-2.3 6.1-.7.8-2 2.8-2.5 4.4 0 .2-.2.4-.5.4-.2 0-.4-.2-.4-.5v-.1c.5-1.8 2-3.9 2.7-4.8 1.4-1.5 2.1-3.5 2.1-5.6 0-4.7-3.7-8.5-8.4-8.5-2.3 0-4.4.9-5.9 2.5-1.6 1.6-2.5 3.7-2.5 6 0 2.1.7 4 2.1 5.6.8.9 2.2 2.9 2.7 4.9 0 .2-.1.5-.4.5h-.1c-.2 0-.4-.1-.4-.4-.5-1.7-1.8-3.7-2.5-4.5-1.5-1.7-2.3-3.9-2.3-6.1 0-2.3 1-4.7 2.7-6.5z" />
      <path d="M19.8 28.3h-7.6" /><path d="M19.8 29.5h-7.6" /><path d="M19.8 30.7h-7.6" />
      <motion.path animate={{ pathLength: isDark ? 0 : 1, opacity: isDark ? 0 : 1 }} transition={t} fill="none"
        d="M14.6 27.1c0-3.4 0-6.8-.1-10.2-.2-1-1.1-1.7-2-1.7-1.2-.1-2.3 1-2.2 2.3.1 1 .9 1.9 2.1 2h7.2c1.1-.1 2-1 2.1-2 .1-1.2-1-2.3-2.2-2.3-.9 0-1.7.7-2 1.7 0 3.4 0 6.8-.1 10.2" />
      <motion.g animate={{ scale: isDark ? 0.5 : 1, opacity: isDark ? 0 : 1 }} transition={t} style={{ originX: '16px', originY: '16px' }}>
        <path d="M16 6.4V1.3" /><path d="M26.3 15.8h5.1" /><path d="m22.6 9 3.7-3.6" /><path d="M9.4 9 5.7 5.4" /><path d="M5.7 15.8H.6" />
      </motion.g>
    </svg>
  );
}

/** 5 — "Eclipse": a shadow slides across the disc. */
function EclipseGlyph({ isDark, duration }: GlyphProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden className="h-full w-full">
      <clipPath id={`${id}-clip`}>
        <motion.path animate={{ y: isDark ? 5 : 0, x: isDark ? -20 : 0 }} transition={{ ease: 'easeInOut', duration }}
          d="M0-5h55v37h-55zm32 12a1 1 0 0025 0 1 1 0 00-25 0" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}><circle cx="16" cy="16" r="15" /></g>
    </svg>
  );
}

export const TOGGLE_STYLES: Array<{ id: ToggleStyle; label: string; Glyph: (p: GlyphProps) => React.ReactElement; pad: string }> = [
  { id: 'contrast', label: 'Contrast', Glyph: ContrastGlyph, pad: 'p-1' },
  { id: 'sunrise', label: 'Sunrise', Glyph: SunMoonGlyph, pad: 'p-1.5' },
  { id: 'dotted', label: 'Dotted sun', Glyph: DottedSunGlyph, pad: 'p-1.5' },
  { id: 'bulb', label: 'Bulb', Glyph: BulbGlyph, pad: 'p-1.5' },
  { id: 'eclipse', label: 'Eclipse', Glyph: EclipseGlyph, pad: 'p-2' },
];

/** Static/animated preview of a style in a given state (used by the Settings picker). */
export function ToggleGlyph({ style, isDark, className }: { style: ToggleStyle; isDark: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const def = TOGGLE_STYLES.find((s) => s.id === style) ?? TOGGLE_STYLES[1];
  return (
    <span className={cx('inline-flex items-center justify-center rounded-full bg-[var(--toggle-bg)] text-[var(--toggle-fg)]', def.pad, className)}>
      <def.Glyph isDark={isDark} duration={reduce ? 0 : 0.35} />
    </span>
  );
}

/** The live toggle: flips between light and dark (an explicit choice overrides "System"). */
export function ThemeToggle({ className, style }: { className?: string; style?: ToggleStyle }) {
  const { resolved, setMode } = useTheme();
  const [chosen] = useToggleStyle();
  const isDark = resolved === 'dark';
  const next = isDark ? 'light' : 'dark';
  return (
    <button type="button" onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} aria-pressed={isDark} title={`Switch to ${next} mode`}
      className={cx('inline-flex shrink-0 rounded-full transition-transform duration-300 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]', className ?? 'h-9 w-9')}>
      <ToggleGlyph style={style ?? chosen} isDark={isDark} className="h-full w-full" />
    </button>
  );
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'trajectory.theme';

const systemPrefersLight = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;

export function readThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* storage blocked */ }
  return 'system';
}

/** Apply the resolved theme to <html> (data-theme + color-scheme for native form controls). */
export function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? (systemPrefersLight() ? 'light' : 'dark') : mode;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f6f5f1' : '#0b0e18');
  return resolved;
}

interface ThemeCtx { mode: ThemeMode; resolved: 'light' | 'dark'; setMode(m: ThemeMode): void }
const Ctx = createContext<ThemeCtx>({ mode: 'system', resolved: 'dark', setMode: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readThemeMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => applyTheme(readThemeMode()));

  useEffect(() => {
    setResolved(applyTheme(mode));
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const on = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    try { localStorage.setItem(KEY, m); } catch { /* ignore */ }
    setModeState(m);
  }, []);

  return <Ctx.Provider value={{ mode, resolved, setMode }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

// ── Animated toggle style (see components/ThemeToggle.tsx) ──
export type ToggleStyle = 'contrast' | 'sunrise' | 'dotted' | 'bulb' | 'eclipse';
const STYLE_KEY = 'trajectory.toggleStyle';
const STYLES: ToggleStyle[] = ['contrast', 'sunrise', 'dotted', 'bulb', 'eclipse'];
const styleListeners = new Set<(s: ToggleStyle) => void>();

function readToggleStyle(): ToggleStyle {
  try { const v = localStorage.getItem(STYLE_KEY) as ToggleStyle | null; if (v && STYLES.includes(v)) return v; } catch { /* ignore */ }
  return 'sunrise';
}

/** Shared, persisted choice of toggle animation; every toggle on the page updates together. */
export function useToggleStyle(): [ToggleStyle, (s: ToggleStyle) => void] {
  const [style, setStyle] = useState<ToggleStyle>(readToggleStyle);
  useEffect(() => { styleListeners.add(setStyle); return () => { styleListeners.delete(setStyle); }; }, []);
  const update = useCallback((s: ToggleStyle) => {
    try { localStorage.setItem(STYLE_KEY, s); } catch { /* ignore */ }
    styleListeners.forEach((l) => l(s));
  }, []);
  return [style, update];
}

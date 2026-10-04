/**
 * Runtime platform detection + persistent settings shared by web, desktop (Electron) and mobile (Capacitor).
 */

export interface DesktopBridge {
  platform: 'desktop';
  version: string;
  /** Run code locally (offline practice). Same contract as the server executor. */
  runCode(req: unknown): Promise<unknown>;
  /** Encrypted-at-rest secret storage (OS keychain via Electron safeStorage). */
  secureGet(key: string): Promise<string | null>;
  secureSet(key: string, value: string | null): Promise<void>;
}

declare global {
  interface Window {
    trajectoryDesktop?: DesktopBridge;
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }
}

export type PlatformKind = 'web' | 'desktop' | 'mobile';

export function platformKind(): PlatformKind {
  if (typeof window === 'undefined') return 'web';
  if (window.trajectoryDesktop) return 'desktop';
  if (window.Capacitor?.isNativePlatform?.()) return 'mobile';
  return 'web';
}

/** Native shells can't rely on cross-origin cookies, so they keep the refresh token themselves. */
export const isNativeShell = () => platformKind() !== 'web';

const SERVER_KEY = 'trajectory.serverUrl';

function safeLocal(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

export function getServerUrl(): string {
  const stored = safeLocal()?.getItem(SERVER_KEY);
  if (stored) return stored.replace(/\/$/, '');
  const env = import.meta.env.VITE_API_URL as string | undefined;
  if (env) return env.replace(/\/$/, '');
  // Web build served by the API (or the Vite dev proxy) → same origin.
  if (platformKind() === 'web') return '/api';
  // Android emulator reaches the host machine at 10.0.2.2; desktop runs beside a local API.
  if (platformKind() === 'mobile') return 'http://10.0.2.2:3001/api';
  return 'http://localhost:3001/api';
}

export function setServerUrl(url: string | null) {
  const ls = safeLocal();
  if (!ls) return;
  if (url) ls.setItem(SERVER_KEY, url.replace(/\/$/, ''));
  else ls.removeItem(SERVER_KEY);
}

const REFRESH_KEY = 'trajectory.refreshToken';

export async function loadRefreshToken(): Promise<string | null> {
  if (!isNativeShell()) return null;
  if (window.trajectoryDesktop) return window.trajectoryDesktop.secureGet(REFRESH_KEY);
  return safeLocal()?.getItem(REFRESH_KEY) ?? null;
}

export async function saveRefreshToken(token: string | null): Promise<void> {
  if (!isNativeShell()) return;
  if (window.trajectoryDesktop) return window.trajectoryDesktop.secureSet(REFRESH_KEY, token);
  const ls = safeLocal();
  if (!ls) return;
  if (token) ls.setItem(REFRESH_KEY, token); else ls.removeItem(REFRESH_KEY);
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

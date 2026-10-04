/**
 * First-party, consent-gated analytics + UTM attribution.
 * Nothing leaves the browser until the visitor accepts analytics in the cookie banner.
 * The server stores no IP address or user agent for these events.
 */
import { getServerUrl } from './platform';

export type Consent = 'all' | 'essential';
const CONSENT_KEY = 'trajectory.consent';
const ATTR_KEY = 'trajectory.attribution';
const SESSION_KEY = 'trajectory.analyticsSession';

export interface Attribution { source?: string; medium?: string; campaign?: string; referrer?: string }

const ls = () => { try { return window.localStorage; } catch { return null; } };
const ss = () => { try { return window.sessionStorage; } catch { return null; } };

export function getConsent(): Consent | null {
  const v = ls()?.getItem(CONSENT_KEY);
  return v === 'all' || v === 'essential' ? v : null;
}

const listeners = new Set<(c: Consent | null) => void>();
export function onConsentChange(fn: (c: Consent | null) => void) { listeners.add(fn); return () => listeners.delete(fn); }

export function setConsent(c: Consent) {
  ls()?.setItem(CONSENT_KEY, c);
  if (c === 'essential') { queue.length = 0; ls()?.removeItem(ATTR_KEY); }
  listeners.forEach((l) => l(c));
  if (c === 'all') void flush();
}

/** Read utm_* from the real query string (?utm_source=…#/) or from the hash route (#/?utm_source=…). */
export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split('?')[1];
  if (hashQuery) new URLSearchParams(hashQuery).forEach((v, k) => { if (!params.has(k)) params.set(k, v); });
  const attr: Attribution = {
    source: params.get('utm_source')?.slice(0, 100) || undefined,
    medium: params.get('utm_medium')?.slice(0, 100) || undefined,
    campaign: params.get('utm_campaign')?.slice(0, 100) || undefined,
  };
  let ref: string | undefined;
  try { ref = document.referrer ? new URL(document.referrer).hostname : undefined; } catch { ref = undefined; }
  if (ref && ref !== window.location.hostname) attr.referrer = ref.slice(0, 200);
  // First touch wins: keep the attribution that first brought the visitor here.
  if ((attr.source || attr.referrer) && !ls()?.getItem(ATTR_KEY)) ls()?.setItem(ATTR_KEY, JSON.stringify(attr));
}

export function getAttribution(): Attribution | undefined {
  if (getConsent() !== 'all') return undefined;
  try { return JSON.parse(ls()?.getItem(ATTR_KEY) ?? 'null') ?? undefined; } catch { return undefined; }
}

function sessionId(): string {
  let id = ss()?.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
    ss()?.setItem(SESSION_KEY, id);
  }
  return id;
}

interface Ev { name: string; path?: string; utm?: Omit<Attribution, 'referrer'>; referrer?: string; props?: Record<string, string | number | boolean> }
const queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (getConsent() !== 'all' || !queue.length) return;
  const events = queue.splice(0, 20);
  try {
    await fetch(`${getServerUrl()}/telemetry`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ sessionId: sessionId(), events }),
    });
  } catch { /* analytics must never break the app */ }
  if (queue.length) void flush();
}

export function track(name: string, props?: Ev['props']) {
  if (getConsent() !== 'all') return;
  const attr = getAttribution();
  queue.push({
    name, path: (window.location.hash.replace(/^#/, '').split('?')[0] || '/').slice(0, 200), props,
    utm: attr ? { source: attr.source, medium: attr.medium, campaign: attr.campaign } : undefined,
    referrer: attr?.referrer,
  });
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flush(), 1500);
}

export const trackPageView = () => track('page_view');

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flush());
}

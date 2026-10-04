import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (fn: T | ((prev: T | undefined) => T)) => void;
}

/** Load data on mount / when deps change, with reload and optimistic local updates. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setDataState] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError(undefined);
    try {
      const value = await fn();
      if (id === seq.current) setDataState(value);
    } catch (e) {
      if (id === seq.current) setError(e as Error);
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void reload(); }, [reload]);

  const setData = useCallback((v: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) => (typeof v === 'function' ? (v as (p: T | undefined) => T)(prev) : v));
  }, []);

  return { data, error, loading, reload, setData };
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}

export function useInterval(fn: () => void, ms: number | null) {
  const saved = useRef(fn);
  useLayoutEffect(() => { saved.current = fn; });
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

const DEFAULT_DESCRIPTION = 'Trajectory by Naren — sandboxed coding practice, AI mock interviews, resume scoring and a measurable path to your target role.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

/** Per-page <title> and meta description (plus Open Graph / Twitter equivalents for link previews). */
export function useDocumentTitle(title: string, description: string = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    const full = `${title} · Trajectory`;
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', description);
  }, [title, description]);
}

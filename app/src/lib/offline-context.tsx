import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import { defaultKV } from './kv';
import { OfflineStore } from './offline';
import { useOnline } from './hooks';
import { useAuth } from './auth';
import { useToast } from './toast';

interface OfflineContextValue {
  store: OfflineStore;
  online: boolean;
  pendingCount: number;
  bundleSavedAt: string | null;
  bundleCount: number;
  syncing: boolean;
  downloadBundle(): Promise<void>;
  syncNow(): Promise<void>;
  refreshCounts(): Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new OfflineStore(defaultKV()), []);
  const online = useOnline();
  const { status } = useAuth();
  const toast = useToast();
  const [pendingCount, setPending] = useState(0);
  const [bundleSavedAt, setSavedAt] = useState<string | null>(null);
  const [bundleCount, setBundleCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCounts = useCallback(async () => {
    const [p, b] = await Promise.all([store.pending(), store.bundle()]);
    setPending(p.length);
    setSavedAt(b?.savedAt ?? null);
    setBundleCount(b?.questions.length ?? 0);
  }, [store]);

  const downloadBundle = useCallback(async () => {
    const bundle = await api.offlineBundle();
    await store.saveBundle(bundle);
    await refreshCounts();
  }, [store, refreshCounts]);

  const syncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const r = await store.sync(api);
      if (r.synced) toast(`Synced ${r.synced} offline submission${r.synced > 1 ? 's' : ''} — server verdicts applied to your skills.`, 'success');
      if (r.failed) toast(`${r.failed} offline submission(s) could not be synced.`, 'error');
    } catch {
      /* still offline — keep the queue */
    } finally {
      setSyncing(false);
      await refreshCounts();
    }
  }, [store, syncing, toast, refreshCounts]);

  useEffect(() => { void refreshCounts(); }, [refreshCounts]);

  // When signed in and online: flush the queue and keep the offline bundle fresh (daily).
  useEffect(() => {
    if (status !== 'authenticated' || !online) return;
    void (async () => {
      await syncNow();
      const b = await store.bundle();
      if (!b || Date.now() - Date.parse(b.savedAt) > 86400_000) await downloadBundle().catch(() => undefined);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, online]);

  return (
    <OfflineContext.Provider value={{ store, online, pendingCount, bundleSavedAt, bundleCount, syncing, downloadBundle, syncNow, refreshCounts }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used inside <OfflineProvider>');
  return ctx;
}

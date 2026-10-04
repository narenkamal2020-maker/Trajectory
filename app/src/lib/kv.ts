/** Tiny promise-based key/value store on IndexedDB, with an in-memory fallback (private mode, tests). */
export interface KV {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

export function memoryKV(): KV {
  const m = new Map<string, unknown>();
  return {
    async get<T>(k: string) { return m.get(k) as T | undefined; },
    async set(k, v) { m.set(k, structuredClone(v)); },
    async del(k) { m.delete(k); },
  };
}

export function indexedKV(dbName = 'trajectory', store = 'kv'): KV {
  let dbp: Promise<IDBDatabase> | null = null;
  const db = () => {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbp;
  };
  const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
    const d = await db();
    return new Promise<T>((resolve, reject) => {
      const r = fn(d.transaction(store, mode).objectStore(store));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  };
  return {
    get: <T,>(k: string) => tx<T>('readonly', (s) => s.get(k) as IDBRequest<T>),
    set: async (k, v) => { await tx('readwrite', (s) => s.put(v, k)); },
    del: async (k) => { await tx('readwrite', (s) => s.delete(k)); },
  };
}

export function defaultKV(): KV {
  try {
    if (typeof indexedDB !== 'undefined') return indexedKV();
  } catch { /* fall through */ }
  return memoryKV();
}

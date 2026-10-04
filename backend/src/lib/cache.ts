/**
 * Small in-process TTL cache. Per-user keys are prefixed with `u:<userId>:` so every
 * write path can invalidate everything derived for that user in one call.
 */
interface Entry { value: unknown; expires: number }

const store = new Map<string, Entry>();
const MAX_ENTRIES = 5000;

export const cache = {
  get<T>(key: string): T | undefined {
    const e = store.get(key);
    if (!e) return undefined;
    if (e.expires < Date.now()) { store.delete(key); return undefined; }
    return e.value as T;
  },

  set(key: string, value: unknown, ttlMs: number): void {
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
    store.set(key, { value, expires: Date.now() + ttlMs });
  },

  async wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = cache.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await fn();
    cache.set(key, value, ttlMs);
    return value;
  },

  invalidatePrefix(prefix: string): void {
    for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
  },

  invalidateUser(userId: string): void {
    cache.invalidatePrefix(`u:${userId}:`);
  },

  clear(): void {
    store.clear();
  },
};

export const userKey = (userId: string, name: string) => `u:${userId}:${name}`;

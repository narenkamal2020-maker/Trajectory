/**
 * Offline practice: cached question bundle + a queue of submissions made while offline.
 * Offline runs grade against sample tests locally; when connectivity returns, queued submissions
 * are replayed to the server, which re-grades them (including hidden tests) and updates skills.
 */
import type { KV } from './kv';
import type { Language, OfflineQuestion } from './types';

export interface PendingSubmission {
  clientSubmissionId: string;
  questionId: string;
  questionTitle: string;
  language: Language;
  code: string;
  usedHint?: boolean;
  timeTakenSec?: number;
  queuedAt: string;
  localVerdict?: string;
}

export interface SyncApi {
  sync(items: Array<Omit<PendingSubmission, 'questionTitle' | 'queuedAt' | 'localVerdict'>>): Promise<{
    results: Array<{ clientSubmissionId: string; ok: boolean; verdict?: string; duplicate?: boolean; error?: string }>;
  }>;
}

const BUNDLE = 'offline.bundle';
const QUEUE = 'offline.queue';

export function newClientId(): string {
  const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `c-${rnd}`.slice(0, 64);
}

export class OfflineStore {
  private kv: KV;
  constructor(kv: KV) { this.kv = kv; }

  async saveBundle(bundle: { version: string; questions: OfflineQuestion[] }) {
    await this.kv.set(BUNDLE, { ...bundle, savedAt: new Date().toISOString() });
  }

  async bundle(): Promise<{ version: string; savedAt: string; questions: OfflineQuestion[] } | undefined> {
    return this.kv.get(BUNDLE);
  }

  async question(id: string): Promise<OfflineQuestion | undefined> {
    return (await this.bundle())?.questions.find((q) => q.id === id);
  }

  async pending(): Promise<PendingSubmission[]> {
    return (await this.kv.get<PendingSubmission[]>(QUEUE)) ?? [];
  }

  async enqueue(item: Omit<PendingSubmission, 'clientSubmissionId' | 'queuedAt'> & { clientSubmissionId?: string }): Promise<PendingSubmission> {
    const entry: PendingSubmission = { ...item, clientSubmissionId: item.clientSubmissionId ?? newClientId(), queuedAt: new Date().toISOString() };
    const q = await this.pending();
    q.push(entry);
    await this.kv.set(QUEUE, q);
    return entry;
  }

  /** Replay queued submissions. Accepted, duplicate or permanently-rejected items leave the queue; network failures keep them. */
  async sync(api: SyncApi): Promise<{ synced: number; failed: number; results: Array<{ clientSubmissionId: string; verdict?: string; error?: string }> }> {
    const queue = await this.pending();
    if (!queue.length) return { synced: 0, failed: 0, results: [] };
    const batch = queue.slice(0, 50);
    const res = await api.sync(batch.map(({ questionTitle: _t, queuedAt: _q, localVerdict: _v, ...rest }) => rest));
    const done = new Set(res.results.filter((r) => r.ok || !/network|timeout/i.test(r.error ?? '')).map((r) => r.clientSubmissionId));
    const remaining = (await this.pending()).filter((p) => !done.has(p.clientSubmissionId));
    await this.kv.set(QUEUE, remaining);
    return {
      synced: res.results.filter((r) => r.ok).length,
      failed: res.results.filter((r) => !r.ok).length,
      results: res.results.map((r) => ({ clientSubmissionId: r.clientSubmissionId, verdict: r.verdict, error: r.error })),
    };
  }

  async clear() {
    await this.kv.del(BUNDLE);
    await this.kv.del(QUEUE);
  }
}

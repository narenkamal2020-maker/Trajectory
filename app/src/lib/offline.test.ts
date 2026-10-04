import { describe, it, expect, vi } from 'vitest';
import { memoryKV } from './kv';
import { OfflineStore, newClientId } from './offline';
import { valuesMatch } from './local-runner';
import { match } from './router';

describe('OfflineStore', () => {
  it('queues submissions with unique client ids', async () => {
    const s = new OfflineStore(memoryKV());
    const a = await s.enqueue({ questionId: 'q-1', questionTitle: 'A', language: 'javascript', code: 'x' });
    const b = await s.enqueue({ questionId: 'q-2', questionTitle: 'B', language: 'python', code: 'y' });
    expect(a.clientSubmissionId).not.toBe(b.clientSubmissionId);
    expect(await s.pending()).toHaveLength(2);
  });

  it('removes synced and permanently rejected items, keeps network failures', async () => {
    const s = new OfflineStore(memoryKV());
    const ok = await s.enqueue({ questionId: 'q-1', questionTitle: 'A', language: 'javascript', code: 'x' });
    const bad = await s.enqueue({ questionId: 'q-gone', questionTitle: 'B', language: 'javascript', code: 'x' });
    const flaky = await s.enqueue({ questionId: 'q-3', questionTitle: 'C', language: 'javascript', code: 'x' });
    const api = {
      sync: vi.fn().mockResolvedValue({
        results: [
          { clientSubmissionId: ok.clientSubmissionId, ok: true, verdict: 'ACCEPTED' },
          { clientSubmissionId: bad.clientSubmissionId, ok: false, error: 'Question not found' },
          { clientSubmissionId: flaky.clientSubmissionId, ok: false, error: 'network timeout' },
        ],
      }),
    };
    const r = await s.sync(api);
    expect(r.synced).toBe(1);
    expect(api.sync.mock.calls[0][0][0]).not.toHaveProperty('questionTitle');
    expect((await s.pending()).map((p) => p.clientSubmissionId)).toEqual([flaky.clientSubmissionId]);
  });

  it('keeps the whole queue when the server is unreachable', async () => {
    const s = new OfflineStore(memoryKV());
    await s.enqueue({ questionId: 'q-1', questionTitle: 'A', language: 'javascript', code: 'x' });
    await expect(s.sync({ sync: () => Promise.reject(new Error('offline')) })).rejects.toThrow();
    expect(await s.pending()).toHaveLength(1);
  });

  it('stores and looks up the question bundle', async () => {
    const s = new OfflineStore(memoryKV());
    await s.saveBundle({ version: 'v1', questions: [{ id: 'q-9', title: 'Climb' } as never] });
    expect((await s.question('q-9'))?.title).toBe('Climb');
    expect(await s.question('nope')).toBeUndefined();
    await s.clear();
    expect(await s.bundle()).toBeUndefined();
  });

  it('generates ids within the server limit', () => {
    expect(newClientId().length).toBeLessThanOrEqual(64);
    expect(newClientId().length).toBeGreaterThanOrEqual(8);
  });
});

describe('valuesMatch (mirrors backend compare)', () => {
  it('supports all comparison modes', () => {
    expect(valuesMatch([1, 2], [1, 2])).toBe(true);
    expect(valuesMatch([2, 1], [1, 2])).toBe(false);
    expect(valuesMatch([2, 1], [1, 2], 'unordered')).toBe(true);
    expect(valuesMatch([['b', 'a']], [['a', 'b']], 'unorderedNested')).toBe(true);
    expect(valuesMatch(0.1 + 0.2, 0.3, 'float')).toBe(true);
  });
});

describe('router.match', () => {
  it('extracts params and ignores query strings', () => {
    expect(match('/practice/:id', '/practice/q-001?x=1')).toEqual({ id: 'q-001' });
    expect(match('/practice/:id', '/practice')).toBeNull();
    expect(match('/interviews', '/interviews')).toEqual({});
  });
});

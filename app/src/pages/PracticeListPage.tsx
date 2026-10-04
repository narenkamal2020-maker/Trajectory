import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, CircleDot, Search, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { usePath, Link } from '../lib/router';
import { useOffline } from '../lib/offline-context';
import type { QuestionList } from '../lib/types';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner, cx, difficultyTone } from '../components/ui';

export function PracticeListPage() {
  useDocumentTitle('Practice');
  const path = usePath();
  const params = new URLSearchParams(path.split('?')[1] ?? '');
  const [difficulty, setDifficulty] = useState(params.get('difficulty') ?? '');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const skill = params.get('skill') ?? '';
  const { store, online } = useOffline();

  const { data, error, loading, reload } = useAsync<QuestionList & { offline?: boolean }>(async () => {
    try {
      return await api.questions({ difficulty, status, type, skillId: skill || undefined });
    } catch (e) {
      const b = await store.bundle();
      if (!b) throw e;
      const items = b.questions.filter((q) => (!difficulty || q.difficulty === difficulty) && (!type || q.type === type));
      return { items: items.map((q) => ({ ...q, status: 'todo' as const, myAttempts: 0 })), counts: { total: b.questions.length, solved: 0, byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 } }, offline: true };
    }
  }, [difficulty, status, type, skill]);

  const items = useMemo(() => {
    const s = search.toLowerCase();
    return (data?.items ?? []).filter((q) => !s || q.title.toLowerCase().includes(s) || q.tags.some((t) => t.includes(s)));
  }, [data, search]);

  const chip = (active: boolean) => cx('px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer', active ? 'bg-[var(--color-primary)] text-black border-transparent font-bold' : 'border-white/10 text-[var(--color-text-secondary)] hover:text-white');

  return (
    <div>
      <PageHeader eyebrow="Practice terminal" title="Problems"
        subtitle={data ? `${data.counts.solved} of ${data.counts.total} solved. Every submission runs in a sandbox and updates the skills it exercises.` : undefined} />

      {(data?.offline || !online) && (
        <div className="mb-4 flex items-center gap-2 text-xs text-[var(--color-secondary)] bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 rounded-lg px-3 py-2">
          <WifiOff className="w-4 h-4" /> Offline — showing your downloaded question bank. Submissions will sync when you reconnect.
        </div>
      )}

      <Card className="mb-4 p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
            {['', 'EASY', 'MEDIUM', 'HARD'].map((d) => <button key={d} type="button" aria-pressed={difficulty === d} className={chip(difficulty === d)} onClick={() => setDifficulty(d)}>{d || 'All'}</button>)}
            <span className="w-px bg-white/10 mx-1" aria-hidden />
            {[['', 'Any status'], ['todo', 'To do'], ['attempted', 'Attempted'], ['solved', 'Solved']].map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} className={chip(status === v)} onClick={() => setStatus(v)}>{l}</button>)}
            <span className="w-px bg-white/10 mx-1" aria-hidden />
            {[['', 'All types'], ['CODE', 'Code'], ['SQL', 'SQL']].map(([v, l]) => <button key={v} type="button" aria-pressed={type === v} className={chip(type === v)} onClick={() => setType(v)}>{l}</button>)}
          </div>
          <label className="relative block lg:w-64">
            <span className="sr-only">Search problems</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or tag…" className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 pl-9 pr-3 py-2 text-sm text-white" />
          </label>
        </div>
        {skill && <p className="text-xs text-[var(--color-text-secondary)] mt-3">Filtered to skill <code className="text-[var(--color-primary)]">{skill}</code> · <Link to="/practice" className="text-[var(--color-primary)] hover:underline">clear</Link></p>}
      </Card>

      {loading && !data ? <Spinner /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : items.length === 0 ? (
        <Card><EmptyState title="No problems match" body="Try clearing a filter." /></Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-white/5">
            {items.map((q) => (
              <li key={q.id}>
                <Link to={`/practice/${q.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] group">
                  {q.status === 'solved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Solved" />
                    : q.status === 'attempted' ? <CircleDot className="w-4 h-4 text-[var(--color-secondary)] shrink-0" aria-label="Attempted" />
                      : <Circle className="w-4 h-4 text-white/20 shrink-0" aria-label="Not attempted" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white group-hover:text-[var(--color-primary)] truncate">{q.title}</div>
                    <div className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">{q.categoryName} · {q.tags.slice(0, 3).join(', ')}</div>
                  </div>
                  {q.type === 'SQL' && <Badge tone="blue">SQL</Badge>}
                  <span className="hidden sm:block font-mono text-[11px] text-[var(--color-text-muted)] w-20 text-right">{q.solveRate === null ? '—' : `${Math.round(q.solveRate)}% solve`}</span>
                  <Badge tone={difficultyTone(q.difficulty)} className="w-16 justify-center">{q.difficulty}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

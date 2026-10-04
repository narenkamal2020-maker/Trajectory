import { useMemo, useState } from 'react';
import { Code2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { navigate } from '../lib/router';
import { Constellation } from '../components/charts';
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, ProgressBar, Spinner, timeAgo } from '../components/ui';

const statusTone = { verified: 'green', exceeds: 'gold', delta: 'orange', locked: 'muted', practiced: 'muted' } as const;
const statusLabel = { verified: 'at target', exceeds: 'exceeds', delta: 'below target', locked: 'not started', practiced: 'not required for role' };

export function SkillsPage() {
  useDocumentTitle('Skills');
  const { data, error, loading, reload } = useAsync(() => api.constellation(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');

  const nodes = data?.nodes ?? [];
  const sel = nodes.find((n) => n.id === selected) ?? nodes.find((n) => n.status === 'delta') ?? nodes[0];
  const byCategory = useMemo(() => {
    const m = new Map<string, typeof nodes>();
    nodes.forEach((n) => m.set(n.categoryName, [...(m.get(n.categoryName) ?? []), n]));
    return [...m.entries()].sort();
  }, [nodes]);

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader eyebrow="Skill constellation" title="Skills"
        subtitle={data?.targetRole ? `Your skills against ${data.targetRole} requirements. Proficiency is a 0–100 Elo-style estimate updated by every submission and interview.` : 'Set a target role to see requirements.'}
        actions={<div className="flex rounded-lg border border-white/10 overflow-hidden">{(['map', 'list'] as const).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-mono cursor-pointer ${view === v ? 'bg-[var(--color-primary)] text-black font-bold' : 'text-[var(--color-text-secondary)]'}`}>{v === 'map' ? 'Constellation' : 'List'}</button>)}</div>} />

      {!nodes.length ? (
        <Card><EmptyState icon={<Sparkles className="w-5 h-5" />} title="No skills yet" body="Solve a problem or upload a resume to light up your constellation." action={<Button variant="primary" onClick={() => navigate('/practice')}>Start practicing</Button>} /></Card>
      ) : view === 'map' ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <Constellation caption="Skill proficiency by skill" selected={sel?.id ?? null} onSelect={setSelected}
              points={nodes.map((n) => ({ id: n.id, label: n.name, group: n.categoryName, value: n.currentLevel, target: n.targetLevel, status: n.status }))} />
          </Card>
          {sel && (
            <Card accent>
              <CardHeader title={sel.name} eyebrow={sel.categoryName} action={<Badge tone={statusTone[sel.status]}>{statusLabel[sel.status]}</Badge>} />
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-[var(--color-text-secondary)]">Proficiency</span><span className="font-mono text-white">{sel.currentLevel}{sel.targetLevel !== null ? ` / ${sel.targetLevel}` : ''}</span></div>
                  <ProgressBar value={sel.currentLevel} marker={sel.targetLevel ?? undefined} label="Proficiency" />
                </div>
                <dl className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div><dt className="text-[var(--color-text-muted)]">Attempts</dt><dd className="text-white">{sel.attempts}</dd></div>
                  <div><dt className="text-[var(--color-text-muted)]">Correct</dt><dd className="text-white">{sel.correct}</dd></div>
                  <div><dt className="text-[var(--color-text-muted)]">Importance</dt><dd className="text-white">{sel.importance ?? '—'}</dd></div>
                  <div><dt className="text-[var(--color-text-muted)]">Last practiced</dt><dd className="text-white">{timeAgo(sel.lastPracticed)}</dd></div>
                </dl>
                <Button variant="primary" className="w-full" onClick={() => navigate(`/practice?skill=${sel.id}`)}><Code2 className="w-4 h-4" /> Practice this skill</Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {byCategory.map(([cat, list]) => (
            <Card key={cat}>
              <CardHeader title={cat} />
              <ul className="space-y-3">
                {list.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => navigate(`/practice?skill=${n.id}`)} className="w-full text-left cursor-pointer group">
                      <div className="flex justify-between text-xs mb-1"><span className="text-white group-hover:text-[var(--color-primary)]">{n.name}</span><span className="font-mono text-[var(--color-text-secondary)]">{n.currentLevel}{n.targetLevel !== null ? `/${n.targetLevel}` : ''}</span></div>
                      <ProgressBar value={n.currentLevel} marker={n.targetLevel ?? undefined} label={n.name} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

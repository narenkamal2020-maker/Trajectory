import { CheckCircle2, Circle, Rocket, Compass, Brain } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { navigate } from '../lib/router';
import { LineChart } from '../components/charts';
import { Badge, Button, Card, CardHeader, ErrorState, PageHeader, ProgressBar, Ring, Spinner, Stat, cx } from '../components/ui';

export function CareerPage() {
  useDocumentTitle('Career trajectory');
  const { data, error, loading, reload } = useAsync(() => api.career(), []);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const d = data!;

  if (!d.targetRole) {
    return (
      <Card className="text-center py-12">
        <Compass className="w-8 h-8 mx-auto text-[var(--color-primary)] mb-3" />
        <h1 className="font-headline text-xl font-bold text-white">Choose a target role</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-4">Your flight path is computed against the skills that role requires.</p>
        <Button variant="primary" onClick={() => navigate('/settings')}>Set target role</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Career flight path" title={`${d.currentRole ?? 'Today'} → ${d.targetRole.title}`}
        subtitle="Readiness is the importance-weighted share of each required skill you have reached. The ETA extrapolates your last 30 days of progress." />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-5"><Ring value={d.readiness} size={110} sublabel="ready" /><div><Stat label="Waypoints cleared" value={`${d.clearedWaypoints}/${d.totalWaypoints}`} /></div></Card>
        <Card><Stat label="Estimated time to ready" tone="gold" value={d.etaDays === null ? '—' : d.etaDays === 0 ? 'Ready' : `${d.etaDays} days`}
          sub={d.velocityPerDay === null ? 'Practice on a few different days to unlock an estimate.' : `Closing ${d.velocityPerDay} skill-points of gap per day`} /></Card>
        <Card><Stat label="Remaining gap" value={d.remainingGap} sub="importance-weighted proficiency points" /></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Waypoints" eyebrow={`${d.targetRole.title} · ${d.targetRole.level ?? ''}`} icon={<Rocket className="w-4 h-4 text-[var(--color-primary)]" />} />
          <ol className="relative border-l border-white/10 ml-2 space-y-4">
            {d.waypoints.map((w) => (
              <li key={w.skillId} className="pl-5 relative">
                <span className={cx('absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2', w.cleared ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-[var(--color-bg-base)] border-white/30')} aria-hidden />
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate(`/practice?skill=${w.skillId}`)} className="text-sm text-white hover:text-[var(--color-primary)] cursor-pointer">{w.skillName}</button>
                    {w.cleared ? <Badge tone="green">cleared</Badge> : <Badge tone="muted">gap {Math.round(w.gap)}</Badge>}
                  </div>
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{w.categoryName} · weight {w.importance}</span>
                </div>
                <ProgressBar value={w.current} marker={w.required} tone={w.cleared ? 'green' : 'gold'} label={`${w.skillName}: ${w.current} of ${w.required}`} />
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Milestones" />
            <ul className="space-y-2.5">
              {d.milestones.map((m) => (
                <li key={m.id} className="flex gap-2 text-sm">
                  {m.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-0.5" />}
                  <div><div className={m.done ? 'text-white' : 'text-[var(--color-text-secondary)]'}>{m.label}</div><div className="font-mono text-[11px] text-[var(--color-text-muted)]">{m.detail}</div></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Adjacent roles" eyebrow="readiness with your current skills" />
            <ul className="space-y-3">
              {d.adjacentRoles.map((r) => (
                <li key={r.roleId}>
                  <div className="flex justify-between text-xs mb-1"><span className={r.roleId === d.targetRole!.id ? 'text-[var(--color-primary)] font-bold' : 'text-white'}>{r.title}</span><span className="font-mono text-[var(--color-text-secondary)]">{Math.round(r.readiness)}%</span></div>
                  <ProgressBar value={r.readiness} label={r.title} />
                </li>
              ))}
            </ul>
          </Card>
          {d.roleFit && (
            <Card>
              <CardHeader title="Resume role fit" eyebrow="ML model" icon={<Brain className="w-4 h-4 text-[var(--color-primary)]" />} />
              <ul className="space-y-2 text-sm">{d.roleFit.map((r) => <li key={r.role} className="flex justify-between"><span className="text-white">{r.role}</span><span className="font-mono text-[var(--color-text-secondary)]">{Math.round(r.probability * 100)}%</span></li>)}</ul>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader title="Gap to target over time" eyebrow="lower is better" />
        <LineChart caption="Remaining importance-weighted skill gap by day" labels={d.history.map((h) => h.date)}
          series={[{ key: 'gap', label: 'Remaining gap', color: 'var(--chart-accent, #ffd371)', values: d.history.map((h) => h.remainingGap) }]} />
      </Card>
    </div>
  );
}

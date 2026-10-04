import { Code2, Mic, FileText, Rocket, Sparkles, X, Flame, Target, Timer, Trophy, CheckCircle2, Circle, ArrowRight, BookOpen } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { navigate, Link } from '../lib/router';
import type { Recommendation } from '../lib/types';
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, ProgressBar, Ring, Spinner, Stat, timeAgo, verdictTone } from '../components/ui';

const recIcon = { QUESTION: Code2, TOPIC: BookOpen, INTERVIEW: Mic, RESOURCE: BookOpen, RESUME: FileText, CAREER: Rocket };

function recTarget(r: Recommendation): string {
  switch (r.type) {
    case 'QUESTION': return `/practice/${r.entityId}`;
    case 'INTERVIEW': return `/interviews?start=${r.entityId ?? 'BEHAVIORAL'}`;
    case 'RESUME': return '/resume';
    case 'CAREER': return r.title.startsWith('Choose') ? '/settings' : '/applications';
    case 'TOPIC': return `/practice?skill=${r.entityId ?? ''}`;
    default: return '/dashboard';
  }
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { data, error, loading, reload, setData } = useAsync(() => api.dashboard(), []);

  if (loading && !data) return <Spinner label="Computing your trajectory…" />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return null;

  const dismiss = async (id: string) => {
    setData((d) => ({ ...d!, recommendations: d!.recommendations.filter((r) => r.id !== id) }));
    await api.dismissRecommendation(id).catch(() => undefined);
  };
  const first = data.user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-gold-border)] bg-gradient-to-r from-[var(--color-surface-container-low)] via-[var(--color-surface-container)] to-[var(--color-bg-base)] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--color-primary)] mb-2">Mission control</div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white">Welcome back, {first}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {data.targetRole === 'Choose a target role'
              ? 'Pick a target role to unlock your readiness score and flight path.'
              : <>You are <strong className="text-white">{data.readinessPercentage}%</strong> ready for <strong className="text-white">{data.targetRole}</strong>.
                {' '}{data.trajectoryVelocityDays !== null ? <>At your current pace you will clear every waypoint in about <strong className="text-[var(--color-primary)]">{data.trajectoryVelocityDays} days</strong>.</> : 'Keep practicing for a few days to unlock an ETA.'}</>}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="primary" onClick={() => navigate(data.recommendations[0] ? recTarget(data.recommendations[0]) : '/practice')}><Sparkles className="w-4 h-4" /> Do the next best thing</Button>
            <Button onClick={() => navigate('/interviews')}><Mic className="w-4 h-4" /> Mock interview</Button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Ring value={data.readinessPercentage} size={132} sublabel="readiness" />
          <div className="space-y-3">
            <Stat label="Waypoints" value={`${data.clearedWaypointsCount}/${data.totalWaypointsCount}`} sub="role skills at target" />
            <Stat label="ETA" value={data.trajectoryVelocityDays === null ? '—' : `${data.trajectoryVelocityDays}d`} sub={data.trajectoryVelocityDays === null ? 'needs more history' : 'at current velocity'} tone="gold" />
          </div>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="flex items-start justify-between"><Stat label="Problems solved" value={data.solvedProblemsCount} sub={`${data.accuracy}% accuracy · top ${data.topPercentile}%`} /><Trophy className="w-5 h-5 text-[var(--color-primary)]" /></div></Card>
        <Card><div className="flex items-start justify-between"><Stat label="Streak" value={`${data.streakDays} day${data.streakDays === 1 ? '' : 's'}`} sub={data.streakDays ? 'keep it alive today' : 'solve one to start'} /><Flame className="w-5 h-5 text-[var(--color-secondary)]" /></div></Card>
        <Card><div className="flex items-start justify-between"><Stat label="Mock interview avg" value={data.interviewsCompleted ? data.mockScore : '—'} sub={`${data.interviewsCompleted} completed${data.bestInterviewScore ? ` · best ${data.bestInterviewScore}` : ''}`} /><Mic className="w-5 h-5 text-[var(--color-primary)]" /></div></Card>
        <Card><div className="flex items-start justify-between"><Stat label="Avg solve time" value={data.codeVelocityMinutes === null ? '—' : `${data.codeVelocityMinutes}m`} sub={data.atsScore !== null ? `Resume ATS ${data.atsScore}` : 'no resume analyzed'} /><Timer className="w-5 h-5 text-[var(--color-secondary)]" /></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan */}
        <Card className="lg:col-span-2">
          <CardHeader title="Your plan" eyebrow={`Recommendation engine: ${data.recommendationEngine}`} icon={<Sparkles className="w-4 h-4 text-[var(--color-primary)]" />} />
          {data.recommendations.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="w-5 h-5" />} title="You're all caught up" body="New recommendations appear as your skills and goals change." />
          ) : (
            <ul className="space-y-3">
              {data.recommendations.map((r) => {
                const I = recIcon[r.type] ?? Sparkles;
                return (
                  <li key={r.id} className="group flex items-start gap-3 p-4 rounded-xl bg-[var(--color-surface-container-low)] border border-white/5 hover:border-[var(--color-primary)]/40 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0"><I className="w-4 h-4" /></div>
                    <Link to={recTarget(r)} onClick={() => void api.clickRecommendation(r.id)} className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[var(--color-primary)]">{r.title}</span>
                        {r.source === 'ml' && <Badge tone="blue">ML</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">{r.reason}</p>
                    </Link>
                    <button type="button" aria-label={`Dismiss: ${r.title}`} onClick={() => dismiss(r.id)} className="p-1 rounded opacity-40 hover:opacity-100 hover:bg-white/10 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card accent>
            <CardHeader title="Next waypoints" eyebrow={data.targetRole} icon={<Target className="w-4 h-4 text-[var(--color-primary)]" />}
              action={<Link to="/career" className="text-xs font-mono text-[var(--color-primary)] hover:underline flex items-center gap-1">Flight path <ArrowRight className="w-3 h-3" /></Link>} />
            {data.nextWaypoints.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">{data.totalWaypointsCount ? 'Every role skill is at target. 🎉' : 'Set a target role to see waypoints.'}</p>
            ) : (
              <ul className="space-y-3">
                {data.nextWaypoints.map((w) => (
                  <li key={w.skillId}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-white">{w.skillName}</span><span className="font-mono text-[var(--color-text-secondary)]">{Math.round(w.current)}/{w.required}</span></div>
                    <ProgressBar value={w.current} marker={w.required} label={`${w.skillName} proficiency`} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Milestones" icon={<Rocket className="w-4 h-4 text-[var(--color-primary)]" />} />
            <ul className="space-y-2">
              {data.milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-2 text-sm">
                  {m.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />}
                  <div><div className={m.done ? 'text-white' : 'text-[var(--color-text-secondary)]'}>{m.label}</div><div className="text-[11px] font-mono text-[var(--color-text-muted)]">{m.detail}</div></div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Recent activity" />
        {data.recentActivity.length === 0 ? (
          <EmptyState title="No activity yet" body="Solve a problem or start a mock interview — it will show up here." action={<Button variant="primary" onClick={() => navigate('/practice')}>Open practice</Button>} />
        ) : (
          <ul className="divide-y divide-white/5">
            {data.recentActivity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  {a.kind === 'SUBMISSION' ? <Code2 className="w-4 h-4 text-[var(--color-text-muted)]" /> : a.kind === 'INTERVIEW' ? <Mic className="w-4 h-4 text-[var(--color-text-muted)]" /> : <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />}
                  <span className="text-white truncate">{a.kind === 'INTERVIEW' ? `${a.title.replace('_', ' ').toLowerCase()} interview` : a.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {a.kind === 'SUBMISSION' ? <Badge tone={verdictTone(a.detail)}>{a.detail}</Badge> : a.kind === 'INTERVIEW' ? <Badge>{a.detail}/100</Badge> : <Badge tone="muted">{a.detail}</Badge>}
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)] w-16 text-right">{timeAgo(a.at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

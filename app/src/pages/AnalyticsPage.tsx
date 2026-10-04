import { useState } from 'react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { ActivityHeatmap, BarList, LineChart, SERIES } from '../components/charts';
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, Stat, cx } from '../components/ui';

export function AnalyticsPage() {
  useDocumentTitle('Analytics');
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useAsync(() => api.analytics(days), [days]);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const a = data!;
  const t = a.totals;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Progress & analytics" title="Analytics"
        actions={<div className="flex rounded-lg border border-white/10 overflow-hidden" role="group" aria-label="Time range">{[7, 30, 90].map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={cx('px-3 py-1.5 text-xs font-mono cursor-pointer', days === d ? 'bg-[var(--color-primary)] text-black font-bold' : 'text-[var(--color-text-secondary)]')}>{d}d</button>)}</div>} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><Stat label="Solved" value={t.solved} /></Card>
        <Card><Stat label="Submissions" value={t.submissions} sub={`${t.accepted} accepted`} /></Card>
        <Card><Stat label="Accuracy" value={`${t.accuracy}%`} /></Card>
        <Card><Stat label="Streak" value={`${t.streakDays}d`} sub={`longest ${t.longestStreak}d`} /></Card>
        <Card><Stat label="Avg solve time" value={t.avgSolveSeconds === null ? '—' : `${Math.round(t.avgSolveSeconds / 60)}m`} /></Card>
      </div>

      <Card>
        <CardHeader title="Activity" eyebrow="last 90 days" />
        <ActivityHeatmap days={a.heatmap} caption="Submissions per day, last 90 days" />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Role readiness" eyebrow="% · daily snapshot" />
          <LineChart caption="Role readiness percentage by day" yMax={100} labels={a.timeline.map((x) => x.date)}
            series={[{ key: 'r', label: 'Readiness', color: 'var(--chart-accent, #ffd371)', values: a.timeline.map((x) => x.readiness) }]} />
        </Card>
        <Card>
          <CardHeader title="Problems solved" eyebrow="cumulative" />
          <LineChart caption="Cumulative problems solved by day" labels={a.timeline.map((x) => x.date)}
            series={[{ key: 's', label: 'Solved', color: 'var(--chart-accent, #ffd371)', values: a.timeline.map((x) => x.solved) }]} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="By difficulty" eyebrow="solved of available" />
          <BarList caption="Problems solved by difficulty" rows={a.byDifficulty.map((d) => ({ label: d.difficulty.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), value: d.solved, max: d.available, note: `${d.attempted} attempted` }))} />
        </Card>
        <Card>
          <CardHeader title="Proficiency by area" eyebrow="average of practiced skills, 0–100" />
          {a.byCategory.length ? <BarList caption="Average proficiency by category" max={100} rows={a.byCategory.map((c) => ({ label: c.name, value: c.avgProficiency, note: `${c.skills} skills` }))} />
            : <EmptyState title="No skills practiced yet" />}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Interview scores" eyebrow="per completed interview, 0–100" />
          {a.interviews.length ? (
            <LineChart caption="Interview sub-scores over time" yMax={100} labels={a.interviews.map((i) => i.completedAt.slice(0, 10))}
              series={[
                { key: 't', label: 'Technical', color: SERIES[0], values: a.interviews.map((i) => Math.round(i.technical)) },
                { key: 'p', label: 'Problem solving', color: SERIES[1], values: a.interviews.map((i) => Math.round(i.problemSolving)) },
                { key: 'c', label: 'Communication', color: SERIES[2], values: a.interviews.map((i) => Math.round(i.communication)) },
              ]} />
          ) : <EmptyState title="No completed interviews" body="Scores appear after your first mock interview." />}
        </Card>
        <Card>
          <CardHeader title="Application funnel" eyebrow={`${a.pipeline.totalApplications} applications`} />
          {a.pipeline.totalApplications ? <BarList caption="Applications reaching each stage" rows={a.pipeline.funnel.map((f) => ({ label: f.stage, value: f.count, note: `${f.rate}%` }))} />
            : <EmptyState title="No applications tracked" />}
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ShieldAlert, Inbox, BarChart3, Mail } from 'lucide-react';
import { api } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../lib/toast';
import { Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, Stat, cx, timeAgo } from '../../components/ui';
import { BarList, LineChart } from '../../components/charts';
import { CopyButton } from '../../components/extras';
import { AdminNav } from './AdminNav';

type Tab = 'audit' | 'inbox' | 'analytics';
const sevTone = { INFO: 'muted', WARN: 'orange', ALERT: 'red' } as const;

function AuditTab() {
  const [severity, setSeverity] = useState('');
  const { data, error, loading, reload } = useAsync(() => api.admin.audit({ severity }), [severity]);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const d = data!;
  const chip = (on: boolean) => cx('px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer', on ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-transparent font-bold' : 'border-white/10 text-[var(--color-text-secondary)]');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><Stat label="Alerts (24h)" value={d.last24h.ALERT} /></Card>
        <Card><Stat label="Warnings (24h)" value={d.last24h.WARN} /></Card>
        <Card><Stat label="Events (24h)" value={d.last24h.INFO + d.last24h.WARN + d.last24h.ALERT} /></Card>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-2" role="group" aria-label="Severity">
          {['', 'ALERT', 'WARN', 'INFO'].map((s) => <button key={s} type="button" aria-pressed={severity === s} className={chip(severity === s)} onClick={() => setSeverity(s)}>{s || 'All'}</button>)}
        </div>
        {!d.items.length ? <EmptyState title="No audit events" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[11px] uppercase text-[var(--color-text-muted)] border-b border-white/10">
                <tr><th scope="col" className="px-4 py-2">When</th><th scope="col" className="px-4 py-2">Event</th><th scope="col" className="px-4 py-2">Actor</th><th scope="col" className="px-4 py-2">Target</th><th scope="col" className="px-4 py-2">IP</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {d.items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap" title={a.createdAt}>{timeAgo(a.createdAt)}</td>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Badge tone={sevTone[a.severity]}>{a.severity}</Badge><span className="font-mono text-xs text-white">{a.action}</span></div>
                      {a.details != null && <div className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono truncate max-w-md">{JSON.stringify(a.details)}</div>}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{a.actorEmail ?? (a.actorId ? a.actorId.slice(0, 8) : '—')}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{a.targetType ? `${a.targetType}: ${a.targetId ?? ''}` : '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">{a.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function InboxTab() {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useAsync(() => api.admin.messages(), []);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const set = async (id: string, status: 'NEW' | 'READ' | 'CLOSED') => {
    setData((d) => (d ?? []).map((m) => (m.id === id ? { ...m, status } : m)));
    await api.admin.setMessageStatus(id, status).catch(() => { toast('Update failed', 'error'); void reload(); });
  };
  if (!data?.length) return <Card><EmptyState icon={<Inbox className="w-5 h-5" />} title="No messages yet" body="Messages from the contact page appear here." /></Card>;
  return (
    <ul className="space-y-3">
      {data.map((m) => (
        <li key={m.id}>
          <Card className={cx(m.status === 'CLOSED' && 'opacity-60')}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2"><span className="font-bold text-white">{m.name}</span><Badge tone={m.topic === 'privacy' ? 'red' : 'muted'}>{m.topic}</Badge><Badge tone={m.status === 'NEW' ? 'gold' : 'muted'}>{m.status.toLowerCase()}</Badge></div>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-secondary)]">
                  <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 underline"><Mail className="w-3.5 h-3.5" />{m.email}</a>
                  <CopyButton text={m.email} label="Copy" /> · {timeAgo(m.createdAt)}
                </div>
              </div>
              <div className="flex gap-1">
                {m.status !== 'READ' && <button type="button" onClick={() => set(m.id, 'READ')} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/5 cursor-pointer">Mark read</button>}
                {m.status !== 'CLOSED' && <button type="button" onClick={() => set(m.id, 'CLOSED')} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/5 cursor-pointer">Close</button>}
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{m.message}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useAsync(() => api.admin.siteAnalytics(days), [days]);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const a = data!;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-[var(--color-text-muted)]">Only visitors who accepted analytics are counted. No IP addresses are stored.</p>
        <select aria-label="Time range" value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-2 py-1 text-xs">
          {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><Stat label="Page views" value={a.totals.pageViews} /></Card>
        <Card><Stat label="Sessions" value={a.totals.sessions} /></Card>
        <Card><Stat label="Events" value={a.totals.events} /></Card>
        <Card><Stat label="Sign-ups" value={a.totals.signups} /></Card>
      </div>
      <Card>
        <CardHeader title="Traffic" />
        <LineChart caption="Daily page views" labels={a.daily.map((d) => d.date)} series={[{ key: 'v', label: 'Page views', color: 'var(--chart-accent, #ffd371)', values: a.daily.map((d) => d.views) }]} />
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card><CardHeader title="Top pages" />{a.topPages.length ? <BarList caption="Views by page" rows={a.topPages.map((p) => ({ label: p.path, value: p.views }))} /> : <EmptyState title="No data yet" />}</Card>
        <Card><CardHeader title="Sign-ups by source" eyebrow="utm_source / referrer" />{a.signupsBySource.length ? <BarList caption="Sign-ups by source" rows={a.signupsBySource.map((p) => ({ label: p.source, value: p.count }))} /> : <EmptyState title="No sign-ups in range" />}</Card>
      </div>
      <Card>
        <CardHeader title="Campaigns (UTM)" />
        {a.sources.length ? (
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-[11px] uppercase text-[var(--color-text-muted)]"><tr><th scope="col" className="py-1.5">Source</th><th scope="col">Medium</th><th scope="col">Campaign</th><th scope="col" className="text-right">Sessions</th></tr></thead>
            <tbody className="divide-y divide-white/5">{a.sources.map((s, i) => <tr key={i}><td className="py-2 text-white">{s.source}</td><td>{s.medium}</td><td>{s.campaign}</td><td className="text-right font-mono">{s.sessions}</td></tr>)}</tbody>
          </table>
        ) : <EmptyState title="No campaign traffic yet" body="Share links like …/?utm_source=linkedin&utm_campaign=launch to attribute visits." />}
      </Card>
    </div>
  );
}

export function AdminSecurityPage() {
  useDocumentTitle('Admin · Security & insights');
  const [tab, setTab] = useState<Tab>('audit');
  const tabs: Array<{ id: Tab; label: string; icon: typeof ShieldAlert }> = [
    { id: 'audit', label: 'Audit log', icon: ShieldAlert }, { id: 'inbox', label: 'Inbox', icon: Inbox }, { id: 'analytics', label: 'Site analytics', icon: BarChart3 },
  ];
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Security & insights" subtitle="Security events, contact messages and consent-based site analytics." />
      <AdminNav />
      <div role="tablist" className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
            className={cx('inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer', tab === t.id ? 'bg-white/10 text-white font-bold' : 'text-[var(--color-text-secondary)] hover:text-white')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'audit' ? <AuditTab /> : tab === 'inbox' ? <InboxTab /> : <AnalyticsTab />}
    </div>
  );
}

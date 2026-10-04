import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { Badge, Card, CardHeader, ErrorState, ProgressBar, Spinner, timeAgo, verdictTone } from '../../components/ui';
import { AdminNav } from './AdminNav';

export function AdminUserPage({ id }: { id: string }) {
  const { data: u, error, loading, reload } = useAsync(() => api.admin.user(id), [id]);
  useDocumentTitle(u ? `Admin · ${u.name}` : 'Admin · User');
  if (loading && !u) return <Spinner />;
  if (error && !u) return <ErrorState error={error} onRetry={reload} />;
  const d = u!;

  return (
    <div>
      <AdminNav />
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="p-2 rounded-lg hover:bg-white/5 text-[var(--color-text-secondary)]" aria-label="Back to users"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-white flex items-center gap-2">{d.name}
            {d.role === 'ADMIN' && <Badge><ShieldCheck className="w-3 h-3" />admin</Badge>}
            {!d.active && <Badge tone="red">deactivated</Badge>}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{d.email} · joined {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Profile" />
          <dl className="space-y-2 text-sm">
            {[['Target role', d.profile.targetRole], ['Experience', d.profile.experienceLevel], ['Industry', d.profile.targetIndustry], ['GitHub', d.profile.githubUrl], ['LinkedIn', d.profile.linkedinUrl]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-3"><dt className="text-[var(--color-text-muted)]">{k}</dt><dd className="text-white truncate">{v ?? '—'}</dd></div>
            ))}
          </dl>
          {d.resume && <p className="mt-4 text-xs text-[var(--color-text-secondary)]">Resume: {d.resume.fileName} · ATS {d.resume.atsScore ?? '—'} · {d.resume.status.toLowerCase()}</p>}
        </Card>

        <Card>
          <CardHeader title="Top skills" />
          {d.skills.length ? (
            <ul className="space-y-2.5">
              {d.skills.map((s) => (
                <li key={s.name}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-white">{s.name}</span><span className="font-mono text-[var(--color-text-secondary)]">{Math.round(s.proficiency)}</span></div>
                  <ProgressBar value={s.proficiency} label={s.name} />
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-[var(--color-text-muted)]">No skills tracked yet.</p>}
        </Card>

        <Card>
          <CardHeader title="Mock interviews" />
          {d.interviews.length ? (
            <ul className="divide-y divide-white/5 text-sm">
              {d.interviews.map((i, n) => (
                <li key={n} className="flex justify-between py-2"><span className="text-white">{i.type.replace('_', ' ').toLowerCase()}</span>
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">{i.overall !== null ? `${Math.round(i.overall)}/100` : i.status.toLowerCase()} · {timeAgo(i.at)}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-[var(--color-text-muted)]">No interviews yet.</p>}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent submissions" />
        {d.recentSubmissions.length ? (
          <ul className="divide-y divide-white/5 text-sm">
            {d.recentSubmissions.map((s, n) => (
              <li key={n} className="flex items-center justify-between py-2.5">
                <span className="text-white">{s.title}</span>
                <span className="flex items-center gap-3"><Badge tone={verdictTone(s.status)}>{s.status}</Badge><span className="font-mono text-xs text-[var(--color-text-muted)] w-24 text-right">{s.language} · {timeAgo(s.at)}</span></span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[var(--color-text-muted)]">No submissions yet.</p>}
      </Card>
    </div>
  );
}

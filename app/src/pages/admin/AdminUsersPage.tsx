import { useState } from 'react';
import { useConfirm } from '../../components/extras';
import { Search, ShieldCheck, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { useToast } from '../../lib/toast';
import type { AdminUserRow } from '../../lib/types';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Spinner, Stat, cx, timeAgo } from '../../components/ui';
import { AdminNav } from './AdminNav';

export function AdminUsersPage() {
  useDocumentTitle('Admin · Users');
  const toast = useToast();
  const askConfirm = useConfirm();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const stats = useAsync(() => api.admin.stats(), []);
  const users = useAsync(() => api.admin.users({ search: query, role, status, page }), [query, role, status, page]);

  const update = async (u: AdminUserRow, patch: { role?: 'USER' | 'ADMIN'; active?: boolean }, verb: string) => {
    if (!(await askConfirm({ title: `${verb} ${u.name}?`, body: u.email, confirmLabel: verb.replace(/:$/, ''), danger: patch.active === false || patch.role === 'USER' }))) return;
    try {
      await api.admin.updateUser(u.id, patch);
      users.setData((d) => ({ ...d!, items: d!.items.map((x) => (x.id === u.id ? { ...x, ...(patch.role ? { role: patch.role } : {}), ...(patch.active !== undefined ? { active: patch.active } : {}) } : x)) }));
      toast(`${u.name}: ${verb.toLowerCase()}d.`, 'success');
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Update failed', 'error'); }
  };

  const chip = (on: boolean) => cx('px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer', on ? 'bg-[var(--color-primary)] text-black border-transparent font-bold' : 'border-white/10 text-[var(--color-text-secondary)]');
  const s = stats.data;
  const pages = users.data ? Math.max(1, Math.ceil(users.data.total / users.data.pageSize)) : 1;

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Admin console" subtitle="Manage learners, topics and the question bank." />
      <AdminNav />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card><Stat label="Users" value={s?.users ?? '—'} sub={s ? `+${s.newUsers7d} this week` : undefined} /></Card>
        <Card><Stat label="Active (7d)" value={s?.activeUsers7d ?? '—'} sub="submitted code" /></Card>
        <Card><Stat label="Submissions" value={s?.submissions ?? '—'} /></Card>
        <Card><Stat label="Interviews" value={s?.interviews ?? '—'} sub={s ? `${s.resumes} resumes` : undefined} /></Card>
        <Card><Stat label="Content" value={s ? `${s.questions} Qs` : '—'} sub={s ? `${s.topics} topics · ${s.skills} skills` : undefined} /></Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <form className="relative lg:w-80" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
            <label className="sr-only" htmlFor="user-search">Search users</label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input id="user-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email, press Enter"
              className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 pl-9 pr-3 py-2 text-sm text-white" />
          </form>
          <div className="flex flex-wrap gap-2">
            {[['', 'All roles'], ['USER', 'Learners'], ['ADMIN', 'Admins']].map(([v, l]) => <button key={v} type="button" aria-pressed={role === v} className={chip(role === v)} onClick={() => { setRole(v); setPage(1); }}>{l}</button>)}
            <span className="w-px bg-white/10" aria-hidden />
            {[['', 'Any status'], ['active', 'Active'], ['inactive', 'Deactivated']].map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} className={chip(status === v)} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>)}
          </div>
        </div>

        {users.loading && !users.data ? <Spinner /> : users.error ? <div className="p-4"><ErrorState error={users.error} onRetry={users.reload} /></div> : !users.data?.items.length ? (
          <EmptyState title="No users match" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[11px] uppercase text-[var(--color-text-muted)] border-b border-white/10">
                <tr>
                  <th scope="col" className="px-4 py-2.5">User</th>
                  <th scope="col" className="px-4 py-2.5">Target role</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Solved</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Interviews</th>
                  <th scope="col" className="px-4 py-2.5">Last active</th>
                  <th scope="col" className="px-4 py-2.5">Joined</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.data.items.map((u) => (
                  <tr key={u.id} className={cx('hover:bg-white/[0.02]', !u.active && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <Link to={`/admin/users/${u.id}`} className="font-bold text-white hover:text-[var(--color-primary)]">{u.name}</Link>
                      <div className="text-xs text-[var(--color-text-muted)]">{u.email}</div>
                      <div className="flex gap-1 mt-1">
                        {u.role === 'ADMIN' && <Badge><ShieldCheck className="w-3 h-3" />admin</Badge>}
                        {!u.active && <Badge tone="red">deactivated</Badge>}
                        {u.id === me?.id && <Badge tone="muted">you</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{u.targetRole ?? '—'}<div className="text-[11px] text-[var(--color-text-muted)]">{u.experienceLevel ?? ''}</div></td>
                    <td className="px-4 py-3 text-right font-mono text-white">{u.solved}<div className="text-[11px] text-[var(--color-text-muted)]">{u.submissions} subs</div></td>
                    <td className="px-4 py-3 text-right font-mono text-white">{u.interviews}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">{timeAgo(u.lastActive)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {u.id !== me?.id && (
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => update(u, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' }, u.role === 'ADMIN' ? 'Revoke admin from' : 'Make admin:')}>
                            <ShieldCheck className="w-3.5 h-3.5" /> {u.role === 'ADMIN' ? 'Revoke admin' : 'Make admin'}
                          </Button>
                          <Button variant={u.active ? 'danger' : 'secondary'} className="px-2 py-1 text-xs" onClick={() => update(u, { active: !u.active }, u.active ? 'Deactivate' : 'Reactivate')}>
                            {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />} {u.active ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {users.data && users.data.total > users.data.pageSize && (
          <div className="flex items-center justify-between p-3 border-t border-white/10 text-xs font-mono text-[var(--color-text-secondary)]">
            <span>{users.data.total} users · page {page}/{pages}</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

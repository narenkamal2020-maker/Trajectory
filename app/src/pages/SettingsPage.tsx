import { useEffect, useState, type FormEvent } from 'react';
import { useConfirm, ThemeSwitcher, ToggleStylePicker } from '../components/extras';
import { ThemeToggle } from '../components/ThemeToggle';
import { Download, RefreshCw, Trash2, LogOut } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { useOffline } from '../lib/offline-context';
import { useToast } from '../lib/toast';
import { getServerUrl, platformKind, setServerUrl } from '../lib/platform';
import { AppDownloads } from '../components/AppDownloads';
import { Button, Card, CardHeader, Field, PageHeader, SelectField, Spinner, TextArea, timeAgo } from '../components/ui';

const LEVELS = ['Student / Internship seeking', 'Fresh Graduate', '1-2 Years', '3-5 Years', '5+ Years'];

export function SettingsPage() {
  useDocumentTitle('Settings');
  const toast = useToast();
  const askConfirm = useConfirm();
  const { user, logout } = useAuth();
  const offline = useOffline();
  const profile = useAsync(() => api.profile(), []);
  const roles = useAsync(() => api.roles(), []);
  const [form, setForm] = useState({ targetRole: '', experienceLevel: LEVELS[1], targetIndustry: '', bio: '', githubUrl: '', linkedinUrl: '' });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [server, setServer] = useState(getServerUrl());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const p = profile.data;
    if (p) setForm({ targetRole: p.targetRole ?? '', experienceLevel: p.experienceLevel ?? LEVELS[1], targetIndustry: p.targetIndustry ?? '', bio: p.bio ?? '', githubUrl: p.githubUrl ?? '', linkedinUrl: p.linkedinUrl ?? '' });
  }, [profile.data]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveProfile({ ...form, skills: profile.data?.skills });
      toast('Profile saved — readiness and recommendations recalculated.', 'success');
    } catch (err) { toast(err instanceof ApiError ? (err.fields?.[0]?.message ?? err.message) : 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.changePassword(pw.current, pw.next); toast('Password changed. Please sign in again.', 'success'); await logout(); }
    catch (err) { toast(err instanceof ApiError ? (err.fields?.[0]?.message ?? err.message) : 'Failed', 'error'); }
  };

  if (profile.loading && !profile.data) return <Spinner />;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" subtitle={user?.email} />

      <Card>
        <CardHeader title="Career profile" />
        <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Target role" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
              <option value="" disabled>Choose…</option>
              {(roles.data ?? []).map((r) => <option key={r.id} value={r.title}>{r.title}</option>)}
              {form.targetRole && !roles.data?.some((r) => r.title === form.targetRole) && <option value={form.targetRole}>{form.targetRole}</option>}
            </SelectField>
            <SelectField label="Experience" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</SelectField>
            <Field label="Target industry" value={form.targetIndustry} onChange={(e) => setForm({ ...form, targetIndustry: e.target.value })} />
            <Field label="GitHub URL" type="url" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
            <Field label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
          </div>
          <TextArea label="Bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div className="flex justify-end"><Button type="submit" variant="primary" loading={saving} disabled={!form.targetRole}>Save profile</Button></div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Appearance" eyebrow="System follows your device's light/dark setting" />
        <ThemeSwitcher />
        <div className="mt-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">Toggle style</p>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">The animated switch shown in the header. Try it: <ThemeToggle className="h-8 w-8 align-middle border border-white/10" /></p>
          <ToggleStylePicker />
        </div>
      </Card>

      <AppDownloads />

      <Card>
        <CardHeader title="Offline practice" eyebrow={platformKind() === 'desktop' ? 'desktop: JavaScript, Python & SQL run locally' : 'browser: JavaScript runs locally'} />
        <div className="space-y-3 text-sm">
          <p className="text-[var(--color-text-secondary)]">
            {offline.bundleCount ? <>{offline.bundleCount} problems downloaded {timeAgo(offline.bundleSavedAt)}.</> : 'No problems downloaded yet.'}
            {' '}{offline.pendingCount} submission(s) waiting to sync.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button loading={downloading} disabled={!offline.online} onClick={async () => { setDownloading(true); try { await offline.downloadBundle(); toast('Question bank saved for offline use.', 'success'); } catch { toast('Download failed', 'error'); } finally { setDownloading(false); } }}><Download className="w-4 h-4" /> Download question bank</Button>
            <Button disabled={!offline.online || !offline.pendingCount} loading={offline.syncing} onClick={() => offline.syncNow()}><RefreshCw className="w-4 h-4" /> Sync now</Button>
            <Button variant="danger" onClick={async () => { if (await askConfirm({ title: 'Clear offline data?', body: 'Downloaded problems and any submissions not yet synced will be deleted from this device.', confirmLabel: 'Clear', danger: true })) { await offline.store.clear(); await offline.refreshCounts(); } }}><Trash2 className="w-4 h-4" /> Clear offline data</Button>
          </div>
        </div>
      </Card>

      {platformKind() !== 'web' && (
        <Card>
          <CardHeader title="Server" />
          <div className="flex gap-2">
            <input aria-label="Server URL" value={server} onChange={(e) => setServer(e.target.value)} className="flex-1 rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-3 py-2 text-sm text-white" />
            <Button onClick={() => { setServerUrl(server); toast('Server updated — sign in again.', 'info'); void logout(); }}>Save</Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Security" />
        <form onSubmit={changePw} className="grid sm:grid-cols-2 gap-4 items-end">
          <Field label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Field label="New password" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} hint="8+ chars, letter and number" />
          <div className="sm:col-span-2 flex justify-between">
            <Button variant="ghost" onClick={() => void logout()}><LogOut className="w-4 h-4" /> Sign out</Button>
            <Button type="submit" disabled={!pw.current || pw.next.length < 8}>Change password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

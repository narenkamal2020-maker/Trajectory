import { useEffect, useState, type FormEvent } from 'react';
import { useConfirm } from '../components/extras';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { usePath, navigate } from '../lib/router';
import { useToast } from '../lib/toast';
import type { Application, Stage } from '../lib/types';
import { Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, SelectField, Spinner, TextArea } from '../components/ui';

const STAGES: Stage[] = ['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const LABEL: Record<Stage, string> = { APPLIED: 'Applied', OA: 'Assessment', INTERVIEW: 'Interviewing', OFFER: 'Offer', HIRED: 'Hired', REJECTED: 'Rejected' };

type Draft = { id?: string; company: string; role: string; stage: Stage; appliedDate: string; salaryPackage: string; notes: string };
const empty = (): Draft => ({ company: '', role: '', stage: 'APPLIED', appliedDate: new Date().toISOString().slice(0, 10), salaryPackage: '', notes: '' });

export function ApplicationsPage() {
  useDocumentTitle('Applications');
  const toast = useToast();
  const askConfirm = useConfirm();
  const path = usePath();
  const { data, error, loading, reload, setData } = useAsync(() => api.applications(), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (path.includes('new=1')) { setDraft(empty()); navigate('/applications', true); } }, [path]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const body = { company: draft.company, role: draft.role, stage: draft.stage, appliedDate: draft.appliedDate || null, salaryPackage: draft.salaryPackage || null, notes: draft.notes || null };
      const saved = draft.id ? await api.updateApplication(draft.id, body) : await api.createApplication(body);
      setData((list) => draft.id ? (list ?? []).map((a) => (a.id === saved.id ? saved : a)) : [saved, ...(list ?? [])]);
      setDraft(null);
    } catch (err) { toast(err instanceof ApiError ? err.message : 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const move = async (a: Application, stage: Stage) => {
    setData((list) => (list ?? []).map((x) => (x.id === a.id ? { ...x, stage } : x)));
    try { await api.updateApplication(a.id, { stage }); } catch { toast('Could not update stage', 'error'); void reload(); }
  };

  const remove = async (a: Application) => {
    if (!(await askConfirm({ title: `Delete ${a.company} — ${a.role}?`, body: 'This removes the application from your pipeline and analytics.', confirmLabel: 'Delete', danger: true }))) return;
    setData((list) => (list ?? []).filter((x) => x.id !== a.id));
    setDraft(null);
    await api.deleteApplication(a.id).catch(() => reload());
  };

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const apps = data ?? [];

  return (
    <div>
      <PageHeader eyebrow="Pipeline" title="Applications" subtitle="Track every application and move it through stages. Your funnel shows up in Analytics."
        actions={<Button variant="primary" onClick={() => setDraft(empty())}><Plus className="w-4 h-4" /> Add application</Button>} />

      {!apps.length ? (
        <Card><EmptyState icon={<Briefcase className="w-5 h-5" />} title="No applications yet" body="Add the roles you've applied to — Trajectory nudges you to apply once your readiness is high." /></Card>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-4 overflow-x-auto pb-2">
          {STAGES.map((s) => {
            const list = apps.filter((a) => a.stage === s);
            return (
              <section key={s} aria-label={LABEL[s]} className="rounded-2xl bg-[var(--color-surface-container-lowest)] border border-white/5 p-3 min-h-[200px]">
                <h2 className="flex justify-between font-mono text-[11px] uppercase text-[var(--color-text-secondary)] mb-3 px-1"><span>{LABEL[s]}</span><span>{list.length}</span></h2>
                <ul className="space-y-2">
                  {list.map((a) => (
                    <li key={a.id} className="rounded-xl bg-[var(--color-surface-container-low)] border border-white/10 p-3">
                      <button type="button" onClick={() => setDraft({ id: a.id, company: a.company, role: a.role, stage: a.stage, appliedDate: a.appliedDate ?? '', salaryPackage: a.salaryPackage ?? '', notes: a.notes ?? '' })} className="text-left w-full cursor-pointer">
                        <div className="text-sm font-bold text-white">{a.company}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{a.role}</div>
                        {a.appliedDate && <div className="font-mono text-[10px] text-[var(--color-text-muted)] mt-1">{a.appliedDate}{a.salaryPackage ? ` · ${a.salaryPackage}` : ''}</div>}
                      </button>
                      <label className="sr-only" htmlFor={`stage-${a.id}`}>Stage</label>
                      <select id={`stage-${a.id}`} value={a.stage} onChange={(e) => move(a, e.target.value as Stage)} className="mt-2 w-full rounded-md bg-[var(--color-bg-base)] border border-white/10 text-xs text-white px-2 py-1">
                        {STAGES.map((x) => <option key={x} value={x}>{LABEL[x]}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit application' : 'Add application'}>
        {draft && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company" required value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
              <Field label="Role" required value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
              <SelectField label="Stage" value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })}>{STAGES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}</SelectField>
              <Field label="Applied on" type="date" value={draft.appliedDate} onChange={(e) => setDraft({ ...draft, appliedDate: e.target.value })} />
              <Field label="Compensation" value={draft.salaryPackage} onChange={(e) => setDraft({ ...draft, salaryPackage: e.target.value })} placeholder="optional" />
            </div>
            <TextArea label="Notes" rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <div className="flex justify-between">
              {draft.id ? <Button variant="danger" onClick={() => remove(apps.find((a) => a.id === draft.id)!)}><Trash2 className="w-4 h-4" /> Delete</Button> : <span />}
              <Button type="submit" variant="primary" loading={saving} disabled={!draft.company.trim() || !draft.role.trim()}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

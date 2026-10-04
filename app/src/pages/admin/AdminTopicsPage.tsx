import { useMemo, useState, type FormEvent } from 'react';
import { useConfirm } from '../../components/extras';
import { FolderPlus, Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../lib/toast';
import type { AdminTopic } from '../../lib/types';
import { Badge, Button, Card, CardHeader, ErrorState, Field, Modal, PageHeader, SelectField, Spinner } from '../../components/ui';
import { AdminNav } from './AdminNav';

export function AdminTopicsPage() {
  useDocumentTitle('Admin · Topics');
  const toast = useToast();
  const askConfirm = useConfirm();
  const { data, error, loading, reload } = useAsync(() => api.admin.topics(), []);
  const [topicModal, setTopicModal] = useState<{ parentId: string } | null>(null);
  const [topicName, setTopicName] = useState('');
  const [skillFor, setSkillFor] = useState<AdminTopic | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const roots = useMemo(() => (data ?? []).filter((t) => !t.parentId), [data]);
  const children = (id: string) => (data ?? []).filter((t) => t.parentId === id);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast(ok, 'success'); await reload(); return true; }
    catch (e) { toast(e instanceof ApiError ? (e.fields?.[0]?.message ?? e.message) : 'Failed', 'error'); return false; }
    finally { setBusy(false); }
  };

  const createTopic = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.admin.createTopic({ name: topicName.trim(), parentId: topicModal?.parentId || null }), `Topic “${topicName}” created.`)) { setTopicModal(null); setTopicName(''); }
  };
  const createSkill = async (e: FormEvent) => {
    e.preventDefault();
    if (!skillFor) return;
    if (await run(() => api.admin.createSkill({ categoryId: skillFor.id, name: skillName.trim(), description: skillDesc.trim() || undefined }), `Skill “${skillName}” added to ${skillFor.name}.`)) { setSkillFor(null); setSkillName(''); setSkillDesc(''); }
  };
  const rename = (t: AdminTopic) => {
    const name = prompt('Rename topic', t.name)?.trim();
    if (name && name !== t.name) void run(() => api.admin.renameTopic(t.id, name), 'Topic renamed.');
  };

  const TopicCard = ({ t, depth }: { t: AdminTopic; depth: number }) => (
    <div className={depth ? 'ml-4 sm:ml-8 border-l border-white/10 pl-4' : ''}>
      <div className="rounded-xl bg-[var(--color-surface-container-low)] border border-white/10 p-4 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-headline font-bold text-white">{t.name}</h3>
            <Badge tone="muted">{t.skills.length} skills</Badge>
            <Badge tone="muted">{t.questions} questions</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => { setSkillFor(t); setSkillName(''); }}><Plus className="w-3.5 h-3.5" /> Skill</Button>
            {!t.parentId && <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => { setTopicModal({ parentId: t.id }); setTopicName(''); }}><FolderPlus className="w-3.5 h-3.5" /> Sub-topic</Button>}
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => rename(t)} aria-label={`Rename ${t.name}`}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" className="px-2 py-1 text-xs" aria-label={`Delete ${t.name}`}
              onClick={async () => { if (await askConfirm({ title: `Delete topic “${t.name}”?`, body: 'Only empty topics can be deleted.', confirmLabel: 'Delete', danger: true })) void run(() => api.admin.deleteTopic(t.id), 'Topic deleted.'); }}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        {t.skills.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-3">
            {t.skills.map((s) => (
              <li key={s.id} className="group inline-flex items-center gap-1.5 text-xs pl-2.5 pr-1 py-1 rounded-lg bg-[var(--color-bg-base)] border border-white/10 text-[var(--color-text-primary)]" title={s.description ?? undefined}>
                {s.name} <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{s.questions}q</span>
                <button type="button" aria-label={`Delete skill ${s.name}`} className="p-0.5 rounded opacity-40 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                  onClick={async () => { if (await askConfirm({ title: `Delete skill “${s.name}”?`, body: "Skills in use by questions, roles or learner progress can't be deleted.", confirmLabel: 'Delete', danger: true })) void run(() => api.admin.deleteSkill(s.id), 'Skill deleted.'); }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {children(t.id).map((c) => <TopicCard key={c.id} t={c} depth={depth + 1} />)}
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Topics & skills" subtitle="Topics group questions; skills are what learners' proficiency is tracked on. Every question links to at least one skill."
        actions={<Button variant="primary" onClick={() => { setTopicModal({ parentId: '' }); setTopicName(''); }}><FolderPlus className="w-4 h-4" /> New topic</Button>} />
      <AdminNav />
      {loading && !data ? <Spinner /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <Card>
          <CardHeader title={`${data!.length} topics`} icon={<FolderTree className="w-4 h-4 text-[var(--color-primary)]" />} />
          {roots.map((t) => <TopicCard key={t.id} t={t} depth={0} />)}
        </Card>
      )}

      <Modal open={!!topicModal} onClose={() => setTopicModal(null)} title={topicModal?.parentId ? 'New sub-topic' : 'New topic'}>
        <form onSubmit={createTopic} className="space-y-4">
          <Field label="Name" required value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Bit Manipulation" autoFocus />
          <SelectField label="Parent topic" value={topicModal?.parentId ?? ''} onChange={(e) => setTopicModal({ parentId: e.target.value })}>
            <option value="">— none (top-level) —</option>
            {roots.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </SelectField>
          <div className="flex justify-end"><Button type="submit" variant="primary" loading={busy} disabled={topicName.trim().length < 2}>Create topic</Button></div>
        </form>
      </Modal>

      <Modal open={!!skillFor} onClose={() => setSkillFor(null)} title={`Add skill to ${skillFor?.name ?? ''}`}>
        <form onSubmit={createSkill} className="space-y-4">
          <Field label="Skill name" required value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. XOR Tricks" autoFocus />
          <Field label="Description (optional)" value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} />
          <div className="flex justify-end"><Button type="submit" variant="primary" loading={busy} disabled={skillName.trim().length < 2}>Add skill</Button></div>
        </form>
      </Modal>
    </div>
  );
}

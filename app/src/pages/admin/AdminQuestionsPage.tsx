import { useState } from 'react';
import { Plus, Upload, Download, Search, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { Link, navigate } from '../../lib/router';
import { useToast } from '../../lib/toast';
import { Badge, Button, Card, EmptyState, ErrorState, Modal, PageHeader, Spinner, cx, difficultyTone } from '../../components/ui';
import { AdminNav } from './AdminNav';

/** Example file for bulk upload — mirrors the API's question schema. */
export const IMPORT_TEMPLATE = [
  {
    title: 'Sum of Squares',
    description: 'Return the sum of the squares of the integers in `nums`.',
    difficulty: 'EASY',
    categoryId: 'cat-arrays',
    type: 'CODE',
    tags: ['arrays', 'math'],
    hints: ['Square each number, then add them up.'],
    constraints: '0 <= nums.length <= 10^4',
    timeLimitMs: 2000,
    skills: [{ skillId: 'sk-array-traversal', weight: 1 }],
    code: { functionName: 'sumSquares', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int', compare: 'exact' },
    tests: [
      { args: [[1, 2, 3]], expected: 14, hidden: false },
      { args: [[]], expected: 0, hidden: true },
      { args: [[-2, 5]], expected: 29, hidden: true },
    ],
    reference: { language: 'python', code: 'def sumSquares(nums):\n    return sum(x * x for x in nums)' },
  },
  {
    title: 'Highest Paid Employee',
    description: 'Table `Employee(id, name, salary)`. Return the `name` of the highest-paid employee.',
    difficulty: 'EASY',
    categoryId: 'cat-db',
    type: 'SQL',
    tags: ['sql'],
    hints: ['ORDER BY salary DESC and LIMIT 1.'],
    timeLimitMs: 2000,
    skills: [{ skillId: 'sk-sql-agg', weight: 1 }],
    sql: { setup: "CREATE TABLE Employee (id INTEGER, name TEXT, salary INTEGER);\nINSERT INTO Employee VALUES (1,'Ann',100),(2,'Bo',300),(3,'Cy',200);", orderMatters: true },
    tests: [{ expected: [['Bo']], hidden: false }],
    reference: { language: 'sql', code: 'SELECT name FROM Employee ORDER BY salary DESC LIMIT 1' },
  },
];

function downloadTemplate() {
  const blob = new Blob([JSON.stringify(IMPORT_TEMPLATE, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'trajectory-questions-template.json' });
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminQuestionsPage() {
  useDocumentTitle('Admin · Questions');
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const topics = useAsync(() => api.admin.topics(), []);
  const list = useAsync(() => api.admin.questions({ categoryId, status }), [categoryId, status]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<Awaited<ReturnType<typeof api.admin.importQuestions>> | null>(null);

  const toggle = async (id: string, active: boolean) => {
    list.setData((d) => (d ?? []).map((q) => (q.id === id ? { ...q, active } : q)));
    try { await api.admin.setQuestionActive(id, active); } catch { toast('Update failed', 'error'); void list.reload(); }
  };

  const onFile = async (file: File) => {
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : null;
      if (!items) throw new Error('The file must contain a JSON array of questions (see the template).');
      const r = await api.admin.importQuestions(items);
      setReport(r);
      await list.reload();
    } catch (e) {
      toast(e instanceof SyntaxError ? 'That file is not valid JSON.' : e instanceof ApiError || e instanceof Error ? e.message : 'Import failed', 'error');
    } finally { setImporting(false); }
  };

  const items = (list.data ?? []).filter((q) => !search || q.title.toLowerCase().includes(search.toLowerCase()));
  const chip = (on: boolean) => cx('px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer', on ? 'bg-[var(--color-primary)] text-black border-transparent font-bold' : 'border-white/10 text-[var(--color-text-secondary)]');

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Questions"
        subtitle="Every question is checked by running its reference solution against all tests before it is saved."
        actions={<>
          <Button onClick={downloadTemplate}><Download className="w-4 h-4" /> Template</Button>
          <label className={cx('inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-white border border-white/10', importing && 'opacity-50 pointer-events-none')}>
            <Upload className="w-4 h-4" /> {importing ? 'Importing…' : 'Upload JSON'}
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }} />
          </label>
          <Button variant="primary" onClick={() => navigate('/admin/questions/new')}><Plus className="w-4 h-4" /> New question</Button>
        </>} />
      <AdminNav />

      <Card className="mb-4 p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <label className="relative block lg:w-72">
          <span className="sr-only">Search questions</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search titles…" className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 pl-9 pr-3 py-2 text-sm text-white" />
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="sr-only" htmlFor="topic-filter">Topic</label>
          <select id="topic-filter" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-3 py-1.5 text-xs text-white">
            <option value="">All topics</option>
            {(topics.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.parentId ? '— ' : ''}{t.name}</option>)}
          </select>
          {[['', 'All'], ['active', 'Live'], ['inactive', 'Hidden']].map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} className={chip(status === v)} onClick={() => setStatus(v)}>{l}</button>)}
        </div>
      </Card>

      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !items.length ? (
        <Card><EmptyState title="No questions" body="Create one, or upload a JSON file using the template." /></Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-white/5">
            {items.map((q) => (
              <li key={q.id} className={cx('flex items-center gap-3 px-4 py-3', !q.active && 'opacity-55')}>
                <div className="flex-1 min-w-0">
                  <Link to={`/admin/questions/${q.id}`} className="text-sm text-white hover:text-[var(--color-primary)] truncate block">{q.title}</Link>
                  <div className="text-[11px] font-mono text-[var(--color-text-muted)]">{q.categoryName} · {q.tests} tests · {q.attempts} attempts{q.solveRate !== null ? ` · ${Math.round(q.solveRate)}% solve` : ''}</div>
                </div>
                <Badge tone={q.source === 'admin' ? 'blue' : 'muted'}>{q.source === 'admin' ? 'authored' : 'bank'}</Badge>
                {q.type === 'SQL' && <Badge tone="blue">SQL</Badge>}
                <Badge tone={difficultyTone(q.difficulty)} className="w-16 justify-center">{q.difficulty}</Badge>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => toggle(q.id, !q.active)} aria-label={q.active ? `Hide ${q.title}` : `Publish ${q.title}`}>
                  {q.active ? <><Eye className="w-3.5 h-3.5" /> Live</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!report} onClose={() => setReport(null)} title="Import results" wide>
        {report && (
          <div className="space-y-3">
            <p className="text-sm text-white">{report.imported} imported · {report.failed} failed</p>
            <ul className="space-y-2">
              {report.results.map((r) => (
                <li key={r.index} className="flex gap-2 text-sm rounded-lg bg-[var(--color-bg-base)] border border-white/10 p-3">
                  {r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="text-white">#{r.index + 1} {r.title ?? '(untitled)'}</div>
                    {r.ok ? <Link to={`/admin/questions/${r.id}`} className="text-xs text-[var(--color-primary)] hover:underline">Open {r.id}</Link>
                      : <div className="text-xs text-rose-200 break-words">{r.error}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}

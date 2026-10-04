import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2, FlaskConical, Save, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { Link, navigate } from '../../lib/router';
import { useToast } from '../../lib/toast';
import type { AdminQuestionInput, Difficulty, ExecutionResult, Language, ValueType } from '../../lib/types';
import { CodeEditor } from '../../components/CodeEditor';
import { Badge, Button, Card, CardHeader, ErrorState, Field, SelectField, Spinner, TextArea, cx } from '../../components/ui';
import { AdminNav } from './AdminNav';

const VALUE_TYPES: ValueType[] = ['int', 'float', 'bool', 'string', 'int[]', 'string[]', 'int[][]', 'string[][]', 'ListNode', 'TreeNode'];
type TestRow = { args: string; expected: string; hidden: boolean };
type Param = { name: string; type: ValueType };

function referenceTemplate(lang: Language, fn: string, params: Param[]) {
  const names = params.map((p) => p.name).join(', ');
  if (lang === 'python') return `def ${fn || 'solve'}(${names}):\n    # Reference solution — must pass every test\n    pass\n`;
  if (lang === 'sql') return 'SELECT\n';
  return `function ${fn || 'solve'}(${names}) {\n  // Reference solution — must pass every test\n}\n`;
}

export function QuestionEditorPage({ id }: { id?: string }) {
  const toast = useToast();
  const editing = !!id;
  useDocumentTitle(editing ? 'Admin · Edit question' : 'Admin · New question');
  const topics = useAsync(() => api.admin.topics(), []);
  const existing = useAsync(() => (id ? api.admin.question(id) : Promise.resolve(null)), [id]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'CODE' | 'SQL'>('CODE');
  const [tags, setTags] = useState('');
  const [hints, setHints] = useState('');
  const [constraints, setConstraints] = useState('');
  const [timeLimitMs, setTimeLimit] = useState(2000);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [fn, setFn] = useState('solve');
  const [params, setParams] = useState<Param[]>([{ name: 'nums', type: 'int[]' }]);
  const [returnType, setReturnType] = useState<ValueType>('int');
  const [compare, setCompare] = useState<'exact' | 'unordered' | 'unorderedNested' | 'float'>('exact');
  const [sqlSetup, setSqlSetup] = useState('');
  const [orderMatters, setOrderMatters] = useState(true);
  const [tests, setTests] = useState<TestRow[]>([{ args: '[[1, 2, 3]]', expected: '6', hidden: false }, { args: '[[]]', expected: '0', hidden: true }]);
  const [refLang, setRefLang] = useState<Language>('python');
  const [refCode, setRefCode] = useState(referenceTemplate('python', 'solve', [{ name: 'nums', type: 'int[]' }]));
  const [validation, setValidation] = useState<ExecutionResult | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState<'validate' | 'save' | null>(null);

  // Load an existing question into the form.
  useEffect(() => {
    const q = existing.data;
    if (!q) return;
    setTitle(q.title); setDescription(q.description); setDifficulty(q.difficulty); setCategoryId(q.categoryId); setType(q.type);
    setTags(q.tags.join(', ')); setHints(q.hints.join('\n')); setConstraints(q.constraints ?? ''); setTimeLimit(q.timeLimitMs);
    setSkills(Object.fromEntries(q.skills.map((s) => [s.skillId, s.weight])));
    if (q.code) { setFn(q.code.functionName); setParams(q.code.params); setReturnType(q.code.returnType); setCompare(q.code.compare ?? 'exact'); }
    if (q.sql) { setSqlSetup(q.sql.setup); setOrderMatters(q.sql.orderMatters); }
    setTests(q.tests.map((t) => ({ args: t.args ? JSON.stringify(t.args) : '', expected: JSON.stringify(t.expected), hidden: t.hidden })));
    if (q.reference) { setRefLang(q.reference.language); setRefCode(q.reference.code); }
    else {
      const lang: Language = q.type === 'SQL' ? 'sql' : 'python';
      setRefLang(lang);
      setRefCode(referenceTemplate(lang, q.code?.functionName ?? 'solve', q.code?.params ?? []));
    }
  }, [existing.data]);

  useEffect(() => {
    if (type === 'SQL' && refLang !== 'sql') { setRefLang('sql'); setRefCode(referenceTemplate('sql', fn, params)); }
    if (type === 'CODE' && refLang === 'sql') { setRefLang('python'); setRefCode(referenceTemplate('python', fn, params)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const skillsByTopic = useMemo(() => (topics.data ?? []).filter((t) => t.skills.length), [topics.data]);

  /** Build the API payload, collecting JSON errors per test row. */
  const build = (): { input?: AdminQuestionInput; errors: string[] } => {
    const errors: string[] = [];
    const parsedTests = tests.map((t, i) => {
      let args: unknown[] | undefined, expected: unknown;
      if (type === 'CODE') {
        try { const a = JSON.parse(t.args); if (!Array.isArray(a)) throw new Error(); args = a; }
        catch { errors.push(`Test ${i + 1}: arguments must be a JSON array, one entry per parameter — e.g. [[1,2,3], 5]`); }
      }
      try { expected = JSON.parse(t.expected); } catch { errors.push(`Test ${i + 1}: expected output is not valid JSON`); }
      return { args, expected, hidden: t.hidden };
    });
    if (!Object.keys(skills).length) errors.push('Link at least one skill.');
    if (!categoryId) errors.push('Choose a topic.');
    if (errors.length) return { errors };
    return {
      errors,
      input: {
        title: title.trim(), description: description.trim(), difficulty, categoryId, type,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        hints: hints.split('\n').map((h) => h.trim()).filter(Boolean),
        constraints: constraints.trim() || null,
        timeLimitMs,
        skills: Object.entries(skills).map(([skillId, weight]) => ({ skillId, weight })),
        code: type === 'CODE' ? { functionName: fn.trim(), params, returnType, compare } : undefined,
        sql: type === 'SQL' ? { setup: sqlSetup, orderMatters } : undefined,
        tests: parsedTests,
        reference: { language: refLang, code: refCode },
      },
    };
  };

  const explain = (e: unknown): string[] => {
    if (e instanceof ApiError) {
      const list = e.fields?.map((f) => `${f.field || 'question'}: ${f.message}`) ?? [];
      const failures = (e.details?.failures ?? []) as Array<{ test: string; status: string; expected?: string; actual?: string; error?: string }>;
      return [e.message, ...list, ...(e.details?.compileError ? [e.details.compileError] : []),
        ...failures.map((f) => `${f.test}: ${f.status}${f.expected ? ` — expected ${f.expected}` : ''}${f.actual ? `, got ${f.actual}` : ''}${f.error ? ` — ${f.error}` : ''}`)];
    }
    return [e instanceof Error ? e.message : 'Request failed'];
  };

  const validate = async () => {
    const { input, errors } = build();
    setProblems(errors); setValidation(null);
    if (!input) return;
    setBusy('validate');
    try { setValidation(await api.admin.validate(input)); }
    catch (e) { setProblems(explain(e)); }
    finally { setBusy(null); }
  };

  const save = async () => {
    const { input, errors } = build();
    setProblems(errors);
    if (!input) return;
    setBusy('save');
    try {
      const r = id ? await api.admin.updateQuestion(id, input) : await api.admin.createQuestion(input);
      toast(editing ? 'Question updated.' : 'Question published — learners can practice it now.', 'success');
      navigate(`/admin/questions/${r.id}`, true);
      if (!editing) return;
      void existing.reload();
    } catch (e) { setProblems(explain(e)); }
    finally { setBusy(null); }
  };

  if ((topics.loading && !topics.data) || (editing && existing.loading && !existing.data)) return <Spinner />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const input = 'rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-2.5 py-1.5 text-sm text-white font-mono';

  return (
    <div>
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/questions" className="p-2 rounded-lg hover:bg-white/5 text-[var(--color-text-secondary)]" aria-label="Back to questions"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="font-headline text-2xl font-bold text-white">{editing ? 'Edit question' : 'New question'}</h1>
          {existing.data && <Badge tone={existing.data.active ? 'green' : 'muted'}>{existing.data.active ? 'live' : 'hidden'}</Badge>}
          {id && <Link to={`/practice/${id}`} className="text-xs font-mono text-[var(--color-primary)] hover:underline">open as learner →</Link>}
        </div>
        <div className="flex gap-2">
          <Button onClick={validate} loading={busy === 'validate'}><FlaskConical className="w-4 h-4" /> Validate</Button>
          <Button variant="primary" onClick={save} loading={busy === 'save'}><Save className="w-4 h-4" /> {editing ? 'Save changes' : 'Publish'}</Button>
        </div>
      </div>

      {problems.length > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 space-y-1">
          {problems.map((p, i) => <p key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{p}</p>)}
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Problem" />
            <div className="space-y-4">
              <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <TextArea label="Description (supports `code` and **bold**)" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="grid sm:grid-cols-3 gap-4">
                <SelectField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                  {['EASY', 'MEDIUM', 'HARD'].map((d) => <option key={d}>{d}</option>)}
                </SelectField>
                <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as 'CODE' | 'SQL')} disabled={editing}>
                  <option value="CODE">Code (JS / Python)</option><option value="SQL">SQL</option>
                </SelectField>
                <Field label="Time limit (ms / test)" type="number" min={200} max={10000} value={timeLimitMs} onChange={(e) => setTimeLimit(Number(e.target.value))} />
              </div>
              <SelectField label="Topic" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="" disabled>Choose a topic…</option>
                {(topics.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.parentId ? '— ' : ''}{t.name}</option>)}
              </SelectField>
              <Field label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="arrays, hashing" />
              <TextArea label="Hints (one per line, revealed in order)" rows={3} value={hints} onChange={(e) => setHints(e.target.value)} />
              <Field label="Constraints (optional)" value={constraints} onChange={(e) => setConstraints(e.target.value)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Skills exercised" eyebrow="drives learner proficiency updates" />
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {skillsByTopic.map((t) => (
                <fieldset key={t.id}>
                  <legend className="font-mono text-[11px] uppercase text-[var(--color-text-muted)] mb-1.5">{t.name}</legend>
                  <div className="flex flex-wrap gap-2">
                    {t.skills.map((s) => {
                      const on = s.id in skills;
                      return (
                        <span key={s.id} className={cx('inline-flex items-center gap-1 rounded-lg border text-xs', on ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10' : 'border-white/10')}>
                          <button type="button" aria-pressed={on} onClick={() => setSkills((cur) => { const n = { ...cur }; if (on) delete n[s.id]; else n[s.id] = 1; return n; })}
                            className={cx('px-2.5 py-1 cursor-pointer', on ? 'text-white' : 'text-[var(--color-text-secondary)]')}>{s.name}</button>
                          {on && (
                            <select aria-label={`Weight for ${s.name}`} value={skills[s.id]} onChange={(e) => setSkills((cur) => ({ ...cur, [s.id]: Number(e.target.value) }))}
                              className="bg-transparent text-[var(--color-primary)] font-mono text-[11px] pr-1 cursor-pointer">
                              {[1, 0.8, 0.6, 0.4, 0.2].map((w) => <option key={w} value={w} className="bg-[#11131d]">{w}</option>)}
                            </select>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {type === 'CODE' ? (
            <Card>
              <CardHeader title="Function signature" eyebrow="learners get generated starter code in JS and Python" />
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="Function name" value={fn} onChange={(e) => setFn(e.target.value)} />
                  <SelectField label="Returns" value={returnType} onChange={(e) => setReturnType(e.target.value as ValueType)}>{VALUE_TYPES.map((t) => <option key={t}>{t}</option>)}</SelectField>
                  <SelectField label="Compare output" value={compare} onChange={(e) => setCompare(e.target.value as typeof compare)}>
                    <option value="exact">exact</option><option value="unordered">any order</option><option value="unorderedNested">any order (nested)</option><option value="float">float ±1e-5</option>
                  </SelectField>
                </div>
                <div className="font-mono text-[11px] uppercase text-[var(--color-text-muted)]">Parameters</div>
                {params.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input aria-label={`Parameter ${i + 1} name`} value={p.name} onChange={(e) => setParams((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={cx(input, 'flex-1')} />
                    <select aria-label={`Parameter ${i + 1} type`} value={p.type} onChange={(e) => setParams((ps) => ps.map((x, j) => (j === i ? { ...x, type: e.target.value as ValueType } : x)))} className={input}>
                      {VALUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <Button variant="ghost" aria-label={`Remove parameter ${i + 1}`} disabled={params.length <= 1} onClick={() => setParams((ps) => ps.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="ghost" className="text-xs" disabled={params.length >= 6} onClick={() => setParams((ps) => [...ps, { name: `arg${ps.length + 1}`, type: 'int' }])}><Plus className="w-3.5 h-3.5" /> Add parameter</Button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Schema & data" eyebrow="SQLite dialect, shown to learners" />
              <TextArea rows={7} value={sqlSetup} onChange={(e) => setSqlSetup(e.target.value)} placeholder={"CREATE TABLE Employee (id INTEGER, name TEXT);\nINSERT INTO Employee VALUES (1, 'Ann');"} />
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-3">
                <input type="checkbox" checked={orderMatters} onChange={(e) => setOrderMatters(e.target.checked)} /> Row order matters
              </label>
            </Card>
          )}

          <Card>
            <CardHeader title="Tests" eyebrow="JSON values · hidden tests are only used for grading"
              action={<Button variant="ghost" className="text-xs" onClick={() => setTests((t) => [...t, { args: type === 'CODE' ? '[]' : '', expected: type === 'CODE' ? 'null' : '[[]]', hidden: true }])}><Plus className="w-3.5 h-3.5" /> Add test</Button>} />
            <div className="space-y-2">
              {tests.map((t, i) => {
                const res = validation?.cases[i];
                return (
                  <div key={i} className="rounded-lg border border-white/10 bg-[var(--color-bg-base)] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[var(--color-text-secondary)] flex items-center gap-2">Test {i + 1}
                        {res && (res.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-label="passed" /> : <XCircle className="w-3.5 h-3.5 text-rose-300" aria-label="failed" />)}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                          <input type="checkbox" checked={t.hidden} onChange={(e) => setTests((ts) => ts.map((x, j) => (j === i ? { ...x, hidden: e.target.checked } : x)))} /> hidden
                        </label>
                        <Button variant="ghost" className="px-1.5 py-1" aria-label={`Remove test ${i + 1}`} disabled={tests.length <= 1} onClick={() => setTests((ts) => ts.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    {type === 'CODE' && (
                      <input aria-label={`Test ${i + 1} arguments`} value={t.args} onChange={(e) => setTests((ts) => ts.map((x, j) => (j === i ? { ...x, args: e.target.value } : x)))}
                        placeholder="arguments as a JSON array, e.g. [[1,2,3], 5]" className={cx(input, 'w-full')} />
                    )}
                    <input aria-label={`Test ${i + 1} expected output`} value={t.expected} onChange={(e) => setTests((ts) => ts.map((x, j) => (j === i ? { ...x, expected: e.target.value } : x)))}
                      placeholder={type === 'CODE' ? 'expected return value (JSON)' : 'expected rows, e.g. [["Ann", 100]]'} className={cx(input, 'w-full')} />
                    {res && res.status !== 'PASS' && <p className="text-xs text-rose-200 font-mono break-all">{res.error ?? `got ${res.actual}`}</p>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Reference solution" eyebrow="not shown to learners — proves the tests are correct"
              action={type === 'CODE' ? (
                <select aria-label="Reference language" value={refLang} onChange={(e) => { const l = e.target.value as Language; setRefLang(l); setRefCode(referenceTemplate(l, fn, params)); }} className={input}>
                  <option value="python">Python</option><option value="javascript">JavaScript</option>
                </select>
              ) : <Badge tone="blue">SQL</Badge>} />
            <div className="h-80"><CodeEditor value={refCode} language={refLang} onChange={setRefCode} onRun={validate} ariaLabel="Reference solution editor" /></div>
            {validation && (
              <div role="status" className={cx('mt-3 rounded-lg border p-3 text-sm', validation.verdict === 'ACCEPTED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/30 bg-rose-500/10 text-rose-100')}>
                {validation.verdict === 'ACCEPTED' ? `All ${validation.total} tests pass (${validation.executionTimeMs} ms) — ready to publish.`
                  : validation.compileError ?? `${validation.passed}/${validation.total} tests pass — fix the failing tests or the solution.`}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, Play, Send, RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle, TrendingUp, WifiOff, CloudUpload } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { Link } from '../lib/router';
import { useOffline } from '../lib/offline-context';
import { canRunLocally, runLocally } from '../lib/local-runner';
import { useToast } from '../lib/toast';
import type { ExecutionResult, Language, OfflineQuestion, QuestionDetail, SubmitResult } from '../lib/types';
import { CodeEditor } from '../components/CodeEditor';
import { CopyButton } from '../components/extras';
import { RichText } from '../components/RichText';
import { Badge, Button, Card, ErrorState, Spinner, cx, difficultyTone, verdictTone, timeAgo } from '../components/ui';

const LANG_LABEL: Record<Language, string> = { javascript: 'JavaScript', python: 'Python', sql: 'SQL' };
const draftKey = (id: string, l: Language) => `trajectory.draft.${id}.${l}`;
const readDraft = (id: string, l: Language) => { try { return localStorage.getItem(draftKey(id, l)); } catch { return null; } };
const writeDraft = (id: string, l: Language, code: string) => { try { localStorage.setItem(draftKey(id, l), code); } catch { /* storage full/blocked */ } };

/** Normalize an offline-bundle question into the detail shape. */
function fromOffline(q: OfflineQuestion): QuestionDetail & { offline: true; raw: OfflineQuestion } {
  const meta = q.meta as { functionName?: string; params?: Array<{ name: string; type: string }>; returnType?: string; setup?: string };
  return {
    ...q, offline: true, raw: q, totalAttempts: q.totalAttempts,
    languages: q.type === 'SQL' ? ['sql'] : ['javascript', 'python'],
    signature: q.type === 'CODE' ? { functionName: meta.functionName!, params: meta.params!, returnType: meta.returnType! } : null,
    schema: q.type === 'SQL' ? meta.setup ?? null : null,
    skills: q.skillIds.map((id) => ({ id, name: id.replace(/^sk-/, '').replace(/-/g, ' '), weight: 1 })),
    sampleTests: q.sampleTests.map((t) => ({ id: t.id, args: t.args ?? null, expected: t.expected })),
    mySubmissions: [],
  };
}

export function PracticeWorkspacePage({ id }: { id: string }) {
  const toast = useToast();
  const { store, online, refreshCounts } = useOffline();
  const q = useAsync<QuestionDetail & { offline?: boolean; raw?: OfflineQuestion }>(async () => {
    try { return await api.question(id); }
    catch (e) {
      if (e instanceof ApiError && !e.isNetwork) throw e;
      const cached = await store.question(id);
      if (!cached) throw e;
      return fromOffline(cached);
    }
  }, [id]);
  useDocumentTitle(q.data?.title ?? 'Practice');

  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [tab, setTab] = useState<'problem' | 'submissions'>('problem');
  const [running, setRunning] = useState<'run' | 'submit' | null>(null);
  const [result, setResult] = useState<(ExecutionResult & Partial<SubmitResult> & { mode: 'run' | 'submit' | 'local' }) | null>(null);
  const started = useRef(Date.now());

  // Pick a language + load the draft when the question loads.
  useEffect(() => {
    if (!q.data) return;
    const l = q.data.languages.includes(language) ? language : q.data.languages[0];
    setLanguage(l);
    setCode(readDraft(q.data.id, l) ?? q.data.starterCode[l] ?? '');
    setResult(null); setHintsShown(0); started.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.id]);

  const switchLanguage = (l: Language) => {
    if (!q.data) return;
    writeDraft(q.data.id, language, code);
    setLanguage(l);
    setCode(readDraft(q.data.id, l) ?? q.data.starterCode[l] ?? '');
  };

  const onCode = (v: string) => { setCode(v); if (q.data) writeDraft(q.data.id, language, v); };
  const reset = () => { if (q.data) { setCode(q.data.starterCode[language] ?? ''); writeDraft(q.data.id, language, q.data.starterCode[language] ?? ''); } };

  const offlineQuestion = async (): Promise<OfflineQuestion | undefined> => q.data?.raw ?? store.question(id);

  const run = async () => {
    if (!q.data || running) return;
    setRunning('run');
    try {
      if (!online || q.data.offline) throw new ApiError(0, 'offline');
      setResult({ ...(await api.run(q.data.id, language, code)), mode: 'run' });
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork) {
        const oq = await offlineQuestion();
        if (oq && canRunLocally(language)) setResult({ ...(await runLocally(oq, language, code)), mode: 'local' });
        else toast(language === 'javascript' ? 'Download the offline bundle in Settings to practice offline.' : 'Offline Python/SQL runs need the desktop app.', 'error');
      } else toast(e instanceof Error ? e.message : 'Run failed', 'error');
    } finally { setRunning(null); }
  };

  const submit = async () => {
    if (!q.data || running) return;
    setRunning('submit');
    const timeTakenSec = Math.round((Date.now() - started.current) / 1000);
    try {
      if (!online || q.data.offline) throw new ApiError(0, 'offline');
      const r = await api.submit(q.data.id, { language, code, usedHint: hintsShown > 0, timeTakenSec });
      setResult({ ...r, mode: 'submit' });
      if (r.verdict === 'ACCEPTED') toast(r.firstSolve ? 'Accepted — first solve! Skills updated.' : 'Accepted.', 'success');
      void q.reload();
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork) {
        // Grade locally for instant feedback, queue for authoritative server grading.
        const oq = await offlineQuestion();
        let localVerdict: string | undefined;
        if (oq && canRunLocally(language)) {
          const local = await runLocally(oq, language, code);
          localVerdict = local.verdict;
          setResult({ ...local, mode: 'local', queued: true });
        }
        await store.enqueue({ questionId: q.data.id, questionTitle: q.data.title, language, code, usedHint: hintsShown > 0, timeTakenSec, localVerdict });
        await refreshCounts();
        toast('Saved offline — it will be graded on hidden tests when you reconnect.', 'info');
      } else toast(e instanceof Error ? e.message : 'Submit failed', 'error');
    } finally { setRunning(null); }
  };

  const signature = useMemo(() => {
    const s = q.data?.signature;
    return s ? `${s.functionName}(${s.params.map((p) => `${p.name}: ${p.type}`).join(', ')}) → ${s.returnType}` : null;
  }, [q.data]);

  if (q.loading && !q.data) return <Spinner />;
  if (q.error && !q.data) return <ErrorState error={q.error} onRetry={q.reload} />;
  const d = q.data!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/practice" className="p-2 rounded-lg hover:bg-white/5 text-[var(--color-text-secondary)]" aria-label="Back to problems"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="font-headline text-xl font-bold text-white truncate">{d.title}</h1>
          <Badge tone={difficultyTone(d.difficulty)}>{d.difficulty}</Badge>
          {d.offline && <Badge tone="orange"><WifiOff className="w-3 h-3" /> offline</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden" role="group" aria-label="Language">
            {d.languages.map((l) => (
              <button key={l} type="button" aria-pressed={language === l} onClick={() => switchLanguage(l)}
                className={cx('px-3 py-1.5 text-xs font-mono cursor-pointer', language === l ? 'bg-[var(--color-primary)] text-black font-bold' : 'text-[var(--color-text-secondary)] hover:bg-white/5')}>
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={reset} title="Reset to starter code" aria-label="Reset to starter code"><RotateCcw className="w-4 h-4" /></Button>
          <Button onClick={run} loading={running === 'run'}><Play className="w-4 h-4" /> Run</Button>
          <Button variant="primary" onClick={submit} loading={running === 'submit'}>{online && !d.offline ? <Send className="w-4 h-4" /> : <CloudUpload className="w-4 h-4" />} Submit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Problem panel */}
        <Card className="p-0 overflow-hidden xl:max-h-[calc(100vh-10rem)] flex flex-col">
          <div className="flex border-b border-white/10" role="tablist">
            {(['problem', 'submissions'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)}
                className={cx('px-4 py-2.5 text-xs font-mono uppercase tracking-wide cursor-pointer', tab === t ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')}>
                {t === 'problem' ? 'Problem' : `My submissions (${d.mySubmissions.length})`}
              </button>
            ))}
          </div>
          <div className="p-5 overflow-y-auto space-y-5 text-sm">
            {tab === 'problem' ? (
              <>
                <RichText text={d.description} className="text-[var(--color-text-primary)] leading-relaxed" />
                {signature && <div className="font-mono text-xs bg-[var(--color-bg-base)] border border-white/10 rounded-lg px-3 py-2 text-[var(--color-secondary)]">{signature}</div>}
                {d.schema && (
                  <div>
                    <h3 className="font-mono text-[11px] uppercase text-[var(--color-text-muted)] mb-2">Schema & sample data</h3>
                    <pre className="font-mono text-[11px] bg-[var(--color-bg-base)] border border-white/10 rounded-lg p-3 overflow-x-auto text-[var(--color-text-secondary)] whitespace-pre-wrap">{d.schema}</pre>
                  </div>
                )}
                {d.examples.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-mono text-[11px] uppercase text-[var(--color-text-muted)]">Examples</h3>
                    {d.examples.map((ex, i) => (
                      <div key={i} className="font-mono text-xs bg-[var(--color-bg-base)] border border-white/10 rounded-lg p-3 space-y-1">
                        <div><span className="text-[var(--color-text-muted)]">Input: </span><span className="text-white">{ex.input}</span></div>
                        <div><span className="text-[var(--color-text-muted)]">Output: </span><span className="text-white">{ex.output}</span></div>
                      </div>
                    ))}
                  </div>
                )}
                {d.constraints && <div><h3 className="font-mono text-[11px] uppercase text-[var(--color-text-muted)] mb-1">Constraints</h3><p className="font-mono text-xs text-[var(--color-text-secondary)]">{d.constraints}</p></div>}
                <div className="flex flex-wrap gap-1.5">{d.skills.map((s) => <Badge key={s.id} tone="muted">{s.name}</Badge>)}</div>
                {d.hints.length > 0 && (
                  <div className="space-y-2">
                    {d.hints.slice(0, hintsShown).map((h, i) => (
                      <div key={i} className="flex gap-2 text-xs bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg p-3 text-[var(--color-text-primary)]"><Lightbulb className="w-4 h-4 text-[var(--color-primary)] shrink-0" />{h}</div>
                    ))}
                    {hintsShown < d.hints.length && (
                      <Button variant="ghost" onClick={() => setHintsShown((n) => n + 1)} className="text-xs"><Lightbulb className="w-4 h-4" /> Reveal hint {hintsShown + 1}/{d.hints.length} <span className="text-[var(--color-text-muted)]">(reduces skill gain slightly)</span></Button>
                    )}
                  </div>
                )}
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">{d.sampleTests.length} sample + {d.hiddenTestCount} hidden tests · {d.timeLimitMs} ms per test{d.solveRate !== null ? ` · ${Math.round(d.solveRate)}% solve rate` : ''}</p>
              </>
            ) : d.mySubmissions.length === 0 ? (
              <p className="text-[var(--color-text-secondary)]">No submissions yet.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {d.mySubmissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2"><Badge tone={verdictTone(s.status)}>{s.status}</Badge><span className="font-mono text-xs text-[var(--color-text-secondary)]">{LANG_LABEL[s.language]} · {s.passed}/{s.total}</span></div>
                    <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{timeAgo(s.submittedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Editor + results */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="h-[46vh] min-h-[320px]">
            <CodeEditor value={code} language={language} onChange={onCode} onRun={run} ariaLabel={`${LANG_LABEL[language]} solution editor`} />
          </div>
          <div className="flex items-center justify-between -mt-2">
            <p className="text-[11px] font-mono text-[var(--color-text-muted)]">Ctrl/⌘ + Enter to run · drafts save automatically</p>
            <CopyButton text={code} label="Copy code" />
          </div>
          <ResultPanel result={result} />
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: (ExecutionResult & Partial<SubmitResult> & { mode: 'run' | 'submit' | 'local' }) | null }) {
  if (!result) {
    return <Card className="text-sm text-[var(--color-text-secondary)]">Run your code against the sample tests, then submit to grade against hidden tests and update your skills.</Card>;
  }
  const accepted = result.verdict === 'ACCEPTED';
  return (
    <Card accent={accepted} className="space-y-4" as="section">
      <div className="flex flex-wrap items-center justify-between gap-2" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          {accepted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : result.verdict === 'TLE' ? <Clock className="w-5 h-5 text-sky-300" /> : <XCircle className="w-5 h-5 text-rose-300" />}
          <span className={cx('font-headline font-bold text-lg', accepted ? 'text-emerald-300' : 'text-white')}>
            {{ ACCEPTED: 'Accepted', WRONG: 'Wrong answer', PARTIAL: 'Partially correct', TLE: 'Time limit exceeded', ERROR: 'Error' }[result.verdict]}
          </span>
          <Badge tone="muted">{result.mode === 'submit' ? 'all tests' : result.mode === 'local' ? 'local · sample tests' : 'sample tests'}</Badge>
        </div>
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">{result.passed}/{result.total} passed · {result.executionTimeMs} ms</span>
      </div>

      {result.queued && <p className="text-xs text-[var(--color-secondary)] flex items-center gap-1.5"><CloudUpload className="w-4 h-4" /> Queued — the server will grade hidden tests and update skills when you are back online.</p>}

      {result.compileError && <pre className="font-mono text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-200 whitespace-pre-wrap">{result.compileError}</pre>}

      {result.skillDeltas && result.skillDeltas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.skillDeltas.map((s) => (
            <span key={s.skillId} className={cx('inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-lg border', s.delta >= 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200')}>
              <TrendingUp className="w-3.5 h-3.5" /> {s.name} {Math.round(s.before)} → {Math.round(s.after)} ({s.delta >= 0 ? '+' : ''}{s.delta.toFixed(1)})
            </span>
          ))}
        </div>
      )}

      {result.cases.length > 0 && (
        <ul className="space-y-2">
          {result.cases.map((c, i) => (
            <li key={c.caseId} className="rounded-lg bg-[var(--color-bg-base)] border border-white/10 p-3 font-mono text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Test {i + 1}{c.hidden ? ' (hidden)' : ''}</span>
                <span className={cx('font-bold', c.status === 'PASS' ? 'text-emerald-300' : c.status === 'TLE' ? 'text-sky-300' : 'text-rose-300')}>{c.status} · {c.timeMs} ms</span>
              </div>
              {!c.hidden && c.status !== 'PASS' && (
                <div className="space-y-0.5 mt-1.5">
                  {c.input && <div><span className="text-[var(--color-text-muted)]">input    </span><span className="text-white break-all">{c.input}</span></div>}
                  <div><span className="text-[var(--color-text-muted)]">expected </span><span className="text-emerald-200 break-all">{c.expected}</span></div>
                  {c.actual !== undefined && <div><span className="text-[var(--color-text-muted)]">actual   </span><span className="text-rose-200 break-all">{c.actual}</span></div>}
                </div>
              )}
              {c.error && <div className="mt-1.5 flex gap-1.5 text-rose-200"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span className="break-all">{c.error}</span></div>}
            </li>
          ))}
        </ul>
      )}

      {result.stdout && (
        <div>
          <h3 className="font-mono text-[11px] uppercase text-[var(--color-text-muted)] mb-1">stdout</h3>
          <pre className="font-mono text-xs bg-[var(--color-bg-base)] border border-white/10 rounded-lg p-3 max-h-40 overflow-auto text-[var(--color-text-secondary)] whitespace-pre-wrap">{result.stdout}</pre>
        </div>
      )}
    </Card>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useConfirm } from '../components/extras';
import { ArrowLeft, Mic, MicOff, Send, Flag, CheckCircle2, AlertCircle, Bot, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { Link } from '../lib/router';
import { useToast } from '../lib/toast';
import type { AnswerFeedback, InterviewDetail, InterviewSummary, Telemetry } from '../lib/types';
import { Badge, Button, Card, CardHeader, ErrorState, ProgressBar, Ring, Spinner, cx } from '../components/ui';

// Minimal typing for the (vendor-prefixed) Web Speech API.
type SpeechRec = { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null };
const SpeechRecognitionCtor: (new () => SpeechRec) | undefined =
  typeof window !== 'undefined' ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : undefined;

function Gauges({ t }: { t: Telemetry }) {
  const rows = [['Technical depth', t.distributedDepth], ['Problem solving', t.adversarialDefenseStability], ['Communication', t.articulationAndPacing]] as const;
  return (
    <div className="space-y-3">
      {rows.map(([label, v]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="font-mono text-white">{Math.round(v)}</span></div>
          <ProgressBar value={v} label={label} tone={v >= 70 ? 'green' : v >= 45 ? 'gold' : 'red'} />
        </div>
      ))}
    </div>
  );
}

function FeedbackCard({ f }: { f: AnswerFeedback }) {
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-[var(--color-bg-base)] p-3 text-xs space-y-2">
      <div className="flex flex-wrap gap-2 font-mono">
        <Badge tone={f.overall >= 70 ? 'green' : f.overall >= 50 ? 'orange' : 'red'}>{Math.round(f.overall)}/100</Badge>
        <Badge tone="muted">tech {Math.round(f.technical)}</Badge><Badge tone="muted">ps {Math.round(f.problemSolving)}</Badge><Badge tone="muted">comm {Math.round(f.communication)}</Badge>
        <Badge tone="blue">{f.source === 'llm' ? 'LLM evaluator' : 'rule evaluator'}</Badge>
      </div>
      {f.strengths.map((s) => <div key={s} className="flex gap-1.5 text-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />{s}</div>)}
      {f.improvements.map((s) => <div key={s} className="flex gap-1.5 text-[var(--color-secondary)]"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{s}</div>)}
    </div>
  );
}

function Summary({ s }: { s: InterviewSummary }) {
  return (
    <Card accent className="space-y-4">
      <CardHeader title="Interview report" eyebrow={s.verdict} />
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Ring value={s.overall} size={120} label={Math.round(s.overall)} sublabel="overall" />
        <div className="flex-1 w-full space-y-3">
          <Gauges t={{ distributedDepth: s.technical, adversarialDefenseStability: s.problemSolving, articulationAndPacing: s.communication }} />
          <p className="font-mono text-[11px] text-[var(--color-text-muted)]">{s.questionsAnswered}/{s.totalQuestions} questions · {Math.round(s.durationSec / 60)} min</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        <div><h3 className="font-mono uppercase text-[var(--color-text-muted)] mb-2">What went well</h3>{s.strengths.length ? s.strengths.map((x) => <p key={x} className="text-emerald-200 mb-1">• {x}</p>) : <p className="text-[var(--color-text-muted)]">—</p>}</div>
        <div><h3 className="font-mono uppercase text-[var(--color-text-muted)] mb-2">Focus next</h3>{s.improvements.map((x) => <p key={x} className="text-[var(--color-secondary)] mb-1">• {x}</p>)}</div>
      </div>
      <div className="flex gap-2"><Link to="/interviews"><Button variant="primary">New interview</Button></Link><Link to="/dashboard"><Button>Back to dashboard</Button></Link></div>
    </Card>
  );
}

export function InterviewSessionPage({ id }: { id: string }) {
  const toast = useToast();
  const askConfirm = useConfirm();
  const { data, error, loading, reload, setData } = useAsync<InterviewDetail>(() => api.interview(id), [id]);
  useDocumentTitle('Interview');
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [data?.messages.length]);
  useEffect(() => () => rec.current?.stop(), []);

  const toggleMic = () => {
    if (!SpeechRecognitionCtor) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SpeechRecognitionCtor();
    r.continuous = true; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e: any) => {
      const text = Array.from(e.results as ArrayLike<any>).slice(e.resultIndex).map((x: any) => x[0].transcript).join(' ');
      setAnswer((a) => (a ? a + ' ' : '') + text.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  const send = async () => {
    if (!data || !answer.trim() || sending) return;
    rec.current?.stop();
    setSending(true);
    const text = answer.trim();
    try {
      const r = await api.answer(id, text);
      setAnswer('');
      setData((d) => ({
        ...d!,
        status: r.done ? 'COMPLETED' : d!.status,
        questionNumber: r.questionNumber,
        telemetry: r.telemetry,
        summary: r.summary ?? d!.summary,
        messages: [...d!.messages,
          { role: 'USER', content: text, feedback: r.feedback, createdAt: new Date().toISOString() },
          { role: 'INTERVIEWER', content: r.reply, feedback: null, createdAt: new Date().toISOString() }],
      }));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not send answer', 'error');
    } finally { setSending(false); }
  };

  const finish = async () => {
    if (!(await askConfirm({ title: 'End the interview now?', body: 'Unanswered questions will not be scored.', confirmLabel: 'End interview' }))) return;
    await api.finishInterview(id).catch(() => undefined);
    void reload();
  };

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const d = data!;
  const live = d.status === 'IN_PROGRESS';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/interviews" className="p-2 rounded-lg hover:bg-white/5 text-[var(--color-text-secondary)]" aria-label="Back"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="font-headline text-xl font-bold text-white">{d.type.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} interview</h1>
          <Badge tone={live ? 'gold' : 'muted'}>{live ? `Question ${d.questionNumber}/${d.totalQuestions}` : d.status.toLowerCase()}</Badge>
        </div>
        {live && <Button variant="ghost" onClick={finish}><Flag className="w-4 h-4" /> End</Button>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 flex flex-col max-h-[calc(100vh-11rem)]">
          <div className="flex-1 overflow-y-auto p-5 space-y-4" aria-live="polite">
            {d.messages.map((m, i) => (
              <div key={i} className={cx('flex gap-3', m.role === 'USER' && 'flex-row-reverse')}>
                <div className={cx('w-8 h-8 rounded-full flex items-center justify-center shrink-0', m.role === 'USER' ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-container-high)] text-[var(--color-primary)]')}>
                  {m.role === 'USER' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cx('max-w-[85%]', m.role === 'USER' && 'text-right')}>
                  <div className={cx('inline-block text-left rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.role === 'USER' ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-white'
                      : m.role === 'SYSTEM' ? 'bg-white/5 text-[var(--color-text-secondary)] italic' : 'bg-[var(--color-surface-container-low)] border border-white/10 text-white')}>
                    {m.content}
                  </div>
                  {m.feedback && <FeedbackCard f={m.feedback} />}
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          {live && (
            <div className="border-t border-white/10 p-3">
              <label htmlFor="answer" className="sr-only">Your answer</label>
              <textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void send(); }}
                placeholder="Answer as you would out loud. Ctrl/⌘ + Enter to send."
                className="w-full rounded-xl bg-[var(--color-bg-base)] border border-white/10 px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-[var(--color-primary)]/50" />
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span>
                <div className="flex gap-2">
                  {SpeechRecognitionCtor && (
                    <Button variant={listening ? 'danger' : 'secondary'} onClick={toggleMic} aria-pressed={listening}>
                      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {listening ? 'Stop' : 'Dictate'}
                    </Button>
                  )}
                  <Button variant="primary" loading={sending} disabled={!answer.trim()} onClick={send}><Send className="w-4 h-4" /> Send</Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {d.summary ? <Summary s={d.summary} /> : (
            <Card>
              <CardHeader title="Live scores" eyebrow="running average" />
              <Gauges t={d.telemetry} />
              <p className="text-xs text-[var(--color-text-muted)] mt-4">Tip: name the key concepts explicitly, say *why* (trade-offs, complexity), and close with a measurable result.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

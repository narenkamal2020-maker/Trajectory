import { useState } from 'react';
import { Upload, FileText, RefreshCw, CheckCircle2, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAsync, useDocumentTitle, useInterval } from '../lib/hooks';
import { navigate } from '../lib/router';
import { useToast } from '../lib/toast';
import { CopyButton } from '../components/extras';
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, ProgressBar, Ring, Spinner, TextArea, timeAgo } from '../components/ui';

export function ResumePage() {
  useDocumentTitle('Resume');
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.latestResume(), []);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const pending = data && (data.status === 'PENDING' || data.status === 'PROCESSING');
  useInterval(() => void reload(), pending ? 2000 : null);

  const upload = async (file: File) => {
    setBusy(true);
    try { await api.uploadResume(file); toast('Uploaded — analyzing…', 'info'); await reload(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Upload failed', 'error'); }
    finally { setBusy(false); }
  };
  const submitPaste = async () => {
    setBusy(true);
    try { await api.pasteResume(paste); setPaste(''); setShowPaste(false); await reload(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Could not analyze', 'error'); }
    finally { setBusy(false); }
  };

  const uploader = (
    <div className="flex flex-wrap gap-2">
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold cursor-pointer hover:bg-[var(--color-gold)] focus-within:outline-2 focus-within:outline-[var(--color-primary)]">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload PDF / DOCX / TXT
        <input type="file" accept=".pdf,.docx,.txt" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
      </label>
      <Button onClick={() => setShowPaste((s) => !s)}><FileText className="w-4 h-4" /> Paste text</Button>
    </div>
  );

  if (loading && data === undefined) return <Spinner />;
  if (error && data === undefined) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Resume diagnostic" title="Resume" subtitle="Explainable ATS scoring: every point maps to a named check. Detected skills seed your skill map." actions={uploader} />
      {showPaste && (
        <Card className="space-y-3">
          <TextArea label="Resume text" rows={10} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste the full text of your resume…" />
          <div className="flex justify-end"><Button variant="primary" loading={busy} disabled={paste.trim().length < 50} onClick={submitPaste}>Analyze</Button></div>
        </Card>
      )}

      {!data ? (
        <Card><EmptyState icon={<FileText className="w-5 h-5" />} title="No resume yet" body="Upload your resume to get an ATS score, keyword gaps for your target role and personalized interview questions." /></Card>
      ) : pending ? (
        <Card className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" /><span className="text-sm text-white">Analyzing {data.fileName}…</span></Card>
      ) : data.status === 'FAILED' ? (
        <Card><EmptyState icon={<AlertCircle className="w-5 h-5" />} title="Analysis failed" body="Try re-running, or upload a text-based (not scanned) file." action={<Button onClick={() => api.reanalyzeResume(data.id).then(reload)}><RefreshCw className="w-4 h-4" /> Re-run</Button>} /></Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            <Card accent className="flex flex-col items-center text-center gap-3">
              <Ring value={data.atsScore ?? 0} size={140} label={Math.round(data.atsScore ?? 0)} sublabel="ATS score" />
              <div className="text-sm text-white">{data.fileName}</div>
              <div className="font-mono text-[11px] text-[var(--color-text-muted)]">{data.targetRole ? `scored for ${data.targetRole}` : 'no target role'} · {timeAgo(data.updatedAt)}</div>
              <Button variant="ghost" onClick={() => api.reanalyzeResume(data.id).then(reload)}><RefreshCw className="w-4 h-4" /> Re-score for current role</Button>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Score breakdown" />
              <ul className="space-y-3">
                {data.breakdown.map((b) => (
                  <li key={b.check}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-white">{b.check}</span><span className="font-mono text-[var(--color-text-secondary)]">{b.score}/{b.max}</span></div>
                    <ProgressBar value={b.score} max={b.max} label={b.check} tone={b.score / b.max >= 0.75 ? 'green' : b.score / b.max >= 0.4 ? 'gold' : 'red'} />
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{b.detail}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Suggestions" />
              <ul className="space-y-2">{data.suggestions.map((s) => <li key={s} className="flex gap-2 text-sm text-[var(--color-text-primary)]"><AlertCircle className="w-4 h-4 text-[var(--color-secondary)] shrink-0 mt-0.5" />{s}</li>)}</ul>
              {data.gaps.length > 0 && (
                <div className="mt-4"><div className="font-mono text-[11px] uppercase text-[var(--color-text-muted)] mb-2">Missing role keywords</div><div className="flex flex-wrap gap-1.5">{data.gaps.map((g) => <Badge key={g} tone="orange">{g}</Badge>)}</div></div>
              )}
            </Card>
            <Card>
              <CardHeader title="What we detected" />
              {data.parsed && (
                <div className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-1.5">{data.parsed.skills.map((s) => <Badge key={s.skillId} tone="green"><CheckCircle2 className="w-3 h-3" />{s.label}</Badge>)}</div>
                  <dl className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div><dt className="text-[var(--color-text-muted)]">Experience</dt><dd className="text-white">{Math.floor(data.parsed.experienceMonths / 12)}y {data.parsed.experienceMonths % 12}m</dd></div>
                    <div><dt className="text-[var(--color-text-muted)]">Education</dt><dd className="text-white">{data.parsed.education.degree ?? '—'}{data.parsed.education.gpa ? ` · ${data.parsed.education.gpa}` : ''}</dd></div>
                    <div><dt className="text-[var(--color-text-muted)]">Bullets</dt><dd className="text-white">{data.parsed.bullets.quantified}/{data.parsed.bullets.total} quantified</dd></div>
                    <div><dt className="text-[var(--color-text-muted)]">Words</dt><dd className="text-white">{data.parsed.wordCount}</dd></div>
                  </dl>
                  {data.roleFit && <p className="text-xs text-[var(--color-text-secondary)]">ML role fit: {data.roleFit.map((r) => `${r.role} ${Math.round(r.probability * 100)}%`).join(' · ')}</p>}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Interview questions from your resume" action={<div className="flex gap-2"><CopyButton text={data.interviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')} label="Copy all" /><Button variant="primary" onClick={() => navigate('/interviews?start=ROLE_SPECIFIC')}><MessageSquare className="w-4 h-4" /> Practice them</Button></div>} />
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[var(--color-text-primary)]">{data.interviewQuestions.map((q) => <li key={q}>{q}</li>)}</ol>
          </Card>
        </>
      )}
    </div>
  );
}

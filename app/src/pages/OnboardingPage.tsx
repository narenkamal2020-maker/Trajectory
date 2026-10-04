import { useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { navigate } from '../lib/router';
import { useToast } from '../lib/toast';
import { Button, Card, Field, SelectField, cx } from '../components/ui';

const LEVELS = ['Student / Internship seeking', 'Fresh Graduate', '1-2 Years', '3-5 Years', '5+ Years'];
const SUGGESTED_SKILLS = ['JavaScript / TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL Joins', 'Docker & Containers', 'Machine Learning', 'Statistics', 'Cloud Platforms', 'Design Patterns', 'Hash Maps & Sets'];

export function OnboardingPage() {
  useDocumentTitle('Set up your trajectory');
  const { user, markOnboarded } = useAuth();
  const toast = useToast();
  const roles = useAsync(() => api.roles(), []);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [level, setLevel] = useState(LEVELS[1]);
  const [industry, setIndustry] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const toggle = (s: string) => setSkills((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const saveProfile = async () => {
    setBusy(true);
    try {
      await api.saveProfile({ targetRole: role, experienceLevel: level, targetIndustry: industry || undefined, skills });
      setStep(2);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save profile', 'error');
    } finally { setBusy(false); }
  };

  const finish = async () => {
    setBusy(true);
    try {
      if (file) {
        await api.uploadResume(file);
        toast('Resume uploaded — analysis runs in the background.', 'success');
      }
      markOnboarded();
      navigate('/dashboard', true);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Upload failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] bg-[radial-gradient(ellipse_at_top,_rgba(237,180,11,0.10),_transparent_60%)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <ol className="flex items-center gap-2 mb-6 font-mono text-[11px]" aria-label="Progress">
          {['Target role', 'Skills', 'Resume'].map((label, i) => (
            <li key={label} className={cx('flex items-center gap-2', i <= step ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')}>
              <span className={cx('w-6 h-6 rounded-full flex items-center justify-center border', i < step ? 'bg-[var(--color-primary)] text-black border-transparent' : i === step ? 'border-[var(--color-primary)]' : 'border-white/20')}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              {label}{i < 2 && <span className="w-8 h-px bg-white/15" aria-hidden />}
            </li>
          ))}
        </ol>

        <Card className="p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-headline text-2xl font-bold text-white">Hi {user?.name?.split(' ')[0]} — where are you headed?</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Your readiness, recommendations and flight path are all computed against this role. You can change it any time.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Target role">
                {(roles.data ?? []).map((r) => (
                  <button key={r.id} type="button" role="radio" aria-checked={role === r.title} onClick={() => setRole(r.title)}
                    className={cx('text-left p-3 rounded-xl border text-sm cursor-pointer transition-all',
                      role === r.title ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-white' : 'border-white/10 bg-[var(--color-surface-container-low)] text-[var(--color-text-secondary)] hover:border-white/30')}>
                    <div className="font-bold">{r.title}</div>
                    <div className="font-mono text-[10px] opacity-70">{r.level} · {r.skills} skills</div>
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField label="Experience" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </SelectField>
                <Field label="Target industry (optional)" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. FinTech, SaaS" />
              </div>
              <div className="flex justify-end"><Button variant="primary" disabled={!role} onClick={() => setStep(1)}>Continue</Button></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline text-2xl font-bold text-white">What are you already comfortable with?</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">These give your skill map a small head start. Practice and interviews calibrate the rest.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...SUGGESTED_SKILLS, ...skills])].map((s) => (
                  <button key={s} type="button" aria-pressed={skills.includes(s)} onClick={() => toggle(s)}
                    className={cx('px-3 py-1.5 rounded-full text-xs border cursor-pointer', skills.includes(s) ? 'bg-[var(--color-primary)] text-black border-transparent font-bold' : 'border-white/15 text-[var(--color-text-secondary)] hover:border-white/40')}>
                    {s}
                  </button>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { toggle(custom.trim()); setCustom(''); } }}>
                <input aria-label="Add a skill" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add another skill…" className="flex-1 rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-3 py-2 text-sm text-white" />
                <Button type="submit">Add</Button>
              </form>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button variant="primary" loading={busy} onClick={saveProfile}>Save & continue</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline text-2xl font-bold text-white">Add your resume (optional)</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">We score it for ATS compatibility, detect your skills and generate personalized interview questions. PDF, DOCX or TXT, up to 5 MB.</p>
              </div>
              <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-[var(--color-primary)]/50 cursor-pointer text-center">
                <Upload className="w-6 h-6 text-[var(--color-primary)]" />
                <span className="text-sm text-white">{file ? file.name : 'Choose a file'}</span>
                <span className="text-xs text-[var(--color-text-muted)]">Stays private to your account</span>
                <input type="file" accept=".pdf,.docx,.txt" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              {file && <button type="button" onClick={() => setFile(null)} className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 cursor-pointer"><X className="w-3 h-3" /> Remove</button>}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={finish}>Skip for now</Button>
                <Button variant="primary" loading={busy} disabled={!file} onClick={finish}>Upload & finish</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

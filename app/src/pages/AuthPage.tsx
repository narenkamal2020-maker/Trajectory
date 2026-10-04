import { useState, type FormEvent } from 'react';
import { ArrowLeft, Server } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { Link, navigate } from '../lib/router';
import { getServerUrl, isNativeShell, setServerUrl } from '../lib/platform';
import { Button, Field } from '../components/ui';
import { useDocumentTitle } from '../lib/hooks';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  useDocumentTitle(mode === 'login' ? 'Sign in' : 'Create account');
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [server, setServer] = useState(getServerUrl());
  const [showServer, setShowServer] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setFieldErrors({});
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      navigate('/dashboard', true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message === 'Validation failed' ? 'Please fix the highlighted fields.' : err.message);
        if (err.fields) setFieldErrors(Object.fromEntries(err.fields.map((f) => [f.field, f.message])));
      } else setError('Unexpected error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_rgba(237,180,11,0.12),_transparent_60%)] bg-[var(--color-bg-base)]">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-white mb-6"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
        <div className="rounded-2xl border border-white/10 bg-[var(--color-surface-card)] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]" aria-hidden />
            <span className="font-headline font-bold text-[var(--color-primary)] tracking-tight">TRAJECTORY</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-white">{mode === 'login' ? 'Welcome back' : 'Start your trajectory'}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
            {mode === 'login' ? 'Sign in to continue your plan.' : 'Practice, mock interviews and a clear path to your target role.'}
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required error={fieldErrors.name} />
            )}
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required error={fieldErrors.email} />
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required error={fieldErrors.password}
              hint={mode === 'register' ? 'At least 8 characters, with a letter and a number.' : undefined} />
            {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2" role="alert">{error}</p>}
            <Button type="submit" variant="primary" loading={busy} className="w-full py-2.5">{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
          </form>

          <p className="text-sm text-[var(--color-text-secondary)] mt-6 text-center">
            {mode === 'login' ? <>New here? <Link to="/register" className="text-[var(--color-primary)] hover:underline">Create an account</Link></>
              : <>Already have an account? <Link to="/login" className="text-[var(--color-primary)] hover:underline">Sign in</Link></>}
          </p>

          {isNativeShell() && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setShowServer((s) => !s)} className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)] hover:text-white cursor-pointer">
                <Server className="w-3.5 h-3.5" /> Server: {getServerUrl()}
              </button>
              {showServer && (
                <div className="mt-3 flex gap-2">
                  <input aria-label="Server URL" value={server} onChange={(e) => setServer(e.target.value)} className="flex-1 rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 px-3 py-1.5 text-xs text-white" />
                  <Button onClick={() => { setServerUrl(server); setShowServer(false); }}>Save</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

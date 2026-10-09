import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, MapPin } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { track } from '../../lib/analytics';
import { SITE } from '../../config/site';
import { Button, Field, SelectField, TextArea } from '../../components/ui';
import { CopyButton } from '../../components/extras';
import { PublicLayout } from './PublicLayout';

const TOPICS = [['support', 'Help with my account'], ['feedback', 'Product feedback'], ['partnership', 'Partnership or campus program'], ['privacy', 'Privacy request (export / delete my data)'], ['other', 'Something else']] as const;

export function ContactPage() {
  useDocumentTitle('Contact', `Get in touch with the ${SITE.name} team — support, feedback, partnerships and privacy requests.`);
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [topic, setTopic] = useState<(typeof TOPICS)[number][0]>('support');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Please enter your name';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (message.trim().length < 10) e.message = 'Tell us a little more (at least 10 characters)';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      await api.contact({ name: name.trim(), email: email.trim(), topic, message: message.trim(), website });
      track('contact_submitted', { topic });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(Object.fromEntries(err.fields.map((f) => [f.field, f.message])));
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong — please try again or email us directly.');
    } finally { setBusy(false); }
  };

  if (sent) {
    return (
      <PublicLayout>
        <section className="text-center py-12" aria-live="polite">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" aria-hidden />
          <h1 className="font-headline text-3xl font-bold mt-4">Thank you — message received</h1>
          <p className="text-[var(--color-text-secondary)] mt-3 max-w-md mx-auto">
            We usually reply within two working days at <strong>{email}</strong>.{topic === 'privacy' ? ' Privacy requests are handled within 30 days.' : ''}
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <Link to={user ? '/dashboard' : '/'} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold">{user ? 'Back to dashboard' : 'Back to home'}</Link>
            <Link to="/faq" className="px-4 py-2 rounded-lg border border-white/15">Read the FAQ</Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <h1 className="font-headline text-3xl font-bold">Contact us</h1>
      <p className="text-[var(--color-text-secondary)] mt-2">Questions, feedback or a privacy request — we read every message.</p>

      <div className="mt-6 rounded-2xl border border-white/8 bg-[var(--color-surface-card)] backdrop-blur-xl p-4 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Mail className="w-4 h-4 text-[var(--color-primary)]" aria-hidden />
          <a href={`mailto:${SITE.contactEmail}`} className="underline">{SITE.contactEmail}</a>
          <CopyButton text={SITE.contactEmail} label="Copy email" />
        </div>
        {SITE.address && <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[var(--color-primary)]" aria-hidden /><span className="whitespace-pre-line">{SITE.address}</span></p>}
      </div>

      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required error={errors.name} />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required error={errors.email} />
        </div>
        <SelectField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value as typeof topic)}>
          {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
        <div>
          <TextArea label="Message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-err' : undefined} maxLength={5000} />
          <div className="flex justify-between mt-1 text-xs">
            {errors.message ? <p id="message-err" className="text-rose-300">{errors.message}</p> : <span />}
            <span className="text-[var(--color-text-muted)]">{message.length}/5000</span>
          </div>
        </div>
        {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
        <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
          <label>Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>
        {formError && <p role="alert" className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{formError}</p>}
        <Button type="submit" variant="primary" loading={busy}>Send message</Button>
      </form>
    </PublicLayout>
  );
}

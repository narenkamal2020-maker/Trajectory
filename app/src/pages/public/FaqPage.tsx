import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { PublicLayout } from './PublicLayout';

const FAQ: Array<{ q: string; a: string }> = [
  { q: 'Is Trajectory free?', a: 'Yes — practice, mock interviews, resume analysis and the career dashboard are free to use.' },
  { q: 'How is my readiness score calculated?', a: 'Each target role lists required skills with a minimum proficiency and an importance weight. Readiness is the importance-weighted share of those minimums you have reached. Your proficiency in each skill updates after every graded submission and interview.' },
  { q: 'Which languages can I practice in?', a: 'Coding problems accept JavaScript and Python; database problems accept SQL (SQLite dialect). Every submission runs in a sandbox against visible and hidden tests.' },
  { q: 'Can I practice offline?', a: 'Yes. Download the question bank in Settings. In the browser you can run JavaScript offline; the desktop app also runs Python and SQL locally. Offline submissions sync and are graded on hidden tests when you reconnect.' },
  { q: 'How are mock interviews scored?', a: 'Answers are scored on technical depth, problem solving and communication — by a rule engine that checks key concepts, structure (such as STAR) and specificity, optionally refined by an AI model. You get feedback after every answer.' },
  { q: 'Do you store my resume?', a: 'We store the extracted text and the analysis (encrypted), not the original file. You can request deletion at any time from the contact page.' },
  { q: 'Can I use the app on my phone?', a: 'Yes — the site works on mobile, and you can download the Android app or the Windows desktop app from Settings → Get the apps.' },
  { q: 'How do I delete my account?', a: 'Send a privacy request from the contact page. We delete your account and associated data and confirm by email.' },
];

export function FaqPage() {
  useDocumentTitle('FAQ', 'Answers to common questions about Trajectory: scoring, offline practice, interviews, resumes and privacy.');
  const [q, setQ] = useState('');
  const items = useMemo(() => FAQ.filter((f) => !q || (f.q + f.a).toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <PublicLayout>
      <h1 className="font-headline text-3xl font-bold">Frequently asked questions</h1>
      <label className="relative block mt-6">
        <span className="sr-only">Search questions</span>
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the FAQ…"
          className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-white/10 pl-9 pr-3 py-2.5 text-sm" />
      </label>
      <div className="mt-6 space-y-3">
        {items.map((f) => (
          <details key={f.q} className="group rounded-xl border border-white/10 bg-[var(--color-surface-card)] open:border-[var(--color-gold-border)]">
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 font-bold">
              {f.q}
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="px-5 pb-4 text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p>
          </details>
        ))}
        {!items.length && <p className="text-[var(--color-text-secondary)]">No matches. <Link to="/contact" className="underline text-[var(--color-primary)]">Ask us directly</Link>.</p>}
      </div>
    </PublicLayout>
  );
}

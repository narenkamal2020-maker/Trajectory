import { useEffect, useState } from 'react';
import { Mic, Brain, Database, Users, Network, Code2, FileText, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useDocumentTitle } from '../lib/hooks';
import { navigate, usePath, Link } from '../lib/router';
import { useToast } from '../lib/toast';
import type { InterviewType } from '../lib/types';
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, timeAgo } from '../components/ui';

const META: Record<InterviewType, { icon: typeof Mic; blurb: string }> = {
  BEHAVIORAL: { icon: Users, blurb: 'STAR stories: conflict, failure, impact, deadlines.' },
  TECHNICAL: { icon: Brain, blurb: 'CS fundamentals: networking, OS, databases, OOP.' },
  DSA: { icon: Code2, blurb: 'Talk through algorithms, data structures and complexity.' },
  SQL: { icon: Database, blurb: 'Joins, window functions, schema trade-offs.' },
  SYSTEM_DESIGN: { icon: Network, blurb: 'URL shortener, chat, rate limiter — at scale.' },
  ROLE_SPECIFIC: { icon: FileText, blurb: 'Questions generated from your resume.' },
};

export function InterviewsPage() {
  useDocumentTitle('Mock interviews');
  const toast = useToast();
  const path = usePath();
  const types = useAsync(() => api.interviewTypes(), []);
  const history = useAsync(() => api.interviews(), []);
  const [starting, setStarting] = useState<InterviewType | null>(null);

  const start = async (type: InterviewType) => {
    setStarting(type);
    try {
      const s = await api.startInterview(type);
      navigate(`/interviews/${s.interviewId}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not start interview', 'error');
      setStarting(null);
    }
  };

  // Deep link: /interviews?start=BEHAVIORAL (from recommendations / command palette)
  useEffect(() => {
    const t = new URLSearchParams(path.split('?')[1] ?? '').get('start') as InterviewType | null;
    if (t && META[t] && !starting) void start(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI mock interview studio" title="Mock interviews"
        subtitle="Four questions per session with follow-ups when an answer misses key ideas. Every answer is scored on technical depth, problem solving and communication." />

      {types.error ? <ErrorState error={types.error} onRetry={types.reload} /> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(types.data ?? []).map((t) => {
            const m = META[t.type];
            const I = m.icon;
            return (
              <Card key={t.type} className="flex flex-col justify-between gap-4 hover:border-[var(--color-primary)]/40 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center"><I className="w-5 h-5" /></div>
                  <div>
                    <h2 className="font-headline font-bold text-white">{t.label}</h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{m.blurb}</p>
                  </div>
                </div>
                <Button variant="primary" loading={starting === t.type} disabled={!!starting} onClick={() => start(t.type)}><Mic className="w-4 h-4" /> Start · ~{t.questions * 3} min</Button>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader title="History" />
        {history.loading && !history.data ? <Spinner /> : !history.data?.length ? (
          <EmptyState icon={<Mic className="w-5 h-5" />} title="No interviews yet" body="Your transcripts and scores will appear here." />
        ) : (
          <ul className="divide-y divide-white/5">
            {history.data.map((i) => (
              <li key={i.id}>
                <Link to={`/interviews/${i.id}`} className="flex items-center gap-3 py-3 hover:bg-white/[0.02] group">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white group-hover:text-[var(--color-primary)]">{i.type.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</div>
                    <div className="text-[11px] font-mono text-[var(--color-text-muted)]">{timeAgo(i.createdAt)}{i.durationSec ? ` · ${Math.round(i.durationSec / 60)} min` : ''}</div>
                  </div>
                  {i.status === 'COMPLETED' ? (
                    <div className="hidden sm:flex gap-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
                      <span>Tech {Math.round(i.technical ?? 0)}</span><span>Comm {Math.round(i.communication ?? 0)}</span><span>PS {Math.round(i.problemSolving ?? 0)}</span>
                    </div>
                  ) : null}
                  {i.status === 'COMPLETED' ? <Badge tone={(i.overall ?? 0) >= 70 ? 'green' : (i.overall ?? 0) >= 50 ? 'orange' : 'red'}>{Math.round(i.overall ?? 0)}/100</Badge>
                    : <Badge tone={i.status === 'IN_PROGRESS' ? 'gold' : 'muted'}>{i.status === 'IN_PROGRESS' ? 'resume' : 'abandoned'}</Badge>}
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

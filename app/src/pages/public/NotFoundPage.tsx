import { Compass } from 'lucide-react';
import { useDocumentTitle } from '../../lib/hooks';
import { Link, usePath } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { PublicLayout } from './PublicLayout';

export function NotFoundPage() {
  useDocumentTitle('Page not found', 'This page does not exist.');
  const path = usePath();
  const { status } = useAuth();
  return (
    <PublicLayout>
      <section className="text-center py-16">
        <Compass className="w-12 h-12 mx-auto text-[var(--color-primary)]" aria-hidden />
        <p className="font-mono text-sm text-[var(--color-text-muted)] mt-6">404</p>
        <h1 className="font-headline text-3xl font-bold mt-1">Off trajectory</h1>
        <p className="text-[var(--color-text-secondary)] mt-3">We couldn’t find <code className="px-1.5 py-0.5 rounded bg-white/10 break-all">{path}</code>.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link to={status === 'authenticated' ? '/dashboard' : '/'} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold">
            {status === 'authenticated' ? 'Go to dashboard' : 'Go home'}
          </Link>
          <Link to="/faq" className="px-4 py-2 rounded-lg border border-white/15">FAQ</Link>
          <Link to="/contact" className="px-4 py-2 rounded-lg border border-white/15">Contact</Link>
        </div>
      </section>
    </PublicLayout>
  );
}

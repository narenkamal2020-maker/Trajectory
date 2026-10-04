import { Users, FolderTree, FileCode2, ShieldAlert } from 'lucide-react';
import { Link, usePath } from '../../lib/router';
import { cx } from '../../components/ui';

const TABS = [
  { path: '/admin', label: 'Users & overview', icon: Users },
  { path: '/admin/topics', label: 'Topics & skills', icon: FolderTree },
  { path: '/admin/questions', label: 'Questions', icon: FileCode2 },
  { path: '/admin/security', label: 'Security & insights', icon: ShieldAlert },
];

export function AdminNav() {
  const path = usePath().split('?')[0];
  const active = (p: string) => (p === '/admin' ? path === '/admin' || path.startsWith('/admin/users') : path.startsWith(p));
  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-2 mb-6">
      {TABS.map((t) => (
        <Link key={t.path} to={t.path} aria-current={active(t.path) ? 'page' : undefined}
          className={cx('inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border',
            active(t.path) ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold border-transparent' : 'border-white/10 text-[var(--color-text-secondary)] hover:text-white')}>
          <t.icon className="w-4 h-4" /> {t.label}
        </Link>
      ))}
    </nav>
  );
}

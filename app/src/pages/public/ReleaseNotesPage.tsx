import { MotionConfig } from 'framer-motion';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { ArrowUpRight, DownloadIcon } from '../../landing/icons';
import { useLatestRelease, isLoaded } from '../../lib/useLatestRelease';
import { SITE } from '../../config/site';
import { LandingLayout } from './LandingLayout';

const STATIC_NOTES = `## v1.0.0 — Initial Release

**Desktop (Windows, macOS, Linux)**
- Electron-based desktop app with offline code execution (JavaScript, Python, SQL)
- Local sandbox runner — no internet needed to solve problems
- Automatic sync when reconnected

**Android**
- Capacitor-based native app for Android 7.0+
- Full practice and interview features on mobile
- Offline support with background sync

**Web**
- Full-featured web app, no install required
- Progressive Web App — install from your browser
- Sign in with your existing account on any device

**Practice**
- 40+ verified problems across JavaScript, Python and SQL
- Hidden test suite with difficulty-weighted skill updates
- Per-submission skill map updates

**Interviews**
- Behavioral, DSA and system design interview modes
- Follow-up questions for incomplete answers
- Concrete per-answer feedback and session history

**Career**
- Role readiness score with importance weighting
- ETA to role-ready based on recent pace
- Resume ATS scoring with explainability
- Daily plan — top three problems to move your readiness`;

function renderNotes(notes: string) {
  return notes.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} className="mt-8 first:mt-0 font-heading text-2xl italic text-white">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={i} className="mt-5 font-body text-sm font-semibold text-white/80">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <p key={i} className="flex items-start gap-2 font-body text-sm leading-relaxed text-white/60">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden />
          {line.slice(2)}
        </p>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="font-body text-sm leading-relaxed text-white/60">{line}</p>;
  });
}

export function ReleaseNotesPage() {
  useDocumentTitle(
    'Release Notes',
    'Trajectory release notes — what\'s new in each version of the desktop, Android and web app.',
  );
  const release = useLatestRelease(SITE.githubRepo);

  const notes = isLoaded(release) && release.notes ? release.notes : STATIC_NOTES;
  const version = isLoaded(release) ? release.version : 'v1.0.0';
  const date = isLoaded(release) && release.date
    ? new Date(release.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <LandingLayout
        label="// Release Notes"
        title={version}
        subtitle={date ?? undefined}
      >
        <div className="px-6 pb-20 pt-12 md:px-16 lg:px-20">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/downloads"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
              <DownloadIcon className="h-4 w-4" /> Download {version}
            </Link>
            <a href={`https://github.com/${SITE.githubRepo}/releases`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-sm text-white/50 transition-colors hover:text-white/80">
              Full changelog on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-10 max-w-2xl space-y-2">
            {renderNotes(notes)}
          </div>

          {release === null && (
            <p className="mt-6 font-body text-sm text-white/40">Loading release information…</p>
          )}
        </div>

        <section aria-label="Previous releases" className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
          <h2 className="font-heading text-2xl italic text-white">Looking for older releases?</h2>
          <p className="mt-2 font-body text-sm text-white/60">
            All past releases, with full changelogs and downloadable assets, are available on GitHub.
          </p>
          <a href={`https://github.com/${SITE.githubRepo}/releases`}
            target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 font-body text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white">
            All releases on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </section>
      </LandingLayout>
    </MotionConfig>
  );
}

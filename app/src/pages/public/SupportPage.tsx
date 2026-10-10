import { MotionConfig } from 'framer-motion';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { SITE } from '../../config/site';
import { LandingLayout } from './LandingLayout';
import { ArrowUpRight } from '../../landing/icons';

const COMMON_ISSUES = [
  {
    title: 'App not launching on macOS',
    body: 'Gatekeeper blocks unsigned apps on first open. Right-click the app in Applications, choose Open, then click Open in the dialog. You only need to do this once.',
    link: { label: 'Full macOS guide', to: '/platform-guides' },
  },
  {
    title: 'Windows SmartScreen warning',
    body: 'Click "More info" in the blue SmartScreen dialog, then "Run anyway". The installer is unsigned but the source code is public on GitHub.',
    link: { label: 'Full Windows guide', to: '/platform-guides' },
  },
  {
    title: 'Android APK blocked',
    body: 'Go to Settings → Apps → Special app access → Install unknown apps. Enable installs for the browser or file manager you used to download the APK.',
    link: { label: 'Full Android guide', to: '/platform-guides' },
  },
  {
    title: 'Progress not syncing',
    body: 'Check your internet connection. Sign out and back in if the session is stale. Verify the API URL in Settings → Advanced.',
    link: null,
  },
  {
    title: 'Can\'t sign in',
    body: 'Try resetting your password from the login page. If the issue persists, check that the backend is reachable and contact support.',
    link: { label: 'Contact us', to: '/contact' },
  },
  {
    title: 'Resume upload not working',
    body: 'Supported formats are PDF and .docx, up to 5 MB. Make sure the file is not password-protected and that your internet connection is stable during upload.',
    link: null,
  },
];

const CHANNELS = [
  {
    title: 'FAQ',
    description: 'Answers to the most common questions about scoring, offline practice, interviews, resumes and privacy.',
    cta: 'Read the FAQ',
    to: '/faq',
    external: false,
  },
  {
    title: 'Contact form',
    description: 'Send a message directly. We respond to support requests within 2 business days.',
    cta: 'Open contact form',
    to: '/contact',
    external: false,
  },
  {
    title: 'GitHub Issues',
    description: 'Found a bug or want to request a feature? Open an issue on GitHub so it can be tracked publicly.',
    cta: 'Open an issue',
    to: `https://github.com/${SITE.githubRepo}/issues`,
    external: true,
  },
  {
    title: 'Platform guides',
    description: 'Step-by-step installation guides and troubleshooting for Windows, macOS, Linux, Android and iOS.',
    cta: 'View guides',
    to: '/platform-guides',
    external: false,
  },
];

export function SupportPage() {
  useDocumentTitle(
    'Support',
    'Get help with Trajectory — installation guides, troubleshooting, FAQ, contact support and bug reporting.',
  );

  return (
    <MotionConfig reducedMotion="user">
      <LandingLayout
        label="// Support"
        title="How can we help?"
        subtitle="Installation guides, troubleshooting, answers to common questions and direct support channels."
      >
        {/* Support channels */}
        <section aria-labelledby="channels-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <p className="font-body text-sm text-white/50">// Support channels</p>
          <h2 id="channels-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
            Ways to get help
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((c) => (
              <div key={c.title}
                className="flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-6">
                <div>
                  <h3 className="font-heading text-lg italic text-white">{c.title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/60">{c.description}</p>
                </div>
                <div className="mt-auto">
                  {c.external ? (
                    <a href={c.to} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-body text-sm text-white/70 transition-colors hover:text-white">
                      {c.cta} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link to={c.to}
                      className="inline-flex items-center gap-1.5 font-body text-sm text-white/70 transition-colors hover:text-white">
                      {c.cta} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common issues */}
        <section aria-labelledby="issues-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <p className="font-body text-sm text-white/50">// Troubleshooting</p>
          <h2 id="issues-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
            Common issues
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_ISSUES.map((issue) => (
              <div key={issue.title}
                className="rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-6 space-y-3">
                <h3 className="font-heading text-base italic text-white">{issue.title}</h3>
                <p className="font-body text-sm leading-relaxed text-white/60">{issue.body}</p>
                {issue.link && (
                  <Link to={issue.link.to}
                    className="inline-flex items-center gap-1.5 font-body text-xs text-white/50 transition-colors hover:text-white/80">
                    {issue.link.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bug report prompt */}
        <section aria-labelledby="bugs-title" className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="font-body text-sm text-white/50">// Bug reports</p>
            <h2 id="bugs-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
              Found a bug?
            </h2>
            <p className="mt-6 font-body text-base leading-relaxed text-white/70">
              Open a GitHub issue with your platform, OS version and the steps to reproduce the problem.
              If the issue involves account data or a security concern, use the contact form instead —
              do not include credentials or sensitive details in a public GitHub issue.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={`https://github.com/${SITE.githubRepo}/issues/new`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
                Open a GitHub issue <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Use the contact form
              </Link>
            </div>
          </div>
        </section>

        {/* Escalation */}
        <section aria-label="Direct contact" className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
          <div className="mx-auto max-w-4xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-2xl italic text-white">Can't find the answer?</h2>
              <p className="mt-1 font-body text-sm text-white/60">
                Email{' '}
                <a href={`mailto:${SITE.contactEmail}`}
                  className="text-white underline underline-offset-2 hover:text-white/80 transition-colors">
                  {SITE.contactEmail}
                </a>{' '}
                directly or use the contact form.
              </p>
            </div>
            <Link to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
              Contact us
            </Link>
          </div>
        </section>
      </LandingLayout>
    </MotionConfig>
  );
}

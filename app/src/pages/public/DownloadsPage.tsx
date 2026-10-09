import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { WindowsIcon, AppleIcon, LinuxIcon, AndroidIcon, DownloadIcon, ArrowUpRight } from '../../landing/icons';
import { useLatestRelease, isLoaded, type PlatformAsset } from '../../lib/useLatestRelease';
import { SITE } from '../../config/site';
import { LandingLayout } from './LandingLayout';

type Device = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other';

function detectDevice(): Device {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/mac os x|macintosh/i.test(ua)) return 'mac';
  if (/linux/i.test(ua)) return 'linux';
  return 'other';
}

const mb = (b: number) => (b > 0 ? `${(b / 1048576).toFixed(1)} MB` : '');

interface PlatformSpec {
  id: string;
  label: string;
  icon: React.ReactNode;
  formats: string;
  note: string;
  asset: PlatformAsset | undefined;
  storeUrl?: string;
  storeLabel?: string;
  fallbackHref?: string;
}

function PlatformCard({ spec, detected }: { spec: PlatformSpec; detected: boolean }) {
  return (
    <article className={`flex flex-col gap-4 rounded-[1.25rem] border p-5 transition-all ${
      detected
        ? 'glow-detected border-white/20 bg-white/5 shadow-[0_0_32px_rgba(255,255,255,0.06)]'
        : 'border-white/10 bg-white/[0.02]'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${detected ? 'bg-white/15' : 'bg-white/8'}`}>
            {spec.icon}
          </div>
          <div>
            <h3 className="font-heading text-lg italic font-medium text-white">{spec.label}</h3>
            <p className="font-mono text-[11px] text-white/50">{spec.formats}</p>
          </div>
        </div>
        {detected && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-white/80">
            your device
          </span>
        )}
      </div>

      <p className="font-body text-xs leading-relaxed text-white/60">{spec.note}</p>

      <div className="mt-auto flex flex-col gap-2">
        {spec.asset ? (
          <a href={spec.asset.url} download={spec.asset.filename}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-all ${
              detected
                ? 'bg-white text-black hover:bg-white/90'
                : 'border border-white/10 bg-white/10 text-white hover:bg-white/15'
            }`}>
            <DownloadIcon className="h-4 w-4" />
            Download
            {spec.asset.size > 0 && (
              <span className="font-mono text-[11px] opacity-60">{mb(spec.asset.size)}</span>
            )}
          </a>
        ) : spec.storeUrl ? (
          <a href={spec.storeUrl} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-all ${
              detected
                ? 'bg-white text-black hover:bg-white/90'
                : 'border border-white/10 bg-white/10 text-white hover:bg-white/15'
            }`}>
            {spec.storeLabel ?? 'Open Store'}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : spec.fallbackHref ? (
          <a href={spec.fallbackHref} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 font-body text-sm text-white/60 transition-colors hover:text-white/80">
            View on GitHub <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : (
          <span className="rounded-xl border border-white/10 px-4 py-2.5 text-center font-body text-sm text-white/30">
            Coming soon
          </span>
        )}
      </div>
    </article>
  );
}

const REQUIREMENTS = [
  {
    platform: 'Windows',
    icon: <WindowsIcon className="h-4 w-4" />,
    reqs: [
      'Windows 10 (64-bit) or later',
      '4 GB RAM (8 GB recommended)',
      '300 MB disk space',
      'Internet required for first login and sync',
    ],
  },
  {
    platform: 'macOS',
    icon: <AppleIcon className="h-4 w-4" />,
    reqs: [
      'macOS 11 Big Sur or later',
      'Apple Silicon or Intel (Universal binary)',
      '300 MB disk space',
      'Internet required for first login and sync',
    ],
  },
  {
    platform: 'Linux',
    icon: <LinuxIcon className="h-4 w-4" />,
    reqs: [
      'Ubuntu 20.04+, Fedora 35+, or compatible',
      'glibc 2.31+',
      '300 MB disk space',
      'FUSE required for AppImage',
    ],
  },
  {
    platform: 'Android',
    icon: <AndroidIcon className="h-4 w-4" />,
    reqs: [
      'Android 7.0 (API 24) or later',
      '2 GB RAM or more',
      '150 MB storage',
      'Unknown sources enabled for sideload',
    ],
  },
  {
    platform: 'iOS',
    icon: <AppleIcon className="h-4 w-4" />,
    reqs: [
      'iOS 15 or later',
      'iPhone 8 or newer, any iPad',
      'Available via App Store / TestFlight',
      'PWA install via Safari Share → Add to Home Screen',
    ],
  },
];

function SystemRequirements() {
  return (
    <section id="requirements" aria-labelledby="requirements-title"
      className="border-t border-white/5 px-6 py-20 md:px-16 lg:px-20">
      <p className="font-body text-sm text-white/50">// System Requirements</p>
      <h2 id="requirements-title" className="mt-3 font-heading text-4xl italic tracking-[-2px] text-white md:text-5xl">
        What you need
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {REQUIREMENTS.map((r) => (
          <div key={r.platform} className="space-y-3 rounded-[1rem] border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-white/80">
              {r.icon}
              <span className="font-heading text-base italic text-white">{r.platform}</span>
            </div>
            <ul className="space-y-2">
              {r.reqs.map((req) => (
                <li key={req} className="flex items-start gap-2 font-body text-xs leading-relaxed text-white/60">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function InstallNotes() {
  return (
    <section aria-labelledby="install-title" className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
      <p className="font-body text-sm text-white/50">// Installation Notes</p>
      <h2 id="install-title" className="mt-3 font-heading text-3xl italic tracking-[-1px] text-white md:text-4xl">
        Installation tips
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            platform: 'Windows',
            tip: 'If Windows SmartScreen appears, click "More info" → "Run anyway". The app is unsigned but safe — source code is public on GitHub.',
          },
          {
            platform: 'macOS',
            tip: 'Drag Trajectory.app to your Applications folder after mounting the .dmg. On first launch right-click → Open to bypass Gatekeeper.',
          },
          {
            platform: 'Linux (AppImage)',
            tip: 'After downloading, mark the file as executable: chmod +x Trajectory-*.AppImage, then run it directly. No installation required.',
          },
          {
            platform: 'Android',
            tip: 'Enable "Install unknown apps" for your browser or file manager when Android prompts you. Google Play distribution is planned for a future release.',
          },
        ].map((n) => (
          <div key={n.platform} className="rounded-[1rem] border border-white/8 bg-white/[0.02] p-5">
            <h3 className="font-heading text-base italic text-white">{n.platform}</h3>
            <p className="mt-2 font-body text-xs leading-relaxed text-white/60">{n.tip}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportStrip() {
  return (
    <section aria-label="Support" className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
      <div className="mx-auto flex max-w-4xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-heading text-2xl italic text-white">Need help installing?</h2>
          <p className="mt-1 font-body text-sm text-white/60">
            The FAQ covers installation, account sync and troubleshooting.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/faq"
            className="liquid-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm text-white/90 transition-colors hover:text-white">
            FAQ
          </Link>
          <Link to="/contact"
            className="liquid-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm text-white/90 transition-colors hover:text-white">
            Contact support
          </Link>
          <a href={`https://github.com/${SITE.githubRepo}/issues`} target="_blank" rel="noopener noreferrer"
            className="liquid-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm text-white/90 transition-colors hover:text-white">
            Report a bug <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function DownloadsPage() {
  useDocumentTitle(
    'Downloads',
    'Download Trajectory for Windows, macOS, Linux, Android and iOS. Free to download — practice offline.',
  );
  const release = useLatestRelease(SITE.githubRepo);
  const [device, setDevice] = useState<Device>('other');
  useEffect(() => { setDevice(detectDevice()); }, []);

  const ghBase = `https://github.com/${SITE.githubRepo}/releases/latest`;

  const specs: PlatformSpec[] = [
    {
      id: 'windows',
      label: 'Windows',
      icon: <WindowsIcon className="h-5 w-5 text-white/80" />,
      formats: '.exe (NSIS installer)',
      note: 'Requires Windows 10 (64-bit) or later. If Windows SmartScreen appears, choose "More info" → "Run anyway".',
      asset: release ? release.windows : undefined,
      fallbackHref: ghBase,
    },
    {
      id: 'mac',
      label: 'macOS',
      icon: <AppleIcon className="h-5 w-5 text-white/80" />,
      formats: '.dmg (disk image)',
      note: 'Requires macOS 11 Big Sur or later. Drag the app to your Applications folder after mounting.',
      asset: release ? release.mac : undefined,
      fallbackHref: ghBase,
    },
    {
      id: 'linux',
      label: 'Linux',
      icon: <LinuxIcon className="h-5 w-5 text-white/80" />,
      formats: '.AppImage / .deb',
      note: 'AppImage runs on any modern distribution. .deb targets Debian, Ubuntu and derivatives. Make the AppImage executable with chmod +x.',
      asset: release ? (release.linux ?? release.linuxDeb) : undefined,
      fallbackHref: ghBase,
    },
    {
      id: 'android',
      label: 'Android',
      icon: <AndroidIcon className="h-5 w-5 text-white/80" />,
      formats: '.apk (sideload)',
      note: 'Requires Android 7.0+. Enable "Install unknown apps" for your browser or file manager when Android asks.',
      asset: release ? release.android : undefined,
      fallbackHref: ghBase,
    },
    {
      id: 'ios',
      label: 'iOS',
      icon: <AppleIcon className="h-5 w-5 text-white/80" />,
      formats: 'App Store / TestFlight',
      note: SITE.appStoreUrl || SITE.testFlightUrl
        ? 'Install from the App Store or join via TestFlight for early access.'
        : 'App Store submission is in progress. Use Safari\'s "Add to Home Screen" for a PWA experience in the meantime.',
      asset: undefined,
      storeUrl: SITE.appStoreUrl || SITE.testFlightUrl || undefined,
      storeLabel: SITE.appStoreUrl ? 'App Store' : SITE.testFlightUrl ? 'Join TestFlight' : undefined,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <LandingLayout
        label="// Downloads"
        title="Download Trajectory"
        subtitle={
          isLoaded(release)
            ? `Available on five platforms. Latest release: ${release.version}.`
            : 'Available on five platforms. Practice offline, sync your progress when you reconnect.'
        }
      >
        <section id="platform-downloads" aria-labelledby="platform-title"
          className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(80,50,255,0.07),transparent_70%)]" aria-hidden />
          <h2 id="platform-title" className="sr-only">Platform downloads</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {specs.map((s) => (
              <PlatformCard
                key={s.id}
                spec={s}
                detected={device === s.id || (s.id === 'linux' && device === 'linux')}
              />
            ))}
          </div>

          {release === null && (
            <p className="mt-6 font-body text-sm text-white/40">Loading release information…</p>
          )}
          {release === false && (
            <p className="mt-6 font-body text-sm text-white/40">
              Release information unavailable.{' '}
              <a href={ghBase} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">
                View on GitHub
              </a>
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={ghBase} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-sm text-white/50 transition-colors hover:text-white/80">
              All releases on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link to="/release-notes"
              className="inline-flex items-center gap-2 font-body text-sm text-white/50 transition-colors hover:text-white/80">
              Release notes <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <InstallNotes />
        <SystemRequirements />
        <SupportStrip />
      </LandingLayout>
    </MotionConfig>
  );
}

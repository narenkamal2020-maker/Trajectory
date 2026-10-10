import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { WindowsIcon, AppleIcon, LinuxIcon, AndroidIcon, ArrowUpRight } from '../../landing/icons';
import { SITE } from '../../config/site';
import { LandingLayout } from './LandingLayout';

type Platform = 'windows' | 'macos' | 'linux' | 'android' | 'ios';

interface Step {
  title: string;
  body: string;
  code?: string;
}

interface Issue {
  symptom: string;
  fix: string;
  code?: string;
}

interface Guide {
  id: Platform;
  label: string;
  icon: React.ReactNode;
  tagline: string;
  requirements: string[];
  steps: Step[];
  issues: Issue[];
}

const GUIDES: Guide[] = [
  {
    id: 'windows',
    label: 'Windows',
    icon: <WindowsIcon className="h-5 w-5" />,
    tagline: 'Runs as a native desktop application on Windows 10 and 11.',
    requirements: [
      'Windows 10 (64-bit) or Windows 11',
      '4 GB RAM (8 GB recommended for Python sandbox)',
      '300 MB free disk space',
      'Internet connection for first sign-in and sync',
    ],
    steps: [
      {
        title: 'Download the installer',
        body: 'Go to the Downloads page and click the Windows download button. The file is named Trajectory Setup <version>.exe.',
      },
      {
        title: 'Run the installer',
        body: 'Double-click the downloaded .exe file. If Windows SmartScreen appears with a blue warning dialog, click "More info" and then "Run anyway". The app is unsigned but the source code is public on GitHub.',
      },
      {
        title: 'Follow the setup wizard',
        body: 'The NSIS installer walks you through selecting an install location and creating a Start Menu shortcut. Default options work for most users.',
      },
      {
        title: 'Sign in or create an account',
        body: 'Launch Trajectory from the Start Menu or desktop shortcut. Use the same account as the web or mobile app to sync your progress.',
      },
      {
        title: 'Download the offline question bank (optional)',
        body: 'Open Settings → Offline. Download the question bank to practice without an internet connection. JavaScript runs locally in the app; Python and SQL require the desktop app and run in a local sandbox.',
      },
    ],
    issues: [
      {
        symptom: 'SmartScreen blocks the installer',
        fix: 'Click "More info" in the blue dialog, then "Run anyway". This warning appears because the installer is not code-signed. The source is public on GitHub.',
      },
      {
        symptom: 'The app does not start after installation',
        fix: 'Right-click the shortcut and choose "Run as administrator" once. If that fails, reinstall and ensure no antivirus is blocking the install directory.',
      },
      {
        symptom: 'Progress is not syncing',
        fix: 'Check your internet connection and verify the API URL in Settings → Advanced matches the backend endpoint. Sign out and back in if the session is stale.',
      },
    ],
  },
  {
    id: 'macos',
    label: 'macOS',
    icon: <AppleIcon className="h-5 w-5" />,
    tagline: 'Runs on Apple Silicon and Intel Macs as a universal binary.',
    requirements: [
      'macOS 11 Big Sur or later',
      'Apple Silicon (M1/M2/M3) or Intel (64-bit) — universal binary',
      '300 MB free disk space',
      'Internet connection for first sign-in and sync',
    ],
    steps: [
      {
        title: 'Download the disk image',
        body: 'Go to the Downloads page and click the macOS download button. The file is named Trajectory-<version>.dmg.',
      },
      {
        title: 'Open the disk image',
        body: 'Double-click the .dmg file to mount it. A window opens with the Trajectory app and an Applications folder shortcut.',
      },
      {
        title: 'Drag to Applications',
        body: 'Drag Trajectory.app into the Applications folder. This copies the app — do not run it directly from the disk image.',
      },
      {
        title: 'Allow the app on first launch',
        body: 'On the first open, macOS Gatekeeper will block the app because it is not notarised. Right-click (or Ctrl+click) the app in Applications and choose Open, then click Open in the dialog. You only need to do this once.',
      },
      {
        title: 'Sign in and sync',
        body: 'Sign in with your account. Your practice history, skills and readiness score sync automatically whenever you are online.',
      },
    ],
    issues: [
      {
        symptom: '"Trajectory cannot be opened because the developer cannot be verified"',
        fix: 'Right-click (or Ctrl+click) the app in Applications and choose Open. Click Open in the dialog. Alternatively, open System Settings → Privacy & Security, scroll to the Security section and click Open Anyway.',
      },
      {
        symptom: 'App is damaged and can\'t be opened',
        fix: 'This happens when the quarantine attribute is set incorrectly. Open Terminal and run: xattr -cr /Applications/Trajectory.app then try launching again.',
        code: 'xattr -cr /Applications/Trajectory.app',
      },
      {
        symptom: 'Disk image will not mount',
        fix: 'Make sure the download completed fully. Try re-downloading from the Downloads page.',
      },
    ],
  },
  {
    id: 'linux',
    label: 'Linux',
    icon: <LinuxIcon className="h-5 w-5" />,
    tagline: 'Distributed as an AppImage (any distro) and a .deb package (Debian/Ubuntu).',
    requirements: [
      'Ubuntu 20.04+, Fedora 35+, Debian 11+, or any glibc 2.31+ distribution',
      'FUSE v2 or v3 for AppImage',
      '300 MB free disk space',
      'Internet connection for first sign-in and sync',
    ],
    steps: [
      {
        title: 'Download the AppImage or .deb',
        body: 'Go to the Downloads page. Download the AppImage for any modern Linux distribution, or the .deb package if you are on Debian, Ubuntu or a derivative.',
      },
      {
        title: 'AppImage: make it executable and run',
        body: 'Mark the AppImage as executable, then run it directly. No installation required.',
        code: 'chmod +x Trajectory-*.AppImage\n./Trajectory-*.AppImage',
      },
      {
        title: '.deb package: install with dpkg',
        body: 'Install the .deb with dpkg. If dependencies are missing, apt will resolve them.',
        code: 'sudo dpkg -i trajectory_*.deb\nsudo apt-get install -f   # fix any missing deps',
      },
      {
        title: 'AppImage: install FUSE if needed',
        body: 'If the AppImage fails to run with a FUSE error, install FUSE for your distribution.',
        code: '# Debian/Ubuntu\nsudo apt install fuse libfuse2\n\n# Fedora\nsudo dnf install fuse fuse-libs',
      },
      {
        title: 'Sign in and sync',
        body: 'Launch Trajectory and sign in with your account. Progress syncs when you have an internet connection.',
      },
    ],
    issues: [
      {
        symptom: 'AppImage will not run — "FUSE not found"',
        fix: 'Install FUSE: sudo apt install fuse libfuse2 (Debian/Ubuntu) or sudo dnf install fuse (Fedora). If FUSE v2 is unavailable on newer Ubuntu, try: sudo add-apt-repository universe && sudo apt install libfuse2',
        code: 'sudo apt install fuse libfuse2',
      },
      {
        symptom: 'AppImage runs but the window does not appear',
        fix: 'Try launching with the --no-sandbox flag: ./Trajectory-*.AppImage --no-sandbox',
        code: './Trajectory-*.AppImage --no-sandbox',
      },
      {
        symptom: '.deb install fails with dependency errors',
        fix: 'After dpkg -i, run sudo apt-get install -f to let apt resolve and install the missing dependencies.',
        code: 'sudo apt-get install -f',
      },
    ],
  },
  {
    id: 'android',
    label: 'Android',
    icon: <AndroidIcon className="h-5 w-5" />,
    tagline: 'A native Capacitor app for Android 7.0 and later, distributed as an APK.',
    requirements: [
      'Android 7.0 (API 24) or later',
      '2 GB RAM or more',
      '150 MB free storage',
      '"Install unknown apps" permission enabled for your browser or file manager',
    ],
    steps: [
      {
        title: 'Download the APK',
        body: 'On your Android device, go to the Downloads page and tap the Android download button. The file is named trajectory-android-<version>.apk. Download it in Chrome or your default browser.',
      },
      {
        title: 'Allow installs from unknown sources',
        body: 'Android will ask for permission the first time you install an APK outside Google Play. Tap "Settings" in the prompt and enable "Allow from this source" for the browser or file manager you used.',
      },
      {
        title: 'Open and install the APK',
        body: 'Tap the downloaded APK in your notifications or open it from Downloads. Tap Install. The installation takes a few seconds.',
      },
      {
        title: 'Sign in',
        body: 'Launch Trajectory from your app drawer and sign in. Your progress syncs with the web and desktop apps.',
      },
      {
        title: 'Download the offline question bank (optional)',
        body: 'Go to Settings → Offline inside the app and download the question bank to practice without a network connection.',
      },
    ],
    issues: [
      {
        symptom: '"Install blocked" — app not installed',
        fix: 'Go to Settings → Apps → Special app access → Install unknown apps. Find the app you used to download the APK (e.g. Chrome) and enable "Allow from this source".',
      },
      {
        symptom: 'APK downloaded but nothing happens when I tap it',
        fix: 'Long-press the download notification and choose Open. If that fails, open the Files app, navigate to Downloads, and tap the .apk file.',
      },
      {
        symptom: 'App crashes on launch',
        fix: 'Force-stop the app (Settings → Apps → Trajectory → Force Stop), clear the cache, then relaunch. If the problem persists, uninstall and reinstall from the Downloads page.',
      },
    ],
  },
  {
    id: 'ios',
    label: 'iOS',
    icon: <AppleIcon className="h-5 w-5" />,
    tagline: 'Available via TestFlight and the App Store. Use Safari to add the PWA while the native app is in review.',
    requirements: [
      'iOS 15 or iPadOS 15 or later',
      'iPhone 8 or any iPad released 2017 or later',
      'Safari for the PWA install option',
    ],
    steps: [
      {
        title: 'Check TestFlight or App Store availability',
        body: `Check the Downloads page for current iOS availability. If a TestFlight or App Store link is shown, tap it on your device to install the native app. Native iOS distribution is gated on Apple review timelines.`,
      },
      {
        title: 'Install as a PWA (available now)',
        body: 'Open the Trajectory website in Safari on your iPhone or iPad. Tap the Share button (the square with an arrow) and choose "Add to Home Screen". Give it a name and tap Add.',
      },
      {
        title: 'Sign in',
        body: 'Open Trajectory from your Home Screen and sign in. The PWA stores your session and caches the interface for offline viewing.',
      },
    ],
    issues: [
      {
        symptom: '"Add to Home Screen" is missing in Safari',
        fix: 'Make sure you are using Safari, not Chrome or Firefox — "Add to Home Screen" is a Safari-only feature on iOS. Tap the Share icon (bottom of the screen) and scroll down to find it.',
      },
      {
        symptom: 'The PWA icon looks blank after install',
        fix: 'Remove the Home Screen shortcut, return to Safari, wait for the page to fully load, then add it again.',
      },
    ],
  },
];

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-white/5 px-4 py-3 font-mono text-xs text-white/80 border border-white/8">
      {code}
    </pre>
  );
}

function PlatformGuide({ guide }: { guide: Guide }) {
  return (
    <div className="space-y-10">
      {/* Requirements */}
      <div>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-white/40">System requirements</h3>
        <ul className="mt-4 space-y-2">
          {guide.requirements.map((r) => (
            <li key={r} className="flex items-start gap-3 font-body text-sm leading-relaxed text-white/70">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Installation steps */}
      <div>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-white/40">Installation</h3>
        <ol className="mt-4 space-y-6">
          {guide.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 font-mono text-xs text-white/50">
                {i + 1}
              </span>
              <div>
                <p className="font-body text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 font-body text-sm leading-relaxed text-white/60">{step.body}</p>
                {step.code && <CodeBlock code={step.code} />}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Troubleshooting */}
      <div>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-white/40">Troubleshooting</h3>
        <div className="mt-4 space-y-4">
          {guide.issues.map((issue) => (
            <div key={issue.symptom}
              className="rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 space-y-2">
              <p className="font-body text-sm font-semibold text-white">{issue.symptom}</p>
              <p className="font-body text-sm leading-relaxed text-white/60">{issue.fix}</p>
              {issue.code && <CodeBlock code={issue.code} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlatformGuidesPage() {
  useDocumentTitle(
    'Platform Guides',
    'Step-by-step installation guides and troubleshooting for Trajectory on Windows, macOS, Linux, Android and iOS.',
  );

  const tabs: Array<{ id: Platform; label: string; icon: React.ReactNode }> = GUIDES.map((g) => ({
    id: g.id,
    label: g.label,
    icon: g.icon,
  }));

  const [active, setActive] = useState<Platform>('windows');
  const guide = GUIDES.find((g) => g.id === active)!;

  return (
    <MotionConfig reducedMotion="user">
      <LandingLayout
        label="// Platform Guides"
        title="Installation guides"
        subtitle="Step-by-step instructions and troubleshooting for each supported platform."
      >
        <section aria-label="Platform guides" className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
          {/* Platform tabs */}
          <div role="tablist" aria-label="Select platform"
            className="flex flex-wrap gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => setActive(t.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm font-medium transition-all cursor-pointer ${
                  active === t.id
                    ? 'bg-white text-black'
                    : 'border border-white/10 text-white/70 hover:text-white hover:border-white/20'
                }`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Active guide */}
          <div
            id={`panel-${guide.id}`}
            role="tabpanel"
            aria-label={`${guide.label} guide`}
            className="mt-10 max-w-3xl">
            <div className="mb-8">
              <h2 className="font-heading text-3xl italic tracking-[-1px] text-white">{guide.label}</h2>
              <p className="mt-2 font-body text-base leading-relaxed text-white/60">{guide.tagline}</p>
            </div>
            <PlatformGuide guide={guide} />
          </div>
        </section>

        {/* Bottom links */}
        <section aria-label="More help" className="border-t border-white/5 px-6 py-16 md:px-16 lg:px-20">
          <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-2xl italic text-white">Still having trouble?</h2>
              <p className="mt-1 font-body text-sm text-white/60">
                Check the FAQ or open a GitHub issue with your platform and error details.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/faq"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                FAQ
              </Link>
              <Link to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Contact support
              </Link>
              <a href={`https://github.com/${SITE.githubRepo}/issues`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/80 transition-colors hover:text-white">
                Report a bug <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Link to="/downloads"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-colors hover:bg-white/90">
                Back to downloads
              </Link>
            </div>
          </div>
        </section>
      </LandingLayout>
    </MotionConfig>
  );
}

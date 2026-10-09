import { Smartphone, Monitor, Download, CheckCircle2, Info, Apple } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { platformKind } from '../lib/platform';
import { SITE } from '../config/site';
import type { DownloadItem } from '../lib/types';
import { Badge, Card, CardHeader, Spinner, cx } from './ui';

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
const DESKTOP_LABEL = { windows: 'Windows (.exe)', mac: 'macOS (.dmg)', linux: 'Linux (.AppImage)' } as const;

function DownloadButton({ item, primary }: { item: DownloadItem; primary: boolean }) {
  return (
    <a href={api.downloadUrl(item)} download={item.file}
      className={cx('inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
        primary ? 'bg-[var(--color-primary)] hover:bg-[var(--color-gold)] text-[var(--color-on-primary)] font-bold shadow-[0_0_16px_rgba(237,180,11,0.3)]'
          : 'bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-white border border-white/10')}>
      <Download className="w-4 h-4" />
      {item.platform === 'android' ? 'Download APK' : `Download for ${DESKTOP_LABEL[item.platform]}`}
      <span className="font-mono text-[11px] opacity-70">{mb(item.sizeBytes)}</span>
    </a>
  );
}

/** "Get the apps" card for Settings: Android APK + desktop installers published by the server. */
export function AppDownloads() {
  const { data, loading, error } = useAsync(() => api.downloads(), []);
  const device = detectDevice();
  const shell = platformKind();
  const android = data?.find((d) => d.platform === 'android');
  const desktop = (data ?? []).filter((d) => d.platform !== 'android');
  const isDesktopDevice = device === 'windows' || device === 'mac' || device === 'linux';
  const hasIosStore = !!(SITE.appStoreUrl || SITE.testFlightUrl);

  return (
    <Card>
      <CardHeader title="Get the apps" eyebrow="practice on your phone, or offline on your computer" />
      {loading && !data ? <Spinner label="Checking available downloads…" /> : error ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Downloads are unavailable right now ({error.message}).</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Android */}
          <section aria-labelledby="dl-android" className={cx('rounded-xl border p-4 space-y-3', device === 'android' ? 'border-[var(--color-gold-border)] bg-[var(--color-primary)]/5' : 'border-white/10 bg-[var(--color-surface-container-low)]')}>
            <div className="flex items-center justify-between gap-2">
              <h3 id="dl-android" className="flex items-center gap-2 font-headline font-bold text-white"><Smartphone className="w-4 h-4 text-[var(--color-primary)]" /> Android app</h3>
              {device === 'android' && shell !== 'mobile' && <Badge>for this device</Badge>}
            </div>
            {shell === 'mobile' && /android/i.test(navigator.userAgent) ? (
              <p className="flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 className="w-4 h-4" /> You're using the Android app.</p>
            ) : android ? (
              <>
                <DownloadButton item={android} primary={device === 'android'} />
                <p className="font-mono text-[11px] text-[var(--color-text-muted)]">Version {android.version ?? '—'} · updated {new Date(android.updatedAt).toLocaleDateString()}</p>
                <p className="flex gap-1.5 text-xs text-[var(--color-text-secondary)]"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Open the downloaded file on your phone and allow "Install unknown apps" for your browser when Android asks. Requires Android 7 or later.
                  {device !== 'android' && ' On a computer? Send this page to your phone and download it there.'}
                </p>
              </>
            ) : <p className="text-sm text-[var(--color-text-secondary)]">The Android app hasn't been published on this server yet.</p>}
            {device === 'ios' && <p className="text-xs text-[var(--color-text-muted)]">On iPhone, use Safari's Share → "Add to Home Screen" to install the web app.</p>}
          </section>

          {/* iOS */}
          <section aria-labelledby="dl-ios" className={cx('rounded-xl border p-4 space-y-3', device === 'ios' ? 'border-[var(--color-gold-border)] bg-[var(--color-primary)]/5' : 'border-white/10 bg-[var(--color-surface-container-low)]')}>
            <div className="flex items-center justify-between gap-2">
              <h3 id="dl-ios" className="flex items-center gap-2 font-headline font-bold text-white"><Apple className="w-4 h-4 text-[var(--color-primary)]" /> iOS app</h3>
              {device === 'ios' && shell !== 'mobile' && <Badge>for this device</Badge>}
            </div>
            {shell === 'mobile' && /iphone|ipad|ipod/i.test(navigator.userAgent) ? (
              <p className="flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 className="w-4 h-4" /> You're using the iOS app.</p>
            ) : hasIosStore ? (
              <>
                {SITE.appStoreUrl && (
                  <a href={SITE.appStoreUrl} target="_blank" rel="noopener noreferrer"
                    className={cx('inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all font-bold',
                      device === 'ios' ? 'bg-[var(--color-primary)] hover:bg-[var(--color-gold)] text-[var(--color-on-primary)] shadow-[0_0_16px_rgba(237,180,11,0.3)]'
                        : 'bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-white border border-white/10')}>
                    <Apple className="w-4 h-4" /> App Store
                  </a>
                )}
                {SITE.testFlightUrl && (
                  <a href={SITE.testFlightUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-white border border-white/10 transition-all">
                    TestFlight (beta)
                  </a>
                )}
                <p className="flex gap-1.5 text-xs text-[var(--color-text-secondary)]"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Requires iOS 15 or later. iPhone 8 or newer.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--color-text-secondary)]">App Store submission is in progress. In the meantime, open Trajectory in Safari and use Share → "Add to Home Screen" for a web app experience.</p>
                <p className="flex gap-1.5 text-xs text-[var(--color-text-muted)]"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  The PWA works fully offline once loaded. Sign in once, then practice anywhere.
                </p>
              </>
            )}
          </section>

          {/* Desktop */}
          <section aria-labelledby="dl-desktop" className={cx('rounded-xl border p-4 space-y-3 md:col-span-2', isDesktopDevice && shell !== 'desktop' ? 'border-[var(--color-gold-border)] bg-[var(--color-primary)]/5' : 'border-white/10 bg-[var(--color-surface-container-low)]')}>
            <div className="flex items-center justify-between gap-2">
              <h3 id="dl-desktop" className="flex items-center gap-2 font-headline font-bold text-white"><Monitor className="w-4 h-4 text-[var(--color-primary)]" /> Desktop app</h3>
              {isDesktopDevice && shell !== 'desktop' && <Badge>for this device</Badge>}
            </div>
            {shell === 'desktop' ? (
              <p className="flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 className="w-4 h-4" /> You're using the desktop app.</p>
            ) : desktop.length ? (
              <>
                <div className="flex flex-col gap-2 items-start">
                  {[...desktop].sort((a, b) => Number(b.platform === device) - Number(a.platform === device)).map((d) => (
                    <DownloadButton key={d.file} item={d} primary={d.platform === device} />
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">Runs JavaScript, Python and SQL locally, so you can keep practicing offline — your work syncs when you reconnect.</p>
                {desktop.some((d) => d.platform === 'windows') && (
                  <p className="flex gap-1.5 text-xs text-[var(--color-text-muted)]"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    If Windows SmartScreen appears, choose "More info" → "Run anyway" (the installer is not code-signed yet).
                  </p>
                )}
              </>
            ) : <p className="text-sm text-[var(--color-text-secondary)]">No desktop installer has been published on this server yet.</p>}
          </section>
        </div>
      )}
    </Card>
  );
}

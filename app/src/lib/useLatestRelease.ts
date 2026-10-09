import { useEffect, useState } from 'react';

export interface PlatformAsset { url: string; size: number; filename: string }

export interface ReleaseInfo {
  version: string;
  name: string;
  date: string;
  notes: string;
  windows?: PlatformAsset;
  mac?: PlatformAsset;
  linux?: PlatformAsset;
  linuxDeb?: PlatformAsset;
  android?: PlatformAsset;
}

export function parseAssets(
  assets: { name: string; browser_download_url: string; size: number }[],
): Partial<ReleaseInfo> {
  const r: Partial<ReleaseInfo> = {};
  for (const a of assets) {
    const n = a.name.toLowerCase();
    const asset: PlatformAsset = { url: a.browser_download_url, size: a.size, filename: a.name };
    if (n.endsWith('.exe') || n.endsWith('.msi')) r.windows = asset;
    else if (n.endsWith('.dmg')) r.mac = asset;
    else if (n.endsWith('.appimage')) r.linux = asset;
    else if (n.endsWith('.deb')) r.linuxDeb = asset;
    else if (n.endsWith('.apk')) r.android = asset;
  }
  return r;
}

export const isLoaded = (r: ReleaseInfo | null | false): r is ReleaseInfo =>
  r !== null && r !== false;

export function useLatestRelease(repo: string): ReleaseInfo | null | false {
  const [release, setRelease] = useState<ReleaseInfo | null | false>(null);
  useEffect(() => {
    const key = `gh_release_${repo}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) { setRelease(JSON.parse(cached)); return; }
    } catch {}
    fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setRelease(false); return; }
        const info: ReleaseInfo = {
          version: data.tag_name ?? '—',
          name: data.name ?? data.tag_name ?? '—',
          date: data.published_at ?? '',
          notes: data.body ?? '',
          ...parseAssets(data.assets ?? []),
        };
        setRelease(info);
        try { sessionStorage.setItem(key, JSON.stringify(info)); } catch {}
      })
      .catch(() => setRelease(false));
  }, [repo]);
  return release;
}

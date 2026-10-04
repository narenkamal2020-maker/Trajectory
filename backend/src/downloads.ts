/**
 * Public app downloads (Android APK, desktop installers).
 * Files are published into DOWNLOADS_DIR by `npm run downloads:publish`; anything else in the
 * folder is ignored, and only files present in the listing can be downloaded (no path traversal).
 */
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { env } from './config/env';

export type DownloadPlatform = 'android' | 'windows' | 'mac' | 'linux';

export interface DownloadItem {
  platform: DownloadPlatform;
  file: string;
  sizeBytes: number;
  version: string | null;
  updatedAt: string;
  url: string;
}

const PATTERNS: Array<[RegExp, DownloadPlatform]> = [
  [/\.apk$/i, 'android'],
  [/\.(exe|msi)$/i, 'windows'],
  [/\.dmg$/i, 'mac'],
  [/\.(AppImage|deb)$/i, 'linux'],
];

export const downloadsDir = () => path.resolve(env.DOWNLOADS_DIR);

export function listDownloads(dir = downloadsDir()): DownloadItem[] {
  if (!fs.existsSync(dir)) return [];
  const items: DownloadItem[] = [];
  for (const file of fs.readdirSync(dir)) {
    const platform = PATTERNS.find(([re]) => re.test(file))?.[1];
    if (!platform) continue;
    const stat = fs.statSync(path.join(dir, file));
    if (!stat.isFile()) continue;
    items.push({
      platform,
      file,
      sizeBytes: stat.size,
      version: /(\d+\.\d+(?:\.\d+)?)/.exec(file)?.[1] ?? null,
      updatedAt: stat.mtime.toISOString(),
      url: `/api/downloads/${encodeURIComponent(file)}`,
    });
  }
  items.push(...externalDownloads());
  // Newest first per platform.
  return items.sort((a, b) => a.platform.localeCompare(b.platform) || b.updatedAt.localeCompare(a.updatedAt));
}

/** Installers hosted elsewhere (DOWNLOAD_URLS). Size is unknown, so it is reported as 0. */
export function externalDownloads(list = env.DOWNLOAD_URLS): DownloadItem[] {
  const items: DownloadItem[] = [];
  for (const raw of (list ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    let url: URL;
    try { url = new URL(raw); } catch { continue; }
    if (url.protocol !== 'https:') continue;
    const file = decodeURIComponent(url.pathname.split('/').pop() ?? '');
    const platform = PATTERNS.find(([re]) => re.test(file))?.[1];
    if (!platform) continue;
    items.push({ platform, file, sizeBytes: 0, version: /(\d+\.\d+(?:\.\d+)?)/.exec(file)?.[1] ?? null, updatedAt: new Date(0).toISOString(), url: url.toString() });
  }
  return items;
}

export const downloadsRouter = Router();

downloadsRouter.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.json(listDownloads());
});

downloadsRouter.get('/:file', (req, res) => {
  const item = listDownloads().find((d) => d.file === req.params.file && d.url.startsWith('/api/'));
  if (!item) return res.status(404).json({ statusCode: 404, message: 'Download not found' });
  if (item.platform === 'android') res.type('application/vnd.android.package-archive');
  res.download(path.join(downloadsDir(), item.file), item.file);
});

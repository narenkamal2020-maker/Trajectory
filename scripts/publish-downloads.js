#!/usr/bin/env node
/**
 * Copy built app installers into the API's downloads folder (served at /api/downloads).
 *   node scripts/publish-downloads.js [targetDir]     (default: backend/downloads)
 *
 * Build first:
 *   Android: cd app && npm run cap:sync && cd android && ./gradlew assembleDebug (or assembleRelease)
 *   Desktop: cd desktop && npm run dist
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.resolve(process.argv[2] || path.join(root, 'backend', 'downloads'));
fs.mkdirSync(target, { recursive: true });

const published = [];
function publish(src, name, platformRe) {
  if (!src || !fs.existsSync(src)) return;
  // Replace older builds for the same platform.
  for (const f of fs.readdirSync(target)) if (platformRe.test(f) && f !== name) fs.rmSync(path.join(target, f));
  fs.copyFileSync(src, path.join(target, name));
  published.push(`${name} (${(fs.statSync(src).size / 1048576).toFixed(1)} MB)`);
}

// ── Android ──
const gradle = path.join(root, 'app/android/app/build.gradle');
const apkVersion = fs.existsSync(gradle) ? (/versionName\s+"([^"]+)"/.exec(fs.readFileSync(gradle, 'utf8'))?.[1] ?? '1.0') : '1.0';
const apkDir = path.join(root, 'app/android/app/build/outputs/apk');
const apk = ['release/app-release.apk', 'debug/app-debug.apk'].map((p) => path.join(apkDir, p)).find((p) => fs.existsSync(p));
publish(apk, `trajectory-android-${apkVersion}.apk`, /^trajectory-android-.*\.apk$/);

// ── Desktop ──
const desktopPkg = path.join(root, 'desktop/package.json');
const desktopVersion = fs.existsSync(desktopPkg) ? require(desktopPkg).version : '1.0.0';
const dist = path.join(root, 'desktop/dist');
const find = (re) => (fs.existsSync(dist) ? fs.readdirSync(dist).find((f) => re.test(f) && !f.endsWith('.blockmap')) : undefined);
const win = find(/\.exe$/i), mac = find(/\.dmg$/i), linux = find(/\.AppImage$/i);
if (win) publish(path.join(dist, win), `trajectory-desktop-windows-${desktopVersion}.exe`, /^trajectory-desktop-windows-.*\.exe$/);
if (mac) publish(path.join(dist, mac), `trajectory-desktop-mac-${desktopVersion}.dmg`, /^trajectory-desktop-mac-.*\.dmg$/);
if (linux) publish(path.join(dist, linux), `trajectory-desktop-linux-${desktopVersion}.AppImage`, /^trajectory-desktop-linux-.*\.AppImage$/);

console.log(published.length ? `Published to ${target}:\n  ${published.join('\n  ')}` : 'Nothing to publish — build the Android APK and/or desktop installer first.');

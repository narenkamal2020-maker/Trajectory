/**
 * Trajectory desktop shell.
 *  - Loads the bundled web app from disk (works fully offline).
 *  - Exposes a local, sandboxed code runner (JavaScript, Python, SQL) to the renderer over IPC,
 *    reusing the exact executor the API server uses.
 *  - Stores the refresh token encrypted with the OS keychain (safeStorage).
 */
const { app, BrowserWindow, ipcMain, safeStorage, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { CodeRunner } = require('./executor/runner');

const PYTHON = process.env.TRAJECTORY_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

/** Use Node's permission sandbox if this Electron's embedded Node supports it. */
function sandboxFlags() {
  const r = spawnSync(process.execPath, ['--permission', '-e', 'process.exit(0)'], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, timeout: 10000,
  });
  return r.status === 0 ? ['--permission'] : [];
}

let runner;
function getRunner() {
  if (!runner) {
    runner = new CodeRunner({
      nodeBin: process.execPath,
      pythonBin: PYTHON,
      maxConcurrency: 2,
      extraEnv: { ELECTRON_RUN_AS_NODE: '1' },
      jsSandboxFlags: sandboxFlags(),
    });
  }
  return runner;
}

// ── Secure storage ──
const storeFile = () => path.join(app.getPath('userData'), 'secure.json');
function readStore() {
  try { return JSON.parse(fs.readFileSync(storeFile(), 'utf8')); } catch { return {}; }
}
ipcMain.handle('secure:get', (_e, key) => {
  const v = readStore()[key];
  if (!v) return null;
  try {
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(v, 'base64')) : null;
  } catch { return null; }
});
ipcMain.handle('secure:set', (_e, key, value) => {
  const s = readStore();
  if (value === null || !safeStorage.isEncryptionAvailable()) delete s[key];
  else s[key] = safeStorage.encryptString(String(value)).toString('base64');
  fs.writeFileSync(storeFile(), JSON.stringify(s), { mode: 0o600 });
});

// ── Local execution ──
ipcMain.handle('code:run', async (_e, req) => {
  if (!req || typeof req.code !== 'string' || req.code.length > 50000) throw new Error('Invalid request');
  if (!Array.isArray(req.tests) || req.tests.length > 50) throw new Error('Invalid tests');
  return getRunner().run({ ...req, timeLimitMs: Math.min(Number(req.timeLimitMs) || 2000, 10000) });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 380,
    backgroundColor: '#0b0e18',
    title: 'Trajectory',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // External links open in the system browser; the app never navigates away from its own files.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); } });
  win.loadFile(path.join(__dirname, 'web', 'index.html'), { hash: '/dashboard' });
  return win;
}

async function selfTest() {
  // Headless verification used in CI: run a Python and a JS solution through the local executor.
  const meta = { functionName: 'add', params: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }], returnType: 'int' };
  const tests = [{ id: 't1', args: [2, 3], expected: 5 }, { id: 't2', args: [-1, 1], expected: 0 }];
  const js = await getRunner().run({ language: 'javascript', code: 'function add(a,b){return a+b}', tests, timeLimitMs: 2000, code_meta: meta });
  const py = await getRunner().run({ language: 'python', code: 'def add(a, b):\n    return a + b', tests, timeLimitMs: 2000, code_meta: meta });
  const sandboxed = (getRunner().opts.jsSandboxFlags || []).length > 0;
  console.log(JSON.stringify({ js: js.verdict, py: py.verdict, jsSandbox: sandboxed, web: fs.existsSync(path.join(__dirname, 'web', 'index.html')) }));
  app.exit(js.verdict === 'ACCEPTED' && py.verdict === 'ACCEPTED' ? 0 : 1);
}

app.whenReady().then(() => {
  if (process.argv.includes('--selftest')) return selfTest();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] },
    { role: 'windowMenu' },
  ]));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Exposes a minimal, typed bridge to the renderer (see app/src/lib/platform.ts: DesktopBridge).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('trajectoryDesktop', {
  platform: 'desktop',
  version: '1.0.0',
  runCode: (req) => ipcRenderer.invoke('code:run', req),
  secureGet: (key) => ipcRenderer.invoke('secure:get', key),
  secureSet: (key, value) => ipcRenderer.invoke('secure:set', key, value),
});

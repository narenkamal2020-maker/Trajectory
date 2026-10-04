import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { platformKind } from './lib/platform'
import { applyTheme, readThemeMode } from './lib/theme'

// Apply the saved theme before first paint (no flash of the wrong mode).
applyTheme(readThemeMode())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Installable PWA + offline app shell (web only; desktop/mobile shells bundle the assets).
if (import.meta.env.PROD && platformKind() === 'web' && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => undefined) })
}

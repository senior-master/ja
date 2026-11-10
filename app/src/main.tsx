import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// --- PWA Auto-Update Logic ---
const intervalMS = 60 * 60 * 1000 // Check every 60 minutes (or use 60 * 1000 for 1 minute during testing)

registerSW({
  onRegisteredSW(swUrl, r) {
    if (r) {
      // 1. Periodic check while the app is open
      setInterval(async () => {
        if (!r.installing && navigator && !navigator.onLine) return;
        
        try {
          // Fetch the SW file with cache bypass to check for changes
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'cache': 'no-store', 'cache-control': 'no-cache' },
          });
          if (resp?.status === 200) await r.update();
        } catch (err) {
          console.warn('SW update check failed:', err);
        }
      }, intervalMS);

      // 2. Check immediately when the app comes back to the foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update();
        }
      });
    }
  },
  onNeedReload() {
    // Because registerType is 'autoUpdate', this is called when a new SW takes over.
    // The default behavior is to reload the page, but we can be explicit:
    window.location.reload();
  }
});
// --- End PWA Auto-Update Logic ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)

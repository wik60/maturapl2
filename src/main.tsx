import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createStore } from './store/store';
import { StoreContext } from './store/useStore';
import { createSync } from './sync/engine';
import { SyncContext } from './sync/useSync';
import { safeLocalStorage } from './store/storage';
import './styles.css';

const store = createStore();
const inFrame = (() => { try { return window.top !== window.self; } catch { return true; } })();
const sync = createSync({ store, kv: safeLocalStorage(), blockedByHost: inFrame }); // embedded previews (e.g. the claude.ai viewer) block outbound requests
(globalThis as unknown as { __mq?: unknown; __mqSync?: unknown }).__mq = store; // handy for debugging & e2e checks
(globalThis as unknown as { __mqSync?: unknown }).__mqSync = sync;
void sync.start();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreContext.Provider value={store}>
      <SyncContext.Provider value={sync}>
        <App />
      </SyncContext.Provider>
    </StoreContext.Provider>
  </StrictMode>,
);

// Service worker: only where supported and allowed (HTTPS / localhost, not sandboxed previews).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* e.g. inside a sandboxed iframe – the app still works online */
    });
  });
}

import { useEffect, useState } from 'react';
import { isIOS } from '../../audio/speech';
import { useSyncView } from '../../sync/useSync';
import { Link } from '../../router/router';

/**
 * "Add to home screen".
 * iOS has no install API, so Safari users get short illustrated steps.
 * Chromium browsers (Android, desktop) fire `beforeinstallprompt`, which we capture
 * early (see captureInstallPrompt in main.tsx) and replay from a real button.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: fullscreen)').matches;
}

const inFrame = () => { try { return window.top !== window.self; } catch { return true; } };

type Platform = 'ios-safari' | 'ios-other' | 'ios-inapp' | 'prompt' | 'other';

function platform(): Platform {
  const ua = navigator.userAgent;
  if (isIOS()) {
    if (/FBAN|FBAV|Instagram|Line\/|Messenger|TikTok|Snapchat/i.test(ua)) return 'ios-inapp';
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return 'ios-other';
    return 'ios-safari';
  }
  return deferred ? 'prompt' : 'other';
}

const DISMISS_KEY = 'matura-quest:install-dismissed';

function readDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-4px' }}>
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" style={{ verticalAlign: '-4px' }}>
      <rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function Steps({ platform }: { platform: Platform }) {
  return (
    <>
      {platform === 'ios-safari' && (
        <ol className="install-steps">
          <li>Stuknij <strong>Udostępnij</strong> <ShareIcon /> w pasku Safari. W nowszym iOS może być ukryty pod przyciskiem <strong>•••</strong>.</li>
          <li>Przewiń listę i wybierz <strong>Dodaj do ekranu początkowego</strong> <AddIcon />.</li>
          <li>Stuknij <strong>Dodaj</strong> w prawym górnym rogu.</li>
        </ol>
      )}
      {platform === 'ios-other' && (
        <ol className="install-steps">
          <li>Stuknij <strong>Udostępnij</strong> <ShareIcon /> (w Chrome: przy pasku adresu).</li>
          <li>Wybierz <strong>Dodaj do ekranu początkowego</strong> <AddIcon />.</li>
          <li>Jeśli tej opcji nie ma, otwórz stronę w Safari i zrób to tam.</li>
        </ol>
      )}
      {platform === 'ios-inapp' && (
        <p className="notice" style={{ margin: 0 }}>Ta strona jest otwarta wewnątrz innej aplikacji. Stuknij menu (•••) i wybierz <strong>Otwórz w Safari</strong>, a potem dodaj grę do ekranu początkowego.</p>
      )}
      {platform === 'other' && (
        <p className="small" style={{ margin: 0 }}>Otwórz menu przeglądarki i wybierz <strong>Zainstaluj aplikację</strong> lub <strong>Dodaj do ekranu głównego</strong>.</p>
      )}

    </>
  );
}

export function useInstallState() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { installed: isStandalone(), embedded: inFrame(), platform: platform() };
}

export function InstallCard({ place }: { place: 'home' | 'profile' }) {
  const st = useInstallState();
  const sync = useSyncView();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [installing, setInstalling] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  if (st.embedded) return null;
  if (st.installed) {
    return place === 'profile' ? (
      <section className="card"><h2>Aplikacja na ekranie początkowym</h2><p style={{ margin: 0 }}>Używasz Matura Quest jako aplikacji. Gotowe!</p></section>
    ) : null;
  }
  if (place === 'home' && dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  const install = async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      deferred = null;
      setInstalling(false);
      listeners.forEach((l) => l());
    }
  };

  if (place === 'home') {
    return (
      <>
        <section className="card install-banner" aria-labelledby="inst-home">
          <span className="ti" aria-hidden="true"><AddIcon /></span>
          <div><h2 id="inst-home" style={{ fontSize: '0.95rem', margin: 0, fontFamily: 'var(--font-ui)' }}>Dodaj grę do ekranu początkowego</h2>Pełny ekran i nauka offline.</div>
          {st.platform === 'prompt'
            ? <button className="btn sm" onClick={install} disabled={installing}>Zainstaluj</button>
            : <button className="btn sm" onClick={() => setHowOpen(true)}>Jak?</button>}
          <button className="btn flat icon" onClick={dismiss} aria-label="Ukryj tę wskazówkę"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </section>
        {howOpen && (
          <>
            <div className="sheet-backdrop" onClick={() => setHowOpen(false)} />
            <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="inst-how">
              <div className="grab" />
              <h2 id="inst-how">Dodaj grę do ekranu początkowego</h2>
              <Steps platform={st.platform} />
              {isIOS() && <p className="small muted" style={{ margin: '0.7rem 0' }}>Aplikacja z ekranu początkowego ma osobny zapis niż Safari.{sync.email ? ' Zaloguj się w niej, a postęp przeniesie się sam.' : ' Żeby zabrać postęp, najpierw załóż konto w profilu, a potem zaloguj się w aplikacji.'}</p>}
              <button className="btn block" onClick={() => setHowOpen(false)}>Rozumiem</button>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <section className="card install" aria-labelledby={`inst-${place}`}>
      <div className="row between">
        <h2 id={`inst-${place}`} style={{ margin: 0 }}>Dodaj grę do ekranu początkowego</h2>
      </div>
      <p className="small" style={{ margin: '0.4rem 0 0.6rem' }}>Otworzysz ją jednym dotknięciem, na pełnym ekranie, także bez internetu.</p>

      <Steps platform={st.platform} />
      {st.platform === 'prompt' && (
        <button className="btn" onClick={install} disabled={installing}>Zainstaluj aplikację</button>
      )}
      {isIOS() && (
        <p className="small muted" style={{ margin: '0.6rem 0 0' }}>
          Aplikacja z ekranu początkowego ma osobny zapis niż Safari.
          {sync.email ? ' Jesteś zalogowany/zalogowana, więc postęp przeniesie się automatycznie po zalogowaniu w aplikacji.' : <> Żeby zabrać obecny postęp, najpierw <Link to="/profile">załóż konto</Link>, a potem zaloguj się w aplikacji.</>}
        </p>
      )}
    </section>
  );
}

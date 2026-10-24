import { useState } from 'react';
import { SyncError } from '../../sync/client';
import { validateConfig } from '../../sync/config';
import type { SyncStatus } from '../../sync/engine';
import { useSyncEngine, useSyncView } from '../../sync/useSync';
import { Dialog } from './ui';

const STATUS_PL: Record<SyncStatus, string> = {
  disabled: 'nie skonfigurowano',
  'signed-out': 'niezalogowany',
  syncing: 'synchronizuję…',
  synced: 'zsynchronizowano',
  pending: 'zmiany czekają na wysłanie',
  offline: 'offline – wyślę później',
  error: 'błąd synchronizacji',
  conflict: 'konflikt – wybierz wersję',
};

const time = (ts?: number) => (ts ? new Date(ts).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export function AccountSection() {
  const sync = useSyncEngine();
  const v = useSyncView();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null);
  const [cfgUrl, setCfgUrl] = useState('');
  const [cfgKey, setCfgKey] = useState('');

  if (!sync) return null;

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg({ tone: 'good', text: ok });
    } catch (e) {
      setMsg({ tone: e instanceof SyncError && e.kind === 'confirm-email' ? 'info' : 'bad', text: e instanceof Error ? e.message : 'Coś poszło nie tak.' });
    } finally {
      setBusy(false);
    }
  };

  const formValid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const saveConfig = () => {
    const err = validateConfig({ url: cfgUrl.trim(), anonKey: cfgKey.trim() });
    if (err) return setMsg({ tone: 'bad', text: err });
    sync.setConfig({ url: cfgUrl, anonKey: cfgKey });
    setMsg({ tone: 'good', text: 'Zapisano połączenie z projektem. Teraz zaloguj się lub załóż konto.' });
  };

  return (
    <section className="card" aria-labelledby="acc-title">
      <h2 id="acc-title">Konto i synchronizacja</h2>

      {v.blockedByHost && (
        <div className="notice" style={{ marginBottom: '0.75rem' }}>W tym podglądzie (claude.ai) przeglądarka blokuje połączenia z zewnętrznymi serwerami, więc synchronizacja nie zadziała. Działa w wersji wdrożonej na własnym adresie (np. Netlify, Vercel).</div>
      )}

      {!v.configured && (
        <>
          <p style={{ marginTop: 0 }}>Postęp zapisuje się tylko na tym urządzeniu. Aby mieć konto i ten sam postęp na telefonie i komputerze, połącz aplikację z projektem Supabase.</p>
          <details>
            <summary>Połącz z moim projektem Supabase</summary>
            <ol className="points-list small">
              <li>Załóż darmowy projekt na supabase.com.</li>
              <li>W SQL Editor uruchom plik <code>supabase/migrations/0001_user_progress.sql</code> z kodu aplikacji.</li>
              <li>W Project Settings → API skopiuj adres projektu i klucz <strong>anon / publishable</strong> (nigdy service_role).</li>
            </ol>
            <div className="stack" style={{ marginTop: '0.5rem' }}>
              <label className="small" htmlFor="sb-url">Adres projektu</label>
              <input id="sb-url" className="input" placeholder="https://xxxx.supabase.co" value={cfgUrl} onChange={(e) => setCfgUrl(e.target.value)} autoCapitalize="off" spellCheck={false} />
              <label className="small" htmlFor="sb-key">Klucz anon / publishable</label>
              <input id="sb-key" className="input" placeholder="eyJ… albo sb_publishable_…" value={cfgKey} onChange={(e) => setCfgKey(e.target.value)} autoCapitalize="off" spellCheck={false} />
              <button className="btn sm" onClick={saveConfig}>Połącz</button>
            </div>
          </details>
        </>
      )}

      {v.configured && v.status === 'signed-out' && (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (formValid) void run(() => sync.signIn(email, password)); }}>
          <p style={{ margin: 0 }}>Zaloguj się, żeby zapisywać postęp w chmurze. Twój obecny postęp (także jako gość) zostanie zachowany i wysłany na konto.</p>
          <label className="small" htmlFor="acc-email">E-mail</label>
          <input id="acc-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="small" htmlFor="acc-pass">Hasło</label>
          <input id="acc-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <button className="btn" type="submit" disabled={busy || !formValid}>Zaloguj się</button>
            <button className="btn quiet" type="button" disabled={busy || !formValid} onClick={() => run(async () => {
              const r = await sync.signUp(email, password);
              if (r === 'confirm-email') setMsg({ tone: 'info', text: 'Konto założone. Potwierdź adres e-mail (link w wiadomości), a potem zaloguj się tutaj.' });
            })}>Załóż konto</button>
          </div>
          <button className="btn quiet sm" type="button" disabled={busy || !/\S+@\S+\.\S+/.test(email)} onClick={() => run(() => sync.resetPassword(email) ?? Promise.resolve(), 'Jeśli konto istnieje, wysłaliśmy link do zmiany hasła.')}>Nie pamiętam hasła</button>
          <p className="small muted" style={{ margin: 0 }}>Hasło: co najmniej 6 znaków (lepiej 8+). Konto służy tylko do zapisu postępu.</p>
        </form>
      )}

      {v.configured && v.status !== 'signed-out' && v.email && (
        <div className="stack">
          <p style={{ margin: 0 }}>Zalogowano jako <strong>{v.email}</strong></p>
          <p className="small" style={{ margin: 0 }} aria-live="polite">
            Stan: <span className={`badge ${v.status === 'synced' ? 'good' : v.status === 'error' || v.status === 'conflict' ? 'bad' : ''}`}>{STATUS_PL[v.status]}</span>
            {v.lastSyncedAt && <span className="muted"> · ostatnio {time(v.lastSyncedAt)}</span>}
          </p>
          {v.messagePl && v.status !== 'synced' && <p className="small" style={{ margin: 0 }}>{v.messagePl}</p>}
          <div className="row">
            <button className="btn sm" disabled={busy || v.status === 'syncing'} onClick={() => run(() => sync.syncNow())}>Synchronizuj teraz</button>
            <button className="btn quiet sm" disabled={busy} onClick={() => run(() => sync.signOut())}>Wyloguj</button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>Zmiany wysyłamy automatycznie kilka sekund po nauce. Ustawienia (np. rozmiar tekstu) zostają osobne dla każdego urządzenia.</p>
        </div>
      )}

      {v.configSource === 'device' && (
        <button className="btn quiet sm" style={{ marginTop: '0.6rem' }} onClick={() => { sync.setConfig(undefined); setMsg({ tone: 'info', text: 'Odłączono projekt Supabase. Postęp zostaje na tym urządzeniu.' }); }}>Odłącz projekt Supabase</button>
      )}

      {msg && <div className={`notice ${msg.tone}`} role="status" style={{ marginTop: '0.6rem' }}>{msg.text}</div>}
    </section>
  );
}

export function ConflictDialog() {
  const sync = useSyncEngine();
  const v = useSyncView();
  const [busy, setBusy] = useState(false);
  if (!sync || v.status !== 'conflict' || !v.conflict) return null;
  const { local, remote, localOnly, remoteOnly } = v.conflict;
  const choose = async (c: 'local' | 'remote' | 'merge') => {
    setBusy(true);
    await sync.resolve(c);
    setBusy(false);
  };
  const row = (label: string, s: typeof local, only: number) => (
    <div className="card" style={{ padding: '0.7rem' }}>
      <strong>{label}</strong>
      <div className="small">{s.xp} XP · {s.answers} odpowiedzi · {s.levels} poziomów · {s.exams} arkuszy</div>
      <div className="small"><strong>{only}</strong> {only === 1 ? 'wynik, którego' : 'wyników, których'} nie ma w drugiej wersji</div>
      <div className="small muted">Ostatnia nauka: {s.lastActivity ? time(s.lastActivity) : 'brak'}</div>
    </div>
  );
  return (
    <Dialog open onClose={() => {}} title="Dwie różne wersje postępu" actions={<>
      <button className="btn quiet" disabled={busy} onClick={() => choose('remote')}>Zostaw wersję z chmury</button>
      <button className="btn quiet" disabled={busy} onClick={() => choose('local')}>Zostaw tę z urządzenia</button>
      <button className="btn" disabled={busy} onClick={() => choose('merge')}>Połącz obie</button>
    </>}>
      <p>Postęp na tym urządzeniu i w chmurze zmienił się niezależnie. Wybierz, co zachować.</p>
      <div className="stack">
        {row('Na tym urządzeniu', local, localOnly)}
        {row('W chmurze', remote, remoteOnly)}
      </div>
      <p className="small muted">„Połącz obie” zachowuje wszystkie odpowiedzi, błędy, słówka i ukończone poziomy z obu wersji; XP przyjmuje wyższą wartość.</p>
    </Dialog>
  );
}

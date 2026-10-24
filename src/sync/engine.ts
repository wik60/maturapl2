import { ensureDaily } from '../store/actions';
import { sanitize } from '../store/storage';
import type { Store } from '../store/store';
import type { AppState } from '../store/types';
import { createClient, type RemoteProgress, type Session, SyncError, type SupabaseClient } from './client';
import { buildTimeConfig, type SupabaseConfig } from './config';
import { isEmptyProgress, mergeStates, summarize } from './merge';

export const SYNC_KEY = 'matura-quest:sync';

export type SyncStatus = 'disabled' | 'signed-out' | 'syncing' | 'synced' | 'pending' | 'offline' | 'error' | 'conflict';

interface Persisted {
  config?: SupabaseConfig; // runtime override of the build-time config
  session?: Session;
  deviceId: string;
  remoteRevision: number | null; // revision this device last saw/wrote
  lastSyncedHash?: string;
  lastSyncedAt?: number;
}

export interface SyncView {
  status: SyncStatus;
  configured: boolean;
  configSource: 'build' | 'device' | null;
  email?: string;
  lastSyncedAt?: number;
  messagePl?: string;
  conflict?: { local: ReturnType<typeof summarize>; remote: ReturnType<typeof summarize>; remoteUpdatedAt: string; localOnly: number; remoteOnly: number };
  blockedByHost: boolean;
}

interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem?(k: string): void }

/** FNV-1a over the JSON snapshot – detects local changes since the last sync. */
export function hashState(s: AppState): string {
  const json = JSON.stringify(s);
  let h = 2166136261;
  for (let i = 0; i < json.length; i++) h = Math.imul(h ^ json.charCodeAt(i), 16777619);
  return `${(h >>> 0).toString(36)}-${json.length}`;
}

export interface SyncDeps {
  store: Store;
  kv: KV | null;
  fetchImpl?: typeof fetch;
  online?: () => boolean;
  /** Inside the claude.ai artifact viewer outbound requests are blocked by CSP. */
  blockedByHost?: boolean;
  debounceMs?: number;
}

export function createSync(deps: SyncDeps) {
  const { store, kv } = deps;
  const online = deps.online ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const debounceMs = deps.debounceMs ?? 4000;

  let p: Persisted = load();
  let view: SyncView = { status: 'signed-out', configured: false, configSource: null, blockedByHost: !!deps.blockedByHost };
  let pendingRemote: RemoteProgress | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function load(): Persisted {
    try {
      const raw = kv?.getItem(SYNC_KEY);
      if (raw) {
        const v = JSON.parse(raw) as Persisted;
        if (v && typeof v.deviceId === 'string') return v;
      }
    } catch { /* fall through */ }
    return { deviceId: `d-${Math.random().toString(36).slice(2, 10)}`, remoteRevision: null };
  }
  function persist() {
    try { kv?.setItem(SYNC_KEY, JSON.stringify(p)); } catch { /* storage full or blocked */ }
  }
  const config = (): SupabaseConfig | null => p.config ?? buildTimeConfig();
  let client: SupabaseClient | null = null;
  let clientFor = '';
  function getClient(): SupabaseClient | null {
    const c = config();
    if (!c) return null;
    const key = `${c.url}|${c.anonKey}`;
    if (!client || key !== clientFor) {
      client = createClient(c, deps.fetchImpl);
      clientFor = key;
    }
    return client;
  }

  function computeView(status: SyncStatus, messagePl?: string): SyncView {
    const c = config();
    return {
      status: !c ? 'disabled' : !p.session ? 'signed-out' : status,
      configured: !!c,
      configSource: p.config ? 'device' : c ? 'build' : null,
      email: p.session?.user.email,
      lastSyncedAt: p.lastSyncedAt,
      messagePl,
      blockedByHost: !!deps.blockedByHost,
      conflict: view?.conflict,
    };
  }
  function set(status: SyncStatus, messagePl?: string, conflict?: SyncView['conflict']) {
    view = { ...computeView(status, messagePl), conflict: status === 'conflict' ? conflict ?? view.conflict : undefined };
    listeners.forEach((l) => l());
  }

  async function freshSession(): Promise<Session> {
    const c = getClient();
    if (!c || !p.session) throw new SyncError('auth', 'Nie jesteś zalogowany/zalogowana.');
    if (p.session.expires_at - Date.now() / 1000 < 90) {
      try {
        p.session = await c.refresh(p.session.refresh_token);
        persist();
      } catch (e) {
        if (e instanceof SyncError && e.kind === 'auth') {
          p.session = undefined;
          persist();
        }
        throw e;
      }
    }
    return p.session;
  }

  function adopt(remote: RemoteProgress) {
    const now = store.now();
    store.update(() => {
      const { state } = sanitize(remote.state, now);
      state.settings = { ...state.settings, ...store.get().settings }; // settings stay per device
      ensureDaily(state, now);
      return state;
    }, { replace: true });
    p.remoteRevision = remote.revision;
    p.lastSyncedHash = hashState(store.get());
    p.lastSyncedAt = Date.now();
    persist();
  }

  async function push(expected: number) {
    const c = getClient()!;
    const s = await freshSession();
    const snapshot = store.get();
    const res = await c.saveProgress(s, snapshot, expected, p.deviceId);
    p.remoteRevision = res.revision;
    p.lastSyncedHash = hashState(snapshot);
    p.lastSyncedAt = Date.now();
    persist();
  }

  async function syncOnce(retry = true): Promise<void> {
    const c = getClient();
    if (!c || !p.session) return set('signed-out');
    if (deps.blockedByHost) return set('error', 'W podglądzie na claude.ai połączenia z zewnętrznymi serwerami są zablokowane. Synchronizacja działa w wersji wdrożonej na własnym adresie.');
    if (!online()) return set('offline', 'Brak internetu – zsynchronizujemy po powrocie online.');
    set('syncing');
    try {
      const s = await freshSession();
      const remote = await c.getProgress(s);
      const local = store.get();
      const localChanged = hashState(local) !== p.lastSyncedHash;
      if (!remote) {
        // First sign-in on this account: upload this device's (guest) progress.
        await push(0);
        return set('synced');
      }
      const remoteChanged = remote.revision !== p.remoteRevision;
      if (!remoteChanged && !localChanged) return set('synced');
      if (!remoteChanged) {
        await push(remote.revision);
        return set('synced');
      }
      if (!localChanged || isEmptyProgress(local)) {
        adopt(remote);
        return set('synced');
      }
      // Both sides changed: let the player decide. Never overwrite silently.
      pendingRemote = remote;
      const { state: remoteState } = sanitize(remote.state, store.now());
      const lIds = new Set(local.attempts.map((x) => x.id));
      const rIds = new Set(remoteState.attempts.map((x) => x.id));
      return set('conflict', undefined, {
        local: summarize(local), remote: summarize(remoteState), remoteUpdatedAt: remote.updated_at,
        localOnly: [...lIds].filter((id) => !rIds.has(id)).length + local.writing.history.filter((w) => !remoteState.writing.history.some((r) => r.id === w.id)).length,
        remoteOnly: [...rIds].filter((id) => !lIds.has(id)).length + remoteState.writing.history.filter((w) => !local.writing.history.some((r) => r.id === w.id)).length,
      });
    } catch (e) {
      if (e instanceof SyncError && e.kind === 'conflict' && retry) return syncOnce(false);
      if (e instanceof SyncError && e.kind === 'network') return set('offline', e.message);
      if (e instanceof SyncError && e.kind === 'auth' && !p.session) return set('signed-out', e.message);
      return set('error', e instanceof Error ? e.message : 'Nieznany błąd synchronizacji.');
    }
  }

  function syncNow(): Promise<void> {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!running) running = syncOnce().finally(() => { running = null; });
    return running;
  }

  function schedule() {
    if (!p.session || view.status === 'conflict' || !config()) return;
    if (hashState(store.get()) === p.lastSyncedHash) return;
    if (view.status !== 'syncing') set('pending');
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void syncNow(); }, debounceMs);
  }

  store.subscribe(schedule);

  async function resolve(choice: 'local' | 'remote' | 'merge') {
    const remote = pendingRemote;
    if (!remote) return;
    set('syncing');
    try {
      if (choice === 'remote') {
        adopt(remote);
      } else {
        if (choice === 'merge') {
          const { state: remoteState } = sanitize(remote.state, store.now());
          store.update(() => mergeStates(store.get(), remoteState), { replace: true });
        }
        await push(remote.revision);
      }
      pendingRemote = null;
      set('synced');
    } catch (e) {
      pendingRemote = null;
      if (e instanceof SyncError && e.kind === 'conflict') return syncNow();
      set('error', e instanceof Error ? e.message : 'Błąd synchronizacji.');
    }
  }

  async function signIn(email: string, password: string) {
    const c = getClient();
    if (!c) throw new SyncError('not-setup', 'Synchronizacja nie jest skonfigurowana.');
    p.session = await c.signIn(email.trim(), password);
    // A new account/device pairing: treat everything local as unsynced.
    p.remoteRevision = null;
    p.lastSyncedHash = undefined;
    persist();
    await syncNow();
  }

  async function signUp(email: string, password: string): Promise<'signed-in' | 'confirm-email'> {
    const c = getClient();
    if (!c) throw new SyncError('not-setup', 'Synchronizacja nie jest skonfigurowana.');
    const r = await c.signUp(email.trim(), password);
    if (r === 'confirm-email') return 'confirm-email';
    p.session = r;
    p.remoteRevision = null;
    p.lastSyncedHash = undefined;
    persist();
    await syncNow();
    return 'signed-in';
  }

  async function signOut() {
    const c = getClient();
    if (c && p.session) await c.signOut(p.session.access_token);
    p.session = undefined;
    p.remoteRevision = null;
    p.lastSyncedHash = undefined;
    persist();
    pendingRemote = null;
    set('signed-out', 'Wylogowano. Postęp zostaje na tym urządzeniu.');
  }

  function setConfig(cfg: SupabaseConfig | undefined) {
    p.config = cfg ? { url: cfg.url.trim().replace(/\/+$/, ''), anonKey: cfg.anonKey.trim() } : undefined;
    p.session = undefined;
    p.remoteRevision = null;
    p.lastSyncedHash = undefined;
    persist();
    set('signed-out');
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => p.session && void syncNow());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && timer) void syncNow();
    });
  }

  set(p.session ? 'pending' : 'signed-out');

  return {
    get: () => view,
    subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
    start: () => (p.session ? syncNow() : Promise.resolve()),
    syncNow, resolve, signIn, signUp, signOut, setConfig,
    resetPassword: (email: string) => getClient()?.resetPassword(email.trim()),
    currentConfig: config,
  };
}

export type Sync = ReturnType<typeof createSync>;

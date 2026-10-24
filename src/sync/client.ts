import type { SupabaseConfig } from './config';

/**
 * Minimal Supabase client over fetch (GoTrue auth + PostgREST), so the app needs
 * no npm dependency. Only the endpoints the sync uses are implemented.
 */

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  user: { id: string; email: string };
}

export interface RemoteProgress {
  state: unknown;
  revision: number;
  updated_at: string;
  device_id: string | null;
}

export class SyncError extends Error {
  constructor(public kind: 'auth' | 'network' | 'conflict' | 'not-setup' | 'confirm-email' | 'exists' | 'server', messagePl: string) {
    super(messagePl);
  }
}

type Fetch = typeof fetch;

export function createClient(cfg: SupabaseConfig, fetchImpl: Fetch = (...a) => fetch(...a)) {
  const base = cfg.url.replace(/\/+$/, '');
  const headers = (token?: string): Record<string, string> => ({
    apikey: cfg.anonKey,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${cfg.anonKey}` }),
  });

  async function call(path: string, init: RequestInit): Promise<{ status: number; body: any }> {
    let res: Response;
    try {
      res = await fetchImpl(`${base}${path}`, init);
    } catch {
      throw new SyncError('network', 'Brak połączenia z serwerem synchronizacji.');
    }
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, body };
  }

  function authError(status: number, body: any): never {
    const msg = String(body?.msg ?? body?.message ?? body?.error_description ?? body?.error ?? '');
    const code = String(body?.error_code ?? body?.code ?? '');
    if (/invalid_credentials|Invalid login credentials/i.test(code + msg)) throw new SyncError('auth', 'Nieprawidłowy e-mail lub hasło.');
    if (/email_not_confirmed|Email not confirmed/i.test(code + msg)) throw new SyncError('confirm-email', 'Najpierw potwierdź adres e-mail – kliknij link w wiadomości od Supabase, potem zaloguj się.');
    if (/user_already_exists|already registered/i.test(code + msg)) throw new SyncError('exists', 'Konto z tym adresem już istnieje – zaloguj się.');
    if (/weak_password|Password should be/i.test(code + msg)) throw new SyncError('auth', 'Hasło jest za słabe – użyj dłuższego hasła (co najmniej 6–8 znaków).');
    if (/email_address_invalid|invalid.*email/i.test(code + msg)) throw new SyncError('auth', 'Ten adres e-mail jest nieprawidłowy.');
    if (/over_.*rate_limit|rate limit/i.test(code + msg)) throw new SyncError('auth', 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.');
    if (/signup.*disabled|Signups not allowed/i.test(code + msg)) throw new SyncError('auth', 'Rejestracja jest wyłączona w tym projekcie Supabase.');
    if (status === 401 || status === 403) throw new SyncError('auth', 'Sesja wygasła – zaloguj się ponownie.');
    throw new SyncError('server', `Serwer odpowiedział błędem (${status}).`);
  }

  function toSession(body: any): Session {
    return {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: body.expires_at ?? Math.floor(Date.now() / 1000) + (body.expires_in ?? 3600),
      user: { id: body.user?.id, email: body.user?.email },
    };
  }

  return {
    async signUp(email: string, password: string): Promise<Session | 'confirm-email'> {
      const { status, body } = await call('/auth/v1/signup', { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
      if (status >= 400) authError(status, body);
      if (body?.access_token) return toSession(body);
      // Email confirmation enabled. GoTrue returns a fake user for existing emails (no identities).
      if (body && Array.isArray(body.identities) && body.identities.length === 0) throw new SyncError('exists', 'Konto z tym adresem już istnieje – zaloguj się.');
      return 'confirm-email';
    },

    async signIn(email: string, password: string): Promise<Session> {
      const { status, body } = await call('/auth/v1/token?grant_type=password', { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
      if (status >= 400) authError(status, body);
      return toSession(body);
    },

    async refresh(refreshToken: string): Promise<Session> {
      const { status, body } = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: refreshToken }) });
      if (status >= 400) throw new SyncError('auth', 'Sesja wygasła – zaloguj się ponownie.');
      return toSession(body);
    },

    async signOut(token: string): Promise<void> {
      await call('/auth/v1/logout', { method: 'POST', headers: headers(token) }).catch(() => undefined);
    },

    async resetPassword(email: string): Promise<void> {
      const { status, body } = await call('/auth/v1/recover', { method: 'POST', headers: headers(), body: JSON.stringify({ email }) });
      if (status >= 400) authError(status, body);
    },

    async getProgress(s: Session): Promise<RemoteProgress | null> {
      const { status, body } = await call(`/rest/v1/user_progress?select=state,revision,updated_at,device_id&user_id=eq.${encodeURIComponent(s.user.id)}`, { method: 'GET', headers: headers(s.access_token) });
      if (status === 401) throw new SyncError('auth', 'Sesja wygasła – zaloguj się ponownie.');
      if (status === 404 || (status >= 400 && /does not exist|PGRST205|42P01/.test(JSON.stringify(body)))) {
        throw new SyncError('not-setup', 'Baza nie jest przygotowana: uruchom migrację supabase/migrations/0001_user_progress.sql w projekcie Supabase.');
      }
      if (status >= 400) throw new SyncError('server', `Nie udało się pobrać postępu (${status}).`);
      const row = Array.isArray(body) ? body[0] : null;
      return row ? { state: row.state, revision: Number(row.revision), updated_at: row.updated_at, device_id: row.device_id ?? null } : null;
    },

    async saveProgress(s: Session, state: unknown, expectedRevision: number, deviceId: string): Promise<{ revision: number; updated_at: string }> {
      const { status, body } = await call('/rest/v1/rpc/save_progress', {
        method: 'POST',
        headers: headers(s.access_token),
        body: JSON.stringify({ p_state: state, p_expected_revision: expectedRevision, p_device: deviceId }),
      });
      if (status >= 400) {
        const txt = JSON.stringify(body);
        if (/conflict/.test(txt)) throw new SyncError('conflict', 'Postęp w chmurze zmienił się na innym urządzeniu.');
        if (status === 401) throw new SyncError('auth', 'Sesja wygasła – zaloguj się ponownie.');
        if (status === 404 || /PGRST202|does not exist|42883/.test(txt)) throw new SyncError('not-setup', 'Baza nie jest przygotowana: uruchom migrację supabase/migrations/0001_user_progress.sql w projekcie Supabase.');
        if (/state_size/.test(txt)) throw new SyncError('server', 'Zapis jest za duży, by go zsynchronizować.');
        throw new SyncError('server', `Nie udało się zapisać postępu (${status}).`);
      }
      const row = Array.isArray(body) ? body[0] : body;
      return { revision: Number(row.revision), updated_at: row.updated_at };
    },
  };
}

export type SupabaseClient = ReturnType<typeof createClient>;

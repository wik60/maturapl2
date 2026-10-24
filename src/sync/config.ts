/**
 * Supabase connection settings.
 * Build-time: SUPABASE_URL and SUPABASE_ANON_KEY environment variables (see scripts/build.ts).
 * The anon / publishable key is designed to be public; data is protected by Row Level Security.
 * Never put the service-role key here.
 */
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function buildTimeConfig(): SupabaseConfig | null {
  const url = typeof __SUPABASE_URL__ !== 'undefined' ? __SUPABASE_URL__ : '';
  const anonKey = typeof __SUPABASE_ANON_KEY__ !== 'undefined' ? __SUPABASE_ANON_KEY__ : '';
  return url && anonKey ? { url: url.replace(/\/+$/, ''), anonKey } : null;
}

export function validateConfig(c: Partial<SupabaseConfig>): string | null {
  if (!c.url || !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$|^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$|^https:\/\/[^/]+\/?$/i.test(c.url)) {
    return 'Podaj adres projektu w postaci https://xxxx.supabase.co';
  }
  if (!c.anonKey || c.anonKey.length < 20) return 'Podaj klucz „anon” / „publishable” z ustawień API projektu.';
  if (/service_role/.test(atobSafe(c.anonKey.split('.')[1] ?? '')) || c.anonKey.startsWith('sb_secret_')) {
    return 'To jest klucz serwisowy (service_role / secret). Nie wolno go umieszczać w aplikacji – użyj klucza „anon” / „publishable”.';
  }
  return null;
}

function atobSafe(s: string): string {
  try {
    return atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return '';
  }
}

import type { AppState } from './types';

export const STORAGE_KEY = 'matura-quest:v1';
export const SCHEMA_VERSION = 1;

export function defaultState(now: number): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    xp: 0,
    coins: 0,
    ledger: {},
    days: {},
    attempts: [],
    mistakes: {},
    vocab: {},
    sessions: {},
    exams: {},
    quests: { day: '', list: [] },
    achievements: {},
    levels: {},
    writing: { drafts: {}, history: [] },
    purchases: ['ink-blue'],
    settings: {
      name: '',
      timeZone: 'Europe/Warsaw',
      dailyGoalItems: 20,
      sound: true,
      motion: 'system',
      textSize: 'normal',
      theme: 'ink-blue',
      speechRate: 0.95,
    },
    bestStreak: 0,
    bestRun: 0,
    currentRun: 0,
  };
}

export interface LoadResult {
  state: AppState;
  status: 'fresh' | 'loaded' | 'recovered' | 'unavailable';
  messagePl?: string;
}

interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Merges stored data onto defaults, dropping fields of the wrong type. This keeps
 * partially damaged progress usable instead of discarding everything.
 */
export function sanitize(raw: unknown, now: number): { state: AppState; repaired: boolean } {
  const base = defaultState(now);
  if (!isObj(raw)) throw new Error('not an object');
  let repaired = false;
  const out = { ...base } as unknown as Record<string, unknown>;
  for (const [k, def] of Object.entries(base)) {
    const v = (raw as Record<string, unknown>)[k];
    if (v === undefined) continue;
    const okType = Array.isArray(def) ? Array.isArray(v) : typeof def === typeof v && (!isObj(def) || isObj(v));
    if (!okType) {
      repaired = true;
      continue;
    }
    out[k] = isObj(def) && isObj(v) && k === 'settings' ? { ...def, ...v } : v;
  }
  if (raw && isObj(raw) && raw.diagnostic && isObj(raw.diagnostic)) out.diagnostic = raw.diagnostic;
  for (const opt of ['activeSessionId', 'activeExamId'] as const) {
    const v = (raw as Record<string, unknown>)[opt];
    if (typeof v === 'string') out[opt] = v;
  }
  const st = out as unknown as AppState;
  // drop malformed attempts
  const before = st.attempts.length;
  st.attempts = st.attempts.filter((a) => isObj(a) && typeof a.itemId === 'string' && typeof a.ts === 'number');
  if (st.attempts.length !== before) repaired = true;
  if (typeof st.xp !== 'number' || !Number.isFinite(st.xp) || st.xp < 0) { st.xp = 0; repaired = true; }
  if (typeof st.coins !== 'number' || !Number.isFinite(st.coins) || st.coins < 0) { st.coins = 0; repaired = true; }
  return { state: st, repaired };
}

export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  // Future schema migrations go here, keyed by raw.schemaVersion.
  return { ...raw, schemaVersion: SCHEMA_VERSION };
}

export function load(kv: KV | null, now: number): LoadResult {
  if (!kv) return { state: defaultState(now), status: 'unavailable', messagePl: 'Przeglądarka blokuje zapis danych – postęp zniknie po zamknięciu karty.' };
  let text: string | null = null;
  try {
    text = kv.getItem(STORAGE_KEY);
  } catch {
    return { state: defaultState(now), status: 'unavailable', messagePl: 'Przeglądarka blokuje zapis danych – postęp zniknie po zamknięciu karty.' };
  }
  if (!text) return { state: defaultState(now), status: 'fresh' };
  try {
    const parsed = migrate(JSON.parse(text));
    const { state, repaired } = sanitize(parsed, now);
    return repaired
      ? { state, status: 'recovered', messagePl: 'Część zapisanych danych była uszkodzona – naprawiliśmy je i zachowaliśmy resztę postępu.' }
      : { state, status: 'loaded' };
  } catch {
    try { kv.setItem(`${STORAGE_KEY}:corrupt:${now}`, text); } catch { /* ignore */ }
    return { state: defaultState(now), status: 'recovered', messagePl: 'Zapisane dane były uszkodzone. Zaczynamy od nowa – kopię starych danych zachowaliśmy w przeglądarce.' };
  }
}

export function save(kv: KV | null, state: AppState): boolean {
  if (!kv) return false;
  try {
    kv.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function safeLocalStorage(): KV | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const k = '__mq_probe__';
    ls.setItem(k, '1');
    ls.removeItem(k);
    return ls;
  } catch {
    return null;
  }
}

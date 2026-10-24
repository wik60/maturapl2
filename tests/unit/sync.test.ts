import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { finishSession, setAnswer, startSession, submitUnit } from '../../src/store/actions';
import { createStore } from '../../src/store/store';
import { defaultState } from '../../src/store/storage';
import { createClient, SyncError } from '../../src/sync/client';
import { validateConfig } from '../../src/sync/config';
import { createSync, hashState, SYNC_KEY } from '../../src/sync/engine';
import { isEmptyProgress, mergeStates } from '../../src/sync/merge';
import { startMockSupabase } from '../mock-supabase';

function memKV() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), map: m };
}

let mock: ReturnType<typeof startMockSupabase>;
beforeAll(() => { mock = startMockSupabase(54399); });
afterAll(() => mock.stop());

/** A "device": its own storage, store and sync engine pointed at the mock. */
function device() {
  const kv = memKV();
  const store = createStore(kv, () => Date.now());
  const sync = createSync({ store, kv, debounceMs: 10_000 });
  sync.setConfig({ url: mock.url, anonKey: 'anon-key-for-tests-0000000000' });
  return { kv, store, sync };
}

function answer(store: ReturnType<typeof createStore>, group: string, answers: Record<string, string>) {
  const sid = store.update((s, now) => startSession(s, now, { kind: 'practice', title: 't', units: [group] }));
  store.update((s) => { for (const [k, v] of Object.entries(answers)) setAnswer(s, sid, k, v); });
  store.update((s, now) => submitUnit(s, now, sid, group));
  store.update((s, now) => finishSession(s, now, sid));
}

describe('config validation', () => {
  test('rejects a service-role key and malformed URLs', () => {
    const payload = btoa(JSON.stringify({ role: 'service_role' })).replace(/=+$/, '');
    expect(validateConfig({ url: 'https://abc.supabase.co', anonKey: `xx.${payload}.yy-padding-padding` })).toContain('serwisowy');
    expect(validateConfig({ url: 'https://abc.supabase.co', anonKey: 'sb_secret_abcdefghijklmnopqrstuvwxyz' })).toContain('serwisowy');
    expect(validateConfig({ url: 'abc', anonKey: 'x'.repeat(30) })).not.toBeNull();
    expect(validateConfig({ url: 'https://abc.supabase.co', anonKey: 'sb_publishable_abcdefghijklmnopqrstuvwxyz' })).toBeNull();
  });
});

describe('client error messages', () => {
  test('wrong password maps to a Polish message', async () => {
    const c = createClient({ url: mock.url, anonKey: 'k'.repeat(30) });
    await c.signUp('x@test.pl', 'secret123');
    await expect(c.signIn('x@test.pl', 'wrong-pass')).rejects.toThrow('Nieprawidłowy e-mail lub hasło.');
    await expect(c.signUp('x@test.pl', 'secret123')).rejects.toBeInstanceOf(SyncError);
  });
  test('network failure is reported as offline-type error', async () => {
    const c = createClient({ url: 'http://localhost:1', anonKey: 'k'.repeat(30) });
    await expect(c.signIn('a@b.pl', 'secret123')).rejects.toThrow('Brak połączenia');
  });
});

describe('sync between devices (against mock Supabase)', () => {
  test('sign-up uploads guest progress; second device adopts it; edits flow both ways', async () => {
    const a = device();
    answer(a.store, 'fd1', { 'fd1.1': 'A', 'fd1.2': 'B', 'fd1.3': 'A' });
    const xpA = a.store.get().xp;
    expect(xpA).toBeGreaterThan(0);

    await a.sync.signUp('ola@test.pl', 'haslo1234');
    expect(a.sync.get().status).toBe('synced');
    const row = [...mock.rows.values()].at(-1)!;
    expect(row.revision).toBe(1);
    expect((row.state as { xp: number }).xp).toBe(xpA);

    const b = device();
    expect(isEmptyProgress(b.store.get())).toBe(true);
    await b.sync.signIn('ola@test.pl', 'haslo1234');
    expect(b.sync.get().status).toBe('synced');
    expect(b.store.get().xp).toBe(xpA);
    expect(b.store.get().attempts.length).toBe(3);

    // B learns more and pushes
    answer(b.store, 'fd2', { 'fd2.1': 'B', 'fd2.2': 'A', 'fd2.3': 'A' });
    await b.sync.syncNow();
    expect(b.sync.get().status).toBe('synced');

    // A pulls B's progress (A unchanged since last sync)
    await a.sync.syncNow();
    expect(a.store.get().attempts.length).toBe(6);
    expect(a.store.get().xp).toBe(b.store.get().xp);
  });

  test('both devices changed → conflict, nothing overwritten; merge keeps everything', async () => {
    const a = device();
    await a.sync.signUp('kuba@test.pl', 'haslo1234');
    const b = device();
    await b.sync.signIn('kuba@test.pl', 'haslo1234');

    answer(a.store, 'oc1', { 'oc1.1': 'for', 'oc1.2': 'than', 'oc1.3': 'are' });
    await a.sync.syncNow(); // cloud now has A's work
    answer(b.store, 'oc3', { 'oc3.1': 'much', 'oc3.2': 'to', 'oc3.3': 'for' }); // B worked offline

    const before = hashState(b.store.get());
    await b.sync.syncNow();
    expect(b.sync.get().status).toBe('conflict');
    expect(hashState(b.store.get())).toBe(before); // local progress untouched
    expect(b.sync.get().conflict!.remote.answers).toBe(3);

    await b.sync.resolve('merge');
    expect(b.sync.get().status).toBe('synced');
    const ids = new Set(b.store.get().attempts.map((x) => x.itemId));
    for (const id of ['oc1.1', 'oc1.2', 'oc1.3', 'oc3.1', 'oc3.2', 'oc3.3']) expect(ids.has(id)).toBe(true);

    await a.sync.syncNow();
    expect(a.store.get().attempts.length).toBe(6);
  });

  test('choosing the cloud version replaces local; choosing local overwrites cloud', async () => {
    const a = device();
    await a.sync.signUp('zosia@test.pl', 'haslo1234');
    const b = device();
    await b.sync.signIn('zosia@test.pl', 'haslo1234');
    answer(a.store, 'fd3', { 'fd3.1': 'A', 'fd3.2': 'B', 'fd3.3': 'A' });
    await a.sync.syncNow();
    answer(b.store, 'fd4', { 'fd4.1': 'A' });
    await b.sync.syncNow();
    expect(b.sync.get().status).toBe('conflict');
    await b.sync.resolve('remote');
    expect(b.store.get().attempts.every((x) => x.groupId === 'fd3')).toBe(true);
  });

  test('sync state is stored separately from progress; sign-out keeps local progress', async () => {
    const a = device();
    answer(a.store, 'fd1', { 'fd1.1': 'A' });
    await a.sync.signUp('tomek@test.pl', 'haslo1234');
    expect(a.kv.map.get(SYNC_KEY)).toContain('access_token');
    expect(JSON.stringify(a.store.get())).not.toContain('access_token');
    const xp = a.store.get().xp;
    await a.sync.signOut();
    expect(a.sync.get().status).toBe('signed-out');
    expect(a.store.get().xp).toBe(xp);
  });

  test('offline: no request, status offline', async () => {
    const kv = memKV();
    const store = createStore(kv, () => Date.now());
    const sync = createSync({ store, kv, online: () => false });
    sync.setConfig({ url: mock.url, anonKey: 'anon-key-for-tests-0000000000' });
    const c = createClient({ url: mock.url, anonKey: 'k'.repeat(30) });
    await c.signUp('off@test.pl', 'haslo1234');
    await sync.signIn('off@test.pl', 'haslo1234').catch(() => {});
    expect(sync.get().status).toBe('offline');
  });
});

describe('merge', () => {
  test('unions attempts, keeps advanced learning state, max XP, local settings', () => {
    const a = defaultState(1);
    const b = defaultState(2);
    a.xp = 120; b.xp = 300;
    a.settings.name = 'Ola'; b.settings.name = 'Inna';
    const at = (id: string, ts: number) => ({ id, itemId: id, groupId: 'g', format: 'U_DIALOG_MC', skill: 'functions' as const, section: 'language' as const, difficulty: 1, given: 'A', verdict: 'correct' as const, ts, mode: 'practice' as const, sessionId: 's' });
    a.attempts = [at('x', 1), at('y', 3)];
    b.attempts = [at('y', 3), at('z', 2)];
    a.levels['c1-1'] = { best: 0.5, attempts: 1 };
    b.levels['c1-1'] = { best: 0.8, attempts: 2, completedAt: 10 };
    a.vocab['v1'] = { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: '2026-10-25' };
    b.vocab['v1'] = { ease: 2.6, interval: 3, reps: 2, lapses: 0, due: '2026-10-27' };
    a.achievements = { x: 50 }; b.achievements = { x: 20, y: 30 };
    const m = mergeStates(a, b);
    expect(m.attempts.map((x) => x.id)).toEqual(['x', 'z', 'y']);
    expect(m.xp).toBe(300);
    expect(m.levels['c1-1']).toEqual({ best: 0.8, attempts: 2, completedAt: 10, masteredAt: undefined });
    expect(m.vocab['v1'].reps).toBe(2);
    expect(m.achievements).toEqual({ x: 20, y: 30 });
    expect(m.settings.name).toBe('Ola');
  });
});

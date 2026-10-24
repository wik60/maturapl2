import { ensureDaily } from './actions';
import { load, type LoadResult, safeLocalStorage, save } from './storage';
import type { AppState } from './types';

type Listener = () => void;

/**
 * Tiny external store. Every mutation runs on a deep copy and is persisted
 * immediately, so a refresh mid-exercise never loses typed answers.
 */
export function createStore(kv = safeLocalStorage(), clock: () => number = () => Date.now()) {
  const initial: LoadResult = load(kv, clock());
  let state: AppState = initial.state;
  ensureDaily(state, clock());
  let saveOk = save(kv, state);
  const listeners = new Set<Listener>();

  return {
    loadStatus: initial.status,
    loadMessage: initial.messagePl,
    now: clock,
    get: () => state,
    persisted: () => saveOk && !!kv,
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    /** Applies fn to a draft; fn may return a value, or a whole new state via `replace`. */
    update<T>(fn: (draft: AppState, now: number) => T, opts: { replace?: boolean } = {}): T {
      const draft = structuredClone(state) as AppState;
      const out = fn(draft, clock());
      state = opts.replace ? (out as unknown as AppState) : draft;
      saveOk = save(kv, state);
      listeners.forEach((l) => l());
      return out;
    },
  };
}

export type Store = ReturnType<typeof createStore>;

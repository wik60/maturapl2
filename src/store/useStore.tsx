import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Store } from './store';
import type { AppState } from './types';

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreContext missing');
  return s;
}

export function useAppState(): AppState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.get);
}

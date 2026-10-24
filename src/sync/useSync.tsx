import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Sync, SyncView } from './engine';

export const SyncContext = createContext<Sync | null>(null);

export function useSyncEngine(): Sync | null {
  return useContext(SyncContext);
}

const disabled: SyncView = { status: 'disabled', configured: false, configSource: null, blockedByHost: false };

export function useSyncView(): SyncView {
  const s = useContext(SyncContext);
  return useSyncExternalStore(s ? s.subscribe : () => () => {}, s ? s.get : () => disabled);
}

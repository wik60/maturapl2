import type { AppState } from '../store/types';
import { addDays } from './time';

/** A day counts towards the streak only with meaningful activity, not just opening the app. */
export const MEANINGFUL_ITEMS = 5;

export function isMeaningful(d?: { items: number; sessions: number; vocab: number }): boolean {
  if (!d) return false;
  return d.items >= MEANINGFUL_ITEMS || d.sessions >= 1 || d.vocab >= 10;
}

/** Current streak ending today, or yesterday if today has no activity yet (streak still alive). */
export function currentStreak(days: AppState['days'], today: string): number {
  let start = today;
  if (!isMeaningful(days[today])) start = addDays(today, -1);
  let n = 0;
  let k = start;
  while (isMeaningful(days[k])) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

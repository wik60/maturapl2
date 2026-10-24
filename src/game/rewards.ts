import type { AppState } from '../store/types';
import { addDays } from './time';

/** Configurable reward model. */
export const REWARDS = {
  correctAnswer: 10,
  groupCompleted: 20,
  levelCompleted: 50,
  levelMastered: 30,
  questCompleted: 40,
  examCompleted: 100,
  writingSubmitted: 40,
  vocabReview: 2,
  mistakeFixed: 15,
  diagnosticCompleted: 60,
  coinsPerXp: 0.1,
};

/** XP needed to reach level n (level 1 at 0 XP). Quadratic curve: 0, 100, 300, 600, 1000… */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelFromXp(xp: number): number {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  return { level, from, to, ratio: (xp - from) / (to - from) };
}

/**
 * Idempotent award: the same reward key can only ever pay out once.
 * Returns the XP actually granted (0 if already paid).
 */
export function award(state: AppState, key: string, xp: number, now: number): number {
  if (state.ledger[key]) return 0;
  state.ledger[key] = now;
  state.xp += xp;
  state.coins += Math.floor(xp * REWARDS.coinsPerXp);
  return xp;
}

/** Day-scoped ledger keys look like "c:<item>:<YYYY-MM-DD>"; drop those older than 60 days. */
export function pruneLedger(state: AppState, today: string) {
  const cutoff = addDays(today, -60);
  for (const k of Object.keys(state.ledger)) {
    const m = k.match(/:(\d{4}-\d{2}-\d{2})$/);
    if (m && m[1] < cutoff) delete state.ledger[k];
  }
}

export const COSMETICS = [
  { id: 'ink-blue', namePl: 'Niebieski długopis', price: 0, color: '#2340C8' },
  { id: 'ink-green', namePl: 'Zielony atrament', price: 60, color: '#137A55' },
  { id: 'ink-violet', namePl: 'Fioletowy żel', price: 120, color: '#6B3FC4' },
  { id: 'ink-teal', namePl: 'Morski cienkopis', price: 200, color: '#0E7490' },
];

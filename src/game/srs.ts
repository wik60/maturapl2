import { addDays } from './time';

/**
 * Spaced repetition – a transparent SM-2 variant (SuperMemo 2).
 * grade: 0 = nie pamiętam, 3 = trudne, 4 = dobrze, 5 = łatwe.
 */
export interface SrsCard {
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
  due: string; // YYYY-MM-DD
}

export const newCard = (today: string): SrsCard => ({ ease: 2.5, interval: 0, reps: 0, lapses: 0, due: today });

export function review(card: SrsCard, grade: 0 | 3 | 4 | 5, today: string): SrsCard {
  let { ease, interval, reps, lapses } = card;
  if (grade < 3) {
    reps = 0;
    lapses += 1;
    interval = 1;
  } else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  return { ease: Math.round(ease * 100) / 100, interval, reps, lapses, due: addDays(today, interval) };
}

export const isDue = (card: SrsCard | undefined, today: string) => !card || card.due <= today;

import type { AppState } from '../store/types';
import { currentStreak } from './streak';

export interface AchievementDef {
  id: string;
  namePl: string;
  descPl: string;
  check: (s: AppState, today: string) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-session', namePl: 'Pierwszy krok', descPl: 'Ukończ pierwszą sesję ćwiczeń.', check: (s) => Object.values(s.sessions).some((x) => x.finishedAt) },
  { id: 'run-10', namePl: 'Dziesiątka', descPl: '10 poprawnych odpowiedzi z rzędu.', check: (s) => s.bestRun >= 10 },
  { id: 'listening-first', namePl: 'Dobre ucho', descPl: 'Ukończ pierwsze zadanie ze słuchania.', check: (s) => s.attempts.some((a) => a.section === 'listening' && a.mode !== 'transcript') },
  { id: 'reading-first', namePl: 'Mól książkowy', descPl: 'Ukończ pierwsze zadanie z czytania.', check: (s) => s.attempts.some((a) => a.section === 'reading') },
  { id: 'writing-first', namePl: 'Pióro w dłoni', descPl: 'Napisz pierwszą wypowiedź pisemną.', check: (s) => s.writing.history.length > 0 },
  { id: 'exam-first', namePl: 'Próba generalna', descPl: 'Ukończ pierwszy pełny arkusz.', check: (s) => Object.values(s.exams).some((e) => e.result) },
  { id: 'exam-30', namePl: 'Zdane!', descPl: 'Zdobądź co najmniej 30% w pełnym arkuszu.', check: (s) => Object.values(s.exams).some((e) => e.result && e.result.points / e.result.max >= 0.3) },
  { id: 'streak-3', namePl: 'Rozgrzewka', descPl: 'Ucz się 3 dni z rzędu.', check: (s, t) => Math.max(s.bestStreak, currentStreak(s.days, t)) >= 3 },
  { id: 'streak-7', namePl: 'Tydzień nauki', descPl: 'Ucz się 7 dni z rzędu.', check: (s, t) => Math.max(s.bestStreak, currentStreak(s.days, t)) >= 7 },
  { id: 'fixer', namePl: 'Poprawka', descPl: 'Opanuj 5 pozycji z zeszytu błędów.', check: (s) => Object.values(s.mistakes).filter((m) => m.mastered).length >= 5 },
  { id: 'vocab-50', namePl: 'Słowniczek', descPl: 'Powtórz 50 fiszek.', check: (s) => Object.values(s.vocab).reduce((a, c) => a + c.reps + c.lapses, 0) >= 50 },
  { id: 'master-level', namePl: 'Mistrz poziomu', descPl: 'Opanuj dowolny poziom na mapie (≥ 90%).', check: (s) => Object.values(s.levels).some((l) => l.masteredAt) },
  { id: 'diagnostic', namePl: 'Mapa umiejętności', descPl: 'Ukończ test diagnostyczny.', check: (s) => !!s.diagnostic },
];

/** Grants newly earned achievements; returns their ids. */
export function checkAchievements(state: AppState, today: string, now: number): string[] {
  const out: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    if (a.check(state, today)) {
      state.achievements[a.id] = now;
      out.push(a.id);
    }
  }
  return out;
}

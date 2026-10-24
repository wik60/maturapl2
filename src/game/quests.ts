import type { AppState, QuestState, QuestType } from '../store/types';
import { weakestSkill } from './analytics';

export const QUEST_TEXT: Record<QuestType, (n: number) => string> = {
  'listening-items': (n) => `Rozwiąż ${n} pytań ze słuchania`,
  'reading-items': (n) => `Rozwiąż ${n} pytań z czytania`,
  'language-items': (n) => `Rozwiąż ${n} zadań ze środków językowych`,
  'vocab-reviews': (n) => `Powtórz ${n} fiszek ze słówkami`,
  'fix-mistakes': (n) => `Popraw ${n} wcześniejsze błędy`,
  writing: () => 'Napisz jedną wypowiedź pisemną',
  'any-items': (n) => `Odpowiedz na ${n} dowolnych pytań`,
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Three daily quests, deterministic for a given day. One quest always targets the
 * weakest measured skill; one uses the mistake notebook if it has items.
 */
export function generateQuests(state: AppState, day: string): QuestState[] {
  const list: QuestState[] = [];
  const weak = weakestSkill(state);
  const weakQuest: QuestType =
    weak === 'listening' ? 'listening-items' : weak === 'reading' ? 'reading-items' : weak === 'writing' ? 'writing' : weak === 'vocabulary' ? 'vocab-reviews' : 'language-items';
  list.push({ id: `${day}:a`, type: weakQuest, target: targetFor(weakQuest), progress: 0, done: false });
  const openMistakes = Object.values(state.mistakes).filter((m) => !m.mastered).length;
  if (openMistakes >= 3) list.push({ id: `${day}:b`, type: 'fix-mistakes', target: 3, progress: 0, done: false });
  const pool: QuestType[] = ['listening-items', 'reading-items', 'language-items', 'vocab-reviews', 'any-items'].filter(
    (t) => !list.some((q) => q.type === t),
  ) as QuestType[];
  let h = hash(day);
  while (list.length < 3 && pool.length) {
    const t = pool.splice(h % pool.length, 1)[0];
    list.push({ id: `${day}:${list.length}`, type: t, target: targetFor(t), progress: 0, done: false });
    h = Math.floor(h / 7) + 13;
  }
  return list;
}

function targetFor(t: QuestType): number {
  switch (t) {
    case 'listening-items': return 5;
    case 'reading-items': return 5;
    case 'language-items': return 8;
    case 'vocab-reviews': return 10;
    case 'fix-mistakes': return 3;
    case 'writing': return 1;
    case 'any-items': return 15;
  }
}

export interface QuestEvent {
  listening?: number;
  reading?: number;
  language?: number;
  any?: number;
  vocab?: number;
  fixed?: number;
  writing?: number;
}

/** Applies progress; returns ids of quests completed by this event. */
export function progressQuests(quests: QuestState[], ev: QuestEvent): QuestState[] {
  const done: QuestState[] = [];
  for (const q of quests) {
    if (q.done) continue;
    const inc =
      q.type === 'listening-items' ? ev.listening ?? 0
        : q.type === 'reading-items' ? ev.reading ?? 0
        : q.type === 'language-items' ? ev.language ?? 0
        : q.type === 'vocab-reviews' ? ev.vocab ?? 0
        : q.type === 'fix-mistakes' ? ev.fixed ?? 0
        : q.type === 'writing' ? ev.writing ?? 0
        : ev.any ?? 0;
    if (!inc) continue;
    q.progress = Math.min(q.target, q.progress + inc);
    if (q.progress >= q.target) {
      q.done = true;
      done.push(q);
    }
  }
  return done;
}

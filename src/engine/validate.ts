import type { Item, OpenItem, TaskGroup } from '../content/types';
import { canonical, countWords, expandOptional, levenshtein } from './normalize';

export type Verdict = 'correct' | 'incorrect' | 'unanswered' | 'invalid';

export interface ItemResult {
  itemId: string;
  verdict: Verdict;
  points: 0 | 1;
  given: string;
  /** Human-readable reason when not correct (Polish). */
  reasonPl?: string;
}

/** Every accepted surface form of an open item, canonicalised. */
export function acceptedForms(item: OpenItem): string[] {
  const out = new Set<string>();
  for (const a of item.accepted) for (const v of expandOptional(a)) out.add(canonical(v));
  return [...out];
}

function isNumericLike(s: string): boolean {
  return /\d/.test(s) || /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred)\b/.test(s);
}

/**
 * Comprehension tolerance (CKE: low-frequency words may contain slips that do not
 * hinder communication; numbers, times and high-frequency words need full accuracy).
 * We allow ONE edit per word only for words of 6+ letters, never for numbers.
 */
function closeEnough(given: string, target: string): boolean {
  if (isNumericLike(target) || isNumericLike(given)) return false;
  const gw = given.split(' ');
  const tw = target.split(' ');
  if (gw.length !== tw.length) return false;
  return gw.every((w, i) => w === tw[i] || (tw[i].length >= 6 && levenshtein(w, tw[i]) <= 1));
}

export function validateOpen(item: OpenItem, raw: string): ItemResult {
  const given = raw ?? '';
  if (!item.accepted || item.accepted.length === 0) {
    return { itemId: item.id, verdict: 'invalid', points: 0, given, reasonPl: 'Brak klucza odpowiedzi – zadanie nie jest punktowane.' };
  }
  if (given.trim() === '') return { itemId: item.id, verdict: 'unanswered', points: 0, given };
  if (item.maxWords && countWords(given) > item.maxWords) {
    return {
      itemId: item.id, verdict: 'incorrect', points: 0, given,
      reasonPl: `Za dużo wyrazów: limit to ${item.maxWords}.`,
    };
  }
  const g = canonical(given);
  const forms = acceptedForms(item);
  if (forms.includes(g)) return { itemId: item.id, verdict: 'correct', points: 1, given };
  if (item.marking === 'comprehension' && forms.some((f) => closeEnough(g, f))) {
    return { itemId: item.id, verdict: 'correct', points: 1, given, reasonPl: 'Zaliczone mimo drobnej literówki – zwróć uwagę na pisownię.' };
  }
  if (item.keyWord && !g.split(' ').includes(canonical(item.keyWord))) {
    return { itemId: item.id, verdict: 'incorrect', points: 0, given, reasonPl: `Musisz użyć wyrazu „${item.keyWord}” bez zmiany jego formy.` };
  }
  return { itemId: item.id, verdict: 'incorrect', points: 0, given };
}

export function validateChoice(item: Item, raw: string, optionIds: string[]): ItemResult {
  const given = raw ?? '';
  const answer = item.kind === 'open' ? undefined : item.answer;
  if (!answer || !optionIds.includes(answer)) {
    return { itemId: item.id, verdict: 'invalid', points: 0, given, reasonPl: 'Błędny klucz odpowiedzi – zadanie nie jest punktowane.' };
  }
  if (!given) return { itemId: item.id, verdict: 'unanswered', points: 0, given };
  return given === answer
    ? { itemId: item.id, verdict: 'correct', points: 1, given }
    : { itemId: item.id, verdict: 'incorrect', points: 0, given };
}

export function optionIdsFor(group: TaskGroup, item: Item): string[] {
  if (item.kind === 'mc') return item.options.map((o) => o.id);
  if (item.kind === 'match') return (group.options ?? []).map((o) => o.id);
  return [];
}

export function validateItem(group: TaskGroup, item: Item, given: string): ItemResult {
  if (item.kind === 'open') return validateOpen(item, given);
  return validateChoice(item, given, optionIdsFor(group, item));
}

export function correctAnswerText(group: TaskGroup, item: Item): string {
  if (item.kind === 'open') return item.accepted[0].replace(/[()]/g, '');
  const opts = item.kind === 'mc' ? item.options : group.options ?? [];
  const o = opts.find((x) => x.id === item.answer);
  return o ? `${o.id}. ${o.text}` : item.answer;
}

export interface GroupScore {
  groupId: string;
  points: number;
  max: number;
  results: ItemResult[];
}

/** Invalid items are excluded from both points and maximum. */
export function scoreGroup(group: TaskGroup, answers: Record<string, string>): GroupScore {
  const results = group.items.map((it) => validateItem(group, it, answers[it.id] ?? ''));
  const valid = results.filter((r) => r.verdict !== 'invalid');
  return {
    groupId: group.id,
    points: valid.reduce((s, r) => s + r.points, 0),
    max: valid.length,
    results,
  };
}

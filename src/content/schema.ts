import { FORMATS } from './formats';
import type { Item, TaskGroup, VocabEntry, WritingPrompt } from './types';

/**
 * Runtime validation of the content bank. Invalid groups are excluded from the
 * active bank (and never scored) instead of crashing the app.
 */
export interface ContentIssue {
  id: string;
  problem: string;
}

function checkItem(group: TaskGroup, item: Item, issues: ContentIssue[]) {
  const where = `${group.id}/${item.id}`;
  if (!item.id) issues.push({ id: where, problem: 'brak id pozycji' });
  if (!item.explanationPl || item.explanationPl.length < 8) issues.push({ id: where, problem: 'brak wyjaśnienia po polsku' });
  if (item.kind === 'mc') {
    if (item.options.length < 2) issues.push({ id: where, problem: 'za mało opcji' });
    const ids = item.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) issues.push({ id: where, problem: 'zduplikowane id opcji' });
    if (!ids.includes(item.answer)) issues.push({ id: where, problem: `klucz ${item.answer} nie wskazuje istniejącej opcji` });
  } else if (item.kind === 'match') {
    const ids = (group.options ?? []).map((o) => o.id);
    if (!ids.length) issues.push({ id: where, problem: 'zadanie na dobieranie bez opcji wspólnych' });
    if (!ids.includes(item.answer)) issues.push({ id: where, problem: `klucz ${item.answer} nie wskazuje istniejącej opcji` });
  } else if (item.kind === 'open') {
    if (!item.accepted?.length) issues.push({ id: where, problem: 'brak akceptowanych odpowiedzi' });
    if (item.accepted?.some((a) => (a.match(/\(/g) ?? []).length !== (a.match(/\)/g) ?? []).length)) {
      issues.push({ id: where, problem: 'niezamknięty nawias w odpowiedzi' });
    }
  }
}

export function validateGroup(group: TaskGroup): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (!FORMATS[group.format]) issues.push({ id: group.id, problem: `nieznany format ${group.format}` });
  if (!group.items?.length) issues.push({ id: group.id, problem: 'brak pozycji' });
  const itemIds = group.items.map((i) => i.id);
  if (new Set(itemIds).size !== itemIds.length) issues.push({ id: group.id, problem: 'zduplikowane id pozycji' });
  if (group.stimulus.kind === 'audio' && !group.stimulus.clips.length && !group.items.every((i) => i.audio)) {
    issues.push({ id: group.id, problem: 'zadanie ze słuchu bez nagrania' });
  }
  const fmt = FORMATS[group.format];
  if (fmt?.section === 'listening' && group.stimulus.kind !== 'audio' && !group.items.every((i) => i.audio)) {
    issues.push({ id: group.id, problem: 'zadanie ze słuchu musi mieć nagranie' });
  }
  if ((group.format === 'R_MATCH' || group.format === 'L_MATCH' || group.format === 'R_SENTENCE_GAP') && group.options) {
    // Each option may be used at most once unless explicitly allowed; extra distractor expected.
    const used = group.items.map((i) => (i.kind === 'match' ? i.answer : ''));
    if (new Set(used).size !== used.length) issues.push({ id: group.id, problem: 'ta sama opcja jest kluczem do dwóch pozycji' });
    if (group.options.length <= group.items.length) issues.push({ id: group.id, problem: 'brak opcji dodatkowej (dystraktora)' });
  }
  for (const it of group.items) checkItem(group, it, issues);
  return issues;
}

export function validateWritingPrompt(p: WritingPrompt): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (p.points.length !== 4) issues.push({ id: p.id, problem: 'na poziomie podstawowym polecenie ma 4 podpunkty' });
  if (p.points.some((pt) => !pt.cues.length)) issues.push({ id: p.id, problem: 'podpunkt bez słów-kluczy' });
  if (!p.modelAnswer) issues.push({ id: p.id, problem: 'brak przykładowej odpowiedzi' });
  return issues;
}

export function validateVocab(v: VocabEntry): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (!v.en || !v.pl) issues.push({ id: v.id, problem: 'brak tłumaczenia' });
  if (!v.example) issues.push({ id: v.id, problem: 'brak przykładu' });
  return issues;
}

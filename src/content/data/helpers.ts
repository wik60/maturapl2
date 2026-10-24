import type { McItem, Option, SourceInfo } from '../types';

export const ORIGINAL: SourceInfo = {
  type: 'original',
  author: 'Matura Quest – treść autorska',
  spec: 'Format wzorowany na Informatorze CKE od r. szk. 2024/2025 (poziom podstawowy) i zasadach oceniania z maja 2025',
  note: 'Zadanie autorskie, nie jest zadaniem CKE.',
};

export const SUPPLEMENTARY: SourceInfo = {
  type: 'original',
  author: 'Matura Quest – treść autorska',
  spec: 'Ćwiczenie dodatkowe (poza formatem arkusza)',
  note: 'Trening umiejętności – nie jest osobnym typem zadania maturalnego.',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function opts(...texts: string[]): Option[] {
  return texts.map((text, i) => ({ id: LETTERS[i], text }));
}

export function mc(
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanationPl: string,
  extra: Partial<Omit<McItem, 'id' | 'kind' | 'prompt' | 'options' | 'answer' | 'explanationPl'>> = {},
): McItem {
  return { id, kind: 'mc', prompt, options: opts(...options), answer, explanationPl, ...extra };
}

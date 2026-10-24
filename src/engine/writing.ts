import type { WritingPrompt } from '../content/types';
import { countWords } from './normalize';

/**
 * Deterministic, rule-based PROVISIONAL assessment of the basic-level writing task.
 *
 * Official scale (CKE zasady oceniania, maj 2025, poziom podstawowy):
 *   treść 0–5 · spójność i logika 0–2 · zakres środków językowych 0–3 · poprawność 0–2 (razem 12)
 * Rules implemented exactly: the treść table, < 80 words → only treść is scored,
 * treść 0 → all 0, treść 1 → others capped at 1.
 * What a program CANNOT do exactly is judge whether a point is genuinely "developed",
 * or catch every language error — so treść/zakres/poprawność are estimates and the
 * result is always shown as a range and labelled as automated.
 */

export const WRITING_MIN_WORDS = 100;
export const WRITING_MAX_WORDS = 150;
export const WRITING_SCORING_THRESHOLD = 80;

/** Official treść table: rows = points addressed (odniósł się), cols = points developed (rozwinął). */
export const CONTENT_TABLE: Record<number, Record<number, number>> = {
  4: { 4: 5, 3: 4, 2: 3, 1: 2, 0: 2 },
  3: { 3: 3, 2: 3, 1: 2, 0: 1 },
  2: { 2: 2, 1: 1, 0: 1 },
  1: { 1: 1, 0: 0 },
  0: { 0: 0 },
};

export function contentPoints(addressed: number, developed: number): number {
  const a = Math.max(0, Math.min(4, addressed));
  const d = Math.max(0, Math.min(a, developed));
  return CONTENT_TABLE[a][d];
}

export interface CriteriaScores {
  content: number;
  coherence: number;
  range: number;
  accuracy: number;
}

/** Applies the official dependency rules between criteria. */
export function applyCkeRules(raw: CriteriaScores, words: number): CriteriaScores {
  let { content, coherence, range, accuracy } = raw;
  if (words < WRITING_SCORING_THRESHOLD) {
    coherence = 0; range = 0; accuracy = 0;
  }
  if (content === 0) {
    coherence = 0; range = 0; accuracy = 0;
  } else if (content === 1) {
    coherence = Math.min(coherence, 1);
    range = Math.min(range, 1);
    accuracy = Math.min(accuracy, 1);
  }
  return { content, coherence, range, accuracy };
}

export const total = (c: CriteriaScores) => c.content + c.coherence + c.range + c.accuracy;

/** Counts words as CKE does, excluding the given opening and a signature line. */
export function countWritingWords(text: string, opening = ''): number {
  let body = text;
  if (opening && body.trimStart().startsWith(opening.trim())) body = body.trimStart().slice(opening.trim().length);
  const lines = body.trim().split('\n');
  const last = lines[lines.length - 1]?.trim() ?? '';
  if (/^(xyz|[A-Z][a-z]+)$/.test(last) && lines.length > 1) lines.pop();
  return countWords(lines.join('\n'));
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => /[a-zA-Z]/.test(s));
}

const CONNECTORS = [
  'because', 'so', 'but', 'however', 'although', 'though', 'also', 'and then', 'then', 'first', 'firstly',
  'secondly', 'finally', 'after that', 'afterwards', 'later', 'when', 'while', 'as soon as', 'that is why',
  "that's why", 'what is more', 'moreover', 'besides', 'in addition', 'anyway', 'by the way', 'for example',
  'for instance', 'unfortunately', 'luckily', 'fortunately', 'in the end', 'at first', 'actually', 'since',
  'which', 'who', 'if', 'unless', 'before', 'until', 'even though', 'in my opinion', 'i think',
];

const PRECISE = [
  'looking forward', 'can\'t wait', 'it was worth', 'take part', 'took part', 'by mistake', 'in advance',
  'make friends', 'made friends', 'get on well', 'got on well', 'run out', 'ran out', 'turned out', 'turn out',
  'it is worth', 'i would recommend', 'i\'d recommend', 'you should', 'why don\'t you', 'how about',
  'i\'m sorry to hear', 'congratulations', 'unforgettable', 'breathtaking', 'crowded', 'exhausted',
  'disappointed', 'impressed', 'opportunity', 'experience', 'atmosphere', 'decided to', 'managed to',
  'had to', 'used to', 'be able to', 'was able to', 'in the middle of', 'at the last minute', 'on time',
  'as a result', 'thanks to', 'instead of', 'apart from', 'such a', 'so much', 'too', 'enough',
];

const STRUCTURES: [string, RegExp][] = [
  ['Present Perfect', /\b(have|has|i've|we've|they've|you've|he's|she's)\s+(already\s+|just\s+|never\s+|ever\s+)?\w+(ed|en|wn|ne|ught|own|ade|one|ept|ent|ost|ung|ung|unk|um)\b/i],
  ['Past Simple', /\b(was|were|went|did|had|saw|made|took|got|came|felt|told|bought|met|found|left|\w+ed)\b/i],
  ['Przyszłość (will / going to)', /\b(will|'ll|going to)\b/i],
  ['Czasownik modalny', /\b(should|could|must|might|may|have to|has to|had to)\b/i],
  ['Zdanie warunkowe', /\bif\b/i],
  ['Zdanie względne', /\b(who|which|that|where)\s+\w+/i],
  ['Konstrukcja z -ing', /\b(enjoy|love|like|hate|mind|stop|finish|good at|interested in|instead of)\s+\w+ing\b/i],
  ['Stopniowanie', /\b(\w+er than|more \w+ than|the most \w+|the \w+est|as \w+ as)\b/i],
  ['Strona bierna', /\b(was|were|is|are|been)\s+\w+(ed|en)\b/i],
];

export interface ErrorHit {
  pattern: string;
  match: string;
  hintPl: string;
  fix?: string;
}

const ERROR_RULES: { re: RegExp; hintPl: string; fix?: (m: string) => string }[] = [
  { re: /\bi am agree\b/gi, hintPl: '„agree” to czasownik – bez „am”.', fix: () => 'I agree' },
  { re: /\b(he|she|it) (don't|have|go|want|like|live|work|play|do)\b/gi, hintPl: 'W 3. osobie l.poj. czasownik dostaje -s / does not / has.' },
  { re: /\b(i|you|we|they) (has|doesn't|goes|wants|likes)\b/gi, hintPl: 'Ta forma pasuje tylko do he/she/it.' },
  { re: /\bdid(n't| not) (went|saw|had|bought|made|came|took|got|told)\b/gi, hintPl: 'Po did/didn\'t używamy formy podstawowej czasownika.' },
  { re: /\b(can|could|must|should|will|would|might) to\b/gi, hintPl: 'Po czasownikach modalnych nie ma „to”.' },
  { re: /\b(can|could|must|should|will|would|might) (goes|went|going|wanted|likes)\b/gi, hintPl: 'Po czasowniku modalnym – forma podstawowa.' },
  { re: /\bmore (better|worse|bigger|easier|cheaper|faster|older|younger|nicer)\b/gi, hintPl: 'Podwójne stopniowanie – wystarczy „better/bigger…”.' },
  { re: /\b(informations|advices|furnitures|homeworks|equipments|luggages|knowledges)\b/gi, hintPl: 'Ten rzeczownik jest niepoliczalny – nie ma liczby mnogiej.' },
  { re: /\bpeoples\b/gi, hintPl: '„people” jest już liczbą mnogą.' },
  { re: /\bmuch (people|friends|things|books|students|tourists)\b/gi, hintPl: 'Z policzalnymi w l.mn. używamy „many”.' },
  { re: /\bsince (\d+|two|three|four|five|a few) (years|months|weeks|days)\b/gi, hintPl: 'Okres czasu: „for two years”, „since” + punkt w czasie.' },
  { re: /\b(explain|describe) me\b/gi, hintPl: '„explain/describe sth to me”.' },
  { re: /\bdiscuss about\b/gi, hintPl: '„discuss sth” – bez „about”.' },
  { re: /\blisten (music|the radio|songs)\b/gi, hintPl: '„listen TO music”.' },
  { re: /\b(yesterday|last (week|weekend|month|year|summer)|ago)\b[^.!?]{0,30}\b(i|we|they) (go|see|have|buy|meet|take|come|decide|visit)\b/gi, hintPl: 'Mówisz o przeszłości – użyj Past Simple.' },
  { re: /\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, hintPl: 'Z dniami tygodnia: „on Monday”.' },
  { re: /\ba (apple|hour|idea|interesting|amazing|old|email|e-mail|exam|event|honest|unusual)\b/gi, hintPl: 'Przed samogłoską (w wymowie) – „an”.' },
  { re: /\bthe (most|best) \w+ (then)\b/gi, hintPl: 'W porównaniach – „than”.' },
  { re: /\b\w+er then\b/gi, hintPl: 'W porównaniach – „than”, nie „then”.' },
  { re: /(?:^|[\s.!?,])i(?=['\s,.!?])/g, hintPl: 'Zaimek „I” zawsze wielką literą.' },
  { re: /\bdefinately\b|\brecieve\b|\bbeggining\b|\bbeatiful\b|\bwich\b|\bbecouse\b|\btommorow\b|\bfreind\b|\bintresting\b|\bdesicion\b|\bwether\b|\buntill\b|\bexcercise\b|\bacommodation\b|\bwritting\b/gi, hintPl: 'Błąd ortograficzny.' },
];

export function detectErrors(text: string): ErrorHit[] {
  const hits: ErrorHit[] = [];
  for (const r of ERROR_RULES) {
    r.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.re.exec(text)) !== null) {
      hits.push({ pattern: r.re.source, match: m[0].trim(), hintPl: r.hintPl, fix: r.fix?.(m[0]) });
      if (!r.re.global) break;
    }
  }
  return hits;
}

export interface PointAnalysis {
  id: string;
  textPl: string;
  sentences: number;
  status: 'missing' | 'addressed' | 'developed';
  pastTenseWarning: boolean;
}

function cueMatch(sentence: string, cues: string[]): boolean {
  const s = sentence.toLowerCase();
  return cues.some((c) => (c.startsWith('re:') ? new RegExp(c.slice(3), 'i').test(s) : s.includes(c)));
}

export function analysePoints(text: string, prompt: WritingPrompt): PointAnalysis[] {
  const sentences = splitSentences(text);
  const used = new Set<number>();
  return prompt.points.map((p) => {
    const idx = sentences.map((s, i) => (cueMatch(s, p.cues) && !used.has(i) ? i : -1)).filter((i) => i >= 0);
    idx.forEach((i) => used.add(i));
    const relevant = idx.map((i) => sentences[i]);
    const longOne = relevant.some((s) => countWords(s) >= 14);
    let status: PointAnalysis['status'] = 'missing';
    if (relevant.length >= 2 || (relevant.length === 1 && longOne)) status = 'developed';
    else if (relevant.length === 1) status = 'addressed';
    const pastTenseWarning =
      !!p.pastTense && status !== 'missing' && !relevant.some((s) => /\b(was|were|did|had|went|\w+ed)\b/i.test(s));
    return { id: p.id, textPl: p.textPl, sentences: relevant.length, status, pastTenseWarning };
  });
}

export interface WritingAssessment {
  words: number;
  wordStatus: 'too-short-to-score' | 'below-range' | 'in-range' | 'above-range';
  points: PointAnalysis[];
  estimate: CriteriaScores;
  totalEstimate: number;
  range: [number, number];
  connectorsUsed: string[];
  preciseUsed: string[];
  structures: string[];
  errors: ErrorHit[];
  checklistPl: string[];
  provisional: true;
}

export function assessWriting(text: string, prompt: WritingPrompt, selfAssessed?: Record<string, 'missing' | 'addressed' | 'developed'>): WritingAssessment {
  const words = countWritingWords(text, prompt.opening);
  const lower = ` ${text.toLowerCase().replace(/[’]/g, "'")} `;
  const sentences = splitSentences(text);

  const points = analysePoints(text, prompt).map((p) =>
    selfAssessed?.[p.id] ? { ...p, status: selfAssessed[p.id] } : p,
  );
  const addressed = points.filter((p) => p.status !== 'missing').length;
  const developed = points.filter((p) => p.status === 'developed' && !p.pastTenseWarning).length;
  const content = contentPoints(addressed, developed);

  const connectorsUsed = CONNECTORS.filter((c) => new RegExp(`\\b${c.replace(/'/g, "'")}\\b`, 'i').test(lower));
  const coherence = sentences.length < 3 ? 0 : connectorsUsed.length >= 4 ? 2 : connectorsUsed.length >= 2 ? 1 : 0;

  const preciseUsed = PRECISE.filter((p) => lower.includes(p));
  const structures = STRUCTURES.filter(([, re]) => re.test(text)).map(([n]) => n);
  const tokens = lower.match(/[a-z']+/g) ?? [];
  const contentTokens = tokens.filter((t) => t.length > 3);
  const ttr = contentTokens.length ? new Set(contentTokens).size / contentTokens.length : 0;
  let range = 0;
  const richness = preciseUsed.length + structures.length;
  if (words >= 40) range = 1;
  if (richness >= 6 && ttr > 0.55) range = 2;
  if (richness >= 10 && ttr > 0.6 && structures.length >= 5) range = 3;

  const errors = detectErrors(text);
  const density = words ? errors.length / (words / 50) : 0; // errors per 50 words
  const accuracy = density <= 1 ? 2 : density <= 2.5 ? 1 : 0;

  const estimate = applyCkeRules({ content, coherence, range, accuracy }, words);
  const tot = total(estimate);
  // Uncertainty: the program cannot see meaning, so we widen by ±2 (±1 for very short texts).
  const spread = words < WRITING_SCORING_THRESHOLD ? 1 : 2;
  const rangeOut: [number, number] = [Math.max(0, tot - spread), Math.min(12, tot + spread)];

  const wordStatus: WritingAssessment['wordStatus'] =
    words < WRITING_SCORING_THRESHOLD ? 'too-short-to-score'
      : words < WRITING_MIN_WORDS ? 'below-range'
      : words > WRITING_MAX_WORDS ? 'above-range' : 'in-range';

  const checklistPl: string[] = [];
  points.forEach((p, i) => {
    if (p.status === 'missing') checklistPl.push(`Odnieś się do podpunktu ${i + 1}: ${p.textPl}`);
    else if (p.status === 'addressed') checklistPl.push(`Rozwiń podpunkt ${i + 1} – dodaj szczegół, przykład lub uzasadnienie (co najmniej 2–3 zdania).`);
    if (p.pastTenseWarning) checklistPl.push(`Podpunkt ${i + 1} dotyczy przeszłości – użyj czasu przeszłego.`);
  });
  if (wordStatus === 'too-short-to-score') checklistPl.push('Poniżej 80 wyrazów praca jest oceniana tylko za treść – pisz 100–150 wyrazów.');
  else if (wordStatus === 'below-range') checklistPl.push('Celuj w 100–150 wyrazów.');
  if (wordStatus === 'above-range') checklistPl.push('Przekroczenie 150 wyrazów nie odbiera punktów, ale zwiększa ryzyko błędów.');
  if (connectorsUsed.length < 4) checklistPl.push('Łącz zdania: because, so, however, although, after that, that\'s why…');
  if (range < 2) checklistPl.push('Dodaj precyzyjne sformułowania zamiast „nice / good / interesting”.');
  if (errors.length) checklistPl.push('Sprawdź oznaczone błędy i przeczytaj tekst jeszcze raz pod kątem czasów i pisowni.');

  return {
    words, wordStatus, points, estimate, totalEstimate: tot, range: rangeOut,
    connectorsUsed, preciseUsed, structures, errors, checklistPl, provisional: true,
  };
}

/**
 * Answer normalisation. Only differences CKE itself ignores are normalised:
 * letter case, surrounding whitespace, typographic apostrophes and a trailing
 * full stop. Contractions are treated as equal to their full forms
 * ("don't" = "do not"), which CKE keys routinely accept.
 */

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bshan't\b/g, 'shall not'],
  [/\bain't\b/g, 'am not'],
  [/\blet's\b/g, 'let us'],
  [/\b(\w+)n't\b/g, '$1 not'],
  [/\bi'm\b/g, 'i am'],
  [/\b(you|we|they|who)'re\b/g, '$1 are'],
  [/\b(i|you|we|they|who)'ve\b/g, '$1 have'],
  [/\b(i|you|he|she|it|we|they|who|that|there)'ll\b/g, '$1 will'],
  [/\b(i|you|he|she|we|they)'d\b/g, '$1 would'],
  [/\b(he|she|it|that|there|what|who|where)'s\b/g, '$1 is'],
];

export function normalizeBasic(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
    .trim()
    .toLowerCase();
}

/** Expands contractions so "don't" and "do not" compare equal. "cannot" also covers "can not". */
export function expandContractions(s: string): string {
  let out = s;
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out.replace(/\bcan not\b/g, 'cannot');
}

export function canonical(s: string): string {
  return expandContractions(normalizeBasic(s));
}

/**
 * Expand optional parts written in parentheses: "(the) train station" ->
 * ["the train station", "train station"].
 */
export function expandOptional(pattern: string): string[] {
  const m = pattern.match(/\(([^()]*)\)/);
  if (!m || m.index === undefined) return [pattern.replace(/\s+/g, ' ').trim()];
  const before = pattern.slice(0, m.index);
  const after = pattern.slice(m.index + m[0].length);
  return [...expandOptional(before + m[1] + after), ...expandOptional(before + after)];
}

/** CKE word counting: tokens separated by whitespace; contractions & hyphenated words count as one. */
export function countWords(s: string): number {
  const tokens = s
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    // emoticons / pure punctuation are not counted
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
  return tokens.length;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

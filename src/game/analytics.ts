import type { Skill } from '../content/types';
import type { AppState, Attempt } from '../store/types';

/** Minimum scored attempts before we call a skill/topic weak or strong. */
export const MIN_EVIDENCE = 6;

export interface Stat {
  key: string;
  correct: number;
  total: number;
  accuracy: number;
  recentAccuracy: number; // last 15
  status: 'untested' | 'uncertain' | 'measured';
}

const scored = (a: Attempt) => a.verdict === 'correct' || a.verdict === 'incorrect' || a.verdict === 'unanswered';

/** Attempts that count for statistics. Transcript-mode listening is excluded (it was reading, not listening). */
export function countable(state: AppState): Attempt[] {
  return state.attempts.filter((a) => scored(a) && a.mode !== 'transcript');
}

export function statBy(attempts: Attempt[], keyFn: (a: Attempt) => string | undefined): Record<string, Stat> {
  const out: Record<string, Stat> = {};
  const byKey: Record<string, Attempt[]> = {};
  for (const a of attempts) {
    const k = keyFn(a);
    if (!k) continue;
    (byKey[k] ??= []).push(a);
  }
  for (const [k, list] of Object.entries(byKey)) {
    const correct = list.filter((a) => a.verdict === 'correct').length;
    const recent = list.slice(-15);
    const rc = recent.filter((a) => a.verdict === 'correct').length;
    out[k] = {
      key: k, correct, total: list.length,
      accuracy: correct / list.length,
      recentAccuracy: rc / recent.length,
      status: list.length === 0 ? 'untested' : list.length < MIN_EVIDENCE ? 'uncertain' : 'measured',
    };
  }
  return out;
}

export const SKILLS: Skill[] = ['listening', 'reading', 'grammar', 'vocabulary', 'functions', 'writing'];

export function skillStats(state: AppState): Record<Skill, Stat> {
  const s = statBy(countable(state), (a) => a.skill);
  const out = {} as Record<Skill, Stat>;
  for (const sk of SKILLS) {
    if (sk === 'writing') {
      const h = state.writing.history;
      const acc = h.length ? h.reduce((x, r) => x + r.estimate / 12, 0) / h.length : 0;
      const recent = h.slice(-3);
      out.writing = {
        key: 'writing', correct: 0, total: h.length, accuracy: acc,
        recentAccuracy: recent.length ? recent.reduce((x, r) => x + r.estimate / 12, 0) / recent.length : 0,
        status: h.length === 0 ? 'untested' : h.length < 2 ? 'uncertain' : 'measured',
      };
      continue;
    }
    out[sk] = s[sk] ?? { key: sk, correct: 0, total: 0, accuracy: 0, recentAccuracy: 0, status: 'untested' };
  }
  return out;
}

export function tagStats(state: AppState) {
  return statBy(countable(state), (a) => a.tag);
}

/** Weakest skill with enough evidence; undefined when nothing is measured yet. */
export function weakestSkill(state: AppState): Skill | undefined {
  const st = Object.values(skillStats(state)).filter((s) => s.status === 'measured');
  if (!st.length) return undefined;
  return st.sort((a, b) => a.recentAccuracy - b.recentAccuracy)[0].key as Skill;
}

/**
 * Readiness estimate on the 60-point paper scale, weighted by official section
 * points (15/20/13/12). Sections without enough evidence are reported as unknown
 * and the estimate is shown as a range, never as a single confident number.
 */
export function readiness(state: AppState) {
  const sk = skillStats(state);
  const lang = [sk.grammar, sk.vocabulary, sk.functions];
  const langTotal = lang.reduce((s, x) => s + x.total, 0);
  const langAcc = langTotal ? lang.reduce((s, x) => s + x.recentAccuracy * x.total, 0) / langTotal : 0;
  const sections = [
    { id: 'listening', max: 15, acc: sk.listening.recentAccuracy, n: sk.listening.total, need: MIN_EVIDENCE },
    { id: 'reading', max: 20, acc: sk.reading.recentAccuracy, n: sk.reading.total, need: MIN_EVIDENCE },
    { id: 'language', max: 13, acc: langAcc, n: langTotal, need: MIN_EVIDENCE },
    { id: 'writing', max: 12, acc: sk.writing.recentAccuracy, n: sk.writing.total, need: 1 },
  ];
  const known = sections.filter((s) => s.n >= s.need);
  const unknown = sections.filter((s) => s.n < s.need);
  const knownPts = known.reduce((s, x) => s + x.acc * x.max, 0);
  const unknownMax = unknown.reduce((s, x) => s + x.max, 0);
  const lastExam = Object.values(state.exams).filter((e) => e.result).sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))[0];
  return {
    sections,
    measuredShare: known.reduce((s, x) => s + x.max, 0) / 60,
    low: Math.round(knownPts),
    high: Math.round(knownPts + unknownMax),
    unknown: unknown.map((u) => u.id),
    lastExam: lastExam?.result ? { points: lastExam.result.points, max: lastExam.result.max, ts: lastExam.submittedAt! } : undefined,
  };
}

export interface Recommendation {
  kind: 'weak-tag' | 'weak-skill' | 'untested' | 'mistakes' | 'vocab' | 'writing' | 'diagnostic' | 'exam';
  textPl: string;
  route: string;
}

const TAG_NAMES: Record<string, string> = {
  'present-perfect': 'Present Perfect', 'past-simple': 'Past Simple', 'past-continuous': 'Past Continuous',
  'present-simple': 'Present Simple', conditionals: 'zdania warunkowe', passive: 'strona bierna', modals: 'czasowniki modalne',
  comparatives: 'stopniowanie przymiotników', quantifiers: 'określniki ilości (much/many…)', 'gerund-infinitive': 'gerund i bezokolicznik',
  'relative-clauses': 'zdania względne', 'reported-speech': 'mowa zależna', prepositions: 'przyimki', articles: 'przedimki', future: 'wyrażanie przyszłości',
  questions: 'tworzenie pytań', 'indirect-questions': 'pytania pośrednie', 'fixed-phrases': 'stałe wyrażenia', 'word-order': 'szyk zdania',
};
export const tagName = (t: string) => TAG_NAMES[t] ?? t;

const DRILL_FOR_TAG: Record<string, string> = {
  'present-perfect': 'sd-pp', 'past-simple': 'sd-past', 'past-continuous': 'sd-past', 'present-simple': 'sd-pres', conditionals: 'sd-cond',
  passive: 'sd-pass', modals: 'sd-mod', comparatives: 'sd-comp', quantifiers: 'sd-quant', 'gerund-infinitive': 'sd-ger',
  'relative-clauses': 'sd-rel', 'reported-speech': 'sd-rel', articles: 'sd-art', future: 'sd-fut',
};

const SKILL_ROUTE: Record<string, string> = {
  listening: '/practice?section=listening', reading: '/practice?section=reading', grammar: '/practice?section=language',
  vocabulary: '/vocab', functions: '/practice?format=U_DIALOG_MC', writing: '/writing',
};

const SKILL_PL: Record<string, string> = {
  listening: 'rozumienie ze słuchu', reading: 'czytanie', grammar: 'gramatyka', vocabulary: 'słownictwo', functions: 'funkcje językowe', writing: 'pisanie',
};

export function recommendations(state: AppState, today: string): Recommendation[] {
  const recs: Recommendation[] = [];
  if (!state.diagnostic && countable(state).length < 10) {
    recs.push({ kind: 'diagnostic', textPl: 'Zrób krótki test diagnostyczny (ok. 10 min), żeby gra wiedziała, od czego zacząć.', route: '/diagnostic' });
  }
  const tags = Object.values(tagStats(state)).filter((t) => t.total >= 4 && t.recentAccuracy < 0.6).sort((a, b) => a.recentAccuracy - b.recentAccuracy);
  for (const t of tags.slice(0, 2)) {
    const drill = DRILL_FOR_TAG[t.key];
    recs.push({
      kind: 'weak-tag',
      textPl: `Często mylisz się w temacie „${tagName(t.key)}” (${Math.round(t.recentAccuracy * 100)}% poprawnych w ostatnich próbach). Zrób krótki trening i wróć do zadań maturalnych.`,
      route: drill ? `/session/new?groups=${drill}` : `/practice?section=language`,
    });
  }
  const due = Object.values(state.mistakes).filter((m) => !m.mastered && m.card.due <= today).length;
  if (due) recs.push({ kind: 'mistakes', textPl: `${due} ${due === 1 ? 'błąd czeka' : 'błędów czeka'} na powtórkę w zeszycie błędów.`, route: '/mistakes' });
  const ws = weakestSkill(state);
  if (ws && ws !== 'writing') {
    const s = skillStats(state)[ws];
    recs.push({ kind: 'weak-skill', textPl: `Najsłabsza umiejętność: ${SKILL_PL[ws]} (${Math.round(s.recentAccuracy * 100)}% ostatnio). Poćwicz zadania z tej części.`, route: SKILL_ROUTE[ws] });
  }
  const sk = skillStats(state);
  const untested = (Object.keys(sk) as Skill[]).filter((k) => sk[k].status === 'untested');
  if (untested.length && state.diagnostic) {
    recs.push({ kind: 'untested', textPl: `Jeszcze nie sprawdziliśmy: ${untested.map((u) => SKILL_PL[u]).join(', ')}. Spróbuj, żeby ocena gotowości była pełniejsza.`, route: SKILL_ROUTE[untested[0]] });
  }
  if (!state.writing.history.length) recs.push({ kind: 'writing', textPl: 'Napisz pierwszą wypowiedź pisemną – to 12 z 60 punktów na maturze.', route: '/writing' });
  if (countable(state).length > 80 && !Object.values(state.exams).some((e) => e.result)) {
    recs.push({ kind: 'exam', textPl: 'Masz za sobą sporo ćwiczeń – czas na pełny arkusz próbny (120 minut).', route: '/exam' });
  }
  return recs;
}

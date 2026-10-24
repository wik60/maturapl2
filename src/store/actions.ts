import { CONTENT_VERSION, getGroup, getPrompt } from '../content';
import { FORMATS } from '../content/formats';
import type { TaskGroup } from '../content/types';
import { type ItemResult, scoreGroup } from '../engine/validate';
import { assessWriting } from '../engine/writing';
import { type Blueprint } from '../exam/blueprint';
import { assembleExam } from '../exam/assemble';
import { checkAchievements } from '../game/achievements';
import { getLevel } from '../game/map';
import { generateQuests, progressQuests, type QuestEvent } from '../game/quests';
import { award, levelFromXp, pruneLedger, REWARDS } from '../game/rewards';
import { newCard, review } from '../game/srs';
import { currentStreak } from '../game/streak';
import { dayKey } from '../game/time';
import type { AppState, AttemptMode, ExamResult, ExamSession, PracticeSession, RewardSummary } from './types';

const MAX_ATTEMPTS = 2500;

export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const today = (s: AppState, now: number) => dayKey(now, s.settings.timeZone);

/* -------------------------------- units -------------------------------- */

/** A unit is a whole group ("lm1") or a single item of a group ("lm1#lm1.3"). */
export function resolveUnit(unit: string): TaskGroup | undefined {
  const [gid, iid] = unit.split('#');
  const g = getGroup(gid);
  if (!g) return undefined;
  if (!iid) return g;
  const item = g.items.find((i) => i.id === iid);
  return item ? { ...g, items: [item] } : undefined;
}

function emptyReward(): RewardSummary {
  return { xp: 0, coins: 0, achievements: [], questsDone: [] };
}

export function ensureDaily(state: AppState, now: number) {
  const t = today(state, now);
  if (state.quests.day !== t) {
    state.quests = { day: t, list: generateQuests(state, t) };
    pruneLedger(state, t);
  }
  state.days[t] ??= { items: 0, sessions: 0, vocab: 0 };
  return t;
}

function finishRewards(state: AppState, now: number, before: { xp: number; coins: number }, ev: QuestEvent, r: RewardSummary) {
  const t = ensureDaily(state, now);
  const done = progressQuests(state.quests.list, ev);
  for (const q of done) {
    award(state, `q:${q.id}`, REWARDS.questCompleted, now);
    r.questsDone.push(q.id);
  }
  state.bestStreak = Math.max(state.bestStreak, currentStreak(state.days, t));
  r.achievements.push(...checkAchievements(state, t, now));
  r.xp = state.xp - before.xp;
  r.coins = state.coins - before.coins;
  const lb = levelFromXp(before.xp);
  const la = levelFromXp(state.xp);
  if (la > lb) r.levelUp = la;
  return r;
}

/* ------------------------------- sessions ------------------------------- */

export function startSession(state: AppState, now: number, s: Pick<PracticeSession, 'kind' | 'title' | 'units' | 'levelId'>): string {
  const units = s.units.filter((u) => !!resolveUnit(u));
  const id = uid('s');
  state.sessions[id] = { id, ...s, units, answers: {}, submitted: [], contentVersion: CONTENT_VERSION, startedAt: now };
  state.activeSessionId = id;
  // keep only the 40 most recent sessions
  const all = Object.values(state.sessions).sort((a, b) => b.startedAt - a.startedAt);
  for (const old of all.slice(40)) if (old.id !== id) delete state.sessions[old.id];
  return id;
}

export function setAnswer(state: AppState, sessionId: string, itemId: string, value: string) {
  const s = state.sessions[sessionId];
  if (!s || s.finishedAt) return;
  s.answers[itemId] = value;
}

export interface UnitOutcome {
  results: ItemResult[];
  points: number;
  max: number;
  reward: RewardSummary;
  already: boolean;
}

/**
 * Checks one unit. Idempotent: re-submitting (double tap, refresh) returns the
 * same results and grants nothing new.
 */
export function submitUnit(state: AppState, now: number, sessionId: string, unit: string, opts: { transcript?: boolean } = {}): UnitOutcome | undefined {
  const s = state.sessions[sessionId];
  const g = resolveUnit(unit);
  if (!s || !g) return undefined;
  const sc = scoreGroup(g, s.answers);
  if (s.submitted.includes(unit)) return { results: sc.results, points: sc.points, max: sc.max, reward: emptyReward(), already: true };
  const before = { xp: state.xp, coins: state.coins };
  const t = ensureDaily(state, now);
  s.submitted.push(unit);
  const fmt = FORMATS[g.format];
  const mode: AttemptMode = opts.transcript && fmt.section === 'listening' ? 'transcript' : s.kind;
  if (opts.transcript) (s.listeningFallback ??= {})[unit] = true;
  const ev: QuestEvent = {};
  let answered = 0;

  for (const r of sc.results) {
    if (r.verdict === 'invalid') continue;
    const item = g.items.find((i) => i.id === r.itemId)!;
    state.attempts.push({
      id: uid('a'), itemId: r.itemId, groupId: g.id, format: g.format, skill: fmt.skill, section: fmt.section,
      tag: item.tag, difficulty: g.difficulty, given: r.given, verdict: r.verdict, ts: now, mode, sessionId,
    });
    if (r.verdict !== 'unanswered') answered++;
    if (r.verdict === 'correct') {
      state.currentRun++;
      state.bestRun = Math.max(state.bestRun, state.currentRun);
      if (mode !== 'transcript') award(state, `c:${r.itemId}:${t}`, REWARDS.correctAnswer, now);
      const m = state.mistakes[r.itemId];
      if (m && !m.mastered) {
        m.card = review(m.card, 4, t);
        if (s.kind === 'mistakes') {
          ev.fixed = (ev.fixed ?? 0) + 1;
          award(state, `fix:${r.itemId}:${t}`, REWARDS.mistakeFixed, now);
          if (m.card.reps >= 2) m.mastered = true;
        }
      }
    } else {
      state.currentRun = 0;
      const m = state.mistakes[r.itemId];
      if (m) {
        m.count++; m.lastTs = now; m.lastGiven = r.given; m.mastered = false; m.card = review(m.card, 0, t);
      } else {
        state.mistakes[r.itemId] = {
          itemId: r.itemId, groupId: g.id, skill: fmt.skill, lastGiven: r.given, count: 1,
          firstTs: now, lastTs: now, mastered: false, card: review(newCard(t), 0, t),
        };
      }
    }
  }
  if (answered > 0) award(state, `g:${sessionId}:${unit}`, REWARDS.groupCompleted, now);
  state.days[t].items += answered;
  if (mode !== 'transcript') {
    if (fmt.section === 'listening') ev.listening = answered;
    if (fmt.section === 'reading') ev.reading = answered;
    if (fmt.section === 'language') ev.language = answered;
  }
  ev.any = answered;
  if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
  const reward = finishRewards(state, now, before, ev, emptyReward());
  s.xpEarned = (s.xpEarned ?? 0) + reward.xp;
  return { results: sc.results, points: sc.points, max: sc.max, reward, already: false };
}

export interface SessionSummary {
  points: number;
  max: number;
  ratio: number;
  levelPassed?: boolean;
  levelMastered?: boolean;
  reward: RewardSummary;
}

export function finishSession(state: AppState, now: number, sessionId: string): SessionSummary | undefined {
  const s = state.sessions[sessionId];
  if (!s) return undefined;
  let points = 0;
  let max = 0;
  for (const u of s.units) {
    const g = resolveUnit(u);
    if (!g) continue;
    const sc = scoreGroup(g, s.answers);
    points += sc.points;
    max += sc.max;
  }
  const ratio = max ? points / max : 0;
  const before = { xp: state.xp, coins: state.coins };
  const r = emptyReward();
  const summary: SessionSummary = { points, max, ratio, reward: r };
  if (s.finishedAt) return summary; // idempotent
  const t = ensureDaily(state, now);
  s.finishedAt = now;
  if (state.activeSessionId === sessionId) state.activeSessionId = undefined;
  if (s.submitted.length) state.days[t].sessions++;

  if (s.levelId) {
    const lvl = getLevel(s.levelId);
    if (lvl) {
      const lp = (state.levels[lvl.id] ??= { best: 0, attempts: 0 });
      lp.attempts++;
      lp.best = Math.max(lp.best, ratio);
      if (ratio >= lvl.passRatio && !lp.completedAt) {
        lp.completedAt = now;
        award(state, `lvl:${lvl.id}:done`, lvl.xp, now);
      }
      if (ratio >= lvl.masterRatio && !lp.masteredAt) {
        lp.masteredAt = now;
        award(state, `lvl:${lvl.id}:master`, REWARDS.levelMastered, now);
      }
      summary.levelPassed = !!lp.completedAt && ratio >= lvl.passRatio;
      summary.levelMastered = ratio >= lvl.masterRatio;
    }
  }
  if (s.kind === 'diagnostic') {
    computeDiagnostic(state, s, now);
    award(state, 'diagnostic', REWARDS.diagnosticCompleted, now);
  }
  summary.reward = finishRewards(state, now, before, {}, r);
  return summary;
}

function computeDiagnostic(state: AppState, s: PracticeSession, now: number) {
  const by: Record<string, { correct: number; total: number }> = {};
  for (const a of state.attempts.filter((x) => x.sessionId === s.id)) {
    const k = a.mode === 'transcript' ? 'listening-transcript' : a.skill;
    by[k] ??= { correct: 0, total: 0 };
    by[k].total++;
    if (a.verdict === 'correct') by[k].correct++;
  }
  delete by['listening-transcript'];
  const measured = Object.entries(by).filter(([, v]) => v.total >= 3);
  const sorted = measured.sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total);
  const strongest = sorted.filter(([, v]) => v.correct / v.total >= 0.75).map(([k]) => k);
  const weakest = sorted.filter(([, v]) => v.correct / v.total < 0.5).map(([k]) => k);
  const uncertain = ['listening', 'reading', 'grammar', 'vocabulary', 'functions', 'writing'].filter((k) => !by[k] || by[k].total < 3);
  state.diagnostic = { ts: now, bySkill: by, strongest, weakest, uncertain };
}

/* ------------------------------- mistakes ------------------------------- */

export function setMistakeMastered(state: AppState, itemId: string, mastered: boolean) {
  const m = state.mistakes[itemId];
  if (m) m.mastered = mastered;
}

export function clearHistory(state: AppState, what: 'mistakes' | 'all', now: number): AppState {
  if (what === 'mistakes') {
    state.mistakes = {};
    return state;
  }
  const keep = state.settings;
  const fresh = JSON.parse(JSON.stringify(state)) as AppState;
  Object.assign(fresh, {
    xp: 0, coins: 0, ledger: {}, days: {}, attempts: [], mistakes: {}, vocab: {}, sessions: {}, exams: {},
    activeSessionId: undefined, activeExamId: undefined, quests: { day: '', list: [] }, achievements: {}, levels: {},
    writing: { drafts: {}, history: [] }, diagnostic: undefined, purchases: ['ink-blue'], bestStreak: 0, bestRun: 0, currentRun: 0,
    createdAt: now,
  });
  fresh.settings = { ...keep, theme: 'ink-blue' };
  return fresh;
}

/* -------------------------------- vocab -------------------------------- */

export function reviewVocab(state: AppState, now: number, vocabId: string, grade: 0 | 3 | 4 | 5): RewardSummary {
  const before = { xp: state.xp, coins: state.coins };
  const t = ensureDaily(state, now);
  const card = state.vocab[vocabId] ?? newCard(t);
  state.vocab[vocabId] = { ...review(card, grade, t), known: state.vocab[vocabId]?.known };
  state.days[t].vocab++;
  award(state, `v:${vocabId}:${t}`, REWARDS.vocabReview, now);
  return finishRewards(state, now, before, { vocab: 1 }, emptyReward());
}

export function markVocabKnown(state: AppState, vocabId: string, known: boolean, now: number) {
  const t = today(state, now);
  const card = state.vocab[vocabId] ?? newCard(t);
  state.vocab[vocabId] = { ...card, known, due: known ? '9999-12-31' : t };
}

/* -------------------------------- writing ------------------------------- */

export function saveDraft(state: AppState, promptId: string, text: string) {
  state.writing.drafts[promptId] = text;
}

export function submitWriting(state: AppState, now: number, promptId: string, text: string, self?: Record<string, 'missing' | 'addressed' | 'developed'>) {
  const p = getPrompt(promptId);
  if (!p || !text.trim()) return undefined;
  const before = { xp: state.xp, coins: state.coins };
  const t = ensureDaily(state, now);
  const a = assessWriting(text, p, self);
  state.writing.history.push({ id: uid('w'), promptId, ts: now, words: a.words, range: a.range, estimate: a.totalEstimate, criteria: a.estimate });
  if (state.writing.history.length > 100) state.writing.history = state.writing.history.slice(-100);
  state.days[t].sessions++;
  if (a.words >= 40) award(state, `w:${promptId}:${t}`, REWARDS.writingSubmitted, now);
  const reward = finishRewards(state, now, before, { writing: 1 }, emptyReward());
  return { assessment: a, reward };
}

/* --------------------------------- exam --------------------------------- */

export function startExam(state: AppState, now: number, bp: Blueprint, autoSubmit = true): string {
  const recentlyUsed = Object.values(state.exams)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 1)
    .flatMap((e) => e.exam.slots.map((s) => s.groupId ?? s.promptId ?? ''));
  const exam = assembleExam(bp, { seed: now % 2147483647, recentlyUsed });
  const id = uid('e');
  state.exams[id] = {
    id, type: 'original-blueprint', exam, answers: {}, writing: {}, plays: {},
    startedAt: now, deadline: now + bp.minutes * 60_000, autoSubmit, contentVersion: CONTENT_VERSION,
  };
  state.activeExamId = id;
  return id;
}

export function setExamAnswer(state: AppState, examId: string, itemId: string, value: string) {
  const e = state.exams[examId];
  if (!e || e.submittedAt) return;
  e.answers[itemId] = value;
}

export function setExamWriting(state: AppState, examId: string, promptId: string, text: string) {
  const e = state.exams[examId];
  if (!e || e.submittedAt) return;
  e.writing[promptId] = text;
}

export function registerPlay(state: AppState, examId: string, clipId: string) {
  const e = state.exams[examId];
  if (!e || e.submittedAt) return;
  e.plays[clipId] = (e.plays[clipId] ?? 0) + 1;
}

export function scoreExam(e: ExamSession) {
  const sections: Record<string, { points: number; max: number }> = {};
  let points = 0;
  let max = 0;
  let invalidItems = 0;
  const perSlot: { slotId: string; points: number; max: number }[] = [];
  let writing: ExamResult['writing'];
  for (const s of e.exam.slots) {
    sections[s.slot.section] ??= { points: 0, max: 0 };
    if (s.promptId) {
      const p = getPrompt(s.promptId);
      if (!p) continue;
      const a = assessWriting(e.writing[s.promptId] ?? '', p);
      const pts = (e.writing[s.promptId] ?? '').trim() ? a.totalEstimate : 0;
      writing = { range: a.range, estimate: pts, criteria: a.estimate };
      sections.writing.points += pts;
      sections.writing.max += 12;
      points += pts;
      max += 12;
      perSlot.push({ slotId: s.slot.id, points: pts, max: 12 });
      continue;
    }
    const g = getGroup(s.groupId!);
    if (!g) continue;
    const sc = scoreGroup(g, e.answers);
    invalidItems += sc.results.filter((r) => r.verdict === 'invalid').length;
    sections[s.slot.section].points += sc.points;
    sections[s.slot.section].max += sc.max;
    points += sc.points;
    max += sc.max;
    perSlot.push({ slotId: s.slot.id, points: sc.points, max: sc.max });
  }
  return { points, max, sections, writing, invalidItems, perSlot };
}

export function submitExam(state: AppState, now: number, examId: string): RewardSummary | undefined {
  const e = state.exams[examId];
  if (!e) return undefined;
  if (e.submittedAt) return emptyReward();
  const before = { xp: state.xp, coins: state.coins };
  const t = ensureDaily(state, now);
  e.submittedAt = Math.min(now, e.deadline + 5000);
  const sc = scoreExam(e);
  e.result = { points: sc.points, max: sc.max, sections: sc.sections, writing: sc.writing, invalidItems: sc.invalidItems };
  if (state.activeExamId === examId) state.activeExamId = undefined;

  // record attempts (mode exam) for analytics & mistakes – exam answers count once
  for (const s of e.exam.slots) {
    if (!s.groupId) continue;
    const g = getGroup(s.groupId)!;
    const fmt = FORMATS[g.format];
    for (const r of scoreGroup(g, e.answers).results) {
      if (r.verdict === 'invalid') continue;
      const item = g.items.find((i) => i.id === r.itemId)!;
      state.attempts.push({ id: uid('a'), itemId: r.itemId, groupId: g.id, format: g.format, skill: fmt.skill, section: fmt.section, tag: item.tag, difficulty: g.difficulty, given: r.given, verdict: r.verdict, ts: now, mode: 'exam', sessionId: examId });
      if (r.verdict !== 'correct' && !state.mistakes[r.itemId]) {
        state.mistakes[r.itemId] = { itemId: r.itemId, groupId: g.id, skill: fmt.skill, lastGiven: r.given, count: 1, firstTs: now, lastTs: now, mastered: false, card: review(newCard(t), 0, t) };
      }
    }
  }
  const wp = e.exam.slots.find((s) => s.promptId);
  if (wp?.promptId && (e.writing[wp.promptId] ?? '').trim()) {
    const p = getPrompt(wp.promptId)!;
    const a = assessWriting(e.writing[wp.promptId], p);
    state.writing.history.push({ id: uid('w'), promptId: p.id, ts: now, words: a.words, range: a.range, estimate: a.totalEstimate, criteria: a.estimate });
  }
  if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
  state.days[t].sessions++;
  award(state, `exam:${examId}`, REWARDS.examCompleted, now);
  const lp = (state.levels['c8-1'] ??= { best: 0, attempts: 0 });
  lp.attempts++;
  const ratio = sc.max ? sc.points / sc.max : 0;
  lp.best = Math.max(lp.best, ratio);
  if (!lp.completedAt) { lp.completedAt = now; award(state, 'lvl:c8-1:done', 100, now); }
  if (ratio >= 0.7 && !lp.masteredAt) { lp.masteredAt = now; award(state, 'lvl:c8-1:master', REWARDS.levelMastered, now); }
  return finishRewards(state, now, before, {}, emptyReward());
}

export function abandonExam(state: AppState, examId: string) {
  delete state.exams[examId];
  if (state.activeExamId === examId) state.activeExamId = undefined;
}

/* ------------------------------- settings ------------------------------- */

export function buyCosmetic(state: AppState, id: string, price: number): boolean {
  if (state.purchases.includes(id)) return true;
  if (state.coins < price) return false;
  state.coins -= price;
  state.purchases.push(id);
  return true;
}


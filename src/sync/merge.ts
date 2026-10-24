import type { AppState } from '../store/types';

/**
 * Merges two progress snapshots (this device = `local`, cloud = `remote`).
 * Nothing learned on either device is dropped: attempts, sessions, exams and
 * writing are unioned by id; per-item learning state keeps the more advanced copy.
 * XP and coins take the higher value (rewards can't be double-counted, so a
 * merge never inflates them; at worst it under-counts what one device earned).
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const out: AppState = structuredClone(local);

  const byId = <T extends { id: string }>(a: T[], b: T[]) => {
    const m = new Map<string, T>();
    for (const x of [...b, ...a]) m.set(x.id, x);
    return [...m.values()];
  };

  out.createdAt = Math.min(local.createdAt, remote.createdAt);
  out.xp = Math.max(local.xp, remote.xp);
  out.coins = Math.max(local.coins, remote.coins);
  out.bestStreak = Math.max(local.bestStreak, remote.bestStreak);
  out.bestRun = Math.max(local.bestRun, remote.bestRun);

  out.ledger = { ...remote.ledger };
  for (const [k, ts] of Object.entries(local.ledger)) out.ledger[k] = Math.min(ts, out.ledger[k] ?? ts);

  out.attempts = byId(local.attempts, remote.attempts).sort((a, b) => a.ts - b.ts).slice(-2500);

  out.days = { ...remote.days };
  for (const [d, v] of Object.entries(local.days)) {
    const r = out.days[d];
    out.days[d] = r ? { items: Math.max(v.items, r.items), sessions: Math.max(v.sessions, r.sessions), vocab: Math.max(v.vocab, r.vocab) } : v;
  }

  out.mistakes = { ...remote.mistakes };
  for (const [id, m] of Object.entries(local.mistakes)) {
    const r = out.mistakes[id];
    out.mistakes[id] = !r || m.lastTs >= r.lastTs ? m : r;
  }

  out.vocab = { ...remote.vocab };
  for (const [id, c] of Object.entries(local.vocab)) {
    const r = out.vocab[id];
    if (!r) { out.vocab[id] = c; continue; }
    const pick = c.reps + c.lapses >= r.reps + r.lapses ? c : r;
    out.vocab[id] = { ...pick, known: c.known || r.known };
  }

  out.sessions = { ...remote.sessions };
  for (const [id, s] of Object.entries(local.sessions)) {
    const r = out.sessions[id];
    out.sessions[id] = !r ? s : (s.finishedAt && !r.finishedAt) || s.submitted.length >= r.submitted.length ? s : r;
  }

  out.exams = { ...remote.exams };
  for (const [id, e] of Object.entries(local.exams)) {
    const r = out.exams[id];
    out.exams[id] = !r || (e.submittedAt && !r.submittedAt) || (!r.submittedAt && Object.keys(e.answers).length >= Object.keys(r.answers).length) ? e : r;
  }

  const activeOk = (id?: string) => !!id && !!out.sessions[id] && !out.sessions[id].finishedAt;
  out.activeSessionId = activeOk(local.activeSessionId) ? local.activeSessionId : activeOk(remote.activeSessionId) ? remote.activeSessionId : undefined;
  const examOk = (id?: string) => !!id && !!out.exams[id] && !out.exams[id].submittedAt;
  out.activeExamId = examOk(local.activeExamId) ? local.activeExamId : examOk(remote.activeExamId) ? remote.activeExamId : undefined;

  if (local.quests.day === remote.quests.day) {
    out.quests = {
      day: local.quests.day,
      list: local.quests.list.map((q) => {
        const r = remote.quests.list.find((x) => x.id === q.id);
        if (!r) return q;
        const progress = Math.max(q.progress, r.progress);
        return { ...q, progress, done: q.done || r.done };
      }),
    };
  } else out.quests = local.quests.day > remote.quests.day ? local.quests : remote.quests;

  out.achievements = { ...remote.achievements };
  for (const [id, ts] of Object.entries(local.achievements)) out.achievements[id] = Math.min(ts, out.achievements[id] ?? ts);

  out.levels = { ...remote.levels };
  for (const [id, l] of Object.entries(local.levels)) {
    const r = out.levels[id];
    if (!r) { out.levels[id] = l; continue; }
    const minDef = (a?: number, b?: number) => (a && b ? Math.min(a, b) : a ?? b);
    out.levels[id] = { best: Math.max(l.best, r.best), attempts: Math.max(l.attempts, r.attempts), completedAt: minDef(l.completedAt, r.completedAt), masteredAt: minDef(l.masteredAt, r.masteredAt) };
  }

  out.writing = {
    drafts: { ...remote.writing.drafts, ...Object.fromEntries(Object.entries(local.writing.drafts).filter(([, v]) => v.trim())) },
    history: byId(local.writing.history, remote.writing.history).sort((a, b) => a.ts - b.ts).slice(-100),
  };

  if (remote.diagnostic && (!local.diagnostic || remote.diagnostic.ts > local.diagnostic.ts)) out.diagnostic = remote.diagnostic;
  out.purchases = [...new Set([...local.purchases, ...remote.purchases])];
  out.settings = local.settings;
  return out;
}

/** Short human summary for the conflict dialog. */
export function summarize(s: AppState) {
  const last = Math.max(0, ...s.attempts.map((a) => a.ts), ...s.writing.history.map((w) => w.ts));
  return {
    xp: s.xp,
    answers: s.attempts.length,
    levels: Object.values(s.levels).filter((l) => l.completedAt).length,
    exams: Object.values(s.exams).filter((e) => e.result).length,
    lastActivity: last || null,
  };
}

/** A state with no learning yet – adopting the cloud copy over it loses nothing. */
export function isEmptyProgress(s: AppState): boolean {
  return s.attempts.length === 0 && s.xp === 0 && s.writing.history.length === 0 && Object.keys(s.vocab).length === 0 && Object.values(s.exams).every((e) => !e.result);
}

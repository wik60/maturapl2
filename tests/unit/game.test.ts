import { describe, expect, test } from 'bun:test';
import { award, levelFromXp, levelProgress, xpForLevel } from '../../src/game/rewards';
import { isDue, newCard, review } from '../../src/game/srs';
import { currentStreak } from '../../src/game/streak';
import { addDays, dayKey } from '../../src/game/time';
import { CHAPTERS, isUnlocked, levelStatus } from '../../src/game/map';
import { generateQuests, progressQuests } from '../../src/game/quests';
import { readiness, recommendations } from '../../src/game/analytics';
import { defaultState } from '../../src/store/storage';

describe('levels and XP', () => {
  test('curve', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(300)).toBe(3);
    expect(levelProgress(150).ratio).toBeCloseTo(0.25);
  });
  test('awards are idempotent per key', () => {
    const s = defaultState(0);
    expect(award(s, 'k', 10, 1)).toBe(10);
    expect(award(s, 'k', 10, 2)).toBe(0);
    expect(s.xp).toBe(10);
    expect(s.coins).toBe(1);
  });
});

describe('time zone and streak', () => {
  test('day key respects the time zone', () => {
    const ts = Date.parse('2026-10-23T23:30:00Z'); // 01:30 on 24 Oct in Warsaw
    expect(dayKey(ts, 'Europe/Warsaw')).toBe('2026-10-24');
    expect(dayKey(ts, 'UTC')).toBe('2026-10-23');
  });
  test('streak counts meaningful days only', () => {
    const t = '2026-10-24';
    const days = {
      [t]: { items: 6, sessions: 0, vocab: 0 },
      [addDays(t, -1)]: { items: 0, sessions: 1, vocab: 0 },
      [addDays(t, -2)]: { items: 2, sessions: 0, vocab: 0 }, // not meaningful
      [addDays(t, -3)]: { items: 10, sessions: 1, vocab: 0 },
    };
    expect(currentStreak(days, t)).toBe(2);
  });
  test('streak stays alive until the end of today', () => {
    const t = '2026-10-24';
    expect(currentStreak({ [addDays(t, -1)]: { items: 9, sessions: 0, vocab: 0 } }, t)).toBe(1);
  });
});

describe('spaced repetition', () => {
  test('SM-2 intervals grow and reset on failure', () => {
    const t = '2026-10-24';
    let c = newCard(t);
    c = review(c, 4, t);
    expect(c.interval).toBe(1);
    c = review(c, 4, t);
    expect(c.interval).toBe(3);
    c = review(c, 5, t);
    expect(c.interval).toBeGreaterThan(3);
    const fail = review(c, 0, t);
    expect(fail.interval).toBe(1);
    expect(fail.lapses).toBe(1);
    expect(fail.ease).toBeGreaterThanOrEqual(1.3);
    expect(isDue(fail, addDays(t, 1))).toBe(true);
    expect(isDue(fail, t)).toBe(false);
  });
});

describe('map unlocking', () => {
  test('only the first level is available at start', () => {
    const s = defaultState(0);
    expect(levelStatus(s, CHAPTERS[0].levels[0])).toBe('available');
    expect(levelStatus(s, CHAPTERS[0].levels[1])).toBe('locked');
    expect(isUnlocked(s, CHAPTERS[1].levels[0])).toBe(false);
  });
  test('completing a level unlocks the next one and the next chapter', () => {
    const s = defaultState(0);
    s.levels['c1-1'] = { best: 0.8, attempts: 1, completedAt: 1 };
    expect(levelStatus(s, CHAPTERS[0].levels[1])).toBe('available');
    expect(isUnlocked(s, CHAPTERS[1].levels[0])).toBe(true);
    expect(levelStatus(s, CHAPTERS[0].levels[0])).toBe('completed');
  });
  test('every map level references existing content (groups or group#item units)', async () => {
    const { resolveUnit } = await import('../../src/store/actions');
    for (const l of CHAPTERS.flatMap((c) => c.levels)) {
      if (l.kind !== 'exam') expect(l.groupIds.length).toBeGreaterThan(0);
      for (const u of l.groupIds) expect(resolveUnit(u)).toBeDefined();
    }
  });
  test('every chapter has at least 12 steps; lessons in chapters 1–7 never repeat a task set', () => {
    for (const c of CHAPTERS) expect(c.levels.length).toBeGreaterThanOrEqual(12);
    const lessonUnits = CHAPTERS.slice(0, 7).flatMap((c) => c.levels.filter((l) => !l.kind).flatMap((l) => l.groupIds));
    expect(new Set(lessonUnits).size).toBe(lessonUnits.length);
    for (const c of CHAPTERS) expect(c.levels.filter((l) => l.kind === 'review').length).toBe(3);
  });
});

describe('quests', () => {
  test('three deterministic quests per day', () => {
    const s = defaultState(0);
    const a = generateQuests(s, '2026-10-24');
    const b = generateQuests(s, '2026-10-24');
    expect(a.length).toBe(3);
    expect(a.map((q) => q.type)).toEqual(b.map((q) => q.type));
  });
  test('progress completes a quest once', () => {
    const qs = [{ id: 'q', type: 'any-items' as const, target: 3, progress: 0, done: false }];
    expect(progressQuests(qs, { any: 2 }).length).toBe(0);
    expect(progressQuests(qs, { any: 2 }).length).toBe(1);
    expect(progressQuests(qs, { any: 2 }).length).toBe(0);
    expect(qs[0].progress).toBe(3);
  });
});

describe('analytics', () => {
  test('no data → readiness is a wide range with unknown sections, diagnostic recommended', () => {
    const s = defaultState(0);
    const r = readiness(s);
    expect(r.low).toBe(0);
    expect(r.high).toBe(60);
    expect(r.unknown.length).toBe(4);
    expect(recommendations(s, '2026-10-24')[0].kind).toBe('diagnostic');
  });
});

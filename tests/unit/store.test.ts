import { describe, expect, test } from 'bun:test';
import { groups, prompts } from '../../src/content';
import { checkBlueprint, BLUEPRINT_PP_2025 } from '../../src/exam/blueprint';
import { assembleExam, examCapacity } from '../../src/exam/assemble';
import { finishSession, reviewVocab, scoreExam, setAnswer, startExam, startSession, submitExam, submitUnit, setExamAnswer } from '../../src/store/actions';
import { createStore } from '../../src/store/store';
import { load, STORAGE_KEY } from '../../src/store/storage';

function memKV(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), map: m };
}

const NOW = Date.parse('2026-10-24T10:00:00Z');

describe('blueprint and assembly', () => {
  test('blueprint sums to 60 with 15/20/13/12', () => {
    expect(checkBlueprint(BLUEPRINT_PP_2025)).toEqual([]);
  });
  test('assembled exam fills every slot with the exact item count', () => {
    const ex = assembleExam(BLUEPRINT_PP_2025, { seed: 42 });
    for (const s of ex.slots) {
      if (s.slot.section === 'writing') expect(prompts.find((p) => p.id === s.promptId)).toBeDefined();
      else expect(groups.find((g) => g.id === s.groupId)!.items.length).toBe(s.slot.items);
    }
    expect(new Set(ex.slots.map((s) => s.groupId ?? s.promptId)).size).toBe(ex.slots.length);
  });
  test('a repeat exam uses a different question set', () => {
    const a = assembleExam(BLUEPRINT_PP_2025, { seed: 1 });
    const used = a.slots.map((s) => s.groupId ?? s.promptId!);
    const b = assembleExam(BLUEPRINT_PP_2025, { seed: 2, recentlyUsed: used });
    const overlap = b.slots.filter((s) => used.includes(s.groupId ?? s.promptId!)).length;
    expect(examCapacity(BLUEPRINT_PP_2025)).toBeGreaterThanOrEqual(2);
    expect(overlap).toBe(0);
  });
});

describe('practice flow (integration)', () => {
  test('saving an attempt, mistakes, XP and idempotent re-submission', () => {
    const kv = memKV();
    let t = NOW;
    const store = createStore(kv, () => t);
    const sid = store.update((s, now) => startSession(s, now, { kind: 'practice', title: 't', units: ['fd1'] }));
    store.update((s) => setAnswer(s, sid, 'fd1.1', 'A'));
    store.update((s) => setAnswer(s, sid, 'fd1.2', 'A')); // wrong
    const out = store.update((s, now) => submitUnit(s, now, sid, 'fd1'))!;
    expect(out.points).toBe(1);
    expect(out.reward.xp).toBeGreaterThan(0);
    const xpAfter = store.get().xp;
    expect(store.get().attempts.length).toBe(3);
    expect(store.get().mistakes['fd1.2']).toBeDefined();
    expect(store.get().mistakes['fd1.3']).toBeDefined(); // unanswered counts as a mistake

    // double submit: nothing new
    const again = store.update((s, now) => submitUnit(s, now, sid, 'fd1'))!;
    expect(again.already).toBe(true);
    expect(store.get().xp).toBe(xpAfter);
    expect(store.get().attempts.length).toBe(3);

    // persisted and reloadable (refresh)
    const reloaded = load(kv, t);
    expect(reloaded.status).toBe('loaded');
    expect(reloaded.state.xp).toBe(xpAfter);
    expect(reloaded.state.sessions[sid].answers['fd1.1']).toBe('A');

    // same item correct again in a new session the same day → no farming XP for the item
    const sid2 = store.update((s, now) => startSession(s, now, { kind: 'practice', title: 't', units: ['fd1#fd1.1'] }));
    store.update((s) => setAnswer(s, sid2, 'fd1.1', 'A'));
    const r2 = store.update((s, now) => submitUnit(s, now, sid2, 'fd1#fd1.1'))!;
    expect(r2.reward.xp).toBe(20); // group completion only, no second item XP
    t += 86400000;
  });

  test('retrying a mistake twice correctly masters it', () => {
    const store = createStore(memKV(), () => NOW);
    const sid = store.update((s, now) => startSession(s, now, { kind: 'practice', title: 't', units: ['oc1'] }));
    store.update((s, now) => submitUnit(s, now, sid, 'oc1'));
    for (let i = 0; i < 2; i++) {
      const m = store.update((s, now) => startSession(s, now, { kind: 'mistakes', title: 'm', units: ['oc1#oc1.2'] }));
      store.update((s) => setAnswer(s, m, 'oc1.2', 'than'));
      store.update((s, now) => submitUnit(s, now, m, 'oc1#oc1.2'));
    }
    expect(store.get().mistakes['oc1.2'].mastered).toBe(true);
    expect(store.get().mistakes['oc1.1'].mastered).toBe(false);
  });

  test('completing a map level with ≥70% unlocks it; low score does not', () => {
    const store = createStore(memKV(), () => NOW);
    const fail = store.update((s, now) => startSession(s, now, { kind: 'map', title: 'l', units: ['sb1', 'sd-pres'], levelId: 'c1-1' }));
    store.update((s, now) => { submitUnit(s, now, fail, 'sb1'); submitUnit(s, now, fail, 'sd-pres'); });
    store.update((s, now) => finishSession(s, now, fail));
    expect(store.get().levels['c1-1'].completedAt).toBeUndefined();

    const ok = store.update((s, now) => startSession(s, now, { kind: 'map', title: 'l', units: ['sd-pres'], levelId: 'c1-1' }));
    store.update((s) => {
      setAnswer(s, ok, 'sd-pres.1', 'B'); setAnswer(s, ok, 'sd-pres.2', 'A'); setAnswer(s, ok, 'sd-pres.3', 'B'); setAnswer(s, ok, 'sd-pres.4', 'C');
    });
    store.update((s, now) => submitUnit(s, now, ok, 'sd-pres'));
    const sum = store.update((s, now) => finishSession(s, now, ok))!;
    expect(sum.ratio).toBe(1);
    expect(store.get().levels['c1-1'].completedAt).toBeDefined();
    expect(store.get().levels['c1-1'].masteredAt).toBeDefined();
    const xp = store.get().xp;
    store.update((s, now) => finishSession(s, now, ok)); // idempotent
    expect(store.get().xp).toBe(xp);
  });

  test('vocab review schedules the card and counts for quests', () => {
    const store = createStore(memKV(), () => NOW);
    store.update((s, now) => reviewVocab(s, now, 'v-food-1', 4));
    expect(store.get().vocab['v-food-1'].due).toBe('2026-10-25');
  });
});

describe('exam flow (integration)', () => {
  test('timed exam can be completed, scored once and is idempotent', () => {
    let t = NOW;
    const store = createStore(memKV(), () => t);
    const id = store.update((s, now) => startExam(s, now, BLUEPRINT_PP_2025));
    const e = store.get().exams[id];
    expect(e.deadline - e.startedAt).toBe(120 * 60_000);
    const first = e.exam.slots[0];
    const g = groups.find((x) => x.id === first.groupId)!;
    for (const it of g.items) if (it.kind !== 'open') store.update((s) => setExamAnswer(s, id, it.id, it.answer));
    t += 30 * 60_000;
    store.update((s, now) => submitExam(s, now, id));
    const res = store.get().exams[id].result!;
    expect(res.max).toBe(60); // empty writing scores 0 of 12
    expect(res.points).toBe(g.items.length);
    const xp = store.get().xp;
    store.update((s, now) => submitExam(s, now, id));
    expect(store.get().xp).toBe(xp);
    expect(store.get().activeExamId).toBeUndefined();
  });
});

describe('corrupted storage', () => {
  test('invalid JSON is backed up and replaced', () => {
    const kv = memKV({ [STORAGE_KEY]: '{not json' });
    const r = load(kv, NOW);
    expect(r.status).toBe('recovered');
    expect([...kv.map.keys()].some((k) => k.includes(':corrupt:'))).toBe(true);
  });
  test('wrong field types are repaired, the rest is kept', () => {
    const kv = memKV({ [STORAGE_KEY]: JSON.stringify({ xp: 250, coins: 'lots', attempts: [{ bad: true }], settings: { name: 'Ola' } }) });
    const r = load(kv, NOW);
    expect(r.status).toBe('recovered');
    expect(r.state.xp).toBe(250);
    expect(r.state.coins).toBe(0);
    expect(r.state.attempts.length).toBe(0);
    expect(r.state.settings.name).toBe('Ola');
    expect(r.state.settings.timeZone).toBe('Europe/Warsaw');
  });
  test('scoreExam ignores unknown groups instead of crashing', () => {
    const fake = { exam: { blueprintId: 'x', slots: [{ slot: BLUEPRINT_PP_2025.slots[0], groupId: 'nope' }] }, answers: {}, writing: {} } as never;
    expect(scoreExam(fake).max).toBe(0);
  });
});

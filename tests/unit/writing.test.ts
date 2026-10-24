import { describe, expect, test } from 'bun:test';
import { getPrompt } from '../../src/content';
import { applyCkeRules, assessWriting, contentPoints, countWritingWords, detectErrors, total } from '../../src/engine/writing';

describe('official treść table (CKE, maj 2025)', () => {
  test('all cells', () => {
    expect(contentPoints(4, 4)).toBe(5);
    expect(contentPoints(4, 3)).toBe(4);
    expect(contentPoints(4, 2)).toBe(3);
    expect(contentPoints(4, 1)).toBe(2);
    expect(contentPoints(4, 0)).toBe(2);
    expect(contentPoints(3, 3)).toBe(3);
    expect(contentPoints(3, 2)).toBe(3);
    expect(contentPoints(3, 1)).toBe(2);
    expect(contentPoints(3, 0)).toBe(1);
    expect(contentPoints(2, 2)).toBe(2);
    expect(contentPoints(2, 1)).toBe(1);
    expect(contentPoints(2, 0)).toBe(1);
    expect(contentPoints(1, 1)).toBe(1);
    expect(contentPoints(1, 0)).toBe(0);
    expect(contentPoints(0, 0)).toBe(0);
  });
  test('developed cannot exceed addressed', () => {
    expect(contentPoints(2, 4)).toBe(2);
  });
});

describe('criteria dependency rules', () => {
  test('under 80 words: only content scored', () => {
    expect(applyCkeRules({ content: 4, coherence: 2, range: 3, accuracy: 2 }, 79)).toEqual({ content: 4, coherence: 0, range: 0, accuracy: 0 });
  });
  test('content 0 zeroes everything', () => {
    expect(total(applyCkeRules({ content: 0, coherence: 2, range: 3, accuracy: 2 }, 120))).toBe(0);
  });
  test('content 1 caps other criteria at 1', () => {
    expect(applyCkeRules({ content: 1, coherence: 2, range: 3, accuracy: 2 }, 120)).toEqual({ content: 1, coherence: 1, range: 1, accuracy: 1 });
  });
  test('maximum is 12', () => {
    expect(total({ content: 5, coherence: 2, range: 3, accuracy: 2 })).toBe(12);
  });
});

describe('assessment', () => {
  const p = getPrompt('wp1')!;
  test('model answer is within 100–150 words and addresses all points', () => {
    const a = assessWriting(p.modelAnswer, p);
    expect(a.words).toBeGreaterThanOrEqual(100);
    expect(a.words).toBeLessThanOrEqual(150);
    expect(a.points.every((x) => x.status !== 'missing')).toBe(true);
    expect(a.totalEstimate).toBeGreaterThanOrEqual(8);
    expect(a.provisional).toBe(true);
  });
  test('opening is not counted', () => {
    expect(countWritingWords(`${p.opening}\nOne two three.`, p.opening)).toBe(3);
  });
  test('very short text gets only content and a checklist', () => {
    const a = assessWriting('We went to Wrocław because our teacher chose it.', p);
    expect(a.wordStatus).toBe('too-short-to-score');
    expect(a.estimate.coherence + a.estimate.range + a.estimate.accuracy).toBe(0);
    expect(a.checklistPl.length).toBeGreaterThan(0);
  });
  test('self-assessment overrides automatic point detection', () => {
    const a = assessWriting(p.modelAnswer, p, { p1: 'missing', p2: 'missing', p3: 'missing', p4: 'missing' });
    expect(a.estimate.content).toBe(0);
    expect(a.totalEstimate).toBe(0);
  });
  test('typical errors are detected', () => {
    const hits = detectErrors('I am agree. He don\'t like it. I didn\'t went there. i like informations.');
    const hints = hits.map((h) => h.hintPl).join(' ');
    expect(hits.length).toBeGreaterThanOrEqual(4);
    expect(hints).toContain('agree');
  });
  test('every prompt model answer fits the word range', () => {
    for (const id of ['wp1', 'wp2', 'wp3', 'wp4', 'wp5', 'wp6']) {
      const pr = getPrompt(id)!;
      const w = countWritingWords(pr.modelAnswer, pr.opening);
      expect(w).toBeGreaterThanOrEqual(100);
      expect(w).toBeLessThanOrEqual(150);
    }
  });
});

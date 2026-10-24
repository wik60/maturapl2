import { describe, expect, test } from 'bun:test';
import type { OpenItem, TaskGroup } from '../../src/content/types';
import { canonical, countWords, expandOptional } from '../../src/engine/normalize';
import { scoreGroup, validateChoice, validateItem, validateOpen } from '../../src/engine/validate';
import { opts } from '../../src/content/data/helpers';

const open = (accepted: string[], extra: Partial<OpenItem> = {}): OpenItem => ({
  id: 'x', kind: 'open', accepted, marking: 'strict', explanationPl: 'wyjaśnienie', ...extra,
});

describe('normalisation', () => {
  test('case, spaces, apostrophes and final full stop are ignored', () => {
    expect(canonical('  Have   you EVER been. ')).toBe('have you ever been');
    expect(canonical('don’t')).toBe(canonical("don't"));
  });
  test('contractions equal full forms', () => {
    expect(canonical("don't have to bring")).toBe(canonical('do not have to bring'));
    expect(canonical("can't afford")).toBe(canonical('cannot afford'));
    expect(canonical('can not afford')).toBe(canonical('cannot afford'));
    expect(canonical("I'm")).toBe('i am');
  });
  test('optional parts expand', () => {
    expect(expandOptional('(the) cinnamon rolls').sort()).toEqual(['cinnamon rolls', 'the cinnamon rolls']);
    expect(expandOptional('(small) café').length).toBe(2);
  });
  test('CKE word counting', () => {
    expect(countWords("I don't like well-built houses :)")).toBe(5);
    expect(countWords('10 September 2025')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});

describe('open answers', () => {
  test('accepts listed answers in any case', () => {
    expect(validateOpen(open(['for']), 'FOR').verdict).toBe('correct');
  });
  test('multiple accepted answers', () => {
    const it = open(['at', 'near', 'by']);
    expect(validateOpen(it, 'near').verdict).toBe('correct');
    expect(validateOpen(it, 'on').verdict).toBe('incorrect');
  });
  test('strict marking rejects spelling errors', () => {
    expect(validateOpen(open(['which']), 'wich').verdict).toBe('incorrect');
  });
  test('comprehension marking tolerates one slip in long words but never in numbers', () => {
    const word = open(['dormitory'], { marking: 'comprehension' });
    expect(validateOpen(word, 'dormitry').verdict).toBe('correct');
    const num = open(['15 June'], { marking: 'comprehension' });
    expect(validateOpen(num, '16 June').verdict).toBe('incorrect');
    const short = open(['meat'], { marking: 'comprehension' });
    expect(validateOpen(short, 'meet').verdict).toBe('incorrect');
  });
  test('word limit is enforced', () => {
    const it = open(['was stolen'], { maxWords: 5 });
    expect(validateOpen(it, 'was stolen by somebody last week').verdict).toBe('incorrect');
  });
  test('missing key word is explained', () => {
    const r = validateOpen(open(['have never been'], { keyWord: 'NEVER' }), 'have not been');
    expect(r.verdict).toBe('incorrect');
    expect(r.reasonPl).toContain('NEVER');
  });
  test('empty answer is unanswered, missing key is invalid (never correct)', () => {
    expect(validateOpen(open(['x']), '  ').verdict).toBe('unanswered');
    const r = validateOpen(open([]), 'anything');
    expect(r.verdict).toBe('invalid');
    expect(r.points).toBe(0);
  });
});

describe('closed answers and groups', () => {
  const group: TaskGroup = {
    id: 'g', format: 'R_MATCH', title: 't', instructionPl: 'i', stimulus: { kind: 'none' }, topic: 't', difficulty: 1,
    source: { type: 'original', author: 'a', spec: 's' }, contentVersion: 1,
    options: opts('a', 'b', 'c'),
    items: [
      { id: 'g.1', kind: 'match', answer: 'A', explanationPl: 'xxxxxxxxx' },
      { id: 'g.2', kind: 'match', answer: 'B', explanationPl: 'xxxxxxxxx' },
      { id: 'g.3', kind: 'match', answer: 'Z', explanationPl: 'broken key' },
    ],
  };
  test('matching validates each mapping', () => {
    expect(validateItem(group, group.items[0], 'A').verdict).toBe('correct');
    expect(validateItem(group, group.items[1], 'A').verdict).toBe('incorrect');
  });
  test('broken answer key is never scored', () => {
    expect(validateChoice(group.items[2], 'Z', ['A', 'B', 'C']).verdict).toBe('invalid');
    const sc = scoreGroup(group, { 'g.1': 'A', 'g.2': 'C', 'g.3': 'Z' });
    expect(sc.points).toBe(1);
    expect(sc.max).toBe(2);
  });
});

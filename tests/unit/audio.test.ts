import { describe, expect, test } from 'bun:test';
import { clipHash } from '../../src/audio/clipHash';
import { allClips, attachGeneratedAudio } from '../../src/content';
import type { AudioClip } from '../../src/content/types';

const mk = (text: string): AudioClip => ({ id: 'x1', label: 'T', lines: [{ speaker: 'Man', voice: 'm', text }] });

describe('generated listening audio', () => {
  test('every clip id in the bank is unique (file names depend on it)', () => {
    const ids = allClips().map((c) => c.id);
    expect(ids.length).toBeGreaterThan(10);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('hash is stable and changes when the script changes', () => {
    expect(clipHash(mk('Hello.'))).toBe(clipHash(mk('Hello.')));
    expect(clipHash(mk('Hello.'))).not.toBe(clipHash(mk('Hello!')));
    expect(clipHash(mk('Hello.'))).toMatch(/^[0-9a-f]{8}$/);
  });
  test('a recording is attached only when its hash matches the current script', () => {
    const fresh = mk('Hello.');
    const edited = { ...mk('Hello there.'), id: 'x2' };
    const n = attachGeneratedAudio([fresh, edited], {
      x1: { file: './audio/x1.mp3', hash: clipHash(fresh), voices: ['bm_george'], seconds: 2 },
      x2: { file: './audio/x2.mp3', hash: clipHash(mk('Hello.')), voices: ['bm_george'], seconds: 2 },
    });
    expect(n).toBe(1);
    expect(fresh.url).toBe('./audio/x1.mp3');
    expect(edited.url).toBeUndefined();
  });
});

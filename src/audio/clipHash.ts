import type { AudioClip } from '../content/types';

/**
 * Stable fingerprint of a clip's script (speaker voice + text of every line).
 * Generated audio files carry the hash they were made from; when a script is edited the
 * hash changes, the old file is ignored and the app falls back to browser speech until
 * the recording is regenerated. Must match scripts/export-audio.ts (which imports this).
 */
export function clipHash(clip: Pick<AudioClip, 'lines'>): string {
  const s = clip.lines.map((l) => `${l.voice}|${l.speaker}|${l.text}`).join('\n');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

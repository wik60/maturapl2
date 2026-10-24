/**
 * Writes every listening script (with its hash) to audio-scripts.json for
 * scripts/generate_audio.py.   bun scripts/export-audio.ts [out.json]
 */
import { writeFileSync } from 'node:fs';
import { clipHash } from '../src/audio/clipHash';
import { allClips } from '../src/content';

const out = process.argv[2] ?? 'audio-scripts.json';
const clips = allClips().map((c) => ({ id: c.id, hash: clipHash(c), lines: c.lines }));
writeFileSync(out, JSON.stringify(clips, null, 1));
const chars = clips.reduce((s, c) => s + c.lines.reduce((t, l) => t + l.text.length, 0), 0);
console.log(`${clips.length} clips, ${chars} characters → ${out}`);

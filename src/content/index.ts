import { FORMATS } from './formats';
import { dialogGroups, grammaticaliseGroups, grammarMcGroups, lexicalGroups, openClozeGroups, transformGroups, translateOpenGroups, translationMcGroups } from './data/language';
import { listeningGapGroups, listeningMatchGroups, listeningMcGroups } from './data/listening';
import { readingMatchGroups, readingMcGroups, readingMultiGroups, readingSentenceGapGroups } from './data/reading';
import { grammarDrills, sentenceBuildGroups } from './data/supplementary';
import { vocabulary } from './data/vocab';
import { writingPrompts } from './data/writing';
import { clipHash } from '../audio/clipHash';
import { AUDIO_MANIFEST } from './data/audio-manifest';
import { type ContentIssue, validateGroup, validateVocab, validateWritingPrompt } from './schema';
import type { AudioClip, FormatId, Item, Skill, TaskGroup, WritingPrompt } from './types';

export const CONTENT_VERSION = 1;

const ALL_GROUPS: TaskGroup[] = [
  ...listeningMatchGroups, ...listeningMcGroups, ...listeningGapGroups,
  ...readingMatchGroups, ...readingMultiGroups, ...readingMcGroups, ...readingSentenceGapGroups,
  ...dialogGroups, ...lexicalGroups, ...translationMcGroups, ...grammarMcGroups,
  ...openClozeGroups, ...transformGroups, ...grammaticaliseGroups, ...translateOpenGroups,
  ...grammarDrills, ...sentenceBuildGroups,
];

export const contentIssues: ContentIssue[] = [];

function loadGroups(): TaskGroup[] {
  const ids = new Set<string>();
  const itemIds = new Set<string>();
  const ok: TaskGroup[] = [];
  for (const g of ALL_GROUPS) {
    const issues = validateGroup(g);
    if (ids.has(g.id)) issues.push({ id: g.id, problem: 'zduplikowane id grupy' });
    for (const it of g.items) {
      if (itemIds.has(it.id)) issues.push({ id: it.id, problem: 'zduplikowane id pozycji w banku' });
    }
    if (issues.length) {
      contentIssues.push(...issues);
      continue; // never serve or score invalid content
    }
    ids.add(g.id);
    g.items.forEach((it) => itemIds.add(it.id));
    ok.push(g);
  }
  return ok;
}

export const groups: TaskGroup[] = loadGroups();

/** Every listening clip in the bank (group-level and item-level). */
export function allClips(list: TaskGroup[] = groups): AudioClip[] {
  const out: AudioClip[] = [];
  for (const g of list) {
    if (g.stimulus.kind === 'audio') out.push(...g.stimulus.clips);
    for (const it of g.items) if (it.audio) out.push(it.audio);
  }
  return out;
}

/** Attach generated recordings whose script still matches the clip (stale files are ignored). */
export function attachGeneratedAudio(clips: AudioClip[], manifest = AUDIO_MANIFEST): number {
  let n = 0;
  for (const c of clips) {
    const rec = manifest[c.id];
    if (!c.url && rec && rec.hash === clipHash(c)) {
      c.url = rec.file;
      n++;
    }
  }
  return n;
}
attachGeneratedAudio(allClips());

export const prompts: WritingPrompt[] = writingPrompts.filter((p) => {
  const issues = validateWritingPrompt(p);
  contentIssues.push(...issues);
  return issues.length === 0;
});

export const vocab = vocabulary.filter((v) => {
  const issues = validateVocab(v);
  contentIssues.push(...issues);
  return issues.length === 0;
});

const groupById = new Map(groups.map((g) => [g.id, g]));
const itemIndex = new Map<string, { group: TaskGroup; item: Item }>();
groups.forEach((g) => g.items.forEach((item) => itemIndex.set(item.id, { group: g, item })));

export const getGroup = (id: string) => groupById.get(id);
export const getItem = (id: string) => itemIndex.get(id);
export const getPrompt = (id: string) => prompts.find((p) => p.id === id);
export const groupsByFormat = (f: FormatId) => groups.filter((g) => g.format === f);

export function skillOfItem(group: TaskGroup): Skill {
  return FORMATS[group.format].skill;
}

export function sectionOfGroup(group: TaskGroup) {
  return FORMATS[group.format].section;
}

/** Bank statistics for the traceability report. */
export function bankStats() {
  const byFormat: Record<string, { groups: number; items: number }> = {};
  for (const g of groups) {
    byFormat[g.format] ??= { groups: 0, items: 0 };
    byFormat[g.format].groups++;
    byFormat[g.format].items += g.items.length;
  }
  for (const p of prompts) {
    byFormat[p.format] ??= { groups: 0, items: 0 };
    byFormat[p.format].groups++;
    byFormat[p.format].items++;
  }
  return byFormat;
}

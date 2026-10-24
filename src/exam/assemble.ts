import { groups, prompts } from '../content';
import type { TaskGroup, WritingPrompt } from '../content/types';
import type { Blueprint, BlueprintSlot } from './blueprint';

export interface AssembledSlot {
  slot: BlueprintSlot;
  groupId?: string;
  promptId?: string;
}

export interface AssembledExam {
  blueprintId: string;
  slots: AssembledSlot[];
}

export class AssemblyError extends Error {}

/** Simple seeded PRNG so assembly is reproducible in tests. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds an exam that respects the blueprint exactly. Only validated, pre-authored
 * groups whose item count equals the slot size are eligible – nothing is generated.
 * Groups used in recent exams are avoided when an alternative exists.
 */
export function assembleExam(
  bp: Blueprint,
  opts: { seed: number; recentlyUsed?: string[]; bank?: TaskGroup[]; promptBank?: WritingPrompt[] },
): AssembledExam {
  const rnd = mulberry32(opts.seed);
  const recent = new Set(opts.recentlyUsed ?? []);
  const bank = opts.bank ?? groups;
  const pBank = opts.promptBank ?? prompts;
  const taken = new Set<string>();
  const pick = <T extends { id: string }>(cands: T[]): T | undefined => {
    const fresh = cands.filter((c) => !recent.has(c.id));
    const pool = fresh.length ? fresh : cands;
    return pool.length ? pool[Math.floor(rnd() * pool.length)] : undefined;
  };

  const slots: AssembledSlot[] = bp.slots.map((slot) => {
    if (slot.section === 'writing') {
      const cands = pBank.filter((p) => slot.formats.includes(p.format));
      const p = pick(cands);
      if (!p) throw new AssemblyError(`Brak tematu wypowiedzi dla ${slot.label}`);
      return { slot, promptId: p.id };
    }
    const cands = bank.filter((g) => slot.formats.includes(g.format) && g.items.length === slot.items && !taken.has(g.id));
    const g = pick(cands);
    if (!g) throw new AssemblyError(`Brak zadania o ${slot.items} pozycjach dla ${slot.label} (${slot.formats.join(', ')})`);
    taken.add(g.id);
    return { slot, groupId: g.id };
  });
  return { blueprintId: bp.id, slots };
}

/** How many distinct full exams the bank can support for a slot (minimum across slots). */
export function examCapacity(bp: Blueprint, bank: TaskGroup[] = groups, pBank: WritingPrompt[] = prompts): number {
  return Math.min(
    ...bp.slots.map((s) =>
      s.section === 'writing'
        ? pBank.filter((p) => s.formats.includes(p.format)).length
        : bank.filter((g) => s.formats.includes(g.format) && g.items.length === s.items).length,
    ),
  );
}

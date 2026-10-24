import type { FormatId, Section } from '../content/types';

/**
 * Configurable exam blueprint. Update this object when CKE changes the paper.
 *
 * Verified basis (October 2026):
 *  - 120 minutes, 60 points (Informator CKE od r. szk. 2024/2025, poziom podstawowy)
 *  - Rozumienie ze słuchu 15 pkt, rozumienie tekstów pisanych 20 pkt,
 *    znajomość środków językowych 13 pkt, wypowiedź pisemna 12 pkt
 *    (OKE Kraków, sprawozdanie 2025; zasady oceniania CKE, maj 2025)
 *  - 11 wiązek zadań + wypowiedź pisemna (arkusz maj 2025; próbna matura 2026)
 * The order and size of each slot mirror the May 2025 paper. Each slot lists the
 * formats that may fill it, since CKE varies task forms between sessions.
 */
export interface BlueprintSlot {
  id: string;
  section: Exclude<Section, 'supplementary'>;
  label: string;
  formats: FormatId[];
  items: number; // points (1 per item); writing slot = 12
}

export interface Blueprint {
  id: string;
  name: string;
  minutes: number;
  totalPoints: number;
  sectionPoints: Record<'listening' | 'reading' | 'language' | 'writing', number>;
  audioPlays: number;
  slots: BlueprintSlot[];
  basis: string[];
}

export const BLUEPRINT_PP_2025: Blueprint = {
  id: 'pp-f2023-2025',
  name: 'Matura podstawowa – arkusz na wzór CKE (od 2025)',
  minutes: 120,
  totalPoints: 60,
  sectionPoints: { listening: 15, reading: 20, language: 13, writing: 12 },
  audioPlays: 2,
  slots: [
    { id: 'z1', section: 'listening', label: 'Zadanie 1', formats: ['L_MATCH'], items: 5 },
    { id: 'z2', section: 'listening', label: 'Zadanie 2', formats: ['L_MC'], items: 6 },
    { id: 'z3', section: 'listening', label: 'Zadanie 3', formats: ['L_GAP'], items: 4 },
    { id: 'z4', section: 'reading', label: 'Zadanie 4', formats: ['R_MATCH'], items: 4 },
    { id: 'z5', section: 'reading', label: 'Zadanie 5', formats: ['R_MULTI'], items: 7 },
    { id: 'z6', section: 'reading', label: 'Zadanie 6', formats: ['R_MC'], items: 5 },
    { id: 'z7', section: 'reading', label: 'Zadanie 7', formats: ['R_SENTENCE_GAP'], items: 4 },
    { id: 'z8', section: 'language', label: 'Zadanie 8', formats: ['U_DIALOG_MC'], items: 3 },
    { id: 'z9', section: 'language', label: 'Zadanie 9', formats: ['U_LEXICAL_SET', 'U_TRANSLATION_MC', 'U_GRAMMAR_MC'], items: 4 },
    { id: 'z10', section: 'language', label: 'Zadanie 10', formats: ['U_OPEN_CLOZE'], items: 3 },
    { id: 'z11', section: 'language', label: 'Zadanie 11', formats: ['U_TRANSFORM', 'U_GRAMMATICALISE', 'U_TRANSLATE_OPEN'], items: 3 },
    { id: 'z12', section: 'writing', label: 'Zadanie 12', formats: ['W_EMAIL', 'W_BLOG', 'W_FORUM'], items: 12 },
  ],
  basis: [
    'Informator o egzaminie maturalnym z języka angielskiego od roku szkolnego 2024/2025 (CKE)',
    'Zasady oceniania rozwiązań zadań – matura z języka angielskiego, poziom podstawowy, maj 2025 (CKE)',
    'Sprawozdanie z egzaminu maturalnego 2025 – język angielski (OKE w Krakowie)',
  ],
};

export function checkBlueprint(bp: Blueprint): string[] {
  const errs: string[] = [];
  const sum = bp.slots.reduce((s, x) => s + x.items, 0);
  if (sum !== bp.totalPoints) errs.push(`Suma punktów slotów ${sum} ≠ ${bp.totalPoints}`);
  for (const sec of Object.keys(bp.sectionPoints) as (keyof Blueprint['sectionPoints'])[]) {
    const s = bp.slots.filter((x) => x.section === sec).reduce((a, x) => a + x.items, 0);
    if (s !== bp.sectionPoints[sec]) errs.push(`Sekcja ${sec}: ${s} ≠ ${bp.sectionPoints[sec]}`);
  }
  return errs;
}

import type { AppState } from '../store/types';

/**
 * Adventure map. Chapters are a game structure, NOT an official CKE classification.
 * Each level has a fixed, pre-authored exercise set and a real pass requirement.
 */
export interface Level {
  id: string;
  chapter: string;
  titlePl: string;
  objectivePl: string;
  groupIds: string[];
  kind?: 'exam';
  difficulty: 1 | 2 | 3 | 4 | 5;
  passRatio: number;
  masterRatio: number;
  xp: number;
}

export interface Chapter {
  id: string;
  namePl: string;
  nameEn: string;
  descPl: string;
  levels: Level[];
}

const L = (chapter: string, n: number, titlePl: string, objectivePl: string, groupIds: string[], difficulty: Level['difficulty']): Level => ({
  id: `${chapter}-${n}`, chapter, titlePl, objectivePl, groupIds, difficulty, passRatio: 0.7, masterRatio: 0.9, xp: 50,
});

export const CHAPTERS: Chapter[] = [
  {
    id: 'c1', namePl: 'Obóz startowy', nameEn: 'Starter Camp', descPl: 'Podstawowy szyk zdania, teraźniejszość i pierwsze minidialogi.',
    levels: [
      L('c1', 1, 'Szyk zdania', 'Układasz poprawne zdania twierdzące i pytania.', ['sb1', 'sd-pres'], 1),
      L('c1', 2, 'Przedimki i ilość', 'Używasz a/an/the oraz much/many/some/any.', ['sd-art', 'sd-quant'], 1),
      L('c1', 3, 'Pierwsze rozmowy', 'Reagujesz w prostych sytuacjach i budujesz trudniejsze zdania.', ['fd1', 'sb2'], 2),
    ],
  },
  {
    id: 'c2', namePl: 'Las Gramatyki', nameEn: 'Grammar Forest', descPl: 'Czasy przeszłe, przyszłość, modalne i stopniowanie.',
    levels: [
      L('c2', 1, 'Przeszłość', 'Odróżniasz Past Simple, Past Continuous i Present Perfect.', ['sd-past', 'sd-pp'], 2),
      L('c2', 2, 'Przyszłość i modalne', 'Wybierasz will / going to / Present Continuous i właściwy modal.', ['sd-fut', 'sd-mod'], 2),
      L('c2', 3, 'Porównania w tekście', 'Stopniujesz przymiotniki i uzupełniasz luki jednym wyrazem.', ['sd-comp', 'oc1'], 2),
    ],
  },
  {
    id: 'c3', namePl: 'Port Słuchania', nameEn: 'Listening Harbor', descPl: 'Krótkie rozmowy, komunikaty i wypowiedzi – zadania jak na maturze.',
    levels: [
      L('c3', 1, 'Krótkie nagrania', 'Rozumiesz główną myśl i szczegóły krótkich nagrań.', ['lmc2'], 2),
      L('c3', 2, 'Kto co mówi?', 'Dopasowujesz zdania do wypowiedzi.', ['lm1'], 2),
      L('c3', 3, 'Notatka ze słuchu', 'Zapisujesz konkretne informacje z komunikatu.', ['lg2'], 2),
    ],
  },
  {
    id: 'c4', namePl: 'Biblioteka', nameEn: 'Reading Library', descPl: 'Ogłoszenia, wiadomości, blogi i artykuły.',
    levels: [
      L('c4', 1, 'Krótkie teksty', 'Określasz intencję autora i główną myśl.', ['rmc2'], 2),
      L('c4', 2, 'Dobieranie', 'Dopasowujesz informacje do osób.', ['rm2'], 2),
      L('c4', 3, 'Spójność tekstu', 'Rozpoznajesz związki między zdaniami.', ['rsg2'], 2),
      L('c4', 4, 'Kilka źródeł', 'Łączysz informacje z kilku tekstów i przekazujesz je dalej.', ['rmu1'], 3),
    ],
  },
  {
    id: 'c5', namePl: 'Miasto Komunikacji', nameEn: 'Communication City', descPl: 'Funkcje językowe i słownictwo w kontekście.',
    levels: [
      L('c5', 1, 'Prośby i rady', 'Reagujesz adekwatnie do sytuacji.', ['fd2', 'fd3'], 2),
      L('c5', 2, 'Słowa wieloznaczne', 'Wybierasz wyraz pasujący do dwóch kontekstów.', ['fd4', 'ls1'], 2),
      L('c5', 3, 'Tłumaczenie', 'Wybierasz poprawny angielski odpowiednik polskiego zdania.', ['tm2'], 2),
    ],
  },
  {
    id: 'c6', namePl: 'Zamek Gramatyki', nameEn: 'Grammar Castle', descPl: 'Trudniejsza gramatyka i zadania otwarte wymagające pełnej poprawności.',
    levels: [
      L('c6', 1, 'Warunki i formy', 'Stosujesz tryby warunkowe, gerund i bezokolicznik.', ['sd-ger', 'sd-cond'], 3),
      L('c6', 2, 'Strona bierna', 'Tworzysz stronę bierną, zdania względne i mowę zależną.', ['sd-pass', 'sd-rel'], 3),
      L('c6', 3, 'Parafrazy', 'Przekształcasz zdania i układasz fragmenty z podanych wyrazów.', ['tf1', 'gz1'], 3),
      L('c6', 4, 'Tłumaczenie fragmentów', 'Tłumaczysz fragmenty i uzupełniasz luki bez błędów.', ['to1', 'oc2'], 3),
    ],
  },
  {
    id: 'c7', namePl: 'Arena Egzaminacyjna', nameEn: 'Exam Arena', descPl: 'Mieszane zadania maturalne ze wszystkich części arkusza.',
    levels: [
      L('c7', 1, 'Mieszanka I', 'Słuchanie i czytanie w jednym bloku.', ['lmc1', 'rm1'], 3),
      L('c7', 2, 'Mieszanka II', 'Dłuższy artykuł i wybór wielokrotny w tekście.', ['rmc1', 'gm1'], 3),
      L('c7', 3, 'Mieszanka III', 'Wypowiedzi o podróżach i parafrazy.', ['lm2', 'tf2'], 4),
      L('c7', 4, 'Mieszanka IV', 'Notatka ze słuchu, luki zdaniowe i kilka źródeł.', ['lg1', 'rsg1', 'rmu2'], 4),
    ],
  },
  {
    id: 'c8', namePl: 'Wielki Finał', nameEn: 'Final Matura Challenge', descPl: 'Pełny arkusz próbny: 120 minut, 60 punktów.',
    levels: [
      { id: 'c8-1', chapter: 'c8', titlePl: 'Pełny arkusz', objectivePl: 'Rozwiązujesz cały arkusz w czasie egzaminu. Zaliczenie: ukończony arkusz; mistrzostwo: co najmniej 70%.', groupIds: [], kind: 'exam', difficulty: 5, passRatio: 0, masterRatio: 0.7, xp: 100 },
    ],
  },
];

export const ALL_LEVELS: Level[] = CHAPTERS.flatMap((c) => c.levels);
export const getLevel = (id: string) => ALL_LEVELS.find((l) => l.id === id);

export type LevelStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';

function isCompleted(state: AppState, id: string) {
  return !!state.levels[id]?.completedAt;
}

export function levelStatus(state: AppState, level: Level): LevelStatus {
  const p = state.levels[level.id];
  if (p?.masteredAt) return 'mastered';
  if (p?.completedAt) return 'completed';
  if (!isUnlocked(state, level)) return 'locked';
  return p?.attempts ? 'in-progress' : 'available';
}

export function isUnlocked(state: AppState, level: Level): boolean {
  const ci = CHAPTERS.findIndex((c) => c.id === level.chapter);
  const chapter = CHAPTERS[ci];
  const li = chapter.levels.findIndex((l) => l.id === level.id);
  if (li > 0) return isCompleted(state, chapter.levels[li - 1].id);
  if (ci === 0) return true;
  if (level.kind === 'exam') return isCompleted(state, 'c7-2');
  // first level of a chapter: previous chapter has at least one completed level
  return CHAPTERS[ci - 1].levels.some((l) => isCompleted(state, l.id));
}

/** First level that is available or in progress – used for "Continue learning". */
export function nextLevel(state: AppState): Level | undefined {
  return ALL_LEVELS.find((l) => {
    const st = levelStatus(state, l);
    return st === 'available' || st === 'in-progress';
  });
}

import { getGroup } from '../content';
import type { AppState } from '../store/types';

/**
 * Adventure map. Chapters are a game structure, NOT an official CKE classification.
 * Each level has a fixed, pre-authored exercise set and a real pass requirement.
 * Every chapter has 12 steps (see `chapter`).
 */
export interface Level {
  id: string;
  chapter: string;
  titlePl: string;
  objectivePl: string;
  groupIds: string[];
  /** review = mixed questions from earlier lessons; boss = chapter test; exam = full mock exam. */
  kind?: 'exam' | 'review' | 'boss';
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

type Lesson = [titlePl: string, objectivePl: string, units: string[], difficulty: Level['difficulty']];

/** Item-level units ("group#item") of a lesson, used to build reviews from what was practised. */
function itemUnits(units: string[]): string[] {
  return units.flatMap((u) => {
    if (u.includes('#')) return [u];
    const g = getGroup(u);
    return g ? g.items.map((it) => `${u}#${it.id}`) : [];
  });
}

/** Pick `per` items from each lesson, starting at a different offset each time. */
function pick(lessons: Lesson[], per: number, offset: number, cap: number): string[] {
  const out: string[] = [];
  lessons.forEach((l, li) => {
    const items = itemUnits(l[2]);
    for (let k = 0; k < Math.min(per, items.length); k++) out.push(items[(offset + li + k * 2) % items.length]);
  });
  return [...new Set(out)].slice(0, cap);
}

/**
 * Every chapter has 12 steps: 8 lessons with their own exercise sets, 3 reviews
 * that mix questions from earlier lessons (spaced practice) and a chapter test.
 * Order: L L L R L L L R L L R T.
 */
function chapter(id: string, namePl: string, nameEn: string, descPl: string, lessons: Lesson[], finale?: Level): Chapter {
  if (lessons.length !== 8) throw new Error(`chapter ${id} needs 8 lessons`);
  const mk = (n: number, titlePl: string, objectivePl: string, groupIds: string[], difficulty: Level['difficulty'], kind?: Level['kind'], xp = 50): Level => ({
    id: `${id}-${n}`, chapter: id, titlePl, objectivePl, groupIds, kind, difficulty, passRatio: 0.7, masterRatio: 0.9, xp,
  });
  const L = (i: number, n: number) => mk(n, ...lessons[i]);
  const maxD = Math.max(...lessons.map((l) => l[3])) as Level['difficulty'];
  const levels: Level[] = [
    L(0, 1), L(1, 2), L(2, 3),
    mk(4, 'Powtórka', 'Wracasz do pytań z trzech pierwszych lekcji – utrwalenie przed dalszą drogą.', pick(lessons.slice(0, 3), 3, 1, 9), lessons[2][3], 'review', 40),
    L(3, 5), L(4, 6), L(5, 7),
    mk(8, 'Powtórka', 'Mieszanka pytań z lekcji 5–7.', pick(lessons.slice(3, 6), 3, 2, 9), lessons[5][3], 'review', 40),
    L(6, 9), L(7, 10),
    mk(11, 'Wielka powtórka', 'Pytania z całego rozdziału, także z pierwszych lekcji.', [...pick(lessons.slice(6, 8), 3, 0, 6), ...pick(lessons.slice(0, 6), 1, 3, 6)], maxD, 'review', 40),
    finale ?? mk(12, 'Test rozdziału', 'Sprawdzian z całego rozdziału. Zalicz 70%, aby zdobyć odznakę rozdziału.', pick(lessons, 2, 4, 14), maxD, 'boss', 100),
  ];
  return { id, namePl, nameEn, descPl, levels };
}

const first3 = (g: string) => [1, 2, 3].map((n) => `${g}#${g}.${n}`);
const last3 = (g: string) => [4, 5, 6].map((n) => `${g}#${g}.${n}`);

export const CHAPTERS: Chapter[] = [
  chapter('c1', 'Obóz startowy', 'Starter Camp', 'Podstawy: szyk zdania, teraźniejszość, przedimki i pierwsze rozmowy.', [
    ['Szyk zdania', 'Układasz poprawne zdania twierdzące i pytania.', ['sb1'], 1],
    ['To be i have got', 'Używasz be, have got i there is/are.', ['sd-be'], 1],
    ['Teraźniejszość', 'Odróżniasz Present Simple od Present Continuous.', ['sd-pres'], 1],
    ['Przedimki', 'Wybierasz a/an, the albo brak przedimka.', ['sd-art'], 1],
    ['Zaimki', 'Używasz zaimków i form dzierżawczych (my, mine, its…).', ['sd-pron'], 1],
    ['Ile czego?', 'Używasz much, many, some, any, a few, a little.', ['sd-quant'], 1],
    ['Pierwsze rozmowy', 'Reagujesz w prostych codziennych sytuacjach.', ['fd1'], 2],
    ['Trudniejsze zdania', 'Budujesz pytania pośrednie i zdania z kilkoma częściami.', ['sb2'], 2],
  ]),
  chapter('c2', 'Las Gramatyki', 'Grammar Forest', 'Czasy przeszłe, przyszłość, czasowniki modalne, stopniowanie i przyimki.', [
    ['Przeszłość', 'Odróżniasz Past Simple od Past Continuous.', ['sd-past'], 2],
    ['Present Perfect', 'Używasz Present Perfect z ever, yet, since, for.', ['sd-pp'], 2],
    ['Przyszłość', 'Wybierasz will, going to albo Present Continuous.', ['sd-fut'], 2],
    ['Czasowniki modalne', 'Wybierasz must, should, can, might i inne.', ['sd-mod'], 2],
    ['Stopniowanie', 'Stopniujesz przymiotniki i porównujesz.', ['sd-comp'], 2],
    ['Przyimki', 'Używasz in, on, at w określeniach czasu i miejsca.', ['sd-prep'], 2],
    ['Luki w tekście', 'Uzupełniasz luki jednym wyrazem w krótkim e-mailu.', ['oc1'], 2],
    ['Gramatyka w tekście', 'Wybierasz poprawne formy w opowiadaniu.', ['gm2'], 2],
  ]),
  chapter('c3', 'Port Słuchania', 'Listening Harbor', 'Krótkie rozmowy, komunikaty i wypowiedzi – zadania jak na maturze.', [
    ['Krótkie nagrania I', 'Rozumiesz główną myśl krótkich rozmów.', first3('lmc2'), 2],
    ['Krótkie nagrania II', 'Wyłapujesz szczegóły i intencje mówiących.', last3('lmc2'), 2],
    ['Kto co mówi?', 'Dopasowujesz zdania do wypowiedzi.', ['lm1'], 2],
    ['Notatka ze słuchu', 'Zapisujesz konkretne informacje z komunikatu.', ['lg2'], 2],
    ['Krótkie nagrania III', 'Rozpoznajesz miejsce, sytuację i cel wypowiedzi.', first3('lmc1'), 2],
    ['Krótkie nagrania IV', 'Wnioskujesz z tego, co słyszysz.', last3('lmc1'), 3],
    ['Opowieści z podróży', 'Dopasowujesz dłuższe wypowiedzi o podróżach.', ['lm2'], 3],
    ['Wywiad', 'Uzupełniasz notatkę na podstawie wywiadu.', ['lg1'], 3],
  ]),
  chapter('c4', 'Biblioteka', 'Reading Library', 'Ogłoszenia, wiadomości, blogi i artykuły.', [
    ['Krótkie teksty', 'Określasz intencję autora i główną myśl.', ['rmc2'], 2],
    ['Kto to napisał?', 'Dopasowujesz informacje do osób.', ['rm2'], 2],
    ['Spójność tekstu', 'Rozpoznajesz związki między zdaniami.', ['rsg2'], 2],
    ['Miejsca w mieście', 'Dopasowujesz pytania do ogłoszeń.', ['rm1'], 2],
    ['Dłuższy artykuł', 'Czytasz artykuł i odpowiadasz na pytania do szczegółów.', ['rmc1'], 3],
    ['Kilka źródeł', 'Łączysz informacje z kilku tekstów i przekazujesz je dalej.', ['rmu1'], 3],
    ['Brakujące zdania', 'Uzupełniasz tekst brakującymi zdaniami.', ['rsg1'], 3],
    ['Wakacyjna praca', 'Porównujesz oferty i notatki, uzupełniasz wiadomość.', ['rmu2'], 3],
  ]),
  chapter('c5', 'Miasto Komunikacji', 'Communication City', 'Funkcje językowe, słownictwo w kontekście i tłumaczenie.', [
    ['Reakcje i opinie', 'Reagujesz współczuciem, zgodą albo radą.', ['fd2'], 2],
    ['W sklepie i na siłowni', 'Radzisz sobie w usługach i zakupach.', ['fd3'], 2],
    ['Słowa wieloznaczne', 'Wybierasz wyraz pasujący do dwóch zdań.', ['ls1'], 2],
    ['Prośby i propozycje', 'Prosisz, proponujesz i odpowiadasz uprzejmie.', ['fd4'], 2],
    ['Słowa wieloznaczne II', 'Rozpoznajesz różne znaczenia jednego słowa.', ['ls2'], 3],
    ['Tłumaczenie I', 'Wybierasz poprawny angielski odpowiednik polskiego zdania.', ['tm1'], 2],
    ['Tłumaczenie II', 'Unikasz kalek z polskiego.', ['tm2'], 3],
    ['Słowa wieloznaczne III', 'Trudniejsze pary zdań z jednym wyrazem.', ['ls3'], 3],
  ]),
  chapter('c6', 'Zamek Gramatyki', 'Grammar Castle', 'Trudniejsza gramatyka i zadania otwarte wymagające pełnej poprawności.', [
    ['Tryby warunkowe', 'Stosujesz zerowy, pierwszy i drugi tryb warunkowy.', ['sd-cond'], 3],
    ['Gerund czy bezokolicznik', 'Wybierasz -ing albo to + bezokolicznik.', ['sd-ger'], 3],
    ['Strona bierna', 'Tworzysz stronę bierną w różnych czasach.', ['sd-pass'], 3],
    ['Zdania względne', 'Używasz who, which, where i mowy zależnej.', ['sd-rel'], 3],
    ['Parafrazy', 'Przekształcasz zdania z podanym wyrazem.', ['tf1', 'tf2'], 3],
    ['Gramatykalizacja', 'Układasz fragmenty zdań z podanych wyrazów w poprawnej formie.', ['gz1', 'gz2'], 3],
    ['Tłumaczenie fragmentów', 'Tłumaczysz fragmenty zdań bez błędów.', ['to1', 'to2'], 3],
    ['Luki bez błędów', 'Uzupełniasz luki jednym wyrazem z pełną poprawnością.', ['oc2', 'oc3'], 3],
  ]),
  chapter('c7', 'Arena Egzaminacyjna', 'Exam Arena', 'Mieszane zadania maturalne ze wszystkich części arkusza.', [
    ['Mieszanka I', 'Gramatyka w tekście i wybór tłumaczenia.', ['gm1', 'tm3'], 3],
    ['Mieszanka II', 'Krótkie teksty i luki jednym wyrazem.', ['rmc3', 'oc4'], 3],
    ['Mieszanka III', 'Parafrazy i gramatykalizacja.', ['tf3', 'gz3'], 4],
    ['Mieszanka IV', 'Dobieranie ogłoszeń i tłumaczenie fragmentów.', ['rm3', 'to3'], 3],
    ['Mieszanka V', 'Gramatyka w tekście i parafrazy.', ['gm3', 'tf4'], 4],
    ['Mieszanka VI', 'Brakujące zdania i gramatykalizacja.', ['rsg3', 'gz4'], 4],
    ['Mieszanka VII', 'Krótkie nagrania i tłumaczenie fragmentów.', ['lmc3', 'to4'], 4],
    ['Mieszanka VIII', 'List z podróży i wpis na blogu.', ['gm4', 'oc5'], 4],
  ]),
  chapter('c8', 'Wielki Finał', 'Final Matura Challenge', 'Bloki egzaminacyjne z każdej części arkusza, a na końcu pełny arkusz próbny.', [
    ['Słuchanie – blok A', 'Krótkie nagrania i dobieranie wypowiedzi.', ['lmc2', 'lm1'], 4],
    ['Czytanie – blok A', 'Dobieranie i wybór wielokrotny.', ['rm2', 'rmc2'], 4],
    ['Środki językowe – blok A', 'Minidialogi, słowa wieloznaczne i gramatyka w tekście.', ['fd3', 'ls1', 'gm2'], 4],
    ['Słuchanie – blok B', 'Krótkie nagrania i notatka.', ['lmc1', 'lg1'], 4],
    ['Czytanie – blok B', 'Luki zdaniowe i kilka źródeł.', ['rsg1', 'rmu1'], 4],
    ['Środki językowe – blok B', 'Tłumaczenie, luki i parafrazy.', ['tm1', 'oc3', 'tf2'], 4],
    ['Słuchanie – blok C', 'Wszystkie typy zadań ze słuchu.', ['lm2', 'lmc3', 'lg2'], 5],
    ['Czytanie i środki – blok C', 'Czytanie i zadania otwarte jak na maturze.', ['rmc3', 'rsg3', 'gz2', 'to2'], 5],
  ], { id: 'c8-12', chapter: 'c8', titlePl: 'Pełny arkusz', objectivePl: 'Rozwiązujesz cały arkusz w czasie egzaminu. Zaliczenie: ukończony arkusz; mistrzostwo: co najmniej 70%.', groupIds: [], kind: 'exam', difficulty: 5, passRatio: 0, masterRatio: 0.7, xp: 100 }),
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

import type { TaskGroup } from '../types';
import { mc, SUPPLEMENTARY } from './helpers';

const V = 1;
const DRILL_INSTR = 'Ćwiczenie dodatkowe. Wybierz poprawną formę, aby uzupełnić zdanie.';

function drill(id: string, title: string, tag: string, difficulty: 1 | 2 | 3 | 4, items: ReturnType<typeof mc>[]): TaskGroup {
  return {
    id, format: 'S_GRAMMAR_DRILL', title, instructionPl: DRILL_INSTR, stimulus: { kind: 'none' },
    topic: tag, difficulty, source: SUPPLEMENTARY, contentVersion: V,
    items: items.map((it) => ({ ...it, tag })),
  };
}

export const grammarDrills: TaskGroup[] = [
  drill('sd-pres', 'Present Simple i Present Continuous', 'present-simple', 1, [
    mc('sd-pres.1', 'Listen! Someone ____ at the door.', ['knocks', 'is knocking', 'knock'], 'B', '„Listen!” – czynność dzieje się teraz: Present Continuous.', { rule: 'teraz → am/is/are + -ing' }),
    mc('sd-pres.2', 'My dad ____ to work by bike every day.', ['goes', 'is going', 'go'], 'A', 'Rutyna („every day”) – Present Simple, 3. os. l.poj. z -es.', { rule: 'zwyczaje → Present Simple' }),
    mc('sd-pres.3', 'I ____ this song – it\'s great!', ['am loving', 'love', 'loves'], 'B', '„Love” to czasownik stanu – zwykle bez -ing.', { rule: 'czasowniki stanu (love, know, want) – bez -ing' }),
    mc('sd-pres.4', 'What time ____ the film start?', ['is', 'do', 'does'], 'C', 'Rozkład zajęć/plan – Present Simple; pytanie z „does” dla „the film”.'),
  ]),
  drill('sd-past', 'Past Simple i Past Continuous', 'past-continuous', 2, [
    mc('sd-past.1', 'I ____ a shower when the phone rang.', ['had', 'was having', 'have had'], 'B', 'Czynność w trakcie przerwana inną – Past Continuous.', { rule: 'długa czynność w tle → was/were + -ing' }),
    mc('sd-past.2', 'We ____ to Spain two years ago.', ['went', 'have gone', 'were going'], 'A', '„Ago” – Past Simple.'),
    mc('sd-past.3', 'While Tom ____ dinner, his sister was doing her homework.', ['cooked', 'was cooking', 'cooks'], 'B', 'Dwie równoległe czynności w przeszłości – Past Continuous.'),
    mc('sd-past.4', '____ you see the match last night?', ['Did', 'Were', 'Have'], 'A', 'Pytanie w Past Simple: Did + podmiot + bezokolicznik.'),
  ]),
  drill('sd-pp', 'Present Perfect', 'present-perfect', 2, [
    mc('sd-pp.1', 'I ____ my keys. I can\'t open the door.', ['lost', 'have lost', 'was losing'], 'B', 'Skutek widoczny teraz – Present Perfect.', { rule: 'skutek teraz / doświadczenie → have/has + III forma' }),
    mc('sd-pp.2', 'She has lived here ____ 2015.', ['for', 'since', 'ago'], 'B', 'Punkt w czasie – since.'),
    mc('sd-pp.3', 'Have you ____ been to Italy?', ['ever', 'yet', 'already'], 'A', 'Pytanie o doświadczenie – ever.'),
    mc('sd-pp.4', 'I haven\'t finished my project ____.', ['already', 'yet', 'just'], 'B', '„Yet” w przeczeniach i pytaniach, na końcu zdania.'),
  ]),
  drill('sd-fut', 'Wyrażanie przyszłości', 'future', 2, [
    mc('sd-fut.1', 'Look at those clouds! It ____ rain.', ['will', 'is going to', 'rains'], 'B', 'Przewidywanie na podstawie dowodów („Look at…”) – going to.'),
    mc('sd-fut.2', 'The phone is ringing. – OK, I ____ it.', ['\'ll answer', '\'m going to answer', 'answer'], 'A', 'Decyzja podjęta w chwili mówienia – will.'),
    mc('sd-fut.3', 'I ____ my grandparents on Sunday – it\'s all arranged.', ['visit', 'am visiting', 'will be visit'], 'B', 'Ustalone plany – Present Continuous.'),
    mc('sd-fut.4', 'I think Poland ____ the match.', ['wins', 'will win', 'is winning'], 'B', 'Przewidywanie z „I think” – will.'),
  ]),
  drill('sd-mod', 'Czasowniki modalne', 'modals', 2, [
    mc('sd-mod.1', 'You ____ smoke in the hospital. It\'s forbidden.', ['mustn\'t', 'don\'t have to', 'needn\'t'], 'A', 'Zakaz – mustn\'t.'),
    mc('sd-mod.2', 'When I was five, I ____ swim.', ['can', 'could', 'must'], 'B', 'Umiejętność w przeszłości – could.'),
    mc('sd-mod.3', 'You look tired. You ____ go to bed earlier.', ['should', 'must to', 'have'], 'A', 'Rada – should + bezokolicznik bez „to”.'),
    mc('sd-mod.4', 'Tomorrow is Sunday, so I ____ get up early.', ['mustn\'t', 'don\'t have to', 'can\'t'], 'B', 'Brak konieczności – don\'t have to.'),
  ]),
  drill('sd-art', 'Przedimki', 'articles', 2, [
    mc('sd-art.1', 'I saw ____ interesting film yesterday.', ['a', 'an', 'the'], 'B', 'Przed samogłoską w wymowie – an.'),
    mc('sd-art.2', '____ sun is shining.', ['A', 'The', '—'], 'B', 'Rzeczy jedyne w swoim rodzaju – the.'),
    mc('sd-art.3', 'She plays ____ piano very well.', ['a', 'the', '—'], 'B', 'Gra na instrumencie – the.'),
    mc('sd-art.4', 'We usually have ____ lunch at school.', ['a', 'the', '—'], 'C', 'Nazwy posiłków ogólnie – bez przedimka.'),
  ]),
  drill('sd-quant', 'Określniki ilości', 'quantifiers', 2, [
    mc('sd-quant.1', 'How ____ money do you need?', ['many', 'much', 'few'], 'B', '„Money” – niepoliczalne: how much.'),
    mc('sd-quant.2', 'There are only ____ students in the classroom.', ['a few', 'a little', 'much'], 'A', 'Policzalne w l.mn. – a few.'),
    mc('sd-quant.3', 'Is there ____ milk in the fridge?', ['some', 'any', 'many'], 'B', 'Pytania ogólne – any.'),
    mc('sd-quant.4', 'Would you like ____ tea?', ['any', 'some', 'many'], 'B', 'Propozycje (Would you like…?) – some.'),
  ]),
  drill('sd-comp', 'Stopniowanie przymiotników', 'comparatives', 1, [
    mc('sd-comp.1', 'This is ____ day of my life!', ['the happiest', 'the most happy', 'happier'], 'A', 'Przymiotnik na -y: happy – happier – the happiest.'),
    mc('sd-comp.2', 'Maths is ____ than history for me.', ['difficult', 'more difficult', 'the most difficult'], 'B', 'Długi przymiotnik – more + than.'),
    mc('sd-comp.3', 'My room isn\'t as big ____ yours.', ['than', 'as', 'like'], 'B', 'Porównanie równości: (not) as … as.'),
    mc('sd-comp.4', 'The weather is ____ today than yesterday.', ['worse', 'badder', 'more bad'], 'A', 'Nieregularne: bad – worse – the worst.'),
  ]),
  drill('sd-ger', 'Gerund i bezokolicznik', 'gerund-infinitive', 3, [
    mc('sd-ger.1', 'I enjoy ____ in the mountains.', ['to hike', 'hiking', 'hike'], 'B', 'Po „enjoy” – forma -ing.'),
    mc('sd-ger.2', 'She decided ____ a new phone.', ['buying', 'to buy', 'buy'], 'B', 'Po „decide” – to + bezokolicznik.'),
    mc('sd-ger.3', 'Thank you for ____ me.', ['help', 'to help', 'helping'], 'C', 'Po przyimku – forma -ing.'),
    mc('sd-ger.4', 'My parents let me ____ out late on Fridays.', ['stay', 'to stay', 'staying'], 'A', 'Let + bezokolicznik bez „to”.'),
  ]),
  drill('sd-cond', 'Zdania warunkowe', 'conditionals', 3, [
    mc('sd-cond.1', 'If you heat ice, it ____.', ['melts', 'will melt', 'would melt'], 'A', 'Prawda ogólna – tryb zerowy: Present Simple w obu częściach.'),
    mc('sd-cond.2', 'If it ____ tomorrow, we\'ll stay at home.', ['will rain', 'rains', 'rained'], 'B', 'Po „if” w 1. trybie – Present Simple.'),
    mc('sd-cond.3', 'If I had more time, I ____ learn Spanish.', ['will', 'would', 'am'], 'B', 'Drugi tryb (sytuacja nierealna): would + bezokolicznik.'),
    mc('sd-cond.4', 'You won\'t pass ____ you study harder.', ['if', 'unless', 'when'], 'B', '„Unless” = jeśli nie.'),
  ]),
  drill('sd-pass', 'Strona bierna', 'passive', 3, [
    mc('sd-pass.1', 'English ____ all over the world.', ['speaks', 'is spoken', 'is speaking'], 'B', 'Strona bierna Present Simple: is + III forma.'),
    mc('sd-pass.2', 'The Mona Lisa ____ by Leonardo da Vinci.', ['painted', 'was painted', 'has painted'], 'B', 'Past Simple passive: was + III forma.'),
    mc('sd-pass.3', 'The results ____ next week.', ['will publish', 'will be published', 'are publishing'], 'B', 'Przyszłość w stronie biernej: will be + III forma.'),
    mc('sd-pass.4', 'My bike ____ last night.', ['was stolen', 'was stole', 'stolen'], 'A', 'steal – stole – stolen.'),
  ]),
  drill('sd-rel', 'Zdania względne i mowa zależna', 'relative-clauses', 3, [
    mc('sd-rel.1', 'That\'s the girl ____ won the competition.', ['which', 'who', 'where'], 'B', 'O osobach – who.'),
    mc('sd-rel.2', 'This is the café ____ we first met.', ['which', 'where', 'who'], 'B', 'O miejscu, gdy po zaimku jest podmiot – where.'),
    mc('sd-rel.3', 'He told me that he ____ tired.', ['is', 'was', 'were'], 'B', 'Mowa zależna po czasie przeszłym – cofnięcie czasu: is → was.'),
    mc('sd-rel.4', 'She asked me ____ I liked pizza.', ['that', 'if', 'do'], 'B', 'Pytanie tak/nie w mowie zależnej – if/whether.'),
  ]),
];

const BUILD_INSTR = 'Ćwiczenie dodatkowe. Ułóż poprawne zdanie z podanych wyrazów.';

export const sentenceBuildGroups: TaskGroup[] = [
  {
    id: 'sb1', format: 'S_SENTENCE_BUILD', title: 'Szyk zdania (1)', instructionPl: BUILD_INSTR, stimulus: { kind: 'none' },
    topic: 'word-order', difficulty: 1, source: SUPPLEMENTARY, contentVersion: V,
    items: [
      { id: 'sb1.1', kind: 'open', prompt: 'always / breakfast / I / have / at seven', accepted: ['I always have breakfast at seven'], marking: 'strict', explanationPl: 'Przysłówki częstotliwości stoją przed czasownikiem głównym.', tag: 'word-order' },
      { id: 'sb1.2', kind: 'open', prompt: 'you / where / live / do', accepted: ['Where do you live?'], marking: 'strict', explanationPl: 'Pytanie: słowo pytające + do + podmiot + czasownik.', tag: 'questions' },
      { id: 'sb1.3', kind: 'open', prompt: 'never / late / is / she', accepted: ['She is never late'], marking: 'strict', explanationPl: 'Z „be” przysłówek częstotliwości stoi PO czasowniku.', tag: 'word-order' },
      { id: 'sb1.4', kind: 'open', prompt: 'bought / a / I / yesterday / new / jacket', accepted: ['I bought a new jacket yesterday', 'Yesterday I bought a new jacket', 'Yesterday, I bought a new jacket'], marking: 'strict', explanationPl: 'Określenie czasu na końcu lub na początku zdania; przymiotnik przed rzeczownikiem.', tag: 'word-order' },
      { id: 'sb1.5', kind: 'open', prompt: 'there / any / are / tickets / left', accepted: ['Are there any tickets left?'], marking: 'strict', explanationPl: 'Pytanie z „there are”: Are there…?', tag: 'questions' },
    ],
  },
  {
    id: 'sb2', format: 'S_SENTENCE_BUILD', title: 'Szyk zdania (2)', instructionPl: BUILD_INSTR, stimulus: { kind: 'none' },
    topic: 'word-order', difficulty: 2, source: SUPPLEMENTARY, contentVersion: V,
    items: [
      { id: 'sb2.1', kind: 'open', prompt: 'you / tell / could / me / the station / where / is', accepted: ['Could you tell me where the station is?'], marking: 'strict', explanationPl: 'Pytanie pośrednie – szyk oznajmujący: where the station is.', tag: 'indirect-questions' },
      { id: 'sb2.2', kind: 'open', prompt: 'has / just / the bus / left', accepted: ['The bus has just left'], marking: 'strict', explanationPl: '„Just” między have/has a III formą.', tag: 'present-perfect' },
      { id: 'sb2.3', kind: 'open', prompt: 'enough / old / not / he / is / to drive', accepted: ['He is not old enough to drive', 'He isn\'t old enough to drive'], marking: 'strict', explanationPl: '„Enough” stoi PO przymiotniku.', tag: 'too-enough' },
      { id: 'sb2.4', kind: 'open', prompt: 'was / the cake / by / made / my grandma', accepted: ['The cake was made by my grandma'], marking: 'strict', explanationPl: 'Strona bierna: podmiot + was + III forma + by + wykonawca.', tag: 'passive' },
      { id: 'sb2.5', kind: 'open', prompt: 'what / you / doing / were / at eight', accepted: ['What were you doing at eight?'], marking: 'strict', explanationPl: 'Pytanie w Past Continuous: What were you doing…?', tag: 'past-continuous' },
    ],
  },
];

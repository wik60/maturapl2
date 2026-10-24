import type { TaskGroup } from '../types';
import { mc, ORIGINAL } from './helpers';

const V = 1;

/* ------------------------------------------------------------------ */
/* Minidialogi – funkcje językowe (U_DIALOG_MC)                         */
/* ------------------------------------------------------------------ */

const DIALOG_INSTR =
  'Uzupełnij minidialogi. Wybierz właściwą reakcję lub wypowiedź, tak aby otrzymać spójną i logiczną rozmowę.';

export const dialogGroups: TaskGroup[] = [
  {
    id: 'fd1', format: 'U_DIALOG_MC', title: 'Codzienne sytuacje', instructionPl: DIALOG_INSTR,
    stimulus: { kind: 'none' }, topic: 'everyday', difficulty: 1, source: ORIGINAL, contentVersion: V,
    items: [
      mc('fd1.1', 'X: I\'m going to the shop. Do you need anything?\nY: ______ A loaf of bread would be great.',
        ['Yes, please.', 'Not at all.', 'Help yourself.'], 'A',
        'X proponuje przysługę – przyjmujemy ofertę zwrotem „Yes, please”. Dalsza część („A loaf of bread…”) mówi, czego potrzebujemy.',
        { tag: 'accepting-offers', distractorNotes: { B: '„Not at all” to odpowiedź na podziękowanie lub „Do you mind…?”.', C: '„Help yourself” mówi gospodarz, częstując kogoś.' } }),
      mc('fd1.2', 'X: Excuse me, how do I get to the post office?\nY: ______',
        ['It takes about ten minutes.', 'Go straight on and turn left at the lights.', 'It\'s open until six.'], 'B',
        'Pytanie „how do I get to…?” dotyczy drogi, więc odpowiadamy wskazówkami: go straight on, turn left.',
        { tag: 'directions', distractorNotes: { A: 'Mówi o czasie dojścia, nie o drodze.', C: 'Mówi o godzinach otwarcia.' } }),
      mc('fd1.3', 'X: ______\nY: Sorry, I can\'t. I have to babysit my brother.',
        ['Would you like to come to the cinema with me on Friday?', 'Did you enjoy the film last Friday?', 'Where did you go on Friday?'], 'A',
        'Odpowiedź Y to odmowa („Sorry, I can\'t”), więc X musiał coś zaproponować – zaproszenie „Would you like to…?”.',
        { tag: 'invitations' }),
    ],
  },
  {
    id: 'fd2', format: 'U_DIALOG_MC', title: 'Reakcje i opinie', instructionPl: DIALOG_INSTR,
    stimulus: { kind: 'none' }, topic: 'everyday', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      mc('fd2.1', 'X: I failed my driving test again.\nY: ______',
        ['Congratulations!', 'Oh no, I\'m sorry to hear that.', 'It doesn\'t matter to me.'], 'B',
        'Na złą wiadomość reagujemy współczuciem: „I\'m sorry to hear that”.',
        { tag: 'sympathy', distractorNotes: { A: 'Gratulujemy sukcesu, nie porażki.', C: 'Brzmi obojętnie i niegrzecznie.' } }),
      mc('fd2.2', 'X: Could you turn the music down, please? I\'m trying to study.\nY: ______',
        ['Sure, no problem.', 'You\'re welcome.', 'I don\'t think so, thanks.'], 'A',
        'Na prośbę „Could you…?” zgadzamy się zwrotem „Sure, no problem”.',
        { tag: 'requests', distractorNotes: { B: '„You\'re welcome” to odpowiedź na „Thank you”.', C: 'Połączenie odmowy z „thanks” jest nielogiczne.' } }),
      mc('fd2.3', 'X: What do you think of the new sports centre?\nY: ______',
        ['I think it\'s great – the pool is really modern.', 'I think so too.', 'I\'m thinking about it.'], 'A',
        'Pytanie o opinię („What do you think of…?”) wymaga wyrażenia opinii z uzasadnieniem.',
        { tag: 'opinions', distractorNotes: { B: '„I think so too” wyraża zgodę z czyjąś opinią – a X jej nie podał.', C: '„I\'m thinking about it” = zastanawiam się (nad decyzją).' } }),
    ],
  },
  {
    id: 'fd3', format: 'U_DIALOG_MC', title: 'W sklepie i na siłowni', instructionPl: DIALOG_INSTR,
    stimulus: { kind: 'none' }, topic: 'shopping', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      mc('fd3.1', 'X: Can I try on this jacket?\nY: ______',
        ['Of course. The changing rooms are over there.', 'It\'s too expensive for me.', 'Here\'s your change.'], 'A',
        'X prosi o pozwolenie przymierzenia – sprzedawca się zgadza i wskazuje przymierzalnie.',
        { tag: 'shopping' }),
      mc('fd3.2', 'X: ______\nY: Twice a week, usually on Tuesdays and Fridays.',
        ['How long do you train?', 'How often do you go to the gym?', 'When did you start training?'], 'B',
        '„Twice a week” odpowiada na pytanie o częstotliwość: „How often…?”.',
        { tag: 'asking-information', distractorNotes: { A: '„How long” pyta o czas trwania.', C: '„When did you start” wymaga daty w przeszłości.' } }),
      mc('fd3.3', 'X: I\'ve got a terrible headache.\nY: ______',
        ['You should take a break and drink some water.', 'You\'d better not to worry.', 'Bless you!'], 'A',
        'Dajemy radę: „You should + bezokolicznik bez to”.',
        { tag: 'advice', rule: 'should / had better + bezokolicznik bez „to”', distractorNotes: { B: 'Po „had better” nie ma „to”.', C: '„Bless you!” mówimy, gdy ktoś kichnie.' } }),
    ],
  },
  {
    id: 'fd4', format: 'U_DIALOG_MC', title: 'Spotkania i telefony', instructionPl: DIALOG_INSTR,
    stimulus: { kind: 'none' }, topic: 'everyday', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      mc('fd4.1', 'X: Sorry I\'m late. The bus broke down.\nY: ______',
        ['Never mind. We haven\'t started yet.', 'Don\'t mention it.', 'Same to you.'], 'A',
        'Na przeprosiny odpowiadamy „Never mind / No problem”.',
        { tag: 'apologies', distractorNotes: { B: '„Don\'t mention it” = nie ma za co (odpowiedź na podziękowanie).', C: '„Same to you” odwzajemnia życzenia.' } }),
      mc('fd4.2', 'X: Shall we order a pizza tonight?\nY: ______',
        ['Good idea! I\'m starving.', 'Yes, I shall.', 'No, I didn\'t.'], 'A',
        '„Shall we…?” to propozycja – przyjmujemy ją: „Good idea!”.',
        { tag: 'suggestions', distractorNotes: { B: 'Na propozycję z „Shall we” nie odpowiadamy „I shall”.', C: 'Czas przeszły nie pasuje do pytania.' } }),
      mc('fd4.3', 'X: Hello, this is Tom. Can I speak to Anna, please?\nY: ______',
        ['Speaking. Hi, Tom!', 'I\'m Anna\'s speaking.', 'Yes, you can speak.'], 'A',
        'Przez telefon „Speaking” znaczy „przy telefonie” – to ja.',
        { tag: 'phone' }),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Jeden wyraz do dwóch zdań (U_LEXICAL_SET)                             */
/* ------------------------------------------------------------------ */

const LEX_INSTR = 'W każdym zadaniu wybierz wyraz, który poprawnie uzupełnia OBA zdania.';

export const lexicalGroups: TaskGroup[] = [
  {
    id: 'ls1', format: 'U_LEXICAL_SET', title: 'Wyrazy o wielu znaczeniach (1)', instructionPl: LEX_INSTR,
    stimulus: { kind: 'none' }, topic: 'vocabulary', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      mc('ls1.1', 'Could you ____ me a favour and post this letter?\nI always ____ my homework before dinner.',
        ['make', 'do', 'take'], 'B',
        'Kolokacje: do sb a favour (wyświadczyć przysługę), do homework (odrabiać lekcje).',
        { tag: 'do-make', rule: 'do: homework, a favour, the shopping; make: a cake, a mistake, a decision' }),
      mc('ls1.2', 'Don\'t forget to ____ your umbrella – it\'s going to rain.\nIt will ____ about two hours to get there by car.',
        ['take', 'bring', 'last'], 'A',
        '„Take an umbrella” (wziąć) oraz „it takes two hours” (zajmuje dwie godziny). „Bring” pasuje tylko do pierwszego zdania.',
        { tag: 'take' }),
      mc('ls1.3', 'Turn ____ at the next traffic lights.\nThere is no milk ____ in the fridge.',
        ['left', 'right', 'back'], 'A',
        '„Turn left” (skręć w lewo) i „no milk left” (nie zostało mleka).',
        { tag: 'left' }),
      mc('ls1.4', 'This bag is very ____ – I can carry it easily.\nCan you turn on the ____? It\'s getting dark.',
        ['light', 'easy', 'lamp'], 'A',
        '„Light” = lekki oraz światło.',
        { tag: 'light' }),
    ],
  },
  {
    id: 'ls2', format: 'U_LEXICAL_SET', title: 'Wyrazy o wielu znaczeniach (2)', instructionPl: LEX_INSTR,
    stimulus: { kind: 'none' }, topic: 'vocabulary', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      mc('ls2.1', 'Can you ____ me the salt, please?\nI hope you ____ all your exams!',
        ['give', 'pass', 'hand'], 'B',
        '„Pass the salt” (podać) i „pass an exam” (zdać egzamin).',
        { tag: 'pass', distractorNotes: { A: '„Give an exam” nie znaczy „zdać”.', C: '„Hand an exam” nie istnieje.' } }),
      mc('ls2.2', 'We had a great ____ at the party.\nWhat ____ is it? – It\'s half past seven.',
        ['time', 'hour', 'fun'], 'A',
        '„Have a great time” (świetnie się bawić) i „What time is it?”.',
        { tag: 'time' }),
      mc('ls2.3', 'I don\'t ____ if it rains – I\'ll still go.\nWould you ____ opening the window?',
        ['care', 'mind', 'matter'], 'B',
        '„I don\'t mind” (nie przeszkadza mi) i „Would you mind + -ing” (czy mógłbyś…). „Care” pasuje tylko do pierwszego zdania.',
        { tag: 'mind', rule: 'Would you mind + czasownik z -ing' }),
      mc('ls2.4', 'We sat on the river ____ and watched the boats.\nI need to go to the ____ to get some cash.',
        ['bank', 'shore', 'side'], 'A',
        '„Bank” = brzeg rzeki oraz bank.',
        { tag: 'bank' }),
    ],
  },
  {
    id: 'ls3', format: 'U_LEXICAL_SET', title: 'Wyrazy o wielu znaczeniach (3)', instructionPl: LEX_INSTR,
    stimulus: { kind: 'none' }, topic: 'vocabulary', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      mc('ls3.1', 'Can you ____ an eye on my bag for a minute?\nI always ____ my promises.',
        ['keep', 'hold', 'watch'], 'A',
        '„Keep an eye on” (mieć na oku) i „keep a promise” (dotrzymać obietnicy).',
        { tag: 'keep' }),
      mc('ls3.2', 'I\'m ____ – I can\'t eat any more.\nThe bus was ____, so we had to wait for the next one.',
        ['full', 'crowded', 'busy'], 'A',
        '„I\'m full” (jestem najedzony) i „the bus was full” (autobus był pełny).',
        { tag: 'full' }),
      mc('ls3.3', 'Please ____ the door when you leave.\nMy grandparents live very ____ to us.',
        ['close', 'shut', 'near'], 'A',
        '„Close the door” oraz „live close to” (mieszkać blisko).',
        { tag: 'close' }),
      mc('ls3.4', 'She\'s wearing a ____ dress.\nIt\'s ____ cold outside, so take a scarf.',
        ['pretty', 'beautiful', 'quite'], 'A',
        '„Pretty” = ładny oraz (przed przymiotnikiem) dość, całkiem.',
        { tag: 'pretty' }),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Wybór tłumaczenia (U_TRANSLATION_MC)                                  */
/* ------------------------------------------------------------------ */

const TR_INSTR = 'Wybierz zdanie, które jest poprawnym tłumaczeniem zdania podanego po polsku.';

export const translationMcGroups: TaskGroup[] = [
  {
    id: 'tm1', format: 'U_TRANSLATION_MC', title: 'Czasy i konstrukcje (1)', instructionPl: TR_INSTR,
    stimulus: { kind: 'none' }, topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      mc('tm1.1', 'Znam go, odkąd byliśmy dziećmi.',
        ['I know him since we were children.', 'I\'ve known him since we were children.', 'I knew him since we were children.'], 'B',
        'Stan trwający od przeszłości do teraz („znam … odkąd”) wyrażamy Present Perfect + since.',
        { tag: 'present-perfect', rule: 'Present Perfect + for/since dla stanów trwających do teraz' }),
      mc('tm1.2', 'Jeśli będzie padać, zostaniemy w domu.',
        ['If it will rain, we will stay at home.', 'If it rains, we will stay at home.', 'If it rained, we stay at home.'], 'B',
        'Pierwszy tryb warunkowy: if + Present Simple, will + bezokolicznik. Po „if” nie używamy „will”.',
        { tag: 'conditionals', rule: 'If + Present Simple, … will + verb' }),
      mc('tm1.3', 'Nie musisz przychodzić jutro.',
        ['You mustn\'t come tomorrow.', 'You don\'t have to come tomorrow.', 'You haven\'t come tomorrow.'], 'B',
        '„Nie musisz” = don\'t have to. „Mustn\'t” znaczy „nie wolno ci”.',
        { tag: 'modals', distractorNotes: { A: '„Mustn\'t” = zakaz, nie brak konieczności.' } }),
      mc('tm1.4', 'Jest za zimno, żeby pływać.',
        ['It\'s too cold to swim.', 'It\'s very cold for swimming to.', 'It\'s enough cold to swim.'], 'A',
        '„Za (bardzo)” = too + przymiotnik + to + bezokolicznik.',
        { tag: 'too-enough', rule: 'too + adj + to…; adj + enough + to…' }),
    ],
  },
  {
    id: 'tm2', format: 'U_TRANSLATION_MC', title: 'Czasy i konstrukcje (2)', instructionPl: TR_INSTR,
    stimulus: { kind: 'none' }, topic: 'grammar', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      mc('tm2.1', 'Mój brat jest wyższy ode mnie.',
        ['My brother is more tall than me.', 'My brother is taller than me.', 'My brother is the tallest than me.'], 'B',
        'Krótkie przymiotniki stopniujemy końcówką -er + than.',
        { tag: 'comparatives' }),
      mc('tm2.2', 'Ten dom został zbudowany w 1990 roku.',
        ['This house built in 1990.', 'This house was built in 1990.', 'This house has been built in 1990.'], 'B',
        'Strona bierna w przeszłości: was/were + III forma. Konkretna data wyklucza Present Perfect.',
        { tag: 'passive' }),
      mc('tm2.3', 'Czy wiesz, gdzie jest dworzec?',
        ['Do you know where is the station?', 'Do you know where the station is?', 'Are you knowing where the station is?'], 'B',
        'W pytaniu pośrednim (Do you know…) zachowujemy szyk zdania oznajmującego: where the station is.',
        { tag: 'indirect-questions' }),
      mc('tm2.4', 'Kiedy byłam mała, często jeździłam do babci.',
        ['When I was little, I often went to my grandma\'s.', 'When I have been little, I often went to my grandma\'s.', 'When I was little, I have often gone to my grandma\'s.'], 'A',
        'Zakończony okres w przeszłości („kiedy byłam mała”) wymaga Past Simple w obu częściach zdania.',
        { tag: 'past-simple' }),
    ],
  },
  {
    id: 'tm3', format: 'U_TRANSLATION_MC', title: 'Czasy i konstrukcje (3)', instructionPl: TR_INSTR,
    stimulus: { kind: 'none' }, topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      mc('tm3.1', 'Powiedziała, że jest zmęczona.',
        ['She said she was tired.', 'She told she was tired.', 'She said me she was tired.'], 'A',
        '„Say” bez dopełnienia osobowego; „tell” wymaga osoby (told me). W mowie zależnej czas cofa się: is → was.',
        { tag: 'reported-speech', rule: 'say (to sb) / tell sb' }),
      mc('tm3.2', 'Czekam na ciebie od godziny.',
        ['I\'m waiting for you for an hour.', 'I\'ve been waiting for you for an hour.', 'I wait for you since an hour.'], 'B',
        'Czynność trwająca od jakiegoś czasu do teraz: Present Perfect Continuous + for.',
        { tag: 'present-perfect' }),
      mc('tm3.3', 'Ile kosztuje ten bilet?',
        ['How much does this ticket cost?', 'How many costs this ticket?', 'How much is costing this ticket?'], 'A',
        'Pytanie o cenę: How much does … cost? / How much is…?',
        { tag: 'questions' }),
      mc('tm3.4', 'Nikt mi nie pomógł.',
        ['Nobody didn\'t help me.', 'Nobody helped me.', 'Anybody helped me.'], 'B',
        'W angielskim zdaniu jest tylko jedno przeczenie: nobody + czasownik twierdzący.',
        { tag: 'negatives', rule: 'Jedno przeczenie w zdaniu' }),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Wybór wielokrotny w tekście (U_GRAMMAR_MC)                            */
/* ------------------------------------------------------------------ */

const GMC_INSTR = 'Przeczytaj tekst. Wybierz poprawne uzupełnienie każdej luki.';

export const grammarMcGroups: TaskGroup[] = [
  {
    id: 'gm1', format: 'U_GRAMMAR_MC', title: 'My first job', instructionPl: GMC_INSTR, topic: 'work', difficulty: 2,
    source: ORIGINAL, contentVersion: V,
    stimulus: {
      kind: 'text', title: 'MY FIRST JOB',
      body: 'Last summer I [[1]] a job in a small café near the beach. At first I was nervous because I had never worked with customers [[2]]. My boss was very patient and explained everything to me. After a week I was making coffee [[3]] than anyone else! The job wasn\'t very well paid, but I [[4]] a lot of interesting people.',
    },
    items: [
      mc('gm1.1', 'Luka 1', ['found', 'have found', 'was finding'], 'A', '„Last summer” to zakończony czas w przeszłości – Past Simple.', { tag: 'past-simple' }),
      mc('gm1.2', 'Luka 2', ['before', 'ago', 'yet'], 'A', '„Never … before” = nigdy wcześniej. „Ago” wymaga określenia czasu (two years ago).', { tag: 'time-expressions' }),
      mc('gm1.3', 'Luka 3', ['fast', 'faster', 'fastest'], 'B', 'Po luce jest „than” – potrzebny stopień wyższy.', { tag: 'comparatives' }),
      mc('gm1.4', 'Luka 4', ['met', 'meet', 'have met'], 'A', 'Cała historia dotyczy zeszłego lata – Past Simple. Present Perfect nie łączy się z zakończonym okresem.', { tag: 'past-simple' }),
    ],
  },
  {
    id: 'gm2', format: 'U_GRAMMAR_MC', title: 'A weekend in the mountains', instructionPl: GMC_INSTR, topic: 'travel', difficulty: 2,
    source: ORIGINAL, contentVersion: V,
    stimulus: {
      kind: 'text', title: 'A WEEKEND IN THE MOUNTAINS',
      body: 'My family loves hiking, so we usually [[1]] to Zakopane in winter. This year we stayed in a hotel [[2]] had a beautiful view of the Tatras. On Saturday it was snowing heavily, so we [[3]] go up the mountains. Instead, we visited a museum. Next year we\'re planning [[4]] in a mountain hut.',
    },
    items: [
      mc('gm2.1', 'Luka 1', ['go', 'are going', 'goes'], 'A', 'Zwyczaj („usually”) w teraźniejszości – Present Simple; podmiot „we”, więc bez -s.', { tag: 'present-simple' }),
      mc('gm2.2', 'Luka 2', ['who', 'which', 'where'], 'B', 'Zaimek względny dla rzeczy (hotel) będącej podmiotem zdania: which/that.', { tag: 'relative-clauses', distractorNotes: { C: '„Where” wymagałoby podmiotu: a hotel where we had…' } }),
      mc('gm2.3', 'Luka 3', ['couldn\'t', 'mustn\'t', 'didn\'t have'], 'A', 'Brak możliwości w przeszłości – couldn\'t.', { tag: 'modals', distractorNotes: { C: '„Didn\'t have” wymagałoby „to”: didn\'t have to go (i zmieniłoby sens).' } }),
      mc('gm2.4', 'Luka 4', ['stay', 'to stay', 'staying'], 'B', 'Po „plan” używamy bezokolicznika z „to”.', { tag: 'gerund-infinitive' }),
    ],
  },
  {
    id: 'gm3', format: 'U_GRAMMAR_MC', title: 'Learning to cook', instructionPl: GMC_INSTR, topic: 'food', difficulty: 3,
    source: ORIGINAL, contentVersion: V,
    stimulus: {
      kind: 'text', title: 'LEARNING TO COOK',
      body: 'I [[1]] cooking for two years now, and I love it. My grandmother taught me how to make pierogi. She says that the secret is to use [[2]] salt – just a pinch. Last week I cooked dinner for my whole family. Everybody said it was [[3]] meal they had ever eaten! If I have enough money, I [[4]] a cooking course next year.',
    },
    items: [
      mc('gm3.1', 'Luka 1', ['learn', 'am learning', 'have been learning'], 'C', '„For two years now” – czynność trwa od dwóch lat do teraz: Present Perfect (Continuous).', { tag: 'present-perfect' }),
      mc('gm3.2', 'Luka 2', ['a little', 'a few', 'many'], 'A', '„Salt” jest niepoliczalna – a little.', { tag: 'quantifiers' }),
      mc('gm3.3', 'Luka 3', ['the best', 'better', 'the better'], 'A', '„…they had ever eaten” – porównanie do wszystkiego, więc stopień najwyższy.', { tag: 'comparatives' }),
      mc('gm3.4', 'Luka 4', ['take', 'will take', 'would take'], 'B', 'Pierwszy tryb warunkowy: If + Present Simple, will + verb.', { tag: 'conditionals' }),
    ],
  },
  {
    id: 'gm4', format: 'U_GRAMMAR_MC', title: 'A trip to London', instructionPl: GMC_INSTR, topic: 'travel', difficulty: 3,
    source: ORIGINAL, contentVersion: V,
    stimulus: {
      kind: 'text', title: 'A TRIP TO LONDON',
      body: 'Hi Kasia,\nI\'m writing from London! We [[1]] here three days ago and we have already seen so many places. Yesterday we visited the British Museum, [[2]] is free for everyone. Tomorrow we [[3]] a boat trip on the Thames – Dad booked the tickets last week. If the weather [[4]] good, we will also go to Greenwich.\nSee you soon,\nMarta',
    },
    items: [
      mc('gm4.1', 'Luka 1', ['arrived', 'have arrived', 'were arriving'], 'A', '„Three days ago” – konkretny moment w przeszłości: Past Simple.', { tag: 'past-simple' }),
      mc('gm4.2', 'Luka 2', ['who', 'which', 'what'], 'B', 'Zdanie względne o rzeczy (muzeum), po przecinku – which.', { tag: 'relative-clauses' }),
      mc('gm4.3', 'Luka 3', ['take', 'are taking', 'would take'], 'B', 'Zaplanowane i zarezerwowane (bilety kupione) – Present Continuous.', { tag: 'future' }),
      mc('gm4.4', 'Luka 4', ['will be', 'is', 'would be'], 'B', 'Pierwszy tryb warunkowy: if + Present Simple, will + bezokolicznik.', { tag: 'conditionals' }),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Luki – jeden wyraz (U_OPEN_CLOZE)                                     */
/* ------------------------------------------------------------------ */

const OC_INSTR = 'Uzupełnij każdą lukę jednym wyrazem, tak aby otrzymać spójny i logiczny tekst. Wymagana jest pełna poprawność ortograficzna.';

export const openClozeGroups: TaskGroup[] = [
  {
    id: 'oc1', format: 'U_OPEN_CLOZE', title: 'An email to Mia', instructionPl: OC_INSTR, topic: 'home', difficulty: 2,
    source: ORIGINAL, contentVersion: V,
    stimulus: { kind: 'text', title: 'Email', body: 'Dear Mia,\nThanks [[1]] your email. I\'m sorry I didn\'t answer earlier, but I\'ve been really busy. We are moving to a new flat next month. It\'s much bigger [[2]] our old one, and it has a balcony. I can\'t wait to show it to you! [[3]] you free next weekend?\nLove,\nOla' },
    items: [
      { id: 'oc1.1', kind: 'open', accepted: ['for'], marking: 'strict', maxWords: 1, explanationPl: '„Thanks for…” – dziękujemy ZA coś.', tag: 'prepositions' },
      { id: 'oc1.2', kind: 'open', accepted: ['than'], marking: 'strict', maxWords: 1, explanationPl: 'Po stopniu wyższym (bigger) porównujemy za pomocą „than”.', tag: 'comparatives' },
      { id: 'oc1.3', kind: 'open', accepted: ['are'], marking: 'strict', maxWords: 1, explanationPl: 'Pytanie z „be”: Are you free…? (podmiot „you”).', tag: 'questions' },
    ],
  },
  {
    id: 'oc2', format: 'U_OPEN_CLOZE', title: 'The lost phone', instructionPl: OC_INSTR, topic: 'everyday', difficulty: 2,
    source: ORIGINAL, contentVersion: V,
    stimulus: { kind: 'text', title: 'The lost phone', body: 'Yesterday I lost my phone. I looked for it everywhere, but I couldn\'t find it. Then my neighbour knocked on the door. She had found it [[1]] the bus stop. I was so happy that I bought [[2]] a box of chocolates. From now [[3]], I\'ll be more careful.' },
    items: [
      { id: 'oc2.1', kind: 'open', accepted: ['at', 'near', 'by'], marking: 'strict', maxWords: 1, explanationPl: 'Miejsce w punkcie: at the bus stop (także near / by – obok).', tag: 'prepositions' },
      { id: 'oc2.2', kind: 'open', accepted: ['her'], marking: 'strict', maxWords: 1, explanationPl: 'Kupiłam JEJ (sąsiadce) – zaimek w formie dopełnienia: her.', tag: 'pronouns' },
      { id: 'oc2.3', kind: 'open', accepted: ['on'], marking: 'strict', maxWords: 1, explanationPl: 'Stałe wyrażenie „from now on” – od teraz.', tag: 'fixed-phrases' },
    ],
  },
  {
    id: 'oc3', format: 'U_OPEN_CLOZE', title: 'Screen time', instructionPl: OC_INSTR, topic: 'technology', difficulty: 2,
    source: ORIGINAL, contentVersion: V,
    stimulus: { kind: 'text', title: 'Screen time', body: 'Many teenagers spend too [[1]] time online. Experts say it is a good idea to switch off your phone an hour before you go [[2]] bed. It is also important to do sport regularly, [[3]] example, swimming or cycling.' },
    items: [
      { id: 'oc3.1', kind: 'open', accepted: ['much'], marking: 'strict', maxWords: 1, explanationPl: '„Time” jest tu niepoliczalny – too much time.', tag: 'quantifiers' },
      { id: 'oc3.2', kind: 'open', accepted: ['to'], marking: 'strict', maxWords: 1, explanationPl: 'Wyrażenie „go to bed” – bez przedimka.', tag: 'fixed-phrases' },
      { id: 'oc3.3', kind: 'open', accepted: ['for'], marking: 'strict', maxWords: 1, explanationPl: '„For example” – na przykład.', tag: 'fixed-phrases' },
    ],
  },
  {
    id: 'oc4', format: 'U_OPEN_CLOZE', title: 'Our school trip', instructionPl: OC_INSTR, topic: 'travel', difficulty: 3,
    source: ORIGINAL, contentVersion: V,
    stimulus: { kind: 'text', title: 'Our school trip', body: 'Our school trip to Gdańsk was fantastic. We went there [[1]] train, which took about five hours. On the first day we visited the European Solidarity Centre, [[2]] is a modern museum. Unfortunately, it rained all the time, so we [[3]] to buy umbrellas.' },
    items: [
      { id: 'oc4.1', kind: 'open', accepted: ['by'], marking: 'strict', maxWords: 1, explanationPl: 'Środek transportu: by train, by bus, by car.', tag: 'prepositions' },
      { id: 'oc4.2', kind: 'open', accepted: ['which'], marking: 'strict', maxWords: 1, explanationPl: 'Po przecinku (zdanie względne dodające informację) używamy „which”, nie „that”.', tag: 'relative-clauses' },
      { id: 'oc4.3', kind: 'open', accepted: ['had'], marking: 'strict', maxWords: 1, explanationPl: 'Konieczność w przeszłości: had to + bezokolicznik.', tag: 'modals' },
    ],
  },
  {
    id: 'oc5', format: 'U_OPEN_CLOZE', title: 'My new hobby', instructionPl: OC_INSTR, topic: 'free-time', difficulty: 2,
    source: ORIGINAL, contentVersion: V,
    stimulus: { kind: 'text', title: 'Blog post', body: 'Three months ago I started climbing. I go to a climbing wall [[1]] my best friend twice a week. At first I was afraid of falling, but now I feel much more confident. I\'m not very good [[2]] it yet, but I\'m getting better every week. Next month we are going to climb outdoors for the [[3]] time!' },
    items: [
      { id: 'oc5.1', kind: 'open', accepted: ['with'], marking: 'strict', maxWords: 1, explanationPl: 'Chodzimy gdzieś Z kimś – „with my best friend”.', tag: 'prepositions' },
      { id: 'oc5.2', kind: 'open', accepted: ['at'], marking: 'strict', maxWords: 1, explanationPl: 'Stałe połączenie: be good AT something.', tag: 'fixed-phrases' },
      { id: 'oc5.3', kind: 'open', accepted: ['first'], marking: 'strict', maxWords: 1, explanationPl: '„For the first time” – po raz pierwszy.', tag: 'fixed-phrases' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Parafrazy (U_TRANSFORM)                                               */
/* ------------------------------------------------------------------ */

const TF_INSTR = 'Uzupełnij zdanie, wykorzystując wyraz podany WIELKIMI literami, tak aby zachować sens zdania wyjściowego. Nie zmieniaj formy podanego wyrazu. Maksymalnie 5 wyrazów, wliczając podany wyraz. Wymagana jest pełna poprawność.';

export const transformGroups: TaskGroup[] = [
  {
    id: 'tf1', format: 'U_TRANSFORM', title: 'Parafrazy (1)', instructionPl: TF_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'tf1.1', kind: 'open', prompt: 'It isn\'t necessary for you to bring any food.', keyWord: 'HAVE', before: 'You', after: 'any food.', accepted: ['don\'t have to bring', 'do not have to bring'], marking: 'strict', maxWords: 5, explanationPl: 'Brak konieczności = don\'t have to.', tag: 'modals' },
      { id: 'tf1.2', kind: 'open', prompt: 'I started learning English six years ago.', keyWord: 'FOR', before: 'I have', after: 'six years.', accepted: ['been learning English for', 'learnt English for', 'learned English for'], marking: 'strict', maxWords: 5, explanationPl: 'Czynność trwa od 6 lat do teraz: have (been) learning/learnt + for + okres.', tag: 'present-perfect' },
      { id: 'tf1.3', kind: 'open', prompt: 'Kate is taller than her sister.', keyWord: 'AS', before: 'Kate\'s sister', after: 'Kate.', accepted: ['isn\'t as tall as', 'is not as tall as'], marking: 'strict', maxWords: 5, explanationPl: 'not as + przymiotnik + as = nie tak … jak.', tag: 'comparatives' },
    ],
  },
  {
    id: 'tf2', format: 'U_TRANSFORM', title: 'Parafrazy (2)', instructionPl: TF_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'tf2.1', kind: 'open', prompt: 'Somebody stole my bike last night.', keyWord: 'WAS', before: 'My bike', after: 'last night.', accepted: ['was stolen'], marking: 'strict', maxWords: 5, explanationPl: 'Strona bierna w Past Simple: was + III forma (steal – stole – stolen).', tag: 'passive' },
      { id: 'tf2.2', kind: 'open', prompt: 'Why don\'t we go to the cinema tonight?', keyWord: 'SHALL', before: '', after: 'to the cinema tonight?', accepted: ['Shall we go'], marking: 'strict', maxWords: 5, explanationPl: 'Propozycja: Shall we + bezokolicznik?', tag: 'suggestions' },
      { id: 'tf2.3', kind: 'open', prompt: 'This is the first time I have been to Paris.', keyWord: 'NEVER', before: 'I', after: 'to Paris before.', accepted: ['have never been', '\'ve never been'], marking: 'strict', maxWords: 5, explanationPl: '„Pierwszy raz” = nigdy wcześniej: have never been … before.', tag: 'present-perfect' },
    ],
  },
  {
    id: 'tf3', format: 'U_TRANSFORM', title: 'Parafrazy (3)', instructionPl: TF_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 4, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'tf3.1', kind: 'open', prompt: 'Jack can\'t go to the party because he is ill.', keyWord: 'IF', before: 'Jack could go to the party', after: 'ill.', accepted: ['if he wasn\'t', 'if he was not', 'if he weren\'t', 'if he were not'], marking: 'strict', maxWords: 5, explanationPl: 'Sytuacja nierealna teraz – drugi tryb warunkowy: if + Past Simple (were/was).', tag: 'conditionals' },
      { id: 'tf3.2', kind: 'open', prompt: 'My mum told me, "Don\'t be late."', keyWord: 'NOT', before: 'My mum told me', after: 'late.', accepted: ['not to be'], marking: 'strict', maxWords: 5, explanationPl: 'Polecenie przeczące w mowie zależnej: tell sb not to + bezokolicznik.', tag: 'reported-speech' },
      { id: 'tf3.3', kind: 'open', prompt: 'Is it possible for me to use your phone?', keyWord: 'CAN', before: '', after: 'your phone?', accepted: ['Can I use'], marking: 'strict', maxWords: 5, explanationPl: 'Prośba o pozwolenie: Can I + bezokolicznik?', tag: 'modals' },
    ],
  },
  {
    id: 'tf4', format: 'U_TRANSFORM', title: 'Parafrazy (4)', instructionPl: TF_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'tf4.1', kind: 'open', prompt: 'I don\'t have enough money to buy this laptop.', keyWord: 'AFFORD', before: 'I', after: 'this laptop.', accepted: ['can\'t afford', 'cannot afford', 'can\'t afford to buy', 'cannot afford to buy'], marking: 'strict', maxWords: 5, explanationPl: '„Can\'t afford (to buy) sth” = nie stać mnie na coś.', tag: 'vocabulary' },
      { id: 'tf4.2', kind: 'open', prompt: 'How much does this T-shirt cost?', keyWord: 'PRICE', before: 'What', after: 'this T-shirt?', accepted: ['is the price of', '\'s the price of'], marking: 'strict', maxWords: 5, explanationPl: '„What is the price of…?” = ile kosztuje…?', tag: 'questions' },
      { id: 'tf4.3', kind: 'open', prompt: 'They will finish the new bridge next year.', keyWord: 'BE', before: 'The new bridge', after: 'next year.', accepted: ['will be finished', 'is going to be finished'], marking: 'strict', maxWords: 5, explanationPl: 'Strona bierna w przyszłości: will be + III forma.', tag: 'passive' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Układanie fragmentów zdań (U_GRAMMATICALISE)                         */
/* ------------------------------------------------------------------ */

const GR_INSTR = 'Uzupełnij zdania, wykorzystując w odpowiedniej formie wyrazy podane w nawiasach. Nie zmieniaj kolejności podanych wyrazów; jeśli to konieczne, dodaj inne wyrazy. Maksymalnie 5 wyrazów, wliczając podane. Wymagana jest pełna poprawność.';

export const grammaticaliseGroups: TaskGroup[] = [
  {
    id: 'gz1', format: 'U_GRAMMATICALISE', title: 'Gramatykalizacja (1)', instructionPl: GR_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'gz1.1', kind: 'open', before: 'We', prompt: '(not / see / each other)', after: 'since last summer.', accepted: ['haven\'t seen each other', 'have not seen each other'], marking: 'strict', maxWords: 5, explanationPl: '„Since last summer” – Present Perfect w przeczeniu.', tag: 'present-perfect' },
      { id: 'gz1.2', kind: 'open', before: 'Where', prompt: '(you / buy)', after: 'that jacket? It looks great.', accepted: ['did you buy'], marking: 'strict', maxWords: 5, explanationPl: 'Pytanie o zakończoną czynność w przeszłości: did + podmiot + bezokolicznik.', tag: 'past-simple' },
      { id: 'gz1.3', kind: 'open', before: 'This is', prompt: '(good / pizza)', after: 'I have ever eaten.', accepted: ['the best pizza'], marking: 'strict', maxWords: 5, explanationPl: '„…I have ever eaten” → stopień najwyższy: good – better – the best.', tag: 'comparatives' },
    ],
  },
  {
    id: 'gz2', format: 'U_GRAMMATICALISE', title: 'Gramatykalizacja (2)', instructionPl: GR_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'gz2.1', kind: 'open', before: 'When I arrived home, my parents', prompt: '(have / dinner)', after: 'in the kitchen, so I joined them.', accepted: ['were having dinner'], marking: 'strict', maxWords: 5, explanationPl: 'Czynność w trakcie, gdy coś się wydarzyło – Past Continuous.', tag: 'past-continuous' },
      { id: 'gz2.2', kind: 'open', before: 'I\'m tired. I think I', prompt: '(go / bed)', after: 'early tonight.', accepted: ['will go to bed', '\'ll go to bed', 'am going to bed'], marking: 'strict', maxWords: 5, explanationPl: 'Po „I think” spontaniczna decyzja/przewidywanie: will + bezokolicznik; „go to bed” bez przedimka.', tag: 'future' },
      { id: 'gz2.3', kind: 'open', before: 'My grandparents\' house', prompt: '(build / 100 years)', after: 'ago.', accepted: ['was built 100 years', 'was built one hundred years', 'was built a hundred years'], marking: 'strict', maxWords: 5, explanationPl: 'Dom „został zbudowany” – strona bierna w Past Simple.', tag: 'passive' },
    ],
  },
  {
    id: 'gz3', format: 'U_GRAMMATICALISE', title: 'Gramatykalizacja (3)', instructionPl: GR_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'gz3.1', kind: 'open', before: 'If you', prompt: '(not / hurry)', after: ', you will miss the bus.', accepted: ['don\'t hurry', 'do not hurry'], marking: 'strict', maxWords: 5, explanationPl: 'Po „if” w pierwszym trybie warunkowym – Present Simple.', tag: 'conditionals' },
      { id: 'gz3.2', kind: 'open', before: 'Paul is interested', prompt: '(play / guitar)', after: '.', accepted: ['in playing the guitar', 'in playing guitar'], marking: 'strict', maxWords: 5, explanationPl: '„Interested in” + czasownik z -ing.', tag: 'gerund-infinitive' },
      { id: 'gz3.3', kind: 'open', before: 'There', prompt: '(not / be / many)', after: 'people at the concert yesterday.', accepted: ['weren\'t many', 'were not many'], marking: 'strict', maxWords: 5, explanationPl: '„People” to liczba mnoga, „yesterday” – przeszłość: there weren\'t many.', tag: 'past-simple' },
    ],
  },
  {
    id: 'gz4', format: 'U_GRAMMATICALISE', title: 'Gramatykalizacja (4)', instructionPl: GR_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 4, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'gz4.1', kind: 'open', before: 'How long', prompt: '(you / live)', after: 'in Kraków? – Since 2019.', accepted: ['have you lived', 'have you been living'], marking: 'strict', maxWords: 5, explanationPl: '„How long…? – Since…” – Present Perfect (Continuous).', tag: 'present-perfect' },
      { id: 'gz4.2', kind: 'open', before: 'She asked me', prompt: '(where / I / live)', after: '.', accepted: ['where I lived', 'where I live'], marking: 'strict', maxWords: 5, explanationPl: 'Pytanie zależne: szyk oznajmujący, zwykle z cofnięciem czasu (where I lived).', tag: 'reported-speech' },
      { id: 'gz4.3', kind: 'open', before: 'My brother is', prompt: '(bad / cook)', after: 'in our family.', accepted: ['the worst cook'], marking: 'strict', maxWords: 5, explanationPl: '„In our family” – porównanie z grupą: stopień najwyższy bad – worse – the worst.', tag: 'comparatives' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tłumaczenie fragmentów (U_TRANSLATE_OPEN)                            */
/* ------------------------------------------------------------------ */

const TO_INSTR = 'Przetłumacz na język angielski fragmenty podane w nawiasach, tak aby otrzymać zdania logiczne i poprawne gramatycznie. Maksymalnie 5 wyrazów. Wymagana jest pełna poprawność ortograficzna.';

export const translateOpenGroups: TaskGroup[] = [
  {
    id: 'to1', format: 'U_TRANSLATE_OPEN', title: 'Tłumaczenie (1)', instructionPl: TO_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'to1.1', kind: 'open', prompt: '(Czy kiedykolwiek byłeś)', before: '', after: 'in London?', accepted: ['Have you ever been'], marking: 'strict', maxWords: 5, explanationPl: 'Doświadczenie życiowe – Present Perfect z „ever”.', tag: 'present-perfect' },
      { id: 'to1.2', kind: 'open', prompt: '(nie mogę przyjść)', before: 'I\'m sorry, but', after: 'to your party.', accepted: ['I can\'t come', 'I cannot come'], marking: 'strict', maxWords: 5, explanationPl: '„Nie mogę” = I can\'t; „przyjść” = come.', tag: 'modals' },
      { id: 'to1.3', kind: 'open', prompt: '(jest dobra w)', before: 'My sister', after: 'maths.', accepted: ['is good at'], marking: 'strict', maxWords: 5, explanationPl: '„Być dobrym w czymś” = be good AT something.', tag: 'prepositions' },
    ],
  },
  {
    id: 'to2', format: 'U_TRANSLATE_OPEN', title: 'Tłumaczenie (2)', instructionPl: TO_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 2, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'to2.1', kind: 'open', prompt: '(Ile kosztują)', before: '', after: 'these shoes?', accepted: ['How much are'], marking: 'strict', maxWords: 5, explanationPl: 'Pytanie o cenę rzeczy w liczbie mnogiej: How much are…?', tag: 'questions' },
      { id: 'to2.2', kind: 'open', prompt: '(musieliśmy czekać)', before: 'We', after: 'for an hour.', accepted: ['had to wait'], marking: 'strict', maxWords: 5, explanationPl: '„Musieć” w przeszłości = had to.', tag: 'modals' },
      { id: 'to2.3', kind: 'open', prompt: '(najgorszy film)', before: 'It\'s', after: 'I\'ve ever seen.', accepted: ['the worst film', 'the worst movie'], marking: 'strict', maxWords: 5, explanationPl: 'Stopień najwyższy od „bad”: the worst.', tag: 'comparatives' },
    ],
  },
  {
    id: 'to3', format: 'U_TRANSLATE_OPEN', title: 'Tłumaczenie (3)', instructionPl: TO_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'to3.1', kind: 'open', prompt: '(Nie wolno ci)', before: '', after: 'use your phone during the exam.', accepted: ['You mustn\'t', 'You must not', 'You can\'t', 'You cannot', 'You aren\'t allowed to', 'You are not allowed to'], marking: 'strict', maxWords: 5, explanationPl: 'Zakaz: mustn\'t / can\'t / aren\'t allowed to.', tag: 'modals' },
      { id: 'to3.2', kind: 'open', prompt: '(spotkałem ją)', before: 'I', after: 'two days ago.', accepted: ['met her', 'ran into her', 'bumped into her'], marking: 'strict', maxWords: 5, explanationPl: '„Two days ago” – Past Simple: meet – met; zaimek dopełnienia: her.', tag: 'past-simple' },
      { id: 'to3.3', kind: 'open', prompt: '(Ten pokój jest sprzątany)', before: '', after: 'every day.', accepted: ['This room is cleaned'], marking: 'strict', maxWords: 5, explanationPl: 'Strona bierna w Present Simple: is + III forma.', tag: 'passive' },
    ],
  },
  {
    id: 'to4', format: 'U_TRANSLATE_OPEN', title: 'Tłumaczenie (4)', instructionPl: TO_INSTR, stimulus: { kind: 'none' },
    topic: 'grammar', difficulty: 3, source: ORIGINAL, contentVersion: V,
    items: [
      { id: 'to4.1', kind: 'open', prompt: '(będę miał czas)', before: 'If I', after: ', I\'ll call you.', accepted: ['have time', 'have the time'], marking: 'strict', maxWords: 5, explanationPl: 'Po „if” w 1. trybie warunkowym – Present Simple, choć po polsku mówimy „będę miał”.', tag: 'conditionals' },
      { id: 'to4.2', kind: 'open', prompt: '(pozwolili mi)', before: 'My parents', after: 'go to the concert.', accepted: ['let me'], marking: 'strict', maxWords: 5, explanationPl: '„Pozwolić komuś coś zrobić” = let sb do sth (bez „to”). „Allowed me” wymagałoby „to go”.', tag: 'vocabulary' },
      { id: 'to4.3', kind: 'open', prompt: '(jest mało)', before: 'There', after: 'milk in the fridge.', accepted: ['is little', 'isn\'t much', 'is not much', 'isn\'t a lot of', 'is not a lot of'], marking: 'strict', maxWords: 5, explanationPl: '„Mało” (niepoliczalne) = little / not much. „A little” znaczy „trochę” – to inny sens.', tag: 'quantifiers' },
    ],
  },
];

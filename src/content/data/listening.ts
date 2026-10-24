import type { AudioClip, AudioLine, TaskGroup } from '../types';
import { mc, opts, ORIGINAL } from './helpers';

const V = 1;
const f = (speaker: string, text: string): AudioLine => ({ speaker, voice: 'f', text });
const m = (speaker: string, text: string): AudioLine => ({ speaker, voice: 'm', text });
const clip = (id: string, label: string, lines: AudioLine[]): AudioClip => ({ id, label, lines });

/* ------------------------------------------------------------------ */
/* Dobieranie zdań do wypowiedzi (L_MATCH)                               */
/* ------------------------------------------------------------------ */

export const listeningMatchGroups: TaskGroup[] = [
  {
    id: 'lm1', format: 'L_MATCH', title: 'Volunteering', topic: 'society', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Usłyszysz dwukrotnie pięć wypowiedzi na temat wolontariatu. Do każdej wypowiedzi (1–5) dopasuj odpowiadające jej zdanie (A–F). Uwaga: jedno zdanie zostało podane dodatkowo i nie pasuje do żadnej wypowiedzi.',
    stimulus: {
      kind: 'audio',
      clips: [
        clip('lm1-1', 'Wypowiedź 1', [f('Speaker 1', 'I\'d never thought about helping at an animal shelter until my best friend Kasia asked me to go with her one Saturday. She\'d been doing it for months and kept telling me how rewarding it was. So I went, and now we go together every weekend. I mostly walk the dogs and clean the cages.')]),
        clip('lm1-2', 'Wypowiedź 2', [m('Speaker 2', 'I help at a food bank twice a month. At the beginning I just carried boxes, but then the manager showed me how to use the computer system for checking deliveries. Now I can organise a whole warehouse database, which will be really useful when I look for a job.')]),
        clip('lm1-3', 'Wypowiedź 3', [f('Speaker 3', 'My grandad and I spend Sunday mornings in the local park. We pick up rubbish and plant flowers with a group from our neighbourhood. He\'s seventy-five, but he works harder than I do! It\'s become our special time together.')]),
        clip('lm1-4', 'Wypowiedź 4', [m('Speaker 4', 'I used to read books to children in hospital every Thursday. Last year, though, I broke my leg playing football, and I couldn\'t get there for almost three months. I missed it a lot. I\'m back now, and the kids were really happy to see me.')]),
        clip('lm1-5', 'Wypowiedź 5', [f('Speaker 5', 'To be honest, I only signed up for the charity run because my school needed people. I expected to be bored standing at a water station for hours. But the atmosphere was amazing – everyone was cheering and smiling. I had so much fun that I\'ve already registered for next year.')]),
      ],
    },
    options: opts(
      'This speaker was surprised by how much he/she enjoyed it.',
      'This speaker started volunteering because of a friend.',
      'This speaker had to stop volunteering for a while.',
      'This speaker volunteers together with a family member.',
      'This speaker learned a practical skill.',
      'This speaker thinks volunteering should be compulsory at school.',
    ),
    items: [
      { id: 'lm1.1', kind: 'match', prompt: 'Wypowiedź 1', answer: 'B', explanationPl: 'Mówczyni zaczęła, bo przyjaciółka Kasia poprosiła ją, żeby z nią poszła.', evidence: 'my best friend Kasia asked me to go with her' },
      { id: 'lm1.2', kind: 'match', prompt: 'Wypowiedź 2', answer: 'E', explanationPl: 'Nauczył się obsługi systemu komputerowego – praktycznej umiejętności przydatnej w pracy.', evidence: 'the manager showed me how to use the computer system' },
      { id: 'lm1.3', kind: 'match', prompt: 'Wypowiedź 3', answer: 'D', explanationPl: 'Pomaga razem z dziadkiem – członkiem rodziny.', evidence: 'My grandad and I spend Sunday mornings…' },
      { id: 'lm1.4', kind: 'match', prompt: 'Wypowiedź 4', answer: 'C', explanationPl: 'Złamana noga – przez prawie trzy miesiące nie mógł przychodzić.', evidence: 'I couldn\'t get there for almost three months' },
      { id: 'lm1.5', kind: 'match', prompt: 'Wypowiedź 5', answer: 'A', explanationPl: 'Spodziewała się nudy, a świetnie się bawiła – była zaskoczona.', evidence: 'I expected to be bored… I had so much fun' },
    ],
  },
  {
    id: 'lm2', format: 'L_MATCH', title: 'Travelling', topic: 'travel', difficulty: 3, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Usłyszysz dwukrotnie pięć wypowiedzi na temat podróży. Do każdej wypowiedzi (1–5) dopasuj odpowiadające jej zdanie (A–F). Uwaga: jedno zdanie zostało podane dodatkowo i nie pasuje do żadnej wypowiedzi.',
    stimulus: {
      kind: 'audio',
      clips: [
        clip('lm2-1', 'Wypowiedź 1', [m('Speaker 1', 'We were supposed to spend a week sailing on the Masurian lakes. But the forecast said there would be strong winds and storms every day, so we decided to go to the mountains instead. It turned out to be a great decision – we had sunshine almost the whole time.')]),
        clip('lm2-2', 'Wypowiedź 2', [f('Speaker 2', 'When I arrived in Lisbon, my phone battery was dead and I had no idea how to get to my hostel. An old man at the tram stop noticed I was confused. He didn\'t speak much English, but he drew me a little map and even rode the tram with me for two stops.')]),
        clip('lm2-3', 'Wypowiedź 3', [m('Speaker 3', 'The photos on the website looked fantastic – a big room with a sea view. In reality, the room was tiny, the window looked onto a car park, and the shower didn\'t work properly. The town itself was lovely, though, so I tried not to spend much time in the hotel.')]),
        clip('lm2-4', 'Wypowiedź 4', [f('Speaker 4', 'Last summer my parents finally agreed to let me go to Berlin on my own. I\'d always gone on holiday with my family, so I was a bit scared at first. But I managed everything myself – buying tickets, finding places to eat – and I felt really proud.')]),
        clip('lm2-5', 'Wypowiedź 5', [m('Speaker 5', 'We got to the station just in time, or so we thought. It turned out our train was leaving from a different platform, on the other side of the station. By the time we ran there, the doors had closed and the train was moving. We had to wait two hours for the next one.')]),
      ],
    },
    options: opts(
      'This speaker missed a means of transport.',
      'This speaker travelled alone for the first time.',
      'This speaker changed travel plans because of the weather.',
      'This speaker lost something important during the trip.',
      'This speaker was disappointed with the accommodation.',
      'This speaker got help from a stranger.',
    ),
    items: [
      { id: 'lm2.1', kind: 'match', prompt: 'Wypowiedź 1', answer: 'C', explanationPl: 'Prognoza burz sprawiła, że zamiast żeglowania pojechali w góry.', evidence: 'the forecast said there would be strong winds… so we decided to go to the mountains instead' },
      { id: 'lm2.2', kind: 'match', prompt: 'Wypowiedź 2', answer: 'F', explanationPl: 'Nieznajomy starszy pan narysował mapkę i pojechał z nią tramwajem.', evidence: 'An old man at the tram stop… drew me a little map' },
      { id: 'lm2.3', kind: 'match', prompt: 'Wypowiedź 3', answer: 'E', explanationPl: 'Pokój okazał się mały, z widokiem na parking i zepsutym prysznicem – rozczarowanie zakwaterowaniem.', evidence: 'In reality, the room was tiny…' },
      { id: 'lm2.4', kind: 'match', prompt: 'Wypowiedź 4', answer: 'B', explanationPl: 'Pierwszy raz pojechała sama („on my own”), wcześniej zawsze z rodziną.', evidence: 'let me go to Berlin on my own. I\'d always gone on holiday with my family' },
      { id: 'lm2.5', kind: 'match', prompt: 'Wypowiedź 5', answer: 'A', explanationPl: 'Spóźnili się na pociąg – drzwi się zamknęły, musieli czekać na następny.', evidence: 'the doors had closed and the train was moving' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Wybór wielokrotny (L_MC) – każda pozycja ma własne krótkie nagranie   */
/* ------------------------------------------------------------------ */

const LMC_INSTR = 'Usłyszysz dwukrotnie sześć tekstów. W zadaniach 1–6 z podanych odpowiedzi wybierz właściwą, zgodną z treścią nagrania.';

export const listeningMcGroups: TaskGroup[] = [
  {
    id: 'lmc1', format: 'L_MC', title: 'Short recordings (1)', topic: 'everyday', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: LMC_INSTR, stimulus: { kind: 'audio', clips: [] },
    items: [
      mc('lmc1.1', 'Why is the man talking to the shop assistant?',
        ['He wants to buy new headphones.', 'He wants a refund for a faulty product.', 'He wants his headphones repaired.'], 'B',
        'Słuchawki nie działają i mężczyzna woli zwrot pieniędzy niż nową parę.',
        { tag: 'intention', evidence: 'I\'d prefer my money back rather than a new pair',
          audio: clip('lmc1-1', 'Tekst 1', [f('Assistant', 'Hi, can I help you?'), m('Man', 'Yes, I bought these headphones here yesterday, but the left side doesn\'t work.'), f('Assistant', 'Oh, I\'m sorry. Have you got the receipt?'), m('Man', 'Here it is. I\'d prefer my money back rather than a new pair, if that\'s possible.'), f('Assistant', 'No problem.')]) }),
      mc('lmc1.2', 'What has changed?',
        ['the destination and the time', 'the time and the platform', 'the platform and the train number'], 'B',
        'Pociąg jest opóźniony (zmiana czasu) i odjedzie z peronu czwartego zamiast drugiego.',
        { tag: 'specific-info', evidence: 'delayed by approximately twenty minutes… from platform four, not platform two',
          audio: clip('lmc1-2', 'Tekst 2', [f('Announcer', 'Attention, please. The ten forty-five train to Gdynia is delayed by approximately twenty minutes due to a technical problem. It will now depart from platform four, not platform two. We apologise for any inconvenience.')]) }),
      mc('lmc1.3', 'On Saturday the girl will probably',
        ['watch the whole match with the boy.', 'spend most of the day at home.', 'go shopping with her mum.'], 'B',
        'Obiecała mamie pomóc malować kuchnię – większość dnia spędzi w domu; może obejrzy tylko drugą połowę.',
        { tag: 'inference', evidence: 'I promised my mum I\'d help her paint the kitchen',
          audio: clip('lmc1-3', 'Tekst 3', [m('Boy', 'Are you coming to the match on Saturday?'), f('Girl', 'I\'d love to, but I promised my mum I\'d help her paint the kitchen. Maybe we can watch the second half together if we finish early.'), m('Boy', 'OK, text me.')]) }),
      mc('lmc1.4', 'Jack wants Emma to',
        ['prepare the slides.', 'find pictures.', 'give the presentation.'], 'B',
        'Jack zrobił już slajdy, ale nie ma zdjęć – prosi Emmę o ich znalezienie.',
        { tag: 'intention', evidence: 'I still haven\'t found any good photos. Could you look for some tonight?',
          audio: clip('lmc1-4', 'Tekst 4', [m('Jack', 'Hi Emma, it\'s Jack. I\'m calling about the project. I\'ve finished the presentation slides, but I still haven\'t found any good photos. Could you look for some tonight? Then we can put everything together tomorrow before class. Thanks!')]) }),
      mc('lmc1.5', 'Where are the speakers most probably?',
        ['in a restaurant', 'at the man\'s home', 'in a supermarket'], 'B',
        'Mężczyzna sam ugotował zupę według przepisu babci – najpewniej jedzą u niego w domu.',
        { tag: 'context', evidence: 'Did you make it yourself? – Yes, it\'s my grandmother\'s recipe.',
          audio: clip('lmc1-5', 'Tekst 5', [f('Woman', 'This soup is delicious. Did you make it yourself?'), m('Man', 'Yes, it\'s my grandmother\'s recipe. The secret is fresh ginger.'), f('Woman', 'You must give me the recipe.'), m('Man', 'Sure, I\'ll write it down for you.')]) }),
      mc('lmc1.6', 'What is the main message of the speaker?',
        ['Learning Italian is easier than people think.', 'Making mistakes is a natural part of learning a language.', 'Translators need to speak several languages.'], 'B',
        'Mówczyni zachęca, by nie bać się błędów – sama popełniała ich setki i dziś jest tłumaczką.',
        { tag: 'main-idea', evidence: 'not to be afraid of making mistakes',
          audio: clip('lmc1-6', 'Tekst 6', [f('Speaker', 'That\'s why I tell young people not to be afraid of making mistakes when they speak a foreign language. When I started learning Italian, I made hundreds of mistakes every day. People didn\'t laugh at me – they helped me. Now I work as a translator.')]) }),
    ],
  },
  {
    id: 'lmc2', format: 'L_MC', title: 'Short recordings (2)', topic: 'everyday', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: LMC_INSTR, stimulus: { kind: 'audio', clips: [] },
    items: [
      mc('lmc2.1', 'Where is the scarf now?', ['on the chair', 'in the washing machine', 'in the wardrobe'], 'B',
        'Mama włożyła szalik do pralki, bo był brudny.',
        { tag: 'specific-info', evidence: 'I put it in the washing machine this morning',
          audio: clip('lmc2-1', 'Tekst 1', [f('Girl', 'Mum, have you seen my blue scarf? I\'m sure I left it on the chair.'), f('Mum', 'I put it in the washing machine this morning. It was dirty.'), f('Girl', 'Oh no! I wanted to wear it today.')]) }),
      mc('lmc2.2', 'Visitors are not allowed to', ['take photos in one of the rooms.', 'visit the garden.', 'buy souvenirs.'], 'A',
        'Zdjęcia można robić wszędzie oprócz sypialni królewskiej.',
        { tag: 'specific-info', evidence: 'You can take photos everywhere except in the royal bedroom.',
          audio: clip('lmc2-2', 'Tekst 2', [m('Guide', 'Welcome to the castle. Before we start, a few rules. You can take photos everywhere except in the royal bedroom. Please don\'t touch the furniture, and remember that the tour finishes in the garden, where you\'ll find the café and the gift shop.')]) }),
      mc('lmc2.3', 'What is the woman\'s problem with the job?', ['The interview was difficult.', 'The journey to work is long.', 'The people are unfriendly.'], 'B',
        'Biuro jest daleko – prawie półtorej godziny autobusem w jedną stronę.',
        { tag: 'specific-info', evidence: 'nearly an hour and a half by bus each way',
          audio: clip('lmc2-3', 'Tekst 3', [m('Man', 'So, how was the interview?'), f('Woman', 'Well, the questions were easy, and the people were friendly. But the office is so far from my flat – nearly an hour and a half by bus each way.'), m('Man', 'So you won\'t take the job?'), f('Woman', 'I\'ll think about it, but probably not.')]) }),
      mc('lmc2.4', 'The speakers decide to', ['go climbing.', 'go bowling.', 'stay at home.'], 'B',
        'Dziewczyna boi się wysokości i proponuje kręgle – chłopak się zgadza.',
        { tag: 'specific-info', evidence: 'How about bowling instead? – Fine, bowling it is.',
          audio: clip('lmc2-4', 'Tekst 4', [m('Boy', 'Do you want to go to the new climbing wall? It\'s only fifteen zloty.'), f('Girl', 'Climbing? I\'m scared of heights, you know that. How about bowling instead?'), m('Boy', 'Fine, bowling it is.')]) }),
      mc('lmc2.5', 'Who is the speaker?', ['a student', 'a teacher', 'a parent'], 'B',
        'Pracuje w szkole od 20 lat i mówi o uczniach, którzy potrzebują nauczyciela – to nauczycielka.',
        { tag: 'context', evidence: 'I\'ve been working at this school for twenty years',
          audio: clip('lmc2-5', 'Tekst 5', [f('Speaker', 'I\'ve been working at this school for twenty years, and I\'ve seen a lot of changes. When I started, we didn\'t have computers in the classrooms. Today students do research on tablets. But one thing hasn\'t changed – they still need a teacher who listens to them.')]) }),
      mc('lmc2.6', 'Where does the conversation take place?', ['on a train', 'in a café', 'in a cinema'], 'A',
        'Słowo „carriage” (wagon) wskazuje, że rozmowa odbywa się w pociągu.',
        { tag: 'context', evidence: 'Are there any free seats in the next carriage?',
          audio: clip('lmc2-6', 'Tekst 6', [f('Woman', 'Excuse me, is this seat free?'), m('Man', 'Sorry, my friend is sitting there. She\'s just gone to get some coffee.'), f('Woman', 'Oh, OK. Are there any free seats in the next carriage?'), m('Man', 'I think so.')]) }),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Uzupełnianie notatki (L_GAP)                                          */
/* ------------------------------------------------------------------ */

export const listeningGapGroups: TaskGroup[] = [
  {
    id: 'lg1', format: 'L_GAP', title: 'A young baker', topic: 'work', difficulty: 3, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Usłyszysz dwukrotnie rozmowę z młodym piekarzem. Uzupełnij luki 1–4 w notatce, tak aby jak najbardziej precyzyjnie oddać sens nagrania. Luki uzupełnij w języku angielskim.',
    stimulus: {
      kind: 'audio',
      clips: [clip('lg1', 'Rozmowa', [
        f('Presenter', 'Today in the studio we have Leo Martin, who opened his own bakery at just nineteen. Leo, how did it all start?'),
        m('Leo', 'Well, I first baked bread with my uncle when I was twelve. He\'s a chef, and he showed me how to make sourdough.'),
        f('Presenter', 'And what is the most popular thing in your bakery now?'),
        m('Leo', 'Surprisingly, it\'s not bread. It\'s our cinnamon rolls – we sell about three hundred every Saturday.'),
        f('Presenter', 'Wow. What\'s the hardest part of the job?'),
        m('Leo', 'Definitely getting up so early. I start work at four o\'clock in the morning, six days a week.'),
        f('Presenter', 'And your plans?'),
        m('Leo', 'Next year I\'d like to open a small café next to the bakery, so people can sit and eat there.'),
      ])],
    },
    items: [
      { id: 'lg1.1', kind: 'open', before: 'Learnt to bake from his', after: '.', accepted: ['uncle'], marking: 'comprehension', maxWords: 3, explanationPl: 'Leo piekł pierwszy chleb z wujkiem, który jest kucharzem.', evidence: 'I first baked bread with my uncle' },
      { id: 'lg1.2', kind: 'open', before: 'Best-selling product:', after: '', accepted: ['(the) cinnamon rolls', '(the) cinnamon roll'], marking: 'comprehension', maxWords: 4, explanationPl: 'Najpopularniejsze są bułeczki cynamonowe, a nie chleb.', evidence: 'It\'s our cinnamon rolls' },
      { id: 'lg1.3', kind: 'open', before: 'Starts work at', after: 'a.m.', accepted: ['4', 'four', '4:00', '4.00', 'four o\'clock', '4 o\'clock'], marking: 'comprehension', maxWords: 3, explanationPl: 'Zaczyna pracę o czwartej rano. Liczby muszą być zapisane bezbłędnie.', evidence: 'I start work at four o\'clock in the morning' },
      { id: 'lg1.4', kind: 'open', before: 'Future plan: to open a', after: '', accepted: ['(small) café', '(small) cafe', '(small) coffee shop'], marking: 'comprehension', maxWords: 4, explanationPl: 'Chce otworzyć małą kawiarnię obok piekarni.', evidence: 'open a small café next to the bakery' },
    ],
  },
  {
    id: 'lg2', format: 'L_GAP', title: 'Summer camp', topic: 'education', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Usłyszysz dwukrotnie komunikat dyrektora obozu. Uzupełnij luki 1–4 w notatce, tak aby jak najbardziej precyzyjnie oddać sens nagrania. Luki uzupełnij w języku angielskim.',
    stimulus: {
      kind: 'audio',
      clips: [clip('lg2', 'Komunikat', [m('Director', 'Hello everyone and welcome to Sunny Lake Summer Camp. I\'m Daniel, the camp director. Just a few important things. Breakfast is served in the main building from half past seven to nine. English classes take place every morning, but on Wednesday there are no classes because we\'re going on a trip to the national park. Please bring comfortable shoes and a raincoat for that day. If you have any problems, you can find me in the office next to the swimming pool. And remember – mobile phones are allowed only in the evening, between seven and nine.')])],
    },
    items: [
      { id: 'lg2.1', kind: 'open', before: 'Breakfast ends at', after: '.', accepted: ['9', 'nine', '9:00', '9.00', '9 a.m.', '9 am', 'nine o\'clock', '9 o\'clock'], marking: 'comprehension', maxWords: 3, explanationPl: 'Śniadanie trwa od 7:30 do 9:00.', evidence: 'from half past seven to nine' },
      { id: 'lg2.2', kind: 'open', before: 'Wednesday: trip to the', after: '', accepted: ['national park'], marking: 'comprehension', maxWords: 3, explanationPl: 'W środę nie ma zajęć – wycieczka do parku narodowego.', evidence: 'a trip to the national park' },
      { id: 'lg2.3', kind: 'open', before: 'Director\'s office is next to the', after: '', accepted: ['(swimming) pool'], marking: 'comprehension', maxWords: 3, explanationPl: 'Biuro dyrektora znajduje się obok basenu.', evidence: 'the office next to the swimming pool' },
      { id: 'lg2.4', kind: 'open', before: 'Phones allowed only in the', after: '', accepted: ['evening', 'evenings'], marking: 'comprehension', maxWords: 2, explanationPl: 'Telefony wolno używać tylko wieczorem, 19:00–21:00.', evidence: 'mobile phones are allowed only in the evening' },
    ],
  },
];

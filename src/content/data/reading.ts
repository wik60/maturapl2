import type { TaskGroup } from '../types';
import { mc, opts, ORIGINAL } from './helpers';

const V = 1;

/* ------------------------------------------------------------------ */
/* Dobieranie tekstów do zdań (R_MATCH)                                  */
/* ------------------------------------------------------------------ */

export const readingMatchGroups: TaskGroup[] = [
  {
    id: 'rm1', format: 'R_MATCH', title: 'Places in town', topic: 'culture', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj teksty A–E o miejscach w mieście. Do każdego pytania (1–4) dopasuj właściwy tekst. Uwaga: jeden tekst został podany dodatkowo i nie pasuje do żadnego pytania.',
    stimulus: {
      kind: 'texts',
      texts: [
        { label: 'A', title: 'The Green Corner Café', body: 'Our café is run by students from the local catering school. All profits go to an animal shelter. We serve vegetarian dishes only, and every Friday evening there is live acoustic music.' },
        { label: 'B', title: 'City Library', body: 'Apart from lending books, we offer free computer courses for seniors every Tuesday. Teenagers can volunteer as tutors and receive a certificate after 20 hours of help.' },
        { label: 'C', title: 'Riverside Climbing Centre', body: 'Beginners are welcome! Equipment can be hired at reception. Children under 14 must be accompanied by an adult. Closed on Mondays for cleaning.' },
        { label: 'D', title: 'Old Town Cinema', body: 'Built in 1928, this is the oldest cinema in the city. Once a month we show classic black-and-white films with live piano music. Student tickets are half price on Wednesdays.' },
        { label: 'E', title: 'Makers\' Workshop', body: 'Bring your broken toaster, bike or lamp! Our volunteers will show you how to repair it yourself – for free. Tools are provided, but please book a place online first.' },
      ],
    },
    options: opts('The Green Corner Café', 'City Library', 'Riverside Climbing Centre', 'Old Town Cinema', 'Makers\' Workshop'),
    items: [
      { id: 'rm1.1', kind: 'match', prompt: 'In which place can you help other people and get a document confirming it?', answer: 'B', explanationPl: 'Nastolatki mogą uczyć seniorów i po 20 godzinach dostają certyfikat (dokument).', evidence: 'Teenagers can volunteer as tutors and receive a certificate' },
      { id: 'rm1.2', kind: 'match', prompt: 'In which place can you pay less on a particular day?', answer: 'D', explanationPl: 'W środy bilety studenckie są o połowę tańsze.', evidence: 'Student tickets are half price on Wednesdays.' },
      { id: 'rm1.3', kind: 'match', prompt: 'In which place can you eat something and support a good cause at the same time?', answer: 'A', explanationPl: 'Cały zysk kawiarni idzie na schronisko – jedząc, wspierasz zwierzęta.', evidence: 'All profits go to an animal shelter.' },
      { id: 'rm1.4', kind: 'match', prompt: 'In which place can you learn to fix things you own?', answer: 'E', explanationPl: 'Wolontariusze pokazują, jak samemu naprawić zepsute rzeczy.', evidence: 'show you how to repair it yourself' },
    ],
  },
  {
    id: 'rm2', format: 'R_MATCH', title: 'How I relax', topic: 'private-life', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj wypowiedzi pięciu osób (A–E). Do każdego zdania (1–4) dopasuj właściwą osobę. Uwaga: jedna wypowiedź została podana dodatkowo i nie pasuje do żadnego zdania.',
    stimulus: {
      kind: 'texts',
      texts: [
        { label: 'A', title: 'Marta', body: 'After a long day at school, I put on my headphones and go for a run in the forest near my house. I don\'t care about speed – I just enjoy the silence and the smell of the trees. Running in a group isn\'t for me.' },
        { label: 'B', title: 'Kuba', body: 'I relax by cooking. My dad taught me some basic recipes when I was ten, and now I make dinner for the whole family on Sundays. Last month I even won a cooking competition at school.' },
        { label: 'C', title: 'Ola', body: 'My grandma gave me her old sewing machine, and I started making my own clothes. At first everything looked terrible, but I watched online tutorials and practised a lot. Now my friends ask me to make things for them.' },
        { label: 'D', title: 'Tomek', body: 'I\'m not very active, I admit. I relax by playing chess online with people from all over the world. I\'ve made friends with a boy from Brazil – we chat in English while we play.' },
        { label: 'E', title: 'Zosia', body: 'Gardening is my thing. I grow tomatoes and herbs on our balcony. It\'s amazing to eat something you\'ve grown yourself. I\'m planning to try strawberries next spring.' },
      ],
    },
    options: opts('Marta', 'Kuba', 'Ola', 'Tomek', 'Zosia'),
    items: [
      { id: 'rm2.1', kind: 'match', prompt: 'This person prefers to do their hobby alone.', answer: 'A', explanationPl: 'Marta biega sama – bieganie w grupie „nie jest dla niej”.', evidence: 'Running in a group isn\'t for me.' },
      { id: 'rm2.2', kind: 'match', prompt: 'This person uses a gift from a family member.', answer: 'C', explanationPl: 'Ola szyje na maszynie, którą dostała od babci.', evidence: 'My grandma gave me her old sewing machine' },
      { id: 'rm2.3', kind: 'match', prompt: 'This person practises a foreign language thanks to their hobby.', answer: 'D', explanationPl: 'Tomek rozmawia po angielsku z kolegą z Brazylii podczas gry.', evidence: 'we chat in English while we play' },
      { id: 'rm2.4', kind: 'match', prompt: 'This person has been rewarded for their hobby.', answer: 'B', explanationPl: 'Kuba wygrał szkolny konkurs kulinarny.', evidence: 'I even won a cooking competition at school', distractorNotes: { C: 'Znajomi proszą Olę o ubrania, ale nie ma mowy o nagrodzie.' } },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Kilka tekstów: zamknięte + uzupełnianie wiadomości (R_MULTI)          */
/* ------------------------------------------------------------------ */

export const readingMultiGroups: TaskGroup[] = [
  {
    id: 'rmu1', format: 'R_MULTI', title: 'A weekend in Sopot', topic: 'travel', difficulty: 3, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj teksty 1–3. W zadaniach 1–3 wybierz odpowiedź zgodną z treścią tekstu. Następnie uzupełnij luki 4–7 w wiadomości Oli, tak aby jak najbardziej precyzyjnie oddać sens tekstów. Luki uzupełnij w języku angielskim.',
    stimulus: {
      kind: 'texts',
      texts: [
        { label: 'Tekst 1', title: 'PINE TREE HOSTEL, Sopot', body: '• 5 minutes\' walk from the beach\n• Dormitory beds from 60 zł per night, private rooms from 150 zł\n• Breakfast included; free kitchen for guests\n• Reception open 8:00–22:00. Arriving later? Call us and collect your key from the key box.\n• No parties after 23:00' },
        { label: 'Tekst 2', title: 'BALTIC BIKES – rent a bike, discover the coast!', body: 'Prices: 15 zł per hour / 50 zł per day. Students get 20% off with a valid ID.\nHelmets free of charge. Bikes must be returned by 20:00 – late returns cost 10 zł per hour.\nWe are next to the railway station, opposite the post office.' },
        { label: 'Tekst 3', title: 'Message from Kasia', body: 'Hi Ola! Great news – my mum says I can come to Sopot with you! The only problem is that my train arrives at 23:15, so I\'ll be late. Also, I\'m a bit short of money this month, so let\'s choose the cheapest beds. Could we rent bikes on Saturday? I\'ve always wanted to cycle to Gdańsk along the coast. K.' },
        { label: 'Wiadomość Oli', title: 'Ola\'s reply', body: 'Hi Kasia,\nFantastic! Don\'t worry about the late train – we can phone the hostel and take the key from the [[4]]. I\'ve booked two beds in a [[5]] because it\'s the cheapest option. Breakfast is [[6]], so we\'ll save some money. As for the bikes – bring your student ID, because then we\'ll get [[7]] off.\nOla' },
      ],
    },
    items: [
      mc('rmu1.1', '(Tekst 1) Guests of the hostel can', ['cook their own meals.', 'have dinner included in the price.', 'stay at the reception all night.'], 'A',
        'Hostel oferuje darmową kuchnię dla gości.', { evidence: 'free kitchen for guests' }),
      mc('rmu1.2', '(Tekst 2) The text informs that Baltic Bikes', ['is open 24 hours.', 'charges extra for helmets.', 'is located near public transport.'], 'C',
        'Wypożyczalnia jest obok dworca kolejowego.', { evidence: 'We are next to the railway station', distractorNotes: { B: 'Kaski są bezpłatne (free of charge).' } }),
      mc('rmu1.3', '(Tekst 3) Kasia\'s main purpose is to', ['cancel the trip.', 'tell Ola that she can join her.', 'ask Ola to pay for her ticket.'], 'B',
        'Najważniejsza informacja: mama pozwoliła jej jechać.', { evidence: 'my mum says I can come to Sopot with you' }),
      { id: 'rmu1.4', kind: 'open', accepted: ['key box', 'keybox', 'box'], marking: 'comprehension', maxWords: 3, explanationPl: 'Po 22:00 klucz odbiera się ze skrytki na klucze (key box).', evidence: 'collect your key from the key box' },
      { id: 'rmu1.5', kind: 'open', accepted: ['dormitory', 'dorm', 'dormitory room'], marking: 'comprehension', maxWords: 3, explanationPl: 'Najtańsze są łóżka w sali wieloosobowej (dormitory) – od 60 zł.', evidence: 'Dormitory beds from 60 zł' },
      { id: 'rmu1.6', kind: 'open', accepted: ['included', 'free', 'included in the price'], marking: 'comprehension', maxWords: 4, explanationPl: 'Śniadanie jest wliczone w cenę.', evidence: 'Breakfast included' },
      { id: 'rmu1.7', kind: 'open', accepted: ['20%', '20 %', '20 percent', '20 per cent', 'twenty percent', 'twenty per cent'], marking: 'comprehension', maxWords: 3, explanationPl: 'Studenci z legitymacją mają 20% zniżki.', evidence: 'Students get 20% off with a valid ID' },
    ],
  },
  {
    id: 'rmu2', format: 'R_MULTI', title: 'A summer job', topic: 'work', difficulty: 3, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj teksty 1–3. W zadaniach 1–3 wybierz odpowiedź zgodną z treścią tekstu. Następnie uzupełnij luki 4–7 w wiadomości Filipa, tak aby jak najbardziej precyzyjnie oddać sens tekstów. Luki uzupełnij w języku angielskim.',
    stimulus: {
      kind: 'texts',
      texts: [
        { label: 'Tekst 1', title: 'ICE CREAM SELLER WANTED – Coral Beach Kiosk', body: 'July–August, 4 days a week, 10:00–16:00. No experience needed – we will train you. You must be 16 or older. Pay: 28 zł per hour + tips. Apply by email by 15 June. Please attach a short CV.' },
        { label: 'Tekst 2', title: 'ZOO HELPER – summer volunteering', body: 'Help our keepers feed animals and talk to visitors about endangered species. Mornings only, 8:00–12:00. Unpaid, but you get a free lunch and a reference letter. Minimum two weeks. You must like early mornings and not be afraid of getting dirty!' },
        { label: 'Tekst 3', title: 'A note from Mum', body: 'Filip, I saw the zoo advert you left on the table. I know you love animals, but remember you wanted to save money for the trip to Croatia in September. Maybe you could do both if the hours don\'t overlap? Let\'s talk tonight. Mum' },
        { label: 'Wiadomość Filipa', title: 'Filip\'s message to Adam', body: 'Hi Adam,\nI\'ve decided to apply for the job at the beach kiosk. It\'s paid – 28 zł an hour plus [[4]]. Unfortunately, I can\'t volunteer at the zoo as well, because both jobs take place in the [[5]]. I have to send my application before [[6]], together with my [[7]].\nFilip' },
      ],
    },
    items: [
      mc('rmu2.1', '(Tekst 1) What is true about the kiosk job?', ['You need previous experience.', 'You will be trained.', 'You work every day.'], 'B',
        'Doświadczenie nie jest potrzebne – pracodawca przeszkoli.', { evidence: 'No experience needed – we will train you.' }),
      mc('rmu2.2', '(Tekst 2) Volunteers at the zoo', ['receive a small salary.', 'work in the afternoons.', 'get something to eat.'], 'C',
        'Wolontariusze dostają darmowy lunch.', { evidence: 'you get a free lunch', distractorNotes: { A: '„Unpaid” – bez wynagrodzenia.' } }),
      mc('rmu2.3', '(Tekst 3) Filip\'s mum suggests that he', ['should not apply for the zoo job.', 'might be able to do two summer jobs.', 'should go to Croatia in July.'], 'B',
        'Mama sugeruje, że może da się pogodzić obie prace, jeśli godziny się nie pokrywają.', { evidence: 'Maybe you could do both' }),
      { id: 'rmu2.4', kind: 'open', accepted: ['tips', 'tip'], marking: 'comprehension', maxWords: 2, explanationPl: 'Oprócz stawki godzinowej są napiwki.', evidence: '28 zł per hour + tips' },
      { id: 'rmu2.5', kind: 'open', accepted: ['morning', 'mornings', '(the) same hours'], marking: 'comprehension', maxWords: 3, explanationPl: 'Zoo 8:00–12:00, kiosk od 10:00 – obie prace obejmują przedpołudnie, więc godziny się pokrywają.', evidence: 'Mornings only, 8:00–12:00 / 10:00–16:00' },
      { id: 'rmu2.6', kind: 'open', accepted: ['15 June', '15th June', 'June 15', 'June 15th', '(the) 15th of June', '15.06', '15/06', '15th of June'], marking: 'comprehension', maxWords: 4, explanationPl: 'Zgłoszenia przyjmowane są do 15 czerwca.', evidence: 'Apply by email by 15 June.' },
      { id: 'rmu2.7', kind: 'open', accepted: ['CV', '(short) CV', 'C.V.', '(short) résumé', '(short) resume'], marking: 'comprehension', maxWords: 3, explanationPl: 'Do maila należy dołączyć krótkie CV.', evidence: 'Please attach a short CV.' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Wybór wielokrotny (R_MC)                                             */
/* ------------------------------------------------------------------ */

export const readingMcGroups: TaskGroup[] = [
  {
    id: 'rmc1', format: 'R_MC', title: 'The town that switched off its screens', topic: 'technology', difficulty: 3, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj tekst. W zadaniach 1–5 z podanych odpowiedzi wybierz właściwą, zgodną z treścią tekstu.',
    stimulus: {
      kind: 'text', title: 'The town that switched off its screens',
      body: 'Last spring, the small Welsh town of Llanberis tried an unusual experiment. For one week, families agreed to switch off all screens – televisions, computers and smartphones – after six o\'clock in the evening. The idea came from a local teacher, Gwen Hughes, who had noticed that her students were often too tired to concentrate in the morning.\n\nAt first, not everyone was enthusiastic. "My son told me it would be the worst week of his life," laughs Rhys Evans, a father of two. "On the first evening he just lay on the sofa and complained." By the third day, however, things began to change. Families started playing board games, cooking together and going for walks. The town\'s library, which usually closes early because it has so few visitors, stayed open until nine to cope with the number of people who wanted to borrow books.\n\nNot everything went smoothly. Some parents who work from home found it impossible to follow the rules, and several teenagers admitted that they had secretly checked their phones under the blanket. Still, when the week was over, a survey showed that most participants were sleeping better and felt less stressed.\n\nGwen Hughes does not want to ban technology. "Screens are part of modern life," she says. "The point was to show people that they have a choice." The town now organises a screen-free evening every Friday, and this time nobody is forced to take part.',
      source: 'Tekst autorski (fikcyjne osoby i wydarzenie).',
    },
    items: [
      mc('rmc1.1', 'Gwen Hughes started the experiment because', ['her students were too tired to learn properly.', 'she wanted to promote the local library.', 'parents complained about their children\'s phones.'], 'A',
        'Nauczycielka zauważyła, że uczniowie rano są zbyt zmęczeni, by się skupić.', { tag: 'specific-info', evidence: 'her students were often too tired to concentrate in the morning' }),
      mc('rmc1.2', 'What does Rhys Evans say about his son?', ['He enjoyed the experiment from the very beginning.', 'He found the first day difficult.', 'He refused to take part.'], 'B',
        'Pierwszego wieczoru syn tylko leżał na kanapie i narzekał.', { tag: 'specific-info', evidence: 'On the first evening he just lay on the sofa and complained.' }),
      mc('rmc1.3', 'The library stayed open longer because', ['it was the only place with free internet.', 'more people than usual came to borrow books.', 'it organised board games.'], 'B',
        'Biblioteka zwykle zamyka się wcześnie, ale tym razem musiała obsłużyć wielu chętnych.', { tag: 'inference', evidence: 'to cope with the number of people who wanted to borrow books' }),
      mc('rmc1.4', 'The third paragraph is mainly about', ['problems some people had during the experiment.', 'the results of the survey.', 'reasons why parents work from home.'], 'A',
        'Akapit zaczyna się od „Not everything went smoothly” i opisuje trudności; ankieta to tylko ostatnie zdanie.', { tag: 'main-idea', evidence: 'Not everything went smoothly.' }),
      mc('rmc1.5', 'What is true about the screen-free evenings now?', ['They take place every day.', 'Participation is voluntary.', 'Technology is banned in the town.'], 'B',
        'Teraz nikt nie jest zmuszany do udziału – udział jest dobrowolny.', { tag: 'specific-info', evidence: 'this time nobody is forced to take part' }),
    ],
  },
  {
    id: 'rmc2', format: 'R_MC', title: 'Short texts', topic: 'everyday', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj teksty 1–5. W każdym zadaniu z podanych odpowiedzi wybierz właściwą, zgodną z treścią tekstu.',
    stimulus: { kind: 'none' },
    items: [
      mc('rmc2.1', 'What does the notice inform about?', ['The pool will close for two months.', 'Some facilities will be temporarily unavailable.', 'Ticket prices will change.'], 'B',
        'Sauna będzie zamknięta do końca kwietnia (tymczasowo), a basen otworzy się później – basen nie zostanie zamknięty.',
        { tag: 'main-idea', evidence: 'the sauna will be closed until the end of April', text: { title: 'SWIMMING POOL – changes from 1 March', body: 'Because of repairs, the sauna will be closed until the end of April. The pool will open one hour later on weekdays (7:00 instead of 6:00). We are sorry for any inconvenience.' } }),
      mc('rmc2.2', 'Sara wrote the message to', ['apologise for missing the meeting completely.', 'ask Mike to do something for her.', 'tell Mike about her accident.'], 'B',
        'Sara prosi Mike\'a, by zaczął spotkanie i wydrukował raporty. Spóźni się, ale dołączy; to nie ona miała wypadek.',
        { tag: 'intention', evidence: 'Could you also print the reports?', text: { title: 'Text message', body: 'Hey Mike, I\'m stuck in traffic – there\'s been an accident on the bridge. Start the meeting without me and I\'ll join as soon as I can. Could you also print the reports? They\'re on my desk. Thanks, Sara' } }),
      mc('rmc2.3', 'The advert is for people who', ['want to buy a guitar.', 'already play the guitar well.', 'might not have their own instrument.'], 'C',
        'Instrumenty są dostępne na miejscu – nie trzeba kupować własnego.',
        { tag: 'specific-info', evidence: 'Instruments available – no need to buy your own.', text: { title: 'Advertisement', body: 'Learn to play the guitar in 10 weeks! Small groups (max. 5 people). First lesson free. Instruments available – no need to buy your own. Call Mark: 601 234 567.' } }),
      mc('rmc2.4', 'What is surprising about the writer?', ['She has decided to live with a dog.', 'She has started working with animals.', 'She was attacked by a dog last year.'], 'A',
        'Zawsze bała się psów, a mimo to adoptowała szczeniaka.',
        { tag: 'inference', evidence: 'I\'d adopted a puppy', text: { title: 'Blog post', body: 'I\'ve always been afraid of dogs. When I was six, a big dog jumped on me in the park. So you can imagine how my friends reacted when I told them I\'d adopted a puppy! It was my therapist\'s idea, and honestly, it\'s working. Bruno is tiny and very gentle.' } }),
      mc('rmc2.5', 'The shop wants Mr Nowak to', ['pay more for a different backpack.', 'make a decision.', 'return the backpack.'], 'B',
        'Sklep prosi o wybór jednej z opcji – inny kolor albo zwrot pieniędzy.',
        { tag: 'intention', evidence: 'Please let us know which option you prefer.', text: { title: 'Email', body: 'Dear Mr Nowak,\nThank you for your order. Unfortunately, the blue model of the backpack is no longer available. We can send you the same backpack in green or black at the same price, or return your money. Please let us know which option you prefer.\nBest regards,\nShop Team' } }),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Luki zdaniowe (R_SENTENCE_GAP)                                       */
/* ------------------------------------------------------------------ */

export const readingSentenceGapGroups: TaskGroup[] = [
  {
    id: 'rsg1', format: 'R_SENTENCE_GAP', title: 'The boy who built a school library', topic: 'education', difficulty: 3, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj tekst, z którego usunięto cztery zdania. Wpisz w każdą lukę (1–4) literę, którą oznaczono brakujące zdanie (A–E). Uwaga: jedno zdanie zostało podane dodatkowo i nie pasuje do żadnej luki.',
    stimulus: {
      kind: 'text', title: 'THE BOY WHO BUILT A SCHOOL LIBRARY',
      body: 'When Jakub was fourteen, he noticed that the library at his village school was almost empty. [[1]] Most of them were older than his parents. Jakub decided to do something about it. He wrote a post on social media asking people to donate books they no longer needed. [[2]] Within a month, however, he had received more than two thousand books from all over Poland. The next problem was space. The library room was too small for so many books. [[3]] They painted the walls, built new shelves and even made comfortable reading corners. Today the library is the most popular room in the school. [[4]] "I just wanted my friends to read more," says Jakub. "I never expected it to become so big."',
    },
    options: opts(
      'The few books it had were old and boring.',
      'He didn\'t expect many people to answer.',
      'So Jakub\'s father and some neighbours offered to help.',
      'Students now borrow about three times more books than before.',
      'Unfortunately, the school director didn\'t like the idea.',
    ),
    items: [
      { id: 'rsg1.1', kind: 'match', prompt: 'Luka 1', answer: 'A', explanationPl: '„Most of them were older than his parents” – „them” odnosi się do książek z zdania A.', evidence: 'Most of them were older…' },
      { id: 'rsg1.2', kind: 'match', prompt: 'Luka 2', answer: 'B', explanationPl: 'Kontrast: nie spodziewał się odzewu, „however” w kolejnym zdaniu pokazuje, że odzew był ogromny.', evidence: 'Within a month, however…' },
      { id: 'rsg1.3', kind: 'match', prompt: 'Luka 3', answer: 'C', explanationPl: '„They painted the walls” – „they” to ojciec i sąsiedzi ze zdania C.', evidence: 'They painted the walls…' },
      { id: 'rsg1.4', kind: 'match', prompt: 'Luka 4', answer: 'D', explanationPl: 'Zdanie D rozwija informację o popularności biblioteki.', evidence: 'the most popular room in the school' },
    ],
  },
  {
    id: 'rsg2', format: 'R_SENTENCE_GAP', title: 'A surprising hobby', topic: 'people', difficulty: 2, source: ORIGINAL, contentVersion: V,
    instructionPl: 'Przeczytaj tekst, z którego usunięto cztery zdania. Wpisz w każdą lukę (1–4) literę, którą oznaczono brakujące zdanie (A–E). Uwaga: jedno zdanie zostało podane dodatkowo i nie pasuje do żadnej luki.',
    stimulus: {
      kind: 'text', title: 'A SURPRISING HOBBY',
      body: 'My grandmother, Irena, is seventy-two, and last year she started skateboarding. [[1]] She was watching my little brother at the skatepark and decided she wanted to try it too. At first, our family was worried. [[2]] But Grandma just bought a helmet, knee pads and a board, and went to the park every morning. The teenagers there were surprised to see her, but they quickly became her friends. [[3]] In return, she bakes cakes for them every Sunday. Now Grandma has her own social media account with thousands of followers. [[4]] "Age is just a number," she always says.',
    },
    options: opts(
      'It all started by accident.',
      'Mum was afraid she would break a leg.',
      'They showed her how to do simple tricks.',
      'Many older people write to her saying she has inspired them.',
      'She had always been a professional athlete.',
    ),
    items: [
      { id: 'rsg2.1', kind: 'match', prompt: 'Luka 1', answer: 'A', explanationPl: 'Następne zdanie opisuje przypadkowy początek – oglądała brata na skateparku.', evidence: 'She was watching my little brother…' },
      { id: 'rsg2.2', kind: 'match', prompt: 'Luka 2', answer: 'B', explanationPl: 'Zdanie B konkretyzuje obawy rodziny („our family was worried”).', evidence: 'our family was worried' },
      { id: 'rsg2.3', kind: 'match', prompt: 'Luka 3', answer: 'C', explanationPl: '„In return” – w zamian za pomoc nastolatków (zdanie C) babcia piecze ciasta.', evidence: 'In return, she bakes cakes…' },
      { id: 'rsg2.4', kind: 'match', prompt: 'Luka 4', answer: 'D', explanationPl: 'Zdanie D dotyczy obserwujących z mediów społecznościowych.', evidence: 'thousands of followers', distractorNotes: { E: 'Zaprzecza treści – babcia dopiero zaczęła jeździć.' } },
    ],
  },
];

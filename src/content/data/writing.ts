import type { WritingPrompt } from '../types';
import { ORIGINAL } from './helpers';

const V = 1;

export const writingPrompts: WritingPrompt[] = [
  {
    id: 'wp1', format: 'W_EMAIL', topic: 'travel', difficulty: 2, source: ORIGINAL, contentVersion: V,
    situationPl: 'Wróciłeś/Wróciłaś z wycieczki szkolnej. W e-mailu do kolegi z Irlandii:',
    points: [
      { id: 'p1', textPl: 'napisz, dokąd pojechałeś/pojechałaś i dlaczego wybrano to miejsce', cues: ['went', 'go to', 'travelled', 'visited', 'trip to', 'chose', 'choose', 'because', 'decided'], pastTense: true },
      { id: 'p2', textPl: 'opisz największą atrakcję wycieczki', cues: ['best', 'the most', 'highlight', 'attraction', 'amazing', 'favourite', 'impressed', 'loved', 'enjoyed'] },
      { id: 'p3', textPl: 'przedstaw sytuację, która Cię zaskoczyła', cues: ['surpris', 'unexpected', 'suddenly', 'couldn\'t believe', 'shock', 'strange', 'didn\'t expect'], pastTense: true },
      { id: 'p4', textPl: 'zaproponuj wspólny wyjazd w to miejsce i zapytaj o dogodny termin', cues: ['together', 'with me', 'why don\'t you', 'how about', 'would you like', 'when', 'visit', 'come'] },
    ],
    opening: 'Hi Liam,\nI\'ve just come back from a school trip and I have to tell you about it!',
    modelAnswer: 'Last week our class went to Wrocław for three days. Our teacher chose this city because we are studying Polish history and Wrocław has many interesting museums.\nThe best part of the trip was the Panorama Racławicka, a huge painting which shows a famous battle. It was so realistic that I felt like I was standing on the battlefield. I also loved looking for the little bronze dwarfs all over the Old Town.\nSomething surprising happened on the second day. We were having lunch in a small restaurant when a famous footballer came in and sat at the next table! He even took a photo with us.\nWhy don\'t you come to Poland next summer? We could visit Wrocław together. When would be the best time for you – July or August?\nWrite back soon!\nXYZ',
    usefulPhrases: ['Last week we went to…', 'The best part was…', 'It was so … that…', 'Something surprising happened…', 'Why don\'t you come…?', 'When would be the best time for you?'],
  },
  {
    id: 'wp2', format: 'W_EMAIL', topic: 'private-life', difficulty: 2, source: ORIGINAL, contentVersion: V,
    situationPl: 'Zapisałeś/Zapisałaś się na kurs. W e-mailu do koleżanki z Kanady:',
    points: [
      { id: 'p1', textPl: 'napisz, na jaki kurs się zapisałeś/zapisałaś i dlaczego', cues: ['course', 'signed up', 'joined', 'classes', 'lessons', 'because', 'always wanted'] },
      { id: 'p2', textPl: 'opisz osobę prowadzącą zajęcia', cues: ['teacher', 'instructor', 'trainer', 'he is', 'she is', 'he\'s', 'she\'s', 'his', 'her'] },
      { id: 'p3', textPl: 'opisz trudność, którą napotkałeś/napotkałaś na pierwszych zajęciach', cues: ['difficult', 'problem', 'hard', 'couldn\'t', 'first lesson', 'first class', 'mistake', 'embarrass'], pastTense: true },
      { id: 'p4', textPl: 'poproś koleżankę o radę związaną z tym zajęciem', cues: ['advice', 'advise', 'what should i', 'do you think', 'could you', 'any tips', 'recommend', 'help me'] },
    ],
    opening: 'Hi Emma,\nGuess what? I\'ve signed up for a course!',
    modelAnswer: 'It\'s a photography course at our local culture centre. I\'ve always loved taking pictures with my phone, but I wanted to learn how to use a real camera.\nOur instructor, Mr Kowalski, is a professional photographer who has worked for travel magazines. He\'s about forty, very patient and has a great sense of humour, so the lessons are never boring.\nThe first class was quite difficult for me. We had to take portraits of each other, but I didn\'t know how to change the settings, and all my photos were too dark. I felt a bit embarrassed because everyone else seemed to know what to do.\nYou\'ve been taking photos for years, so could you give me some advice? What camera should I buy if I don\'t have much money?\nTake care,\nXYZ',
    usefulPhrases: ['I\'ve signed up for…', 'I\'ve always wanted to…', 'Our instructor is…', 'The first lesson was quite difficult because…', 'Could you give me some advice?', 'What should I…?'],
  },
  {
    id: 'wp3', format: 'W_BLOG', topic: 'society', difficulty: 3, source: ORIGINAL, contentVersion: V,
    situationPl: 'Zorganizowałeś/Zorganizowałaś w szkole akcję charytatywną. Na swoim blogu:',
    points: [
      { id: 'p1', textPl: 'napisz, jaką akcję zorganizowałeś/zorganizowałaś i dlaczego', cues: ['organised', 'organized', 'charity', 'collected', 'raise money', 'raised', 'because', 'decided', 'event'], pastTense: true },
      { id: 'p2', textPl: 'opisz, kto Ci pomagał i w jaki sposób', cues: ['help', 'friends', 'teacher', 'classmates', 'parents', 'together', 'made', 'prepared'], pastTense: true },
      { id: 'p3', textPl: 'opisz problem, który pojawił się podczas akcji, i sposób jego rozwiązania', cues: ['problem', 'unfortunately', 'went wrong', 'suddenly', 'forgot', 'broke', 'solved', 'luckily', 'fortunately'], pastTense: true },
      { id: 'p4', textPl: 'zachęć czytelników do podobnej inicjatywy i udziel im rady', cues: ['you should', 'why don\'t you', 'try', 'remember', 'advice', 'don\'t be afraid', 'i recommend', 'make sure'] },
    ],
    opening: 'Hi everyone!\nLast week something really special happened at my school.',
    modelAnswer: 'I organised a charity cake sale to raise money for the animal shelter in our town. I decided to do it because I adopted my dog from there and I know how much they need help.\nMy friends from class 2B baked over fifty cakes and cookies, and our English teacher let us use her classroom. My parents printed colourful posters, which we put up all over the school.\nUnfortunately, on the morning of the sale it turned out that we had no change for the customers. Luckily, the school secretary saved the day – she swapped some notes for coins, so we could start on time.\nIn the end we collected 1,200 zloty! If you want to help others, you should try something similar. Start with a small event and ask your friends for help – it\'s easier than you think.',
    usefulPhrases: ['I organised… to raise money for…', 'I decided to do it because…', '… helped me by…', 'Unfortunately, it turned out that…', 'Luckily, …', 'You should definitely try…'],
  },
  {
    id: 'wp4', format: 'W_BLOG', topic: 'technology', difficulty: 3, source: ORIGINAL, contentVersion: V,
    situationPl: 'Spędziłeś/Spędziłaś tydzień bez mediów społecznościowych. Na swoim blogu:',
    points: [
      { id: 'p1', textPl: 'wyjaśnij, dlaczego podjąłeś/podjęłaś to wyzwanie', cues: ['decided', 'because', 'reason', 'wanted to', 'realised', 'realized', 'challenge', 'too much time'], pastTense: true },
      { id: 'p2', textPl: 'opisz, jak spędzałeś/spędzałaś wolny czas', cues: ['free time', 'read', 'went', 'played', 'met', 'spent', 'instead', 'walk'], pastTense: true },
      { id: 'p3', textPl: 'napisz, co było dla Ciebie najtrudniejsze', cues: ['hardest', 'most difficult', 'difficult', 'hard', 'missed', 'bored', 'wanted to check'], pastTense: true },
      { id: 'p4', textPl: 'napisz, czy zamierzasz to powtórzyć, i uzasadnij swoją decyzję', cues: ['again', 'repeat', 'next', 'going to', 'will', 'plan', 'definitely', 'probably'] },
    ],
    opening: 'Hello, readers!\nI\'ve just finished a week without social media.',
    modelAnswer: 'I decided to take this challenge because I realised I was spending almost five hours a day scrolling through videos. My grades were getting worse and I was always tired.\nInstead of looking at my phone, I spent my free time reading and going for long walks with my dog. I also met my friends in real life – we played board games and cooked pizza together.\nThe hardest thing was the evenings. I was used to checking my phone in bed, so for the first few nights I couldn\'t fall asleep. I also missed some funny posts my friends were talking about.\nWill I do it again? Definitely! I\'m going to have one day without social media every week, because I felt calmer and I finally had time for things I enjoy.',
    usefulPhrases: ['I decided to… because I realised…', 'Instead of…, I…', 'The hardest thing was…', 'I was used to…', 'I\'m going to…', 'because I felt…'],
  },
  {
    id: 'wp5', format: 'W_FORUM', topic: 'travel', difficulty: 2, source: ORIGINAL, contentVersion: V,
    situationPl: 'Na forum dla młodzieży ktoś pyta o pomysły na tanie wakacje. W swoim wpisie:',
    points: [
      { id: 'p1', textPl: 'opisz swoje najlepsze tanie wakacje', cues: ['holiday', 'went', 'stayed', 'spent', 'last summer', 'camping', 'trip'], pastTense: true },
      { id: 'p2', textPl: 'napisz, jak zaoszczędziłeś/zaoszczędziłaś na nich pieniądze', cues: ['save', 'saved', 'cheap', 'money', 'instead of', 'cooked', 'for free', 'didn\'t pay', 'discount'], pastTense: true },
      { id: 'p3', textPl: 'ostrzeż przed problemem, który może się pojawić', cues: ['careful', 'be careful', 'remember', 'problem', 'warn', 'watch out', 'might', 'can be', 'don\'t forget'] },
      { id: 'p4', textPl: 'poleć konkretne miejsce i uzasadnij swój wybór', cues: ['recommend', 'should go', 'should visit', 'try', 'best place', 'because', 'worth'] },
    ],
    opening: 'Hi! I saw your question about cheap holidays and I\'d like to share my experience.',
    modelAnswer: 'Last summer my friends and I went camping in the Bieszczady Mountains for ten days. We slept in tents, swam in Lake Solina and walked in the mountains every day.\nWe saved a lot of money because we travelled by night train with student discounts. We also cooked our own meals on a small gas stove instead of eating in restaurants, so we spent only about 600 zloty each.\nHowever, be careful with the weather. It can change very quickly in the mountains, and one night our tent got completely wet in a storm. Remember to take a good raincoat and warm clothes.\nI\'d really recommend Bieszczady to anyone who loves nature. It\'s quiet, not very crowded and the views are breathtaking. Have a great holiday!',
    usefulPhrases: ['Last summer we went…', 'We saved money by…', 'instead of…', 'Be careful with…', 'Remember to…', 'I\'d really recommend… because…'],
  },
  {
    id: 'wp6', format: 'W_FORUM', topic: 'education', difficulty: 3, source: ORIGINAL, contentVersion: V,
    situationPl: 'Na forum szkolnym trwa dyskusja o zakazie używania telefonów w szkole. W swoim wpisie:',
    points: [
      { id: 'p1', textPl: 'przedstaw swoją opinię na temat zakazu i ją uzasadnij', cues: ['i think', 'in my opinion', 'i believe', 'i agree', 'i disagree', 'i don\'t think', 'because', 'ban'] },
      { id: 'p2', textPl: 'opisz sytuację, w której telefon pomógł Ci lub przeszkodził w szkole', cues: ['once', 'last', 'when i', 'helped', 'rang', 'during', 'lesson', 'remember'], pastTense: true },
      { id: 'p3', textPl: 'zaproponuj zasadę korzystania z telefonów w szkole', cues: ['rule', 'should', 'could', 'suggest', 'allowed', 'only', 'break', 'maybe'] },
      { id: 'p4', textPl: 'zapytaj innych użytkowników o ich doświadczenia', cues: ['what about you', 'have you', 'do you', 'what do you think', 'how about you', '?'] },
    ],
    opening: 'Hi everyone,\nI\'ve been reading this discussion about banning phones at school.',
    modelAnswer: 'In my opinion, a total ban is not a good idea. Phones can be really useful, for example when we need to check something quickly or contact our parents.\nI remember one situation last year. During a geography lesson, our teacher asked us to find information about volcanoes, and the school computers weren\'t working. Thanks to our phones, we could finish the project on time.\nOn the other hand, I agree that phones are a distraction during lessons. That\'s why I would suggest a simple rule: phones should stay in our bags during lessons, but we could use them during breaks and when the teacher allows it.\nWhat about you? Have you ever had a situation when a phone helped you or caused problems at school?',
    usefulPhrases: ['In my opinion…', 'I remember one situation…', 'Thanks to…', 'On the other hand…', 'I would suggest a simple rule:', 'What about you?'],
  },
];

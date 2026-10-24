import type { FormatId, FormatInfo } from './types';

const PP = 'Informator CKE od r. szk. 2024/2025 (PP) + zasady oceniania CKE, maj 2025';

export const FORMATS: Record<FormatId, FormatInfo> = {
  L_MATCH: {
    id: 'L_MATCH', section: 'listening', skill: 'listening', official: true,
    namePl: 'Słuchanie: dobieranie zdań do wypowiedzi',
    basis: `${PP}; zadanie zamknięte – dobieranie`, component: 'MatchExercise', validator: 'validateChoice',
  },
  L_MC: {
    id: 'L_MC', section: 'listening', skill: 'listening', official: true,
    namePl: 'Słuchanie: wybór wielokrotny',
    basis: `${PP}; zadanie zamknięte – wybór wielokrotny`, component: 'McExercise', validator: 'validateChoice',
  },
  L_GAP: {
    id: 'L_GAP', section: 'listening', skill: 'listening', official: true,
    namePl: 'Słuchanie: uzupełnianie notatki (zadanie otwarte)',
    basis: `${PP}; zadanie otwarte – luki / odpowiedzi na pytania`, component: 'OpenExercise', validator: 'validateOpen(comprehension)',
  },
  R_MATCH: {
    id: 'R_MATCH', section: 'reading', skill: 'reading', official: true,
    namePl: 'Czytanie: dobieranie tekstów do zdań',
    basis: `${PP}; zadanie zamknięte – dobieranie`, component: 'MatchExercise', validator: 'validateChoice',
  },
  R_MULTI: {
    id: 'R_MULTI', section: 'reading', skill: 'reading', official: true,
    namePl: 'Czytanie: kilka tekstów – pytania zamknięte i uzupełnianie wiadomości',
    basis: `${PP}; wiązka z zadaniami zamkniętymi i otwartymi (por. zad. 5, maj 2025)`, component: 'MixedExercise', validator: 'validateChoice + validateOpen(comprehension)',
  },
  R_MC: {
    id: 'R_MC', section: 'reading', skill: 'reading', official: true,
    namePl: 'Czytanie: wybór wielokrotny',
    basis: `${PP}; zadanie zamknięte – wybór wielokrotny`, component: 'McExercise', validator: 'validateChoice',
  },
  R_SENTENCE_GAP: {
    id: 'R_SENTENCE_GAP', section: 'reading', skill: 'reading', official: true,
    namePl: 'Czytanie: luki zdaniowe w tekście',
    basis: `${PP}; dobieranie – rozpoznawanie związków między częściami tekstu`, component: 'MatchExercise', validator: 'validateChoice',
  },
  U_DIALOG_MC: {
    id: 'U_DIALOG_MC', section: 'language', skill: 'functions', official: true,
    namePl: 'Środki językowe: minidialogi (funkcje językowe)',
    basis: `${PP}; wybór wielokrotny – reagowanie w minidialogach`, component: 'McExercise', validator: 'validateChoice',
  },
  U_LEXICAL_SET: {
    id: 'U_LEXICAL_SET', section: 'language', skill: 'vocabulary', official: true,
    namePl: 'Środki językowe: jeden wyraz do dwóch zdań',
    basis: `${PP}; wybór wielokrotny (por. zad. 9, maj 2025)`, component: 'McExercise', validator: 'validateChoice',
  },
  U_TRANSLATION_MC: {
    id: 'U_TRANSLATION_MC', section: 'language', skill: 'grammar', official: true,
    namePl: 'Środki językowe: wybór poprawnego tłumaczenia',
    basis: `${PP}; wybór wielokrotny – przetwarzanie tekstu`, component: 'McExercise', validator: 'validateChoice',
  },
  U_GRAMMAR_MC: {
    id: 'U_GRAMMAR_MC', section: 'language', skill: 'grammar', official: true,
    namePl: 'Środki językowe: wybór wielokrotny w tekście',
    basis: `${PP}; zadanie zamknięte – wybór wielokrotny`, component: 'McExercise', validator: 'validateChoice',
  },
  U_OPEN_CLOZE: {
    id: 'U_OPEN_CLOZE', section: 'language', skill: 'grammar', official: true,
    namePl: 'Środki językowe: luki – jeden wyraz',
    basis: `${PP}; zadanie otwarte – zadanie z lukami (pełna poprawność)`, component: 'OpenExercise', validator: 'validateOpen(strict)',
  },
  U_TRANSFORM: {
    id: 'U_TRANSFORM', section: 'language', skill: 'grammar', official: true,
    namePl: 'Środki językowe: parafraza zdań z podanym wyrazem',
    basis: `${PP}; zadanie otwarte – parafraza (maks. 5 wyrazów)`, component: 'OpenExercise', validator: 'validateOpen(strict, maxWords)',
  },
  U_GRAMMATICALISE: {
    id: 'U_GRAMMATICALISE', section: 'language', skill: 'grammar', official: true,
    namePl: 'Środki językowe: układanie fragmentów zdań z podanych wyrazów',
    basis: `${PP}; zadanie otwarte – układanie fragmentów zdań`, component: 'OpenExercise', validator: 'validateOpen(strict)',
  },
  U_TRANSLATE_OPEN: {
    id: 'U_TRANSLATE_OPEN', section: 'language', skill: 'grammar', official: true,
    namePl: 'Środki językowe: tłumaczenie fragmentów zdań',
    basis: `${PP}; zadanie otwarte – tłumaczenie fragmentów zdań`, component: 'OpenExercise', validator: 'validateOpen(strict)',
  },
  W_EMAIL: {
    id: 'W_EMAIL', section: 'writing', skill: 'writing', official: true,
    namePl: 'Wypowiedź pisemna: e-mail',
    basis: `${PP}; tekst użytkowy, 4 podpunkty, 100–150 wyrazów, 0–12 pkt`, component: 'WritingExercise', validator: 'assessWriting',
  },
  W_BLOG: {
    id: 'W_BLOG', section: 'writing', skill: 'writing', official: true,
    namePl: 'Wypowiedź pisemna: wpis na blogu',
    basis: `${PP}; tekst użytkowy, 4 podpunkty, 100–150 wyrazów, 0–12 pkt`, component: 'WritingExercise', validator: 'assessWriting',
  },
  W_FORUM: {
    id: 'W_FORUM', section: 'writing', skill: 'writing', official: true,
    namePl: 'Wypowiedź pisemna: wpis na forum',
    basis: `${PP}; tekst użytkowy, 4 podpunkty, 100–150 wyrazów, 0–12 pkt`, component: 'WritingExercise', validator: 'assessWriting',
  },
  S_GRAMMAR_DRILL: {
    id: 'S_GRAMMAR_DRILL', section: 'supplementary', skill: 'grammar', official: false,
    namePl: 'Trening: gramatyka w zdaniach',
    basis: 'Ćwiczenie dodatkowe – nie jest osobnym typem zadania maturalnego', component: 'McExercise', validator: 'validateChoice',
  },
  S_SENTENCE_BUILD: {
    id: 'S_SENTENCE_BUILD', section: 'supplementary', skill: 'grammar', official: false,
    namePl: 'Trening: budowanie zdań z wyrazów',
    basis: 'Ćwiczenie dodatkowe – nie jest osobnym typem zadania maturalnego', component: 'SentenceBuildExercise', validator: 'validateOpen(strict)',
  },
};

export const SECTION_NAMES: Record<string, string> = {
  listening: 'Rozumienie ze słuchu',
  reading: 'Rozumienie tekstów pisanych',
  language: 'Znajomość środków językowych',
  writing: 'Wypowiedź pisemna',
  supplementary: 'Trening dodatkowy',
};

export const SKILL_NAMES: Record<string, string> = {
  listening: 'Słuchanie',
  reading: 'Czytanie',
  grammar: 'Gramatyka',
  vocabulary: 'Słownictwo',
  functions: 'Funkcje językowe',
  writing: 'Pisanie',
};

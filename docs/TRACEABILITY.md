# Macierz zgodności z formatem matury (poziom podstawowy)

Weryfikacja: październik 2026. Źródła:

- Informator o egzaminie maturalnym z języka angielskiego od roku szkolnego 2024/2025 (CKE)
- Zasady oceniania rozwiązań zadań, matura z języka angielskiego PP, maj 2025 (CKE)
- Sprawozdanie z egzaminu maturalnego 2025, język angielski (OKE w Krakowie)
- Struktura próbnej matury 2026 (Macmillan, zgodna z informatorem 2024/2025)

Arkusz PP: **120 min, 60 pkt** = słuchanie 15 + czytanie 20 + środki językowe 13 + wypowiedź pisemna 12.
Każde zadanie zamknięte i otwarte krótkiej odpowiedzi = 1 pkt.

| Format (id) | Część | Oficjalny? | Komponent | Walidator | Punktacja | Testy | Bank (wiązki/pozycje) |
|---|---|---|---|---|---|---|---|
| Dobieranie zdań do wypowiedzi (L_MATCH) | słuchanie | tak | `GroupView` → `LetterInput` + `AudioPlayer` | `validateChoice` | 1 pkt/poz. | engine.test (matching), e2e exam | 2 / 10 |
| Wybór wielokrotny (L_MC) | słuchanie | tak | `McInput` + nagranie na pozycję | `validateChoice` | 1 pkt/poz. | engine.test, e2e diagnostic | 2 / 12 |
| Uzupełnianie notatki (L_GAP) | słuchanie | tak | `OpenInput` | `validateOpen(comprehension)` | 1 pkt/poz. | engine.test (tolerancja, liczby) | 2 / 8 |
| Dobieranie tekstów do zdań (R_MATCH) | czytanie | tak | `LetterInput` + `texts` | `validateChoice` | 1 pkt/poz. | engine.test | 2 / 8 |
| Kilka tekstów: zamknięte + uzupełnianie wiadomości (R_MULTI) | czytanie | tak | `McInput` + `OpenInput` + luki w tekście | `validateChoice` + `validateOpen(comprehension)` | 1 pkt/poz. | e2e layout | 2 / 14 |
| Wybór wielokrotny (R_MC) | czytanie | tak | `McInput` (+ tekst na pozycję) | `validateChoice` | 1 pkt/poz. | e2e diagnostic | 2 / 10 |
| Luki zdaniowe (R_SENTENCE_GAP) | czytanie | tak | `LetterInput` + `GapText` | `validateChoice` | 1 pkt/poz. | schema (dystraktor) | 2 / 8 |
| Minidialogi – funkcje językowe (U_DIALOG_MC) | środki | tak | `McInput` | `validateChoice` | 1 pkt/poz. | store.test, e2e | 4 / 12 |
| Jeden wyraz do dwóch zdań (U_LEXICAL_SET) | środki | tak | `McInput` | `validateChoice` | 1 pkt/poz. | — | 3 / 12 |
| Wybór tłumaczenia (U_TRANSLATION_MC) | środki | tak | `McInput` | `validateChoice` | 1 pkt/poz. | — | 3 / 12 |
| Wybór wielokrotny w tekście (U_GRAMMAR_MC) | środki | tak | `McInput` + `GapText` | `validateChoice` | 1 pkt/poz. | — | 3 / 12 |
| Luki – jeden wyraz (U_OPEN_CLOZE) | środki | tak | `OpenInput` + `GapText` | `validateOpen(strict)` | 1 pkt/poz., pełna poprawność | engine.test, store.test, e2e | 4 / 12 |
| Parafraza z podanym wyrazem (U_TRANSFORM) | środki | tak | `OpenInput` (keyWord) | `validateOpen(strict, maxWords 5)` | 1 pkt/poz. | engine.test (limit, keyWord, skróty) | 4 / 12 |
| Układanie fragmentów zdań (U_GRAMMATICALISE) | środki | tak | `OpenInput` | `validateOpen(strict)` | 1 pkt/poz. | — | 4 / 12 |
| Tłumaczenie fragmentów (U_TRANSLATE_OPEN) | środki | tak | `OpenInput` | `validateOpen(strict)` | 1 pkt/poz. | — | 4 / 12 |
| Wypowiedź pisemna: e-mail / blog / forum (W_*) | pisanie | tak | `WritingEditor`, `WritingFeedback` | `assessWriting` | treść 0–5, spójność 0–2, zakres 0–3, poprawność 0–2; <80 wyrazów → tylko treść; treść 0 → 0; treść 1 → max 1 | writing.test (cała tabela treści, reguły) | 6 tematów |
| Gramatyka w zdaniach (S_GRAMMAR_DRILL) | dodatkowe | **nie** | `McInput` | `validateChoice` | — | store.test | 12 / 48 |
| Budowanie zdań (S_SENTENCE_BUILD) | dodatkowe | **nie** | `OpenInput` | `validateOpen(strict)` | — | e2e lesson | 2 / 10 |

Uwagi:
- Zadanie „prawda/fałsz” nie występuje w opisie typów zadań aktualnego informatora PP, więc nie jest implementowane jako format maturalny.
- Część ustna nie jest częścią arkusza pisemnego i nie jest symulowana.
- Kolejność i wielkość wiązek w symulatorze odpowiadają arkuszowi z maja 2025 (zad. 1–3 słuchanie: 5/6/4, zad. 4–7 czytanie: 4/7/5/4, zad. 8–11 środki: 3/4/3/3, zad. 12 pisanie). Konfiguracja: `src/exam/blueprint.ts`.

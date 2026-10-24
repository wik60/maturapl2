# Matura Quest

Mobilna gra webowa (PWA) do nauki **matury podstawowej z języka angielskiego** (CKE, Formuła 2023, od 2025).
Interfejs po polsku, zadania po angielsku. Nazwa robocza – zmiana w `src/config.ts`.

> Matura Quest nie jest związana z CKE ani przez nią zatwierdzona. Wszystkie zadania są autorskie.

## Co jest zbudowane

| Sekcja | Trasa | Opis |
|---|---|---|
| Start | `#/` | „Co teraz?”, poziom/XP, seria, cel dzienny, zadania dnia, gotowość (przedział), ostatnie wyniki, tryby gry |
| Mapa przygody | `#/map` | 8 rozdziałów, 25 poziomów; stany: zablokowany / dostępny / w toku / zaliczony (≥70%) / opanowany (≥90%) |
| Ćwiczenia | `#/practice` | każdy typ zadania maturalnego osobno (filtry `?section=`, `?format=`) |
| Sesja | `#/session/:id` | wspólny silnik zadań: sprawdzanie, wyjaśnienia, nagrody, podsumowanie |
| Arkusz próbny | `#/exam`, `#/exam/:id`, `#/exam/:id/results` | 120 min, 60 pkt, blueprint 15/20/13/12, spis zadań, 2 odtworzenia nagrań, autooddanie, przegląd odpowiedzi |
| Pisanie | `#/writing`, `#/writing/:id` | e-mail / blog / forum, licznik wyrazów, autozapis, ocena wg kryteriów CKE (orientacyjna) |
| Słówka | `#/vocab` | 140 fiszek z 14 działów, SM-2, wymowa (synteza mowy) |
| Zeszyt błędów | `#/mistakes` | automatyczne zbieranie błędów, powtórki w odstępach, „opanowane” |
| Postępy | `#/progress` | umiejętności (z oznaczeniem „nie sprawdzono / za mało danych”), tematy, aktywność, odznaki |
| Diagnoza | `#/diagnostic` | 16 pytań rosnącej trudności → profil startowy i plan |
| Profil | `#/profile` | ustawienia, strefa czasowa serii, dostępność, kolory długopisu (monety), eksport, reset |
| O aplikacji | `#/about` | źródła, ograniczenia, macierz zgodności generowana z banku |

## Zweryfikowany format egzaminu (październik 2026)

120 min, 60 pkt: słuchanie 15 · czytanie 20 · środki językowe 13 · wypowiedź pisemna 12
(100–150 wyrazów, 4 podpunkty; treść 0–5, spójność i logika 0–2, zakres 0–3, poprawność 0–2;
<80 wyrazów → tylko treść; treść 0 → 0 we wszystkim; treść 1 → pozostałe max 1).
Źródła i pełna macierz: [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md).

Zaimplementowane formaty oficjalne (15): dobieranie i wybór wielokrotny ze słuchu, notatka ze słuchu;
dobieranie, wybór wielokrotny, luki zdaniowe i wiązka wielotekstowa z uzupełnianiem wiadomości;
minidialogi, jeden wyraz do dwóch zdań, wybór tłumaczenia, wybór wielokrotny w tekście,
luki jednym wyrazem, parafrazy, gramatykalizacja, tłumaczenie fragmentów; e-mail / blog / forum.
Ćwiczenia dodatkowe (wyraźnie oznaczone): gramatyka w zdaniach, budowanie zdań.

## Uruchomienie

Wymagania: [Bun](https://bun.sh) ≥ 1.1 (bundler + testy), React 19 i TypeScript.
W tym środowisku rejestr npm był zablokowany, więc projekt nie ma zależności npm do instalowania –
`node_modules/react` i `react-dom` to dowiązania do globalnych pakietów. Na własnym komputerze:

```bash
npm i react@19 react-dom@19          # albo: bun add react react-dom
bun scripts/build.ts                  # → dist/
bun scripts/serve.ts                  # http://localhost:4173
```

Testy:

```bash
bun test tests/unit                   # 57 testów jednostkowych i integracyjnych
tsc -p .                              # sprawdzanie typów
node tests/e2e/e2e.mjs                # 14 testów E2E (Playwright + Chromium, serwer na :4173)
```

## Konta i synchronizacja (Supabase)

Gra działa bez konta (postęp w przeglądarce). Po podłączeniu Supabase gracz może założyć konto
(e-mail + hasło) i mieć ten sam postęp na kilku urządzeniach.

1. Załóż projekt na supabase.com.
2. SQL Editor → uruchom `supabase/migrations/0001_user_progress.sql`
   (tabela `user_progress` z RLS + funkcja `save_progress` z kontrolą wersji).
3. Authentication → Providers → Email: włączone. Jeśli zostawisz „Confirm email”, gracz musi kliknąć
   link w mailu przed pierwszym logowaniem (aplikacja to wyjaśnia). Ustaw *Site URL* na adres aplikacji.
4. Project Settings → API: skopiuj **Project URL** i klucz **anon / publishable**.
   Nigdy nie używaj klucza `service_role` / `sb_secret_…` w aplikacji (formularz go odrzuci).
5. Zbuduj z kluczami:
   ```bash
   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... bun scripts/build.ts
   ```
   Albo bez przebudowy: Profil → „Połącz z moim projektem Supabase” (zapis na danym urządzeniu).

Jak działa synchronizacja:
- Przy pierwszym logowaniu postęp gościa jest wysyłany na konto (nic nie ginie).
- Zmiany są wysyłane automatycznie ~4 s po nauce, po powrocie online i przy zamykaniu karty.
- Każdy zapis podaje numer wersji, którą urządzenie widziało; serwer odrzuca nieaktualny zapis.
  Gdy postęp zmienił się na dwóch urządzeniach, gracz wybiera: wersja z chmury / z urządzenia /
  połącz obie (suma odpowiedzi, błędów, słówek, poziomów; XP = wyższa wartość).
- Sesja (tokeny) jest trzymana osobno od postępu i nie trafia do eksportu ani do bazy.
- W podglądzie na claude.ai synchronizacja jest zablokowana przez przeglądarkę (CSP) –
  działa w wersji wdrożonej na własnym adresie.

Testy synchronizacji (atrapa Supabase w `tests/mock-supabase.ts`):
```bash
bun test tests/unit/sync.test.ts
SUPABASE_URL=http://localhost:54398 SUPABASE_ANON_KEY=anon-key-for-e2e-0000000000000 OUT_DIR=dist-sync bun scripts/build.ts
PORT=54398 bun tests/mock-supabase.ts &  DIR=dist-sync PORT=4174 bun scripts/serve.ts &
node tests/e2e/sync.e2e.mjs
```

## Wdrożenie

### Vercel
Repo zawiera `vercel.json` (instalacja `bun install`, build `bun scripts/build.ts`, katalog `dist`).
1. vercel.com → Add New → Project → zaimportuj repo z GitHuba.
2. Settings → Environment Variables: `SUPABASE_URL` i `SUPABASE_ANON_KEY` (klucz publishable).
3. Deploy. Każdy push na `main` wdraża nową wersję.
4. W Supabase: Authentication → URL Configuration → Site URL = adres z Vercela.

### Inny hosting

`dist/` to statyczna strona (routing w `#hash`, brak przepisywania URL-i). Wystarczy dowolny hosting
statyczny z HTTPS (Netlify, Vercel, Cloudflare Pages, GitHub Pages): wgraj zawartość `dist/`.
Service worker i instalacja PWA działają na HTTPS i `localhost`.

## Architektura

```
src/content/      typy, rejestr formatów, walidacja schematu, bank zadań (data/*.ts)
src/engine/       normalizacja i walidatory odpowiedzi, punktacja, ocena wypowiedzi pisemnej
src/exam/         konfigurowalny blueprint + składanie arkusza (bez generowania treści)
src/game/         XP/poziomy, seria, zadania dnia, odznaki, mapa, SM-2, analityka i rekomendacje
src/store/        stan aplikacji, akcje (idempotentne nagrody), zapis lokalny z naprawą uszkodzeń
src/audio/        nagrania: plik audio (jeśli jest) albo synteza mowy w przeglądarce
src/ui/, pages/   komponenty zadań i ekrany
src/sync/         konto i synchronizacja z Supabase (klient fetch, łączenie stanów)
supabase/         migracja: tabela user_progress + RLS + save_progress
```

### Dodawanie zadań

Dodaj obiekt `TaskGroup` do odpowiedniego pliku w `src/content/data/` (typ w `src/content/types.ts`).
Przy starcie każda grupa przechodzi walidację (`schema.ts`); błędna grupa jest pomijana i nigdy nie jest
punktowana. Odpowiedzi otwarte: lista `accepted`, nawiasy = słowa opcjonalne (`(the) station`),
`marking: 'strict'` dla środków językowych, `'comprehension'` dla słuchania/czytania.
Aby arkusz mógł użyć zadania, liczba pozycji musi równać się rozmiarowi slotu w `blueprint.ts`.
Nagrania: dodaj `url` do `AudioClip`, by użyć prawdziwego pliku zamiast syntezy.

## iOS

- Dźwięk: pierwsze dotknięcie odblokowuje syntezę mowy; aplikacja przełącza sesję audio na
  „playback” (`navigator.audioSession`, iOS 17+) i podtrzymuje ją cichym elementem audio, więc mowa
  gra także przy przełączniku w trybie cichym. Pusta lista głosów (typowa w aplikacji z ekranu
  początkowego) nie blokuje odtwarzania – używany jest systemowy głos angielski.
- Dodawanie do ekranu: karta z instrukcją dla Safari (Udostępnij → Dodaj do ekranu początkowego),
  przycisk „Zainstaluj” w Chrome/Androidzie, ukrywana po instalacji. Aplikacja z ekranu ma osobny
  zapis niż Safari – postęp przenosi konto.
- Testy iOS (`tests/e2e/ios.e2e.mjs`) emulują iPhone'a w Chromium z podstawionym silnikiem mowy;
  dźwięk trzeba ostatecznie sprawdzić na prawdziwym urządzeniu.

## Ograniczenia (uczciwie)

- **Prototyp funkcjonalny, nie platforma produkcyjna.** Bank: 224 punktowane pozycje + 6 tematów
  pisania + 140 słówek – wystarcza na 2 różne pełne arkusze.
- **Nagrania** to synteza mowy z autorskich skryptów; brak angielskiego głosu → wyraźny komunikat,
  a słuchanie z transkrypcją nie liczy się do umiejętności „słuchanie”.
- **Ocena pisania** regułowa i orientacyjna (zakres ±2 pkt); brak zewnętrznego modelu AI.
- **Klucze odpowiedzi** są w aplikacji (tryb offline) – technicznie da się je podejrzeć.
- **Synchronizacja** przetestowana na atrapie API Supabase, nie na prawdziwym projekcie.
  Migracji SQL (RLS, `save_progress`) nie uruchamiałem na Postgresie – sprawdź ją przy wdrożeniu.
  Logowanie tylko e-mail + hasło (bez Google/Apple). Sync przesyła cały stan (do ~3 MB).
- **Brak powiadomień push** (wymagają serwera).
- **Typy React**: `@types/react` nie dało się zainstalować; użyto minimalnego shimu
  (`src/types/react-shim.d.ts`) – silnik, gra i stan są w pełni typowane, propsy JSX luźno.
- Główny pakiet JS ≈ 360 KB (zminifikowany, przed gzip) – zawiera React i cały bank treści.

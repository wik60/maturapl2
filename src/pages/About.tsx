import { bankStats, contentIssues, CONTENT_VERSION } from '../content';
import { FORMATS, SECTION_NAMES } from '../content/formats';
import type { FormatId } from '../content/types';
import { APP_NAME, DISCLAIMER } from '../config';
import { BLUEPRINT_PP_2025 } from '../exam/blueprint';

export default function About() {
  const stats = bankStats();
  const ids = Object.keys(FORMATS) as FormatId[];
  return (
    <div className="stack">
      <h1>O aplikacji {APP_NAME}</h1>
      <div className="notice info"><p style={{ margin: 0 }}>{DISCLAIMER}</p></div>

      <section className="card">
        <h2>Na czym opieramy format egzaminu</h2>
        <ul className="points-list">{BLUEPRINT_PP_2025.basis.map((b) => <li key={b}>{b}</li>)}</ul>
        <p>Matura podstawowa (Formuła 2023, od 2025): 120 minut, 60 punktów – rozumienie ze słuchu 15 pkt, rozumienie tekstów pisanych 20 pkt, znajomość środków językowych 13 pkt, wypowiedź pisemna 12 pkt (100–150 wyrazów; treść 0–5, spójność i logika 0–2, zakres 0–3, poprawność 0–2).</p>
        <p className="small muted">Oficjalnych arkuszy CKE nie kopiujemy – wszystkie zadania są autorskie. Część ustna matury nie jest częścią arkusza pisemnego i nie jest tu symulowana.</p>
      </section>

      <section className="card">
        <h2>Uczciwie o ograniczeniach</h2>
        <ul className="points-list">
          <li><strong>Nagrania</strong> powstają z autorskich skryptów: gdy jest gotowy plik, gra odtwarza głos wygenerowany przez otwarty model mowy Kokoro (licencja Apache 2.0), a w przeciwnym razie używa syntezy mowy przeglądarki (Web Speech API). To nie są nagrania lektorów CKE. Gdy przeglądarka nie ma angielskiego głosu, aplikacja to zgłasza, a słuchanie z transkrypcją nie jest liczone jako słuchanie.</li>
          <li><strong>Ocena wypowiedzi pisemnej</strong> jest automatyczna, regułowa i orientacyjna (zakres ±2 pkt). Program stosuje oficjalne zasady punktowania, ale nie rozumie tekstu jak egzaminator i wykrywa tylko typowe błędy.</li>
          <li><strong>Klucze odpowiedzi</strong> są przechowywane w aplikacji na urządzeniu (tryb offline). Technicznie da się je podejrzeć – to narzędzie do nauki, a nie egzamin z nadzorem.</li>
          <li><strong>Szacunek gotowości</strong> to przedział oparty na Twoich ostatnich odpowiedziach, nie prognoza wyniku matury. Nie podajemy poziomu CEFR.</li>
          <li><strong>Bank zadań</strong> ({Object.values(stats).reduce((s, x) => s + x.items, 0)} pozycji) wystarcza na 2 różne pełne arkusze. To zestaw startowy, nie pełny bank produkcyjny.</li>
          <li><strong>Postęp</strong> zapisuje się lokalnie w przeglądarce. Konta i synchronizacja w chmurze nie są jeszcze włączone.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Macierz zgodności typów zadań</h2>
        <p className="small muted">Każdy typ zadania: komponent, walidator, podstawa, liczba wiązek/pozycji w banku. Wersja treści: {CONTENT_VERSION}. Błędy walidacji treści: {contentIssues.length}.</p>
        <div className="tablewrap">
          <table className="matrix">
            <thead><tr><th>Typ zadania</th><th>Część</th><th>Status</th><th>Komponent / walidator</th><th>Bank</th></tr></thead>
            <tbody>
              {ids.map((id) => (
                <tr key={id}>
                  <td>{FORMATS[id].namePl}</td>
                  <td>{SECTION_NAMES[FORMATS[id].section]}</td>
                  <td>{FORMATS[id].official ? 'format maturalny' : 'dodatkowe'}</td>
                  <td><code>{FORMATS[id].component}</code><br /><code>{FORMATS[id].validator}</code></td>
                  <td>{stats[id] ? `${stats[id].groups} / ${stats[id].items}` : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

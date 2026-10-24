import { prompts } from '../content';
import { FORMATS } from '../content/formats';
import { Link } from '../router/router';
import { useAppState } from '../store/useStore';

export default function WritingList() {
  const state = useAppState();
  return (
    <div className="stack">
      <h1>Pisanie</h1>
      <div className="card">
        <p>Na maturze podstawowej piszesz jeden tekst użytkowy (e-mail, wpis na blogu lub forum) na podstawie polecenia z czterema podpunktami. Długość: 100–150 wyrazów. Za wypowiedź można dostać 12 punktów:</p>
        <ul className="points-list">
          <li>treść – 0–5 pkt</li>
          <li>spójność i logika wypowiedzi – 0–2 pkt</li>
          <li>zakres środków językowych – 0–3 pkt</li>
          <li>poprawność środków językowych – 0–2 pkt</li>
        </ul>
        <p className="small muted" style={{ marginBottom: 0 }}>Jak pisać: przeczytaj polecenie i podkreśl cztery podpunkty → zaplanuj 2–3 zdania na każdy → zacznij od powitania i nawiązania do podanego początku → łącz zdania (because, so, however) → zakończ i podpisz się jako XYZ → sprawdź czasy i pisownię.</p>
      </div>
      {prompts.map((p) => {
        const h = state.writing.history.filter((x) => x.promptId === p.id);
        const last = h[h.length - 1];
        const draft = (state.writing.drafts[p.id] ?? '').trim();
        return (
          <Link key={p.id} to={`/writing/${p.id}`} className="card tile" style={{ textDecoration: 'none' }}>
            <span className="badge official" style={{ alignSelf: 'flex-start' }}>{FORMATS[p.format].namePl.replace('Wypowiedź pisemna: ', '')}</span>
            <strong style={{ marginTop: '0.3rem' }}>{p.situationPl.replace(/:$/, '')}</strong>
            <span>{last ? `Ostatnio: ok. ${last.range[0]}–${last.range[1]}/12` : draft ? 'Masz zapisany szkic' : 'Jeszcze nie pisane'}</span>
          </Link>
        );
      })}
    </div>
  );
}

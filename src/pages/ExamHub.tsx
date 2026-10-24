import { useState } from 'react';
import { SECTION_NAMES } from '../content/formats';
import { examCapacity } from '../exam/assemble';
import { BLUEPRINT_PP_2025 } from '../exam/blueprint';
import { Link, navigate } from '../router/router';
import { startExam } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Dialog, pct } from '../ui/components/ui';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';

export default function ExamHub() {
  const state = useAppState();
  const store = useStore();
  const [confirm, setConfirm] = useState(false);
  const [auto, setAuto] = useState(true);
  const avail = useAudioAvailability();
  const bp = BLUEPRINT_PP_2025;
  const active = state.activeExamId ? state.exams[state.activeExamId] : undefined;
  const history = Object.values(state.exams).filter((e) => e.result).sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
  const cap = examCapacity(bp);

  const begin = () => {
    const id = store.update((s, now) => startExam(s, now, bp, auto));
    navigate(`/exam/${id}`);
  };

  return (
    <div className="stack">
      <h1>Arkusz próbny</h1>
      {active && !active.submittedAt && (
        <div className="notice info">
          <p><strong>Masz rozpoczęty arkusz.</strong> Czas płynie także wtedy, gdy aplikacja jest zamknięta.</p>
          <Link className="btn sm" to={`/exam/${active.id}`}>Wróć do arkusza</Link>
        </div>
      )}
      <section className="card">
        <span className="badge">Arkusz autorski na wzór CKE</span>
        <h2 style={{ marginTop: '0.5rem' }}>{bp.name}</h2>
        <p>{bp.minutes} minut · {bp.totalPoints} punktów · 12 zadań. Zadania są autorskie, ale ich typy, liczba i punktacja odpowiadają arkuszowi matury podstawowej z maja 2025.</p>
        <ul className="points-list">
          {(['listening', 'reading', 'language', 'writing'] as const).map((s) => (
            <li key={s}>{SECTION_NAMES[s]}: {bp.sectionPoints[s]} pkt</li>
          ))}
        </ul>
        <h3>Zasady</h3>
        <ul className="points-list">
          <li>Każde nagranie możesz odtworzyć {bp.audioPlays} razy – tak jak na maturze słyszysz je dwukrotnie.</li>
          <li>Odpowiedzi zapisują się na bieżąco. Możesz przechodzić między zadaniami.</li>
          <li>Poprawne odpowiedzi zobaczysz dopiero po oddaniu arkusza.</li>
          <li>Wypowiedź pisemna jest oceniana automatycznie i orientacyjnie – wynik ±2 pkt.</li>
          <li>Na maturze, żeby zdać, trzeba zdobyć co najmniej 30% punktów.</li>
        </ul>
        {avail !== 'ready' && avail !== 'checking' && (
          <div className="notice bad">Ta przeglądarka nie odtworzy nagrań (brak syntezy mowy z angielskim głosem). Część ze słuchania będzie niemożliwa do rozwiązania – uruchom arkusz w Chrome, Edge lub Safari.</div>
        )}
        <label className="setting">
          <span>Automatycznie oddaj arkusz, gdy skończy się czas</span>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        </label>
        <button className="btn block" style={{ marginTop: '0.8rem' }} onClick={() => setConfirm(true)} disabled={!!active && !active.submittedAt}>Rozpocznij arkusz</button>
        <p className="small muted" style={{ margin: '0.5rem 0 0' }}>Bank zadań pozwala na {cap} różne pełne arkusze. Kolejny arkusz unika zadań z poprzedniego.</p>
      </section>

      {history.length > 0 && (
        <section className="card">
          <h2>Twoje arkusze</h2>
          {history.map((e) => (
            <div key={e.id} className="row between" style={{ padding: '0.35rem 0', borderBottom: '1px dashed var(--line)' }}>
              <span>{new Date(e.submittedAt!).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
              <Link to={`/exam/${e.id}/results`}><strong>{e.result!.points}/{e.result!.max}</strong> ({pct(e.result!.points / e.result!.max)})</Link>
            </div>
          ))}
        </section>
      )}

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Zaczynamy?" actions={<>
        <button className="btn quiet" onClick={() => setConfirm(false)}>Jeszcze nie</button>
        <button className="btn" onClick={begin}>Start – 120 minut</button>
      </>}>
        <p>Po starcie zegar odlicza 120 minut. Przygotuj słuchawki i spokojne miejsce.</p>
      </Dialog>
    </div>
  );
}

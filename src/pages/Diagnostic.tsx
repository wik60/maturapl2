import { navigate, Link } from '../router/router';
import { startSession } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { SKILL_NAMES } from '../content/formats';

/**
 * Diagnostic: 16 items covering every skill, ordered from easier to harder.
 * Only items that make sense on their own are used (each keeps its text/recording).
 */
export const DIAGNOSTIC_UNITS = [
  'sd-pres#sd-pres.2', 'fd1#fd1.2', 'lmc2#lmc2.1', 'rmc2#rmc2.3',
  'sd-comp#sd-comp.2', 'ls1#ls1.3', 'lmc2#lmc2.3', 'rmc2#rmc2.2',
  'sd-pp#sd-pp.2', 'fd3#fd3.2', 'tm1#tm1.3', 'lmc1#lmc1.3',
  'rmc1#rmc1.4', 'ls2#ls2.3', 'tm1#tm1.2', 'tf2#tf2.1',
];

export default function Diagnostic() {
  const state = useAppState();
  const store = useStore();
  const start = () => {
    const id = store.update((s, now) => startSession(s, now, { kind: 'diagnostic', title: 'Test diagnostyczny', units: DIAGNOSTIC_UNITS }));
    navigate(`/session/${id}`);
  };
  return (
    <div className="stack">
      <h1>Test diagnostyczny</h1>
      <div className="card">
        <p>16 krótkich pytań ze słuchania, czytania, gramatyki, słownictwa i funkcji językowych – od łatwiejszych do trudniejszych. Zajmie około 10–12 minut.</p>
        <p>Na końcu zobaczysz wstępny profil: mocne strony, obszary do pracy i te, których nie da się jeszcze ocenić. To nie jest wynik matury ani poziom CEFR – do tego potrzeba znacznie więcej pytań.</p>
        <p className="small muted">Pisanie nie jest częścią diagnozy – sprawdzisz je w zakładce Pisanie.</p>
        <button className="btn block" onClick={start}>{state.diagnostic ? 'Zrób diagnozę jeszcze raz' : 'Rozpocznij diagnozę'}</button>
      </div>
      {state.diagnostic && (
        <div className="card">
          <h2>Poprzedni wynik</h2>
          {Object.entries(state.diagnostic.bySkill).map(([k, v]) => <p key={k} style={{ margin: '0.2rem 0' }}>{SKILL_NAMES[k] ?? k}: {v.correct}/{v.total}</p>)}
          <Link to="/progress">Zobacz pełne statystyki</Link>
        </div>
      )}
    </div>
  );
}

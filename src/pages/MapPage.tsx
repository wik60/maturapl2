import { CHAPTERS, isUnlocked, type Level, levelStatus, type LevelStatus } from '../game/map';
import { navigate } from '../router/router';
import { startSession } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { pct } from '../ui/components/ui';

const STATUS_PL: Record<LevelStatus, string> = {
  locked: 'Zablokowany',
  available: 'Dostępny',
  'in-progress': 'W toku',
  completed: 'Zaliczony',
  mastered: 'Opanowany',
};

export default function MapPage() {
  const state = useAppState();
  const store = useStore();

  const open = (l: Level, chapterName: string) => {
    if (!isUnlocked(state, l)) return;
    if (l.kind === 'exam') return navigate('/exam');
    const id = store.update((s, now) => startSession(s, now, { kind: 'map', title: `${chapterName}: ${l.titlePl}`, units: l.groupIds, levelId: l.id }));
    navigate(`/session/${id}`);
  };

  const done = Object.values(state.levels).filter((l) => l.completedAt).length;
  const total = CHAPTERS.reduce((s, c) => s + c.levels.length, 0);

  return (
    <div>
      <h1>Mapa przygody</h1>
      <p className="muted">Zaliczone poziomy: {done}/{total}. Poziom zaliczasz przy 70% poprawnych odpowiedzi, opanowujesz przy 90%. Rozdziały to struktura gry, a nie oficjalny podział CKE.</p>
      {CHAPTERS.map((c, ci) => (
        <section key={c.id} className="chapter" aria-labelledby={`ch-${c.id}`}>
          <header>
            <h2 id={`ch-${c.id}`}>{ci + 1}. {c.namePl}</h2>
            <small lang="en">{c.nameEn}</small>
          </header>
          <p className="small muted" style={{ margin: 0 }}>{c.descPl}</p>
          <ol className="path" style={{ listStyle: 'none', paddingLeft: 0 }}>
            {c.levels.map((l, li) => {
              const st = levelStatus(state, l);
              const p = state.levels[l.id];
              const locked = st === 'locked';
              return (
                <li key={l.id} className={`node ${st}`}>
                  <span className="node-dot" aria-hidden="true">
                    {st === 'locked' ? <Icon name="lock" size={20} /> : st === 'mastered' ? <Icon name="star" size={22} /> : st === 'completed' ? <Icon name="check" size={22} /> : li + 1}
                  </span>
                  <button
                    type="button"
                    className="card node-body"
                    style={{ textAlign: 'left', font: 'inherit', cursor: locked ? 'not-allowed' : 'pointer', width: '100%' }}
                    onClick={() => open(l, c.namePl)}
                    aria-disabled={locked}
                    aria-label={`${l.titlePl}. ${STATUS_PL[st]}. ${l.objectivePl}${locked ? ' Najpierw zalicz poprzedni poziom.' : ''}`}
                  >
                    <div className="row between">
                      <h3>{l.titlePl}</h3>
                      <span className={`badge ${st === 'completed' || st === 'mastered' ? 'good' : ''}`}>{STATUS_PL[st]}</span>
                    </div>
                    <p className="small" style={{ margin: 0 }}>{l.objectivePl}</p>
                    <p className="small muted" style={{ margin: '0.25rem 0 0' }}>
                      {locked ? 'Odblokujesz po zaliczeniu poprzedniego poziomu.' : `Nagroda: ${l.xp} XP${p?.attempts ? ` · najlepszy wynik ${pct(p.best)}` : ''}`}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

import { SKILL_NAMES } from '../content/formats';
import { ACHIEVEMENTS } from '../game/achievements';
import { readiness, skillStats, tagName, tagStats, SKILLS } from '../game/analytics';
import { levelProgress } from '../game/rewards';
import { currentStreak } from '../game/streak';
import { addDays } from '../game/time';
import { Link } from '../router/router';
import { today } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { pct, Progress as Bar } from '../ui/components/ui';
import { Ruler } from './Home';

const STATUS_PL = { untested: 'nie sprawdzono', uncertain: 'za mało danych', measured: 'zmierzone' };

export default function ProgressPage() {
  const state = useAppState();
  const store = useStore();
  const t = today(state, store.now());
  const sk = skillStats(state);
  const rd = readiness(state);
  const lp = levelProgress(state.xp);
  const tags = Object.values(tagStats(state)).filter((x) => x.total >= 3).sort((a, b) => a.accuracy - b.accuracy);
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const maxItems = Math.max(1, ...days.map((d) => state.days[d]?.items ?? 0));
  const examCount = Object.values(state.exams).filter((e) => e.result).length;

  return (
    <div className="stack">
      <h1>Postępy</h1>
      <section className="grid2">
        <div className="card"><span className="small muted">Poziom gracza</span><h2 style={{ margin: 0 }}>{lp.level}</h2><Bar value={lp.ratio} label="Postęp poziomu" tone="marker" /><span className="small">{state.xp} XP · {state.coins} monet</span></div>
        <div className="card"><span className="small muted">Seria</span><h2 style={{ margin: 0 }}>{currentStreak(state.days, t)} dni</h2><span className="small">Rekord: {Math.max(state.bestStreak, currentStreak(state.days, t))} · najdłuższa passa poprawnych: {state.bestRun}</span></div>
      </section>

      <section className="card">
        <h2>Aktywność – ostatnie 14 dni</h2>
        <div className="bars" role="img" aria-label={`Liczba pytań dziennie w ostatnich 14 dniach: ${days.map((d) => state.days[d]?.items ?? 0).join(', ')}`}>
          {days.map((d) => {
            const v = state.days[d]?.items ?? 0;
            return <span key={d} className={v ? '' : 'zero'} style={{ height: `${(v / maxItems) * 100}%` }} title={`${d}: ${v}`} />;
          })}
        </div>
        <div className="scale"><span>{days[0].slice(5)}</span><span>dziś</span></div>
      </section>

      <section className="card">
        <h2>Gotowość do matury</h2>
        {rd.measuredShare === 0 ? <p className="muted">Brak danych. Zacznij od <Link to="/diagnostic">diagnozy</Link>.</p> : (
          <>
            <p style={{ margin: 0 }}>Szacunek: <strong>{rd.low === rd.high ? rd.low : `${rd.low}–${rd.high}`}/60 pkt</strong></p>
            <Ruler low={rd.low} high={rd.high} />
          </>
        )}
        <p className="small muted">Jak liczymy: dla każdej części arkusza bierzemy skuteczność z ostatnich 15 odpowiedzi i mnożymy przez liczbę punktów tej części (15/20/13/12). Części, w których masz mniej niż 6 odpowiedzi (lub 0 wypowiedzi pisemnych), traktujemy jako nieznane i pokazujemy pełny możliwy zakres. To szacunek, nie prognoza wyniku.</p>
        {rd.lastExam && <p className="small">Ostatni pełny arkusz: <strong>{rd.lastExam.points}/{rd.lastExam.max}</strong>. Ukończone arkusze: {examCount}.</p>}
      </section>

      <section className="card">
        <h2>Umiejętności</h2>
        {SKILLS.map((k) => {
          const s = sk[k];
          return (
            <div className="skillrow" key={k}>
              <span>{SKILL_NAMES[k]} <span className="small muted">· {STATUS_PL[s.status]}</span></span>
              <span className="small">{s.status === 'untested' ? '–' : k === 'writing' ? `śr. ${Math.round(s.accuracy * 12 * 10) / 10}/12` : `${pct(s.recentAccuracy)} (${s.total})`}</span>
              <Bar value={s.status === 'untested' ? 0 : s.recentAccuracy} label={SKILL_NAMES[k]} />
            </div>
          );
        })}
        <p className="small muted" style={{ margin: 0 }}>Procent = skuteczność w ostatnich 15 odpowiedziach; w nawiasie liczba wszystkich odpowiedzi. Słuchanie rozwiązane z transkrypcją nie jest tu liczone.</p>
      </section>

      {tags.length > 0 && (
        <section className="card">
          <h2>Tematy gramatyczne i funkcje</h2>
          {tags.slice(0, 10).map((x) => (
            <div className="skillrow" key={x.key}>
              <span>{tagName(x.key)}</span><span className="small">{x.correct}/{x.total}</span>
              <Bar value={x.accuracy} label={tagName(x.key)} tone={x.accuracy >= 0.75 ? 'good' : undefined} />
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Odznaki</h2>
        <div className="grid2">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} style={{ opacity: state.achievements[a.id] ? 1 : 0.5 }}>
              <strong>{state.achievements[a.id] ? '★ ' : '☆ '}{a.namePl}</strong>
              <div className="small muted">{a.descPl}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { vocab } from '../content';
import { recommendations } from '../game/analytics';
import { nextLevel, CHAPTERS } from '../game/map';
import { QUEST_TEXT } from '../game/quests';
import { levelProgress } from '../game/rewards';
import { isDue } from '../game/srs';
import { currentStreak } from '../game/streak';
import { Link, navigate } from '../router/router';
import { startSession, today } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { plural, Progress } from '../ui/components/ui';
import { InstallCard } from '../ui/components/InstallPrompt';

export function Home() {
  const state = useAppState();
  const store = useStore();
  const now = store.now();
  const t = today(state, now);
  const lp = levelProgress(state.xp);
  const streak = currentStreak(state.days, t);
  const todayItems = state.days[t]?.items ?? 0;
  const recs = recommendations(state, t);
  const active = state.activeSessionId ? state.sessions[state.activeSessionId] : undefined;
  const activeExam = state.activeExamId ? state.exams[state.activeExamId] : undefined;
  const lvl = nextLevel(state);
  const lvlChapter = lvl ? CHAPTERS.find((c) => c.id === lvl.chapter) : undefined;
  const dueVocab = vocab.filter((v) => !state.vocab[v.id]?.known && state.vocab[v.id] && isDue(state.vocab[v.id], t)).length;
  const openMistakes = Object.values(state.mistakes).filter((m) => !m.mastered).length;

  const startLevel = () => {
    if (!lvl) return;
    if (lvl.kind === 'exam') return navigate('/exam');
    const id = store.update((s, n) => startSession(s, n, { kind: 'map', title: `${lvlChapter?.namePl}: ${lvl.titlePl}`, units: lvl.groupIds, levelId: lvl.id }));
    navigate(`/session/${id}`);
  };

  let cta: { label: string; sub: string; go: () => void };
  if (activeExam && !activeExam.submittedAt) cta = { label: 'Wróć do arkusza', sub: 'Arkusz próbny czeka – czas płynie', go: () => navigate(`/exam/${activeExam.id}`) };
  else if (active && !active.finishedAt) cta = { label: 'Dokończ sesję', sub: active.title, go: () => navigate(`/session/${active.id}`) };
  else if (!state.diagnostic && state.attempts.length === 0) cta = { label: 'Zacznij od diagnozy', sub: '16 pytań, żeby dobrać Ci plan nauki', go: () => navigate('/diagnostic') };
  else if (lvl) cta = { label: 'Kontynuuj przygodę', sub: `${lvl.titlePl} · ${lvlChapter?.namePl}`, go: startLevel };
  else cta = { label: 'Rozwiąż arkusz', sub: 'Cała mapa za Tobą – czas na pełny arkusz', go: () => navigate('/exam') };

  const goal = state.settings.dailyGoalItems;
  const goalRatio = Math.min(1, todayItems / goal);

  return (
    <div className="home">
      <section className="card hero-cta" aria-labelledby="cta">
        <svg className="deco" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="#fff" strokeWidth="10" strokeDasharray="20 14" /></svg>
        <h1 className="eyebrow" id="hello">{state.settings.name ? `Cześć, ${state.settings.name}!` : 'Cześć!'}</h1>
        <h2 id="cta">{cta.sub}</h2>
        <button className="btn block" onClick={cta.go}>{cta.label}</button>
        {recs[0] && recs[0].kind !== 'diagnostic' && (
          <p className="tip">{recs[0].textPl} <Link to={recs[0].route}>Przejdź</Link></p>
        )}
      </section>

      <div className="stat-strip" role="group" aria-label="Twoje statystyki">
        <div className="stat">
          <span className="k">Seria</span>
          <b><span className="flame-i"><Icon name="flame" size={20} /></span>{streak}<small style={{ fontSize: '0.75rem', fontFamily: 'var(--font-ui)' }}>{plural(streak, 'dzień', 'dni', 'dni')}</small></b>
        </div>
        <div className="stat">
          <span className="k">Cel na dziś</span>
          <b><span className="ring" style={{ '--p': goalRatio } as Record<string, number>} aria-hidden="true" />{Math.min(todayItems, goal)}/{goal}</b>
          <span className="sr-only">pytań</span>
        </div>
        <div className="stat">
          <span className="k">Poziom {lp.level}</span>
          <b>{state.xp}<small style={{ fontSize: '0.75rem', fontFamily: 'var(--font-ui)' }}>XP</small></b>
          <Progress value={lp.ratio} label={`Postęp do poziomu ${lp.level + 1}`} tone="marker" />
        </div>
      </div>

      <section className="card quests" aria-labelledby="quests">
        <h2 id="quests">Zadania dnia <span className="small muted" style={{ fontFamily: 'var(--font-ui)' }}>· +40 XP każde</span></h2>
        {state.quests.list.map((q) => (
          <div key={q.id} className={`quest ${q.done ? 'done' : ''}`}>
            <span className="box" aria-hidden="true">{q.done && <Icon name="check" size={16} />}</span>
            <span className="qt">{QUEST_TEXT[q.type](q.target)}<span className="sr-only">{q.done ? ' – wykonane' : ` – ${q.progress} z ${q.target}`}</span></span>
            <Progress value={q.progress} max={q.target} tone="good" label={`${q.progress} z ${q.target}`} />
          </div>
        ))}
      </section>

      <nav className="tiles" aria-label="Tryby gry">
        <Link to="/vocab" className="card tile" aria-label={`Słówka${dueVocab ? `: ${dueVocab} do powtórki` : ''}`}><span className="ti"><Icon name="book" /></span><strong>Słówka</strong>{dueVocab > 0 && <span className="count" aria-hidden="true">{dueVocab}</span>}</Link>
        <Link to="/mistakes" className="card tile" aria-label={`Błędy${openMistakes ? `: ${openMistakes} do poprawy` : ''}`}><span className="ti"><Icon name="list" /></span><strong>Błędy</strong>{openMistakes > 0 && <span className="count" aria-hidden="true">{openMistakes}</span>}</Link>
        <Link to="/writing" className="card tile"><span className="ti"><Icon name="pen" /></span><strong>Pisanie</strong></Link>
        <Link to="/progress" className="card tile"><span className="ti"><Icon name="grid" /></span><strong>Postępy</strong></Link>
      </nav>

      <InstallCard place="home" />
    </div>
  );
}

export function Ruler({ low, high }: { low: number; high: number }) {
  return (
    <div aria-hidden="true">
      <div className="ruler">
        <div className="track" />
        <div className="known" style={{ left: 0, width: `${(low / 60) * 100}%` }} />
        <div className="band" style={{ left: `${(low / 60) * 100}%`, width: `${((high - low) / 60) * 100}%` }} />
        <div className="pass" style={{ left: '30%' }} />
      </div>
      <div className="scale"><span>0</span><span>30</span><span>60</span></div>
    </div>
  );
}

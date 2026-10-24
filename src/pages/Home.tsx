import { getPrompt, vocab } from '../content';
import { SKILL_NAMES } from '../content/formats';
import { readiness, recommendations, skillStats, weakestSkill } from '../game/analytics';
import { getLevel, nextLevel, CHAPTERS } from '../game/map';
import { QUEST_TEXT } from '../game/quests';
import { levelProgress } from '../game/rewards';
import { isDue } from '../game/srs';
import { currentStreak } from '../game/streak';
import { Link, navigate } from '../router/router';
import { startSession, today } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { pct, plural, Progress } from '../ui/components/ui';

export function Home() {
  const state = useAppState();
  const store = useStore();
  const now = store.now();
  const t = today(state, now);
  const lp = levelProgress(state.xp);
  const streak = currentStreak(state.days, t);
  const todayItems = state.days[t]?.items ?? 0;
  const recs = recommendations(state, t);
  const rd = readiness(state);
  const weak = weakestSkill(state);
  const weakStat = weak ? skillStats(state)[weak] : undefined;
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
  if (activeExam && !activeExam.submittedAt) cta = { label: 'Wróć do arkusza', sub: 'Masz rozpoczęty arkusz próbny – czas wciąż płynie.', go: () => navigate(`/exam/${activeExam.id}`) };
  else if (active && !active.finishedAt) cta = { label: 'Dokończ sesję', sub: active.title, go: () => navigate(`/session/${active.id}`) };
  else if (!state.diagnostic && state.attempts.length === 0) cta = { label: 'Zacznij od diagnozy', sub: 'Około 16 pytań ze wszystkich części matury. Na tej podstawie dobierzemy ćwiczenia.', go: () => navigate('/diagnostic') };
  else if (lvl) cta = { label: 'Kontynuuj przygodę', sub: `${lvlChapter?.namePl}: ${lvl.titlePl}`, go: startLevel };
  else cta = { label: 'Rozwiąż arkusz', sub: 'Przeszedłeś całą mapę – sprawdź się w pełnym arkuszu.', go: () => navigate('/exam') };

  const recent = [
    ...Object.values(state.sessions).filter((s) => s.finishedAt).map((s) => ({ ts: s.finishedAt!, title: s.title, detail: sessionScore(s), route: '' })),
    ...Object.values(state.exams).filter((e) => e.result).map((e) => ({ ts: e.submittedAt!, title: 'Arkusz próbny', detail: `${e.result!.points}/${e.result!.max} pkt`, route: `/exam/${e.id}/results` })),
    ...state.writing.history.map((w) => ({ ts: w.ts, title: `Pisanie: ${getPrompt(w.promptId)?.format === 'W_EMAIL' ? 'e-mail' : getPrompt(w.promptId)?.format === 'W_BLOG' ? 'wpis na blogu' : 'wpis na forum'}`, detail: `ok. ${w.range[0]}–${w.range[1]}/12`, route: `/writing/${w.promptId}` })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 3);

  return (
    <div className="stack">
      <section className="card hero" aria-labelledby="hello">
        <h1 id="hello">{state.settings.name ? `Cześć, ${state.settings.name}!` : 'Cześć!'}</h1>
        <p className="muted">{cta.sub}</p>
        <button className="btn block" onClick={cta.go}>{cta.label}</button>
        {recs[0] && recs[0].kind !== 'diagnostic' && (
          <p className="small" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            <strong>Polecamy:</strong> {recs[0].textPl} <Link to={recs[0].route}>Przejdź</Link>
          </p>
        )}
      </section>

      <div className="stat-strip" role="group" aria-label="Twoje statystyki">
        <div className="stat">
          <span>Poziom</span>
          <b>{lp.level}</b>
          <Progress value={lp.ratio} label={`Postęp do poziomu ${lp.level + 1}`} tone="marker" />
          <span>{state.xp} XP</span>
        </div>
        <div className="stat">
          <span>Seria</span>
          <b>{streak} {plural(streak, 'dzień', 'dni', 'dni')}</b>
          <span>{streak ? 'Nie przerywaj!' : '5 pytań, by zacząć'}</span>
        </div>
        <div className="stat">
          <span>Cel na dziś</span>
          <b>{Math.min(todayItems, state.settings.dailyGoalItems)}/{state.settings.dailyGoalItems}</b>
          <Progress value={todayItems} max={state.settings.dailyGoalItems} label="Cel dzienny" tone="good" />
        </div>
      </div>

      <section className="card" aria-labelledby="quests">
        <h2 id="quests">Zadania dnia</h2>
        {state.quests.list.map((q) => (
          <div key={q.id} className={`quest ${q.done ? 'done' : ''}`}>
            <span className="box" aria-hidden="true">{q.done && <Icon name="check" size={16} />}</span>
            <span className="qt">{QUEST_TEXT[q.type](q.target)}<span className="sr-only">{q.done ? ' – wykonane' : ''}</span></span>
            <span className="small muted">{q.progress}/{q.target}</span>
          </div>
        ))}
        <p className="small muted" style={{ margin: '0.5rem 0 0' }}>Każde zadanie dnia: +40 XP. Nowe zadania o północy.</p>
      </section>

      <section className="card" aria-labelledby="ready">
        <div className="row between">
          <h2 id="ready" style={{ margin: 0 }}>Gotowość do matury</h2>
          <Link to="/progress" className="small">Szczegóły</Link>
        </div>
        {rd.measuredShare === 0 ? (
          <p className="muted" style={{ marginTop: '0.5rem' }}>Za mało danych, żeby cokolwiek oszacować. Rozwiąż diagnozę lub kilka zadań z każdej części.</p>
        ) : (
          <>
            <p style={{ marginTop: '0.4rem', marginBottom: 0 }}>
              Szacunek: <strong>{rd.low === rd.high ? rd.low : `${rd.low}–${rd.high}`} / 60 pkt</strong>
              <span className="muted small"> · zmierzone {pct(rd.measuredShare)} arkusza</span>
            </p>
            <Ruler low={rd.low} high={rd.high} />
            {rd.unknown.length > 0 && <p className="small muted" style={{ margin: 0 }}>Brakuje danych z: {rd.unknown.map((u) => SKILL_NAMES[u] ?? (u === 'language' ? 'środków językowych' : u)).join(', ')} – dlatego wynik jest przedziałem.</p>}
          </>
        )}
        {weak && weakStat && <p className="small" style={{ margin: '0.5rem 0 0' }}>Najsłabsza umiejętność: <strong>{SKILL_NAMES[weak]}</strong> ({pct(weakStat.recentAccuracy)} w ostatnich próbach).</p>}
      </section>

      {recent.length > 0 && (
        <section className="card" aria-labelledby="recent">
          <h2 id="recent">Ostatnie wyniki</h2>
          {recent.map((x, i) => (
            <div key={i} className="row between" style={{ padding: '0.35rem 0', borderBottom: '1px dashed var(--line)' }}>
              <span>{x.route ? <Link to={x.route}>{x.title}</Link> : x.title}</span>
              <strong>{x.detail}</strong>
            </div>
          ))}
        </section>
      )}

      <h2 className="section-title">Tryby gry</h2>
      <nav className="tiles" aria-label="Tryby gry">
        <Link to="/map" className="card tile"><strong>Mapa przygody</strong><span>{lvl ? `Teraz: ${getLevel(lvl.id)?.titlePl}` : 'Wszystko odblokowane'}</span></Link>
        <Link to="/practice" className="card tile"><strong>Ćwiczenia</strong><span>Każdy typ zadania z matury osobno</span></Link>
        <Link to="/exam" className="card tile"><strong>Arkusz próbny</strong><span>120 minut, 60 punktów</span></Link>
        <Link to="/vocab" className="card tile"><strong>Słówka</strong><span>{dueVocab ? `${dueVocab} do powtórki` : '140 słówek z 14 działów'}</span></Link>
        <Link to="/writing" className="card tile"><strong>Pisanie</strong><span>E-mail, blog, forum – 12 pkt</span></Link>
        <Link to="/mistakes" className="card tile"><strong>Zeszyt błędów</strong><span>{openMistakes ? `${openMistakes} do poprawy` : 'Na razie pusty'}</span></Link>
      </nav>
    </div>
  );
}

function sessionScore(s: { units: string[]; answers: Record<string, string>; submitted: string[] }) {
  return `${s.submitted.length}/${s.units.length} zadań`;
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

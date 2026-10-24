import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { tone } from '../audio/speech';
import { FORMATS, SKILL_NAMES } from '../content/formats';
import { correctAnswerText, type ItemResult, scoreGroup, validateItem } from '../engine/validate';
import type { Item, TaskGroup } from '../content/types';
import { getLevel } from '../game/map';
import { tagName } from '../game/analytics';
import { navigate, useRoute, Link } from '../router/router';
import { finishSession, resolveUnit, setAnswer, startSession, submitUnit, type SessionSummary } from '../store/actions';
import type { PracticeSession } from '../store/types';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { Dialog, EmptyState, pct, Progress, showReward } from '../ui/components/ui';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';
import { ItemStep } from '../ui/exercises/ItemStep';

const created = new Map<string, string>();

function NewSession() {
  const r = useRoute();
  const store = useStore();
  useEffect(() => {
    const key = location.hash;
    let id = created.get(key);
    if (!id) {
      const units = (r.query.get('groups') ?? '').split(',').filter(Boolean);
      const kind = (r.query.get('kind') as PracticeSession['kind']) || 'practice';
      const levelId = r.query.get('level') ?? undefined;
      const title = r.query.get('title') ?? (levelId ? getLevel(levelId)?.titlePl ?? 'Poziom' : 'Ćwiczenia');
      id = store.update((s, now) => startSession(s, now, { kind, title, units, levelId }));
      created.set(key, id);
    }
    navigate(`/session/${id}`, { replace: true });
  }, []);
  return <p role="status">Przygotowuję ćwiczenia…</p>;
}

export default function SessionPage({ id }: { id?: string }) {
  if (!id || id === 'new') return <NewSession />;
  return <Runner id={id} />;
}

interface Step { unit: string; group?: TaskGroup; item?: Item }

const PRAISE = ['Dobrze!', 'Świetnie!', 'Brawo!', 'Tak jest!', 'Doskonale!'];
const praiseFor = (id: string) => PRAISE[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % PRAISE.length];

function hasRecording(g: TaskGroup) {
  return g.items.some((i) => i.audio?.url) || (g.stimulus.kind === 'audio' && g.stimulus.clips.some((c) => c.url));
}

function Runner({ id }: { id: string }) {
  const state = useAppState();
  const store = useStore();
  const s = state.sessions[id];
  const unitsKey = s?.units.join('|') ?? '';
  const steps = useMemo<Step[]>(
    () => (s?.units ?? []).flatMap((u) => {
      const g = resolveUnit(u);
      return g ? g.items.map((item) => ({ unit: u, group: g, item })) : [{ unit: u }];
    }),
    [unitsKey],
  );
  const [pos, setPos] = useState(() => {
    if (!s) return 0;
    const i = steps.findIndex((st) => !s.submitted.includes(st.unit));
    return i < 0 ? Math.max(0, steps.length - 1) : i;
  });
  const [checked, setChecked] = useState<Record<string, ItemResult>>({});
  const [combo, setCombo] = useState(0);
  const [leave, setLeave] = useState(false);
  const [more, setMore] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [transcriptMode, setTranscriptMode] = useState<Record<string, boolean>>(s?.listeningFallback ?? {});
  const [cooldown, setCooldown] = useState(false);
  const busy = useRef(new Set<string>());
  const avail = useAudioAvailability();
  const actions = useRef({ check: () => {}, next: () => {} });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || leave || e.isComposing) return;
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
      if ((e.target as HTMLElement | null)?.closest?.('button, a')) return;
      e.preventDefault();
      actions.current.check();
      actions.current.next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leave]);

  const shell = (body: ReactNode) => <div className="lesson"><div className="lesson-body" style={{ justifyContent: 'center' }}>{body}</div></div>;
  if (!s) {
    return shell(<EmptyState title="Nie znaleziono sesji" action={<Link className="btn" to="/practice">Wybierz ćwiczenia</Link>}>Ta sesja została usunięta lub pochodzi z innego urządzenia.</EmptyState>);
  }
  if (!s.units.length) {
    return shell(<EmptyState title="Brak zadań" action={<Link className="btn" to="/practice">Wróć do ćwiczeń</Link>}>Dla wybranych filtrów nie ma dostępnych zadań.</EmptyState>);
  }
  if (s.finishedAt) return <Summary session={s} summary={summary} />;

  const isLast = pos >= steps.length - 1;
  const finish = () => {
    const sum = store.update((st, now) => finishSession(st, now, id));
    if (sum) {
      setSummary(sum);
      showReward(sum.reward);
    }
  };
  const step = steps[Math.min(pos, steps.length - 1)];
  if (!step.group || !step.item) {
    return shell(<EmptyState title="Zadanie niedostępne" action={<button className="btn" onClick={() => (isLast ? finish() : setPos(pos + 1))}>Pomiń</button>}>To zadanie zostało zmienione w nowej wersji treści i nie może być ocenione.</EmptyState>);
  }
  const { unit, group, item } = step;
  const unitSubmitted = s.submitted.includes(unit);
  const result = checked[item.id] ?? (unitSubmitted ? scoreGroup(group, s.answers).results.find((r) => r.itemId === item.id) : undefined);
  const value = s.answers[item.id] ?? '';
  const isListening = FORMATS[group.format].section === 'listening';
  const needsFallback = isListening && avail !== 'ready' && avail !== 'checking' && !hasRecording(group);
  const done = steps.filter((_, i) => i < pos).length + (result ? 1 : 0);

  const check = (force = false) => {
    if (result || busy.current.has(item.id)) return;
    if (!force && !value.trim()) return;
    busy.current.add(item.id);
    const r = validateItem(group, item, value);
    const next = { ...checked, [item.id]: r };
    setChecked(next);
    setMore(false);
    const ok = r.verdict === 'correct';
    setCombo((c) => (ok ? c + 1 : 0));
    if (state.settings.sound) tone(ok ? 'good' : 'bad');
    // the last question of a task records the whole task once (attempts, XP, mistakes)
    if (!unitSubmitted && group.items.every((it) => next[it.id])) {
      const out = store.update((st, now) => submitUnit(st, now, id, unit, { transcript: !!transcriptMode[unit] }));
      if (out && !out.already) showReward(out.reward);
    }
    // a double tap on "Sprawdź" must not skip the feedback
    setCooldown(true);
    setTimeout(() => setCooldown(false), 450);
  };
  const next = () => {
    if (!result || cooldown) return;
    setMore(false);
    if (!isLast) setPos(pos + 1);
    else finish();
  };
  actions.current = { check: () => check(false), next };

  const ok = result?.verdict === 'correct';
  const note = result && !ok && result.given && item.distractorNotes?.[result.given];
  const hasMore = !!(note || item.evidence || item.rule);

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="btn flat icon close" onClick={() => setLeave(true)} aria-label="Przerwij lekcję"><Icon name="cross" size={26} /></button>
        <Progress value={done} max={steps.length} label={`Postęp lekcji: ${done} z ${steps.length}`} />
        <span className={`combo ${combo >= 2 ? 'bump' : ''}`} key={combo} aria-label={combo >= 2 ? `${combo} dobre odpowiedzi z rzędu` : undefined}>
          {combo >= 2 && <><Icon name="flame" size={20} />{combo}</>}
        </span>
      </div>

      <div className="lesson-body">
        <span className="sr-only">{s.title}{s.kind === 'diagnostic' ? ' – test diagnostyczny' : ''}</span>
        {needsFallback && !result && (
          <div className="notice">
            <p style={{ marginBottom: transcriptMode[unit] ? 0 : '0.5rem' }}><strong>Nie możemy odtworzyć nagrania w tej przeglądarce.</strong> Możesz przeczytać transkrypcję, ale wtedy wynik nie liczy się do umiejętności „Słuchanie”.</p>
            {!transcriptMode[unit] && <button className="btn sm ghost" onClick={() => setTranscriptMode({ ...transcriptMode, [unit]: true })}>Pokaż transkrypcję</button>}
          </div>
        )}
        <ItemStep
          key={item.id}
          group={group}
          item={item}
          answers={s.answers}
          onAnswer={(v) => { if (!result) store.update((st) => setAnswer(st, id, item.id, v)); }}
          result={result}
          audio={{ rate: state.settings.speechRate }}
          showTranscript={!!result || !!transcriptMode[unit]}
        />
      </div>

      {!result ? (
        <div className="lesson-foot">
          <div className="lesson-foot-in">
            <button className="btn quiet" onClick={() => check(true)}>Nie wiem</button>
            <button className="btn" onClick={() => check(false)} disabled={!value.trim()}>Sprawdź</button>
          </div>
        </div>
      ) : (
        <div className={`lesson-foot verdict-sheet ${ok ? 'good' : 'bad'}`} role="status" aria-live="polite">
          <div className="lesson-foot-in">
            <div className="verdict-head">
              <span className="vi" aria-hidden="true"><Icon name={ok ? 'check' : 'cross'} size={22} /></span>
              <h2>{result.verdict === 'invalid' ? 'Pominięte' : ok ? praiseFor(item.id) : result.verdict === 'unanswered' ? 'Brak odpowiedzi.' : 'Niestety, źle.'}</h2>
            </div>
            <div className="vtext">
              {result.verdict === 'invalid' ? <p>To zadanie ma błędny klucz i nie zostało ocenione.</p> : <>
                {!ok && <p>Poprawna odpowiedź: <span className="answer" lang="en">{correctAnswerText(group, item)}</span></p>}
                {result.reasonPl && <p>{result.reasonPl}</p>}
                <p>{item.explanationPl}</p>
                {more && (
                  <div className="more">
                    {note && <p>Dlaczego nie {result.given}? {note}</p>}
                    {item.evidence && <p className="evidence" lang="en">Klucz w {isListening ? 'nagraniu' : 'tekście'}: „{item.evidence}”</p>}
                    {item.rule && <p>Reguła: {item.rule}</p>}
                  </div>
                )}
              </>}
            </div>
            <div className="row-btns">
              {hasMore && !more && <button className="btn quiet" onClick={() => setMore(true)}>Więcej</button>}
              <button className={`btn ${ok ? 'good' : 'bad'}`} onClick={next} disabled={cooldown}>{isLast ? 'Zakończ' : 'Dalej'}</button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={leave}
        onClose={() => setLeave(false)}
        title="Przerwać lekcję?"
        actions={<>
          <button className="btn quiet" onClick={() => navigate('/')}>Przerwij</button>
          <button className="btn" onClick={() => setLeave(false)}>Ucz się dalej</button>
        </>}
      >
        <p>Odpowiedzi są zapisane. Do tej sesji wrócisz z ekranu Start.</p>
      </Dialog>
    </div>
  );
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (document.documentElement.dataset.motion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { dx: `${Math.round(Math.cos(a) * 95)}px`, dy: `${Math.round(Math.sin(a) * 95)}px`, c: ['var(--ink)', 'var(--good)', 'var(--flame)', 'var(--bad)', 'var(--marker-strong)'][i % 5] };
});


function Summary({ session, summary }: { session: PracticeSession; summary: SessionSummary | null }) {
  const state = useAppState();
  const store = useStore();
  const [showDiag, setShowDiag] = useState(true);
  const totals = useMemo(() => {
    let points = 0, max = 0;
    const wrong: string[] = [];
    for (const u of session.units) {
      const g = resolveUnit(u);
      if (!g) continue;
      const sc = scoreGroup(g, session.answers);
      points += sc.points; max += sc.max;
      sc.results.filter((r) => r.verdict === 'incorrect' || r.verdict === 'unanswered').forEach((r) => wrong.push(`${g.id}#${r.itemId}`));
    }
    return { points, max, wrong };
  }, [session]);
  const level = session.levelId ? getLevel(session.levelId) : undefined;
  const ratio = totals.max ? totals.points / totals.max : 0;
  const lp = session.levelId ? state.levels[session.levelId] : undefined;
  const diag = session.kind === 'diagnostic' ? state.diagnostic : undefined;
  const xpTotal = (summary?.reward.xp ?? 0) + (session.xpEarned ?? 0);
  const xp = useCountUp(xpTotal);
  const pctV = useCountUp(Math.round(ratio * 100));
  const good = ratio >= 0.7;

  const retry = () => {
    const nid = store.update((s, now) => startSession(s, now, { kind: 'mistakes', title: 'Poprawa błędów z sesji', units: totals.wrong }));
    navigate(`/session/${nid}`);
  };

  const passed = level && ratio >= level.passRatio;
  const headline = diag ? 'Diagnoza gotowa!' : level ? (passed ? (ratio >= level.masterRatio ? 'Poziom opanowany!' : 'Poziom zaliczony!') : 'Prawie!') : good ? 'Lekcja ukończona!' : 'Koniec lekcji';
  const sub = level
    ? passed ? 'Następny poziom na mapie jest odblokowany.' : `Do zaliczenia potrzebujesz ${pct(level.passRatio)}. ${lp?.completedAt ? 'Ten poziom masz już zaliczony.' : 'Przejrzyj błędy i spróbuj jeszcze raz.'}`
    : `Wynik: ${totals.points}/${totals.max}`;

  return (
    <div className="celebrate">
      <div className="celebrate-body">
        <div className={`trophy ${good || diag ? '' : 'meh'}`} aria-hidden="true">
          <span className="disc" />
          {(good || diag) && SPARKS.map((p, i) => <span key={i} className="spark" style={{ '--dx': p.dx, '--dy': p.dy, '--c': p.c } as Record<string, string>} />)}
          <Icon name={good || diag ? 'star' : 'check'} size={64} />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{headline}</h1>
          <p className="muted" style={{ margin: '0.3rem 0 0' }}>{sub}</p>
        </div>
        <div className="score-cards">
          <div className="score-card" style={{ '--sc': 'var(--marker-strong)', '--i': 0 } as Record<string, string | number>}><div className="h">XP</div><div className="v">+{xp}</div></div>
          <div className="score-card" style={{ '--sc': good ? 'var(--good)' : 'var(--bad)', '--i': 1 } as Record<string, string | number>}><div className="h">Wynik</div><div className="v">{pctV}%</div></div>
          <div className="score-card" style={{ '--sc': 'var(--ink)', '--i': 2 } as Record<string, string | number>}><div className="h">Poprawne</div><div className="v">{totals.points}/{totals.max}</div></div>
        </div>
        {totals.wrong.length > 0 && <TagHints units={totals.wrong} />}

        {diag && (
          <section className="card details" aria-labelledby="diag">
            <button className="btn flat sm" style={{ padding: 0 }} onClick={() => setShowDiag(!showDiag)} aria-expanded={showDiag}><h2 id="diag" style={{ margin: 0 }}>Twój profil startowy</h2></button>
            {showDiag && <>
              <p className="small muted">To wstępne oszacowanie na podstawie kilkunastu pytań – nie jest to wynik matury ani poziom CEFR.</p>
              {Object.entries(diag.bySkill).map(([k, v]) => (
                <div className="skillrow" key={k}>
                  <span>{SKILL_NAMES[k] ?? k}</span><span className="small">{v.correct}/{v.total}</span>
                  <Progress value={v.correct} max={v.total} label={SKILL_NAMES[k] ?? k} />
                </div>
              ))}
              {diag.strongest.length > 0 && <p><strong>Mocne strony:</strong> {diag.strongest.map((k) => SKILL_NAMES[k] ?? k).join(', ')}</p>}
              {diag.weakest.length > 0 && <p><strong>Do pracy:</strong> {diag.weakest.map((k) => SKILL_NAMES[k] ?? k).join(', ')}</p>}
              {diag.uncertain.length > 0 && <p className="small muted">Za mało pytań, by ocenić: {diag.uncertain.map((k) => SKILL_NAMES[k] ?? k).join(', ')}.</p>}
            </>}
          </section>
        )}
      </div>
      <div className="lesson-foot">
        <div className="lesson-foot-in">
          {totals.wrong.length > 0 && <button className="btn quiet" onClick={retry}>Popraw błędy ({totals.wrong.length})</button>}
          {session.levelId ? <Link className="btn" to="/map">Dalej</Link> : <Link className="btn" to="/">Dalej</Link>}
        </div>
      </div>
    </div>
  );
}

function TagHints({ units }: { units: string[] }) {
  const tags = new Map<string, number>();
  for (const u of units) {
    const [g, i] = u.split('#');
    const item = resolveUnit(`${g}#${i}`)?.items[0];
    if (item?.tag) tags.set(item.tag, (tags.get(item.tag) ?? 0) + 1);
  }
  if (!tags.size) return null;
  return <p className="small muted" style={{ margin: 0 }}>Do powtórki: {[...tags.keys()].map(tagName).join(', ')}.</p>;
}

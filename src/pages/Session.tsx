import { useEffect, useMemo, useRef, useState } from 'react';
import { tone } from '../audio/speech';
import { FORMATS, SKILL_NAMES } from '../content/formats';
import { scoreGroup } from '../engine/validate';
import { getLevel } from '../game/map';
import { tagName } from '../game/analytics';
import { navigate, useRoute, Link } from '../router/router';
import { finishSession, resolveUnit, setAnswer, startSession, submitUnit, type SessionSummary } from '../store/actions';
import type { PracticeSession } from '../store/types';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { Dialog, EmptyState, pct, Progress, showReward } from '../ui/components/ui';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';
import { GroupView } from '../ui/exercises/GroupView';

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

function Runner({ id }: { id: string }) {
  const state = useAppState();
  const store = useStore();
  const s = state.sessions[id];
  const firstOpen = s ? Math.max(0, s.units.findIndex((u) => !s.submitted.includes(u))) : 0;
  const [idx, setIdx] = useState(s && s.submitted.length === s.units.length ? s.units.length - 1 : firstOpen);
  const [confirm, setConfirm] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [transcriptMode, setTranscriptMode] = useState<Record<string, boolean>>(s?.listeningFallback ?? {});
  const busy = useRef(false);
  const [cooldown, setCooldown] = useState(false);
  const avail = useAudioAvailability();

  if (!s) {
    return <EmptyState title="Nie znaleziono sesji" action={<Link className="btn" to="/practice">Wybierz ćwiczenia</Link>}>Ta sesja została usunięta lub pochodzi z innego urządzenia.</EmptyState>;
  }
  if (!s.units.length) {
    return <EmptyState title="Brak zadań" action={<Link className="btn" to="/practice">Wróć do ćwiczeń</Link>}>Dla wybranych filtrów nie ma dostępnych zadań.</EmptyState>;
  }
  if (s.finishedAt) return <Summary session={s} summary={summary} />;

  const unit = s.units[Math.min(idx, s.units.length - 1)];
  const group = resolveUnit(unit);
  if (!group) {
    return <EmptyState title="Zadanie niedostępne" action={<button className="btn" onClick={() => setIdx(idx + 1)}>Pomiń</button>}>To zadanie zostało zmienione w nowej wersji treści i nie może być ocenione.</EmptyState>;
  }
  const submitted = s.submitted.includes(unit);
  const results = submitted ? scoreGroup(group, s.answers).results : undefined;
  const isListening = FORMATS[group.format].section === 'listening';
  const needsFallback = isListening && avail !== 'ready' && avail !== 'checking' && !group.items.some((i) => i.audio?.url);
  const unanswered = group.items.filter((i) => !(s.answers[i.id] ?? '').trim()).length;
  const isLast = idx >= s.units.length - 1;

  const doSubmit = () => {
    if (busy.current) return;
    busy.current = true;
    const out = store.update((st, now) => submitUnit(st, now, id, unit, { transcript: !!transcriptMode[unit] }));
    busy.current = false;
    setConfirm(false);
    // briefly disable the button that replaces "Sprawdź" so a double tap can't skip the feedback
    setCooldown(true);
    setTimeout(() => setCooldown(false), 500);
    if (out && !out.already) {
      if (state.settings.sound) tone(out.points === out.max ? 'good' : 'bad');
      showReward(out.reward);
    }
  };
  const onCheck = () => (unanswered ? setConfirm(true) : doSubmit());
  const onNext = () => {
    if (!isLast) {
      setIdx(idx + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const sum = store.update((st, now) => finishSession(st, now, id));
    if (sum) {
      setSummary(sum);
      showReward(sum.reward);
    }
  };

  return (
    <div>
      <div className="ex-head">
        <Link to="/" className="btn quiet sm" aria-label="Przerwij i wróć na start (postęp zostanie zapisany)"><Icon name="back" size={18} /></Link>
        <Progress value={s.submitted.length} max={s.units.length} label="Postęp sesji" />
        <span className="small muted">{Math.min(idx + 1, s.units.length)}/{s.units.length}</span>
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>{s.title}{s.kind === 'diagnostic' ? ' · test diagnostyczny' : ''}</p>

      {needsFallback && !submitted && (
        <div className="notice" style={{ marginBottom: '0.8rem' }}>
          <p><strong>Nie możemy odtworzyć nagrania w tej przeglądarce.</strong> Możesz przeczytać transkrypcję, ale wtedy to ćwiczenie sprawdza czytanie, a nie słuchanie – wynik nie będzie liczony do umiejętności „Słuchanie”.</p>
          {!transcriptMode[unit] && <button className="btn sm ghost" onClick={() => setTranscriptMode({ ...transcriptMode, [unit]: true })}>Pokaż transkrypcję</button>}
        </div>
      )}

      <GroupView
        group={group}
        answers={s.answers}
        onAnswer={(itemId, v) => store.update((st) => setAnswer(st, id, itemId, v))}
        results={results}
        audio={{ rate: state.settings.speechRate }}
        showTranscript={submitted || !!transcriptMode[unit]}
      />

      <div className="actionbar">
        {!submitted ? (
          <button className="btn" onClick={onCheck}>Sprawdź</button>
        ) : (
          <button className="btn" onClick={onNext} disabled={cooldown}>{isLast ? 'Zakończ i zobacz wynik' : 'Dalej'}</button>
        )}
      </div>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Puste odpowiedzi"
        actions={<>
          <button className="btn quiet" onClick={() => setConfirm(false)}>Wróć do zadania</button>
          <button className="btn" onClick={doSubmit}>Sprawdź mimo to</button>
        </>}
      >
        <p>Nie odpowiedziałeś/odpowiedziałaś na {unanswered} {unanswered === 1 ? 'pytanie' : 'pytania'}. Puste odpowiedzi liczą się jako błędne i trafią do zeszytu błędów.</p>
      </Dialog>
    </div>
  );
}

function Summary({ session, summary }: { session: PracticeSession; summary: SessionSummary | null }) {
  const state = useAppState();
  const store = useStore();
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

  const retry = () => {
    const nid = store.update((s, now) => startSession(s, now, { kind: 'mistakes', title: 'Poprawa błędów z sesji', units: totals.wrong }));
    navigate(`/session/${nid}`);
  };

  return (
    <div className="stack">
      <section className="card hero">
        <h1>Wynik: {totals.points}/{totals.max}</h1>
        <Progress value={ratio} label="Wynik sesji" tone={ratio >= 0.7 ? 'good' : undefined} />
        <p style={{ marginTop: '0.6rem' }}>{pct(ratio)} poprawnych odpowiedzi.</p>
        {level && (
          ratio >= level.passRatio
            ? <div className="notice good">{ratio >= level.masterRatio ? 'Poziom opanowany po mistrzowsku! ' : 'Poziom zaliczony! '}Następny poziom na mapie jest odblokowany.</div>
            : <div className="notice">Do zaliczenia poziomu potrzebujesz {pct(level.passRatio)}. {lp?.completedAt ? 'Ten poziom masz już zaliczony wcześniej.' : 'Przejrzyj wyjaśnienia i spróbuj jeszcze raz.'}</div>
        )}
        {summary?.reward && summary.reward.xp > 0 && <p style={{ marginTop: '0.6rem' }}>Za ukończenie: <span className="hl">+{summary.reward.xp} XP</span></p>}
      </section>

      {diag && (
        <section className="card" aria-labelledby="diag">
          <h2 id="diag">Twój profil startowy</h2>
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
          <h3>Plan na start</h3>
          <ol className="points-list">
            {diag.weakest.includes('grammar') && <li>Las Gramatyki na mapie – po jednym poziomie dziennie.</li>}
            {diag.weakest.includes('listening') && <li>Port Słuchania – krótkie nagrania, słuchaj dwa razy jak na maturze.</li>}
            {diag.weakest.includes('reading') && <li>Biblioteka – zwracaj uwagę na słowa-klucze w pytaniach.</li>}
            {(diag.weakest.includes('vocabulary') || diag.weakest.includes('functions')) && <li>Codziennie 10 fiszek i Miasto Komunikacji.</li>}
            <li>Raz w tygodniu wypowiedź pisemna (100–150 wyrazów).</li>
            <li>Gdy przejdziesz Arenę Egzaminacyjną – pełny arkusz próbny.</li>
          </ol>
        </section>
      )}

      {totals.wrong.length > 0 && (
        <section className="card">
          <h2>Błędy z tej sesji</h2>
          <p>{totals.wrong.length} {totals.wrong.length === 1 ? 'pozycja trafiła' : 'pozycji trafiło'} do zeszytu błędów. Najlepiej poprawić je od razu, póki pamiętasz wyjaśnienia.</p>
          <TagHints units={totals.wrong} />
          <button className="btn ghost" onClick={retry}>Popraw błędy teraz</button>
        </section>
      )}

      <div className="row">
        {session.levelId ? <Link className="btn" to="/map">Wróć do mapy</Link> : <Link className="btn" to="/practice">Więcej ćwiczeń</Link>}
        <Link className="btn quiet" to="/">Start</Link>
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
  return <p className="small">Tematy do powtórki: {[...tags.keys()].map(tagName).join(', ')}.</p>;
}

import { useEffect, useRef, useState } from 'react';
import { getGroup, getPrompt } from '../content';
import { SECTION_NAMES } from '../content/formats';
import { BLUEPRINT_PP_2025 } from '../exam/blueprint';
import { navigate, Link } from '../router/router';
import { registerPlay, setExamAnswer, setExamWriting, submitExam } from '../store/actions';
import type { ExamSession } from '../store/types';
import { useAppState, useStore } from '../store/useStore';
import { Dialog, EmptyState, showReward } from '../ui/components/ui';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';
import { GroupView } from '../ui/exercises/GroupView';
import { WritingEditor } from '../ui/exercises/WritingEditor';

function fmt(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function unansweredBySlot(e: ExamSession) {
  return e.exam.slots.map((s) => {
    if (s.promptId) return { slot: s, missing: (e.writing[s.promptId] ?? '').trim() ? 0 : 1, total: 1 };
    const g = getGroup(s.groupId!);
    const items = g?.items ?? [];
    return { slot: s, missing: items.filter((i) => !(e.answers[i.id] ?? '').trim()).length, total: items.length };
  });
}

export default function ExamRun({ id }: { id: string }) {
  const state = useAppState();
  const store = useStore();
  const e = state.exams[id];
  const [now, setNow] = useState(store.now());
  const [idx, setIdx] = useState(0);
  const [nav, setNav] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const submitting = useRef(false);
  const avail = useAudioAvailability();

  const submit = () => {
    if (submitting.current) return;
    submitting.current = true;
    const r = store.update((s, n) => submitExam(s, n, id));
    showReward(r);
    navigate(`/exam/${id}/results`, { replace: true });
  };

  useEffect(() => {
    const t = setInterval(() => setNow(store.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = e ? e.deadline - now : 0;
  useEffect(() => {
    if (e && !e.submittedAt && remaining <= 0 && e.autoSubmit) submit();
  }, [remaining <= 0]);

  if (!e) return <EmptyState title="Nie znaleziono arkusza" action={<Link className="btn" to="/exam">Wróć</Link>}>Ten arkusz został usunięty lub pochodzi z innego urządzenia.</EmptyState>;
  if (e.submittedAt) {
    return <EmptyState title="Arkusz oddany" action={<Link className="btn" to={`/exam/${id}/results`}>Zobacz wynik</Link>}>Ten arkusz jest już oceniony.</EmptyState>;
  }

  const slot = e.exam.slots[idx];
  const status = unansweredBySlot(e);
  const missingTotal = status.reduce((s, x) => s + x.missing, 0);
  const group = slot.groupId ? getGroup(slot.groupId) : undefined;
  const prompt = slot.promptId ? getPrompt(slot.promptId) : undefined;
  const audioBroken = avail !== 'ready' && avail !== 'checking';

  return (
    <div>
      <div className="topbar" style={{ margin: '-1rem -1rem 1rem', position: 'sticky' }}>
        <button className="btn quiet sm" onClick={() => setNav(true)} aria-haspopup="dialog">Spis zadań</button>
        <span className="spacer" />
        <span className={`timer ${remaining < 10 * 60_000 ? 'low' : ''}`} role="timer" aria-label={`Pozostały czas ${fmt(remaining)}`}>{fmt(remaining)}</span>
        <button className="btn sm" onClick={() => setConfirm(true)}>Oddaj</button>
      </div>

      {remaining <= 0 && !e.autoSubmit && <div className="notice bad" role="alert" style={{ marginBottom: '0.8rem' }}>Czas minął. Na prawdziwym egzaminie nie mógłbyś/mogłabyś już pisać – oddaj arkusz.</div>}

      <p className="small muted" style={{ margin: 0 }}>{slot.slot.label} z 12 · {SECTION_NAMES[slot.slot.section]} · {slot.slot.items} pkt</p>

      {slot.slot.section === 'listening' && audioBroken && <div className="notice bad" style={{ margin: '0.6rem 0' }}>Nagrania są niedostępne w tej przeglądarce, więc tej części nie da się rzetelnie rozwiązać.</div>}

      {group && (
        <GroupView
          group={group}
          answers={e.answers}
          onAnswer={(itemId, v) => store.update((s) => setExamAnswer(s, id, itemId, v))}
          audio={{ rate: state.settings.speechRate, maxPlays: BLUEPRINT_PP_2025.audioPlays, plays: e.plays, onPlay: (clipId) => store.update((s) => registerPlay(s, id, clipId)) }}
          examMode
        />
      )}
      {prompt && (
        <>
          <h2 style={{ marginTop: '0.6rem' }}>Wypowiedź pisemna</h2>
          <WritingEditor prompt={prompt} value={e.writing[prompt.id] ?? ''} onChange={(v) => store.update((s) => setExamWriting(s, id, prompt.id, v))} />
        </>
      )}

      <div className="actionbar">
        <button className="btn quiet" onClick={() => { setIdx(Math.max(0, idx - 1)); window.scrollTo({ top: 0 }); }} disabled={idx === 0}>Poprzednie</button>
        {idx < e.exam.slots.length - 1
          ? <button className="btn" onClick={() => { setIdx(idx + 1); window.scrollTo({ top: 0 }); }}>Następne</button>
          : <button className="btn" onClick={() => setConfirm(true)}>Oddaj arkusz</button>}
      </div>

      <Dialog open={nav} onClose={() => setNav(false)} title="Spis zadań" actions={<button className="btn quiet" onClick={() => setNav(false)}>Zamknij</button>}>
        <div className="nav-grid">
          {status.map((st, i) => (
            <button key={st.slot.slot.id} className={`nav-cell ${st.missing === 0 ? 'complete' : ''} ${i === idx ? 'current' : ''}`} onClick={() => { setIdx(i); setNav(false); window.scrollTo({ top: 0 }); }} aria-label={`${st.slot.slot.label}: ${st.missing === 0 ? 'wszystko uzupełnione' : `brak ${st.missing} odpowiedzi`}`}>
              {i + 1}
              <small>{st.missing === 0 ? 'gotowe' : `${st.total - st.missing}/${st.total}`}</small>
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Oddać arkusz?" actions={<>
        <button className="btn quiet" onClick={() => setConfirm(false)}>Wróć do zadań</button>
        <button className="btn" onClick={submit}>Oddaj i sprawdź</button>
      </>}>
        {missingTotal > 0 ? (
          <>
            <p>Brakuje odpowiedzi w tych zadaniach:</p>
            <ul className="points-list">
              {status.filter((s) => s.missing).map((s) => <li key={s.slot.slot.id}>{s.slot.slot.label}: {s.slot.promptId ? 'pusta wypowiedź pisemna' : `${s.missing} z ${s.total}`}</li>)}
            </ul>
          </>
        ) : <p>Wszystkie odpowiedzi są uzupełnione.</p>}
        <p className="small muted">Po oddaniu nie można już zmieniać odpowiedzi.</p>
      </Dialog>
    </div>
  );
}

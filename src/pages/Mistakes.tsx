import { useState } from 'react';
import { getItem } from '../content';
import { SKILL_NAMES } from '../content/formats';
import { correctAnswerText } from '../engine/validate';
import { Link, navigate } from '../router/router';
import { clearHistory, setMistakeMastered, startSession, today } from '../store/actions';
import type { MistakeEntry } from '../store/types';
import { useAppState, useStore } from '../store/useStore';
import { Dialog, EmptyState } from '../ui/components/ui';

const ORDER = ['listening', 'reading', 'grammar', 'vocabulary', 'functions', 'writing'];

export default function Mistakes() {
  const state = useAppState();
  const store = useStore();
  const [view, setView] = useState<'open' | 'mastered'>('open');
  const [clear, setClear] = useState(false);
  const t = today(state, store.now());
  const all = Object.values(state.mistakes).filter((m) => getItem(m.itemId));
  const list = all.filter((m) => (view === 'open' ? !m.mastered : m.mastered));
  const due = all.filter((m) => !m.mastered && m.card.due <= t);

  const practice = (entries: MistakeEntry[], title: string) => {
    const units = entries.slice(0, 12).map((m) => `${m.groupId}#${m.itemId}`);
    const id = store.update((s, now) => startSession(s, now, { kind: 'mistakes', title, units }));
    navigate(`/session/${id}`);
  };
  const similar = (m: MistakeEntry) => {
    const id = store.update((s, now) => startSession(s, now, { kind: 'practice', title: 'Podobne zadanie', units: [m.groupId] }));
    navigate(`/session/${id}`);
  };

  return (
    <div className="stack">
      <h1>Zeszyt błędów</h1>
      <p className="muted">Tu trafia każda błędna lub pusta odpowiedź. Pozycja jest opanowana, gdy odpowiesz poprawnie dwa razy w powtórce. Powtórki planujemy w rosnących odstępach (1, 3, 7… dni).</p>
      {all.length > 0 && (
        <div className="card">
          <p style={{ marginTop: 0 }}><strong>{due.length}</strong> do powtórki dziś · {all.filter((m) => !m.mastered).length} otwartych · {all.filter((m) => m.mastered).length} opanowanych</p>
          <div className="row">
            <button className="btn" disabled={!due.length} onClick={() => practice(due, 'Powtórka błędów')}>Powtórz należne ({Math.min(due.length, 12)})</button>
            <button className="btn quiet" disabled={!all.some((m) => !m.mastered)} onClick={() => practice(all.filter((m) => !m.mastered).sort((a, b) => b.count - a.count), 'Najczęstsze błędy')}>Najczęstsze błędy</button>
          </div>
        </div>
      )}
      <div className="row" role="tablist" aria-label="Widok">
        <button role="tab" aria-selected={view === 'open'} className={`btn sm ${view === 'open' ? '' : 'quiet'}`} onClick={() => setView('open')}>Do poprawy</button>
        <button role="tab" aria-selected={view === 'mastered'} className={`btn sm ${view === 'mastered' ? '' : 'quiet'}`} onClick={() => setView('mastered')}>Opanowane</button>
      </div>
      {list.length === 0 ? (
        <EmptyState title={view === 'open' ? 'Brak błędów do poprawy' : 'Nic jeszcze nie opanowano'} action={<Link className="btn" to="/practice">Poćwicz</Link>}>
          {view === 'open' ? 'Gdy pomylisz się w zadaniu, zobaczysz je tutaj razem z wyjaśnieniem.' : 'Popraw błędy w powtórce, a trafią tutaj.'}
        </EmptyState>
      ) : (
        ORDER.filter((sk) => list.some((m) => m.skill === sk)).map((sk) => (
          <section key={sk}>
            <h2 className="section-title">{SKILL_NAMES[sk]}</h2>
            {list.filter((m) => m.skill === sk).sort((a, b) => b.lastTs - a.lastTs).map((m) => {
              const found = getItem(m.itemId)!;
              const { group, item } = found;
              const preview = (item.prompt ?? item.text?.body ?? (item.kind === 'open' ? item.before : undefined) ?? group.title).split('\n')[0];
              return (
                <div className="card" key={m.itemId}>
                  <p lang="en" style={{ marginTop: 0 }}><strong>{preview.length > 120 ? `${preview.slice(0, 120)}…` : preview}</strong></p>
                  <p className="small" style={{ margin: 0 }}>Twoja odpowiedź: <span lang="en">{m.lastGiven || '(brak)'}</span> · Poprawnie: <strong lang="en">{correctAnswerText(group, item)}</strong></p>
                  <p className="small muted" style={{ margin: '0.2rem 0' }}>Pomyłki: {m.count} · {m.mastered ? 'opanowane' : m.card.due <= t ? 'powtórka dziś' : `powtórka ${m.card.due}`}</p>
                  <details><summary className="small">Wyjaśnienie</summary><p className="small">{item.explanationPl}</p></details>
                  <div className="row" style={{ marginTop: '0.4rem' }}>
                    <button className="btn sm ghost" onClick={() => practice([m], 'Poprawa błędu')}>Spróbuj ponownie</button>
                    <button className="btn sm quiet" onClick={() => similar(m)}>Całe zadanie</button>
                    <button className="btn sm quiet" onClick={() => store.update((s) => setMistakeMastered(s, m.itemId, !m.mastered))}>{m.mastered ? 'Przywróć' : 'Oznacz jako opanowane'}</button>
                  </div>
                </div>
              );
            })}
          </section>
        ))
      )}
      {all.length > 0 && <button className="btn quiet sm" onClick={() => setClear(true)}>Wyczyść zeszyt błędów</button>}
      <Dialog open={clear} onClose={() => setClear(false)} title="Wyczyścić zeszyt błędów?" actions={<>
        <button className="btn quiet" onClick={() => setClear(false)}>Anuluj</button>
        <button className="btn danger" onClick={() => { store.update((s, n) => clearHistory(s, 'mistakes', n)); setClear(false); }}>Wyczyść</button>
      </>}>
        <p>Usuniemy wszystkie zapisane błędy. Statystyki i XP zostaną.</p>
      </Dialog>
    </div>
  );
}

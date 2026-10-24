import { useMemo, useState } from 'react';
import { speakWord } from '../audio/speech';
import { vocab } from '../content';
import { VOCAB_TOPICS } from '../content/data/vocab';
import type { VocabEntry } from '../content/types';
import { isDue } from '../game/srs';
import { markVocabKnown, reviewVocab, today } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { EmptyState, showReward } from '../ui/components/ui';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';

export default function Vocab() {
  const state = useAppState();
  const store = useStore();
  const t = today(state, store.now());
  const [topic, setTopic] = useState<string>('');
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [total, setTotal] = useState(0);
  const avail = useAudioAvailability();

  const pool = vocab.filter((v) => !topic || v.topic === topic);
  const due = pool.filter((v) => state.vocab[v.id] && !state.vocab[v.id].known && isDue(state.vocab[v.id], t));
  const fresh = pool.filter((v) => !state.vocab[v.id]);
  const known = pool.filter((v) => state.vocab[v.id]?.known).length;
  const learned = pool.filter((v) => (state.vocab[v.id]?.reps ?? 0) >= 2).length;

  const startReview = () => {
    const q = [...due, ...fresh.slice(0, Math.max(0, 10 - due.length))].slice(0, 15).map((v) => v.id);
    setQueue(q);
    setTotal(q.length);
    setRevealed(false);
    setReviewed(0);
  };

  const current = useMemo(() => (queue?.length ? vocab.find((v) => v.id === queue[0]) : undefined), [queue]);

  const grade = (g: 0 | 3 | 4 | 5) => {
    if (!current || !queue) return;
    const r = store.update((s, now) => reviewVocab(s, now, current.id, g));
    showReward(r.questsDone.length || r.achievements.length || r.levelUp ? r : undefined);
    setReviewed(reviewed + 1);
    // a forgotten card comes back later in the same session
    const rest = queue.slice(1);
    setQueue(g === 0 ? [...rest, current.id] : rest);
    setRevealed(false);
  };

  if (queue) {
    if (!current) {
      return (
        <div className="vocab-run" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="trophy" style={{ margin: '0 auto' }} aria-hidden="true"><span className="disc" /><Icon name="star" size={64} /></div>
          <h1>Koniec powtórki!</h1>
          <p className="muted">Powtórzone fiszki: {reviewed}. Kolejne wrócą wtedy, gdy zaczniesz je zapominać.</p>
          <button className="btn block" onClick={() => setQueue(null)}>Dalej</button>
        </div>
      );
    }
    const left = queue.length;
    return (
      <div className="vocab-run">
        <div className="vocab-top">
          <button className="btn flat icon" onClick={() => setQueue(null)} aria-label="Zakończ powtórkę"><Icon name="cross" size={24} /></button>
          <div className="progress" role="progressbar" aria-label="Postęp powtórki" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.max(0, total - left)}><span style={{ width: `${total ? ((total - Math.min(total, left)) / total) * 100 : 0}%` }} /></div>
          <span className="small muted" aria-label={`Zostało: ${left}`}>{left}</span>
        </div>
        <Flashcard key={current.id} entry={current} revealed={revealed} onReveal={() => setRevealed(true)} canSpeak={avail === 'ready'} />
        {revealed ? (
          <div className="grades" role="group" aria-label="Jak dobrze pamiętasz?">
            <button className="btn bad" onClick={() => grade(0)}>Nie pamiętam</button>
            <button className="btn quiet" onClick={() => grade(3)}>Trudne</button>
            <button className="btn quiet" onClick={() => grade(4)}>Dobrze</button>
            <button className="btn good" onClick={() => grade(5)}>Łatwe</button>
          </div>
        ) : (
          <button className="btn block" onClick={() => setRevealed(true)}>Pokaż tłumaczenie</button>
        )}
        <button className="btn flat sm" onClick={() => { store.update((s, n) => markVocabKnown(s, current.id, true, n)); setQueue(queue.slice(1)); setRevealed(false); }}>Znam to – nie pokazuj więcej</button>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>Słówka</h1>
      <p className="muted" style={{ marginTop: '-0.3rem' }}>Fiszki wracają tuż zanim zdążysz je zapomnieć.</p>
      <label className="setting">
        <span>Dział</span>
        <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Wszystkie działy</option>
          {Object.entries(VOCAB_TOPICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <div className="card">
        <div className="score-cards" style={{ marginBottom: '0.9rem' }}>
          <div className="score-card" style={{ '--sc': 'var(--bad)', '--i': 0 } as Record<string, string | number>}><div className="h">Do powtórki</div><div className="v">{due.length}</div></div>
          <div className="score-card" style={{ '--sc': 'var(--ink)', '--i': 1 } as Record<string, string | number>}><div className="h">Nowe</div><div className="v">{fresh.length}</div></div>
          <div className="score-card" style={{ '--sc': 'var(--good)', '--i': 2 } as Record<string, string | number>}><div className="h">Utrwalone</div><div className="v">{learned + known}</div></div>
        </div>
        <button className="btn block" onClick={startReview} disabled={!due.length && !fresh.length}>{due.length ? 'Zacznij powtórkę' : 'Ucz się nowych słówek'}</button>
      </div>
      {pool.length === 0 ? <EmptyState title="Brak słówek">W tym dziale nie ma jeszcze słówek.</EmptyState> : (
        <details className="card">
          <summary>Lista słówek ({pool.length})</summary>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
            {pool.map((v) => (
              <li key={v.id} style={{ padding: '0.4rem 0', borderBottom: '1px dashed var(--line)' }}>
                <strong lang="en">{v.en}</strong> – {v.pl} <span className="small muted">({v.level})</span>
                {state.vocab[v.id]?.known && <span className="badge good" style={{ marginLeft: 6 }}>znane</span>}
                <div className="small muted" lang="en">{v.example}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Flashcard({ entry, revealed, onReveal, canSpeak }: { entry: VocabEntry; revealed: boolean; onReveal: () => void; canSpeak: boolean }) {
  return (
    <div className="flash-wrap">
      <div className={`flash ${revealed ? 'flipped' : ''}`} onClick={onReveal} role="button" tabIndex={0} aria-label={revealed ? `${entry.en}: ${entry.pl}` : `${entry.en}. Dotknij, aby zobaczyć tłumaczenie`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onReveal()}>
        <div className="face" aria-hidden={revealed}>
          <span className="badge">{VOCAB_TOPICS[entry.topic]}</span>
          <div className="word" lang="en">{entry.en}</div>
          {canSpeak && (
            <button className="btn quiet sm" onClick={(e) => { e.stopPropagation(); speakWord(entry.en); }} aria-label={`Wymowa: ${entry.en}`}><Icon name="speaker" size={18} /> Wymowa</button>
          )}
          <span className="small muted">Dotknij, aby odwrócić</span>
        </div>
        <div className="face back" aria-hidden={!revealed}>
          <div className="word" lang="en" style={{ fontSize: '1.5rem' }}>{entry.en}</div>
          <div className="pl">{entry.pl}</div>
          <div className="ex" lang="en">{entry.example}</div>
          {canSpeak && (
            <button className="btn quiet sm" onClick={(e) => { e.stopPropagation(); speakWord(entry.example); }} aria-label={`Przeczytaj przykład: ${entry.example}`}><Icon name="speaker" size={18} /> Przykład</button>
          )}
        </div>
      </div>
    </div>
  );
}

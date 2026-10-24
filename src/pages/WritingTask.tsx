import { useState } from 'react';
import { getPrompt } from '../content';
import type { WritingPrompt } from '../content/types';
import type { WritingAssessment } from '../engine/writing';
import { Link } from '../router/router';
import { saveDraft, submitWriting } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { EmptyState, showReward } from '../ui/components/ui';
import { WritingEditor } from '../ui/exercises/WritingEditor';

type Self = Record<string, 'missing' | 'addressed' | 'developed'>;

const STATUS_PL = { missing: 'brak', addressed: 'odniesiono się', developed: 'rozwinięty' } as const;

export default function WritingTask({ id }: { id: string }) {
  const state = useAppState();
  const store = useStore();
  const prompt = getPrompt(id);
  const [assessment, setAssessment] = useState<WritingAssessment | null>(null);
  const [submittedText, setSubmittedText] = useState('');
  const [self, setSelf] = useState<Self>({});
  const [useSelf, setUseSelf] = useState(false);
  if (!prompt) return <EmptyState title="Nie ma takiego tematu" action={<Link className="btn" to="/writing">Wszystkie tematy</Link>}>Ten temat nie istnieje w bieżącej wersji treści.</EmptyState>;
  const text = state.writing.drafts[id] ?? '';
  const history = state.writing.history.filter((h) => h.promptId === id).slice(-5).reverse();

  const submit = () => {
    const out = store.update((s, now) => submitWriting(s, now, id, text, useSelf ? self : undefined));
    if (out) {
      setAssessment(out.assessment);
      setSubmittedText(text);
      showReward(out.reward);
      setTimeout(() => document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className="stack">
      <Link to="/writing" className="small">← Wszystkie tematy</Link>
      <h1>Wypowiedź pisemna</h1>
      <WritingEditor prompt={prompt} value={text} onChange={(v) => store.update((s) => saveDraft(s, id, v))} />
      <p className="small muted">Tekst zapisuje się automatycznie na tym urządzeniu.</p>

      <details className="card">
        <summary>Przydatne zwroty</summary>
        <ul className="points-list" lang="en">{prompt.usefulPhrases.map((p) => <li key={p}>{p}</li>)}</ul>
      </details>

      <details className="card" open={useSelf} onToggle={(e) => setUseSelf((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Oceń sam/sama realizację podpunktów (opcjonalnie)</summary>
        <p className="small">Program rozpoznaje podpunkty po słowach-kluczach i może się pomylić. Jeśli wiesz lepiej, zaznacz, jak zrealizowałeś/zrealizowałaś każdy podpunkt – wtedy ocena treści użyje Twojej odpowiedzi. „Rozwinięty” oznacza co najmniej trzy proste odniesienia albo jedno–dwa bardziej szczegółowe.</p>
        {prompt.points.map((p, i) => (
          <label key={p.id} className="setting">
            <span>{i + 1}. {p.textPl}</span>
            <select className="input" value={self[p.id] ?? ''} onChange={(e) => setSelf({ ...self, [p.id]: e.target.value as Self[string] })} aria-label={`Podpunkt ${i + 1}`}>
              <option value="">automatycznie</option>
              <option value="missing">brak</option>
              <option value="addressed">odniosłem/am się</option>
              <option value="developed">rozwinąłem/ęłam</option>
            </select>
          </label>
        ))}
      </details>

      <button className="btn block" onClick={submit} disabled={!text.trim()}>{assessment ? 'Oceń ponownie' : 'Oceń moją wypowiedź'}</button>
      {!text.trim() && <p className="small muted" style={{ margin: 0 }}>Napisz coś, żeby otrzymać ocenę.</p>}

      {assessment && <div id="feedback"><WritingFeedback prompt={prompt} assessment={assessment} text={submittedText} /></div>}

      {history.length > 0 && (
        <section className="card">
          <h2>Twoje próby</h2>
          {history.map((h) => (
            <div className="row between" key={h.id} style={{ padding: '0.3rem 0', borderBottom: '1px dashed var(--line)' }}>
              <span>{new Date(h.ts).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {h.words} wyrazów</span>
              <strong>ok. {h.range[0]}–{h.range[1]}/12</strong>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export function WritingFeedback({ prompt, assessment: a, text }: { prompt: WritingPrompt; assessment: WritingAssessment; text: string }) {
  const rows: [string, number, number, string][] = [
    ['Treść', a.estimate.content, 5, `Odniesiono się do ${a.points.filter((p) => p.status !== 'missing').length} z 4 podpunktów, rozwinięto ${a.points.filter((p) => p.status === 'developed').length}.`],
    ['Spójność i logika wypowiedzi', a.estimate.coherence, 2, a.connectorsUsed.length ? `Wyrażenia łączące: ${a.connectorsUsed.slice(0, 8).join(', ')}.` : 'Brak wyrażeń łączących zdania.'],
    ['Zakres środków językowych', a.estimate.range, 3, a.structures.length ? `Struktury: ${a.structures.join(', ')}.` : 'Głównie proste struktury.'],
    ['Poprawność środków językowych', a.estimate.accuracy, 2, a.errors.length ? `Wykryte typowe błędy: ${a.errors.length}.` : 'Nie wykryto typowych błędów (to nie znaczy, że ich nie ma).'],
  ];
  return (
    <section className="card" aria-labelledby="fb-title">
      <span className="badge extra">Ocena automatyczna – orientacyjna</span>
      <h2 id="fb-title" style={{ marginTop: '0.5rem' }}>Szacunek: {a.range[0]}–{a.range[1]} / 12 pkt</h2>
      <p className="small muted">Program liczy według kryteriów i zasad CKE (tabela treści, próg 80 wyrazów, ograniczenia przy niskiej treści), ale nie rozumie tekstu jak egzaminator. Traktuj wynik jako wskazówkę, nie jako ocenę egzaminacyjną.</p>
      <p>Liczba wyrazów: <strong>{a.words}</strong>{a.wordStatus === 'too-short-to-score' ? ' – poniżej 80, więc oceniona jest tylko treść.' : a.wordStatus === 'below-range' ? ' – poniżej zalecanych 100.' : a.wordStatus === 'above-range' ? ' – powyżej 150.' : ' – w zalecanym zakresie.'}</p>
      <table className="criteria">
        <thead><tr><th>Kryterium</th><th>Punkty</th></tr></thead>
        <tbody>
          {rows.map(([n, v, max, why]) => (
            <tr key={n}><td><strong>{n}</strong><div className="small muted">{why}</div></td><td>{v}/{max}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '1rem' }}>Podpunkty polecenia</h3>
      <ul className="points-list">
        {a.points.map((p, i) => (
          <li key={p.id}>
            <span className={`badge ${p.status === 'developed' ? 'good' : p.status === 'missing' ? 'bad' : ''}`}>{STATUS_PL[p.status]}</span> {i + 1}. {p.textPl}
            {p.pastTenseWarning && <div className="small" style={{ color: 'var(--bad)' }}>Ten podpunkt dotyczy przeszłości – użyj czasu przeszłego.</div>}
          </li>
        ))}
      </ul>

      {a.errors.length > 0 && (
        <>
          <h3>Do poprawy</h3>
          <ul className="points-list">
            {a.errors.slice(0, 10).map((er, i) => (
              <li key={i}><span lang="en"><strong>„{er.match}”</strong></span>{er.fix ? <> → <span lang="en">{er.fix}</span></> : null} – {er.hintPl}</li>
            ))}
          </ul>
        </>
      )}

      {a.checklistPl.length > 0 && (
        <>
          <h3>Lista kontrolna na następną próbę</h3>
          <ul className="points-list">{a.checklistPl.map((c) => <li key={c}>{c}</li>)}</ul>
        </>
      )}

      <details style={{ marginTop: '0.8rem' }}>
        <summary>Przykładowa odpowiedź (wzór, nie jedyne poprawne rozwiązanie)</summary>
        <div className="passage" lang="en" style={{ marginTop: '0.5rem' }}>{prompt.opening}{'\n'}{prompt.modelAnswer}</div>
      </details>
      <details>
        <summary>Twój tekst</summary>
        <div className="passage" lang="en" style={{ marginTop: '0.5rem' }}>{text}</div>
      </details>
    </section>
  );
}

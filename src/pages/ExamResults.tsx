import { useState } from 'react';
import { getGroup, getPrompt } from '../content';
import { SECTION_NAMES } from '../content/formats';
import { scoreGroup } from '../engine/validate';
import { assessWriting } from '../engine/writing';
import { Link } from '../router/router';
import { useAppState } from '../store/useStore';
import { EmptyState, pct, Progress } from '../ui/components/ui';
import { GroupView } from '../ui/exercises/GroupView';
import { WritingFeedback } from './WritingTask';

export default function ExamResults({ id }: { id: string }) {
  const state = useAppState();
  const e = state.exams[id];
  const [open, setOpen] = useState<string | null>(null);
  if (!e || !e.result) return <EmptyState title="Brak wyniku" action={<Link className="btn" to="/exam">Wróć</Link>}>Ten arkusz nie został jeszcze oddany.</EmptyState>;
  const r = e.result;
  const ratio = r.points / r.max;

  return (
    <div className="stack">
      <section className="card hero">
        <span className="badge">Arkusz autorski na wzór CKE · wynik orientacyjny</span>
        <h1 style={{ marginTop: '0.5rem' }}>{r.points} / {r.max} pkt</h1>
        <Progress value={ratio} label="Wynik arkusza" tone={ratio >= 0.3 ? 'good' : undefined} />
        <p style={{ marginTop: '0.6rem' }}>{pct(ratio)} · {ratio >= 0.3 ? 'Powyżej progu zdawalności (30%).' : 'Poniżej progu zdawalności (30%) – nie poddawaj się, przejrzyj błędy.'}</p>
        {r.writing && <p className="small">W tym wypowiedź pisemna: {r.writing.estimate}/12 (szacunek automatyczny, możliwy zakres {r.writing.range[0]}–{r.writing.range[1]}).</p>}
        <p className="small muted" style={{ marginBottom: 0 }}>Czas: {Math.round(((e.submittedAt ?? e.startedAt) - e.startedAt) / 60000)} min z 120.</p>
      </section>

      <section className="card">
        <h2>Wynik w częściach</h2>
        {(['listening', 'reading', 'language', 'writing'] as const).map((s) => r.sections[s] && (
          <div className="skillrow" key={s}>
            <span>{SECTION_NAMES[s]}</span>
            <strong>{r.sections[s].points}/{r.sections[s].max}</strong>
            <Progress value={r.sections[s].points} max={r.sections[s].max} label={SECTION_NAMES[s]} />
          </div>
        ))}
      </section>

      <section>
        <h2 className="section-title">Przegląd odpowiedzi</h2>
        {e.exam.slots.map((s) => {
          const g = s.groupId ? getGroup(s.groupId) : undefined;
          const p = s.promptId ? getPrompt(s.promptId) : undefined;
          const sc = g ? scoreGroup(g, e.answers) : undefined;
          const isOpen = open === s.slot.id;
          return (
            <div className="card" key={s.slot.id}>
              <div className="row between">
                <strong>{s.slot.label} · {SECTION_NAMES[s.slot.section]}</strong>
                <span>{sc ? `${sc.points}/${sc.max}` : r.writing ? `${r.writing.estimate}/12` : '–'}</span>
              </div>
              <button className="btn quiet sm" style={{ marginTop: '0.5rem' }} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.slot.id)}>{isOpen ? 'Zwiń' : 'Pokaż odpowiedzi i wyjaśnienia'}</button>
              {isOpen && g && sc && (
                <div style={{ marginTop: '0.8rem' }}>
                  <GroupView group={g} answers={e.answers} onAnswer={() => {}} results={sc.results} audio={{ rate: state.settings.speechRate }} showTranscript />
                </div>
              )}
              {isOpen && p && (
                <div style={{ marginTop: '0.8rem' }}>
                  {(e.writing[p.id] ?? '').trim()
                    ? <WritingFeedback prompt={p} assessment={assessWriting(e.writing[p.id], p)} text={e.writing[p.id]} />
                    : <p>Wypowiedź pisemna nie została napisana – 0 pkt.</p>}
                </div>
              )}
            </div>
          );
        })}
      </section>
      <div className="row">
        <Link className="btn" to="/exam">Nowy arkusz</Link>
        <Link className="btn quiet" to="/mistakes">Zeszyt błędów</Link>
      </div>
    </div>
  );
}

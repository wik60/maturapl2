import { groups } from '../content';
import { FORMATS, SECTION_NAMES } from '../content/formats';
import type { FormatId, Section } from '../content/types';
import { Link, navigate, useRoute } from '../router/router';
import { startSession } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { EmptyState } from '../ui/components/ui';

const ORDER: Section[] = ['listening', 'reading', 'language', 'supplementary'];

export default function Practice() {
  const r = useRoute();
  const state = useAppState();
  const store = useStore();
  const sectionFilter = r.query.get('section') as Section | null;
  const formatFilter = r.query.get('format') as FormatId | null;

  const start = (format: FormatId, ids: string[], title: string) => {
    // prefer groups not attempted recently, then shuffle lightly
    const seen = new Set(state.attempts.slice(-300).map((a) => a.groupId));
    const sorted = [...ids].sort((a, b) => Number(seen.has(a)) - Number(seen.has(b)));
    const pickN = FORMATS[format].section === 'listening' || FORMATS[format].section === 'reading' ? 1 : 2;
    const units = sorted.slice(0, pickN);
    const id = store.update((s, now) => startSession(s, now, { kind: 'practice', title, units }));
    navigate(`/session/${id}`);
  };

  const formats = (Object.keys(FORMATS) as FormatId[]).filter((f) => !f.startsWith('W_'));
  const visible = formats.filter((f) => (!sectionFilter || FORMATS[f].section === sectionFilter) && (!formatFilter || f === formatFilter));

  return (
    <div>
      <h1>Ćwiczenia</h1>
      <p className="muted">Wybierz konkretny typ zadania z matury. Każda sesja to 1–2 wiązki zadań, a gra wybiera te, których dawno nie robiłeś/robiłaś.</p>
      <div className="row" style={{ margin: '0.6rem 0' }}>
        <Link className={`btn sm ${!sectionFilter && !formatFilter ? '' : 'quiet'}`} to="/practice">Wszystkie</Link>
        {ORDER.map((s) => (
          <Link key={s} className={`btn sm ${sectionFilter === s ? '' : 'quiet'}`} to={`/practice?section=${s}`}>{SECTION_NAMES[s].replace('Znajomość ', '').replace('Rozumienie ', '')}</Link>
        ))}
      </div>
      <div className="grid3" style={{ display: 'grid', gap: '0.75rem' }}>
        <Link to="/writing" className="card tile" style={{ textDecoration: 'none' }}><strong>Wypowiedź pisemna</strong><span>E-mail, wpis na blogu, wpis na forum · 0–12 pkt</span></Link>
        <Link to="/vocab" className="card tile"><strong>Słówka i fiszki</strong><span>Powtórki w odstępach (SM-2)</span></Link>
        <Link to="/mistakes" className="card tile"><strong>Zeszyt błędów</strong><span>Wracaj do tego, co sprawiło trudność</span></Link>
      </div>
      {ORDER.filter((s) => visible.some((f) => FORMATS[f].section === s)).map((sec) => (
        <section key={sec} aria-labelledby={`sec-${sec}`}>
          <h2 className="section-title" id={`sec-${sec}`}>{SECTION_NAMES[sec]}</h2>
          <div className="stack">
            {visible.filter((f) => FORMATS[f].section === sec).map((f) => {
              const gs = groups.filter((g) => g.format === f);
              const items = gs.reduce((s, g) => s + g.items.length, 0);
              const done = new Set(state.attempts.filter((a) => a.format === f).map((a) => a.itemId)).size;
              return (
                <div className="card" key={f}>
                  <div className="row between">
                    <h3 style={{ margin: 0 }}>{FORMATS[f].namePl}</h3>
                    <span className={`badge ${FORMATS[f].official ? 'official' : 'extra'}`}>{FORMATS[f].official ? 'Format maturalny' : 'Dodatkowe'}</span>
                  </div>
                  <p className="small muted" style={{ margin: '0.3rem 0 0.6rem' }}>{gs.length} {gs.length === 1 ? 'wiązka' : 'wiązki/wiązek'} · {items} pytań · przerobione: {done}</p>
                  {gs.length ? (
                    <div className="row">
                      <button className="btn sm" onClick={() => start(f, gs.map((g) => g.id), FORMATS[f].namePl)}>Ćwicz</button>
                      <details>
                        <summary className="small">Wybierz konkretne zadanie</summary>
                        <div className="row" style={{ marginTop: '0.4rem' }}>
                          {gs.map((g) => (
                            <button key={g.id} className="btn quiet sm" onClick={() => { const id = store.update((s, now) => startSession(s, now, { kind: 'practice', title: `${FORMATS[f].namePl}: ${g.title}`, units: [g.id] })); navigate(`/session/${id}`); }} lang="en">{g.title}</button>
                          ))}
                        </div>
                      </details>
                    </div>
                  ) : (
                    <p className="small">Brak zadań tego typu w bieżącej wersji treści.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {visible.length === 0 && <EmptyState title="Brak zadań" action={<Link className="btn" to="/practice">Pokaż wszystkie</Link>}>Nie znaleziono zadań dla tego filtra.</EmptyState>}
    </div>
  );
}

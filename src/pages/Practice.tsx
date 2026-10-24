import { useState } from 'react';
import { groups } from '../content';
import { FORMATS, SECTION_NAMES } from '../content/formats';
import type { FormatId, Section } from '../content/types';
import { Link, navigate, useRoute } from '../router/router';
import { startSession } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { EmptyState } from '../ui/components/ui';

const SECTIONS: { id: Section | 'writing'; label: string; icon: string; color: string; to?: string }[] = [
  { id: 'listening', label: 'Słuchanie', icon: 'speaker', color: '#0d8a82' },
  { id: 'reading', label: 'Czytanie', icon: 'book', color: '#7440cf' },
  { id: 'language', label: 'Środki językowe', icon: 'practice', color: '#2a45d6' },
  { id: 'writing', label: 'Pisanie', icon: 'pen', color: '#d0601a', to: '/writing' },
  { id: 'supplementary', label: 'Gramatyka i zdania', icon: 'grid', color: '#1b78b0' },
];

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function Practice() {
  const r = useRoute();
  const state = useAppState();
  const store = useStore();
  const sectionFilter = r.query.get('section') as Section | null;
  const formatFilter = r.query.get('format') as FormatId | null;
  const [pickFor, setPickFor] = useState<FormatId | null>(null);

  const startUnits = (units: string[], title: string) => {
    const id = store.update((s, now) => startSession(s, now, { kind: 'practice', title, units }));
    navigate(`/session/${id}`);
  };
  const start = (format: FormatId) => {
    // prefer groups not attempted recently
    const ids = groups.filter((g) => g.format === format).map((g) => g.id);
    const seen = new Set(state.attempts.slice(-300).map((a) => a.groupId));
    const sorted = [...ids].sort((a, b) => Number(seen.has(a)) - Number(seen.has(b)));
    const pickN = FORMATS[format].section === 'listening' || FORMATS[format].section === 'reading' ? 1 : 2;
    startUnits(sorted.slice(0, pickN), FORMATS[format].namePl);
  };

  const formats = (Object.keys(FORMATS) as FormatId[]).filter((f) => !f.startsWith('W_'));

  if (!sectionFilter && !formatFilter) {
    return (
      <div className="stack">
        <h1>Ćwiczenia</h1>
        <p className="muted" style={{ marginTop: '-0.3rem' }}>Wybierz część matury.</p>
        <nav className="sections" aria-label="Części matury">
          {SECTIONS.map((s) => {
            const n = s.id === 'writing' ? 0 : formats.filter((f) => FORMATS[f].section === s.id).length;
            return (
              <Link key={s.id} to={s.to ?? `/practice?section=${s.id}`} className="section-tile" style={{ '--sc': s.color } as Record<string, string>}>
                <Icon name={s.icon} />
                <span><strong>{s.label}</strong><br /><span>{s.id === 'writing' ? 'E-mail, blog, forum' : `${n} ${n === 1 ? 'typ zadań' : n < 5 ? 'typy zadań' : 'typów zadań'}`}</span></span>
              </Link>
            );
          })}
          <Link to="/mistakes" className="section-tile" style={{ '--sc': '#b2402a' } as Record<string, string>}>
            <Icon name="list" />
            <span><strong>Zeszyt błędów</strong><br /><span>Popraw to, co nie wyszło</span></span>
          </Link>
        </nav>
      </div>
    );
  }

  const visible = formats.filter((f) => (!sectionFilter || FORMATS[f].section === sectionFilter) && (!formatFilter || f === formatFilter));
  const sec = SECTIONS.find((s) => s.id === sectionFilter);
  const pickGroups = pickFor ? groups.filter((g) => g.format === pickFor) : [];

  return (
    <div>
      <div className="backrow">
        <Link to="/practice" className="btn quiet icon sm" aria-label="Wróć do części matury"><Icon name="back" size={20} /></Link>
        <h1>{sec?.label ?? (sectionFilter ? SECTION_NAMES[sectionFilter] : 'Ćwiczenia')}</h1>
      </div>
      <div className="fmt-list">
        {visible.map((f) => {
          const gs = groups.filter((g) => g.format === f);
          const items = gs.reduce((s, g) => s + g.items.length, 0);
          const done = new Set(state.attempts.filter((a) => a.format === f).map((a) => a.itemId)).size;
          return (
            <div className="card fmt" key={f}>
              <div className="fmt-t">
                <h3>{cap(FORMATS[f].namePl.replace(/^(Słuchanie|Czytanie|Środki językowe|Trening): /, ''))}</h3>
                <p>{items} pytań · zrobione {done}{FORMATS[f].official ? '' : ' · dodatkowe'}</p>
              </div>
              {gs.length > 1 && <button className="btn quiet icon sm" onClick={() => setPickFor(f)} aria-label={`Wybierz zadanie: ${FORMATS[f].namePl}`}><Icon name="list" size={20} /></button>}
              {gs.length ? <button className="btn icon sm" onClick={() => start(f)} aria-label={`Ćwicz: ${FORMATS[f].namePl}`}><Icon name="play" size={20} /></button> : null}
            </div>
          );
        })}
      </div>
      {visible.length === 0 && <EmptyState title="Brak zadań" action={<Link className="btn" to="/practice">Pokaż wszystkie</Link>}>Nie znaleziono zadań dla tego filtra.</EmptyState>}

      {pickFor && (
        <>
          <div className="sheet-backdrop" onClick={() => setPickFor(null)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="pick-t">
            <div className="grab" />
            <h2 id="pick-t">{FORMATS[pickFor].namePl}</h2>
            <div className="stack" style={{ maxHeight: '55dvh', overflowY: 'auto' }}>
              {pickGroups.map((g) => (
                <button key={g.id} className="btn quiet block" lang="en" onClick={() => startUnits([g.id], `${FORMATS[pickFor].namePl}: ${g.title}`)}>{g.title}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

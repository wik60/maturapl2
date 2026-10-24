import { useRef, useState } from 'react';
import { CHAPTERS, isUnlocked, type Level, levelStatus, type LevelStatus, nextLevel } from '../game/map';
import { navigate } from '../router/router';
import { startSession } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { Icon } from '../ui/components/Icon';
import { pct } from '../ui/components/ui';

const STATUS_PL: Record<LevelStatus, string> = {
  locked: 'Zablokowany',
  available: 'Dostępny',
  'in-progress': 'W toku',
  completed: 'Zaliczony',
  mastered: 'Opanowany',
};

/** One colour per chapter – each region of the map has its own identity. */
const CHAPTER_COLORS = ['#2a45d6', '#0d8a82', '#7440cf', '#d0601a', '#1c9454', '#c1377a', '#1b78b0', '#b2402a'];
/** Horizontal offsets of the zigzag path (px). */
const ZIG = [0, 62, 78, 30, -40, -78, -50, 10];

let lastChapter: number | null = null;

export default function MapPage() {
  const state = useAppState();
  const store = useStore();
  const current = nextLevel(state);
  const startCh = Math.max(0, CHAPTERS.findIndex((c) => c.id === current?.chapter));
  const [ch, setCh] = useState(lastChapter ?? startCh);
  const [dir, setDir] = useState<'next' | 'prev' | ''>('');
  const [preview, setPreview] = useState<Level | null>(null);
  const touch = useRef<number | null>(null);

  const go = (i: number) => {
    if (i < 0 || i >= CHAPTERS.length || i === ch) return;
    setDir(i > ch ? 'next' : 'prev');
    setCh(i);
    lastChapter = i;
  };

  const c = CHAPTERS[ch];
  const color = CHAPTER_COLORS[ch % CHAPTER_COLORS.length];

  const start = (l: Level) => {
    setPreview(null);
    if (l.kind === 'exam') return navigate('/exam');
    const id = store.update((s, now) => startSession(s, now, { kind: 'map', title: `${c.namePl}: ${l.titlePl}`, units: l.groupIds, levelId: l.id }));
    navigate(`/session/${id}`);
  };

  const done = c.levels.filter((l) => state.levels[l.id]?.completedAt).length;
  const chapterDone = (i: number) => CHAPTERS[i].levels.every((l) => state.levels[l.id]?.completedAt);
  const p = preview ? state.levels[preview.id] : undefined;
  const pst = preview ? levelStatus(state, preview) : 'locked';

  return (
    <div
      className="map"
      style={{ '--ch': color } as Record<string, string>}
      onTouchStart={(e: { touches: { clientX: number }[] }) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e: { changedTouches: { clientX: number }[] }) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 60) go(ch + (dx < 0 ? 1 : -1));
      }}
    >
      <header className="chapter-head">
        <button className="btn icon sm" onClick={() => go(ch - 1)} disabled={ch === 0} aria-label="Poprzedni rozdział"><Icon name="back" /></button>
        <div className="t">
          <small>Rozdział {ch + 1} z {CHAPTERS.length} · {done}/{c.levels.length} zaliczone</small>
          <h1>{c.namePl}</h1>
        </div>
        <button className="btn icon sm" onClick={() => go(ch + 1)} disabled={ch === CHAPTERS.length - 1} aria-label="Następny rozdział"><span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}><Icon name="back" /></span></button>
      </header>
      <div className="chapter-dots" aria-hidden="true">
        {CHAPTERS.map((x, i) => <span key={x.id} className={`${i === ch ? 'on' : ''} ${chapterDone(i) ? 'done' : ''}`} />)}
      </div>

      <ol className={`path ${dir ? `slide-${dir}` : ''}`} key={c.id} aria-label={`Poziomy: ${c.namePl}`}>
        {c.levels.map((l, li) => {
          const st = levelStatus(state, l);
          const locked = st === 'locked';
          const isCurrent = current?.id === l.id;
          return (
            <li key={l.id} className={`node ${st} ${isCurrent ? 'current' : ''}`} style={{ '--x': `${ZIG[li % ZIG.length]}px` } as Record<string, string>}>
              {isCurrent && <span className="start-bubble" aria-hidden="true">{st === 'in-progress' ? 'DALEJ' : 'START'}</span>}
              <button
                type="button"
                className="node-btn"
                onClick={() => isUnlocked(state, l) && setPreview(l)}
                aria-disabled={locked}
                aria-label={`${l.titlePl}. ${STATUS_PL[st]}.${locked ? ' Najpierw zalicz poprzedni poziom.' : ''}`}
              >
                <Icon name={locked ? 'lock' : st === 'mastered' ? 'star' : st === 'completed' ? 'check' : l.kind === 'exam' ? 'exam' : 'play'} />
              </button>
              <span className="lbl" aria-hidden="true">{l.titlePl}</span>
            </li>
          );
        })}
      </ol>
      <p className="map-foot">{c.descPl}</p>

      {preview && (
        <>
          <div className="sheet-backdrop" onClick={() => setPreview(null)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="lvl-t" style={{ '--ch': color } as Record<string, string>}>
            <div className="grab" />
            <div className="row between" style={{ marginBottom: '0.3rem' }}>
              <span className="badge">{STATUS_PL[pst]}</span>
              <span className="small muted">Nagroda: {preview.xp} XP{p?.attempts ? ` · najlepiej ${pct(p.best)}` : ''}</span>
            </div>
            <h2 id="lvl-t">{preview.titlePl}</h2>
            <p>{preview.objectivePl}</p>
            <p className="small muted">Zaliczenie od 70%, opanowanie od 90% poprawnych odpowiedzi.</p>
            <button className="btn block" style={{ '--face': color, '--edge-c': `color-mix(in srgb, ${color} 62%, #000)` } as Record<string, string>} onClick={() => start(preview)}>
              {preview.kind === 'exam' ? 'Przejdź do arkusza' : p?.completedAt ? 'Powtórz poziom' : 'Zacznij'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

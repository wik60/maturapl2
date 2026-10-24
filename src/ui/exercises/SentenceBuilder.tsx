import { useRef, useState } from 'react';
import type { OpenItem } from '../../content/types';
import type { ItemResult } from '../../engine/validate';

/**
 * Word tiles for "build a sentence" tasks.
 * Tap a tile in the bank → it goes to the end of the sentence.
 * Tap a word in the sentence → it goes back to the bank.
 * Drag a word in the sentence (or focus it and use ←/→) to change the order.
 * The answer is stored as plain text (tiles joined with spaces), so grading,
 * saving and the mistake notebook work exactly as for typed answers.
 */

export function tilesOf(item: OpenItem): string[] {
  return (item.prompt ?? '').split('/').map((t) => t.trim()).filter(Boolean);
}

/** Rebuild tile order from a saved answer (also tolerates answers typed in the old text box). */
export function parsePlaced(tiles: string[], value: string): number[] {
  const words = value.trim().toLowerCase().replace(/[.!?,]+/g, ' ').split(/\s+/).filter(Boolean);
  const used = new Set<number>();
  const out: number[] = [];
  let i = 0;
  while (i < words.length) {
    let hit = -1;
    let len = 0;
    tiles.forEach((t, ti) => {
      if (used.has(ti)) return;
      const tw = t.toLowerCase().split(/\s+/);
      if (tw.length > len && tw.every((w, k) => words[i + k] === w)) { hit = ti; len = tw.length; }
    });
    if (hit < 0) return []; // unknown text → start fresh
    used.add(hit);
    out.push(hit);
    i += len;
  }
  return out;
}

const join = (tiles: string[], order: number[]) => order.map((i) => tiles[i]).join(' ');

type PE = { clientX: number; clientY: number; pointerId: number; pointerType: string; button: number; currentTarget: HTMLElement };

interface Drag {
  from: number; // index in `order` being dragged
  x: number; y: number; // pointer
  dx: number; dy: number; // grab offset inside the chip
  w: number; h: number;
  moved: boolean;
  sx: number; sy: number;
}

export function SentenceBuilder({ item, value, onChange, result, ending }: { item: OpenItem; value: string; onChange: (v: string) => void; result?: ItemResult; ending: string }) {
  const tiles = tilesOf(item);
  const order = parsePlaced(tiles, value);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [live, setLive] = useState<number[] | null>(null); // order while dragging
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const locked = !!result;
  const shown = live ?? order;
  const verdict = result ? (result.verdict === 'correct' ? 'good' : 'bad') : '';

  const commit = (o: number[]) => onChange(join(tiles, o));
  const add = (ti: number) => { if (!locked) commit([...order, ti]); };
  const remove = (pos: number) => { if (!locked) commit(order.filter((_, i) => i !== pos)); };
  const move = (pos: number, to: number) => {
    if (locked || to < 0 || to >= order.length) return;
    const o = [...order];
    const [t] = o.splice(pos, 1);
    o.splice(to, 0, t);
    commit(o);
    requestAnimationFrame(() => chipRefs.current[to]?.focus());
  };

  const onDown = (e: PE, pos: number) => {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ from: pos, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height, moved: false });
  };
  const onMove = (e: PE) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8;
    if (!moved) return;
    const cur = live ?? order;
    const draggedTile = order[drag.from];
    const at = cur.indexOf(draggedTile);
    // find the chip under the pointer and move the dragged word into its slot
    let target = at;
    chipRefs.current.forEach((el, i) => {
      if (!el || i === at) return;
      const r = el.getBoundingClientRect();
      if (e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4 && e.clientX >= r.left && e.clientX <= r.right) {
        target = e.clientX < r.left + r.width / 2 ? (i > at ? i - 1 : i) : (i > at ? i : i + 1);
      }
    });
    if (target !== at && target >= 0) {
      const o = [...cur];
      o.splice(at, 1);
      o.splice(Math.min(target, o.length), 0, draggedTile);
      setLive(o);
    } else if (!live) setLive(cur);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved: true });
  };
  const onUp = (pos: number) => {
    if (!drag) return;
    if (!drag.moved) remove(pos);
    else if (live) commit(live);
    setDrag(null);
    setLive(null);
  };

  const draggedTile = drag?.moved ? order[drag.from] : -1;
  const raw = shown.length ? join(tiles, shown) : '';
  const sentence = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div className={`builder ${verdict}`}>
      <div className="build-line" role="group" aria-label={sentence ? `Twoje zdanie: ${sentence}${ending}` : 'Twoje zdanie jest puste. Dotykaj słów poniżej.'}>
        {shown.length === 0 && <span className="build-hint" aria-hidden="true">Dotykaj słów poniżej, aby ułożyć zdanie</span>}
        {shown.map((ti, pos) => (
          <button
            key={ti}
            ref={(el: HTMLButtonElement | null) => { chipRefs.current[pos] = el; }}
            type="button"
            className={`tile placed ${ti === draggedTile ? 'ghost' : ''}`}
            lang="en"
            disabled={locked}
            aria-label={`${tiles[ti]} – słowo ${pos + 1} z ${shown.length}. Dotknij, aby usunąć; strzałki zmieniają kolejność.`}
            onPointerDown={(e: PE) => onDown(e, pos)}
            onPointerMove={onMove}
            onPointerUp={() => onUp(pos)}
            onPointerCancel={() => { setDrag(null); setLive(null); }}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === 'ArrowLeft') { e.preventDefault(); move(pos, pos - 1); }
              else if (e.key === 'ArrowRight') { e.preventDefault(); move(pos, pos + 1); }
              else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(pos); }
            }}
          >
            {pos === 0 ? tiles[ti].charAt(0).toUpperCase() + tiles[ti].slice(1) : tiles[ti]}
          </button>
        ))}
        {shown.length > 0 && shown.length === tiles.length && <span className="build-end" aria-hidden="true">{ending}</span>}
      </div>

      {!locked && shown.length >= 2 && <p className="build-tip">Dotknij słowa, aby je cofnąć. Przytrzymaj i przeciągnij, aby zmienić kolejność.</p>}

      <div className="build-bank" role="group" aria-label="Słowa do wyboru">
        {tiles.map((t, ti) => {
          const used = order.includes(ti);
          return (
            <span className="slot" key={ti}>
              <button type="button" className={`tile ${used ? 'used' : ''}`} lang="en" disabled={used || locked} aria-hidden={used} tabIndex={used ? -1 : 0} onClick={() => add(ti)}>
                {t}
              </button>
            </span>
          );
        })}
      </div>

      {drag?.moved && (
        <span className="tile placed floating" lang="en" aria-hidden="true" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, height: drag.h }}>
          {tiles[order[drag.from]]}
        </span>
      )}
    </div>
  );
}

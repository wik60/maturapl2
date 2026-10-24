import { useEffect, useRef, useState, type ReactNode } from 'react';
import { tone } from '../../audio/speech';
import { ACHIEVEMENTS } from '../../game/achievements';
import type { RewardSummary } from '../../store/types';

export function Progress({ value, max = 1, tone: t, label }: { value: number; max?: number; tone?: 'marker' | 'good'; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`progress ${t ?? ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value * 100) / 100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Accessible modal built on <dialog>; Esc closes, focus is trapped by the browser. */
export function Dialog({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children?: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      try { d.showModal(); } catch { d.setAttribute('open', ''); }
    } else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose} aria-labelledby="dlg-title">
      <div className="dlg">
        <h2 id="dlg-title">{title}</h2>
        {children}
        <div className="dlg-actions">{actions}</div>
      </div>
    </dialog>
  );
}

let pushToast: ((r: RewardSummary) => void) | null = null;
let soundOn = true;
export const setToastSound = (on: boolean) => { soundOn = on; };

export function showReward(r: RewardSummary | undefined) {
  if (!r) return;
  if (r.xp > 0 || r.achievements.length || r.levelUp || r.questsDone.length) pushToast?.(r);
}

export function ToastHost() {
  const [r, setR] = useState<RewardSummary | null>(null);
  useEffect(() => {
    pushToast = (x) => {
      setR(x);
      if (soundOn) tone('reward');
    };
    return () => { pushToast = null; };
  }, []);
  useEffect(() => {
    if (!r) return;
    const t = setTimeout(() => setR(null), 3200);
    return () => clearTimeout(t);
  }, [r]);
  if (!r) return <div aria-live="polite" className="sr-only" />;
  const ach = r.achievements.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.namePl).filter(Boolean);
  return (
    <div className="toast" role="status" aria-live="polite">
      {r.xp > 0 && <span className="xp">+{r.xp} XP</span>}
      {r.coins > 0 && <span> · +{r.coins} monet</span>}
      {r.levelUp && <div className="levelup">Nowy poziom gracza: {r.levelUp}!</div>}
      {r.questsDone.length > 0 && <div>Zadanie dnia wykonane</div>}
      {ach.length > 0 && <div>Odznaka: {ach.join(', ')}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card empty">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true);
    const b = () => setOn(false);
    window.addEventListener('online', a);
    window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

export function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}

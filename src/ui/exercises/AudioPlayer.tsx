import { useEffect, useRef, useState } from 'react';
import { type AudioAvailability, checkAvailability, isIOS, type PlayHandle, playClip } from '../../audio/speech';
import type { AudioClip } from '../../content/types';
import { Icon } from '../components/Icon';

let availability: Promise<AudioAvailability> | null = null;
export function useAudioAvailability(): AudioAvailability {
  const [a, setA] = useState<AudioAvailability>('checking');
  useEffect(() => {
    availability ??= checkAvailability();
    let alive = true;
    availability.then((v) => alive && setA(v));
    return () => { alive = false; };
  }, []);
  return a;
}

// Only one clip plays at a time across the page.
let activeStop: (() => void) | null = null;

export function AudioPlayer({
  clip, rate, maxPlays, plays = 0, onPlayed, showTranscript, compact,
}: {
  clip: AudioClip;
  rate: number;
  maxPlays?: number;
  plays?: number;
  onPlayed?: () => void;
  showTranscript?: boolean;
  compact?: boolean;
}) {
  const avail = useAudioAvailability();
  const [state, setState] = useState<'idle' | 'playing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const handle = useRef<PlayHandle | null>(null);
  const usable = !!clip.url || avail === 'ready';
  const left = maxPlays === undefined ? undefined : Math.max(0, maxPlays - plays);

  useEffect(() => () => handle.current?.stop(), []);

  const start = () => {
    if (state === 'playing') {
      handle.current?.stop();
      setState('idle');
      return;
    }
    if (left === 0) return;
    activeStop?.();
    setErr('');
    setProgress(0);
    setState('playing');
    onPlayed?.();
    const stopThis = () => { h.stop(); setState('idle'); };
    const h = playClip(clip, rate, {
      onProgress: setProgress,
      onEnd: () => { setState('idle'); setProgress(1); if (activeStop === stopThis) activeStop = null; },
      onError: (m) => { setState('error'); setErr(m); if (activeStop === stopThis) activeStop = null; },
    });
    handle.current = h;
    activeStop = stopThis;
  };

  return (
    <div className="stack">
      <div className="player" aria-label={`Odtwarzacz: ${clip.label}`}>
        <button
          type="button"
          className="btn play"
          onClick={start}
          disabled={!usable || (left === 0 && state !== 'playing')}
          aria-label={state === 'playing' ? `Zatrzymaj ${clip.label}` : `Odtwórz ${clip.label}`}
        >
          <Icon name={state === 'playing' ? 'stop' : 'play'} />
        </button>
        <div>
          <strong>{clip.label}</strong>
          <div style={{ margin: '0.35rem 0' }}>
            <div className="progress" role="progressbar" aria-label="Postęp nagrania" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div className="meta">
            {avail === 'checking' && !clip.url && 'Sprawdzam dostępność głosu…'}
            {usable && (left === undefined ? 'Możesz odtwarzać dowolnie wiele razy.' : left > 0 ? `Pozostałe odtworzenia: ${left}` : 'Wykorzystano limit odtworzeń.')}
            {!compact && usable && (clip.url
              ? <span> · Głos AI z autorskiego skryptu, nie nagranie CKE.</span>
              : <span> · Głos syntezowany w przeglądarce, nie nagranie CKE.</span>)}
          </div>
        </div>
      </div>
      {!usable && avail !== 'checking' && (
        <div className="notice bad" role="alert">
          <strong>Nagranie jest niedostępne.</strong>{' '}
          {avail === 'unsupported'
            ? 'Ta przeglądarka nie obsługuje syntezy mowy, a dla tego zadania nie ma pliku audio.'
            : 'W tej przeglądarce nie ma angielskiego głosu do syntezy mowy.'}{' '}
          Spróbuj w Chrome, Edge lub Safari albo doinstaluj angielski głos w ustawieniach systemu.
        </div>
      )}
      {state === 'error' && <div className="notice bad" role="alert">{err}</div>}
      {usable && !clip.url && !compact && isIOS() && (
        <p className="small muted" style={{ margin: 0 }}>Nie słychać? Podgłośnij przyciskami głośności podczas odtwarzania i sprawdź, czy telefon nie jest połączony ze słuchawkami Bluetooth. Gdy odtwarzanie ruszy, dźwięk gra także w trybie cichym.</p>
      )}
      {showTranscript && (
        <details className="transcript" open>
          <summary>Transkrypcja – {clip.label}</summary>
          {clip.lines.map((l, i) => (
            <p key={i} lang="en"><strong>{l.speaker}:</strong> {l.text}</p>
          ))}
        </details>
      )}
    </div>
  );
}

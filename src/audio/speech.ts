import type { AudioClip } from '../content/types';

/**
 * Audio for listening tasks.
 * - If a clip has a `url` (a licensed or original recording), it is played with <audio>.
 * - Otherwise the script is synthesised by the browser's Web Speech API.
 * Synthesised speech is clearly labelled in the UI and is never presented as a CKE recording.
 */

export type AudioAvailability = 'checking' | 'ready' | 'unsupported' | 'no-english-voice';

export interface PlayHandle {
  stop(): void;
}

export interface PlayCallbacks {
  onProgress?: (fraction: number) => void;
  onEnd?: () => void;
  onError?: (messagePl: string) => void;
}

const FEMALE = /female|woman|samantha|serena|kate|susan|libby|sonia|hazel|victoria|karen|moira|tessa|fiona|martha|emma|amy|zira|aria|jenny|google uk english female/i;
const MALE = /male|daniel|arthur|oliver|george|ryan|thomas|alex|fred|rishi|aaron|guy|david|mark|google uk english male/i;

let voicesCache: SpeechSynthesisVoice[] = [];

function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return [];
  const all = speechSynthesis.getVoices();
  if (all.length) voicesCache = all;
  return voicesCache.filter((v) => v.lang?.toLowerCase().startsWith('en'));
}

export function checkAvailability(timeoutMs = 2500): Promise<AudioAvailability> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.resolve('unsupported');
  }
  if (englishVoices().length) return Promise.resolve('ready');
  return new Promise((resolve) => {
    const done = (v: AudioAvailability) => {
      clearTimeout(timer);
      speechSynthesis.removeEventListener?.('voiceschanged', handler);
      resolve(v);
    };
    const handler = () => {
      if (englishVoices().length) done('ready');
    };
    const timer = setTimeout(() => {
      const all = speechSynthesis.getVoices();
      done(all.length === 0 ? 'unsupported' : englishVoices().length ? 'ready' : 'no-english-voice');
    }, timeoutMs);
    speechSynthesis.addEventListener?.('voiceschanged', handler);
  });
}

function pickVoice(gender: 'f' | 'm'): SpeechSynthesisVoice | undefined {
  const en = englishVoices();
  const gb = en.filter((v) => /en[-_]gb/i.test(v.lang));
  const pool = gb.length ? gb : en;
  const re = gender === 'f' ? FEMALE : MALE;
  const other = gender === 'f' ? MALE : FEMALE;
  return pool.find((v) => re.test(v.name) && !(gender === 'm' && /female/i.test(v.name))) ?? pool.find((v) => !other.test(v.name)) ?? pool[0];
}

/** Split into sentences – some browsers stop long utterances after ~15 s. */
function chunks(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*["']?\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

export function playClip(clip: AudioClip, rate: number, cb: PlayCallbacks): PlayHandle {
  if (clip.url) {
    const audio = new Audio(clip.url);
    audio.addEventListener('timeupdate', () => audio.duration && cb.onProgress?.(audio.currentTime / audio.duration));
    audio.addEventListener('ended', () => cb.onEnd?.());
    audio.addEventListener('error', () => cb.onError?.('Nie udało się wczytać pliku z nagraniem.'));
    audio.play().catch(() => cb.onError?.('Przeglądarka zablokowała odtwarzanie. Dotknij przycisku jeszcze raz.'));
    return { stop: () => { audio.pause(); audio.currentTime = 0; } };
  }

  const parts = clip.lines.flatMap((l) => chunks(l.text).map((t) => ({ t, voice: l.voice })));
  const totalChars = parts.reduce((s, p) => s + p.t.length, 0) || 1;
  let doneChars = 0;
  let cancelled = false;
  speechSynthesis.cancel();

  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.t);
    const v = pickVoice(p.voice);
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'en-GB';
    u.rate = rate;
    u.pitch = p.voice === 'm' ? 0.9 : 1.05;
    u.onboundary = (e) => cb.onProgress?.(Math.min(1, (doneChars + e.charIndex) / totalChars));
    u.onend = () => {
      doneChars += p.t.length;
      cb.onProgress?.(doneChars / totalChars);
      if (i === parts.length - 1 && !cancelled) cb.onEnd?.();
    };
    u.onerror = (e) => {
      if (cancelled || e.error === 'interrupted' || e.error === 'canceled') return;
      cancelled = true;
      cb.onError?.('Synteza mowy nie zadziałała w tej przeglądarce.');
    };
    speechSynthesis.speak(u);
  });

  return {
    stop: () => {
      cancelled = true;
      speechSynthesis.cancel();
    },
  };
}

export function speakWord(text: string, rate = 0.9) {
  if (typeof speechSynthesis === 'undefined') return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice('f');
  if (v) u.voice = v;
  u.lang = v?.lang ?? 'en-GB';
  u.rate = rate;
  speechSynthesis.speak(u);
  return true;
}

let ctx: AudioContext | null = null;
/** Short confirmation tone (respecting the sound setting). */
export function tone(kind: 'good' | 'bad' | 'reward') {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    const f = kind === 'good' ? [660, 880] : kind === 'reward' ? [523, 784] : [300, 220];
    o.frequency.setValueAtTime(f[0], t);
    o.frequency.setValueAtTime(f[1], t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.start(t);
    o.stop(t + 0.26);
  } catch {
    /* audio not available – silently skip */
  }
}

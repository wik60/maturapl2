import type { AudioClip } from '../content/types';

/**
 * Audio for listening tasks.
 * - If a clip has a `url` (a recording generated from the original script with a neural
 *   voice, see scripts/generate_audio.py), it is played with <audio>.
 * - Otherwise – or if the file fails to load – the script is synthesised by the browser's
 *   Web Speech API.
 * Synthesised speech is clearly labelled in the UI and is never presented as a CKE recording.
 *
 * iOS / Safari specifics handled here:
 * - The first speech must start inside a user tap → `unlockAudio()` runs on the first touch.
 * - With the ring/silent switch on silent, iOS mutes web audio unless the page uses the
 *   "playback" audio session. We set `navigator.audioSession.type = 'playback'` (Safari 17+)
 *   and, for older iOS, keep a silent <audio> element playing while speech runs.
 * - In home-screen web apps `getVoices()` often returns an empty list although speaking
 *   works with the system voice, so on iOS an empty list is NOT treated as "no audio".
 * - Safari can garbage-collect utterances mid-speech (then `onend` never fires), so live
 *   utterances are kept referenced.
 * - Calling `cancel()` right before `speak()` can swallow the new speech on WebKit, so we
 *   only cancel when something is actually speaking.
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

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1);
}

export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua);
}

let voicesCache: SpeechSynthesisVoice[] = [];

function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return [];
  const all = speechSynthesis.getVoices();
  if (all.length) voicesCache = all;
  return voicesCache.filter((v) => v.lang?.toLowerCase().startsWith('en'));
}

const hasSpeechApi = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export function checkAvailability(timeoutMs = 2500): Promise<AudioAvailability> {
  if (!hasSpeechApi()) return Promise.resolve('unsupported');
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
      // iOS/Safari can speak English with the system voice even when the list is empty.
      if (isIOS() || isSafari()) return done('ready');
      const all = speechSynthesis.getVoices();
      done(all.length === 0 ? 'unsupported' : englishVoices().length ? 'ready' : 'no-english-voice');
    }, timeoutMs);
    speechSynthesis.addEventListener?.('voiceschanged', handler);
  });
}

function pickVoice(gender: 'f' | 'm'): SpeechSynthesisVoice | undefined {
  const en = englishVoices();
  if (!en.length) return undefined;
  // Prefer local (on-device) voices: network voices are slower and fail offline.
  const local = en.filter((v) => v.localService);
  const base = local.length ? local : en;
  const gb = base.filter((v) => /en[-_]gb/i.test(v.lang));
  const pool = gb.length ? gb : base;
  const re = gender === 'f' ? FEMALE : MALE;
  const other = gender === 'f' ? MALE : FEMALE;
  return pool.find((v) => re.test(v.name) && !(gender === 'm' && /female/i.test(v.name))) ?? pool.find((v) => !other.test(v.name)) ?? pool[0];
}

/** Split into sentences – some browsers stop long utterances after ~15 s. */
function chunks(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*["']?\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

/* ------------------------- iOS audio session handling ------------------------- */

let silentUrl: string | null = null;
let silentEl: HTMLAudioElement | null = null;

/** 1 s of 8 kHz 8-bit mono silence as a WAV blob URL. */
function silentWav(): string {
  if (silentUrl) return silentUrl;
  const n = 8000;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return silentUrl;
}

function usePlaybackSession() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch { /* not supported */ }
}

/** Keeps a silent media element playing so iOS routes speech through the media channel. */
function startSilentKeepAlive() {
  if (!isIOS()) return;
  try {
    silentEl ??= Object.assign(new Audio(silentWav()), { loop: true });
    silentEl.setAttribute('playsinline', '');
    void silentEl.play().catch(() => undefined);
  } catch { /* ignore */ }
}

function stopSilentKeepAlive() {
  try { silentEl?.pause(); } catch { /* ignore */ }
}

let unlocked = false;
/**
 * Must run inside a user gesture (first tap). Unlocks speech on iOS by speaking a
 * silent utterance, and switches the audio session so the silent switch doesn't mute it.
 */
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  usePlaybackSession();
  if (!hasSpeechApi()) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.lang = 'en-GB';
    speechSynthesis.speak(u);
    englishVoices(); // warm up the voice list
  } catch { /* ignore */ }
}

/* --------------------------------- playback --------------------------------- */

const live: SpeechSynthesisUtterance[] = [];

function makeUtterance(text: string, gender: 'f' | 'm', rate: number) {
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(gender);
  if (v) u.voice = v;
  u.lang = v?.lang ?? 'en-GB';
  u.rate = rate;
  u.volume = 1;
  u.pitch = gender === 'm' ? 0.9 : 1.05;
  live.push(u);
  return u;
}

function releaseUtterance(u: SpeechSynthesisUtterance) {
  const i = live.indexOf(u);
  if (i >= 0) live.splice(i, 1);
}

/** True while one of our clips/words is playing (not the silent unlock utterance). */
let ownSpeechActive = false;

/** Cancel only our own running playback – a stray cancel() before speak() can mute WebKit. */
function clearQueueIfBusy() {
  if (ownSpeechActive && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  if (speechSynthesis.paused) speechSynthesis.resume();
}

export function playClip(clip: AudioClip, rate: number, cb: PlayCallbacks): PlayHandle {
  usePlaybackSession();
  if (clip.url) return playFile(clip, rate, cb);
  return speakClip(clip, rate, cb);
}

/** Generated recording. If the file can't be loaded, falls back to browser speech. */
function playFile(clip: AudioClip, rate: number, cb: PlayCallbacks): PlayHandle {
  const audio = new Audio();
  audio.setAttribute('playsinline', '');
  audio.preload = 'auto';
  audio.src = clip.url!;
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  let stopped = false;
  let fallback: PlayHandle | null = null;
  const fail = (messagePl: string) => {
    if (stopped || fallback) return;
    if (hasSpeechApi()) {
      fallback = speakClip(clip, rate, cb);
      return;
    }
    cb.onError?.(messagePl);
  };
  audio.addEventListener('timeupdate', () => audio.duration && cb.onProgress?.(audio.currentTime / audio.duration));
  audio.addEventListener('ended', () => { if (!stopped) cb.onEnd?.(); });
  audio.addEventListener('error', () => fail('Nie udało się wczytać pliku z nagraniem.'));
  audio.play().catch((e: unknown) => {
    if ((e as { name?: string })?.name === 'NotAllowedError') cb.onError?.('Przeglądarka zablokowała odtwarzanie. Dotknij przycisku jeszcze raz.');
    else fail('Nie udało się odtworzyć nagrania.');
  });
  return {
    stop: () => {
      stopped = true;
      audio.pause();
      fallback?.stop();
    },
  };
}

function speakClip(clip: AudioClip, rate: number, cb: PlayCallbacks): PlayHandle {
  unlocked = true;
  startSilentKeepAlive();
  const parts = clip.lines.flatMap((l) => chunks(l.text).map((t) => ({ t, voice: l.voice })));
  const totalChars = parts.reduce((s, p) => s + p.t.length, 0) || 1;
  let doneChars = 0;
  let cancelled = false;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    ownSpeechActive = false;
    stopSilentKeepAlive();
  };
  clearQueueIfBusy();
  ownSpeechActive = true;

  parts.forEach((p, i) => {
    const u = makeUtterance(p.t, p.voice, rate);
    u.onboundary = (e) => cb.onProgress?.(Math.min(1, (doneChars + e.charIndex) / totalChars));
    u.onend = () => {
      releaseUtterance(u);
      doneChars += p.t.length;
      cb.onProgress?.(doneChars / totalChars);
      if (i === parts.length - 1 && !cancelled) {
        finish();
        cb.onEnd?.();
      }
    };
    u.onerror = (e) => {
      releaseUtterance(u);
      if (cancelled || e.error === 'interrupted' || e.error === 'canceled') return;
      cancelled = true;
      finish();
      cb.onError?.(
        e.error === 'not-allowed'
          ? 'Przeglądarka zablokowała dźwięk. Dotknij przycisku odtwarzania jeszcze raz.'
          : 'Synteza mowy nie zadziałała w tej przeglądarce.',
      );
    };
    speechSynthesis.speak(u);
  });

  return {
    stop: () => {
      cancelled = true;
      finish();
      speechSynthesis.cancel();
    },
  };
}

export function speakWord(text: string, rate = 0.9) {
  if (!hasSpeechApi()) return false;
  usePlaybackSession();
  startSilentKeepAlive();
  clearQueueIfBusy();
  ownSpeechActive = true;
  const u = makeUtterance(text, 'f', rate);
  const done = () => { releaseUtterance(u); ownSpeechActive = false; stopSilentKeepAlive(); };
  u.onend = done;
  u.onerror = done;
  speechSynthesis.speak(u);
  return true;
}

let ctx: AudioContext | null = null;
/** Short confirmation tone (respecting the sound setting). */
export function tone(kind: 'good' | 'bad' | 'reward') {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
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

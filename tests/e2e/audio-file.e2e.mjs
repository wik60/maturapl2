/**
 * Generated recordings: the player uses the MP3 (not speech synthesis), respects the
 * speed setting, works through the service worker (Range → 206) and offline,
 * and falls back to speech when a file is missing.
 * Needs a build with recordings: see README ("Nagrania"). Server: DIR=dist-audio PORT=4175.
 */
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4175';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
let failures = 0;
const results = [];
const test = async (name, fn) => {
  try { await fn(); results.push(`✓ ${name}`); } catch (e) { failures++; results.push(`✗ ${name}\n    ${e.message.split('\n')[0]}`); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

const INSTRUMENT = () => {
  window.__speech = [];
  window.__media = [];
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!this.loop) window.__media.push(this);
    return origPlay.call(this);
  };
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      getVoices: () => [], speaking: false, pending: false, paused: false,
      resume() {}, cancel() {},
      speak(u) { window.__speech.push(u.text); setTimeout(() => u.onend && u.onend({}), 5); },
      addEventListener() {}, removeEventListener() {},
    },
    configurable: true,
  });
};

async function phone() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: UA, hasTouch: true, isMobile: true, locale: 'pl-PL' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.addInitScript(INSTRUMENT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

const playLg2 = async (page) => {
  await page.goto(`${BASE}/#/session/new?groups=lg2&title=Audio`);
  const btn = page.getByRole('button', { name: /Odtwórz Komunikat/ });
  await btn.waitFor();
  await btn.tap();
};

await test('clip with a recording plays the MP3, not speech synthesis, and labels it as AI voice', async () => {
  const { ctx, page, errors } = await phone();
  await playLg2(page);
  await page.waitForFunction(() => window.__media.some((m) => m.currentTime > 0.5), null, { timeout: 5000 });
  const info = await page.evaluate(() => ({ src: window.__media[0].src, speech: window.__speech.filter((t) => t.trim()).length }));
  assert(/\/audio\/lg2-[0-9a-f]{8}\.mp3$/.test(info.src), info.src);
  assert(info.speech === 0, `speech used ${info.speech} times`);
  assert(await page.getByText(/Głos AI z autorskiego skryptu/).isVisible(), 'AI label missing');
  assert(errors.length === 0, errors.join('|'));
  await ctx.close();
});

await test('playback speed setting applies to recordings', async () => {
  const { ctx, page } = await phone();
  await page.goto(`${BASE}/#/`);
  await page.evaluate(() => window.__mq.update((d) => { d.settings.speechRate = 0.8; }));
  await playLg2(page);
  await page.waitForFunction(() => window.__media.length > 0);
  const rate = await page.evaluate(() => window.__media[0].playbackRate);
  assert(Math.abs(rate - 0.8) < 0.01, `rate ${rate}`);
  await ctx.close();
});

await test('service worker caches recordings on first play, answers Range with 206, and plays offline', async () => {
  const { ctx, page } = await phone();
  await page.goto(`${BASE}/#/`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const precached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const shell = await caches.open(keys.find((k) => k.startsWith('mq-') && k !== 'mq-audio-v1'));
    return (await shell.keys()).filter((r) => r.url.includes('/audio/')).length;
  });
  assert(precached === 0, `recordings precached: ${precached}`);
  await playLg2(page);
  await page.waitForFunction(() => window.__media.some((m) => m.currentTime > 0.3), null, { timeout: 5000 });
  const r = await page.evaluate(async () => {
    const url = window.__media[0].src;
    const res = await fetch(url, { headers: { Range: 'bytes=0-99' } });
    const cached = await (await caches.open('mq-audio-v1')).match(url);
    return { status: res.status, len: (await res.arrayBuffer()).byteLength, cr: res.headers.get('content-range'), cached: !!cached };
  });
  assert(r.cached, 'not in audio cache');
  assert(r.status === 206 && r.len === 100 && /^bytes 0-99\/\d+$/.test(r.cr), JSON.stringify(r));
  await ctx.setOffline(true);
  await page.evaluate(() => { window.__media = []; });
  await page.getByRole('button', { name: /Odtwórz Komunikat/ }).tap();
  await page.waitForFunction(() => window.__media.some((m) => m.currentTime > 0.3), null, { timeout: 5000 });
  await ctx.close();
});

await test('missing file falls back to speech synthesis instead of failing', async () => {
  const { ctx, page } = await phone();
  await ctx.route(/\/audio\/.*\.mp3/, (r) => r.fulfill({ status: 404, body: '' }));
  await playLg2(page);
  await page.waitForFunction(() => window.__speech.some((t) => /Sunny Lake/.test(t)), null, { timeout: 5000 });
  assert(!(await page.getByRole('alert').isVisible().catch(() => false)), 'error shown');
  await ctx.close();
});

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} audio-file e2e tests passed`);
process.exit(failures ? 1 : 0);

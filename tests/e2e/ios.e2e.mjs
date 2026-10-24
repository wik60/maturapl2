/**
 * iOS-specific behaviour, emulated in Chromium with an iPhone user agent.
 * Real WebKit is not available in this environment, so speechSynthesis is
 * instrumented: we verify what the app asks the browser to do, not the sound itself.
 *   node tests/e2e/ios.e2e.mjs   (server on :4173)
 */
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
let failures = 0;
const results = [];
const test = async (name, fn) => {
  try { await fn(); results.push(`✓ ${name}`); } catch (e) { failures++; results.push(`✗ ${name}\n    ${e.message.split('\n')[0]}`); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };
const browser = await chromium.launch();

/** Fake speech engine like iOS home-screen apps: getVoices() is empty, speak() works. */
const INSTRUMENT = () => {
  const calls = [];
  window.__speech = calls;
  const synth = window.speechSynthesis;
  let speaking = false;
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      getVoices: () => [],
      get speaking() { return speaking; },
      pending: false,
      paused: false,
      resume() { calls.push({ op: 'resume' }); },
      cancel() { calls.push({ op: 'cancel' }); speaking = false; },
      speak(u) {
        calls.push({ op: 'speak', text: u.text, lang: u.lang, volume: u.volume, rate: u.rate });
        speaking = true;
        setTimeout(() => { speaking = false; u.onend && u.onend({}); }, 5);
      },
      addEventListener() {}, removeEventListener() {},
    },
    configurable: true,
  });
  void synth;
};

async function iphone(standalone = false) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, userAgent: IPHONE_UA, hasTouch: true, isMobile: true, locale: 'pl-PL' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.addInitScript(INSTRUMENT);
  if (standalone) await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

await test('iPhone: listening is playable even when the voice list is empty (no "unavailable" state)', async () => {
  const { ctx, page, errors } = await iphone();
  await page.goto(`${BASE}/#/session/new?groups=lg2&title=iOS`);
  await page.getByRole('button', { name: /Odtwórz Komunikat/ }).waitFor();
  await page.waitForTimeout(2800); // availability timeout elapses
  assert(!(await page.getByText('Nagranie jest niedostępne').isVisible()), 'shown as unavailable');
  assert(!(await page.getByText('Nie możemy odtworzyć nagrania').isVisible()), 'transcript fallback offered on iOS');
  assert(await page.getByRole('button', { name: /Odtwórz Komunikat/ }).isEnabled(), 'play disabled');
  assert(errors.length === 0, errors.join('|'));
  await ctx.close();
});

await test('iPhone: first tap unlocks speech; Play queues English speech at full volume without a needless cancel', async () => {
  const { ctx, page } = await iphone();
  await page.goto(`${BASE}/#/session/new?groups=lg2&title=iOS`);
  await page.getByRole('button', { name: /Odtwórz Komunikat/ }).waitFor();
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: /Odtwórz Komunikat/ }).tap();
  await page.waitForTimeout(300);
  const calls = await page.evaluate(() => window.__speech);
  const speaks = calls.filter((c) => c.op === 'speak');
  assert(speaks.length > 3, `expected several utterances, got ${speaks.length}`);
  const unlock = speaks[0];
  assert(unlock.volume === 0, 'first utterance should be the silent unlock');
  const real = speaks.slice(1);
  assert(real.every((c) => c.lang === 'en-GB' && c.volume === 1), 'utterances not en-GB at volume 1');
  assert(real.some((c) => /Sunny Lake Summer Camp/.test(c.text)), 'script text not spoken');
  const firstRealIdx = calls.findIndex((c) => c.op === 'speak' && c.volume === 1);
  assert(!calls.slice(0, firstRealIdx).some((c) => c.op === 'cancel'), 'cancel() called before speaking although nothing was playing');
  SHOTS && await page.screenshot({ path: `${SHOTS}/ios-listening.png` });
  await ctx.close();
});

await test('iPhone Safari: install card with Share → "Dodaj do ekranu początkowego" steps, dismissible', async () => {
  const { ctx, page } = await iphone();
  await page.goto(`${BASE}/#/`);
  await page.getByRole('heading', { name: 'Dodaj grę do ekranu początkowego' }).waitFor();
  assert(await page.getByText('Dodaj do ekranu początkowego', { exact: true }).isVisible(), 'step missing');
  assert(await page.getByText(/osobny zapis niż Safari/).isVisible(), 'separate-storage note missing');
  SHOTS && await page.screenshot({ path: `${SHOTS}/ios-install.png` });
  await page.getByRole('button', { name: 'Ukryj tę wskazówkę' }).tap();
  await page.reload();
  await page.getByRole('heading', { name: 'Cześć!' }).waitFor();
  assert(!(await page.getByRole('heading', { name: 'Dodaj grę do ekranu początkowego' }).isVisible()), 'card came back after hiding');
  // still reachable from the profile
  await page.goto(`${BASE}/#/profile`);
  await page.getByRole('heading', { name: 'Dodaj grę do ekranu początkowego' }).waitFor();
  await ctx.close();
});

await test('installed (standalone) app hides the install card', async () => {
  const { ctx, page } = await iphone(true);
  await page.goto(`${BASE}/#/`);
  await page.getByRole('heading', { name: 'Cześć!' }).waitFor();
  assert(!(await page.getByRole('heading', { name: 'Dodaj grę do ekranu początkowego' }).isVisible()), 'card shown in standalone');
  await page.goto(`${BASE}/#/profile`);
  await page.getByText('Używasz Matura Quest jako aplikacji.').waitFor();
  await ctx.close();
});

await test('iOS meta tags and 180px touch icon are served', async () => {
  const { ctx, page } = await iphone();
  await page.goto(`${BASE}/#/`);
  const meta = await page.evaluate(() => ({
    capable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content,
    title: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,
    icon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
  }));
  assert(meta.capable === 'yes' && meta.title === 'Matura Quest', JSON.stringify(meta));
  const res = await page.request.get(new URL(meta.icon, `${BASE}/`).href);
  assert(res.ok() && res.headers()['content-type']?.includes('png'), 'touch icon not served');
  await ctx.close();
});

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} iOS e2e tests passed`);
process.exit(failures ? 1 : 0);

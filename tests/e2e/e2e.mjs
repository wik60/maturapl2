/**
 * End-to-end tests against the production build.
 *   bun scripts/build.ts && bun scripts/serve.ts &   (port 4173)
 *   node tests/e2e/e2e.mjs
 * Uses the globally installed Playwright + Chromium.
 */
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
let failures = 0;
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    failures++;
    results.push(`✗ ${name}\n    ${e.message.split('\n')[0]}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const browser = await chromium.launch();

async function freshPage(viewport = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, locale: 'pl-PL', timezoneId: 'Europe/Warsaw' });
  // Block external font requests (no internet in CI) so they don't show as app errors.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_FAILED|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}

const state = (page) => page.evaluate(() => globalThis.__mq.get());
const PRAISE = /Dobrze!|Świetnie!|Brawo!|Tak jest!|Doskonale!/;
/** Lesson mode: one question per screen. Each pick answers one screen; null = "Nie wiem". */
async function steps(page, picks) {
  for (const pick of picks) {
    if (pick) { await pick(page); await page.getByRole('button', { name: 'Sprawdź' }).click(); }
    else await page.getByRole('button', { name: 'Nie wiem' }).click();
    const next = page.getByRole('button', { name: /^(Dalej|Zakończ)$/ });
    await next.waitFor();
    await page.waitForTimeout(480); // feedback cooldown
    await next.click();
  }
}
const radio = (name) => (page) => page.getByRole('radio', { name, exact: typeof name === 'string' }).click();
const type = (text) => (page) => page.getByRole('textbox').first().fill(text);

const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });

await test('first visit: dashboard, no horizontal overflow on any primary screen, no console errors', async () => {
  const { ctx, page, errors } = await freshPage();
  await page.goto(`${BASE}/#/`);
  await page.getByRole('heading', { name: 'Cześć!' }).waitFor();
  assert(await page.getByRole('button', { name: 'Zacznij od diagnozy' }).isVisible(), 'diagnostic CTA missing');
  for (const r of ['/', '/map', '/practice', '/exam', '/vocab', '/writing', '/mistakes', '/progress', '/profile', '/about', '/diagnostic']) {
    await page.goto(`${BASE}/#${r}`);
    await page.locator('h1').first().waitFor();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(over <= 0, `horizontal overflow ${over}px on ${r}`);
  }
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  await ctx.close();
});

await test('diagnostic: start, answer, check feedback, persists attempts', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/diagnostic`);
  await page.getByRole('button', { name: 'Rozpocznij diagnozę' }).click();
  await page.getByText('test diagnostyczny').waitFor();
  // first item: sd-pres.2 → correct answer A "goes"
  await page.getByRole('radio', { name: /goes/ }).click();
  await page.getByRole('button', { name: 'Sprawdź' }).click();
  await page.getByText(PRAISE).waitFor();
  const s = await state(page);
  assert(s.attempts.length === 1 && s.attempts[0].verdict === 'correct', 'attempt not recorded');
  assert(s.xp > 0, 'no XP');
  await shot(page, 'e2e-diagnostic-feedback');
  await ctx.close();
});

await test('map lesson on a phone: one question per screen, wrong answer sheet, finishing records level progress, mistakes saved', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/map`);
  await page.getByRole('button', { name: /Szyk zdania/ }).click();
  await page.getByRole('button', { name: 'Zacznij' }).click();
  await page.getByText('Obóz startowy: Szyk zdania').waitFor({ state: 'attached' });
  assert(await page.getByRole('button', { name: 'Sprawdź' }).isDisabled(), 'Check enabled with no answer');
  await steps(page, [type('I always have breakfast at seven')]);
  await type('Where you live?')(page); // wrong
  await page.getByRole('button', { name: 'Sprawdź' }).click();
  await page.getByText('Niestety, źle.').waitFor();
  const sheet = await page.getByRole('status').filter({ hasText: 'Niestety' }).textContent();
  assert(/Poprawna odpowiedź:\s*Where do you live\?/.test(sheet), `correct answer not shown: ${sheet}`);
  const over = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  assert(over <= 0, `lesson screen scrolls by ${over}px`);
  await shot(page, 'e2e-lesson-feedback');
  await page.waitForTimeout(480);
  await page.getByRole('button', { name: 'Dalej' }).click();
  await steps(page, [null, null, null]);
  // second task: present tenses drill – all correct
  await steps(page, ['is knocking', 'goes', 'love', 'does'].map(radio));
  await page.getByRole('heading', { name: /Poziom|Prawie|Lekcja|Koniec/ }).waitFor();
  const s = await state(page);
  assert(s.levels['c1-1']?.attempts === 1, 'level attempt not recorded');
  assert(Object.keys(s.mistakes).length >= 4, 'mistakes not stored');
  await ctx.close();
});

await test('refresh during an exercise keeps typed answers', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/session/new?groups=oc1&title=Test`);
  await page.getByRole('textbox').first().fill('for');
  await page.reload();
  await page.getByRole('textbox').first().waitFor();
  assert((await page.getByRole('textbox').first().inputValue()) === 'for', 'answer lost after refresh');
  await ctx.close();
});

await test('double tap on "Sprawdź" does not skip feedback or double-award', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/session/new?groups=fd1&title=Test`);
  for (const o of [/Yes, please/, /Go straight on/, /Would you like to come/]) {
    await page.getByRole('radio', { name: o }).click();
    await page.getByRole('button', { name: 'Sprawdź' }).dblclick();
    await page.getByText(PRAISE).waitFor();
    await page.waitForTimeout(480);
    await page.getByRole('button', { name: /^(Dalej|Zakończ)$/ }).click();
  }
  const s = await state(page);
  assert(s.attempts.length === 3, `expected 3 attempts, got ${s.attempts.length}`);
  const xp = s.xp;
  await page.reload();
  const s2 = await state(page);
  assert(s2.xp === xp, 'xp changed on reload');
  await ctx.close();
});

await test('mistake notebook: retry a mistake and fix it', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/session/new?groups=oc3&title=Test`);
  await steps(page, [null, null, null]);
  await page.goto(`${BASE}/#/mistakes`);
  await page.getByText('Pomyłki: 1').first().waitFor();
  await page.getByRole('button', { name: 'Spróbuj ponownie' }).first().click();
  const s0 = await state(page);
  const sess = s0.sessions[s0.activeSessionId];
  const itemId = sess.units[0].split('#')[1];
  const answer = { 'oc3.1': 'much', 'oc3.2': 'to', 'oc3.3': 'for' }[itemId];
  await page.getByRole('textbox').first().fill(answer);
  await page.getByRole('button', { name: 'Sprawdź' }).click();
  await page.getByText(PRAISE).waitFor();
  const s = await state(page);
  assert(s.mistakes[itemId].card.reps === 1, 'mistake card not reviewed');
  await ctx.close();
});

await test('exam simulation: start, navigate, answer, submit with confirmation, results with review', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/exam`);
  await page.getByRole('button', { name: 'Rozpocznij arkusz' }).click();
  await page.getByRole('button', { name: 'Start – 120 minut' }).click();
  await page.getByRole('timer').waitFor();
  assert(/1:59:5\d|2:00:00/.test(await page.getByRole('timer').textContent()), 'timer not ~2h');
  await page.getByRole('radio', { name: /^A:/ }).first().click();
  await page.getByRole('button', { name: 'Następne' }).click();
  await page.getByText('Zadanie 2 z 12').waitFor();
  await page.getByRole('button', { name: 'Spis zadań' }).click();
  await page.getByRole('button', { name: /Zadanie 12/ }).click();
  await page.getByRole('textbox', { name: 'Twoja wypowiedź' }).fill('I went to the mountains with my friends because I love hiking. It was great.');
  await shot(page, 'e2e-exam-writing');
  await page.getByRole('button', { name: 'Oddaj', exact: true }).click();
  await page.getByText('Brakuje odpowiedzi w tych zadaniach:').waitFor();
  await page.getByRole('button', { name: 'Oddaj i sprawdź' }).click();
  await page.getByRole('heading', { name: /\/ 60 pkt/ }).waitFor();
  await page.getByRole('button', { name: 'Pokaż odpowiedzi i wyjaśnienia' }).first().click();
  await page.getByText(/Poprawna odpowiedź|Dobrze!/).first().waitFor();
  await shot(page, 'e2e-exam-results');
  const s = await state(page);
  const e = Object.values(s.exams)[0];
  assert(e.submittedAt && e.result.max === 60, 'exam not scored on 60');
  await ctx.close();
});

await test('expired exam auto-submits when reopened', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/exam`);
  await page.getByRole('button', { name: 'Rozpocznij arkusz' }).click();
  await page.getByRole('button', { name: 'Start – 120 minut' }).click();
  await page.getByRole('timer').waitFor();
  // move the deadline into the past, as if 2 hours had passed
  await page.evaluate(() => {
    const st = globalThis.__mq;
    st.update((s) => { const e = s.exams[s.activeExamId]; e.deadline = Date.now() - 1000; });
  });
  await page.reload();
  await page.getByRole('heading', { name: /\/ 60 pkt/ }).waitFor({ timeout: 5000 });
  await ctx.close();
});

await test('listening without a speech voice shows a clear missing-audio state and transcript fallback', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/session/new?groups=lg2&title=Test`);
  const notice = page.getByText('Nie możemy odtworzyć nagrania w tej przeglądarce.');
  const hasVoice = await page.evaluate(() => (speechSynthesis.getVoices() || []).some((v) => v.lang.startsWith('en')));
  if (!hasVoice) {
    await notice.waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: 'Pokaż transkrypcję' }).click();
    await page.getByText(/Transkrypcja/).first().waitFor();
    await steps(page, [type('9'), null, null, null]);
    const s = await state(page);
    assert(s.attempts.length === 4, `attempts ${s.attempts.length}`);
    assert(s.attempts.every((a) => a.mode === 'transcript'), 'transcript mode not recorded');
    await shot(page, 'e2e-listening-fallback');
  }
  await ctx.close();
});

await test('offline: banner appears and practice still works', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/practice`);
  await page.locator('h1').waitFor();
  // wait until the service worker has precached the app and controls the page
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.getByText('Jesteś offline.').waitFor();
  // full reload while offline is served from the cache, lazy chunks included
  await page.reload();
  await page.evaluate(() => { location.hash = '/session/new?groups=fd2&title=Offline'; });
  await page.getByRole('radio', { name: /sorry to hear/ }).click();
  await page.getByRole('button', { name: 'Sprawdź' }).click();
  await page.getByText(PRAISE).waitFor();
  await ctx.close();
});

await test('keyboard: tab to an option, select with Space, arrows move selection', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/session/new?groups=sd-art&title=Test`);
  await page.getByRole('radio').first().waitFor();
  let found = false;
  for (let i = 0; i < 40 && !found; i++) {
    await page.keyboard.press('Tab');
    found = await page.evaluate(() => document.activeElement?.getAttribute('role') === 'radio');
  }
  assert(found, 'could not reach an option with Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  const checked = await page.evaluate(() => [...document.querySelectorAll('[role=radio][aria-checked=true]')].map((b) => b.textContent));
  assert(checked.length === 1 && checked[0].startsWith('B'), `arrow selection failed: ${checked}`);
  const focusVisible = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none');
  assert(focusVisible, 'no visible focus outline');
  await ctx.close();
});

await test('writing: draft autosaves, assessment shows criteria and provisional label', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/writing/wp1`);
  const text = 'Last week our class went to Gdańsk because we wanted to see the sea. The best part was the old town, which was amazing. Something surprising happened when we saw a famous singer in a café. Why don\'t you come with me next summer? When are you free?';
  await page.getByRole('textbox', { name: 'Twoja wypowiedź' }).fill(text);
  await page.reload();
  assert((await page.getByRole('textbox', { name: 'Twoja wypowiedź' }).inputValue()) === text, 'draft lost');
  await page.getByRole('button', { name: 'Oceń moją wypowiedź' }).click();
  await page.getByText('Ocena automatyczna – orientacyjna').waitFor();
  assert(await page.getByText('poniżej 80, więc oceniona jest tylko treść').isVisible(), 'short-text rule not explained');
  await shot(page, 'e2e-writing');
  await ctx.close();
});

await test('tablet and desktop layouts render without overflow', async () => {
  for (const vp of [{ width: 820, height: 1180 }, { width: 1440, height: 900 }]) {
    const { ctx, page } = await freshPage(vp);
    for (const r of ['/', '/map', '/session/new?groups=rmu1&title=T']) {
      await page.goto(`${BASE}/#${r}`);
      await page.locator('h1, h2').first().waitFor();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(over <= 0, `overflow ${over}px at ${vp.width} on ${r}`);
    }
    await shot(page, `e2e-${vp.width}`);
    await ctx.close();
  }
});

await test('corrupted storage is recovered with a notice', async () => {
  const { ctx, page } = await freshPage();
  await page.goto(`${BASE}/#/`);
  await page.evaluate(() => localStorage.setItem('matura-quest:v1', '{broken'));
  await page.reload();
  await page.getByText(/Zapisane dane były uszkodzone/).waitFor();
  await ctx.close();
});

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} e2e tests passed`);
process.exit(failures ? 1 : 0);

/**
 * E2E for accounts + cloud sync, against tests/mock-supabase.ts.
 *   SUPABASE_URL=http://localhost:54398 SUPABASE_ANON_KEY=anon-key-for-e2e-0000000000000 OUT_DIR=dist-sync bun scripts/build.ts
 *   PORT=54398 bun tests/mock-supabase.ts &  DIR=dist-sync PORT=4174 bun scripts/serve.ts &
 *   node tests/e2e/sync.e2e.mjs
 */
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4174';
const SHOTS = process.env.SHOTS;
let failures = 0;
const results = [];
const test = async (name, fn) => {
  try { await fn(); results.push(`✓ ${name}`); } catch (e) { failures++; results.push(`✗ ${name}\n    ${e.message.split('\n')[0]}`); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };
const browser = await chromium.launch();
async function device() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pl-PL' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}
const st = (page) => page.evaluate(() => globalThis.__mq.get());
const email = `ola${Date.now()}@test.pl`;

/** Lesson mode: one question per screen; null = "Nie wiem". */
async function steps(page, picks) {
  for (const pick of picks) {
    if (pick) { await page.getByRole('radio', { name: pick }).click(); await page.getByRole('button', { name: 'Sprawdź' }).click(); }
    else await page.getByRole('button', { name: 'Nie wiem' }).click();
    const next = page.getByRole('button', { name: /^(Dalej|Zakończ)$/ });
    await next.waitFor();
    await page.waitForTimeout(480);
    await next.click();
  }
}
async function answerFd1(page, opts) {
  await page.goto(`${BASE}/#/session/new?groups=fd1&title=Sync`);
  await steps(page, opts);
}

await test('guest progress is kept and uploaded on sign-up; status shows synced', async () => {
  const { ctx, page, errors } = await device();
  await answerFd1(page, [/Yes, please/, /Go straight on/, /Would you like to come/]);
  const xp = (await st(page)).xp;
  await page.goto(`${BASE}/#/profile?s=konto`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Hasło').fill('haslo1234');
  await page.getByRole('button', { name: 'Załóż konto' }).click();
  await page.getByText(`Zalogowano jako ${email}`).waitFor();
  await page.getByText('zsynchronizowano').first().waitFor();
  SHOTS && await page.screenshot({ path: `${SHOTS}/sync-profile.png` });
  assert((await st(page)).xp === xp, 'guest XP lost');
  assert(errors.length === 0, errors.join('|'));
  await ctx.close();
});

await test('second device signs in and receives the progress', async () => {
  const { ctx, page } = await device();
  await page.goto(`${BASE}/#/profile?s=konto`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Hasło').fill('haslo1234');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.getByText('zsynchronizowano').first().waitFor();
  const s = await st(page);
  assert(s.attempts.length === 3 && s.xp > 0, `got ${s.attempts.length} attempts`);
  await ctx.close();
});

await test('wrong password shows a clear message', async () => {
  const { ctx, page } = await device();
  await page.goto(`${BASE}/#/profile?s=konto`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Hasło').fill('zlehaslo99');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.getByText('Nieprawidłowy e-mail lub hasło.').waitFor();
  await ctx.close();
});

await test('changes on two devices → conflict dialog → merge keeps both', async () => {
  const a = await device();
  const b = await device();
  for (const d of [a, b]) {
    await d.page.goto(`${BASE}/#/profile?s=konto`);
    await d.page.getByLabel('E-mail').fill(email);
    await d.page.getByLabel('Hasło').fill('haslo1234');
    await d.page.getByRole('button', { name: 'Zaloguj się' }).click();
    await d.page.getByText('zsynchronizowano').first().waitFor();
  }
  // A answers and syncs
  await a.page.goto(`${BASE}/#/session/new?groups=fd2&title=A`);
  await steps(a.page, [/sorry to hear/, null, null]);
  await a.page.evaluate(() => globalThis.__mqSync.syncNow());
  // B answers something else, then syncs → conflict
  await b.page.goto(`${BASE}/#/session/new?groups=fd3&title=B`);
  await steps(b.page, [/changing rooms/, null, null]);
  await b.page.evaluate(() => globalThis.__mqSync.syncNow());
  await b.page.getByRole('heading', { name: 'Dwie różne wersje postępu' }).waitFor();
  SHOTS && await b.page.screenshot({ path: `${SHOTS}/sync-conflict.png` });
  await b.page.getByRole('button', { name: 'Połącz obie' }).click();
  await b.page.getByRole('heading', { name: 'Dwie różne wersje postępu' }).waitFor({ state: 'detached' });
  const s = await st(b.page);
  const groups = new Set(s.attempts.map((x) => x.groupId));
  assert(groups.has('fd1') && groups.has('fd2') && groups.has('fd3'), `merged groups: ${[...groups]}`);
  await a.ctx.close();
  await b.ctx.close();
});

await test('sign out keeps local progress', async () => {
  const { ctx, page } = await device();
  await page.goto(`${BASE}/#/profile?s=konto`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Hasło').fill('haslo1234');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.getByText('zsynchronizowano').first().waitFor();
  const xp = (await st(page)).xp;
  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await page.getByRole('button', { name: 'Zaloguj się' }).waitFor();
  assert((await st(page)).xp === xp, 'progress lost on sign-out');
  await ctx.close();
});

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} sync e2e tests passed`);
process.exit(failures ? 1 : 0);

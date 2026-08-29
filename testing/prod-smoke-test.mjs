// Live prod smoke test — see testing.md for the full explanation of what
// this can and can't verify (no auth bypass on prod, so this stays limited
// to: pages load, no unexpected console errors, no mobile overflow, and API
// routes are gated correctly). Run this after every prod push.
//
// Usage: node testing/prod-smoke-test.mjs
//
// This checks universal, feature-independent things. If you just shipped a
// specific new feature, also grep the live bundle for a string unique to it
// (see the "Bundle check" snippet in testing.md) — that part needs to be
// tailored per deploy and isn't automated here.

import { chromium, devices } from 'playwright';

const SITE = 'https://www.thepainterboys.com';
const API = 'https://api.thepainterboys.com';

const PAGES = [
  '/',
  '/admin',
  '/my-projects',
  '/services',
  '/pb',
];

// Console noise that's a confirmed false alarm, not a real bug — see
// testing.md's "Known false alarm: Google Sign-In origin not allowed"
// section. Anything else that shows up here is a real regression.
const KNOWN_NOISE = ['GSI_LOGGER', 'origin not allowed', 'status of 400'];

const results = { pages: {}, api: {} };
let failed = false;

const browser = await chromium.launch();

async function checkPage(context, path, key) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));

  const resp = await page.goto(`${SITE}${path}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(1200);

  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const realConsoleErrors = consoleErrors.filter(e => !KNOWN_NOISE.some(n => e.includes(n)));

  const ok = resp?.status() === 200 && realConsoleErrors.length === 0 && pageErrors.length === 0
    && bodyScrollWidth <= clientWidth + 2;

  results.pages[key] = {
    status: resp ? resp.status() : 'FAILED_TO_LOAD',
    consoleErrors: realConsoleErrors,
    pageErrors,
    horizontalOverflow: bodyScrollWidth > clientWidth + 2 ? `${bodyScrollWidth}px content in ${clientWidth}px viewport` : 'none',
    ok,
  };
  if (!ok) failed = true;
  await page.close();
}

const desktopCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
for (const path of PAGES) await checkPage(desktopCtx, path, `desktop${path === '/' ? '/home' : path}`);
await desktopCtx.close();

const mobileCtx = await browser.newContext({ ...devices['Pixel 7'] });
for (const path of PAGES) await checkPage(mobileCtx, path, `mobile${path === '/' ? '/home' : path}`);
await mobileCtx.close();

await browser.close();

// API gating — every protected route should 401 with no token. A 404 means
// the route/deploy is missing; a 500 means a real server-side error.
const protectedRoutes = ['/api/users', '/api/clients', '/api/projects', '/api/admin/sheet-sync'];
for (const route of protectedRoutes) {
  const method = route === '/api/admin/sheet-sync' ? 'POST' : 'GET';
  const res = await fetch(`${API}${route}`, { method }).catch(() => null);
  const ok = res?.status === 401;
  results.api[route] = { status: res ? res.status : 'FAILED_TO_LOAD', ok };
  if (!ok) failed = true;
}

console.log(JSON.stringify(results, null, 2));
console.log(failed ? '\n❌ SMOKE TEST FAILED — see above' : '\n✅ All checks passed');
process.exit(failed ? 1 : 0);

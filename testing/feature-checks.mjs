// Growing suite of per-feature functional checks — unlike prod-smoke-test.mjs
// (which only checks universal, feature-independent things), this file holds
// one real, permanent check per shipped feature, added at the same time the
// feature is built rather than as a throwaway scratch script. Run this after
// every prod deploy alongside `npm run smoke:prod`.
//
// Usage: node testing/feature-checks.mjs
// (defaults to prod; pass a base URL to check elsewhere: node testing/feature-checks.mjs http://localhost:5173)
//
// Convention: each feature gets its own `checkX(SITE, API, log)` function
// below, registered in the `FEATURE_CHECKS` list at the bottom. Add a new one
// every time a new feature ships — don't delete old ones, they keep verifying
// past features didn't regress.

import { chromium } from 'playwright';

const SITE = process.argv[2] || 'https://www.thepainterboys.com';
const API = SITE.includes('localhost') ? 'http://localhost:5223' : 'https://api.thepainterboys.com';

const results = [];
function log(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ': ' + detail : ''}`);
}

// Dev-bypass sign-in — see testing.md "Prod-side functional testing with the
// dev-bypass key". Works with no header at all against localhost (ASP.NET
// Development environment); against a deployed SITE it needs the private
// key from the App Service's DevBypass__ApiKey setting, passed via the
// DEV_TEST_KEY env var (never checked in). Missing it against a non-local
// SITE just skips the gated checks rather than failing the whole suite.
const DEV_TEST_KEY = process.env.DEV_TEST_KEY || '';
const devBypassUsable = SITE.includes('localhost') || !!DEV_TEST_KEY;
async function apiCall(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(DEV_TEST_KEY ? { 'X-Dev-Test-Key': DEV_TEST_KEY } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) { const e = new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`); e.status = res.status; throw e; }
  return data;
}

// ── Feature: Team member "Share My Card" on WhatsApp (added 2026-09-01) ──
// A team member's public profile page can generate a branded, card-style
// image (photo, name, role, bio, corporate number, site URL, profile link)
// in a choice of blue/black/white themes, and share it on WhatsApp.
// Verifies the button exists, the modal opens with correct info, theme
// switching actually changes the card, and html2canvas produces an image.
async function checkTeamShareCard(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(`${SITE}/team/rajeev-kumar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(600);

    const shareBtn = page.getByRole('button', { name: '📤 Share My Card' });
    log('Team share-card: button present on profile page', await shareBtn.count() > 0);
    await shareBtn.click();
    await page.waitForTimeout(500);

    const cardText = await page.locator('.tc-card').innerText().catch(() => '');
    log('Team share-card: modal shows name', cardText.includes('Rajeev Kumar'));
    log('Team share-card: modal shows corporate number', /\d{10}/.test(cardText));
    log('Team share-card: modal shows site URL', cardText.includes('thepainterboys.com'));
    log('Team share-card: modal shows the registration nudge', cardText.includes('priority on touch-ups') && cardText.includes('after-sale service'));
    log('Team share-card: modal shows a generated-date stamp', /Generated:.*\d{4}/.test(cardText) && cardText.includes("today's latest card"));

    log('Team share-card: defaults to blue theme', await page.locator('.tc-card-blue').count() === 1);
    await page.locator('.tc-theme-swatch-white').click();
    await page.waitForTimeout(200);
    log('Team share-card: switching theme swaps the card class', await page.locator('.tc-card-white').count() === 1);

    await page.getByRole('button', { name: /Share Image on WhatsApp/i }).click();
    const imgOk = await page.waitForSelector('.tc-preview-img', { timeout: 15000 }).then(() => true).catch(() => false);
    log('Team share-card: image capture succeeds', imgOk);
  } finally {
    await page.close();
  }
}

// ── Feature: Team page "partner model" copy + no "Founders" wording ──
async function checkTeamPartnerCopy(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(`${SITE}/team`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(600);
    const text = await page.evaluate(() => document.body.innerText);
    log('Team copy: "Meet Our Partners" heading', text.includes('Meet Our Partners'));
    log('Team copy: no "Founders" wording', !text.includes('Founders') && !text.includes('Founding Team'));
    log('Team copy: partnership-model paragraph present', text.includes('works as a partner in the organization'));
    log('Team copy: equal opportunity statement present', text.includes('equal opportunity company'));
  } finally {
    await page.close();
  }
}

// ── Feature: Discount Coupon system (added 2026-09-06) ──
// Admin generates an 8-char coupon bound to one client's project; the
// customer redeems it themselves via a one-tap banner on /my-projects (never
// typing/seeing the raw code) — or an admin redeems it directly. Either way
// it appends a "discount" TokenHistoryEntry that reduces PendingAmount.
// Creates a fresh `TEST Coupon Fixture <ts>` client + project every run and
// deliberately leaves them in place (see testing.md — never delete test data
// in this shared live DB).
async function checkDiscountCoupon(browser) {
  if (!devBypassUsable) {
    log('Discount coupon: skipped (no DEV_TEST_KEY set for a non-local target)', true);
    return;
  }
  const ADMIN = 'DEV_TEST_ADMIN_TOKEN';
  const CUSTOMER = 'DEV_TEST_TOKEN';
  const ts = Date.now();

  await apiCall('POST', '/api/dev/promote-test-admin', null).catch(() => {});
  await apiCall('POST', '/api/auth/google', null, { idToken: CUSTOMER });
  const users = await apiCall('GET', '/api/users', ADMIN);
  const testUser = users.find(u => u.email === 'testuser@test.com');
  log('Discount coupon: dev-bypass customer account resolves', !!testUser);

  const client = await apiCall('POST', '/api/clients', ADMIN, {
    contactName: `TEST Coupon Fixture ${ts}`, phone: '9999999999', email: 'testuser@test.com',
    address: 'Test Address', society: 'Test Society',
  });
  await apiCall('POST', `/api/clients/${client.id}/link-user`, ADMIN, { userId: testUser.id });
  const project = await apiCall('POST', '/api/projects', ADMIN, {
    clientId: client.id, name: `TEST Coupon Fixture ${ts}`, progress: 'In Progress', amount: 10000, tokenReceived: 0,
  });

  const coupon = await apiCall('POST', '/api/discount-coupons', ADMIN, {
    projectId: project.id, clientId: client.id, discountAmount: 1500, reason: 'Special Discount',
  });
  log('Discount coupon: 8-char code generated', /^[A-Z0-9]{8}$/.test(coupon.code), coupon.code);

  const myCoupons = await apiCall('GET', '/api/my-projects/coupons', CUSTOMER);
  const mine = myCoupons.find(c => c.code === coupon.code);
  log('Discount coupon: customer-facing endpoint returns it with amount+reason', mine?.discountAmount === 1500 && mine?.reason === 'Special Discount');

  const redeemed = await apiCall('POST', '/api/my-projects/redeem-coupon', CUSTOMER, { code: coupon.code });
  log('Discount coupon: customer self-redeem succeeds', redeemed.discountAmount === 1500);

  const afterCoupons = await apiCall('GET', '/api/my-projects/coupons', CUSTOMER);
  log('Discount coupon: redeemed coupon drops off the active list', !afterCoupons.some(c => c.code === coupon.code));

  const myProjects = await apiCall('GET', '/api/my-projects', CUSTOMER);
  const myProj = myProjects.find(p => p.id === project.id);
  log('Discount coupon: pendingAmount reduced by the discount', myProj?.pendingAmount === 8500, `got ${myProj?.pendingAmount}`);
  log('Discount coupon: token history has a labeled discount entry', myProj?.tokenHistory?.some(t => t.kind === 'discount' && t.couponCode === coupon.code));

  const doubleRedeem = await apiCall('POST', '/api/my-projects/redeem-coupon', CUSTOMER, { code: coupon.code }).catch(e => e);
  log('Discount coupon: re-redeeming an already-used code is rejected', doubleRedeem instanceof Error && doubleRedeem.status === 409);

  const bogus = await apiCall('POST', '/api/my-projects/redeem-coupon', CUSTOMER, { code: 'ZZZZZZZZ' }).catch(e => e);
  log('Discount coupon: unknown code returns 404', bogus instanceof Error && bogus.status === 404);

  // UI check: the customer dashboard renders the redeem banner without the
  // customer ever seeing the raw code — generate one more, unredeemed coupon
  // for this to pick up.
  const uiCoupon = await apiCall('POST', '/api/discount-coupons', ADMIN, {
    projectId: project.id, clientId: client.id, discountAmount: 750, reason: 'Loyalty Discount',
  });
  const page = await browser.newPage();
  try {
    await page.addInitScript((token) => { sessionStorage.setItem('pb_mine_id_token', token); }, CUSTOMER);
    if (DEV_TEST_KEY) await page.setExtraHTTPHeaders({ 'X-Dev-Test-Key': DEV_TEST_KEY });
    await page.goto(`${SITE}/my-projects`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const bannerText = await page.locator('.mp-coupon-banner').innerText().catch(() => '');
    log('Discount coupon: banner shows reason and amount, not the code', bannerText.includes('Loyalty Discount') && bannerText.includes('750') && !bannerText.includes(uiCoupon.code));
    log('Discount coupon: banner has a one-tap Redeem button', await page.getByRole('button', { name: 'Redeem Now' }).count() > 0);
  } finally {
    await page.close();
  }
}

const FEATURE_CHECKS = [
  checkTeamShareCard,
  checkTeamPartnerCopy,
  checkDiscountCoupon,
];

const browser = await chromium.launch();
for (const check of FEATURE_CHECKS) {
  await check(browser);
}
await browser.close();

console.log('\n=== SUMMARY ===');
const failed = results.filter(r => !r.ok);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:', failed.map(f => f.name));
  process.exit(1);
}

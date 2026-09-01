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
    log('Team share-card: modal shows the registration nudge', cardText.includes('best service') && cardText.includes('after-service'));
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

const FEATURE_CHECKS = [
  checkTeamShareCard,
  checkTeamPartnerCopy,
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

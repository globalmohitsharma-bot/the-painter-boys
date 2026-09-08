// Guards against the specific regression that broke share-card images
// (Payment Receipt/Quotation/Thank You/Discount Coupon) on the native
// Android app twice — see the GUARDRAIL comment in AdminPortal.css right
// above ".aq-card". html2canvas running in that WebView has repeatedly
// failed to resolve CSS custom properties and gradients inside the DOM
// subtree that gets rasterized for the share image, producing a plain
// unstyled capture even though desktop Chrome renders it perfectly.
//
// This script has no browser dependency — it parses AdminPortal.css into
// individual `selector { declarations }` rules, and for every rule whose
// selector is part of the captured card (.aq-card*, .aq-overlay/.aq-wrap
// wrappers, .ap-ty-* Thank You card variants — explicitly NOT the action
// buttons like .aq-share-btn/.aq-close-btn, which live outside the
// captured element and are fine to use var()/gradients) fails the check
// if that rule's declarations contain var(--...) or a gradient() function.
//
// Wired into `npm run build` so a regression fails the build instead of
// shipping silently. Usage: node testing/check-share-card-css.mjs

import { readFileSync } from 'fs';

const CSS_PATH = new URL('../src/AdminPortal.css', import.meta.url);
const START_MARKER = '/* ── Quotation share card ── */';
const END_MARKER = '/* ── Project media (photos + sharing) modal ── */';

// Selectors in this range that are NOT part of the captured element —
// live outside cardRef, so var()/gradients there are harmless.
const EXCLUDED_SELECTOR_PATTERNS = [
  /^\.aq-overlay\b/, /^\.aq-wrap\b/, /^\.aq-actions\b/,
  /^\.aq-share-btn\b/, /^\.aq-share-text\b/, /^\.aq-close-btn\b/,
];

const rawCss = readFileSync(CSS_PATH, 'utf8');
const rawStart = rawCss.indexOf(START_MARKER);
const rawEnd = rawCss.indexOf(END_MARKER);
if (rawStart === -1 || rawEnd === -1 || rawEnd <= rawStart) {
  console.error('FAIL — could not locate the share-card CSS block markers in AdminPortal.css.');
  console.error('If the section was renamed, update START_MARKER/END_MARKER in this script to match.');
  process.exit(1);
}
const block = rawCss.slice(rawStart, rawEnd).replace(/\/\*[\s\S]*?\*\//g, '');

// Parse into { selector, body } rules.
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let match;
const failures = [];
while ((match = ruleRe.exec(block)) !== null) {
  const selector = match[1].trim();
  const body = match[2];
  if (!selector) continue;
  if (EXCLUDED_SELECTOR_PATTERNS.some(re => re.test(selector))) continue;

  const varMatches = body.match(/var\(--[a-zA-Z0-9-]+/g) || [];
  const gradientMatches = body.match(/(linear|radial|conic)-gradient\(/g) || [];
  if (varMatches.length > 0) {
    failures.push(`"${selector}" uses CSS custom propert${varMatches.length > 1 ? 'ies' : 'y'}: ${[...new Set(varMatches)].join(', ')}`);
  }
  if (gradientMatches.length > 0) {
    failures.push(`"${selector}" uses a gradient() — use a solid background color instead.`);
  }
}

if (failures.length > 0) {
  console.error('FAIL — share-card CSS (captured by html2canvas for the WhatsApp share image) violates the Android-WebView guardrail:');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nWhy this matters: these exact patterns have broken WhatsApp share-card images on the');
  console.error('native Android app twice already (html2canvas silently fails to resolve them in that');
  console.error('WebView, producing a plain unstyled capture). See the GUARDRAIL comment in AdminPortal.css');
  console.error('(right above ".aq-card") and the "Share-card capture reliability" section in deployment.md.');
  process.exit(1);
}

console.log('PASS — share-card CSS has no var() or gradient() usage in the captured element.');

# Testing

**Read this before testing anything on this project, and add to it when a
new gotcha or pattern is found — same spirit as [deployment.md](deployment.md).**

Two separate things: verifying a *feature actually works* (do this locally,
before every push) vs. verifying a *deploy actually shipped* (do this
against the live site, after every push). Don't try to make one do the
other's job.

## Test data — always prefix it

**Any record created for testing — locally or against a real environment —
must have `TEST` at the start of its name/contactName/society/etc.**, e.g.
`"TEST Kitchen Repaint"`, contact name `"TEST Customer"`. This applies
whether it's created through the UI, a one-off script, or directly against
Cosmos DB. Reasons:

- Makes it unmistakable in the Admin Portal's client/project lists, so a
  real admin never mistakes it for a real customer.
- Makes it trivial to find and delete afterward (`grep`/query for `TEST `).
- If it ever leaks into a screenshot or gets shared, it's obviously not
  real customer data.

Prefer testing against **local dev data** over real prod data whenever the
thing under test doesn't specifically require prod (most feature testing
doesn't — see below). If a prod-side check genuinely needs a data record
(not just an auth/routing check), prefix it, and delete it once done.

The one standing exception is `ms.silverspoon4@gmail.com` — an
already-established, deliberately real-looking prod test account (see
project memory) used specifically to demo the customer dashboard with
realistic-looking data. Its seeded projects don't get the `TEST ` prefix
because showing them to the user *as if real* is the point — but no
*other* prod record should follow that account's example.

## Local feature testing (do this before every push)

This is where real functional testing happens — full interactive flows,
because the backend's dev-only auth bypass (`DEV_TEST_TOKEN` →
`testuser@test.com` role Client, `DEV_TEST_ADMIN_TOKEN` →
`testadmin@test.com` role Admin, both gated on `IsDevelopment()`, inert
once deployed) makes it possible to drive Playwright through a signed-in
session without a real Google account.

**Setup:**
```bash
cd backend && dotnet run --urls http://localhost:5223       # background
npx vite --port 5173 --host                                  # background
curl -X POST http://localhost:5223/api/dev/promote-test-admin  # once, if testing admin
```

**Signing in as either dev account in Playwright** (no real Google flow
needed — seed the session token directly, matching what a real sign-in
would have written):
```js
await page.goto('http://localhost:5173/my-projects'); // or /admin
await page.evaluate(() => sessionStorage.setItem('pb_mine_id_token', 'DEV_TEST_TOKEN'));       // customer dashboard
await page.evaluate(() => sessionStorage.setItem('pb_admin_id_token', 'DEV_TEST_ADMIN_TOKEN')); // admin portal
await page.goto('http://localhost:5173/my-projects'); // reload so the app picks it up
```

**Drive the actual feature** — click through it the way a user would
(don't just assert the API works in isolation), screenshot key states, and
read the screenshots back before calling it verified. A button that's
present but wired to the wrong endpoint, or a state that never clears,
won't show up in a pure API check.

**Clean up**: `taskkill //F //PID <pid>` both background processes when
done (find PIDs via `tasklist`), and delete any `_test_*.mjs` /
`_scratch_*.png` files you created — none of this belongs in git history.

## Live prod smoke testing (do this after every push)

**Run `npm run smoke:prod`** — checked-in reusable script
([testing/prod-smoke-test.mjs](testing/prod-smoke-test.mjs)) covering the
universal, feature-independent checks below across desktop and mobile: all
main pages load with no unexpected console errors and no horizontal
overflow, and every protected API route correctly 401s with no token. Exits
non-zero on any failure. If you just shipped a specific new feature, also
grep the live bundle for a string unique to it (see the "Bundle check"
snippet further down) — that part needs to be tailored per deploy and isn't
automated in the script.

Prod has **no auth bypass** (by design — see the security note in project
memory about why an open "any email" bypass was declined). That caps what
can be verified live to three things:

1. **Pages load and render** — no unexpected console errors, no failed
   navigation. Screenshot the gate pages (`/my-projects`, `/admin` signed
   out) since those are what most visitors actually hit first.
2. **The right code actually shipped** — grep the live JS bundle for a
   string unique to the feature just deployed. Confirms the artifact that
   got promoted is the one that was built, not a stale cache.
3. **API routes are gated correctly** — every protected route should 401
   with no token; a 404 instead would mean the route/deploy is missing
   entirely, a 500 would mean a real server-side error.

**Reusable pattern:**
```js
// Playwright: page load + console error check
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto('https://www.thepainterboys.com/my-projects', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'scratch.png' });
```
```bash
# Bundle check
JS_URL=$(curl -s https://www.thepainterboys.com/ | grep -oE '/assets/index-[^"]+\.js' | head -1)
curl -s "https://www.thepainterboys.com${JS_URL}" | grep -c "SomeNewFeatureString"

# API gating check
curl -s -o /dev/null -w "%{http_code}\n" https://api.thepainterboys.com/api/some/protected/route
```

### Known false alarm: Google Sign-In "origin not allowed" in Playwright

Loading `/my-projects` or `/admin` in a Playwright-controlled browser
against the **real, correctly-configured** prod or staging domain still
logs `[GSI_LOGGER]: The given origin is not allowed for the given client
ID.` and the `gsi/button` request returns `400`. **This is not a real
origin misconfiguration** — confirmed by:
- Reproducing it identically on both the prod custom domain and the
  `*.azurestaticapps.net` staging domain (an origin-whitelist bug would
  most likely only hit one).
- `navigator.webdriver` reads `true` in the Playwright context — Google's
  Identity Services SDK is known to reject sign-in from browsers exposing
  automation flags, and surfaces it as this generic origin error rather
  than a specific bot-detection message.

**Conclusion: don't re-investigate this as an origin/config bug** — it's
Google blocking the automated browser itself. It means the actual
click-through-Google-sign-in flow **cannot be scripted** for live prod
verification; that's what the local dev-bypass testing above is for.

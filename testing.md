# Testing

**Read this before testing anything on this project, and add to it when a
new gotcha or pattern is found — same spirit as [deployment.md](deployment.md).**

## Admin Portal functional checklist (run through locally before every push that touches AdminPortal.jsx)

Grew out of a full pass on 2026-08-30 — add a row here whenever a new
feature ships, rather than trusting memory next time. Use the dev-bypass
setup below; `TEST ` prefix any record you create.

| Area | What to check | Last verified |
|---|---|---|
| Client create | FAB opens New Client; Save disabled until Name+Phone filled; enabled once both present | 2026-08-30 |
| Client edit | Other Details notes field saves and reloads correctly | 2026-08-30 |
| Society field | Datalist suggests known societies, still accepts free typing | 2026-08-30 |
| Project create | Date Contacted defaults to today; editable after | 2026-08-30 |
| Paint Type | Multi-select tiles toggle correctly; custom "add another" input works | 2026-08-30 |
| Work Process | Tiles toggle correctly (2 Coat Putty, Primer, etc.) | 2026-08-30 |
| No Of Days | Field present or (regression risk — it was missing entirely once) | 2026-08-30 |
| Painters | Tap-to-select avatar tiles; first tap = Primary, "Make Primary" reassigns it | 2026-08-30 |
| Toasts | Client add/update, project add/update, payment, photo upload/remove, link/unlink, share change all show a "✓ ..." toast | 2026-08-30 |
| Linked Account | WhatsApp CTA is the single obvious primary action; manual dropdown is behind a reveal link, not shown by default | 2026-08-30 |
| Payment Receipt | Adding a payment shows inline "✓ Added ₹X" AND updates the toast; totals recalc correctly | 2026-08-30 |
| Payment Receipt image | Generated share image includes the FULL card (payment history + totals), not cut off — regression-prone, see deployment.md's html2canvas note | 2026-08-30 |
| Photos & Sharing | Upload shows in grid + toast; delete removes it + toast | 2026-08-30 |
| Archive/Restore | Button says "Archive (Hide)" / "Restore", not "Deactivate"/"Activate"; hides from default Grid View list | 2026-08-30 |
| Quotation | Space Type tiles (single-select) + free-text option; Paint Type tiles (multi-select); generated card shows Space Type | 2026-08-30 |
| Quotation/Receipt/Thank You share | All three open the same preview-then-WhatsApp flow (SharePreviewModal), not an immediate blind share | 2026-08-30 |
| Google Sheet Sync | Manual "Sync from Google Sheet" button under Utility imports only genuinely new rows (check by sheetRef), reports "already up to date" on a second run | 2026-08-30 |
| Dashboard icons | All 6 status icons filter Grid View correctly; Utility/Requests/Pending Links/Tools all navigate correctly | 2026-08-30 |
| Utility menu | Opens with 5 items (Quotation, Users, Pending Links, Requests, Sync); badge = pendingLinkCount + projectRequestCount | 2026-08-30 |
| Status colors | Consistent everywhere status appears — icon circle, card left-border, progress chip — Completed=green, In Progress=amber, Inquiry=red, Pending Visit=purple, Not Started=grey, Cancelled=dark red. **Check MyProjects.css too** — it has its own identically-named classes that silently override Admin's if they drift (see the CSS-collision note further down) | 2026-08-30 |
| Sidebar | Exactly 2 items (Dashboard, Grid View) — everything else lives behind Dashboard icons, not duplicated as sidebar links | 2026-08-30 |
| Logo/Home | Header logo is clickable from any page, returns to Dashboard | 2026-08-30 |
| Mobile layout | No horizontal overflow on any view at a phone viewport (Pixel 7 in Playwright, or a real phone) | 2026-08-30 |
| New client → Inquiry project | Creating a client auto-creates a starting Inquiry-status project (a client with no project is otherwise invisible in Grid View); admin lands on Grid View filtered to Inquiry with the new entry on top | 2026-08-30 |
| Quick status change | Progress dropdown directly on each project row in the client-detail table changes status without opening the full Edit form | 2026-08-30 |
| Process column | Client-detail project table shows the Process (Work Process tiles) value as its own column | 2026-08-30 |
| Client Archive/Restore | Edit-form toggle button hides/restores a client; "Archived" filter chip (shared state) on both Grid View and All Clients; archived clients show a badge in All Clients | 2026-08-30 |
| Linked Account position | `LinkedAccountBox` renders below the project table, not above it | 2026-08-30 |
| Dashboard icons on phone | 5 icons per row at phone widths, not 3-4 wrapping oddly | 2026-08-30 |
| Re-edit a project after saving | Edit a project, save, then click Edit again immediately — must reopen the same project's form with the just-saved values, not kick back to Grid View. **Regression-prone**: the FAB's "New Client" click used to call `goto('grid')` synchronously on click (before the modal even opened); combined with `saveClient`'s own delayed `goto('grid')` (fired after its two awaited API calls), a fast follow-up action elsewhere could get its navigation silently overwritten a moment later. Fixed 2026-08-30 by removing the premature call — the modal is a full-screen overlay and doesn't need to navigate anywhere first. If this regresses, check for any `goto(...)` call sitting in an onClick *before* an async save chain that also calls `goto(...)` later | 2026-08-30 |
| Full mandatory flow (create → edit → re-edit → receipt) | Create client → lands on top of Inquiry → Edit → select painter + paint type + amount → Save → still on client-detail page → Edit again → same data persisted → change Token Received → Save → open Payment Receipt → Total/Received/Pending math correct → add a payment via the receipt form → totals update correctly | 2026-08-30 |
| Client Name/Mobile on Project edit | Opening a project's Edit form shows the client's Name and Mobile (pre-filled), editable there directly — saving updates the Client record too, not just the project | 2026-08-30 |
| Amount field "stuck at 0" | Total Amount / Token Received / Pending Amount number inputs `select()` their existing value on focus, so typing immediately replaces a 0 instead of getting stuck appending after it | 2026-08-30 |
| Pending Amount auto-fill | Entering Total Amount and Token Received auto-computes Pending Amount (`max(0, amount - tokenReceived)`); the field stays manually editable for an override | 2026-08-30 |
| "Associate Project with Client's Email ID" (renamed from "Linked Account") | Same feature, clearer name — per-client box heading, the Utility-menu icon label, and the audit table's column header all use the new wording consistently | 2026-08-30 |
| 6 status icons in one row | Completed/In Progress/Inquiry/Pending Visit/Not Started/Cancelled all fit one row at phone widths — `.ap-icon-row-status` uses a narrower per-icon width (15%) than the 4-icon utility row (18.5%), since 6 items don't fit at the wider size | 2026-08-30 |
| Dashboard counts exclude archived clients | "All Clients" badge, all 6 status badges, and "Newest Inquiries" only count clients with `isActive !== false` (and their projects) — an archived/test client no longer inflates these numbers. Grid View's own project cards also now hide when the *client* is archived, not just when the project itself is, so "Showing Archived Too" toggle behaves consistently between Dashboard and Grid View | 2026-08-30 |
| Show Archived Clients setting | Moved from a filter chip on Grid View/All Clients to a single toggle under Utility → Settings, "👁 View Archived Clients" / "🙈 Hide Archived Clients". Defaults Off; toggling it On there affects both Grid View and All Clients immediately, and no chip is rendered on either toolbar anymore | 2026-08-30 |
| Grid View "All" filter chip count | Uses the same archived-excluding count as the status chips next to it (`countedProjects.length`), not the raw unfiltered `projects.length` — was showing the full 96 instead of the real 65 active ones before this fix | 2026-08-30 |
| Quotation tool — process tiles instead of priced items | "Scope of Work" is now a tile-picker (same `WORK_PROCESS_STEPS` list ProjectForm uses, now including "Chalk Mitti") — no per-item price fields, no "at least one priced item" requirement. A single "Total Project Amount" field drives the quote; the WhatsApp text and the visual card both list selected steps as plain checkmarks with no rupee figure next to them, showing only the one total at the bottom | 2026-08-30 |
| Quotation validity | "Valid until" is generated-date + 3 days (was 15) — check both the WhatsApp text and the visual card's terms line say 3 days and the date math is right | 2026-08-30 |
| Push to Google Sheet (Utility → Google Sheet Sync) | Preview-then-confirm only — clicking "Preview Push to Google Sheet" calls the read-only `GET /api/admin/sheet-sync/push/preview` and shows exactly which clients get a new row (`toAppend`) vs. an existing row updated (`toUpdate`) before any write happens; the "Confirm & Push" button only appears once a preview has loaded. Archived clients/projects are always excluded (`skipped`). **Real incident 2026-08-30**: an unreviewed live push wrote 9 unwanted rows into the real Staff Portal sheet from leftover local test data whose names didn't match the exact `TEST ` prefix filter used for cleanup — this preview-first flow exists specifically to prevent that happening again; never remove the preview step or wire the button straight to `POST /push`. The unattended weekly push (`WeeklySheetPushSyncBackgroundService`) is deliberately NOT registered in `Program.cs` yet for the same reason — don't re-enable it without discussing the safety trade-off first. Also: the Apps Script's `delete` action (used only for manual sheet cleanup, not by this feature) proved unreliable in that incident — returned `{"ok":true}` without the row actually being removed, and needed several retries plus long waits for the published CSV cache to catch up; don't trust a single `{"ok":true}` from it as confirmation, always re-fetch and check. | 2026-08-30 |
| Payment entry Archive/Restore/Delete | Payment Receipt modal has a "Manage entries" list (3rd `.ap-calc-box` on that page — the client-detail page's `LinkedAccountBox` and the "Add a payment" box are the other two, watch for index confusion in Playwright tests) below "Add a payment". Archiving pulls the entry out of the receipt's Payment History, the WhatsApp text, and tokenReceived/pendingAmount immediately; Restore brings it back exactly; Delete removes it permanently. **Regression-prone**: `TokenHistoryEntry` (`backend/Models/Entities/Project.cs`) needs its own `Archived` field — without it, ASP.NET's strict-DTO deserialization silently drops any `archived` key the frontend sends on PUT, so the totals update correctly (those are separate top-level fields) but the entry itself always comes back unarchived and reappears in the receipt on next render. If this regresses, check the backend model has the field, not just the frontend logic | 2026-08-30 |

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

## Admin Portal dashboard icon nav (added 2026-08-30)

The Dashboard's icon row is a click-through shortcut layer over existing
views — every icon just calls the same navigation the sidebar always did,
so verifying it means clicking each one locally (see dev-bypass setup
above) and checking it lands on the right screen:

| Icon | Label | Goes to |
|---|---|---|
| ✅ | Completed | Grid View, filtered to Completed |
| 🔄 | In Progress | Grid View, filtered to In Progress |
| ❓ | Inquiry | Grid View, filtered to Inquiry |
| 🗓️ | Pending Visit | Grid View, filtered to Pending Visit |
| ⏳ | Not Started | Grid View, filtered to Not Started |
| ✕ | Cancelled | Grid View, filtered to Cancelled |
| 👤 | All Clients | Clients table |
| 🔗 | Linked Accounts | Linked Accounts view |
| 🔧 | Utility | Utility menu (Quotation, Users, Pending Links, Requests, Sync) |
| 🧾 | Tools | Quotation & Calculator (direct shortcut) |

Sidebar is just Dashboard + Grid View — everything else routes through
this icon row or the Utility menu it opens. Header logo is a "go home"
shortcut from any page. All of this confirmed working via Playwright +
dev-bypass token on 2026-08-30 (updated after the nav consolidation the
same day — the Utility/Requests/Settings/Tools 4-icon layout from earlier
that day was replaced by the table above).
Status colors (icon circle, card left-border, and progress chip) all pull
from the same `--status-*` variables in `AdminPortal.css` — Completed is
green, In Progress is amber, Inquiry is red, Pending Visit is purple, Not
Started is grey, Cancelled is dark red. **`MyProjects.css` has its own
`.ap-progress-*` chip rules that must be kept in the same color family** —
Vite bundles all page CSS together regardless of route, so these two
files' identically-named classes silently override each other by source
order, not by which page is actually showing. Found the hard way once
already (see git history 2026-08-30) when Admin's colors changed but
MyProjects' didn't, and the stale purple silently won.

## Always test both sides — Admin Portal AND the customer-facing end-user view (added 2026-08-30)

**Standing rule from the user: whenever a change is tested, test both the
Admin Portal and the customer-facing `/my-projects` side — never just one.**
A change verified only from the admin's view can still be invisible or
wrong from the customer's own dashboard, and that's the side real customers
actually use day to day.

The Admin Portal's `DEV_TEST_ADMIN_TOKEN` sentinel has a customer-side
counterpart, `DEV_TEST_TOKEN` (see `useGoogleAccount.js`) — it decodes to a
fixed test identity (`testuser@test.com`) locally, no real Google account
needed. Two ways to link a test client to that identity, in order of
preference:

1. **Invite-link flow (preferred — mirrors the real feature, and re-links
   cleanly even if the test account is already linked to something else
   from an earlier test)**: call `POST /api/clients/{id}/generate-invite`
   as admin to get an `inviteToken`, then sign the customer in with that
   token: `POST /api/auth/google` with `{ idToken: 'DEV_TEST_TOKEN',
   inviteToken }`. This is what `/my-projects?invite=<token>` does in the
   real UI.
2. **Email-match auto-link — only fires for a genuinely new User record.**
   `AuthController.cs`'s `targetClient ??= isNewUser ? GetByEmailAsync(...)
   : null` means this does *nothing* if `testuser@test.com` has already
   signed in before in this environment (which it almost certainly has,
   after repeated test runs) — don't rely on this path for a repeatable
   test, use the invite-link flow instead.

Minimal end-to-end check: create a client as admin (or use an existing
`TEST `-prefixed one), generate its invite, sign the customer in via that
invite, confirm the project and its current status render on
`/my-projects`, then change the status as admin (e.g. via the quick
status-select dropdown) and reload the customer's page to confirm the
update actually reaches their view. Verified working 2026-08-30 for the
new-client-Inquiry-status fix: customer saw "Inquiry" immediately, then
"In Progress" after the admin's dropdown change, on reload.

## Prod-side functional testing with the dev-bypass key (added 2026-08-30)

Prod now supports the same `DEV_TEST_TOKEN`/`DEV_TEST_ADMIN_TOKEN` sentinels
used for local testing (see above) — but **only** when an additional
private header is also sent. This exists purely so Claude can actually
click through the real Admin Portal on the live site, not just check that
pages load; the token strings themselves are public (they ship in the JS
bundle), so without this second, non-public gate, enabling them on a
deployed environment would hand out admin access to anyone who reads the
bundle. See the detailed comment in
`backend/Auth/GoogleTokenAuthenticationHandler.cs` and `AuthController.cs`.

**The key itself is not written here** (it's a secret) — it lives only in
the `ThePainterBoys-api` App Service's `DevBypass__ApiKey` setting. Send it
as `X-Dev-Test-Key: <key>` on every request, alongside the normal
`DEV_TEST_TOKEN`/`DEV_TEST_ADMIN_TOKEN` sign-in flow:

```js
// Playwright: enables the dev-bypass tokens against the LIVE prod site
await context.setExtraHTTPHeaders({ 'X-Dev-Test-Key': '<the key>' });
await page.goto('https://www.thepainterboys.com/admin');
await page.evaluate(() => sessionStorage.setItem('pb_admin_id_token', 'DEV_TEST_ADMIN_TOKEN'));
await page.reload();
```

**Absolute rule when testing this way: create and update only, never
delete.** Prod has real customer data — any test client/project created
this way must be prefixed `TEST ` (see the convention above) and left in
place afterward, not cleaned up via a DELETE call. This was explicitly set
by the user on 2026-08-30 and applies to every prod test session using
this mechanism, not just the one it was introduced in.

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

Prod has **no *open* auth bypass** — the private-key-gated one above is
narrow (needs a secret only Claude/the developer holds) and still
requires knowing the token+key pair; there's still nothing a normal
visitor could stumble into. For checks that don't need to click through
authenticated screens, this caps what's verified to three things:

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

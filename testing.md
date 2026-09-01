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
| Quotation — Property Type, no Space Type, editable steps, no warranty | "BHK"/"Configuration" renamed to "Property Type" (free text, e.g. "Shop", "Home", "3 BHK Flat" — generic, not flat-only). Space Type tile picker removed entirely (field, tiles, card row, all gone). `WORK_PROCESS_STEPS` reordered to match the real work sequence: Wall Repair, Crack Filling, Chalk Mitti, 1/2 Coat Putty, Primer, 1/2 Coat Paint, Texture, Waterproofing, Polish — same order now used by ProjectForm's Process tiles too, since they share the constant. Scope of Work in the Quotation tool has a "+ Add" custom-step input (mirrors the Paint Type pattern) so an admin can add something not in the preset list. "🛡️ 1-year workmanship warranty included" removed from both the visual card and the WhatsApp text | 2026-08-31 |
| Push to Google Sheet (Utility → Google Sheet Sync) | Preview-then-confirm only — clicking "Preview Push to Google Sheet" calls the read-only `GET /api/admin/sheet-sync/push/preview` and shows exactly which clients get a new row (`toAppend`) vs. an existing row updated (`toUpdate`) before any write happens; the "Confirm & Push" button only appears once a preview has loaded. Archived clients/projects are always excluded (`skipped`). **Real incident 2026-08-30**: an unreviewed live push wrote 9 unwanted rows into the real Staff Portal sheet from leftover local test data whose names didn't match the exact `TEST ` prefix filter used for cleanup — this preview-first flow exists specifically to prevent that happening again; never remove the preview step or wire the button straight to `POST /push`. The unattended weekly push (`WeeklySheetPushSyncBackgroundService`) is deliberately NOT registered in `Program.cs` yet for the same reason — don't re-enable it without discussing the safety trade-off first. Also: the Apps Script's `delete` action (used only for manual sheet cleanup, not by this feature) proved unreliable in that incident — returned `{"ok":true}` without the row actually being removed, and needed several retries plus long waits for the published CSV cache to catch up; don't trust a single `{"ok":true}` from it as confirmation, always re-fetch and check. | 2026-08-30 |
| Export All Clients & Projects (Utility → Export) | Downloads a CSV via `GET /api/admin/export/csv` in the same column shape as the Google Sheet (`SheetRowFormatter.DefaultHeaders`, shared with the push-sync feature) — unlike Sheet Sync, this includes archived clients/projects too, since it's meant as a full backup/audit snapshot. Frontend does a plain authenticated `fetch` + blob + throwaway `<a download>` (not a bare link — the endpoint needs the admin's Bearer token, which a plain href can't send). Verified: file downloads with the correct filename, opens with the exact expected header row, quoted fields with embedded commas parse correctly | 2026-08-30 |
| Customer-side visual progress timeline | `/my-projects` project cards show a 5-step stepper (Inquiry → Pending Visit → Not Started → In Progress → Completed) instead of just the status chip — steps before the current one show a checkmark, the current step is filled and bold-labeled, later steps stay outlined. Colors match the Admin Portal's status colors exactly (plain hex, not CSS vars — this page has no `.ap-root` to scope those to). Cancelled shows a distinct red banner instead of the stepper, since it's a terminal state outside the normal flow | 2026-08-30 |
| SMTP Health Check (Utility → Settings) | Sends a one-line email to the signed-in admin's own address via `POST /api/auth/test-email`. **Regression-prone**: `SmtpEmailService.SendAsync` never throws by design (so a broken/unconfigured SMTP never breaks sign-in) — it originally returned `Task`, so the button always said "✓ Sent" even when nothing actually sent. Fixed 2026-08-30 by changing `IEmailService.SendAsync` to return `Task<bool>` (true = actually sent), and having the endpoint return 502 with a specific message when it's false; the frontend also bypasses the generic `api()` helper for this one call so the detailed backend message actually reaches the toast instead of a generic "POST path -> 502". **Confirmed 2026-08-30: no `Email__*` app settings exist on the backend App Service at all** — SMTP has never been configured on this project, so no email (welcome emails included, not just this test) has ever actually sent. Needs real SMTP credentials (host/port/username/password/from-address) set as `Email__SmtpHost`/`Email__SmtpPort`/`Email__Username`/`Email__Password`/`Email__FromAddress`/`Email__FromName` app settings before this or any other email can work | 2026-08-30 |
| Push to Google Sheet — diff-aware updates | **Regression-prone**: the push plan originally flagged every synced (SheetRef-matched) project as "to update" on every single run, regardless of whether anything had actually changed — a full-data preview showed 55 "updates" that were all no-ops. Fixed 2026-08-30: `BuildPlanAsync` now fetches each row's current values alongside its row index and only plans an update when at least one column's trimmed value actually differs (`RowChanged`). Verified: preview dropped from 55 toUpdate / 0 toAppend to 0 toUpdate / 0 toAppend against the same real data once genuine test-data leftovers were archived | 2026-08-30 |
| "Install App" — Add to Home Screen | Public site: mobile hamburger menu's first item (Icon.jsx's new `download` icon). Admin Portal: Utility → Settings. Both use the shared `useInstallPrompt` hook — hidden once already installed, hidden entirely inside the Capacitor Android app (`isNativeApp()`, since that's already "installed" and `display-mode:standalone` doesn't reliably reflect that inside a native WebView), shows a real Chrome/Edge install prompt via the captured `beforeinstallprompt` event on Android, shows a step-by-step instructions modal on iOS Safari (no programmatic install API exists there). Manifest icons (`vite.config.js`) now use real 192/512 PNGs generated from `assets/icon-foreground.png` (the already-transparent layer built for the Android adaptive icon) instead of SVG-only — `assets/icon.png` looked identical but has opaque white pixels, not true alpha, so compositing it for the maskable icon produced a visible white square; the maskable variant uses a white backing with the mark at ~65% of the 512px canvas so masks never crop it. **Regression-prone**: `.mobile-overlay`'s `justify-content: center` combined with `overflow-y: auto` looked fine with the original item count but left the first item(s) permanently unreachable (rendered above the scrollable area, behind the topbar) once enough items made the list taller than the viewport — confirmed 2026-08-31 adding one more item was enough to trigger it. Fixed by switching to `justify-content: flex-start`; don't revert to `center` without re-testing with the full item list on a real short viewport | 2026-08-31 |
| Quotation — Address field, live society list, Create Client button | Address is a free-text field (was missing entirely). Society datalist now uses the same live-derived list as ClientForm (`DEFAULT_SOCIETIES` + every existing client's society), passed in as a `societies` prop, instead of only the hardcoded defaults — so a society added via any client shows up here too. New "✅ Create Client from This Quotation" button (`createClientFromQuotation` in `AdminDashboard`) creates a real Client from the form's Name/Mobile/Society/Address/Property Type, plus a starting Inquiry project pre-filled with the quotation's Paint Type/Process/Amount (not a blank project like the plain "+ New Client" flow), navigates to Grid View filtered to Inquiry — same landing pattern as any new client. Typing a brand-new society and creating a client from it correctly makes that society appear in the datalist on the *next* quotation, without any separate "save society" step — it's just a natural consequence of the list being live-derived from clients | 2026-08-31 |
| Saved Quotations — save, search, edit, update, re-share | New `PB_Quotations` Cosmos container (created manually via `az cosmosdb sql container create`, partition key `/id`, no dedicated throughput — draws from the shared database pool same as the other containers) + `QuotationsController` (`/api/quotations`, standard GET/POST/PUT/DELETE, Admin-only). Quotation tool's "💾 Save Quotation" / "💾 Update Saved Quotation" button (label depends on whether `form.id` is set) persists the form; "Utility → Saved Quotes" lists them with search-by-name-or-mobile, "✏️ Edit / Re-share" loads a saved quote back into the Quotation tool (pre-filled, including selected Paint Type/Scope-of-Work tiles) where it can be changed and re-generated/re-shared via the existing WhatsApp buttons, or updated again. "+ New Quotation" (only shown once editing a saved quote) clears the form back to blank. Verified end-to-end: save → appears in Saved Quotes list → searchable by mobile and by name → Edit loads all fields correctly (including tile selections) → changing the amount and clicking Update persists via a direct API check → "+ New Quotation" clears the form. Navigating to the Quotation tool fresh from the Utility menu (not via Edit) always clears any previously-loaded quote first, so it doesn't leak between an edit session and the next fresh quote | 2026-08-31 |
| Quotation — "Also create a client" checkbox instead of a separate button | **Regression-prone**: the earlier "✅ Create Client from This Quotation" button navigated straight to Grid View → Inquiry on click, which cut the admin off mid-quote — reported 2026-08-31 as "not able to go there back" after creating a client while still working on the quote. Fixed by replacing that button with a checkbox ("Also create a client from this quote", default unchecked) that's checked *before* clicking "Generate Quotation" — `createClientFromQuotation` no longer navigates at all, just creates + toasts, so checking the box and generating stays on the same screen and the quote can still be shared via the WhatsApp buttons right there. Verified: unchecked leaves no client created; checked creates the client silently and the admin remains on `.ap-quote-tool` with the share buttons present | 2026-08-31 |
| Quotation — Generate always saves/updates | The separate "💾 Save Quotation" / "💾 Update Saved Quotation" button was removed — "🧾 Generate & Save Quotation" now does both: saves (or updates, if the form already has an id from a prior generate/edit) before showing the preview, so every generated quote is automatically findable in Saved Quotes with no separate save step. Verified: first Generate creates exactly one record; editing the amount and clicking Generate again updates that same record (still exactly one, not a duplicate); "+ New Quotation" still appears once the form has an id, for starting a genuinely new quote | 2026-08-31 |
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

## Quotation address, card colors, PWA update reliability, admin session (added 2026-08-31)

Admin-Portal-only changes — no customer-facing `/my-projects` surface touched
this round, so no customer-side check was needed for these four.

- **Quotation Address bug**: `address` typed into the Quotation form was
  captured in state but never rendered — missing from `QuotationCard`'s
  WhatsApp text array and its visual card's Customer Details section (a
  destructure/JSX oversight from when the field was first added). Fixed by
  adding it to both. Verified via Playwright: filled Address on a fresh
  quote, generated it, confirmed the address appears in both the visual
  card (`.aq-card` innerText) and the WhatsApp text, and — with "Also
  create a client from this quote" checked — confirmed via a direct
  `GET /api/clients` call that the created Client record's `address` field
  was actually populated (`createClientFromQuotation` was already wiring
  it correctly; only the quote-preview side was broken, which is likely
  why it looked like neither side worked).
- **Card background differentiation**: Quote, Payment Receipt, and Thank
  You cards all shared the same `.aq-card` navy gradient — impossible to
  tell apart at a glance. Added `.aq-card-quote` (deep teal/emerald) on
  `QuotationCard` and gave the pre-existing-but-unstyled `.ap-ty-card`
  class a deep maroon gradient; Receipt keeps the original navy as the
  base `.aq-card` look. Verified via screenshots — all three now visually
  distinct, text contrast still fine on all three.
- **PWA update reliability**: `vite.config.js`'s `workbox` config had no
  `skipWaiting`/`clientsClaim`, so a newly-activated service worker sat
  waiting until every open tab/PWA instance was fully closed — on a phone
  that keeps the app backgrounded for days, that's what looked like "have
  to clear cache and storage for changes to take effect." Added
  `skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true`.
  Verified `self.skipWaiting(), e.clientsClaim()` and `cleanupOutdatedCaches()`
  present in the built `dist/sw.js`.
- **Admin session persistence**: `pb_admin_id_token`/`pb_admin_whoami` were
  in `sessionStorage`, cleared whenever the tab/app was fully closed — on
  mobile, the OS killing a backgrounded PWA has the same effect, so this
  was very likely the dominant cause of "why do I have to relogin so
  often." Switched both to `localStorage`. Verified via Playwright:
  signed in on one page, closed it, opened a new page in the same browser
  context, landed straight on the portal with no re-login.

## Long-lived admin session token — no expiry until sign-out (added 2026-08-31)

`localStorage` alone only fixed "closed the app and came back" — the Bearer
token being stored was still the raw Google ID token, which Google itself
expires after ~1hr regardless of where it's stored, so an admin who kept the
portal open and active past that point still hit a 401 on the next API call.

Fixed properly by having the backend issue its **own** session token instead
of asking the frontend to hold onto Google's:

- `POST /api/auth/google` (`AuthController.SignInWithGoogle`) now also
  returns a `sessionToken` — a `SESSION_`-prefixed value produced by ASP.NET
  Core Data Protection's plain (non-time-limited) protector, encrypting the
  signed-in user's id. No expiry is encoded in it at all.
- `GoogleTokenAuthenticationHandler` recognizes the `SESSION_` prefix on any
  Bearer token, unprotects it, re-looks-up the user (so a role change or a
  deleted account takes effect immediately), and authenticates — without
  ever touching Google's validation, so Google's own ~1hr expiry no longer
  applies to it.
- `AdminPortal.jsx`'s `handleCredential` now stores `data.sessionToken`
  (falling back to the raw Google credential if it's ever missing) instead
  of `response.credential` — this is what actually goes into `localStorage`
  and gets sent as the Bearer on every subsequent call.
- **Critical companion fix**: `Program.cs` previously called
  `AddDataProtection()` with no persisted key ring, which meant every app
  restart/redeploy could silently regenerate the encryption keys and
  invalidate every outstanding session token (and the pre-existing
  impersonation feature, which uses the same mechanism) — a 401 wave on
  every release, the opposite of the goal. Fixed by explicitly persisting
  keys to Azure App Service's durable `/home` directory (`HOME` env var),
  which survives a code deploy (only `wwwroot` gets replaced) and is shared
  across scaled-out instances; falls back to the app's content root when
  `HOME` isn't set (local dev).

Verified end to end:
1. Signed in via `/api/auth/google` with `DEV_TEST_ADMIN_TOKEN` — response
   included a `sessionToken` starting with `SESSION_`.
2. Called `GET /api/auth/whoami` with that session token → 200, and with a
   tampered/garbage `SESSION_` value → 401 (fails closed, doesn't crash).
3. **Restart survival** (the actual point of the fix): captured a session
   token, `taskkill`'d the local backend process, started a fresh instance,
   and called `whoami` with the pre-restart token again → still 200. Also
   confirmed the local key file landed in `$HOME/data-protection-keys`
   (outside the repo/content root), matching what `/home` on Azure App
   Service resolves to — not something that would get wiped by a redeploy.
4. Through the actual `AdminPortal.jsx` UI flow (not just direct API
   calls): signed in, confirmed the token written to
   `localStorage['pb_admin_id_token']` starts with `SESSION_`, reloaded,
   portal loaded with no re-login prompt.

**What this does not do**: there's no server-side revocation list, so
"sign out" is still purely client-side (`localStorage.removeItem`) — a
session token isn't individually invalidatable from the backend if a
device were ever lost. Not needed for the current ask ("don't log out
until I click log out"), but worth knowing if a revoke-all-sessions
feature is ever wanted later.
- **Admin lands directly on Admin Portal from the installed icon**: the
  site's one shared manifest had `start_url: '/'`, so "Install App" run
  from inside the Admin Portal still opened the marketing homepage on
  every future launch. Added a runtime manifest swap in `AdminPortal.jsx`
  — while on `/admin`, the `<link rel="manifest">` tag is swapped to a
  Blob URL cloning the real manifest with `start_url`/`id` set to
  `/admin` (distinct `id` so it installs as its own shortcut instead of
  colliding with an already-installed customer one), restored on
  unmount. Verified via `vite preview` against the production build (the
  Vite dev server doesn't inject a manifest tag at all, so this can't be
  tested against `localhost:5173`) — manifest on `/admin` came back as a
  `blob:` URL with `start_url: "/admin"`, manifest on `/` was untouched.

## Warranty wording removed, Deco Paint + PU Enamel pages added (added 2026-09-01)

- **"Warranty" wording removed site-wide from paint copy**, per explicit
  request — every "8-year warranty"/"4-year warranty" phrase in
  `siteData.js` rewritten to "long-lasting N years of durability" / "rated
  for N years of durability" instead, preserving the real sourced figures
  without using a word that could read as a formal guarantee from the
  business itself. `LegalPages.jsx`'s "AS IS, WITHOUT WARRANTY" legal
  disclaimer language was deliberately left untouched — different, correct
  usage of the word in a Terms of Service context. Verified via Playwright
  that neither the Royale nor Royale Shyne page contains the word
  "warranty" anywhere, case-insensitive.
- **Two new Education Center pages**: `pu-enamel` and `deco-paint` added to
  `siteData.js`'s `PAINT_TYPES` (these correspond to the Admin Portal's
  "PU Paint" and "Deco Paint" quotation tiles, which previously had no real
  matching page — the learn-link feature was pointing them at the closest
  approximation instead). Researched via WebSearch (PU vs. alkyd enamel
  chemistry/durability, Asian Paints' Apcolite Rustshield/Advanced PU
  Enamel lines, general decorative/"deco paint" finish terminology) before
  writing. Each page includes a "Process, Precautions, and..." section
  covering real surface prep, application, and safety steps, per explicit
  request. `AdminPortal.jsx`'s `PAINT_TYPE_LEARN_SLUGS` map updated to
  point at these real pages instead of the earlier approximations.
- **SEO verified, not assumed**: `PaintDetail.jsx` generates title/
  description/canonical/OG tags dynamically per `PAINT_TYPES` entry, so
  the two new pages needed no extra code — confirmed via Playwright that
  both render correct, distinct meta tags. **Gap found and fixed**:
  `public/sitemap.xml` is a static, hand-maintained file — it did NOT
  automatically pick up the two new URLs the way the in-app pages did.
  Added both `paint-types/pu-enamel` and `paint-types/deco-paint` entries
  manually. Worth remembering for any *future* new paint-types entry too —
  the sitemap needs a manual line, it isn't generated from `siteData.js`.
- **Mobile alignment re-checked** on the Education Center hub, Royale
  detail page, and Team page after this whole batch of changes — zero
  horizontal overflow on all three (iPhone 13 viewport), confirming a
  single shared responsive component doesn't need a separate mobile fix.

## Reference-grounded content added to all 7 paint pages (added 2026-09-01)

Per explicit request to pull from real, known references rather than just
writing more prose — used WebSearch against Asian Paints' own published
product information sheets and Bureau of Indian Standards (BIS) specs
before writing, so the new content cites real figures instead of invented
ones. Added one new "The Real Numbers Behind X" section per paint type:

- **Royale**: 270-310/140-160 sq ft/litre coverage, the real 8-year
  warranty terms, IGBC v1.0 LEED VOC criteria — all from Asian Paints'
  own PDF product information sheet.
- **Tractor Emulsion**: 250-270/130-150 sq ft/litre, 28-day cure time on
  new masonry, and the existence of Tractor Emulsion Shyne as a real
  in-between tier.
- **Royale Shyne**: 100-130 sq ft/litre, 20-30% water thinning, same
  8-year warranty terms as standard Royale.
- **Apex**: real algae/fungal/UV resistance claims and coverage converted
  from Asian Paints' sq m/litre figures, plus Apex Ultima/Suprema as real
  higher tiers.
- **Distemper**: grounded in IS 428 (Washable Distemper) — including the
  honest caveat that IS 428 certifies the product, not a specific
  installation's real-world lifespan.
- **Texture & Designer Finishes**: named the real Royale Play sub-range
  (Velour, Stucco Mirror, Luxe collection) and its actual 2-week cure
  requirement before first cleaning.
- **Apcolite**: real gloss-level figures (75-85 on a 20° gloss head),
  IGBC VOC testing reference, and IS 2932 (Synthetic Enamel) — including
  what that standard specifically requires (genuine alkyd resin, no rosin
  substitutes).

**Also, per explicit "always try to sell Royale and Royale Shyne most"
instruction**: added a persuasive-but-factual section to both pages
built around the furniture/curtains-matching argument (a home is usually
decorated *around* the wall colour, so a wall that fades out in 2-3 years
means either living with a mismatched room or re-coordinating furniture
and curtains all over again) — and added soft, factual upsell nudges
toward Royale/Royale Shyne inside the new reference sections on Tractor,
Distemper, and Apex's pages. Verified via Playwright that all 7 pages
render their new section with the correct sourced figures (16/16 checks
passed).

## Quotation calculator hide, Admin-only auto-redirect, LeadBot swap, Team/Royale content (added 2026-09-01)

- **Painting Area Calculator hidden from Quotation**: `<AreaCalculator>` no
  longer renders inside `QuotationTool` (component and its `area`/
  `ratePerSqFt` state left intact for a future standalone tool) — it's one
  shared responsive component, so "hide it" only ever needed one change,
  verified on both a desktop viewport and a Pixel 7 emulation.
- **Admin-only auto-redirect, not all `isStaff`**: initial pass redirected
  any `isStaff` account (Admin/Manager/Partner) straight to `/admin`;
  narrowed on explicit correction to `role === 'Admin'` specifically in all
  three places it's checked — `useGoogleAccount.js`'s post-sign-in
  redirect, `AccountModal.jsx`'s reopened-while-signed-in effect, and a new
  effect in `MyProjects.jsx` that catches an Admin landing there directly
  (bookmark/stale link) and sends them to `/admin` with no visible banner
  or click-through link — never fires while `isImpersonating` is true.
  Verified via the dev-bypass admin sentinel landing on `/my-projects` and
  ending up at `/admin` with no user action.
- **LeadBot hidden, floating WhatsApp icon moved into SiteFooter**: `<LeadBot
  />` commented out (not deleted) in `SiteFooter.jsx`. The existing `.wa-fab`
  small floating WhatsApp icon was previously only wired into `Home.jsx`
  directly — moved it into `SiteFooter.jsx` instead so it's site-wide.
  **Bug caught before shipping**: Blog pages use `SiteFooter` but never had
  their own local `.wa-fab`, so simply hiding LeadBot would have left Blog
  pages with zero floating contact affordance. Verified both Home and Blog
  routes show the WhatsApp fab and neither shows the old LeadBot fab.
- **Team page reframed**: hero copy changed from "Meet the Visionaries" to
  "Meet the Founders" with a subtitle clarifying they're leadership backed
  by a full crew, plus a new "Backed by a Full Operational Team" section
  after the 3-person grid — addresses the "looks like a 3-person company"
  concern without needing to list every individual crew member.
- **Royale content**: added an "All the Benefits, Pulled Together — and Why
  a Royale Wall Lasts as Long as It Does" section and rewrote the
  Royale-vs-Royale-Shyne section into an explicit decision guide ("Choose
  Royale if... / Royale Shyne if... / our practical recommendation..."),
  per explicit request that a reader should be able to decide between the
  two after reading the page.
- **Education Center WhatsApp share button**: `wa.me/?text=...` (no fixed
  recipient — opens WhatsApp's own contact picker) added to the
  `/paint-types` hub hero, verified the button renders and the href decodes
  to the correct pre-filled message + URL.

## Education Center rename + expanded paint content + quote learn-links (added 2026-09-01)

- **Nav rename**: `siteConfig.js`'s `NAV_PAGES` no longer has a separate
  `blog` entry — the `paint-types` entry's label changed from "Paint Types"
  to "Education Center" (still points at `/paint-types`). `/blog` and its
  pages are untouched and still reachable by direct URL (existing indexed
  links keep working), just no longer a top-level nav/footer link.
  **Gotcha discovered while testing**: `SiteFooter.jsx` renders its links
  from the same `NAV_PAGES` array as `SiteHeader.jsx` — one edit updates
  both automatically, but it also means a Playwright selector like
  `getByRole('link', { name: 'Education Center' })` matches twice (nav +
  footer) and needs scoping to `.nav-inner` specifically.
- **Expanded paint content**: every entry in `siteData.js`'s `PAINT_TYPES`
  got three new `longRead` sections — "Honest Drawbacks", "Cost-Per-Year"
  value breakdown, and "Common Myths/Mistakes" — roughly doubling each
  page's length and directly covering the "drawbacks" half of
  benefits/drawbacks that the earlier content (from the 2026-08-2x session)
  was thinner on. Verified via Playwright that all three new sections
  render on a live page (used royale-shyne-luxury-emulsion as the sample).
- **Quote → paint education page links**: new `PAINT_TYPE_LEARN_SLUGS` map
  in `AdminPortal.jsx` (near the `PAINT_TYPES` tile list) maps a quotation
  tile name (e.g. "Royale Shyne") to its `siteData.js` slug. `QuotationCard`
  now builds a `learnLinks` array from the quote's (comma-joined)
  `paintType` field, and where a mapping exists: adds a
  `📚 Learn about {name}: {url}` line to the WhatsApp text, a matching line
  under the card's terms section, and an "Open {name} Education Page"
  button. The generic "Emulsion" tile has no dedicated education page and
  is deliberately left unmapped — verified it produces no broken/guessed
  link rather than linking somewhere wrong. Verified end to end: selected
  Royale Shyne + Emulsion on a test quote, confirmed the Royale Shyne link
  appeared (card text, WhatsApp text, and button href all correct) and no
  link was generated for Emulsion.

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

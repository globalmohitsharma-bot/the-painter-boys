# Deployment Guide — The Painter Boys

Read this before every deployment. Hosting is **Netlify**, connected to the
`master` branch of `github.com/globalmohitsharma-bot/the-painter-boys` —
pushing to `master` triggers an automatic build and deploy (`npm run build`,
publishing `dist/`, per [netlify.toml](netlify.toml)).

## Current deployment configuration — everything set up so far (2026-08-19)

Split into two: what's version-controlled (in this repo, so anyone can see
it) vs what only exists in the Netlify dashboard (not visible in code —
verify directly in Netlify if you need to confirm it).

### In this repo (version-controlled)

- **Build command**: `npm run build` (runs `vite build`).
- **Publish directory**: `dist/` — [netlify.toml](netlify.toml).
- **Framework**: Vite + React 18 + React Router (client-rendered SPA, no
  SSR) — [package.json](package.json), [vite.config.js](vite.config.js).
- **SPA fallback**: every route (`/*`) rewrites to `/index.html` with a 200
  status, so client-side routes like `/services` or `/blog/:slug` work on
  direct load/refresh instead of 404ing — [netlify.toml](netlify.toml).
- **Domain redirects**: `http://` → `https://` (force), and
  `www.thepainterboys.com` → `thepainterboys.com` (apex), both 301 —
  [netlify.toml](netlify.toml). The actual DNS pointing the domain at
  Netlify is dashboard/registrar-side, not in this repo (see below).
- **PWA**: `vite-plugin-pwa`, `registerType: 'autoUpdate'` (service worker
  self-updates and takes over on next load, no manual "new version"
  prompt). Manifest: name "The Painter Boys", theme/background color
  `#0d2137`, standalone display, icon is `public/icon.svg` (only icon
  asset — no raster PNG icon sizes defined). Workbox precaches all built
  JS/CSS/HTML/image assets and falls back to `/index.html` for navigation,
  denylisting `/api/*` (no API exists yet, forward-looking) —
  [vite.config.js](vite.config.js).
- **Fonts**: Google Fonts loaded via `<link>` in `index.html`
  (Playfair Display + Inter), not self-hosted — an external runtime
  dependency on `fonts.googleapis.com`/`fonts.gstatic.com`.
- **No environment variables, no secrets management** — confirmed nothing
  in the codebase reads `import.meta.env`, and no `.env`/`.env.local`
  files exist locally. Everything (WhatsApp number, the Google Apps
  Script Web App URL, the published-CSV Sheet URL) is hardcoded directly
  in source ([siteConfig.js](src/siteConfig.js),
  [PBDashboard.jsx](src/PBDashboard.jsx),
  [CustomerView.jsx](src/CustomerView.jsx)) — see the baked-in-secret note
  in the checklist below.
- **No Node version pin** — no `.nvmrc` and no `NODE_VERSION` in
  `netlify.toml`, so builds use whatever Node version Netlify defaults to
  at build time. Not broken today, but means a Netlify platform default
  change could silently change the build environment; pinning is a
  reasonable future hardening step, not done yet.
- **No CI pipeline** — no `.github/workflows`. The only automation is
  Netlify's own git-triggered build on push.

### Netlify-dashboard-only (not in this repo — verify in the Netlify UI)

- **Production branch** — assumed to be `master` (matches this repo's
  default branch and git history), but the actual setting lives in
  **Site configuration → Build & deploy → Continuous deployment**, not in
  any file here. Confirm there before relying on it, especially before
  the parked-branch rollback steps below.
- **Custom domain / DNS** — `thepainterboys.com` and
  `www.thepainterboys.com` are live (per the redirects above and the
  `SITE_URL` in [siteConfig.js](src/siteConfig.js)), but domain
  registration, DNS records, and SSL cert provisioning are all
  Netlify-dashboard/registrar-side and not represented in this repo.
- **Any branch-deploy / deploy-preview settings, build environment
  variables, or Netlify plugins** — none are referenced from any file in
  this repo, so if any exist they were configured directly in the
  dashboard. Check there rather than assuming none exist.

## Branch map (as of 2026-08-19)

| Branch | Purpose |
|---|---|
| `master` | What Netlify actually builds and deploys today. |
| `legacy-prod` | Frozen snapshot of `master` taken 2026-08-19, before the redesign work. Same purpose as the parked branch below — kept as a plain git-history reference point. |
| `ThePainterBoybeforemovingtoCosmos` | **Frozen rollback snapshot — see the protection rule immediately below before touching this branch.** |
| `NewUiWithCosmosReBranding` | Snapshot point the other new branches were cut from — active work now happens on `develop`, below, rather than directly on this branch. |
| `develop` | **Current working branch.** Branched from `NewUiWithCosmosReBranding` (same content, all the redesign/LeadBot/paint-content work). This is what gets deployed to the Azure test environment — see the release flow below. |

## Release flow (target process, being set up now)

Agreed flow, going forward:

1. Work happens on **`develop`**.
2. `develop` deploys to an **Azure Static Web Apps test/staging environment**
   (being set up now — see "Azure setup" below).
3. Once verified on that test environment, `develop` is **merged into
   `master`**.
4. **The same build that was verified on test gets promoted to production**
   — not rebuilt from `master` separately. In Azure Static Web Apps terms
   this means either (a) pointing production at the same build artifact
   used for the `develop` deploy, or (b) a second Azure Static Web Apps
   resource tracking `master`, deployed immediately after the merge so it's
   effectively the same commit/build that was just tested. Which of these
   two Azure sets up (single resource with promotion vs. two resources) is
   decided when the "map another one to prod" step happens — noted as
   still open below.
5. Netlify (`master` → thepainterboys.com, documented above) is the
   **current** production host. Whether Azure replaces it, or the two run
   in parallel for a while, hasn't been decided yet — don't assume either
   without confirming, since it changes what "prod" means going forward.

### Azure setup — status

**Not yet done — needs your Azure Portal access, which I don't have.**
Nothing has been provisioned. Two things need to happen, in order per the
user's instruction ("deploy develop to azure first than we will map
another one to prod"):

**1. Test/staging resource, tracking `develop` (do this first)**
- Azure Portal → **Create a resource → Static Web App**.
- Source: **GitHub** → authorize → select this repo → branch: **`develop`**.
- Build presets: **Vite** (or "Custom" with app location `/`, output
  location `dist`, matching `npm run build`).
- Creating it this way auto-generates a GitHub Actions workflow file
  (`.github/workflows/azure-static-web-apps-*.yml`) via a bot commit into
  the repo, and auto-adds the deployment token as a GitHub Actions secret
  — this repo has no such workflow file yet, so this step is what creates
  it. I can't do this part myself; it needs to run through the Azure
  Portal (or `az staticwebapp create` from an authenticated Azure CLI,
  which I also don't have access to here).
- [staticwebapp.config.json](staticwebapp.config.json) (added now) gives
  Azure the same SPA-fallback behavior `netlify.toml`'s redirect rule
  gives Netlify — every route serves `index.html` client-side, so direct
  loads of `/services`, `/blog/:slug`, etc. don't 404.

**2. Production resource, tracking `master` (do this after step 1 is verified)**
- Same process, second Static Web App resource, branch: **`master`**.
- Custom domain (`thepainterboys.com`) only gets pointed at this one once
  it's confirmed working — don't touch the live DNS until then.

## ⚠️ `ThePainterBoybeforemovingtoCosmos` — do not update without explicit triple confirmation

This branch is a **parked, frozen snapshot** of `master` taken on 2026-08-19,
before the Cosmos DB / new-UI work began. It exists purely as a known-good
rollback point.

**Rule: never commit, push, merge, rebase, or otherwise change this branch
until the user has separately approved updating this specific branch three
times.** Three distinct approvals, each clearly about this branch — not one
approval counted three ways, and not a general "yes go ahead" covering other
work at the same time. If there's any doubt whether that's happened, stop
and ask rather than proceeding on a best guess. This applies to Claude and
to any human contributor reading this file.

### How to deploy this branch, if that's ever needed

This is a reference for a future rollback (e.g. the Cosmos DB migration on
`NewUiWithCosmosReBranding` goes badly wrong in production and the site
needs to revert to the last known-good pre-migration state). Netlify is
connected to this GitHub repo with `master` as the production branch, so
there are two ways to make this branch what's actually live:

**Option A — Netlify "Production branch" switch (safest, no force-push, fully reversible)**
1. Netlify dashboard → this site → **Site configuration → Build & deploy →
   Continuous deployment → Branches and deploy contexts**.
2. Change the **Production branch** setting from `master` to
   `ThePainterBoybeforemovingtoCosmos`.
3. Trigger a deploy (**Deploys → Trigger deploy → Deploy site**).
4. Verify `https://www.thepainterboys.com` is serving the parked version.
5. To undo: switch the Production branch setting back to `master` and
   trigger another deploy — the site returns to normal with no git history
   changes at all.

**Option B — Netlify's own deploy history (usually faster than either branch option)**
Netlify keeps every previous production deploy. **Deploys** tab → find the
last deploy made from `master` before the rollback was needed → **Publish
deploy**. This instantly re-publishes that exact build with zero git
operations. Prefer this over Option A if the goal is just "go back to what
was live an hour/day ago" rather than specifically "run the parked branch."

**Option C — Fast-forward/replace `master` itself (destructive — avoid unless Options A/B aren't available)**
Only if the Netlify production branch cannot be changed for some reason:
```
git checkout master
git reset --hard ThePainterBoybeforemovingtoCosmos
git push origin master --force
```
This force-pushes `master`, discarding whatever commits currently sit ahead
of the parked snapshot on the remote. **Never run this without the user
explicitly approving a force-push to `master`** — it is destructive to
shared history for anyone else who has pulled `master`, separate from (and
in addition to) the triple-confirmation rule for touching the parked branch
itself.

## Pre-deployment checklist

1. **Build locally first** — `npm run build` must succeed with no errors.
   Catches broken imports/syntax that only show up in a production build.
2. **Smoke-test the build** — `npm run preview` and click through: Home,
   Services, About, How It Works, Team, Paint Types, Contact, Blog list,
   one Blog post, `/pb` staff portal, a `/job/r<n>` link.
3. **Check `git status`** — make sure nothing unintended is staged (no
   `.env`, no local secrets, no stray scratch files).
4. **Re-read [siteConfig.js](src/siteConfig.js)** if this deploy touches
   copy — `PAGE_META` (titles/descriptions) and `NAV_PAGES` drive SEO and
   navigation across every page; a typo here ships site-wide.
5. **Known baked-in secret** — `PBDashboard.jsx`'s `DEFAULT_SCRIPT_URL`
   (the Google Apps Script Web App URL) ships inside the client bundle by
   design, so anyone who inspects the bundle has write access to the
   Google Sheet, bypassing the `/pb` password gate. This is an accepted
   trade-off for now — don't "fix" it by accident (e.g. don't swap in a
   *more* privileged Apps Script URL without knowing this).
6. **PWA cache** — the service worker (`vite-plugin-pwa`, `autoUpdate`)
   caches aggressively. After deploying a visual change, hard-refresh
   (or check in incognito) before concluding it didn't ship.
7. **Push to `master`** — Netlify picks it up automatically. Watch the
   Netlify deploy log for the build to go green.
8. **Verify live** — check `https://www.thepainterboys.com` after the
   deploy finishes, not just the Netlify preview URL.

## Planned backend work (not yet implemented)

The site is currently a static SPA with **no server-side backend** — job
data lives in a Google Sheet (published as CSV) edited via a Google Apps
Script Web App; there's no database, and no user authentication beyond a
shared password on `/pb`.

Two things are planned but not yet built, noted here so they aren't lost:

- **Customer portal with Google sign-in** (decided: Firebase — Auth +
  Firestore/Storage for photos — plus a separate dedicated mobile layout,
  and an admin module mirroring today's `/pb` staff portal).
- **Data store choice is still open** — Cosmos DB has also been raised as
  an option alongside/instead of Firebase. **Whatever is chosen, the
  Google Sheet must stay updated** when a new customer is added through
  the portal — staff currently rely on that Sheet (via `/pb` and the
  Apps Script) as their working view, so the new backend needs to write
  through to it (or replace it everywhere at once, staff workflow
  included) rather than fork into a second, unsynced source of truth.

This section should be updated (or deleted) once that backend exists, and
this file should gain a new checklist item for its own deploy/env-var
requirements at that point.

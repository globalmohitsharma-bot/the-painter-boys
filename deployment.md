# Deployment Guide — The Painter Boys

**Always read this file before deploying anything on this project — it has
already caught several real, repeatable failures (see "Known deployment
issues" below) that will happen again if skipped.**

## Android app (added 2026-08-26)

Wrapped with **Capacitor** — the app bundles the same `dist/` web build the
site itself ships, running in a native WebView (`appId`
`com.thepainterboys.app`). Same UI/functionality as the website by
construction, not a separate codebase.

- **Toolchain** (installed locally, not portable — reinstall if moving
  machines): JDK 21 (`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot` —
  Capacitor 8 specifically needs 21, not 17, or `compileDebugJavaWithJavac`
  fails with `invalid source release: 21`), Android SDK command-line tools
  at `C:\Android\Sdk` (`ANDROID_HOME`/`JAVA_HOME` set as **User** env vars).
- **Release signing keystore**: `android-keystore/thepainterboys-release.keystore`
  (gitignored, password in `android/keystore.properties`, also gitignored).
  **This file must be backed up somewhere durable outside this machine and
  outside git** — losing it means losing the ability to ever publish an
  update to this app under its existing Play Store listing. There's no
  recovery path once uploaded to Play with Play App Signing if the *original
  upload key* is lost before it's ever been used — back it up now, not
  later.
- **Rebuild after any web change**:
  ```bash
  npm run build              # refresh dist/
  npx cap sync android       # copy dist/ + plugin changes into the native project
  cd android
  ./gradlew.bat bundleRelease   # -> app/build/outputs/bundle/release/app-release.aab
  ```
  (`JAVA_HOME`/`ANDROID_HOME` must be set in the shell running gradlew —
  they're User env vars so a fresh terminal picks them up automatically;
  the Bash tool's Git Bash shell sometimes doesn't inherit User env vars
  set via PowerShell in the same session — export them manually if
  `gradlew.bat` can't find the SDK.)
- **Native Google Sign-In, not the web GIS widget**: Google's web Identity
  Services SDK refuses to complete sign-in inside *any* embedded app
  WebView (policy-level block, returns a generic `origin not allowed`
  error — confirmed not fixable by whitelisting, see testing.md's GSI
  false-alarm section for the closely related Playwright case). Fixed via
  `@capawesome/capacitor-google-sign-in`, which uses Android's Credential
  Manager API — see `src/nativeGoogleSignIn.js`, branched into from
  `AccountModal.jsx`/`MyProjects.jsx`/`AdminPortal.jsx` via
  `Capacitor.isNativePlatform()`. Still issues a token for the **same Web
  OAuth Client ID** the backend already verifies against
  (`GoogleTokenAuthenticationHandler`) — no backend auth code changed.
- **Requires a manual step in Google Cloud Console** (same project as the
  existing Web OAuth client): add a new **Android**-type OAuth Client ID,
  package name `com.thepainterboys.app`, with the SHA-1 fingerprint(s)
  below registered. Sign-in in the app will fail until this is done.
  - Debug keystore SHA-1 (`~/.android/debug.keystore`, auto-created by the
    first `gradlew assembleDebug`): `B0:9E:06:FA:87:55:53:5E:0D:FF:19:00:00:2C:B7:69:ED:C5:DD:6D`
  - Release keystore SHA-1 (the upload key above):
    `D2:7A:60:F4:74:9B:D5:EA:16:5D:C4:E6:D5:CA:6A:10:25:65:39:67`
  - **A third SHA-1 will appear after the first Play Store upload** if Play
    App Signing is used (Google re-signs the app with its own key) — that
    one also needs adding once visible in Play Console (App integrity →
    App signing key certificate).
- **Backend CORS**: `https://localhost` added as `AllowedOrigins__4` (Azure
  App Service app setting) — this is the origin Capacitor's default
  `androidScheme: "https"` config serves the WebView from, so it's what the
  app's `fetch()` calls to `api.thepainterboys.com` present as `Origin`.
- **No Android emulator available on this dev machine** — `Get-ComputerInfo`
  shows `HyperVRequirementVirtualizationFirmwareEnabled: False` (nested
  virtualization not exposed), so an AVD would run unaccelerated at best,
  more likely fail to boot. **Test on a real device via
  `adb install app-debug.apk`** (USB debugging enabled) instead — also just
  a better test than an emulator regardless.
- **App icon/splash source**: `assets/icon.png` (1024×1024, mark on white),
  `assets/icon-foreground.png` + `assets/icon-background.png` (adaptive
  icon layers), `assets/splash.png` (2732×2732, mark on `#0d2137` navy) —
  cropped from `public/logo.png`'s icon mark (excluding the wordmark text,
  which doesn't read at icon size) with a manual background-removal pass
  (color-distance threshold against the off-white source background; sharp
  has no built-in chroma-key). Regenerate all densities after changing a
  source file: `npx capacitor-assets generate --android`.

## Current hosting (updated 2026-08-20 — Netlify fully retired)

- **Frontend**: Azure Static Web Apps. `develop` → `ThePainterBoys-web`
  (staging, `victorious-plant-0a9de771e.7.azurestaticapps.net`). `master` →
  `ThePainterBoys-web-prod` (`mango-dune-0837ad21e.7.azurestaticapps.net`,
  custom domain `www.thepainterboys.com`). Build-once-promote CI —
  see [.github/workflows/build-and-promote.yml](.github/workflows/build-and-promote.yml)
  and the "Azure setup" section further down.
- **Backend**: ASP.NET Core Web API on Azure App Service,
  `ThePainterBoys-api` (`aiinterviewbotPilot_group`, dedicated
  `ThePainterBoys-plan` B1 Linux plan — **not** the shared
  `AIInterviewBotPilot` production plan). Keyless auth to Cosmos + Blob
  Storage via the App Service's system-assigned managed identity
  (`DefaultAzureCredential`, same pattern as local dev's `az login`).
- **Domain**: `thepainterboys.com` registered at **GoDaddy** (account id
  `es.mohitsharma`). Netlify previously hosted it via delegated NS1
  nameservers — moved to GoDaddy's own nameservers, then to Azure: apex
  (`thepainterboys.com`) **forwards (301)** to `www.thepainterboys.com`
  (GoDaddy can't ALIAS/ANAME the apex directly to Azure), and `www` is a
  real `CNAME` → `mango-dune-0837ad21e.7.azurestaticapps.net`, registered
  as the custom domain on `ThePainterBoys-web-prod`. No MX records exist,
  so this had no email impact.
- Netlify is **no longer used for anything** on this project — the two
  Netlify projects that were briefly investigated
  (`the-painter-boys`, `silver-druid-06c38c`) can be considered stale/
  unused going forward.

## Known deployment issues (read before every deploy)

Real failures hit while setting this up — all reproducible, all avoidable
if you know to expect them:

1. **Azure Static Web Apps' auto-generated GitHub Actions workflow leaves
   `output_location` blank.** Build succeeds, then deploy fails with
   *"Oryx built the app folder but was unable to determine the location of
   the app artifacts."* Fix: set `output_location: "dist"` in the workflow
   YAML (see the working `build-and-promote.yml` for reference).
2. **Build-time frontend env vars (`VITE_*`) don't carry over between
   hosting providers or pipelines — ever, silently.** `VITE_GOOGLE_CLIENT_ID`
   had to be independently: (a) added as a GitHub Actions repo secret
   (`gh secret set`), and (b) explicitly passed as `env:` on the build step
   in the workflow YAML. Missing either one means Google Sign-In silently
   shows "not configured" with no error — always verify by grepping the
   built JS bundle for the expected value after a deploy
   (`curl <site>/assets/index-*.js | grep <expected-string>`).
3. **The build-once-promote CI pattern (`build-and-promote.yml`) only works
   if `develop` → `master` merges stay fast-forward.** `deploy-prod` finds
   the matching `develop` build by exact commit SHA — a real merge commit
   changes the SHA and the promotion fails safely (loud error, not a silent
   rebuild) rather than deploying something unverified.
4. **Git Bash mangles any argument starting with `/`** (leading-slash
   paths) — this breaks `az` commands that take a full resource ID as
   `--scope` (role assignments, custom domain validation, etc.), producing
   confusing errors like `MissingSubscription` that have nothing to do with
   the actual problem. **Use the PowerShell tool for any `az` command with
   a `/subscriptions/...`-style argument.**
5. **Azure resource creation (storage accounts, App Service plans, role
   assignments with real cost/access impact) can get blocked by Claude
   Code's own safety classifier**, even after the user already approved it
   earlier in conversation — this needs one more direct confirmation in the
   moment before retrying. Not a bug, working as intended; don't try to
   route around it.
6. **`dotnet build`/`publish` fails with `MSB3027`/`MSB3021` file-lock
   errors if the previous `dotnet run` background process is still
   holding the exe.** Stop that background task first, every time.
7. **Publishing on Windows without `-r linux-x64` bundles Windows-only
   native runtime assets** (`runtimes\win-x64\...`, `runtimes\win\...` —
   pulled in by packages like the Cosmos SDK and `System.Drawing.Common`)
   **with backslash-separated paths that break Azure App Service's
   Linux-side `rsync` deployment** — fails with cryptic `Invalid argument
   (22)` errors on `recv_generator`. Fix: always publish backend deploys
   with `dotnet publish -c Release -r linux-x64 --self-contained false -o
   ./publish` — this also drops the zip from ~11 MB to ~4.5 MB by excluding
   every other platform's native assets.
8. **`zip` isn't available in Git Bash on this machine.** Use PowerShell's
   `Compress-Archive -Path ./publish/* -DestinationPath publish.zip -Force`
   instead.
9. **Cosmos DB data-plane RBAC uses a different command than everything
   else** — `az cosmosdb sql role assignment create` (with the Cosmos
   account's own `sqlRoleDefinitions/00000000-0000-0000-0000-000000000002`
   built-in "Data Contributor" role ID and a `/dbs/PB_ThePainterBoysDb`-
   scoped path), not the generic `az role assignment create` used for
   Storage/other resources.
10. **A registrar isn't necessarily the DNS provider.** GoDaddy showed "DNS
    Provider: NS1 — DNS is currently managed elsewhere" and its own DNS
    Records tab was inactive until nameservers were switched to GoDaddy's
    default — check this before assuming records can just be edited.
11. **GoDaddy doesn't offer ALIAS/ANAME records**, so an apex domain can't
    point directly at an Azure Static Web App (which has no fixed IP).
    Workaround (Microsoft's own documented pattern for registrars without
    ALIAS support): make `www` the real `CNAME` target, and use the
    registrar's **Domain Forwarding** feature (301, no masking) to redirect
    the bare apex to `www`.
12. **Azure Static Web Apps apex-domain validation needs
    `--validation-method dns-txt-token`** explicitly — the default
    (`cname-delegation`) fails outright on an apex domain since CNAME isn't
    valid at a root domain per DNS rules. (Ended up unused once the
    www-forwarding approach was chosen instead, but worth knowing if a
    future project's registrar *does* support ALIAS/ANAME.)
13. **Item 8's `Compress-Archive` fix isn't actually reliable** (found
    2026-08-26, backend has since grown enough dependencies — Data
    Protection, more Cosmos/Azure packages — that a plain `dotnet publish`
    without `-r linux-x64` again produced nested folders with
    backslash-separated zip entries, breaking Kudu's `rsync` the same way
    item 7 describes). `Compress-Archive` **and**
    `[System.IO.Compression.ZipFile]::CreateFromDirectory` both write
    OS-native (backslash) separators for nested paths on Windows — neither
    is spec-correct. The reliable fix is to build the zip entry-by-entry
    and force forward slashes explicitly, via the PowerShell tool:
    ```powershell
    Add-Type -AssemblyName System.IO.Compression
    $base = "<repo>\backend\publish-out"
    $zipPath = "<repo>\backend\deploy.zip"
    $fs = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
    $archive = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
    Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($base.Length + 1).Replace([System.IO.Path]::DirectorySeparatorChar, [char]47)
        $entry = $archive.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($_.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close(); $entryStream.Close()
    }
    $archive.Dispose(); $fs.Close()
    ```
    This works regardless of whether `-r linux-x64` was used, so it's the
    one to reach for now — items 7/8 are kept above for context but this
    supersedes them. Verify before deploying: open the zip and confirm
    zero entries contain a backslash.
14. **`dotnet publish -o publish-out` has left (or regenerates) a stale
    nested `publish-out/publish/` subfolder** containing a handful of
    duplicate/RID-specific files (`appsettings*.json`, `*.deps.json`,
    `*.runtimeconfig.json`, `*.staticwebassets.endpoints.json`) —
    redundant with the copies already at `publish-out/`'s root. Git Bash's
    `rm -rf publish-out` did not reliably clear it on a re-publish; using
    PowerShell's `Remove-Item -Recurse -Force` on the whole `publish-out`
    directory before republishing did. Always check
    `find publish-out -maxdepth 1 -type d` (should show only `publish-out`
    itself plus `runtimes` if present, nothing named `publish`) before
    zipping — delete the subfolder if it's there.
15. **Pushing `develop` and immediately fast-forwarding+pushing `master`
    right after races the `develop` build itself.** `deploy-prod` looks for
    an already-*successful* `Build and Promote` run on `develop` for
    master's exact commit SHA — if `master` is pushed before `develop`'s own
    CI run for that commit has finished, the promote job fails immediately
    with *"No successful 'Build and Promote' run found for commit ..."*,
    even though the commit is perfectly fine and develop's build goes green
    moments later (confirmed 2026-08-30). Fix: **wait for `develop`'s CI run
    to complete (`gh run list --branch develop --limit 1`) before pushing
    `master`** — or, if the race already happened, just
    `gh run rerun <failed-run-id>` once develop's build shows `success`; no
    code change or re-push needed, since master's commit was never actually
    the problem.

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

**Standing rule: prod is never touched without the user explicitly saying
"move to prod" (or an unambiguous equivalent) as a direct instruction, in
that moment.** Merging `develop` into `master`, or deploying to the Azure
test environment, does not imply prod approval — those are separate,
lower-stakes steps and don't require this. A message that only sounds
adjacent to a go-ahead (thinking out loud about environments, asking
questions about prod) is not the trigger. When in doubt, ask rather than
treat something as that signal. Mirrors the same rule already standing on
the sibling `FindBuyRentProtect` project, adopted here for consistency.

### Azure setup — status (updated 2026-08-20)

Both Static Web App resources now exist, in `aiinterviewbotPilot_group`
(shared `pilotai`-account resource group), created via `az staticwebapp
create --login-with-github` (device-code auth — the user completed the
GitHub device-flow approval, I ran the CLI):

**1. Test/staging resource, tracking `develop` — done**
- Name: `ThePainterBoys-web`, hostname
  `victorious-plant-0a9de771e.7.azurestaticapps.net`.
- Workflow: `.github/workflows/azure-static-web-apps-victorious-plant-0a9de771e.yml`.
- [public/staticwebapp.config.json](public/staticwebapp.config.json) gives
  Azure the same SPA-fallback behavior `netlify.toml`'s redirect rule
  gives Netlify — every route serves `index.html` client-side, so direct
  loads of `/services`, `/blog/:slug`, etc. don't 404. **Must live under
  `public/`, not the repo root** — Vite copies `public/` verbatim into
  `dist/` on build, and Azure SWA reads the config from the build output,
  not the repo root. Got this wrong on the first pass here (root-level),
  caught by cross-checking a sibling project's deploy notes before it ever
  got deployed and 404'd for real.

**2. Production resource, tracking `master` — done (2026-08-20, "move to
prod" instruction given)**
- Before creating this, `develop` (38 commits — redesign, LeadBot,
  routing/SEO, `AccountModal`/`useGoogleAccount` Google sign-in) was
  merged into `master` (fast-forward, no conflicts) and pushed — that push
  is what triggered Netlify's normal `master`-tracking prod deploy, so
  those 38 commits are already live on `thepainterboys.com` via Netlify as
  of this merge.
- Name: `ThePainterBoys-web-prod`, hostname
  `mango-dune-0837ad21e.7.azurestaticapps.net`.
- Workflow: `.github/workflows/azure-static-web-apps-mango-dune-0837ad21e.yml`.
- **No custom domain attached yet** (`customDomains: []` on the resource).
  This resource is live at its own `*.azurestaticapps.net` URL only —
  `thepainterboys.com` still resolves to Netlify. Pointing the domain at
  this resource (and deciding whether Netlify gets fully replaced or the
  two run in parallel) is a separate, not-yet-taken step — needs an
  explicit instruction naming that specifically before it happens, per the
  standing rule above.

### Lessons pulled from a sibling project's deploy notes (2026-08-19)

The user pointed at `docs/deployment.md` in a different project on this
machine (`FindBuyRentProtect` — Azure Static Web Apps + App Service +
Cosmos DB, same kind of stack this project is moving toward) as a
reference. Worth keeping these in mind here rather than rediscovering them
the hard way:

- **Claude Code is blocked from fetching Azure deployment tokens/secrets**
  by its own safety classifier, even for this project's own resources —
  confirmed precedent, not a guess. `az staticwebapp secrets list` (or
  reading a saved token from a local file) gets refused. **The deployment
  token has to come from the user** (Azure Portal → the Static Web App →
  Overview → Manage deployment token), or the user runs the deploy
  themselves. Don't spend time trying to work around this.
- **Decided (2026-08-19): this project shares the `pilotai` Cosmos account
  / `aiinterviewbotPilot_group` resource group**, rather than getting its
  own — same account already used by `FindBuyRentProtect`
  (`FBPR_*`), `InterviewBotAuth`, and `TeasHarnessCosmos`. Two things
  follow directly from that:
  1. **Every container/database name for this project must use its own
     distinct prefix** — not yet finalized, but `PB_` (matching the
     `FBPR_` convention already in use) is the natural choice; confirm
     the exact prefix before creating anything, then use it consistently.
  2. **The account's total throughput is shared and was already near its
     cap** before this project joins — raised once already, to 1400 RU/s,
     split across the three existing tenants. **Check actual remaining
     headroom (`az cosmosdb show` / portal metrics) before provisioning a
     new database here** — don't assume capacity is free just because the
     last raise succeeded; a second raise may be needed, and that's worth
     flagging to the user rather than silently requesting one.
  3. If a database is created here, follow the shared-throughput sequence
     that worked for `FBPR_SocietyEstateDb`: create the database *with*
     `--throughput` on the shared pool first, then create containers
     *without* `--throughput` so they draw from that pool — creating a
     container before the database has shared throughput set caused it to
     silently grab its own dedicated allocation last time (had to delete
     and recreate to fix).
- **If a backend ends up on that same shared App Service plan**
  (`ASP-aiinterviewbotPilotgroup-9918`) — separate decision, not made yet
  — that plan also hosts a **live production app** for a totally unrelated
  project (`aiinterviewbot.com`). Any `az webapp` command against it needs
  the `--name` triple-checked before running, every time.
- **Azure CLI from Git Bash mangles leading-slash arguments** (e.g.
  `--partition-key-path "/id"` gets rewritten like a Windows path) — run
  Cosmos-related `az` commands from PowerShell instead, or prefix with
  `MSYS_NO_PATHCONV=1`.
- That project runs under a **standing rule: prod is never touched without
  the user explicitly saying "move to prod"** (or an unambiguous
  equivalent) in that literal moment — merging to `master` or deploying to
  test does not imply it. This project's release-flow section above
  already treats "map another one to prod" as a distinct, later,
  separately-approved step, which is the same spirit — worth being just
  as strict about it here as that project is.

Cosmos account sharing is now decided (above); the App Service plan
question is separate and still open — update this section once that's
settled too.

### Reference config values pulled from FindBuyRentProtect (2026-08-19)

Checked that project's `backend/appsettings*.json` for anything to bring
over. **No actual secret/key exists to copy** — Cosmos auth there is
Azure AD only, by design (no `AccountKey` field at all — see the gotcha
above on why), and the one real secret that does exist there (SMTP
password) is blank/unset, so there's nothing sensitive in play either way.
What follows is plain, non-sensitive config, recorded here for reference
since **this project has no backend yet** — there's no `appsettings.json`
equivalent to wire it into until one exists:

- **Cosmos `AccountEndpoint`** (same for any database on the shared
  account): `https://pilotai.documents.azure.com:443/`
- **This project's `DatabaseName`**, once created, should follow the
  `PB_` prefix convention agreed above — not created yet.
- **Google OAuth Client ID already in use across projects on this
  account**: `761494778320-lu30acdh3t704jisnc2hj1t24jkqhldp.apps.googleusercontent.com`
  ("TeasHarness Web" client, shared/additive — see the sibling project's
  notes on adding a new origin to an existing client vs. creating a new
  one). Not necessarily the right choice for this project's Google
  sign-in — reusing it is an option, not a decision; a project-specific
  OAuth client is equally valid and keeps origins/consent-screen branding
  separate. Needs an explicit choice before wiring in either way.

This section stays reference-only until a backend actually exists here to
consume it — **except the Google OAuth Client ID**, which the frontend
now actually consumes (below).

### Google Sign-In (BottomNav.jsx) — real code, not yet configured (2026-08-19)

The mobile bottom nav's "My Projects" / "Profile" tabs open a real Google
Identity Services sign-in button (Google's own `renderButton`, not a mock)
— see [src/BottomNav.jsx](src/BottomNav.jsx). It's genuinely non-functional
right now by design (the user explicitly chose "build the real button now,
wire the Client ID later" over a fake "coming soon" placeholder):

- Reads `import.meta.env.VITE_GOOGLE_CLIENT_ID` — **not set anywhere**, so
  the button renders (the GIS script loads fine with no client ID) but
  Google will reject the sign-in attempt until a real one is supplied.
- **To make it work**: set `VITE_GOOGLE_CLIENT_ID` as a build-time env var
  in Netlify (Site configuration → Environment variables) — Vite only
  inlines `VITE_*` vars at build time, so this needs a rebuild/redeploy
  after adding it, not just a config change.
- **Which Client ID to use is still an open choice** — reuse the shared
  one from the `pilotai`-account projects (see above) or create one
  specific to `thepainterboys.com`. If reusing the shared one, this
  domain's origins (`https://www.thepainterboys.com`,
  `http://localhost:5173`, plus whatever the Azure test URL ends up being)
  need adding to that OAuth client's **Authorized JavaScript origins** in
  Google Cloud Console first — same process documented in the sibling
  project's notes.
- **What sign-in actually does today**: decodes the ID token client-side
  (name/email/photo) to show a signed-in state and stores it in
  `localStorage` — **this is display-only, not verified/secure auth**
  (verifying the token's signature needs a backend, which doesn't exist
  yet). Don't treat this as real authentication for anything sensitive
  until the backend verifies it server-side.

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

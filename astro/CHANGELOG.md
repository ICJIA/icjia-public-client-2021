# Changelog — ICJIA Astro migration

All notable changes to the Astro (`astro/`) rewrite of `icjia.illinois.gov`.
This is the live-data SSR migration tracked on the `feat/astro-migration` branch.

## [0.42.4] — 2026-05-31 — fix(cutover): B3 no-slash→slash canonicalization via Astro middleware

- **`src/middleware.ts`** (NEW) — 301 no-slash → trailing-slash for on-demand (SSR) section landings
  (`/news`, `/grants/funding`, `/researchhub`, `/events`, …) that Astro SSR otherwise 404s on the bare
  URL (legacy 200'd them — a regression flagged as audit B3). GET/HEAD only; skips root, files (dotted
  last segment), and `/_*` + `/.netlify` internals; preserves the query string. Chosen over a
  `_redirects` rule because Netlify's `_redirects` matching is slash-INSENSITIVE, so a `/news /news/ 301`
  rule also matches `/news/` and 301-LOOPS (tried + reverted in an earlier session).
- **Caveat (pending deploy-verify):** `astro dev`'s router 404s unmatched paths *before* middleware, so
  the no-slash redirect can't be smoke-tested in dev (confirmed: `[MW]` logs for `/news/` but not
  `/news`). The production SSR function runs the full pipeline (middleware before the 404 render, per
  Astro docs), so it takes effect on the Netlify deploy. MUST verify post-deploy:
  `curl -sI <deploy>/news` → expect `301 → /news/`. If it doesn't fire on Netlify either, fall back to
  per-route Astro `redirects` config or accept trailing-slash-canonical-only.

## [0.42.3] — 2026-05-31 — fix(cutover): missing sub-site redirects (B2) + purge-webhook map gaps (B4)

A 9-agent **cutover-readiness audit** (workflow) produced a prioritized punch-list; verdict NO-GO until
B1–B4 (all small/localized). Fixed the two real code/config now-fixes (B1 + CSP-enforce are owner
AT-CUTOVER steps, not code changes):
- **B2 — 7 legacy sub-site redirects were MISSING** from `astro/public/_redirects` (404 on Astro, 301 on
  prod): `/researchhub/docs`, `/cjreform2015`, `/r3`, `/ilheals`, `/calendar`, `/dvfr`, `/ariallsites2023`.
  Mirrored verbatim from the root `public/_redirects` (default 301 to host root, no `:splat`).
  `/researchhub/docs/*` placed in the external-301 group (edge rule → precedes the SSR `/researchhub`
  catch-all).
- **B4 — `purge-cache.mjs` MODEL_TAG/STATIC_MODELS gaps** left 3 LIVE-rendered models with no
  purge-on-publish (silent no-op until s-maxage): added `program→grants`, `page→page`,
  `publication→publications`, `requiredForm`/`required-form→page`, `home→home`; shrank `STATIC_MODELS` to
  `{unit}` (page + publication render LIVE/SSR). Tags verified against `setCache()` in the routes;
  multi-word model hyphenation is caught by the at-cutover test-publish (both spellings mapped).

Audit VERIFIED-GOOD: live-data SSR + Durable cache (real HITs), sitemap/search parity-exact (2386=2386,
security scrubbers intact), SEO production-ready, security headers well-tuned, scheduled-fn logic robust.
PENDING (owner at-cutover): B1 `netlify.toml [build]` promotion, CSP enforce + per-prefix sub-app CSP
exclusions (the `/*` enforced policy would break the 7 proxied sub-apps via intersection), env repointing
(NETLIFY_BUILD_HOOK_URL → main, PURGE_SECRET). **B3** no-slash→slash 301 needs Astro middleware (the
`_redirects` 301 approach loops on Netlify's slash-insensitive matching — tried + reverted earlier).

## [0.42.2] — 2026-05-31 — fix(astro): CMS-body headings → Lato (was Oswald); VR harness proven deterministic

- **`legacy-globals.css`** — the global `h1..h6 { Oswald }` leaked into `.markdown-body`, so CMS
  content headings *and* the page-title h1 rendered in Oswald. **Prod renders them all in Lato**
  (github-markdown inherits the body font: page-title h1 = Lato 900, content h2/h3 = Lato 700). Added
  `.markdown-body :is(h1..h6) { font-family: Lato }` (same layer, higher specificity). Verified: about +
  news now match prod's heading metrics EXACTLY. Oswald untouched for site chrome + ResearchHub scopes.
- **VR harness is DETERMINISTIC (key):** prod-vs-prod VR = **0.00%** on all 3 viewports (frozen clock +
  masks + same-engine capture). So the residual **astro-vs-prod % is REAL, not capture noise** — this
  CORRECTS [0.41.1]/[0.42.1]'s "noise-dominated" framing. about-page still ~12% after the heading +
  offset fixes with all text metrics matching → residual is text rasterization (prod's Google-hosted
  Lato vs Astro's self-hosted `@fontsource` Lato) or sub-pixel positioning. The full VR sweep + triage
  will characterize whether per-template diffs are font-rendering (visually identical, pixel-real) vs
  real layout/content regressions.
- New finding (queued): list-page title h1 size differs (grants/funding 32px/700 in Astro vs 36.8px/900
  prod) — a list-template title-styling fix, separate from the CMS-body `.markdown-body` path.

## [0.42.1] — 2026-05-31 — test(vr): h1-anchored diffing + CMS-heading font mismatch found

- **`run.mjs` — h1-anchored diffing.** `align()` now vertically anchors both frames to the `<h1>`
  before the common-area crop: `snap()` returns the h1 top (CSS px → ×deviceScaleFactor), and each
  frame is cropped from its OWN h1 so the accepted ≤20px top-offset drops out instead of shifting
  every text row. Non-fullPage captures (footer/element) have no h1 → cropTop 0 → prior top-anchor
  behavior. Generalizes the crop-to-common-height step.
- **Finding — the real % driver is NOT the offset.** With the offset anchored out, about-page still
  diffs ~12–15%; the diff-PNG shows faithful layout/structure but **all text red**. Root cause:
  **CMS-body headings render in Oswald on Astro but Lato on prod** (`.markdown-body h2/h3` =
  25.6px/20px 700, prod `"Lato"` vs Astro `"Oswald"`; body `li` matches at Lato 16/24). Prod uses
  Oswald only for the page-title/chrome — github-markdown *content* headings inherit Lato; Astro's
  heading-font rule is over-broad and reaches into `.markdown-body`. **NEXT (high value):** scope
  Oswald off CMS-body headings (→ Lato). Likely the single biggest remaining parity lever — it
  affects every CMS page's subheadings, and it's why the full-page % stays high even when content
  is faithful.

## [0.42.0] — 2026-05-31 — fix(astro): splash hero container-width + BasePage −15 nudge (VR header offset)

Resolved the bulk of the VR vertical offset via a local `astro dev` + `measure-header.mjs` loop.
**Correcting [0.41.1]'s root-cause:** the offset is NOT "entirely content-wrapper padding" — it is
multi-causal and route-specific, because Astro **unifies several legacy Vue views (each with its own top
spacing) into shared templates**. Measured per-route h1 offsets ranged from −1px (bio, already aligned) to
**+71px** (splash articles). Scope (user-approved, "targeted high-value"): fix the high-value cases, accept
≤~20px residual deltas on minor pages, gate via VR diff-PNGs (not the full-page %).

- **`Splash.astro`** — the hero was a **100vw full-bleed** (1280×640 at desktop) on a *false* "prod is
  edge-to-edge" premise. Prod's CMS splash is **container-width** (measured **1161×581**, 2:1, inside the
  v-container). Removed the bleed → the hero is now plain block-width = the content column
  (`max-w-[1185px] − px-3` = 1161px) → **1161×581, pixel-identical to prod**. news-article h1 **+71 → +12**.
  Fixes every splash consumer (`news/[slug]`, infonet, `BasePage`).
- **`BasePage.astro`** — prod `BasePage.vue` applies `<v-container style="margin-top:-15px">`
  **unconditionally**, and it *works* there (the container isn't `.markdown-body`'s first child). In Astro the
  `-mt-[15px]` was (a) wrongly gated on `!page.splash` and (b) a **no-op** regardless — the grid IS
  `.markdown-body`'s first child, so github-markdown's `.markdown-body > :first-child { margin-top:0 !important }`
  zeroed it. Reproduced prod's always-on nudge via `.bp-grid { margin-top:-15px !important }` (matching
  importance + higher specificity). Result: about **+34→+19**, innovation **+14→−1**, irb **−5→−20**,
  news **+12** — all within the ±20 band. (The unit page is a separate `unit-single-frame` template,
  unaffected; already +19.)

**VR gate note:** the full-page % does NOT drop with a sub-line-height residual offset (about stays ~11–15%)
because pixelmatch flags every text row shifted more than one line-height. So at ±20px tolerance the % is
unusable as a gate (as expected, per [0.41.1]). NEXT: add **h1-aligned diffing** to `run.mjs` (vertically align
both captures to the h1 before diffing) so the accepted constant offset drops out and the diff-PNGs surface only
real differences. `measure-header.mjs` gained an `MR_ASTRO` env override for the local (no-deploy) loop.

## [0.41.1] — 2026-05-31 — test(vr): crop-to-common-height + header-offset root-cause

VR methodology refinement (the full-page %s were noise-dominated for cross-engine Vue/Vuetify vs Astro):
- `run.mjs` `align()` now **crops both frames to the common (min) height** instead of white-padding the
  shorter to the max — so a page-length difference between two live sites no longer floods the diff.
  Measured: about-page mobile 20.1%→**15.5%**, md 14.8%→**10.1%** (the height-padding portion removed).
- `scripts/vr/measure-header.mjs` (NEW): measures where content starts (h1 top + header-region element
  bands) prod vs branch — used to root-cause the VR vertical offset.

**Header offset root-caused:** the context bar MATCHES prod exactly (both 70px). The ~34px offset is
entirely the **content-wrapper top padding** — prod's h1 sits ~21px below the bar, Astro's at 56px
(`BasePage`'s `py-8` = 32px top + the h1 margin). The fix is an *iterative* content-padding tune (it
interacts with the `-mt-[15px]` splash-nudge across ~40 wrappers — needs per-change measurement, best
via a local-preview loop), deferred to a focused pass. With it fixed, the residual VR % drops to the
cross-engine AA floor and the numeric gate becomes usable; until then the **diff PNGs are the gate**
(visual triage confirms content parity is faithful) and the % is a triage aid.

## [0.41.0] — 2026-05-31 — feat: restore Google Translate (was entirely missing) — context-bar + footer

The VR header-offset investigation surfaced that **Google Translate wasn't functional** on the Astro
site: the footer "Translate Site" button was a dead stub (`data-translate-trigger` with no handler)
and prod's context-bar "Translate this site" trigger was absent. Restored to match legacy
`ModalTranslate.vue` (a real LEP/access feature):
- **`TranslateModal.astro`** (NEW): a native `<dialog>` (focus-trap / Esc / ::backdrop) — 18 languages
  in 3 columns + the Google-Translate/LEP disclaimer (links to the LAP form + language-services
  announcement). Each language opens Google's hosted translation of the CURRENT page in a new tab
  (`translate.google.com/translate?hl=en&sl=en&u=<page>&tl=<lang>`) + fires the legacy Plausible
  `translation_conversion` event. A bundled (CSP-safe) script wires every `[data-translate-trigger]`.
- **SiteContextBar**: restored "🌐 Translate this site" on the navy breadcrumb (right), gated by the
  section's `showTranslation` (globe-only `<960px`, full label `≥960`). The trigger carries
  `aria-label="Translate this site"` so it keeps an accessible name when the label is hidden on
  mobile (verified via a Chrome interaction test — the modal opens with focus-trap + all 18 languages).
- **Footer** "Translate Site" now works (the modal script wires its existing trigger).
- Mounted once in BaseLayout. No CSP change (window.open new-tab navigation, not a fetch/iframe).

## [0.40.0] — 2026-05-31 — test + fix: data/cache/config unit tests (layer 2) — caught a file-size bug

Test-suite layer 2 (Vitest, offline/deterministic — the hybrid strategy):
- `data.test.ts` — ~25 pure view-model helpers (label mappers, date/byte formatters, `slugifyHeading`,
  `truncateWords`, `getFileType`, `isNew`, `filterUpcoming`, `monthBucket`, `strapiUrl`).
- `cache.test.ts` — `setCache` headers + purge cache-tags (incl. aggregator dedup, bios 120s TTL).
- `config.test.ts` — renderStrategy live/static no-overlap, cacheTTL `[s-maxage,swr]` sanity +
  keep-warm SWR ≫ the 300s ping, keepWarm trailing-slash paths.
**61 tests pass** (with the existing sanitizer parity suite).

**BUG CAUGHT + FIXED:** `NICE_UNITS` was `["B","MB","MB","GB",…]` — index 1 (the **KB** range) was
mislabeled "MB" and "MB" was duplicated. So `niceBytes()` rendered every file **1 KB–1 MB ~1000× too
large** (a 50 KB attachment showed "50 MB"). Fixed to `["B","KB","MB","GB",…]`; the test now asserts
`niceBytes(51200) === "50 KB"`. Affected attachment + publication file-size labels for sub-1 MB files.

## [0.39.6] — 2026-05-31 — fix(a11y): ResearchHub carousel slide-dots meet WCAG 2.5.8 target-size

The warm axe + Lighthouse sweep across every template found exactly ONE a11y violation: the
`/researchhub/` carousel slide-dots were 12×12px buttons (`target-size [2.5.8 AA]` fails; the prior
`::after` overlay didn't help — axe measures the element box, not a pseudo-element). Fixed: the
BUTTON is now a 24×24 target with the visible 12px dot drawn by `::before` (centered). axe
`/researchhub/` → **0**.

**Sweep result (mobile, warm):** a11y / best-practices / SEO = **100 across every template**;
perf **95–100 warm** (home 100, publications 99, apps 98, researchhub 97, hub-article 97, meetings
96, funding 96, bio 96, news 95). Branch cold-start variance is a keep-warm-fixable artifact (Durable
cache confirmed working via `cache-status`; the definitive perf gate is a post-cutover warm sweep).
Minor perf follow-up (non-blocking): image-delivery savings on the carousel splash (~244 KiB) +
news/article thumbs.

## [0.39.5] — 2026-05-31 — test: `--warm` mode (cache-warm before Lighthouse so perf reflects the warm path)

`pnpm warm` / `warm:full` (a `--warm` flag on route-health.mjs): GETs each route 3× to populate
Netlify's Durable (edge) cache, so a Lighthouse run RIGHT AFTER measures the WARM path — what prod
serves under keep-warm — instead of the branch's cold-start (which gave false-low perf, e.g.
`/grants/funding/` 91 cold → 96 warm). SWR then holds the warm copies through the whole sweep.
One-time local test aid, NOT a deployed/prod function. Reports per-round avg/slowest TTFB so you can
see the cold→warm drop.

## [0.39.4] — 2026-05-31 — chore: accept trailing-slash-canonical (no-slash SSR → 404); redirect attempt reverted

Investigated making no-slash SSR routes (`/news`, `/grants/funding`, `/researchhub`, …) redirect to
their `/slash/` canonical (the legacy SPA 200'd every path; under SSR they 404). BOTH approaches
proved unworkable on Netlify:
- **B (global):** `@astrojs/netlify` v7 routes the SSR function only at the trailing-slash path and
  doesn't emit no-slash redirects; Netlify has no safe generic add-slash rule.
- **A (per-landing 301s):** **Netlify redirect matching is trailing-slash-INSENSITIVE** — a rule
  `/news → /news/` ALSO matches `/news/`, redirecting the canonical URL to itself → a **301 loop**
  (it broke `/news/` etc. on the branch; reverted here in the same session).

So we accept **trailing-slash-canonical only**: `/news/` works; bare `/news` 404s. Low risk — every
internal link, the sitemap, and canonical tags use trailing slashes; only external/hand-typed
no-slash links are affected. (A Netlify Edge Function could add slashes later if it ever matters.)

## [0.39.3] — 2026-05-31 — fix: drop slug-less publications (sitemap self-404 /about/publications/null/)

The full route sweep (2404/2405 → 200) found one self-404: a publication with a null slug emitted
`/about/publications/null/` into the sitemap — it has no detail page (→ 404), and a self-404 is
exactly what SiteImprove/crawlers flag. Filtered slug-less records at the source: the
sitemap/search-index generator AND `getAllPublications`/`getPublicationsRecent` (so neither the
sitemap nor the listing's title link points at `/null/`). Regenerated sitemap: **2387 → 2386 URLs,
zero `publications/null`**. (A publication in Strapi is missing its slug — give it one to restore it.)

## [0.39.2] — 2026-05-31 — test: route + redirect health check (cutover gate, layer 1 of the test suite)

`scripts/route-health.mjs` (+ `pnpm health` / `health:full`): GETs routes asserting 200
(concurrency-limited), reports the no-slash→/slash redirect behavior, and always tests a
`CRITICAL_ROUTES` must-200 list (section landings + the historically-broken forms/IRB/DICRA).
Default SAMPLES the live sitemap (fast, for CI); `--full` sweeps all ~2387 URLs (pre-cutover).
Runs against the deploy, **status-codes-only** (content-agnostic → stable vs live data — the
hybrid testing strategy). Exits non-zero on any 200-failure (CI-gateable; don't pipe through
`tail`, which masks the exit code).

First run already surfaced two things: (a) `/about/units/` has no *listing* route (legacy router
only has `/about/units/:slug`) — corrected the test list; (b) no-slash SSR routes (`/news`,
`/grants/funding`, `/researchhub`) return 404 instead of 301→`/slash` (the legacy SPA 200s every
path) — a **cutover decision**: support no-slash inbound links via redirects, or trailing-slash-
canonical only. Static pages (`/about`, `/irb`) already resolve no-slash → 200.

## [0.39.1] — 2026-05-31 — docs: strip stale "BLOCKING FOUNDATION DEFECT" comments from hub [slug] pages

The hub `articles`/`datasets`/`apps` `[slug].astro` headers carried alarming `⚠️ BLOCKING
FOUNDATION DEFECT` comments claiming the hub ignores slug `where` filters (returns row[0] for
every slug). That was fixed long ago — the single queries inline the sanitized slug literal
(`graphql/hub.js`) — and re-verified on the deploy this session (two distinct slugs → two distinct
articles). Replaced each block with a concise accurate note. Comments only, no behavior change.

## [0.39.0] — 2026-05-31 — feat: purge-on-publish webhook (Strapi edits to LIVE sections appear instantly)

Live SSR pages were "live to within the edge cache's s-maxage window" (~1–2 min). This makes edits
to LIVE sections appear **immediately** — event-driven invalidation instead of time-based — while
keeping the long TTL (best perf).
- `setCache()` now stamps every SSR response with `Netlify-Cache-Tag: <kind>` (its section); the
  home page is tagged with every live section it surfaces (`news,hub,grants,events,jobs,meetings,
  bios`) so a publish anywhere refreshes the landing page too.
- `netlify/functions/purge-cache.mjs` (NEW): a webhook that maps the changed Strapi content-type
  (`post→news`, `meeting→meetings`, `biography→bios`, `event→events`, `funding`/`grant→grants`,
  `job→jobs`, hub `article`/`dataset`/`app→hub`) to its tag and calls `purgeCache({tags})`. Purging
  a tag invalidates every page carrying it → next request re-renders fresh. STATIC models
  (`page`/`publication`/`unit`) defer to the nightly rebuild (or fire the build hook if
  `PURGE_TRIGGER_BUILD=1`). Auth: a shared `PURGE_SECRET` (header `x-icjia-purge-secret` or
  `?secret=`); rejects anything else with 401.

**Manual setup required (owner):** set `PURGE_SECRET` in Netlify env, then add a webhook in BOTH
Strapi admins (agency + researchhub) → `https://icjia.illinois.gov/.netlify/functions/purge-cache`
with header `x-icjia-purge-secret: <PURGE_SECRET>`, on Entry create/update/delete/publish/unpublish.
Until configured, the function safely 401s and the existing s-maxage/SWR freshness still applies.

## [0.38.0] — 2026-05-31 — fix: mobile responsiveness + a11y for data-heavy pages (no horizontal overflow)

Reported: `/about/publications/` (and the other data tables) overflowed horizontally on mobile —
fixed multi-column tables forced the page wider than the viewport. Fixed to match prod's Vuetify
behavior, in a `<600px` media query (desktop unchanged):
- **Publications + Meetings** (v-data-table): below 600px the column headers drop (kept in the a11y
  tree for screen readers) and each row STACKS as `label: value` pairs, with a "Sort by" select
  replacing the sortable headers — the legacy v-data-table mobile mode. `data-label` on every
  `<td>` (interactive + no-JS baseline); the footer (rows-per-page + pager) now wraps.
- **Attachment tables** (×6: AttachmentList, meeting-row expand, MeetingCard, JobCard, funding NOFO,
  programs) + the **required-forms** table → wrapped in a focusable `.table-scroll` region
  (`role=region` `tabindex=0` `aria-label`) so the TABLE scrolls, not the page (matches Vuetify
  v-simple-table); keyboard-reachable + screen-reader announced.
- **Rules/Regs/Policies** (2-col) → cells wrap long titles/citation URLs (`overflow-wrap`) instead
  of scrolling. Dataset-variables table unchanged (legacy `hidden-sm-and-down`, never shown <960px).
- **CMS-authored body tables** (classless, injected via `set:html`) scroll on mobile via a scoped
  `table:not([class])` rule (so the classed section tables above are untouched).
- a11y: data tables get accessible names; keyboard focus uses the existing global `:focus-visible`.

Tracked follow-up: keyboard-focus for genuinely-overflowing CMS body tables (needs a render-time
wrap, which would churn the contentSanitizer parity snapshots).

## [0.37.9] — 2026-05-31 — change: staff/board biographies → live SSR (owner request: immediate Strapi edits)

Staff and board members edit their own bios in Strapi and expect changes to appear
immediately; prerendering meant edits only landed on the nightly/manual rebuild (and a
**newly-added** bio 404'd until then). The data layer already supported live (`getBiography(slug)`
is a single-record query; the detail page already called it), so this is a pure render-strategy flip:
- `/about/biographies/[slug]` → live SSR: dropped `prerender = true` + the redundant `getStaticPaths`
  (the frontmatter already fetched via `getBiography`); dropped the now-unused `getAllBiographies` import;
  added `setCache(Astro.response, 'bios')`. A bogus slug still 404s (now at request time).
- `/about/icjia-staff/` (staff directory) + `/about/composition-and-membership/` (board directory) →
  live SSR (`setCache 'bios'`) so a newly-added bio appears in the listing immediately, no rebuild.
- `cacheTTL.bios` 600→**120**s s-maxage (SWR 3600) ⇒ ≤2 min staleness — "immediate" for a human, still
  edge-fast. `renderStrategy`: the three bio routes moved `static`→`live`.

Impact: perf unchanged (content is in the edge-cached server HTML, same as news/grants); cost negligible
(low-traffic about-pages; most hits serve from edge). Bio listings are left COLD (no keep-warm ping) — a
~1s first-hit render is fine for low traffic; add to `keepWarm.routes` later if it ever matters.

## [0.37.8] — 2026-05-31 — fix: restore "About the author(s)" bios on research articles (content parity)

The hub-article detail dropped author descriptions: `getArticle` joined `authors` to one
display string (`joinAuthors`), so the legacy `Hub/ArticleView.vue` "About the author(s)"
InfoBlock had no data and was omitted. `authors` is a Strapi JSON field, so the relation
**already returns each author's `description`** — no GraphQL change needed.
- `research.ts`: `ResearchArticleDetail` gains `authorBios: {title,description}[]`; `getArticle`
  passes the raw author objects through (alongside the existing joined byline string).
- `ArticleView.astro`: renders the "About the author(s)" InfoBlock (legacy order: author →
  funding → citation), shown when any author has a description; heading pluralizes on author
  count — matching legacy `hasAuthorInfo`. Author descriptions render as text (legacy used
  `{{ }}` interpolation, not v-html).

Stale `FOUNDATION DEFECT`/omitted-block comments corrected: only the "Related contents"
(related apps/datasets) InfoBlock remains unported; author bios + the citation DOI link render.

## [0.37.7] — 2026-05-31 — perf: publications listing fully build-time static (owner-approved)

Publications need not be live (the whole site rebuilds nightly), so the listing is now
**prerendered** and the full-archive endpoint is **build-time static**:
- `/about/publications/` + `/news/publications/` → `prerender = true` (the recent-150 doc baked at build).
- `/api/publications.json` → `prerender = true` → a **static** `dist/api/publications.json` (the full
  ~1108-row archive). The lazy-load now hits a static CDN file — **no SSR, no per-request REST archive
  fetch**. Perf stays 99 (light recent-150 doc). `renderStrategy` manifest: publications → static.

Refreshed on the nightly/manual rebuild. (Publication DETAIL pages `/about/publications/[slug]` remain
SSR — 1108 pages; can prerender later if wanted.)

## [0.37.6] — 2026-05-31 — build: IRB section (closes the 4 /irb/* cutover-404 blockers)

Ports the legacy `/irb` section (`router/irb` + `IRBHome.vue` + `IRBMeetings.vue`):
- `/irb/` — IRB Home (CMS page `irb-home` via BasePage), **prerendered**.
- `/irb/[slug]` — **prerendered** irb-category CMS pages (`irb-members-and-staff`,
  `irb-policies-and-procedures`, `irb-other-resources`, + `irb-home`) via getStaticPaths.
- `/irb/irb-meetings/` — **live SSR**, meetings filtered to category `irb` (MeetingTable +
  the lazy per-row detail).

The `/irb/` context bar ("ICJIA Institutional Review Board", 6 tabs) **auto-renders** via
`SiteContextBar` (its menu already exists in `contextMenus.json`). Verified: 5 static IRB pages
prerender with content + the IRB context bar; `/irb/irb-meetings/` is SSR. **Resolves the
verification workflow's 4 `/irb/*` 404 blockers**; the branch sitemap's `/irb/*` URLs now 200.

## [0.37.5] — 2026-05-31 — perf: publications lazy full-archive index (FCP/LCP → 95 target)

The haystack trim ([0.37.3]) got publications 87→89, but the doc was still ~0.9MB (display rows
for all 1108). Now the SSR ships only the **recent ~150** (`getPublicationsRecent` — a single
light REST `_sort=publicationDate:DESC&_limit=150`), so the initial doc is light. `PublicationTable`
**lazy-loads the full ~1108-row archive** from a new `/api/publications.json` endpoint after first
paint (rebuilds the client search index, swaps `this.all` 150→1108) — whole-archive search/sort is
preserved, with a "loading full archive…" note until it lands. `perPage:150` default + the SSR
baseline are unchanged (prod parity; no CLS — page-1's recent 150 == the first 150 of the full set).
Applied to both `/about/publications/` + `/news/publications/`. Verify: doc light + Lighthouse ≥95 +
searching a NON-recent publication returns it after the lazy-load.

## [0.37.4] — 2026-05-31 — fix: restore DICRA route + home Funding/Employment sort (parity)

- **DICRA** was 404 at both URLs (Phase B's `about/[slug]` category-filter dropped it — DICRA is
  `researchhub`-category). Prod's About-menu context bar links it at `/about/dicra/`, so restored
  it there (`about/[slug]` getStaticPaths now also includes the `dicra` slug) — keeps the ported
  `contextMenus.json` faithful + that context-bar tab working. `/researchhub/dicra/` (prod sitemap
  canonical) now 301s → `/about/dicra/`. (Branch sitemap reconcile to follow with the IRB build.)
- **Home Funding + Employment tabs** now re-sort by **end-date desc** in `getHome()` (the GET_HOME
  query orders grants `start:desc` / jobs `published_at:desc` + limits; the within-tab order now
  matches legacy `Home.vue`).

## [0.37.3] — 2026-05-31 — perf: /about/publications/ island trim (FCP/LCP)

Measured bottleneck: the page shipped a ~1.1MB JSON island (1108 rows × a full-summary
`haystack`) → 1.32MB doc → **FCP 2.8s / LCP 3.3s (perf 87)**. Dropped `haystack` from the
island (`data.ts` getAllPublications map); `PublicationTable.init()` now rebuilds the search
string client-side from the shipped display fields (title + 25-word preview + typeLabel + tags).
Whole-archive client **search/sort/paginate stays instant**; `perPage:150` default kept (prod
parity). **Trade-off:** search matches the preview + metadata, not the full abstract (minor
search-DEPTH reduction; restore via a lazy haystack index if needed — preferred over
server-side pagination, which would make every search/sort/page a network round-trip).
Re-Lighthouse the deploy + confirm search still filters (client `_h`) to verify.

## [0.37.2] — 2026-05-31 — docs: curate the v7.0 migration checklist

Added running lessons **#28** (two distinct perf levers for base64-CMS-image pages — island
payload/FCP vs delivery/LCP; the apps `62→92→97` arc + the Sharp-WebP-resize extraction) and
**#29** (forms as prerendered Alpine shells + dual-POST CSP + the silent-404 section trap).
Updated stale/out-of-spec items: the Portfolio-status row (flagship is **in-progress SSR**, not
"don't start until IFVCC+infonet ship") and the Pagefind recommendation (SSR emits no static
`dist/` HTML → the flagship uses Fuse). The cross-portfolio recipe + version history is retained
intentionally (deliberately-kept institutional canon, per the doc's own "nothing deprecated" ethos).

## [0.37.1] — 2026-05-31 — fix(redirects): restore proxied sub-site rewrites (cutover-critical)

The legacy root `_redirects` proxies several SEPARATE Netlify sites UNDER icjia.illinois.gov
paths via force-rewrites (status `200!`, URL unchanged): `/adultredeploy/*`, `/ifvcc/*`,
`/arrestexplorer/*` (+ `/docs`), `/mhcontinuum/*`, `/sudcontinuum/*`, `/researchhub/studio/*`.
The Astro `_redirects` had only broken placeholders (`/adultredeploy/ → itself 301`, no `/*`
splat, no proxy) → those sub-apps would 301-loop / 404 at cutover. Restored all seven as `200!`
proxy rewrites (`:splat` forwards the path), in a clearly-labeled extensible block ("ADD A NEW
SUB-SITE HERE"). Edge-level + `!`-forced → evaluated before, and taking precedence over, the SSR
function (verified: no `/*` function catch-all precedes them in `dist/_redirects`).

**Verify post-deploy:** `curl -sI <deploy>/adultredeploy/` → 200 (sub-app content), not 301.
**CSP note:** when promoting CSP to enforce, proxied sub-app pages receive icjia's `_headers` CSP
— verify each sub-app works under it, or scope the strict CSP to exclude the proxied prefixes.

## [0.37.0] — 2026-05-30 — Perf: optimize hub images (WebP + per-use resize) — apps LCP

`generate-hub-images.mjs` now Sharp-processes each extracted base64 image instead of writing
raw bytes: per-attr max width (app `image`/`thumbnail` 760/500 — card-only; article `splash`
1400 — it doubles as the detail hero + the full-bleed DICRA splash) + WebP (q80/82, never
upscale). Falls back to raw bytes if Sharp can't process one. `public/hub-images/` 54M → 26M;
the `/researchhub/apps/` card images dropped from full-size (~913 KiB Lighthouse "image-delivery"
flag, LCP 3.2s) to **27–42 KB WebP** each.

Context: the base64-in-island bloat was already fixed earlier (apps perf **62 → 92**, verified on
the deploy: A11y/BP/SEO 100); this targets the remaining LCP/image-delivery gap to 95+. Images +
manifest are gitignored → the deploy regenerates them via the updated script. **Re-Lighthouse the
deployed apps page after this deploy to confirm 95+.** Also improves article hero/card delivery.

## [0.36.0] — 2026-05-30 — Phase B (part 2b): prerender the section catch-alls

The `about/[slug]` + `grants/[slug]` CMS catch-alls flip SSR → prerendered via
`getStaticPaths` (added `getAllPages` + `GET_ALL_PAGES_QUERY` enumerating slug+category).
Each builds its section's `category` pages MINUS its existing `RESERVED` dedicated-route
denylist, so no `getStaticPaths` path collides with a dedicated route (Astro fails the
build loud on a duplicate — a useful guard):
- `about/[slug]`: 13 about-category pages (contact, privacy, meeting-schedules, covid-19,
  foia, icjia-values, icjia-committees, icjia-breakout-a/b/c, policies, rss, about-the-authority).
- `grants/[slug]`: training, technical-assistance, funded-programs-map.
Also FIXES the cross-category leak (lesson #23): only the canonical category set builds,
so a non-'about' page can no longer render at `/about/<slug>/`.

**getStaticPaths gotcha:** it runs in its OWN extracted prerender chunk and can't see the
page module's top-level `RESERVED` const (threw `RESERVED is not defined` at build) — so
the denylist is a local copy inside `getStaticPaths`, mirroring the body's `RESERVED`.

SSR boundary verified intact: about/employment, grants/funding, grants/programs stay live.
**Phase B complete** — every `renderStrategy` `static` section is now prerendered.

## [0.35.0] — 2026-05-30 — Phase B (part 2a): prerender biographies + units

The dynamic `[slug]` routes with clean enumeration flip SSR → prerendered via
`getStaticPaths`: `/about/biographies/[slug]` (109 bios, enumerated via `getAllBiographies`)
and `/about/units/[slug]` (10 units; added `getAllUnits` + `GET_ALL_UNITS_QUERY`). Each
adds `prerender=true` + `getStaticPaths` and drops `setCache`; the frontmatter re-fetches
each record's full detail at build. Verified: 109 + 10 static pages built with full content.

Build cost: ~120 extra build-time Strapi queries (one per bio/unit) — fine for the
infrequent build; content refreshed on the nightly/manual rebuild.

## [0.34.0] — 2026-05-30 — Phase B (part 1): prerender stable leaf pages

First Phase-B increment — the low-risk static leaf pages (per the `renderStrategy`
manifest) flip SSR → **prerendered** (built once, refreshed on the nightly/manual
rebuild): `/about/`, `/about/icjia-staff/`, `/about/composition-and-membership/`,
`/grants/rules-regs-policies/`. Each adds `export const prerender = true` and drops its
now-meaningless `setCache()` (no-op on static routes); data is fetched at BUILD time.
Verified: all four prerender to static HTML with full content + the context bar.

Deliberately kept LIVE (SSR): employment/jobs, publications, grants funding + programs,
fsgu-home/staff (they change, embed live data, or aren't in the static manifest).
Phase B-2 (next): the dynamic `[slug]` routes — biographies, units, `about/[slug]`,
`grants/[slug]` — via `getStaticPaths` (needs new enumeration queries: `getAllUnits`,
all-pages-by-category).

## [0.33.1] — 2026-05-30 — Forms context bar (sensible per-form section nav)

Resolves the [0.33.0] follow-up. `SiteContextBar` gains a small `SECTION_OVERRIDE` map for
section-less pages: `/forms/grant-status/` shows the **Grants** section bar (it's already a
grants tab → auto-highlights; breadcrumb "ICJIA » Federal and State Grants Unit » Grant
Status Request"); `/forms/lap-request/` shows the **About** section bar ("ICJIA » ICJIA
Overview » Language Access Request"). Verified in the prerendered HTML.

## [0.33.0] — 2026-05-30 — Forms section (Grant Status + Language Access) — closes the /forms/ 404

Ports the legacy `Forms/GrantStatus.vue` + `Forms/LapRequest.vue`. `/forms/grant-status/`
and `/forms/lap-request/` (linked from the footer + home splash) were 404 — the section
was never migrated.

- Two **prerendered** pages (static shells per the renderStrategy manifest — no live
  data; only the submit is dynamic). Inline-Alpine forms (the app convention): required +
  email validation with per-field messages, a "The form has errors." summary, submit/clear,
  a loading spinner, and success/error states.
- On submit, mirrors prod's TWO backend calls: `POST agency.icjia-api.cloud/forms`
  (`{type, form}`, stores the record) + `POST mail.icjia.cloud/internet/{grant-status|lap}`
  (sends the email; its `{msg}` is the success text). Values are tag-stripped first.
- Styling matches prod (measured off the live Vuetify render): elevated white card,
  floating-label underlined fields, filled textarea, blue `#0D47A1` submit + grey clear,
  2-col rows at `md`. Shared `src/styles/forms.css`.
- CSP (`_headers`): added `https://mail.icjia.cloud` to `connect-src` + `form-action`.
- Fixed two obvious prod typos: the stray "." after the form, and "Lanaguage" → "Language".

Verified in-browser: both forms render + the Alpine validation gates correctly (submit-empty
→ all field errors, zero network calls). Live submission NOT exercised (it emails ICJIA
staff + writes a real record); the POST wiring mirrors the legacy verbatim. Follow-up: no
section context bar yet (prod's `/forms/` bar is a quirky aggregate — menu choice is a
product call).

## [0.32.0] — 2026-05-30 — Phase A (part 2): meetings query trim (light list + lazy detail)

Cuts the `/news/meetings/` cold-render cost (was the heaviest SSR route, ~3.3s): the
bulk query no longer fetches body + all relation populates for ~285 records, and no
markdown is rendered server-side at list time.

- `GET_ALL_MEETINGS_QUERY` → `GET_MEETINGS_LIST_QUERY` (light): drops body, posts,
  events, tags, external; attachments reduced to `{ id }` (for the row's count chip).
  New `shapeMeetingLight` shapes only the fields the table/search/sort/SSR-baseline use.
- New endpoint `GET /api/meeting.json?slug=` returns the detail fields (body,
  attachments, related, external, tags) for ONE meeting, edge-cached at the meetings
  TTL. The table lazy-loads it on first row-expand (cached per row; loading + error-
  fallback states). Full search/sort/pagination/category over all 285 meetings is
  unchanged (the light list still ships once in the data island).
- Static path + `?slug=` (mirrors `/api/home-research.json`) because a dynamic
  `[slug].json` route 404s under `trailingSlash: 'always'` unless called with a
  trailing slash. Verified end-to-end in a browser: page renders light, expand → a
  single `/api/meeting.json` fetch → body + attachments render.

## [0.31.0] — 2026-05-30 — Phase A (part 1): data-driven keep-warm + render-strategy manifest

Render-strategy work, scoped from a live design discussion (live vs static split).
Most Phase-A infra already existed (keep-warm.mjs, nightly-rebuild.mjs, 404 + search
prerendered); this adds the tuning + the canonical manifest.

- **keep-warm**: added `/news/`, `/news/meetings/`, and `/grants/funding/` to
  `keepWarm.routes` (now 9, ≤ MAX_ROUTES 12), grounded in Plausible entry-page data
  (30d: home ~2.6K, /grants/funding/ ~178, /news/ ~81). List/landing pages are
  warmed; detail pages (articles/news/meetings/NOFOs) are intentionally left cold.
- **cacheTTL**: bumped SWR for the newly-warmed kinds so the edge copy never expires
  between 5-min pings — news 300→1800, meetings 600→1800, grants 600→1800 (s-maxage
  unchanged, so content is still fresh within ~1–2 min).
- **renderStrategy manifest** (`icjia.config.mjs`): the canonical LIVE-vs-STATIC
  section list. Documents intent; Phase B wires `prerender`/`getStaticPaths` to it.

## [0.30.2] — 2026-05-30 — Featured news card image fills the card edge-to-edge

`NewsListing` featured card image `object-contain` → `object-cover`: the image now
fills the full card/column width with no letterbox gutters (it was scaling to fit
height, leaving white bars on the sides — the "stunted" look). Height stays clamped
250–320px; small list thumbnails (90×90) are intentionally left `object-contain`.

## [0.30.1] — 2026-05-30 — Nav progress bar: thicker + more visible

`#nav-progress` height 3px → 4px and the glow strengthened (box-shadow blur 8→10px,
opacity 0.5→0.65). Purely cosmetic — the bar's behavior (a simulated NProgress-style
indicator covering the next page's SSR/cold-start wait) is unchanged.

## [0.30.0] — 2026-05-30 — Dev-only a11y lint (eslint-plugin-astro)

Added `eslint` (9) + `eslint-plugin-astro` + `eslint-plugin-jsx-a11y` + `@typescript-eslint/parser`
(dev-only — not in the SSR function bundle, no deploy impact) with a flat config (`eslint.config.mjs`)
scoped to `.astro` templates, plus `pnpm lint` / `pnpm lint:fix`.

- **NOT the primary a11y gate** — axe-core + Lighthouse (which see the rendered DOM) remain
  authoritative and pass 100. This is a static, supplementary CI check.
- **4 rules turned OFF** because they can't see this app's dynamic bindings and produced ONLY
  false positives: `anchor-is-valid` / `anchor-has-content` (Alpine `:href` / `x-text`),
  `heading-has-content` (`set:html` / `x-text` headings), `no-noninteractive-element-interactions`
  (`<img onerror>` hide-on-404). Every other jsx-a11y rule stays an ERROR — so it still catches
  genuinely STATIC violations (verified: a literal `<img>` with no `alt` fails on `alt-text`).
- Result: `pnpm lint` is clean (0 problems) on the current codebase + fails on a new static a11y bug.

## [0.29.1] — 2026-05-30 — Grants: Required Forms page (the other blank dedicated view)

Same class as 0.29.0, found in a proactive sweep: `/grants/required-forms/` rendered blank
because the `required-forms` CMS page has an empty body — the legacy `RequiredFormsAll.vue`
fetches the dedicated **`requiredForms` collection** (21 downloadable forms). Built
`pages/grants/required-forms.astro` (a searchable table — title → attachment download, type,
updated date; SSR baseline + Alpine client-side filter) + `getRequiredForms()` (verified via
vitest: 21 forms) + `graphql/required-forms.js`; RESERVED-listed the slug. Sweep result: the
other grants catch-all pages (training, technical-assistance, funded-programs-map) have real
body content and render correctly — required-forms was the last blank grants page.

## [0.29.0] — 2026-05-30 — Grants: Rules/Regulations/Policies page (fixes blank /grants/policies/)

`/grants/policies/` rendered blank: the grants build had missed the legacy DEDICATED view
`RulesRegsPoliciesAll.vue` — which is backed by THREE distinct Strapi collections
(`rules`, `policies`, `regulations`), NOT the generic `pages` collection — and the generic
`/grants/[slug]` catch-all was wrongly rendering the empty `about`-category `policies` page there.

- Built `pages/grants/rules-regs-policies.astro` (three tables — Rules → citation/citationURL,
  Regulations → url, Policies → attachment Download) + `getRulesRegsPolicies()` (fetches the 3
  collections with `Promise.allSettled`, title-sorted, resilient) + `graphql/rules-regs-policies.js`.
- Added the legacy **301 `/grants/policies` → `/grants/rules-regs-policies`** (`_redirects`) and
  added `rules-regs-policies` + `policies` to the `grants/[slug]` RESERVED denylist.
- Known follow-up: the generic catch-alls still resolve any slug via `getPage(slug)` regardless of
  the page's category (a page can render at a non-canonical `/section/<slug>/`). Systemic
  category-enforcement is deferred (`getPage` doesn't return `category` yet) — low impact, but
  logged.

## [0.28.0] — 2026-05-30 — Phase 5 remediation (audit + parity) + deploy fix

### Fixed — deploy 500 (revert the runtime half of the 0.27.0 dep bump)
- The 0.27.0 dep bump **built locally + passed all tests but 500'd the deployed Netlify SSR
  function on every route** (local `astro dev` rendered fine — a bundling/runtime mismatch, the
  classic "untraced transitive dep in the lambda", jsdom 29 the suspect). **Reverted the RUNTIME
  deps** to the known-good versions that deployed cleanly: `jsdom` 29→25, `markdown-it` 14→12 +
  plugins (anchor 9→8, attrs 5→4, footnote 4→3, link-attributes 4→3, implicit-figures 0.12→0.10),
  `@types/markdown-it`→12. Kept the dev-only updates (`typescript` 6, `@types/node` 25) + the
  `lodash-es` removal (they don't touch the function bundle). **Bonus:** markdown-it back to 12
  restores exact prod-render parity. Lesson logged: a clean local build ≠ a working deploy —
  smoke-test the deployed function, not just `astro build`.

### Fixed — security (red/blue audit, all verified real)
- **XSS:** ResearchHub article `abstract` + `citation` were rendered via `set:html` straight from
  the CMS, bypassing DOMPurify — now routed through `renderToHtml` (same channel as the body).
  The citation's `doi` splice is HTML-escaped. **JSON-LD:** `ArticleView` emitted
  `set:html={JSON.stringify(jsonLd)}` raw → switched to `serializeJsonLd` (escapes `<`, blocks a
  `</script>` breakout from a malicious title).
- **Credential leak:** two meeting `summary` fields held LIVE WebEx join credentials (a Meeting
  ID + join link, and a webinar number + password) that were indexed into the public
  `searchIndex.json` (a Fuse key + rendered in result snippets). `generate-search-index.mjs` now
  scrubs credential patterns from meeting summaries before indexing — verified 0 occurrences in
  the rebuilt index — while preserving the 187 benign "Via Webex" location mentions.

### Fixed — content/feature parity (parity review)
- **News detail** was barebones (h1 + summary + body only). Restored full parity: splash hero,
  date/category header, attachments, tag chips, related content (new shared `RelatedList.astro`),
  and the `showTOC` two-column layout — all data was already fetched; `getNewsPost` now shapes it
  (mirrors the grant/page loaders + legacy `NewsSingle.vue`).
- **`/about/units/[slug]`** (was 404) — built the unit landing route + `UnitCard.astro`.
- **`/search/[query]`** (was 404) — deep-link/tag-search route reusing the search island (seeds the
  query from the path param). Added a content-type **filter** (chips + `?filter=`) to `/search/`.
- **Staff directory** `<title>` now uses the CMS title (`ICJIA Staff`) instead of a hardcoded string.
- Carousel indicator dots given a 24×24 hit area (WCAG 2.5.8); `HubCard` gained an opt-in
  `priority` prop for apps-grid LCP (wiring the callers is a tracked follow-up).

## [0.27.0] — 2026-05-30 — Dependency refresh (pnpm): remove unused, update to latest

- **Removed unused:** `lodash-es` + `@types/lodash-es` (zero imports — only comments referenced "lodash parity").
- **Updated to latest:** `markdown-it` 12→14 + plugins (anchor 8→9, attrs 4→5, footnote 3→4,
  link-attributes 3→4, implicit-figures 0.10→0.12), `jsdom` 25→29, `typescript` 5.9→6.0,
  `@types/node` 22→25, `@types/markdown-it` 12→14.
- **markdown-it 12→14 is parity-sensitive** (prod renders with v12) — gated on the sanitizer
  parity suite, which **passed 15/15** (byte-identical render+sanitize output for all fixtures),
  plus the link-text suite 5/5 and a clean `astro build`. Kept v14 (gate green).
- **vite** held at **7.3.3** (ships transitively via Astro 6.4.2, which pins `vite: ^7.3.2`).
  **Vite 8.0 is out but NOT adopted:** the latest Astro (6.4.2) does not yet depend on vite 8,
  and v8 is a major bundler swap (esbuild/Rollup → Rolldown, lightningcss now required,
  rollupOptions→rolldownOptions, HMR/target breaking changes). Forcing it via a pnpm override
  would run Astro on an untested vite major (build-output + plugin-compat risk) for ~zero gain
  (its headline is faster builds; ours is already ~5s and infrequent). Adopt vite 8 when an
  Astro release depends on it (then `pnpm update astro` pulls it in, tested) — do not override.
- Framework deps (Astro, Tailwind 4, Alpine, the @astrojs adapters, astro-seo, sharp, dompurify)
  were already at latest. `node_modules` regenerated cleanly (`rm -rf node_modules && pnpm install`;
  `.npmrc` node-linker=hoisted preserved for the Netlify SSR function).

## [0.26.0] — 2026-05-30 — Fix Lighthouse SEO link-text on CMS bodies (grants + site-wide)

A one-off Lighthouse on `/grants/programs/` flagged SEO 92 — `link-text: 2 links found`
(both a bare "here" → a JAG PDF, authored in the program bodies). Lighthouse flags
generic link phrases ("here"/"click here"/"read more"), NOT bare URLs.

- **`fixCmsLinkText` pass** added to the markdown render pipeline (`src/lib/markdown.js`,
  before `fixLabelInName`): for any `<a>` whose visible text is a generic phrase, set a
  descriptive `aria-label` DERIVED from the href (file → decoded filename + ext, Strapi
  upload-hash stripped; page → humanized slug), **PREFIXED with the visible text** so it
  (a) survives `fixLabelInName` (keeps labels that contain the visible text) and (b) has
  no WCAG 2.5.3 label-in-name mismatch. **Visible text is never changed** (prod parity);
  only the accessible name improves → the link-text audit passes. Bare-URL link text is
  left alone (not flagged). Fixes CMS bodies SITE-WIDE, not just grants.
- `src/lib/markdown.test.ts` added (5 cases) guarding the fixer; the sanitizer parity
  suite still passes 15/15 (pipeline intact).

## [0.25.0] — 2026-05-30 — OG image SVG source + derived PNG; README banner; checklist lessons

- `scripts/generate-og-image.mjs` now emits BOTH `public/icjia-og.svg` (editable vector
  source) and `public/icjia-og.png` (1200×630, rasterized FROM that SVG via Sharp). og:image
  still points at the PNG (social scrapers don't render SVG); the SVG is the source to edit.
- Root `README.md`: the new OG image added as the banner at the top.
- `docs/astro-conversion-checklist-v7.0.md`: added a live-appended "Phase 4–5 running lessons"
  log (#11–20: title convention, per-type JSON-LD + the Event-builder regression, og:image
  origin resolution, the combined search-index/sitemap generator, the app's inline-x-data /
  no-window.Alpine convention + worker-off-the-reactive-object rule, /search-as-a-page,
  the missing-grants-collection + relation-parity trap, cutover pre-checks, and the
  red/blue + parity-review workflow patterns). To be extended through the rest of the migration.

## [0.24.0] — 2026-05-30 — Phase 4d: site search (/search + Fuse Web Worker)

### Added — /search/ (the last major functional gap)
- `pages/search.astro` — prerendered static shell + an interactive search island. The
  chrome already linked here (top-nav magnifier + footer "Search" + the 404 form);
  `/search/` 404'd until now.
- Fuse.js runs OFF the main thread in `/searchWorker.js` (copied with `/fuse.min.js`
  from the legacy app into `astro/public/`): it loads the prebuilt `/searchIndex.json`
  (2386 records, regenerated each build), builds Fuse with the legacy
  `config.search.site` options VERBATIM (same keys/weights/threshold → prod ranking),
  and answers request-id'd queries so out-of-order responses can't clobber a newer one.
- **Island pattern (matches this app's convention + dodges two traps):** the worker
  client is a parse-time `is:inline` script on `window.__icjiaSearch` — kept OFF the
  Alpine reactive object so the Worker isn't Proxy-wrapped (a proxied `postMessage`
  throws "Illegal invocation"); the UI is plain inline `x-data` (this app exposes no
  `window.Alpine` / uses no `Alpine.data()` registrations). Results render with
  `x-text` (the index is raw CMS strings → XSS-safe, no `x-html`).
- `?q=` is read on load + kept in sync (replaceState, shareable/bookmarkable);
  debounced input; `role="search"` + `aria-live` result count; `noindex` (a query-
  result page isn't durable content).
- Verified live (dev): `?q=research` → 351 results (first: ARTICLE "Research & Analysis
  Update, Winter 2025"); no-match → 0 + graceful message; clear → results + `?q=` cleared.

## [0.23.0] — 2026-05-30 — Grants parity: Funded Programs (list+detail) + grants CMS catch-all

The branch deploy 404'd for ~70 real prod pages under /grants/. Built the missing routes,
mirroring the existing funding pattern + the about/[slug] catch-all (so layout/CSS match prod).

### Added — /grants/programs/ (Funded Programs) + /grants/programs/<slug>/ (65 details)
- `graphql/grants.js`: ported `GET_ALL_PROGRAMS_QUERY` + `GET_SINGLE_PROGRAM_QUERY` from legacy.
- `lib/data.ts`: `getAllPrograms()` (title asc) + `getProgram(slug)` mirroring getFunding/getGrant
  (bodyHtml via renderToHtml, shaped attachments, related, flattened tags). Live data: 65
  programs, status current|archived, category federal|state.
- `components/ProgramsListing.astro`: ports ProgramsAll.vue — `<h1 id="icjia-grant-programs">Funded
  Programs</h1>` + intro + TWO toggle groups (Category All/Federal/State × Status Current/Archived,
  default All+Current), SSR current-baseline + Alpine x-for via an id'd JSON island (not the
  this.$el antipattern), reusing funding.css card/chip/attachment classes.
- `pages/grants/programs/index.astro` + `[slug].astro` mirror the funding pages' markup/classes;
  detail emits GovernmentService JSON-LD.
- **Parity fix:** dropped the `grants` relation a build agent had added to the single query —
  legacy queries POSTS only, so "Related Web Content" is News-only on prod (no Funding links).

### Added — /grants/<slug>/ CMS-page catch-all
- `pages/grants/[slug].astro` mirrors `about/[slug].astro` (BasePage renderer) with a RESERVED
  denylist (funding, programs, fsgu-home, fsgu-staff). Resolves the 404s for /grants/training/,
  /grants/technical-assistance/, /grants/required-forms/, /grants/funded-programs-map/.
- `/grants/fsgu-home/` remains an intentional 404 — no CMS page with that slug exists; legacy
  404s there too (verified). Unchanged.

## [0.22.0] — 2026-05-30 — Phase 4c SEO completion: per-type JSON-LD + 1200×630 OG image

Closes the metapeek findings from the 0.21.0 deploy (home A/92, detail B/86 — detail
pages were AI-readiness "not-ready": no structured data, no authorship, no freshness).

### Added — per-type JSON-LD on every detail page (via a unified `jsonLd` BaseLayout prop)
- seo.ts builders: `buildArticleJsonLd` (NewsArticle/ScholarlyArticle/Report), `buildEventJsonLd`,
  `buildJobPostingJsonLd`, `buildPersonJsonLd`, `buildDatasetJsonLd`, `buildAppJsonLd` +
  `serializeJsonLd`. BaseLayout's `isHome` flag replaced by a general `jsonLd?` prop
  (object or array → one `<script type="application/ld+json">` each).
- Wired: news → NewsArticle, research articles → ScholarlyArticle (the existing
  `<ArticleView>` block, with real author names — page-level dup removed), publications →
  Report, events + meetings → Event, employment → JobPosting, biographies → Person,
  datasets → Dataset, apps → WebApplication. All emit `publisher`/`author` + dates →
  detail pages now satisfy structured-data + authorship + freshness.
- **Event JSON-LD fixed (regression caught in review):** `buildEventJsonLd` keeps the
  legacy-faithful shape — `MixedEventAttendanceMode` + `inLanguage: en-US` + ICJIA
  organizer, NO forced physical address (asserting Offline/Chicago for a virtual meeting
  is wrong). Meetings restore their rich data: the external link → `VirtualLocation`,
  attachments (agenda/minutes) → `associatedMedia` MediaObjects with MIME types.

### Added — branded 1200×630 Open Graph image
- `scripts/generate-og-image.mjs` (one-time, `pnpm og-image`) renders `public/icjia-og.png`
  (navy gradient + ICJIA wordmark + agency name + host) via Sharp. Replaces the 600×347
  prod thumbnail (below the 1200×630 social-share standard).
- og:image is now a site-relative path resolved against the CURRENT deploy origin in
  BaseLayout (resolves on the branch preview AND post-cutover prod); canonical stays
  pinned to prod. Twitter `summary_large_image` dedup fixed (removed a duplicate
  `twitter:image` that astro-seo already emits).

## [0.21.0] — 2026-05-30 — Phase 4c: SEO (astro-seo), sitemap/search-index, robots, llms, stylish 404

### Added — `astro-seo` `<SEO>` integration (`src/lib/seo.ts` + BaseLayout)
- Adopted the **`astro-seo`** module — BaseLayout now renders one `<SEO>` (title, meta
  description, canonical, Open Graph, Twitter summary-large-image card) replacing the
  hand-rolled head tags. Values come from `src/lib/seo.ts` (`siteConfig`), seeded with the
  **management-approved prod values** (og:image `icjia-half-splash-thumb-v2.jpg`,
  google-site-verification token, description) so canonicals/OG match prod exactly.
- **Home-only JSON-LD** (`isHome`): `WebSite` (+ `SearchAction` → `/search/?q=`) +
  `GovernmentOrganization`, mirroring the prod homepage `@graph`.
- **`noindex?` prop** on BaseLayout → `<SEO noindex>` (followable; default off). First
  consumer is the 404.

### Changed — page `<title>` convention now matches prod: `ICJIA | <chunk>`
- Ported the legacy `src/App.vue` `titleTemplate` convention exactly: **brand first**,
  `buildTitle(chunk)` → `ICJIA | <chunk>` (bare `ICJIA` when no chunk), **untruncated**
  (prod never truncates; a clipped title drops SEO keywords and Lighthouse SEO doesn't
  score length). Fixed a **double-suffix bug**: pages had baked-in `— ICJIA` /
  `— ResearchHub — ICJIA` suffixes that would have rendered `… — ICJIA | ICJIA`. Every
  page now passes a BARE chunk.
- **Descriptive list/landing titles** (user-approved invisible-meta deviation from prod's
  generic titles — see `project_astro_seo_titles`): `/researchhub/` → Research Hub,
  `/news/` → News & Information, `/news/meetings/` → Public Meetings, `/about/icjia-staff/`
  → Staff Directory, etc. Detail pages keep `ICJIA | <content title>`.
- Added meta `description` to the 4 pages that lacked one (bio detail, job detail, staff
  directory, composition & membership).

### Added — combined prebuild content generator (`scripts/generate-search-index.mjs`)
- ONE self-contained prebuild fetch (ports `generators/searchIndexAndSitemap.js` + the 12
  `generateIndex*.js`) emits BOTH **`public/searchIndex.json`** (the Fuse index, 2386
  records / 2.7 MB) and **`public/sitemap.xml`** (2387 trailing-slash URLs, prod origin) —
  same enumeration, one fetch (splitting would double-fetch ~12 Strapi endpoints).
- **SEC-12/13 staff-name purification preserved**: `searchMeta` is purged of the staff
  roster (+ EXTRAS blocklist incl. former/external names) before write; biographies (the
  public roster) are deliberately exempt. Verified 0 staff names leak into non-bio
  `searchMeta`.
- **Robust:** per-type `Promise.allSettled` (a failed type degrades, doesn't fail the
  build); total Strapi outage keeps the last-known-good files and exits 0. Wired into
  `prebuild` after `generate-hub-images`.

### Added — `robots.txt`, `llms.txt`, stylish `404`
- `public/robots.txt` (no leading underscore — avoids the Astro `public/_robots.txt` trap)
  with a `Sitemap:` line + explicit AI-crawler allows. `public/llms.txt` (AI-readiness
  site summary).
- `public/sitemap.xml` is written directly (not via `@astrojs/sitemap`, which emits
  `sitemap-0.xml`) so `/sitemap.xml` resolves natively — no Netlify two-rewrite needed.
- **`src/pages/404.astro`** — checklist "Standard 404" pattern: prerendered, `noindex`,
  on-brand hero (aria-hidden `404` numeral + announced `<h1>`), a GET `/search/` hand-off
  form, a quick-link card grid mirroring legacy 404.vue's destinations, and the legacy
  `plausible("404", { path })` event.

## [0.20.0] — 2026-05-30 — Refinement pass 1: parity fixes from the review synthesis

Multi-agent review (7 section reviewers + synthesis) found NO P0s; working the P1 list.

### Added — keep-warm scheduled function (cold-start prevention)
- `netlify/functions/keep-warm.mjs` — a Netlify scheduled function (every 5 min) that
  pings the highest-entry SSR routes so the (single, shared) Astro SSR lambda + the edge
  Durable Cache stay warm → real visitors land on a warm function (~150ms) not a cold
  start (~1s). **Configurable** via `netlify/keep-warm.config.mjs` (SCHEDULE + ROUTES).
- **Routes chosen from Plausible (verified, 30d = 14.1K sessions):** ResearchHub is the
  entry page for ~56% of sessions, the homepage ~21% — together **~77% of all entries**.
  So the warm list is `/` + the `/researchhub/*` family (landing, articles, datasets,
  apps, hub-overview).
- **Cost:** all SSR routes share ONE function, so warmth needs *frequency*, not breadth.
  ~8,640 cron fires/mo × 6 routes ≈ ~52K invocations/mo worst case (cache hits past TTL
  don't re-invoke) — comfortable under Netlify Pro's 125K included. Raise SCHEDULE or trim
  ROUTES in the config to cut further. Scoped to the branch context; production untouched.
- Restores parity with the legacy NProgress + addresses the deferred pre-first-byte gap
  (which an in-page overlay can't cover) at the source — frequency of cold starts.

### Hardened — keep-warm defense-in-depth (cost-safety; red/blue-team audited)
- The ping could be costly if it ran away, so 6 INDEPENDENT safety layers cap the blast
  radius regardless of trigger volume or platform misbehavior:
  - **L1 invocation source:** `schedule()` is scheduler-triggered (not a public HTTP URL);
    we additionally 403 any real HTTP request that reaches the handler.
  - **L2 durable rate-guard:** a Netlify Blobs `last-run` timestamp short-circuits any run
    < 4 min after the previous one (claims the slot BEFORE pinging) — collapses a flood to
    ~15 real runs/hour.
  - **L3 bounded fan-out:** routes de-duped + hard-capped at MAX_ROUTES=12 (a poisoned
    config can't fan out to hundreds).
  - **L4 same-origin allowlist:** only ever fetches this deploy's own origin; rejects full
    URLs / `//host` (no SSRF / outbound amplification).
  - **L5 per-ping AbortController timeout (8s) + no retry.**
  - **L6 env kill switch** `KEEP_WARM_DISABLED=1` (instant disable, no redeploy).
- **Adversarial audit** (`netlify/__tests__/keep-warm.redteam.mjs`, 10 scenarios, all pass):
  1000× invocation flood → still only 6 pings; HTTP GET/POST → 403/0 pings; 500-route
  config → capped at 12; injection (`//evil.com`, `https://…`) → rejected, only same-origin
  contacted; kill switch → 0 pings; **1 req/sec for 1 hour (3,600 invocations) → ≤90 pings**.

### Fixed — label-in-name a11y (WCAG 2.5.3) on CMS links + clickthrough boxes
- Lighthouse a11y flagged `label-content-name-mismatch` (Serious) on two element classes:
  - **ClickThroughBoxes** (`a.ctb-box`) carried `aria-label={title}`, overriding the card's
    visible text (title + teaser) → removed the redundant aria-label so the visible text is
    the accessible name.
  - **CMS-body links** with an authored `aria-label` that doesn't contain the visible text
    (e.g. dicra's legal citations: visible "730 ILCS 210/3-5(e)" but aria-label "…3-5(b)(2)").
    Ported the legacy `fixLabelInName` a11y patcher into the server markdown pipeline
    (`markdown.js`) — strips an aria-label when it neither contains nor is contained by the
    visible text. Runs **last** (after contentSanitizer's own `<a>` pass, which would
    otherwise re-introduce it).
- Sanitizer parity suite 15/15; axe AA 0 violations on dicra.
- NOTE (deferred, needs VR sign-off): dicra's CMS body authors two in-body `<h1>`s ("# " in
  markdown → multiple-H1, a heading-hierarchy best-practice nit, NOT a scored a11y failure —
  Lighthouse a11y stays 100). Only 1 of 33 pages does this; demoting in-body h1→h2 would
  change heading sizes vs prod, so it's left for a deliberate content/VR pass.

### Added — nightly full rebuild (search index / images / sitemap freshness)
- `netlify/functions/nightly-rebuild.mjs` — scheduled fn (cron `0 5 * * *` UTC ≈ midnight
  Central) POSTs a Netlify build hook → full rebuild with no code push: re-extracts hub
  images (new articles/apps get their files), regenerates search index/sitemap/RSS as wired.
- Setup (one-time): create a Netlify build hook + set `NETLIFY_BUILD_HOOK_URL` env var (see
  docs/nightly-rebuild.md). Kill switch: `NIGHTLY_REBUILD_DISABLED=1` or disable the fn in
  the UI. ~30 builds/mo — trivial vs the 25,000-min Pro quota. No-ops without the hook.
- On-demand usage report: documented that the existing usage-monitor workflow's manual
  "Run workflow" trigger gives the same email anytime (from the GitHub mobile app) — no
  spammable webhook URL needed.

### Added — subtle cross-document view transitions (softer page navigation)
- Native CSS `@view-transition { navigation: auto }` (global.css) — a **very subtle 120ms
  opacity crossfade** between real page navigations, so the site feels softer/less jumpy.
- **Deliberately NOT `<ClientRouter/>`** (Astro's SPA transitions): this site is entirely
  Alpine-driven (nav, context bar, x-for lists, loading overlay, nav progress bar), and
  ClientRouter would require Alpine to re-init on every DOM swap + `data-astro-rerun` on all
  inline scripts — high risk to the verified interactivity. The CSS-only cross-document
  approach keeps every page a **fresh load** (no SPA, no JS), so all interactivity works
  exactly as-is; browsers without support just navigate normally (graceful no-op).
- `prefers-reduced-motion` disables it. Verified in-browser: transition registered, Alpine
  re-initializes cleanly on the destination (meetings 285 rows, table ready), chrome
  (loader + progress bar) coexists, 0 real console errors.

### Fixed — keep-warm now actually keeps the EDGE warm (SWR ≫ ping interval)
- Verified the keep-warm scheduled fn IS registered on the branch deploy
  (`function_schedules: [{cron:"*/5 * * * *", name:"keep-warm"}]`). BUT the warmed
  routes' cache life (home 60+300=360s, hub 120+600=720s) was barely above / near the
  300s ping, so the Durable Cache kept fully expiring between pings (observed
  `fwd=stale; ttl=negative`) — the lambda stayed warm but pages didn't.
- Raised **SWR** (not s-maxage) far above the ping interval on the warmed kinds:
  `home: [60, 3600]`, `hub: [120, 3600]`. SWR is what serves a warm copy instantly +
  triggers background revalidation, so each 5-min ping lands inside a 1-hour stale
  window → the edge never goes cold → ~150ms TTFB — while s-maxage stays small (60/120)
  so the revalidated content is still fresh within 1-2 min. Non-warmed kinds unchanged.

### Added — central config `astro/icjia.config.mjs` + keep-warm kill switch
- **Single source of truth** for the Astro app's tunables: `site` constants (prod origin +
  Strapi/hub hosts), `keepWarm` ({enabled, routes}), `cacheTTL` (per content type), `monitor`
  thresholds. `cache.ts` + the keep-warm function now import from it.
- **`.mjs` (not `.ts`) on purpose** — the raw Netlify keep-warm function runs uncompiled and
  can't import `.ts`; JSDoc gives types without a build step. Lives in `astro/` (inside the
  deploy base dir) so the function bundler includes it (a repo-root file would be above
  `base="astro"` and may not bundle). The keep-warm CRON stays a literal in the function
  (Netlify bundler requirement) — the one thing that can't centralize.
- **Keep-warm kill switch (3 independent levels):** `keepWarm.enabled:false` in the config
  (commit → ~1min deploy) · env `KEEP_WARM_DISABLED=1` in the Netlify UI (no redeploy) ·
  disable the scheduled function in the Netlify UI (instant). Red-team audit now 11/11
  (added the config-flag kill-switch scenario). Removed the old `netlify/keep-warm.config.mjs`.

### Fixed — keep-warm deploy failure + CMS-page TOC/splash polish
- **Netlify build failure:** the bundler statically parses the `schedule()` call, so the
  cron must be a **string literal in the function** + the export must be
  `export const handler = schedule(CRON, fn)`. Our `export default schedule(SCHEDULE, …)`
  with an *imported* cron failed ("schedule imported but unused"). Moved `CRON` into the
  function as a literal; ROUTES still imported from the config.
- **CMS page TOC layout (all `showTOC` pages):** content/TOC split corrected to **9 / 3**
  columns (was 8 / 4 — and the 8+4 vs new 9+3 aside mismatch left a broken grid).
- **TOC scrolling:** clicking a TOC entry now **smooth-scrolls with a 96px offset** for the
  fixed app bar (was a native jump that tucked the heading under the navbar); deep-links
  (`#hash` on load) re-scroll with the same offset; `scroll-margin-top: 96px` on body
  headings is the no-JS fallback. (TOC entries are the page's `h2[id]`s, as before.)
- **CMS page `<h1>` malformed markup:** `getPage().titleHtml` now uses an **inline** markdown
  render (`renderInline`) so the title no longer emits `<h1><p>…</p></h1>` (block-in-heading).
- **Splash hero fills the column:** replaced `max-height: 50vw` (which capped the image short
  on the narrower content column — the DICRA "too short" bug) with a real `aspect-ratio: 2/1`
  full-width box + `object-fit: cover`, matching prod's `v-img aspect-ratio="2"`.
- Note: `/about/icjia-values/` was flagged for an "empty TOC" in review, but it has
  `showTOC: false` in Strapi — correctly renders no TOC. Only its `<h1>` needed fixing.

### Added — navigation progress bar (cold-start perceived-speed)
- Top progress bar (`#nav-progress`, navy) that starts the instant an internal link is
  clicked and creeps toward 90% while the next page's SSR/cold-start response is awaited,
  then the new document swaps in. Covers the ~1s cold-lambda wait with visible motion on
  the page the user is leaving; restores the legacy NProgress behavior. Correctly skips
  external links, new-tab/modified clicks, downloads, hash-only, and same-page links;
  resets on bfcache restore. (The pre-first-byte window of a true cold start can't show an
  in-page indicator — no HTML yet — but this + the Durable Cache cover the navigation case.)

### Perf (the two sub-95 routes → fixed)
- **`/researchhub/apps/` (was perf 62):** the ~1.67MB of base64 app images was shipped in
  the JSON island. Moved to a lazy-loaded endpoint (`/api/hub-app-images.json`, edge-cached
  'hub'); island carries only a `hasImg` flag + slug; cards render a 1px placeholder
  (width/height set → no CLS) and an IntersectionObserver + MutationObserver swap in the
  real image as cards near view. HTML **1.67MB → 205KB**. Articles/datasets untouched.
- **`/about/publications/` (was perf 88):** the 1108-row island shipped each row's full
  `summary` AND a `haystack` (a 2nd copy) + a dead `slug`. Island rows now carry a 25-word
  `summary` preview (full summary stays on the detail page) and drop `slug`; **full-text
  search across all 1108 rows preserved** (the lowercased `haystack` is intact). Island
  **1.43MB → 826KB**.

### Fixed
- **Biography cards now link to the detail page** (`BiographyCard.astro`) — the name
  is wrapped in `<a href="/about/biographies/{slug}/">` (name only, not the whole card,
  to avoid nesting anchors inside the bio body's own links). Resolves the top P1 across
  THREE sections (biographies, about-staff, units staff) — listings were navigational
  dead-ends. Detail page (showName=false) still doesn't self-link.
- **`dateFormatAlt` date-only TZ bug** (`data.ts`) — a bare `YYYY-MM-DD` (e.g. a
  publication's publicationDate) was shifted Chicago-ward and rendered **one day early**
  (May 22 → "May 21"). Now reads literal calendar parts for date-only values; timestamped
  values keep the Chicago conversion. Shared helper → also corrects meetings/grants/jobs
  date chips. Unit-tested.
- **Sitewide canonical tags** (`BaseLayout.astro`) — every page now emits
  `<link rel="canonical">` (defaults to its own URL at the prod origin). Alias routes pass
  the canonical target: `/news/events/` → `/events/` (publications alias to follow).

## [0.19.0] — 2026-05-29 — Complete DRAFT build-out of the 7 remaining sections (multi-agent workflow)

Built via staged workflows (scout → synthesize → foundation → components → 7 sections;
~30 agents, ~1.9M agent tokens). FUNCTIONAL DRAFT — pixel-perfection is the next pass.

### Foundation (central, single-owner — builds clean)
- 6 GraphQL modules (employment, events, publications, biographies, units, hub) +
  `page.js` extended (clickthrough/splash/attachmentLabel/showTOC, additive — shipped
  grants intro preserved) + `deepSanitize` exported from gql-client.
- `data.ts` fetchers/shapers for all sections; `research.ts` 2nd-Strapi (researchhub)
  hub client (lists via runQuery+deepSanitize, details via raw hubQuery — no double-sanitize).
- Publications LIST via **REST pager** (1108 rows; GraphQL silently truncates at 990).

### Shared components
- `AttachmentList`, `Splash`, `PageToc` (scroll-spy), `ContentClickThroughBoxes` (white
  variant), `BiographyCard`, `BasePage` (generic CMS-page renderer: splash + body + TOC +
  attachments + clickthrough).

### Sections (40 routes; each self-verified on the dev server)
- **Employment** `/about/employment/` (+[slug]) — Current/Expired toggle, 219 jobs, internships.
- **About** `/about/` + `/about/[slug]` catch-all via BasePage (reserved-slug denylist).
- **Biographies** `/about/biographies/[slug]` + `/about/icjia-staff/` (79) + `/about/composition-and-membership/` (21).
- **Units** FSGU staff, IDS landing/infonet/isu-staff + `/innovation-and-digital-services/[slug]`.
- **Publications** `/about/publications/` + `/news/publications/` (+[slug]) — MeetingTable-clone
  table over 1108 REST rows; `/publications/` 301.
- **Events** `/events/` + `/news/events/` (+[slug]) — List view + JSON-LD; Calendar stubbed (see flags).
- **ResearchHub** `/researchhub/` + articles/datasets/apps (list+detail) + hub-overview + hub-staff
  (27) + redirects. Base64 hub images kept OUT of SSR HTML (landing 3.3MB→287KB).

### Fixed
- **Hub detail slug filter:** the researchhub Strapi v3 silently ignores `where` GraphQL
  *variables* (every article/dataset/app detail returned item[0]). Inlined the slug
  (escaped) in the 3 hub single queries — verified each slug now returns its own record.

### Flags / draft deviations (for the pixel pass)
- Search unported → tag chips are non-link spans; bio name→search + "Related Web Content" omitted.
- Events default view = List (legacy default is the Vuetify calendar); Calendar toggle = placeholder.
- `/grants/fsgu-home/` 404s — no CMS `fsgu-home` page exists upstream (faithful; FsguHome.astro
  ready to render when published).
- ResearchHub ArticleView omits "About authors"/"Related contents" InfoBlocks (search-dependent).
- Per-section build/render verified on dev; full deploy Lighthouse/axe gate pending this push.

## [0.18.0] — 2026-05-29 — /grants/funding/ parity (NOFO list + Current/Expired toggle + single) + reusable data helpers

### Added — `/grants/funding/` (FundingAll.vue parity)
- CMS "funding" intro (title + body via new `getPage(slug)`) + **Current/Expired toggle**
  (Alpine; Current = `end + 1 day >= now`) + grant cards (NOFO label, green Deadline /
  red Expired chip, title link, date range, summary, tags, attachments, "Read full
  NOFO »") + the legacy-GATA note. Alpine `x-for` over a JSON island (only the active
  tab in the DOM); SSR baseline = current cards. 1 current / 105 expired today.
- `/grants/funding/[slug]` (FundingSingle.vue): expired banner, NOFO header, body,
  attachments, related, tags + JSON-LD **GovernmentService**. 404 on bad slug.
- Context bar auto-resolves to the **FSGU** section with "Funding Opportunities" active.

### Changed — reusable data helpers (`data.ts`, for all remaining sections)
- `shapeAttachments()` (absolute url + niceBytes + dateFormatAlt, name-sorted),
  `buildRelated()` (the legacy RelatedList across all relation kinds), `getPage(slug)`
  (CMS page intro/body — reusable for About/Units/generic CMS pages). New graphql:
  `grants.js` (funding) + `page.js`. `getFunding()` / `getGrant(slug)`.

### Verified (localhost + build + axe)
- Build clean; toggle Current(1)↔Expired(105) works, chips correct; single page +
  JSON-LD + expired banner; **axe AA 0 violations**.

### Pending / VR-tune
- Expired tab renders all 105 cards (matches legacy show-all) — heavy DOM only when
  that tab is opened; could paginate in the perf pass.

## [0.17.0] — 2026-05-29 — Loading overlay + inline CSS (kill the blank-screen wait)

### Added — branded loading overlay (`BaseLayout`)
- Full-screen centered ICJIA logo + spinner + "Loading", shown the instant the
  response paints (critical CSS inlined via `is:inline`, no render-blocking
  round-trip). **Delayed 0.2s reveal** → fast/warm loads never flash it; slow loads
  show the branded screen. Hidden on `DOMContentLoaded` (+ 10s failsafe, `remove()`);
  `<noscript>` hides it so no-JS users aren't trapped. `role="status"`, reduced-motion aware.

### Changed — `inlineStylesheets: 'always'` (astro.config)
- The SSR head was emitting **two external render-blocking stylesheets**
  (`cache.css` + per-page css) → ~860ms blank gap after the HTML arrived (on top of
  any cold-lambda TTFB). Now all CSS inlines with the HTML → **0 css files in
  `dist/_astro/`**, first paint as soon as the response paints. HTML is edge-cached,
  so the per-page inline cost is paid once.

### Honest limitation (told the user)
- Neither covers the **pre-first-byte** window while a cold serverless lambda boots
  — the browser has no HTML yet, so no in-page overlay can show there. That's what
  the **Netlify Durable Cache** (0.15.0) mitigates: warm hits ≈150ms TTFB. The
  overlay covers the post-HTML paint/hydration window; offered View Transitions for
  in-site nav loading if wanted.

## [0.16.0] — 2026-05-29 — Site chrome: context bar + per-path disclaimers (were missing on ALL pages)

### Added — context bar (`SiteContextBar.astro`, port of `AppNavContext.vue`)
- The thin bar below the main nav, on **every page except home** (matches prod).
  Two tiers from `config/contextMenus.json`, keyed on the first path segment:
  navy breadcrumb (**ICJIA » {section label} » {contextTitle}**) + grey section
  tabs. Active tab = longest path-prefix of the URL (so detail pages keep their
  section tab lit). `label` ≥960px / `shortLabel` below; `contextTitle` ≥960px.
- Wired in `BaseLayout` with a `contextTitle` prop; set on meetings (listing
  "Meetings" / single = title) + news articles (= title). Home renders no bar.

### Added — per-path disclaimers (`SiteDisclaimer.astro`, port of `Disclaimer.vue`)
- Dark banner at the bottom of content, matched by `config/disclaimers.json`
  `pathPrefix`. Restores the legally-required **"PUBLIC MEETING NOTICE" (ADA) on
  `/news/meetings/`** (+ single meetings) and the federal-funding notice on
  `/researchhub/` — both were absent.

### Config audit (answering "what in src/config isn't used yet")
- Ported + wired `contextMenus.json` (was copied but unused) + `disclaimers.json`
  (was not ported). `menus.json` already used (nav). **`config.json` underused:**
  `maps`/`daysToShowNew`/`archiveDate`/`timezone` are currently hardcoded in
  `data.ts`, and `events`/`hub`/`search`/`home`/`image` keys await their sections
  — flagged to read from config (single source of truth) as those land.

### Verified (localhost + build + axe)
- `astro build` clean. Bar element present on `/news/` + `/news/meetings/`, **0 on
  home**; disclaimer only on `/news/meetings/*`. "Meetings" tab `aria-current=page`.
  **axe AA 0 violations** with the new chrome.

### Pending / VR-tune
- Tabs are center-aligned + horizontal-scroll on overflow (no scroll-arrows yet);
  exact Vuetify v-tabs slider/spacing vs prod is a VR pass.
- "Translate this site" button (showTranslation) omitted — the Google-Translate
  modal isn't ported yet.
- The **bottom** context bar (`location:"bottom"` Footer quick-links above the
  footer) is a separate element — not yet added; confirm if wanted.

## [0.15.0] — 2026-05-29 — /news/meetings/ parity (data table + by-date/by-category + single meeting)

### Lighthouse — deploy CONFIRMED (mobile, branch-deploy, warm edge)
- `/news/meetings/` (listing): **A11y 100 · Perf 97 · BP 100 · SEO 100**.
- `/news/meetings/[slug]` (single): **A11y 100 · Perf 99 · BP 100 · SEO 100**.

### Infrastructure — Netlify Durable Cache now actually serves (SYSTEMIC, all routes)
- **Root cause found:** a plain `Cache-Control: s-maxage` is **bypassed** by Netlify's
  CDN for SSR/function responses (`cache-status: … fwd=bypass` on every route) — so
  **no SSR route was ever edge-cached.** `/news/` only passed because its Strapi fetch
  is fast (1.7s); meetings exposed it (3.3s backend → ~5s TTFB → perf 91).
- **Fix (`cache.ts`):** also set **`Netlify-CDN-Cache-Control`** (`+durable`) for the
  CDN, and `Cache-Control: max-age=0, must-revalidate` for the browser. Warm-hit TTFB
  dropped **~5s → ~0.15s**; meetings perf **91 → 97-99**. Speeds **every** SSR route.

### Parity deviation (FLAGGED) — schedules-banner link text
- Lighthouse SEO `link-text` blocklists "click here" by **visible** text (an
  `aria-label` can't satisfy it, and a descriptive one trips WCAG 2.5.3 label-in-name).
  Changed the banner link "click here" → **"view the schedule"** to reach SEO 100 +
  IITAA descriptive-link best practice. One-line revert if you want "click here" back
  (accepting SEO 91 on meetings routes).

### Added — `/news/meetings/` at functional parity with `MeetingsAll.vue`
- **By date / By category** toggle (Alpine). "By date" = one table of all **285**
  meetings; "By category" = a table per category (Authority Board / Budget
  Committee / Institutional Review Board / Special) + a TOC sidebar (md+). Purple
  "meeting schedules" banner + the December-2020 ICJIA Document Archive note.
- **MeetingTable** (parity with `MeetingTable.vue` / `v-data-table`): search,
  sortable columns (default date desc, `aria-sort`), rows-per-page
  (25/50/100/250/all), and single-row **expand → MeetingCard**. Driven by Alpine
  **`x-for`** over a SHARED `#meetings-data` island (the 285 meetings ship once);
  only the current page (≤ perPage rows) is ever in the live DOM.
  - Expand card is **`x-if`-gated** (mounts on open, unmounts on collapse) so
    collapsed rows stay cheap — initial DOM **906 nodes**.
  - "By category" is **lazy-mounted** via `<template x-if>` → `MeetingsCategoryView`
    (Astro renders the component into the inert template; Alpine clones +
    initializes on first switch), keeping the 4 category tables out of the initial
    DOM (would otherwise be ~2000 nodes).
    - GOTCHA recorded: Astro does **not** evaluate `.map` *closures* placed
      directly inside a native `<template>` (throws `c is not defined`) — a child
      component does work. Hence the extraction.
- Expand/MeetingCard: cancelled banner + line-through title, date line + category,
  body (server-rendered + sanitized), tag chips, attachments table
  (Filename/Last Updated/Size), Related Web Content, External Links.

### Added — `/news/meetings/[slug]` (single meeting, `MeetingsSingle.vue`)
- SSR card + "View all meetings »" + JSON-LD **Event** (eventStatus, organizer,
  start/end, `location` from external, `associatedMedia` from attachments).
  Unknown slug → 404.

### Changed — data layer (`data.ts`, `graphql/meetings.js`)
- `getAllMeetings()` / `getMeeting(slug)` (+ `GET_ALL_MEETINGS_QUERY` /
  `GET_SINGLE_MEETING_QUERY` ported).
- `shapeMeeting()` — flattens tags, sorts attachments name-asc, builds the related
  list from posts+events, **pre-renders the body** (so the table expands with no
  client fetch), computes the search haystack.
- Chicago-tz date helpers (legacy dayjs default tz) via `Intl … formatToParts`
  (DST-safe, byte-exact): `dateFormatAlt` ("May 14, 2026"), `meetingDateLine`
  ("Thursday May 14, 2026, 10:00 AM - 12:00 PM" / multi-day "May 14th - May 16th").
  `MEETING_CATEGORIES`, `meetingCategoryLabel`, `slugifyHeading`, `niceBytes`.

### Accessibility (axe AA — localhost, 0 violations)
- Row expand is a real **`<button>`** (caret) with `aria-expanded` + label
  (keyboard-operable); fixed an `aria-conditional-attr` violation caused by
  `aria-expanded` on the `<tr>`.
- CANCELLED chip recolored `#f00` → **`#b71c1c`** (white text clears AA; the
  legacy bright-red did not).

### Verified (localhost, real browser + build)
- Alpine 3.15: sort (`aria-sort` toggles), search, pagination, expand via button
  (both views), lazy category mount → 4 interactive tables, SSR baseline, **906**
  initial DOM nodes, **0** console errors. `astro build` compiles clean. Single
  page + JSON-LD + 404 confirmed.

### Known upstream bug — replicated for parity (FLAGGED for your call)
- `niceBytes` units table is `["B","MB","MB",…]` (no "KB"), so attachment sizes in
  the 1 KB–1 MB range render labeled "**MB**" (e.g. a 488 KB file → "488 MB").
  Ported **verbatim** so sizes match production (the VR gate would flag a "fix").
  One-char correction (`units[1]="KB"`) available if you want it fixed.

### Pending / VR-tune
- Exact Vuetify `v-data-table` spacing/typography, `v-btn-toggle` look, the two mdi
  toggle icons (used inline-SVG approximations), TOC sidebar position vs prod.
- Search matches the **visible** text (title + category label + formatted date);
  the legacy Vuetify default searched raw field values — intentional UX-parity
  superset, noted for VR.
- Render-blocking ~600-870ms (font/global CSS, chrome-wide) is the lever from
  perf 97 → 98+; a Phase-1 tuning item, not meetings-specific.

## [0.14.0] — 2026-05-29 — /news/ parity rebuild (featured + filters + month-grouping + pagination) + /news/press/

### Lighthouse — deploy CONFIRMED (mobile, branch-deploy home)
- All four **100**: accessibility **100**, performance **100**, best-practices **100**,
  SEO **100** — verified on the live deploy after the [0.13.0] build went out.
  Closes both gaps from the report (a11y 96→100, best-practices 96→100); perf 98→100.

### Added — `/news/` now at functional parity with the legacy `News.vue`
- Was a simplified card grid; now: **featured card** (most-recent post), **category
  filter buttons** (All + categories present), **month-grouped list** (This Month /
  Last Month / Earlier), **pagination** (15/page).
- Rendering model: featured + page 1 are **server-rendered** (real HTML so
  SiteImprove/axe/Google + no-JS see content/links); Alpine then drives
  filter/paginate/group via **`x-for`**, keeping only the current page in the DOM
  (~15 items, like prod) — **552 DOM elements** vs 2374 for a full-archive render.
  - NOTE: per-item `x-show` across the full archive was tried first and is **not
    reliably reactive at this scale** (state updates but the DOM goes stale after
    the first change); `x-for` is the correct primitive.
- Client-list thumbnails pre-optimized server-side via `getImage()` → same-origin
  (no Thumbor, no third-party cookie).

### Added — `/news/press/` (press releases + media advisories)
- Simple `NewsCard` grid (parity with `NewsPress.vue`), via `getAllPress()`
  (`GET_ALL_PRESS_QUERY`).

### Changed — data layer (`data.ts`)
- `formatNewsDate()` — exact port of the legacy `format` filter (full month +
  **zero-padded day**, UTC-component read). Switched `NewsCard` to it; the prior
  Intl/Chicago formatter dropped the zero-pad and could be a day off for
  midnight-UTC dates.
- Added `shapeNewsList()` (publicationDate, unified tags, month bucket, fullPath,
  newest-first), `getAllPress()`, `NEWS_CATEGORIES`, `monthBucket()`,
  `truncateWords()`, `BUCKET_LABELS`.

### Verified (localhost, real browser)
- Filter (All/News/Press), reset, pagination (page 2 ≠ page 1; last page partial =
  7 of 187), category switch — all correct via `x-for`; SSR page-1 hides after
  hydrate. **0** Thumbor refs, **0** cross-origin `<img>`, 174 same-origin
  `/_image` URLs. `/news/press/` dates zero-padded ("March 01, 2024").

### Pending / VR-tune
- Exact Vuetify spacing + `v-pagination` ellipsis styling vs prod (VR pass).
- Month-bucket + NEW!-chip use request-time "now" (SSR); a record within ~1 day of
  a month / 5-day boundary could differ from prod under the frozen-clock VR.
- Article-body inline CMS images (carried from 0.13.0).

## [0.13.0] — 2026-05-29 — Lighthouse fixes: Astro image optimization (no Thumbor) + target-size

### Lighthouse baseline (mobile, branch deploy home)
- **Performance 98** ✅ · **SEO 100** ✅ · accessibility 96 · best-practices 96.
  (Perf hit the 98 stretch even with the 2.1MB Research strip — it's deferred.)

### Fixed — accessibility 96 → **100** ✅ (verified, mobile, localhost)
- `target-size`: the one offender was the WidgetBar single-link ("RESEARCH HUB »").
  Two parts: (1) `inline-block py-1` so the link itself is ≥24×24px (WCAG 2.5.8);
  (2) **removed the `margin-top:-20px`** that had pulled the Latest Research bar up
  into the boxes above — the "Technical Assistance" box link was *overlapping* the
  link's top ~11px, obscuring it (measured via DevTools). With no overlap the
  ≥24×24 link passes. (Also removes a latent visual overlap; exact gap is VR-tune.)

### Changed — images: **NO Thumbor; Astro `astro:assets` only** (user directive)
- Removed the unused `PUBLIC_IMAGE_SERVER` (`image.icjia.cloud`/Thumbor) env field.
  No Thumbor anywhere in `astro/`.
- New `CmsImage.astro` — wraps `<Image>` (Sharp in dev, Netlify Image CDN on
  deploy) for live CMS images, dims from Strapi `formats` metadata (no
  fetch-to-infer at request time), local fallback when a record has no image.
- `astro.config.ts` `image.domains: ['agency.icjia-api.cloud']` — the Netlify
  adapter auto-allowlists this for `remote_images` and routes through
  `/.netlify/images`.
- Converted `HomeCardNews` + `NewsCard` to `CmsImage`; added `width height` to
  the news/home `splash` GraphQL selections.

### Fixed — best-practices 96 → (target 100)
- `inspector-issues` was a third-party **Cookie** sent to `agency.icjia-api.cloud`
  on its cross-origin `/uploads/*` images. Now images load **same-origin**
  (`/_image/` dev, `/.netlify/images` prod), so that cookie is never sent.
- Bonus: huge compression — a news splash went **273KB PNG → 9KB WebP**.

### Verified
- Build clean. Home + `/news/` emit **0** cross-origin `agency.icjia-api.cloud`
  `<img src>`; `/_image/` endpoint returns `image/webp` 200 (159 optimized
  images on the listing). Re-audit the deploy to confirm a11y/bp reach 100.

### Pending
- Article-body **inline** CMS images (inside rendered markdown) still point at
  Strapi — needs a markdown-pipeline URL rewrite to route them through Astro
  optimization too (tracked follow-up).

## [0.12.1] — 2026-05-29 — VR harness: full-page lazy-load + home baseline

### Changed
- `scripts/vr/run.mjs` — full-page captures now (1) strip the Astro dev-toolbar
  overlay (NEW-site dev-only artifact, absent on prod), (2) scroll through the
  page to trigger lazy / below-fold images (both sites lazy-load CMS imagery —
  e.g. the client-fetched Research strip) then return to top + settle network,
  and (3) honor a per-route `settleMs`.
- `scripts/vr/config.mjs` — home route `settleMs: 2500` (client Research fetch +
  base64 decode).

### Baseline (home, prod vs local, all 5 breakpoints)
- Chrome routes hold their known cross-engine range (header 2–5%, footer ~5%,
  hero 6–11% — confirmed visually matched in Phase 1).
- **home fullPage: 25–33%.** Side-by-side shows the layout is **structurally
  correct** (hero, News & Information [cards + Funding/Meetings/Employment tabs],
  3 click-through boxes, Latest Research [vertical tabs + 3 cards], footer all
  align). The high % is **cumulative vertical drift** (solid-red on *displaced*
  solid-color regions — the navy boxes + the whole footer go fully red, which
  only happens under vertical offset, not AA) **+ the cross-engine text-AA floor**
  amplified by a near-wall-to-wall-text page. Not broken layout.

### Pending (home pixel-tune — top-down, since drift cascades)
- Match section heights/gaps top→down so lower sections snap back into alignment
  (hero text-box size/overlay; News & Info card + tab-panel spacing; inter-section
  gaps `my-5`/`-20px`/`-10px`; box height/color; research card image height).

## [0.12.0] — 2026-05-29 — Phase 3: home "Latest Research" strip (live, deferred-fetch)

### Added
- `src/lib/research.ts` — ResearchHub (2nd Strapi) data layer for the home strip:
  `getHomeResearch()` fetches articles / apps / datasets (limit 3 each) via a
  plain server-side `fetch` (no `deepSanitize`, matching the legacy
  `services/ResearchHub.js` axios path). Ports the exact text logic from
  `src/filters.js`: `format` date (full month, zero-padded day, tz-offset
  correction), `truncateBySentence` (first 2 sentences only when >2 exist),
  Oxford-comma author join (`arrford`), and `isNew` (`daysToShowNewResearch=10`).
- `src/pages/api/home-research.json.ts` — same-origin SSR JSON endpoint, edge-
  cached `s-maxage=120, swr=300` (the plan's hub TTL).
- `HomeResearch.astro` — "Latest Research" `WidgetBar` + ARIA tablist (Articles /
  Web Apps / Datasets), vertical tabs on md+ / horizontal on mobile (matches the
  legacy `:vertical` breakpoint), 3 cards/tab. Data loads CLIENT-SIDE on Alpine
  `init()` from the endpoint; lazy images; skeleton while loading. Wired into the
  home below the click-through boxes (`margin-top: -20px`, matching `Home.vue`).

### Architecture decision (flagged — deviates from SSR-everything)
- **The hub stores splash/app images as base64 data-URIs in the GraphQL
  response — 49KB–674KB each.** 3 articles + 3 apps ≈ **~2.1MB**. SSR-inlining
  them would blow the home response to ~2–3MB and fail the 95+ mobile perf
  target. The legacy `HomeResearch.vue` fetches this strip **client-side in
  `mounted()`** (not in the initial HTML) and lazy-loads below the fold — so
  fetching after load is the *faithful* reproduction, not a compromise.
- Routed through a **same-origin** SSR endpoint (not a direct browser→hub call):
  keeps the initial HTML lean, removes a browser CORS dependency on the hub,
  is edge-cacheable, and lets `connect-src` stay `'self'` (no need to keep the
  researchhub entry in the future CSP).

### Verified
- Build clean. `/api/home-research.json` → 200, 3+3+3 items, correct
  `dateLabel`/`isNew`/Oxford-`authors`/`teaser`; base64 imgs for articles+apps,
  null for datasets.
- **Home HTML carries 0 inlined base64 blobs** (the 2.1MB stays in the deferred
  endpoint) — perf protected.
- Real-browser (Chrome) a11y tree: cards populate after the fetch; dates
  ("May 22, 2026"), "NEW!" on ≤10-day items only, single + two-author Oxford
  joins, teasers, and `/researchhub/.../` links all correct. Endpoint + alpinejs
  + styles all 200. (Lone console 504 = Astro **dev-toolbar** chunk, dev-only,
  absent in builds.)

### Pending
- **VR-tune the full home vs prod** (News & Information + boxes + this strip):
  the vertical-tabs desktop layout, card image height/spacing, and "NEW!" chip
  style are structural approximations. The "NEW!" chip is computed at server
  request-time → **VR mask candidate** (browser clock is frozen, server clock
  is not). Consider switching article cards from `splash` (49–674KB) to
  `thumbnail` (9–44KB) if VR shows them indistinguishable at 250px — a perf win.

## [0.11.0] — 2026-05-29 — Phase 3: home click-through boxes

### Added
- `HomeClickThroughBoxes.astro` — row of 3 navy (#0E4471) clickable cards
  (icon + uppercase title + teaser + optional "NEW!" badge), wired into the home
  below News & Information. CMS icon names mapped to MDI equivalents
  (people→account-group, pending-actions→clipboard-text-clock,
  account-balance→bank).

### Verified
- Home renders 3 live boxes (Request Grant Status, Subscribe, Technical
  Assistance) — HTTP 200, no errors.

### Pending
- Home **Research strip** (needs the ResearchHub GraphQL query); then VR-tune
  the full home vs prod. Box icons are MDI approximations of prod's Material
  glyphs (VR-tune item).

## [0.10.0] — 2026-05-29 — Phase 3: home News & Information (live)

### Added
- `getHome()` data fetcher (`GET_HOME` → news/meetings/funding/employment/boxes,
  shaped like `Home.vue`) + home helpers (`newsCategoryLabel`,
  `fundingCategoryLabel`, `isNew`, `isExpired`, `formatDateShort`,
  `homeNewsImage`).
- Home **News & Information** 2-col section: `WidgetBar` ("NEWS & INFORMATION" +
  MENU dropdown), `HomeCardNews` (image-left news cards: category | date,
  title + "NEW!", summary), `HomeTabbed` (Alpine tabs Funding/Meetings/
  Employment with expiry/new/cancelled flags computed server-side). Wired into
  the home. News-card fallback image copied to `public/`.

### Verified
- Home renders splash + live News & Information (5 news cards + funding/meeting/
  employment tabs) under the chrome (HTTP 200, no errors, real live titles).

### Pending (VR pass)
- Pixel-tune the News & Information section vs prod; then click-through boxes +
  Research strip.

## [0.9.0] — 2026-05-29 — Phase 3: home hero (splash)

### Added
- `HomeSplash.astro` — static hero ported from `HomeSplashV2.vue`: pre-grayscaled
  `/home-splash.{avif,webp,jpg}` + blue overlay + centered title/tagline + navy
  "Apply for funding" / "Grant Status Request" buttons. **Replaces the home
  placeholder.** Splash images copied to `public/`.
- VR `home-hero` route (header + 600px splash).

### State
- Home hero **visually matches prod** (same image/overlay/box/buttons); the
  ~8-10% hero diff is header + splash text AA + minor button spacing.
- Remaining home sections (News + tabbed funding/employment/meetings,
  click-through boxes, Research) build next, fed by `getHome()`.

## [0.8.1] — 2026-05-29 — Chrome VR-tuning: footer matched to prod

### Changed
- `SiteFooter` height matched to prod (measured via a Playwright probe: 196px
  desktop, logo 100×70 at 20px from top) — inner padding `pt-5 pb-5`, widened to
  `max-w-6xl`. Footer is visually matched (navy, centered logo, underlined white
  links, copyright); residual ~5% desktop / ~10% mobile (link wrap) is text AA +
  minor spacing.
- VR harness: **element-level capture** (`route.selector`) + a `footer-home`
  route, so the footer (variable page-bottom) can be isolated and diffed.

## [0.8.0] — 2026-05-29 — Phase 1: chrome VR-tuning (pass 1)

### Changed
- `SiteHeader`, tuned against prod via the VR harness:
  - **mobile**: logo centered (mobile-only spacer) + search icon visible at all
    widths (moved out of the desktop-only nav). Header mobile diff 19% → 5%,
    tablet 14% → 2.4%.
  - **desktop**: nav labels UPPERCASE + letter-spacing (match Vuetify buttons);
    agency title constrained to wrap to two lines like prod (desktop 5.5% → 2%).
  - **underline cascade fix**: import `legacy-globals.css` into Tailwind's
    `base` layer so utilities (`no-underline`/`font-normal`) override the global
    `a { underline; 900 }` on chrome links (title underline gone).
- VR harness recalibrated for cross-engine text rendering: pixel threshold 0.2;
  gates PASS ≤ 1% / WARN ≤ 3% / FAIL > 3% (text floors ~1-2% on anti-aliasing,
  so the gate catches *structural* diffs and the eye confirms fine parity).
  Added `VR_ONLY` route filter for fast iteration.

### State
- Header is now **visually matched** to prod at all breakpoints (every
  structural diff fixed); residual 2-5% is sub-pixel positioning + text AA.

## [0.7.0] — 2026-05-29 — Phase 3 (start): News listing + caching decision

### Added
- **`/news/` listing** — live-data SSR; all posts newest-first as cards
  (Tailwind grid 1/2/3 cols at the Vuetify breakpoints) linking to the article
  pages. `NewsCard.astro` (splash + title + America/Chicago date + summary),
  `data.getAllNews()`, `formatDate()` (Intl, Chicago tz), `strapiUrl()` image
  helper.

### Decided (with user)
- Caching: keep the shared Netlify **edge cache** (s-maxage + SWR) rather than
  porting the legacy per-session gql cache — same "don't re-fetch" speed,
  cross-user, with background revalidation. Documented in `cache.ts`.

### Verified
- `/news/` renders 188 live cards under the chrome (HTTP 200, no errors).

### Pending (VR pass for this template)
- Match prod's pagination + card layout + category labels; trim the 188-card DOM
  for the mobile-perf gate.

## [0.6.0] — 2026-05-29 — Visual-regression harness + chrome asset fix

### Added
- **VR harness** (`scripts/vr/`): standalone Playwright + pixelmatch comparing
  prod (`icjia.illinois.gov`) vs the new site (local dev or a deploy URL via
  `VR_NEW`) at the 5 Vuetify breakpoints. Normalized captures (frozen clock,
  animations off, `fonts.ready`, maskable regions); a header-band clip for
  chrome-focused diffing plus full-page routes. Writes prod/new/diff PNGs +
  `report.md`; gates PASS ≤ 0.1% / WARN ≤ 1% / FAIL. Run with `pnpm vr`.

### Fixed
- `astro/public/` never existed, so `/icjia-logo.png` and `/favicon.ico` 404'd —
  the **header and footer logos were silently broken** (an earlier `cp` failed
  behind `2>/dev/null`). Created `astro/public/`, copied the logo + favicon,
  added a favicon `<link>`.
- **Sticky footer**: `BaseLayout` body is now a flex column (`min-h-screen`) with
  `main flex-1`, so the footer sits at the viewport bottom on short pages.

## [0.5.0] — 2026-05-29 — Phase 1: site chrome (header, nav, footer)

### Added
- `SiteHeader.astro`: fixed 90px white app bar — 90px logo (→ home), agency
  title (lg+), `menus.json`-driven dropdown nav (md+) with an ARIA disclosure
  pattern + inline-SVG MDI icons, search → `/search/`, and a mobile hamburger
  **drawer** (below 960px) with accordion sub-menus. Native HTML + Tailwind +
  Alpine (single `x-data` root; Escape/click-outside close).
- `SiteFooter.astro`: navy (`#0d4474`) footer — logo, link row (About, Contact,
  Search, Document Archive, FOIA, Language Access, Privacy, Grant Status,
  Subscribe, Translate), copyright. (Translate wired in Phase 4.)
- `BaseLayout` composes skiplink → header → `<main id="main-content">` → footer;
  pages no longer carry their own `<main>`. `menus.json` + `contextMenus.json`
  copied into the project. `[x-cloak]` guard hides menus until Alpine inits.

### Verified
- Home + news render under the chrome (HTTP 200, logo/title/nav/footer present,
  23 inline SVG icons, no runtime errors). Production build emits the SSR function.

### Pending (VR pass)
- Pixel-tune header/footer spacing + colors against prod; focus-trap the mobile
  drawer (`@alpinejs/focus`); context sub-nav (`AppNavContext`).

## [0.4.0] — 2026-05-29 — Phase 1: design-system foundation

### Added
- Self-hosted fonts via `@fontsource` (Lato 300/400/700/900, Oswald
  400/500/600/700) — same families/weights as the legacy Google Fonts, so glyph
  metrics match. Loaded in `BaseLayout`.
- `astro-icon` + `@iconify-json/mdi` (inline SVG; 21 MDI icons inventoried from
  the legacy app) — replaces the MDI webfont.
- Continuity stylesheets ported from the Vue site:
  - `github-markdown.css` (verbatim) → `.markdown-body` CMS bodies
  - `article-view.css` (from `hub.css`) → Research Hub `#article-view` serif
    typography (Georgia body / Oswald headings, exact px sizes)
  - `legacy-globals.css` → curated from `app.css`: global links, focus-visible,
    skip link, sr-only utilities, card hover, `<details>`/sweep, target-size
    minimums, `(opens in new tab)` hint, and a native `.chip` re-implementing
    the Vuetify chip-contrast fix. Vuetify-DOM-specific rules intentionally
    dropped (re-created on native components as built).
- Tailwind 4 `@theme` tokens: `--color-primary` #1565c0, `--color-navy`,
  `--font-body`/`--font-heading`, breakpoints at Vuetify px (600/960/1264/1904).

### Verified
- Production build compiles with all CSS imports + fonts + astro-icon.

## [0.3.0] — 2026-05-29 — End-to-end live-data SSR news page (proven)

### Added
- `src/graphql/news.js` (ported query), `src/lib/markdown.js` (server-side
  pipeline: markdown-it + plugins → jsdom-backed DOMPurify → fixTableHeaders →
  fixImageLinks → contentSanitizer), `src/lib/cache.ts` (per-route s-maxage +
  stale-while-revalidate), `src/lib/data.ts` (`getNewsPost`, live per-request
  fetch), `src/pages/news/[slug].astro` (SSR).
- `@astrojs/node` adapter for local `astro dev`; `@astrojs/netlify` only for the
  build/deploy. The Netlify adapter's dev integration reads `netlify.toml` and
  mis-resolves the branch-context `base="astro"`; node sidesteps it and is the
  adapter-agnostic escape hatch the plan keeps. `jsdom` moved to dependencies
  (runtime dep of the markdown pipeline).

### Verified
- Live SSR article renders: HTTP 200, full title + 8 markdown paragraphs in the
  server HTML (content is server-rendered, not client-fetched),
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- Production (netlify-adapter) build emits the SSR function cleanly with the
  jsdom/markdown stack.

## [0.2.2] — 2026-05-29 — Fix SSR function dependency resolution on Netlify

### Fixed
- Deployed SSR function crashed at runtime: `Cannot find package 'cookie'`.
  Astro's runtime imports `cookie` (transitive dep), but pnpm's default
  symlinked `node_modules` has no top-level `node_modules/cookie` for Netlify's
  function bundler to trace. Added `astro/.npmrc` `node-linker=hoisted` (flat,
  npm-style layout) — fixes the whole class of transitive runtime-dep
  resolution failures in the SSR function. (Static SSG migrations never hit
  this; SSR is new territory.)

## [0.2.1] — 2026-05-29 — Netlify branch-deploy preview

### Added
- `netlify.toml` `[context."feat/astro-migration"]` (base=astro, `pnpm build`)
  so this branch deploys the Astro app for a live Netlify preview while
  production/`main` keeps building the legacy Vue root.

## [0.2.0] — 2026-05-29 — Phase 0 data layer + SSR parity gate (GO ✓)

### Added
- Ported the framework-agnostic data layer near-verbatim into `src/lib`:
  `gql-client.js` (import paths fixed), `contentSanitizer.js` (1,277 lines, the
  SiteImprove/a11y content pipeline), `brokenLinks.js`, and `src/config/config.json`.
- `src/lib/server-dom.ts`: a `DOMParser` shim backed by linkedom's `parseHTML`
  (with an explicit `<body>` wrapper, since linkedom's raw
  `DOMParser.parseFromString` does not auto-wrap fragments the way a browser does).
- `src/lib/contentSanitizer.parity.test.ts` + Vitest config: the SSR go/no-go
  gate. Compares the linkedom-backed shim against jsdom (browser-faithful
  reference) on realistic CMS fixtures.

### Verified (the migration's #1 risk, retired)
- **All 15 tests pass.** The 1,277-line sanitizer runs correctly **server-side**;
  output is semantically identical to jsdom across every DOM-based plugin
  (table `scope`/`headers`, img `alt`, contrast strip, empty-container removal,
  list-validity, focusable `<pre>`, image-link labels, misspellings).
- Confirms live-data SSR is viable: the content pipeline produces fully
  sanitized HTML in the server response (so SiteImprove/axe/Google see real
  content), no client-side rendering required.

## [0.1.0] — 2026-05-29 — Phase 0 scaffold

### Added
- Scaffolded Astro 6.4 app under `astro/` with `output: 'server'` (on-demand SSR)
  and the `@astrojs/netlify` adapter — the live-data-at-view-time architecture.
- Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first `@theme`); breakpoints
  **redefined to Vuetify 2 px values** (sm 600 / md 960 / lg 1264 / xl 1904) for
  pixel-parity with the legacy layout. Brand `--color-primary: #1565c0` token.
- Alpine.js 3 via `@astrojs/alpinejs`.
- Staged the data-layer dependencies: `linkedom` (server DOM shim), `dompurify`,
  the legacy `markdown-it` stack (v12 + plugins, parity-first), `lodash-es`.
- `sharp` as an explicit dep + `pnpm.onlyBuiltDependencies` allowlist (Astro 6 /
  pnpm 10 requirement).
- `BaseLayout.astro`, scaffold `index.astro`, `global.css` token stub.

### Verified
- SSR build emits the Netlify SSR function + `_redirects` cleanly.
- Homepage renders **server-side** (content in HTML), Tailwind 4 compiles the
  custom `text-primary` token, Alpine is wired.

### Notes
- Layout uses Tailwind utilities (incl. the grid) per project preference.
- Netlify branch-deploy wiring (`netlify.toml` context + first push) is pending.

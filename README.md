![ICJIA — Illinois Criminal Justice Information Authority](astro/public/icjia-og.png)

# ICJIA Public Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/e6614e77-00b4-4772-8034-a3b9c9c9986d/deploy-status)](https://app.netlify.com/sites/icjia-public/deploys) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The public website for the **Illinois Criminal Justice Information Authority** — [`icjia.illinois.gov`](https://icjia.illinois.gov).

Built on **Astro 6 + Tailwind 4 + Alpine**, rendered **server-side with live CMS data on every request**. The design requirement that shapes everything: content must reflect the CMS **at the moment a page is viewed** (not at build time), while scoring 95+ mobile Lighthouse, 100 accessibility (ADA Title II / IITAA 2.1), and 100 SEO.

The application lives in **[`astro/`](astro/)**.

---

## TL;DR for the curious dev

```bash
cd astro
pnpm install
pnpm dev          # http://localhost:4321 — live CMS data
```

- **SSR, not static.** Every `.astro` page fetches the CMS in its frontmatter, renders + sanitizes Markdown on the server, and ships complete HTML. No client-side content fetching, no loading spinners, no hydration for content — so crawlers, screen readers, and "view source" all see the real content.
- **The edge cache is the speed trick.** Each route sets a short `s-maxage` + a long `stale-while-revalidate` on Netlify's Durable Cache. Real visitors hit a warm edge copy (~150 ms TTFB) while a background revalidate keeps it at most a minute stale. Live data *and* fast.
- **Alpine is for interactivity only** — toggles, carousels, the search box, the mobile drawer — sprinkled as small islands over server-rendered HTML. Content never depends on JavaScript.
- **Two CMS backends:** the agency Strapi (`agency.icjia-api.cloud`) and the Research Hub Strapi (`researchhub.icjia-api.cloud`), both Strapi v3 GraphQL, fetched live.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | **Astro 6**, `output: 'server'` (on-demand SSR) |
| Adapter | `@astrojs/netlify` (deploy) · `@astrojs/node` (local dev) — kept interchangeable |
| Styling | **Tailwind 4** (`@tailwindcss/vite`) + a little hand-written component CSS |
| Interactivity | **Alpine.js** (`@astrojs/alpinejs`) — islands only |
| Content | **Strapi v3 GraphQL** ×2 (agency + Research Hub), fetched live, server-side |
| Markdown | `markdown-it` + plugin set → DOMPurify (jsdom) → linkedom DOM-fix passes |
| Search | **Fuse.js** in a Web Worker over a prebuilt index |
| Icons / Fonts | `astro-icon` + `@iconify-json/mdi` · self-hosted `@fontsource` Lato + Oswald |
| SEO | `astro-seo` + JSON-LD + a generated sitemap + robots/llms |
| Hosting | **Netlify** (SSR functions + Durable Cache) |
| Analytics | **Plausible** (self-hosted) |
| Tooling | **pnpm** · **Node 22** · Vitest · Playwright |

---

## Architecture

### Request flow (the core idea)

```
Browser ─▶ Netlify edge ──(cache miss / stale)──▶ Astro SSR function
                │                                      │
                │                              fetch Strapi GraphQL (live)
          warm copy (~150ms)                          │
                │                              render Markdown + sanitize
                ▼                                      ▼
          HTML response  ◀───── setCache() headers ── complete HTML
```

- **`src/lib/data.ts` / `research.ts`** are the single server-side entry points pages call (`getNewsPost(slug)`, `getFunding()`, `getArticle(slug)`, …). They query the CMS (`no-cache`), shape the response, and render body Markdown.
- **`src/lib/cache.ts` + `icjia.config.mjs`** set per-content-type TTLs via **`Netlify-CDN-Cache-Control`** — the one header that actually drives Netlify's Durable Cache for function responses (a plain `Cache-Control: s-maxage` is ignored there).
- **Resilience:** a 5 s fetch timeout and `Promise.allSettled` per section, so one slow query degrades gracefully instead of failing the page.
- **Cold starts** are masked three ways: an inlined loading overlay, a top nav-progress bar on link clicks, and a `keep-warm` scheduled function that pings the highest-traffic routes to keep the lambda + edge warm.

### Build-time generators (`astro/scripts/`, run in `prebuild` + nightly)

Run once per build, not per request:

- **`generate-search-index.mjs`** — one pass over all ~12 content types emits both **`searchIndex.json`** (the Fuse index) *and* **`sitemap.xml`** (trailing-slash, prod origin). Staff names are purified out of `searchMeta` before write (a data-leak control), and any live conferencing credentials pasted into meeting summaries are scrubbed.
- **`generate-hub-images.mjs`** — Research Hub images arrive as base64 in GraphQL; this decodes them to real files under `public/hub-images/` + a manifest, so cards reference tiny same-origin URLs instead of multi-MB data-URIs.
- **`generate-og-image.mjs`** — renders the branded 1200×630 Open Graph image (`icjia-og.svg` source → `icjia-og.png`) via Sharp.

### The content pipeline (`src/lib/markdown.js` + `contentSanitizer.js`)

CMS Markdown is human-authored, so it runs through a fixed pipeline that produces accessible, XSS-safe HTML on the server:

```
md.render → DOMPurify(jsdom) → fixTableHeaders → fixImageLinks
          → fixCmsLinkText (descriptive aria-labels for "click here" links)
          → contentSanitizer (table scope, contrast, empty-container, list, …)
          → fixLabelInName
```

A **Vitest parity suite** (`src/lib/contentSanitizer.parity.test.ts` + `markdown.test.ts`) locks this output down — it's the go/no-go gate for any change to the renderer or its dependencies.

---

## Project layout

```
astro/
├─ icjia.config.mjs          # single source of truth: origins, cache TTLs, keep-warm routes
├─ astro.config.ts           # output:'server', trailingSlash:'always', Tailwind, Alpine, icons
├─ netlify/functions/        # keep-warm + nightly-rebuild scheduled functions
├─ scripts/                  # prebuild generators (search-index, hub-images, og-image) + VR harness
├─ public/                   # static assets, fuse.min.js + searchWorker.js, robots/llms, _headers/_redirects
└─ src/
   ├─ pages/                 # routes (SSR) — news, events, meetings, grants, about, researchhub, …
   ├─ components/            # server-rendered components + Alpine islands
   ├─ layouts/BaseLayout.astro   # <head> (SEO, JSON-LD, analytics), chrome, loading/nav-progress
   ├─ lib/                   # data.ts, research.ts, gql-client, markdown.js, contentSanitizer.js, cache.ts, seo.ts, server-dom
   ├─ config/                # menus.json, contextMenus.json, disclaimers.json (config-driven chrome)
   └─ styles/                # Tailwind entry + component CSS (github-markdown, funding, page-toc)
```

---

## Commands

Run from `astro/`:

```bash
pnpm dev            # dev server (Node adapter) on :4321, live CMS data
pnpm build          # prebuild (generators) → astro build (Netlify SSR function)
pnpm preview        # preview a production build
pnpm test           # Vitest — sanitizer parity + markdown link-text suites (the render gate)
pnpm test:e2e       # Playwright interaction E2E (against a running dev server)
pnpm vr             # visual-regression harness — pixel diff (Playwright + pixelmatch)
pnpm vr:assert      # parity assertions on computed CSS, not pixels (catches subtle/localized diffs)
pnpm search-index   # regenerate searchIndex.json + sitemap.xml from the live CMS
pnpm og-image       # regenerate the branded OG image (svg + png)
```

---

## Routes

Each section is a live-data list + detail:

`/` · `/news/` + `/news/press/` · `/news/meetings/` · `/events/` · `/grants/funding/` + `/grants/programs/` · `/about/` (+ `/about/biographies/`, `/about/units/`, `/about/publications/`, `/about/employment/`, `/about/icjia-staff/`, composition) · `/researchhub/` (+ articles, datasets, apps, DICRA) · `/innovation-and-digital-services/` · `/search/` · a stylish `404`.

URLs use a **trailing slash** throughout; inbound links and bookmarks are preserved via `public/_redirects`.

---

## SEO & accessibility

- **`astro-seo`** drives `<title>` (`ICJIA | <chunk>`), description, canonical (prod origin + trailing slash), Open Graph, and a Twitter card.
- **JSON-LD** per content type (`NewsArticle`, `ScholarlyArticle`, `Event`, `JobPosting`, `Person`, `Dataset`, `WebApplication`) + a `WebSite` / `GovernmentOrganization` graph on the home page.
- **Sitemap** is generated from live content (`/sitemap.xml`, referenced in `robots.txt`); `llms.txt` ships for AI-readiness. (`@astrojs/sitemap` is intentionally *not* used — it can't enumerate SSR dynamic routes.)
- **Accessibility** is gated by axe-core + Lighthouse (a11y 100). Content-level a11y issues are corrected in the render pipeline above, so the shipped HTML is already correct — no flash of inaccessible content, no post-render DOM mutations.

---

## Configuration

- **`astro/icjia.config.mjs`** — the one place to change CMS origins, per-type cache TTLs, and keep-warm routes (plain `.mjs` so the raw Netlify functions can import it too).
- **`.env`** (optional, local) — `PUBLIC_STRAPI_GRAPHQL`, `PUBLIC_HUB_GRAPHQL` override the default CMS hosts for the generators.
- **`.npmrc`** — `node-linker=hoisted` is required so the Netlify SSR function bundler can trace transitive dependencies.

---

## Deploy

Netlify builds from `base = "astro/"`. The `@astrojs/netlify` adapter emits the SSR function automatically; `public/_headers` carries the security headers + CSP and `public/_redirects` carries the route redirects. Edge caching + the `keep-warm` schedule are what keep SSR responses fast.

---

## Visual regression & parity testing

> **The core mission of this migration is parity.** The new Astro site must look *and* behave exactly like the approved production site — same layout, same content, same interactions, at every screen size. We don't eyeball that and hope; we measure it automatically with a visual-regression (VR) harness and can gate a release on the result.

**First, three terms (for non-technical readers).**

- **"Testing," in software,** means proving the product still does what it should. Rather than have a person manually click through every page on every change — slow, and easy to miss something — software teams write small programs that perform the checks *automatically* and *identically* every time. That's **automated testing**, and a modern site has several kinds running constantly (does the page load? is the content right? is it accessible? — and, here, *does it still look correct?*).
- **A "regression"** is when a change *accidentally* breaks or alters something that was already working — the product *regresses*, i.e. slips backward. The danger isn't a new feature that has a bug; it's the *unrelated* thing that used to be fine and quietly isn't anymore. Catching those is the whole game.
- **A "visual regression,"** then, is a regression you can *see*: a heading in the wrong font, a card that shifted, an image that resized, spacing that drifted. This harness exists to catch exactly those — automatically, before they ship.

**What it does, concretely.** Before anything ships, the harness opens the *current production site* and the *new site* together, takes full-page screenshots of each at five common screen widths (phone → large desktop), and compares them pixel-for-pixel. Anything that moved, resized, recolored, or went missing is highlighted in a "difference" image and counted. If a page differs by more than a small tolerance the check **fails**, and that page is fixed (or the difference is explained) before cutover. It is an automatic game of "spot the difference" between old and new — run on every page — so a visual regression cannot slip through unnoticed.

**How it works (technical).** `pnpm vr` (→ `astro/scripts/vr/`) drives a headless Chromium via **Playwright** and pixel-diffs with **pixelmatch**:

- **Reference vs candidate.** Each route is captured on `VR_PROD` (default `https://icjia.illinois.gov`) and `VR_NEW` (default `http://localhost:4321` — the local production build — or a Netlify branch-deploy URL), back-to-back to minimize live-CMS drift between the two shots.
- **Five breakpoints.** The Vuetify-2 widths — 375 / 768 / 960 / 1280 / 1920 — at their real device-scale factors, so *responsive* layout is checked, not a single width.
- **Normalization (this is what kills false alarms).** A frozen wall-clock so date-relative "NEW!" badges are deterministic; all CSS animations/transitions disabled; a wait on `document.fonts.ready`; volatile regions masked (e.g. auto-rotating carousels); the dev toolbar stripped; and, for full-page shots, a scripted scroll to trigger lazy-loaded images followed by a network-idle wait so everything is painted before capture.
- **Alignment.** Both frames are anchored to the page `<h1>` and cropped to their common area, so an accepted constant top-spacing offset doesn't smear every row beneath it and hide the real differences.
- **Gates.** Per capture, the mismatched-pixel ratio is graded **PASS ≤ 1% · WARN ≤ 3% · FAIL > 3%**. *Why not 0%?* Two different rendering engines (Vue/Vuetify vs Astro) never produce byte-identical text even with identical fonts — sub-pixel anti-aliasing alone floors a text-heavy region at ~1–2%. So the gate is tuned to catch **structural** regressions (a layout shift, a wrong size, a missing or extra element all show up as a high %), and pixel-level fidelity is confirmed by eye on the diff images.

**Output.** Three PNGs per capture — `…__prod.png`, `…__new.png`, `…__diff.png` (the diff paints the changed pixels) — plus a `report.md` summary table, all under `astro/scripts/vr/__diffs__/`. The run exits non-zero if any capture FAILs, so it can block a CI job or a pre-cutover release.

**Coverage & usage.** The route list (`scripts/vr/config.mjs`) spans the app chrome (header, footer) and the content templates — home, news/press/meetings, events, grants, publications, about/staff/bios/units, the ResearchHub sections (landing, articles, and the dataset/app **lists and details**), and IRB — each at all five widths. Run from `astro/`:

```bash
pnpm vr                                    # full sweep: prod vs the local production build
VR_ONLY=rh- pnpm vr                        # only routes whose id matches (fast iteration)
VR_NEW=https://deploy-preview-123--icjia.netlify.app pnpm vr   # diff prod vs a Netlify deploy

pnpm vr:assert                             # STRICT: compare computed CSS values, prod vs new (zero tolerance)
```

**Why this is foundational here — not a formality.** Visual + functional parity with the approved production site is the *premise* of this entire rebuild, not a final checkbox — and this harness is how that premise is **continuously proven with evidence** rather than asserted. Every milestone of the migration is re-checked against production with it. Over the rebuild it has, concretely:

- **Caught what the eye missed.** It flagged ResearchHub headings and card titles rendering in *Oswald* where production uses *Lato* — the kind of difference people scroll right past, but a real deviation from the approved design. Found by measurement, not by luck.
- **Overruled plausible-but-wrong fixes.** "These pages look a little narrow — just widen them" is exactly the reasonable-sounding change that ships bugs. The harness was used to test that very change — *twice* — and rejected it both times, because widening measurably made pages *worse* (production's content is intentionally narrower than its outer frame). The resulting rule — **measure, don't adjust on a hunch** — is now written into the project's own engineering notes and reused.
- **Separated real problems from unavoidable noise.** It established that two different rendering engines (the old Vue site vs. the new Astro one) never produce byte-identical screenshots — a few percent of difference is just anti-aliasing, and live content (today's news, today's events) legitimately changes between captures. So a human reads the *difference images* to judge true parity instead of chasing an impossible "zero," and the thresholds are tuned to surface *structural* changes — a moved, resized, or missing element — which is what actually matters.

That is what "parity is a foundational principle, not an add-on" looks like in practice: a tool run at every step, catching real regressions, vetoing well-intentioned mistakes, and turning judgment calls into recorded, reusable rules.

**The pixel diff has a blind spot — and this is the honest part.** A screenshot comparison is powerful, but it is not omniscient, and on this project it missed two *real* regressions on the ResearchHub dataset pages: the Variables table lost its zebra striping (the alternating row shading), and the tag chips rendered in the wrong style and bunched together with no spacing. Both slipped past a "green" pixel run. Here is exactly why, because understanding it is the point:

- **Subtle colors hide under the tolerance.** A zebra stripe here is `#f6f8fa` — a barely-there grey — against white: about a 3.5% color difference per pixel. The pixel comparison deliberately ignores per-pixel differences below ~20% (that tolerance is precisely what stops anti-aliasing from screaming on every line of text). So a striped table and a flat-white table read as *identical* to it. The missing stripe was invisible to the tool, not just easy to miss by eye.
- **Small things drown in big pages.** The tag-chip strip is a sliver near the top of a very tall page. Even rendered completely wrong, it's a fraction of a percent of the page's pixels — under the cross-engine anti-aliasing "noise floor" every page already carries. The page's overall difference number simply didn't move enough to trip the gate.

A single pixel percentage cannot *localize* a small change or *see* a subtle color — and you can't fix that by tightening the tolerance, because pushing it toward zero makes every page light up red from anti-aliasing alone. That's *less* signal, not more.

**So the harness now has a second, stricter layer that reads the CSS itself, not the picture** (`pnpm vr:assert`, → `scripts/vr/assert.mjs` + `assertions.mjs`). It opens the same two sites and, for a curated list of parity-critical details, compares their **computed styles and measured geometry** — the actual `border-radius`, `text-transform`, `background-color`, rendered height, gap between elements — and **fails on any difference at all**. Because it compares *values* (is the even row `#f6f8fa`? are the chips uppercase pills 4px apart? is the heading Lato, not Oswald?) instead of *pixels*, it is completely immune to anti-aliasing noise, it names the exact element and property that drifted, and it has zero tolerance by design. It is the "not forgiving — at all" check. Both datasets bugs above are now permanent assertions in it and cannot silently return.

**Read these results as engineering, not magic.** No tool understands a design by intuition. This harness knows what "correct" means only because a person *measured production and wrote the check down* — "the dataset tag chip is a white pill, 2px border, uppercase, 24px tall, 4px gap." That list of checks is small today and is *meant to grow*: each time a real regression slips past the pixel diff, the remedy is to add a check so it can never slip again. The harness even needed correcting while it was built — its very first run raised a *false* alarm (it measured the wrong layer of an image) and the selector had to be fixed. That is normal and expected. These tools are authentic, maintained engineering that gets sharper over time as the team teaches it what to look at — not a one-time, all-seeing guarantee. Run at every step, corrected when it's wrong, and extended when it misses something, *that* is how "pixel-perfect parity" stops being a slogan and becomes something proven on every release.

**Where this harness has been — a short record (so the change is legible).**

| | Before (through mid-2026) | After (this pass) |
|---|---|---|
| What it compares | full-page **screenshots**, pixel-by-pixel | screenshots **plus computed CSS values** |
| Per-pixel tolerance | 20% (to absorb cross-engine anti-aliasing) | pixel layer unchanged; the new layer has **zero** tolerance |
| Verdict per page | one mismatch **%** (coarse) | the % **and** an exact pass/fail per checked property |
| Subtle-color diffs (zebra `#f6f8fa` vs white) | **missed** — the 3.5% delta is under the 20% tolerance | **caught** — `background-color` compared as a value |
| Localized diffs (tag-chip spacing/style) | **missed** — a few hundred px drowned in the page-wide AA floor | **caught** — `margin`/`gap`/`radius`/`text-transform` compared as values |
| Run with | `pnpm vr` | `pnpm vr` **and** `pnpm vr:assert` |

**What forced the change, and why.** Two real regressions shipped to the ResearchHub dataset pages — a Variables table that had lost its zebra striping, and tag chips rendered in the wrong style with no spacing — and a *green* pixel run flagged neither, for the two reasons spelled out above (the stripe colour is under the pixel tolerance; the chip strip is under the page-wide noise floor). That is the concrete evidence that a pixel percentage is *necessary but not sufficient*. The computed-style layer closes exactly that gap; both bugs are now permanent assertions and cannot silently return. The next regression the pixel diff misses becomes the next assertion — that ongoing growth *is* the maintenance, and it is why this is engineering rather than a one-time guarantee.

**Reusing this harness on another site.** It is deliberately small and portable — two files do the core work:

- **`scripts/vr/run.mjs`** — the engine (capture → normalize → align → diff → write report). **Site-agnostic; you don't edit it.**
- **`scripts/vr/config.mjs`** — the *only* site-specific part: the two base URLs, the list of routes to check, the breakpoints, and the pass/warn/fail thresholds.
- **`scripts/vr/assertions.mjs` + `assert.mjs`** *(optional but recommended)* — the strict computed-CSS layer. `assert.mjs` is the site-agnostic engine; `assertions.mjs` is your curated list of "this property must match the reference" checks. Start with a handful and grow it every time the pixel diff misses something.

To drop it into another project:

1. Copy the `scripts/vr/` folder in.
2. Install the three dev dependencies: `pnpm add -D playwright pixelmatch pngjs`, then `npx playwright install chromium`.
3. Add a script to `package.json`: `"vr": "node scripts/vr/run.mjs"`.
4. Edit **only `config.mjs`** — set `PROD_BASE` / `NEW_BASE` to that site's reference and candidate URLs, and list its routes (each `{ id, path, fullPage }`, with an optional `mask`/`settleMs`/`clipTop`); adjust the breakpoints or gates if its design calls for it.

Everything else — the clock-freeze, animation-off, fonts-ready gate, region masking, `<h1>` alignment, the `prod`/`new`/`diff` PNGs + `report.md`, and the non-zero exit on failure — is generic and works as-is. (It assumes the two URLs render the *same content from the same source* — the usual "approved old site vs new build of it" comparison this is built for; it is a parity checker, not a generic two-page differ.)

> **Visual is one half; functional is the other.** Parity of *behavior* is gated separately: the Vitest render/sanitizer suite (`pnpm test`), the Playwright interaction E2E (`pnpm test:e2e`), and axe-core + Lighthouse accessibility (a11y 100). Together they enforce the "looks the same **and** works the same" bar this migration is held to.

---

## Security audit

> **Audit date:** 2026-06-01 · **Scope:** full pre-cutover adversarial (red-team) review of the Astro SSR app — serverless/edge functions, HTTP headers + CSP + redirects, content sanitization / XSS, API endpoints, secrets & env handling, GraphQL injection, dependencies. **Method:** six parallel red-team passes, each finding then **independently verified against the source** before being recorded here. Living record — re-run and append on each material change.

This section is intentionally complete and candid (it is meant for management + compliance review): it states what was **fixed**, what is **recommended but not yet done**, what is an **accepted risk** with its compensating control, and what was **investigated and found not exploitable**.

### Summary

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| XSS-1 | Hub dataset/app `citation` rendered via `set:html` **unsanitized** | **Critical** | ✅ Fixed |
| XSS-2 | Home click-through `teaser` via `set:html` (text-cleaned only, no DOMPurify) | **High** | ✅ Fixed |
| XSS-3 | Event/meeting/grant `name` via `set:html`/`x-html` (text-cleaned only) | **High** | ✅ Fixed |
| INJ-1 | Hub app `url` → `window.open()` with no scheme check (`javascript:` possible) | Medium | ✅ Fixed |
| CSP-1 | CSP ships **Report-Only** (not enforced) + stale allowlist hosts in active `netlify.toml` | **High** | 🗓 Tracked — cutover |
| FN-1 | `purge-cache` secret compared with `!==` (not constant-time) | Medium | ✅ Fixed |
| FN-2 | `purge-cache` accepts secret via `?secret=` query param (log exposure) | Medium | ✅ Fixed |
| API-1 | No rate-limit on the SSR `?slug=` endpoints (cost / availability DoS) | Medium | ✅ Fixed (code) · platform limit = ops |
| HDR-1 | DOMPurify allows `<iframe>` in CMS markdown (content / phishing injection) | Medium | ✅ Fixed (host allowlist) |
| FN-3 | `keep-warm`/`nightly-rebuild` trust a spoofable `x-nf-event` header | Low | ✅ Fixed |
| CSP-2 | `script-src 'unsafe-inline' 'unsafe-eval'` (required by Alpine) | Medium | ⚖️ Accepted (compensating control) |
| SEC-1 | Live credentials in the local `.env` | Info | ⚠️ Not committed (verified); rotate as precaution |
| DEP-1 | 1 moderate transitive advisory (`yaml`), unreachable at runtime | Low | 👀 Monitored |
| INJ-2 | Hub GraphQL slug interpolation | — | ✅ Verified not exploitable |

### Fixed in this audit (see `astro/CHANGELOG.md` → `0.42.26`)

- **XSS-1 (Critical).** `getDataset`/`getApp` returned the Hub CMS `citation` field raw; `InfoBlock` renders it through `set:html`. A malicious or compromised Hub author could store `<img src=x onerror=…>` and run script for every visitor of a dataset/app page. **Fix:** route `citation` through `renderToHtml` (DOMPurify) — the path the *article* citation already used. (`src/lib/research.ts`)
- **XSS-2 (High).** Home click-through `teaser` reached `set:html` after only the text-cleanup filter (typo/apostrophe fixes — *not* an XSS sanitizer). **Fix:** `renderToHtml(teaser)` in `getHome`, matching the sibling `ContentClickThroughBoxes`. (`src/lib/data.ts`)
- **XSS-3 (High).** Event / meeting / grant `name` reached `set:html` (`EventCard`) and Alpine `x-html` (`EventsListing`) text-cleaned only. **Fix:** `renderInline(name)` on all calendar-feed names. (`src/lib/data.ts`)
- **INJ-1 (Medium).** Hub app `url` flowed into `window.open()`; a `javascript:` value could execute on click. **Fix:** allow only `http(s)` URLs. (`src/lib/research.ts`)

All four were re-checked with the VR harness after fixing: affected pages render identically to prod with zero errors (the fixes apply the same sanitization prod already uses, so no visual regression).

### Fixed in follow-up (commit `0.42.27`)

- **FN-1 / FN-2 — `purge-cache` hardening.** Secret now compared with `crypto.timingSafeEqual` (constant-time); the `?secret=` query-param fallback was removed (header-only, so the secret can't land in logs).
- **FN-3 — scheduled-function gate.** Removed the spoofable `x-nf-event` header branch from `keep-warm`/`nightly-rebuild`; the gate relies on the un-spoofable "no HTTP method" check.
- **HDR-1 — `<iframe>` host allowlist.** A DOMPurify `uponSanitizeElement` hook now drops any CMS-embedded iframe whose `src` is not https + an allowlisted host (`markdown.js`). **Action:** confirm the allowlist covers every legitimate embed in CMS content before cutover (extend it if needed).
- **API-1 — `?slug=` DoS cap (code).** The meeting endpoint validates slug shape before any Strapi query and caches negative results, capping the per-arbitrary-slug cost vector. *Platform-level rate-limiting on `/api/*` remains an owner/ops step — a Netlify dashboard/edge feature that can't be configured or tested from the codebase.*

### Remaining for the owner
- **SEC-1 — rotate the `.env` credentials** (precaution; gitignored/never committed, but read during the audit).
- **API-1 (platform) — configure Netlify rate-limiting on `/api/*`** at/after cutover.
- **CSP-1 — enforce the CSP** (see "Tracked for cutover" below).

### Accepted risk

- **CSP-2 — `'unsafe-inline'` + `'unsafe-eval'` in `script-src`.** Required by Alpine's inline `x-*` handlers and expression evaluator throughout the SSR HTML; removing it means render-time nonces on every Alpine attribute (a large rearchitecture) or dropping Alpine. **Compensating control:** all CMS content is DOMPurify-sanitized server-side (the XSS pipeline above), so the realistic injection path a CSP would backstop is already closed at the source. Revisit if Alpine is replaced.

### Tracked for cutover

- **CSP-1 — enforce the CSP.** Today it ships as `Content-Security-Policy-Report-Only` (advisory; nothing blocked, and nothing reported — no report endpoint configured). The **active** branch config (`netlify.toml`) also still lists stale allowlist hosts (Adobe DTM, Google Fonts) that the post-cutover `public/_headers` already drops. **At cutover:** switch to the enforced `Content-Security-Policy` from `public/_headers` after adding a `report-to`/`report-uri` sink and confirming zero violations in report-only.

### Investigated — not exploitable (verified)

- **INJ-2 — Hub GraphQL slug interpolation.** The three Hub single-item queries inline the slug via `JSON.stringify(slug)` (a documented workaround for a Strapi v3 bug that ignores GraphQL variables). Payload analysis confirms `JSON.stringify` escapes the only character that could break out of the string literal (`"`), so injection is not possible. The agency Strapi uses proper parameterized `$slug` variables (no injection surface). *Defense-in-depth suggestion:* add a `^[a-z0-9-]+$` slug guard in the detail-page callers.
- **Client-side secret exposure.** Zero `import.meta.env` references in `src/`; every secret is read only inside server-side Netlify functions — no server var reaches the client bundle.
- **Open redirects.** The trailing-slash edge function mutates only the path on a fixed origin; every `_redirects` external destination is a hard-coded host. No user-controlled redirect target exists.

### Secrets & dependencies

- **SEC-1 (Info — not a repository exposure).** The local `.env` holds live credentials (`NETLIFY_AUTH_TOKEN`, `MAILGUN_API_KEY`, `NETLIFY_BUILD_HOOK_URL`, `PURGE_SECRET`). It is `.gitignore`d and was **never committed** — verified across all 1,357 commits on every branch — so it is **not** in the public repo. Because the values were read by tooling during this audit, **rotation is recommended as routine precaution**, and `.env` should not live on a cloud-synced or external volume. *(Values are deliberately redacted from this record.)*
- **DEP-1 (Low).** `pnpm audit`: **0 critical, 0 high, 1 moderate** — `yaml@2.7.1` (DoS via deeply-nested collections), reached only transitively through `astro-seo → @astrojs/check` (a dev/build language-server chain) and **not on any runtime code path**, so unreachable in production. Lockfile (`pnpm-lock.yaml`) is committed. *Recommendation:* update/replace `astro-seo` to drop ~40 spurious build-tooling packages from the production tree.

---

## Docs

- **`docs/astro-conversion-checklist-v7.1.md`** — the build recipe + a running log of hard-won lessons (live-data SSR, edge caching, Alpine island patterns, the content pipeline, SEO, the VR harness). Read this before changing anything load-bearing.
- **`astro/CHANGELOG.md`** — what shipped, in order.
- **`.github/workflows/ci.yml`** — PR/push gates: vitest + eslint (a11y) + `astro check`, all blocking.
- **`docs/CUTOVER.md`** — production cutover runbook (owner checklist: env, CSP, Strapi webhooks, verification, rollback).

## License

[MIT](https://opensource.org/licenses/MIT)

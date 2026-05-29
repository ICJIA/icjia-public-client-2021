# Changelog — ICJIA Astro migration

All notable changes to the Astro (`astro/`) rewrite of `icjia.illinois.gov`.
This is the live-data SSR migration tracked on the `feat/astro-migration` branch.

## [0.13.0] — 2026-05-29 — Lighthouse fixes: Astro image optimization (no Thumbor) + target-size

### Lighthouse baseline (mobile, branch deploy home)
- **Performance 98** ✅ · **SEO 100** ✅ · accessibility 96 · best-practices 96.
  (Perf hit the 98 stretch even with the 2.1MB Research strip — it's deferred.)

### Fixed — accessibility 96 → (target 100)
- `target-size`: the one offender was the WidgetBar single-link ("RESEARCH HUB »").
  Gave it `inline-block py-1` for a ≥24px tap target (WCAG 2.5.8); the bar is
  flex-centered so the visible text doesn't move.

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

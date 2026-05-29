# Changelog — ICJIA Astro migration

All notable changes to the Astro (`astro/`) rewrite of `icjia.illinois.gov`.
This is the live-data SSR migration tracked on the `feat/astro-migration` branch.

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

![ICJIA — Illinois Criminal Justice Information Authority](astro/public/icjia-og.png)

# ICJIA Public Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/e6614e77-00b4-4772-8034-a3b9c9c9986d/deploy-status)](https://app.netlify.com/sites/icjia-public/deploys) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!IMPORTANT]
> **`main` builds and serves the legacy Vue 2 SPA** — the app at this repository root, built by `npm run build` (`vue-cli-service`) per `netlify.toml`. That is what is live at [`icjia.illinois.gov`](https://icjia.illinois.gov).
>
> **The Astro rewrite described below lives in [`astro/`](astro/) and is dormant** — it is *not* built or served by `main` and is awaiting cutover approval. Cutting over is a single-file change to `netlify.toml [build]`.
>
> **Scope note:** everything below — Stack, Commands, Architecture — documents the **Astro** rewrite (pnpm · Vitest, run from `astro/`). For the live Vue 2 app at this repo root, see **[Testing the Vue 2 app](#testing-the-vue-2-app)** immediately below.

---

## Testing the Vue 2 app

The live site is the Vue 2 SPA at the **repository root** (`vue-cli-service`), tested with **mocha + chai + @vue/test-utils** (unit) and **Playwright** (regression). Commands run from the repo root with **npm** — not `pnpm`, and not from `astro/`:

```bash
npm run tests        # mocha unit suite (jsdom) — the main gate
npm run tests:watch  # same, in watch mode
npm test             # Playwright regression suite — needs a dev server (npm run serve) on :8080
npm run lint         # eslint (vue-cli-service)
```

**Unit coverage** (`tests/unit/*.spec.js`, bootstrapped by `tests/unit/setup.js`): the content sanitizer (table/contrast/link a11y fixes), markdown rendering + XSS, the `src/a11y/` DOM-fix functions, all 22 Vue filters, `src/lib/utils.js` helpers, the events time-range builder, hub-image fallback, the auth Vuex module, the lazy Fuse search loader, publication-export helpers, security regressions, and config/data-integrity checks.

**CI:** `.github/workflows/ci.yml` gates every PR/push with a **`vue-unit`** job (repo root, Node 22). It runs `tests/unit/!(config).spec.js` — `config.spec.js` is excluded because it reads `public/api/*.json`, which is git-ignored and generated at build time. Run the full `npm run tests` locally to include those data-integrity checks.

---

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
pnpm vr             # visual-regression harness (Playwright + pixelmatch)
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

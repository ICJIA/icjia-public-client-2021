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

## Docs

- **`docs/astro-conversion-checklist-v7.0.md`** — the build recipe + a running log of hard-won lessons (live-data SSR, edge caching, Alpine island patterns, the content pipeline, SEO). Read this before changing anything load-bearing.
- **`astro/CHANGELOG.md`** — what shipped, in order.

## License

[MIT](https://opensource.org/licenses/MIT)

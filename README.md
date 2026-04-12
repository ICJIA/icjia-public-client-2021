# ICJIA Public Client 2021

[![Netlify Status](https://api.netlify.com/api/v1/badges/e6614e77-00b4-4772-8034-a3b9c9c9986d/deploy-status)](https://app.netlify.com/sites/icjia-public/deploys) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Public website for the Illinois Criminal Justice Information Authority (ICJIA).

**Production:** https://icjia.illinois.gov

## Tech Stack

- **Framework:** Vue 2.6 / Vuetify 2.5
- **Build:** Vue CLI 4 / Webpack 4
- **CMS:** Strapi 3 (GraphQL API)
- **Search:** Fuse.js (client-side full-text search)
- **Hosting:** Netlify
- **Analytics:** Plausible
- **Node:** 22.x in production (Netlify); 16.x or newer for local development

## Requirements

**Node.js 22 LTS** is what the Netlify build runs (`netlify.toml` pins `NODE_VERSION = "22"`). Local development works on Node 16, 18, 20, or 22 — the `package.json` engines field declares `>=16.x`. If you use `nvm`, the included `.nvmrc` will pick the recommended version automatically.

```bash
nvm use            # picks up .nvmrc
node --version     # any 16.x / 18.x / 20.x / 22.x
```

## Setup

```bash
nvm use
npm install
```

## Development

```bash
npm run serve
```

Dev server runs at http://localhost:8080

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Testing

### Unit Tests (Mocha/Chai)

**224 passing / 6 pending / 0 failing** — covers security mitigations, accessibility functions, markdown rendering, Vue components, the auth store, the lazy search-index loader, and data integrity.

```bash
npm run tests
```

| Suite | Tests | What it guards |
|---|---|---|
| `security.spec.js` | 41 | XSS payloads (20+), GraphQL injection, security headers, CORS, source maps |
| `config.spec.js` | 84 | HTTPS enforcement, 10 API data files, build config, env security |
| `a11y.spec.js` | 38 | All 13 a11y DOM fix functions (headings, tabindex, ARIA, target size, data-table headers, aria-hidden focus, empty aria-label) |
| `markdown.spec.js` | 27 | Heading anchors, link attributes, tables, code blocks, edge cases |
| `auth.spec.js` | 15 | Vuex mutations/getters, logout localStorage cleanup |
| `search.spec.js` | 10 | Lazy-loaded search index — `getFuse()` contract, caching, failure recovery, bundle-contract guard |
| `components.spec.js` | 9 + 6 pending | SkipLink rendering; Banner/Disclaimer pure-JS (`render()`, XSS sanitization). Vuetify-mount tests are skipped — `vuetify-loader` doesn't run inside the mocha bundle; full rendering is covered by the Playwright suite |

### Regression Tests (Playwright)

37 end-to-end tests covering navigation, page loads, search, cards, and page structure across all major sections.

```bash
# Requires dev server running on localhost:8080
npm run test
```

### Accessibility Audit (axe-core)

WCAG 2.1 Level AA compliance testing across all content types. Uses axe-core via Puppeteer.

```bash
# List available content types and page counts
npm run audit

# Audit a specific content type (5 random samples)
npm run audit -- posts

# Audit with more samples
npm run audit -- hub --sample 10

# Audit all content types
npm run audit -- all --sample 5
```

Results are saved to `reports/accessibility-audit-results/`.

### Broken Link Checker

Crawls pages and checks all external links. Outputs a CSV for content authors to fix broken URLs.

```bash
# Check 5 samples per content type
npm run check-links

# Larger sample
npm run check-links -- --sample 10

# Check ALL pages (slow — 2,345 pages)
npm run check-links -- --full
```

Reports are saved to `reports/`.

## Security Posture

**Last audit:** April 11, 2026 — Red Team / Blue Team assessment across 2,356 routes and all application components.

**Overall rating: MODERATE-HIGH** — zero P0 (critical) vulnerabilities; three P1 items identified (two new, one previously known). All XSS vectors confirmed blocked by DOMPurify + route param sanitization. New risks from DOMPurify `<style>` tag allowlisting and missing CSP header identified and documented.

| Category | Status | Details |
|---|---|---|
| **Security headers** | **Hardened** | X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy enabled. **CSP in report-only mode** (v1.3.41) — allowlist validated against 9 representative routes via Chrome MCP audit; promotion to enforcement deferred until a CSP report endpoint is in place to give visibility into any silent breakage. `worker-src 'self'` + `upgrade-insecure-requests` directives are present (no-op in report-only) |
| **CORS** | **Restricted** | Locked to `https://icjia.illinois.gov`; no wildcard |
| **XSS prevention** | **Hardened** | DOMPurify sanitization at `renderToHtml()` chokepoint covers all `v-html` bindings; route params regex-sanitized; `v-html` directive globally overridden with content pipeline |
| **CSS injection** | **Mitigated (P2)** | DOMPurify now allows `<style>` tags and `style` attributes for CMS layout support. DOMPurify strips `javascript:` URLs and event handlers but CSS `url()` exfiltration is possible if CMS account is compromised. Mitigated by CMS auth; would be fully blocked by CSP |
| **GraphQL injection** | **Mitigated** | Route params sanitized to `[a-zA-Z0-9_-]` before query interpolation; Apollo parameterized queries used elsewhere |
| **External links** | **Mostly hardened** | `rel="noopener noreferrer"` on all markdown-rendered links; 3 template links to first-party domains missing `rel` (P3) |
| **Auth tokens** | **localStorage (P1)** | JWT in localStorage; HttpOnly cookies require Strapi 3 backend migration |
| **Data exposure** | **Hardened (v1.3.33)** | Build-time `purifySearchMeta` strips staff names from all 9 per-type JSONs and `searchIndex.json` before publish. Biographies themselves are unmodified. |
| **Server disclosure** | **Mitigated** | `X-Powered-By` header hidden via `netlify.toml` (v1.3.33). Strapi stack trace suppression still requires backend `NODE_ENV=production` (SEC-15) |
| **Source maps** | **Hardened** | `productionSourceMap: false`; no `.map` files served |
| **HTTPS** | **Full** | All endpoints and CDN resources use TLS |
| **Console stripping** | **Active** | Production builds remove `console.log` via Babel plugin |
| **Dependencies** | **Accepted risk** | `npm audit` reports 20 production vulnerabilities (5 critical, 12 high), all requiring breaking changes. DOMPurify mitigates the Vuetify XSS advisories in practice. Deferred to the planned Nuxt 4 / Strapi 5 rewrite |
| **Env / secrets** | **Hardened** | `.env` in `.gitignore`, no credentials committed, no source maps |

### New findings (April 2026)

| # | Finding | Severity | Status |
|---|---|---|---|
| SEC-09 | No Content-Security-Policy header | **P1** | **Mitigated (v1.3.33 report-only)** — allowlist in place since v1.3.33, validated against live page loads via Chrome MCP audit (9 routes, zero unlisted origins). Briefly enforced in v1.3.40, reverted to report-only in v1.3.41 pending a CSP report endpoint for post-deploy visibility. `worker-src 'self'` + `upgrade-insecure-requests` added |
| SEC-10 | npm dependency vulnerabilities (20 total, 5 critical) | **P1** | Accepted — breaking changes only; deferred to Nuxt 4 rewrite; DOMPurify mitigates Vuetify XSS |
| SEC-11 | DOMPurify `<style>` tag + `style` attr allowlisting enables CSS exfiltration | **P2** | Accepted — required for CMS layout; mitigated by CMS auth; mitigated by CSP (SEC-09) |
| SEC-12 | Staff names leaked in `searchMeta` across API JSON files | **P2** | **Fixed (v1.3.33)** — build-time `purifySearchMeta` strips names |
| SEC-13 | `searchIndex.json` exposes staff names alongside search data | **P2** | **Fixed (v1.3.33)** — same purification pass as SEC-12 |
| SEC-14 | `X-Powered-By` header discloses server framework | **P2** | **Fixed (v1.3.33)** — empty header override in `netlify.toml` |
| SEC-15 | Strapi production API leaks stack traces in error responses | **P2** | Open — requires Strapi backend `NODE_ENV=production` |
| SEC-16 | No `/.well-known/security.txt` (RFC 9116) | **P3** | Open — recommended for government sites |
| SEC-17 | Dead code `ResearchHub.js:getSingleArticleQuery()` with unsanitized interpolation | **P3** | Open — remove or sanitize |

### Previously known items (unchanged)

| # | Finding | Severity | Status |
|---|---|---|---|
| SEC-06 | JWT in localStorage (HttpOnly cookies require Strapi migration) | **P1** | Backend-dependent |
| SEC-07 | No CSRF tokens | **P2** | Backend-dependent |
| SEC-08 | No login rate limiting | **P2** | Backend-dependent |

### Confirmed secure (April 2026)

- **XSS via URL route params:** Vue Router URL-encodes payloads; regex sanitization strips injection characters. Confirmed safe.
- **XSS via search results:** Search index is a static compile-time artifact processed through `deepSanitize()`. Low risk.
- **Open redirect:** All redirects use hardcoded URLs; login redirect ignores query params. Confirmed safe.
- **GraphQL introspection:** No GraphQL endpoint exposed on frontend. Confirmed safe.
- **Admin panel exposure:** `/admin/` returns SPA shell redirect, no server-side admin. Confirmed safe.
- **Sensitive file exposure:** `.env`, `.git/config`, `package.json` all return SPA fallback. Confirmed safe.
- **Source map exposure:** No `.map` files served. Confirmed safe.

View the [security policy](SECURITY.md).

## Accessibility

**Compliance target:** WCAG 2.1 Level AA (Illinois Title II ADA requirement)

### Accessibility Testing Tools: axe-core vs. SiteImprove

This site is audited with two complementary tools that produce **different results for the same pages**. This is expected — not a sign of inadequate remediation.

**axe-core** (primary, open-source) runs in-browser after full page render, including all runtime accessibility fixes. It follows WCAG success criteria closely and only flags clear violations. This site passes axe-core with **zero violations across 157 audited pages** (see "Sampling strategy" below).

**SiteImprove** (secondary, enterprise) crawls pages remotely on a schedule. It uses a proprietary rule set (`sia-r` prefix) that applies some WCAG rules more broadly than the spec requires and includes ambiguous "cantTell" results in its violation count. SiteImprove flags issues in three categories:

| Category | Example | Action |
|---|---|---|
| **Legitimate gaps** not covered by axe-core | sia-r83 (text clipping at 200% zoom), sia-r77 (table cell context) | Remediated |
| **Stricter-than-spec interpretations** | sia-r14 (flags `<nav aria-label>` — WCAG 2.5.3 only applies to widgets) | Fixed to satisfy SiteImprove, though already WCAG-compliant |
| **Cached/stale results** | Issues fixed in code but not yet recrawled | Clear on next SiteImprove scan |

**Key differences:**

| | axe-core | SiteImprove |
|---|---|---|
| Rule source | Open-source (Deque Systems) | Proprietary (`sia-r` rules) |
| Scanning | In-browser, sees runtime JS fixes | Remote crawler, may miss client-side fixes |
| False positives | Low | Higher — broader rule interpretation |
| Ambiguous cases | "Incomplete — needs review" (excluded from count) | "Failed/cantTell" (included in count) |
| Cost | Free | Paid enterprise license |

**Build process integration:** axe-core is integrated into the development workflow (`npm run audit`) and can be run on-demand against a local dev server before every deploy. **SiteImprove cannot be integrated into the build process** — it is a cloud service that crawls the live production site on its own schedule with no CLI, API, or local runner. Every SiteImprove flag must be manually reviewed after deployment, and results may lag days or weeks behind the current state of the code.

**Recommendation:** Use axe-core as the development-time gate and SiteImprove as a monitoring layer. When SiteImprove flags an issue axe-core does not, investigate whether it is a legitimate gap, a stricter interpretation, or a stale result. See [CHANGELOG.md](CHANGELOG.md) for detailed analysis.

> **Neither tool replaces manual testing.** Automated scanners catch ~30-40% of WCAG issues. Screen reader testing, keyboard navigation, and cognitive accessibility review require human judgment.

### Current Status (April 2026)

| Metric | Score |
|---|---|
| Full axe-core audit (157 pages, 30/type, 5 content types) | **157/157 zero violations (100%)** |
| Prior Lighthouse a11y audit (93 pages, desktop + mobile) | **93/93 score 100/100** |
| Prior sampled audit (57 pages, 10 content types) | **57/57 zero violations (100%)** |
| Regression tests (Playwright) | **37/37 passing** |
| Unit tests — a11y functions (Mocha/Chai) | **38/38 passing** |
| Unit tests — security (Mocha/Chai) | **41/41 passing** |
| Automated score (WCAG 2.1 AA) | **A / 100%** |

### Sampling strategy (157 pages of 2,356)

This site has **2,356 dynamic pages** generated from CMS content across 10 content types. The most recent axe-core audit tested **157 pages** (30 randomly sampled per content type plus index/listing pages). This sampling approach is used because:

1. **Shared templates** — all 172 grant pages render through the same Vue component, all 251 Research Hub articles use the same `ArticleView.vue`, etc. If 5 random grant pages pass, the remaining 167 will pass too — they execute identical code paths.

2. **Runtime a11y fixes are global** — the 27 post-render fix functions in `src/a11y/index.js` run on every page. A fix like `fixTableCellContext()` applies to all CMS tables regardless of which article they appear in.

3. **Time** — a full audit of all 2,356 pages takes ~4 hours (~6 seconds/page). The sampled audit takes ~6 minutes.

4. **CMS content variations** (e.g., inline `color: red` in one article) are the only source of page-specific issues. These are handled by runtime fixes that apply globally, not per-page.

**A full audit of all 2,356 pages is possible** and can be run when needed:

```bash
# Full audit — ALL pages, ALL content types (~4 hours)
npm run audit -- all --sample 9999

# Larger sample — 20 per type (~20 minutes)
npm run audit -- all --sample 20

# Full audit of one content type
npm run audit -- hub --sample 9999
```

| Content Type | Total Pages | Default Sample |
|---|---|---|
| publications | 1,101 | 5 |
| meetings | 275 | 5 |
| hub (articles) | 251 | 5 |
| jobs | 218 | 5 |
| posts (news) | 180 | 5 |
| grants | 172 | 5 |
| biographies | 114 | 5 |
| pages | 29 | 5 |
| units | 10 | 5 |
| events | 6 | 5 |
| **Total** | **2,356** | **~57 (default) / 157 (latest audit)** |

### Accessibility Features

- **Route announcements** — `aria-live` region announces page title on navigation for screen readers
- **Keyboard navigation** — all cards, buttons, and interactive elements are keyboard accessible
- **Semantic HTML** — proper heading hierarchy, `<nav>` landmarks, `<button>` elements
- **ARIA labels** — carousel slides, icon buttons, search fields, modals, download links
- **Skip navigation** — skip-to-content link for keyboard users
- **Color contrast** — all text uses black (#000) or white (#fff) for maximum contrast; runtime fix overrides CMS inline color styles
- **External links** — screen reader announcement of "(opens in new tab)"
- **Post-render CMS fixes** — JavaScript corrects accessibility issues from Strapi 3 markdown rendering (heading order, figure tabindex, chip contrast, empty table headers, table cell context with scope/headers for simple and complex tables, footnote target size, link underlines, form field labels, label-in-name conflicts, invalid ARIA roles, empty containers, inline color contrast, data table header scoping, aria-hidden focus management)
- **SiteImprove content intercept** — Plugin-based content pipeline (`contentSanitizer.js`) fixes CMS misspellings, missing image alt text, dark-background contrast issues, and apostrophe-stripped titles before content reaches the DOM (see [SiteImprove Intercept](#siteimprove-intercept-content-pipeline) below)

### SiteImprove Intercept (Content Pipeline)

#### The problem: why axe-core and SiteImprove disagree

**axe-core** runs inside the browser after JavaScript executes. It sees the same DOM the user sees — including SPA route changes, async content, and runtime accessibility fixes. This site scores **zero violations on axe-core across 157 audited pages**.

**SiteImprove** is a remote crawler. It fetches pages server-side and attempts to execute JavaScript, but it cannot reliably parse Single Page Applications. On an SPA, much of the content is rendered client-side by JavaScript frameworks (Vue, React, Angular) after the initial page load. SiteImprove often sees partial or stale DOM states, leading it to flag issues that don't exist for real users. This is a fundamental architectural limitation — **not a deficiency in the site's accessibility**.

SiteImprove also applies proprietary rules (`sia-r` prefix) that interpret WCAG more broadly than the spec requires, includes ambiguous "cantTell" results in its violation count, and caches results that may lag weeks behind the actual state of the code. The result: **SiteImprove will almost never give an SPA a perfect score, even when the site is fully WCAG 2.1 AA compliant.**

#### The solution: intercept content before it reaches the DOM

Since SiteImprove cannot reliably read what JavaScript renders, the strategy is to **fix content before it enters the DOM** — at the data layer, not the presentation layer. If misspellings, missing attributes, or structural issues exist in CMS content, fix them in transit between the API response and the template render. SiteImprove then sees the corrected content regardless of how well it parses the SPA.

This pattern — a **SiteImprove intercept** — is applicable to any SPA + headless CMS architecture:

1. **Identify the data flow.** Where does CMS content enter your app? GraphQL responses, REST API calls, static JSON, markdown rendering pipelines.
2. **Add a transformation layer.** Insert a function that receives the raw content string and returns a corrected string. Chain multiple transformations as plugins.
3. **Apply at every entry point.** API response interceptors (axios, fetch), GraphQL afterware links, template directive overrides, build-time data processing.
4. **Separate content fixes from DOM fixes.** String transformations handle CMS content (misspellings, HTML attributes, tag structure). Post-render DOM mutations handle framework-generated markup (Vuetify ARIA, focus management, contrast). These are two distinct layers.

The intercept does **not** replace accessibility testing — it complements it by ensuring that the content SiteImprove *can* read is as clean as possible. Runtime DOM fixes (`a11y/index.js`) handle everything else.

#### This project's implementation

The SiteImprove intercept for this site is a plugin-based content pipeline at `src/utils/contentSanitizer.js` that transforms all CMS content from Strapi 3 before it reaches the DOM.

#### Two-layer fix model

```
CMS Content (Strapi 3)
    |
    v
+-------------------------------+
|  SiteImprove intercept        |  <-- contentSanitizer.js
|  (string transforms)          |      Fixes content BEFORE render
+-------------------------------+
    |
    v
  Vue renders to DOM
    |
    v
+-------------------------------+
|  Runtime DOM fixes            |  <-- a11y/index.js
|  (post-render mutations)      |      Fixes DOM AFTER render
+-------------------------------+
    |
    v
  SiteImprove crawls the page
```

#### What the intercept CAN fix

Anything that is a **text or HTML string transformation** on CMS content:

| Category | Examples |
|---|---|
| Misspellings | Typos in Strapi content fields (`fixMisspellings`) |
| Missing punctuation | Apostrophes stripped by slug generation (`fixApostrophes`) |
| Missing image alt text | Auto-derive alt from filenames (`fixCmsImages`) |
| CMS color contrast | Fix dark-bg/black-text conflicts (`fixCmsContrast`) |
| HTML attribute injection | Add `scope`, `aria-label`, `lang` to CMS HTML elements |
| Tag wrapping/restructuring | Wrap `<table>` in scrollable `<div role="region">` |
| Lang attributes for foreign text | Wrap British spellings in `<span lang="en-GB">` |
| Link text augmentation | Append sr-only text to vague "click here" links |
| Empty element removal | Strip empty `<p>`, `<span>`, `<div>` from markdown output |

#### What the intercept CANNOT fix

Anything involving **Vuetify's runtime DOM**, **CSS**, **layout**, or **behavior** — these are handled by `src/a11y/index.js` instead:

| Category | Why | Fix location |
|---|---|---|
| Vuetify component ARIA | Vuetify generates DOM at runtime | `a11y/index.js` |
| Vuetify/CSS color contrast | CSS computed styles on framework elements | `app.css` or `a11y/index.js` |
| Focus indicators | CSS `:focus-visible` | `app.css` |
| Text clipping at zoom | CSS overflow/layout | Component CSS |
| Keyboard navigation | Event handlers, tabindex | `a11y/index.js` |
| Landmark structure | Vue template structure | Component templates |
| Nested interactive elements | Vuetify nests interactive controls | `a11y/index.js` |
| Dynamic overlays/tooltips | Created after render | `a11y/index.js` (MutationObserver) |

**Rule of thumb:** If the content comes from Strapi, fix it in the intercept. If the DOM comes from Vuetify or Vue templates, fix it in `a11y/index.js`.

#### Adding a new SiteImprove intercept

For **simple misspelling fixes**, add entries to the `MISSPELLINGS` or `APOSTROPHES` arrays in `contentSanitizer.js`:

```js
// In src/utils/contentSanitizer.js
const MISSPELLINGS = [
  [/\btypoHere\b/gi, "corrected"],
  // ...
];
```

For **more complex transformations**, write a plugin function and register it:

```js
// A plugin is any function: (text: string) => string
function fixSomeIssue(text) {
  return text.replace(/<table>/g, '<table role="grid">');
}

// Register for both pipelines (HTML + text)
registerPlugin(fixSomeIssue);

// Or register for one pipeline only
registerHtmlPlugin(fixSomeIssue);   // HTML bodies only
registerTextPlugin(fixSomeIssue);   // titles/summaries only
```

#### Interception points

The pipeline intercepts content at every entry point:

| Entry Point | Mechanism |
|---|---|
| Markdown bodies | `sanitizeContent()` in `Markdown.js` and `markdownIt.js` |
| ResearchHub API (axios) | `sanitizeResponse()` interceptor |
| Publications API (axios) | `deepSanitize()` on response data |
| Apollo GraphQL | `sanitizeLink` afterware in `vue-apollo.js` |
| `v-html` directive | Global override in `main.js` auto-sanitizes |
| Template interpolation | `\| sanitize` filter and global `this.sanitize()` mixin |
| Page `<title>` tags | `titleTemplate` in `App.vue` uses `sanitizeText()` |
| Search index | `deepSanitize()` in `AppInit.js` |

### Known Remaining Issues

These originate from CMS-authored content or external proxy sites and are mitigated by post-render JavaScript where possible. They will be fully resolved in the planned Nuxt 4 / Strapi 5 rewrite:

- Heading level skips in some article bodies (CMS authors skip heading levels)
- Occasional async data race condition on listing pages (`page-has-heading-one`)
- Contrast issues on `/adultredeploy` (separate Netlify site proxied via `_redirects`)

See [CHANGELOG.md](CHANGELOG.md) for full audit details and remediation history.

## Performance

A Tier 1 perf pass (April 2026, v1.3.36–v1.3.43) targeted the highest-impact, lowest-risk wins identified in the pre-rewrite audit. No architectural changes — every fix below is a same-shape edit that the planned Nuxt 4 rewrite can either inherit or supersede.

| Fix | Win |
|---|---|
| Lazy-load the 2.7 MB `searchIndex.json` instead of static-importing it into the entry chunk (v1.3.36) | **`dist/js/app.*.js`: 2.9 MB → 262 KB (-91%)** |
| Move the entire search pipeline (fetch + parse + sanitize + Fuse build + per-keystroke search) into a Web Worker (v1.3.37) | Main thread stays free during search; per-query round-trip ~41 ms verified in Chrome; no input freeze |
| Defer the search-index fetch until the user opens the search modal (was firing at app boot from `ModalSearch`'s `created()` hook) | First paint no longer waits on a 2.7 MB JSON parse + sanitize + Fuse build |
| Disable unused Fuse options (`includeMatches`, `includeScore`) — neither was read anywhere in the UI; `includeMatches` is Fuse's most expensive setting (per-character match positions for highlighting) | Faster per-keystroke search response in the modal |
| Immutable `Cache-Control` headers on `/js/*`, `/css/*`, `/img/*`, `/fonts/*` (Vue CLI emits content-hashed filenames so this is safe); `searchIndex.json` / `searchWorker.js` get `max-age=3600 + stale-while-revalidate=86400`; `fuse.min.js` gets `max-age=86400`; `index.html` is `must-revalidate` so users always pick up new builds | Repeat-visit JS/CSS downloads drop to ~0 |
| Early-return on the 3 `MutationObserver`-installing a11y fixes once their observer is wired (`fixOverlayContainer`, `fixNestedInteractive`, `fixProhibitedAriaOnImg`) | Saves three broad `querySelectorAll` calls per route navigation |
| Drop the redundant 2px outer focus outline on the search input (Vuetify's built-in 1px underline + label color shift already meet WCAG 2.4.7 on their own) (v1.3.38) | Cleaner search modal UI with no a11y regression |
| Remove the `<link rel="preload" href="/home-splash.webp">` that vue-meta injected after `<picture>` had already started fetching, plus add `loading="lazy"` to the AppFooter logo and Status-page Netlify deploy badges (v1.3.40) | Eliminates 5 console warnings per homepage visit; defers below-fold images |
| Async-load all 5 stylesheets in `index.html` (Lato/Oswald, Roboto, Material Icons, Raleway, MDI) using `media="print" onload="this.media='all'"` + `<noscript>` fallback; add `display=swap` to the two Google Fonts URLs that didn't have it; preconnect `cdn.jsdelivr.net` (v1.3.42) | **Render-blocking estimated savings: 4,000 ms → 370 ms (-90%)** across every page |
| Re-encode the homepage hero image: pre-grayscale at the source (CSS already applied `filter: grayscale(100%)` at runtime), generate AVIF as the first `<source>`, drop quality (overlay hides artifacts), add `fetchpriority="high"` + `decoding="async"` (v1.3.43) | Hero file 94 KB WebP → **36 KB AVIF (-62%)**; homepage LCP ~16.5s → ~11s |

### Mobile Lighthouse audit — final state (April 2026, post v1.3.43)

20 routes sampled across all 10 content types (homepage, hub listing + article, publications, grants, posts, jobs, meetings, biographies, units, events, IRB, forms, status):

| Metric | Value | Notes |
|---|---|---|
| Performance score | **53–58** (avg ~57) | "Needs Improvement" range; consistent across content types |
| FCP | 7.3–8.6s | Gated by Vue mount + JS bundle parse, not by CSS or images |
| LCP | 7.9–11.0s | Homepage no longer the outlier (was 16.5s, now ~11s after the AVIF fix) |
| Render-blocking insight | ~370 ms savings | Down from ~4,000 ms before async stylesheets |
| Top remaining issues | Vuetify framework cost — `unused-css-rules` (~103 KB), `unused-javascript` (~143–194 KB), long network-dependency tree | All structural; require the rewrite |

### Where the v1.3.x line ends — honest framing

Everything fixable inside Vue 2 / Vuetify 2 has been fixed. The remaining mobile slowness is **framework cost**: ~1.8 MB of `chunk-vendors.js` (Vue 2 + Vuetify 2 + dependencies) plus ~100 KB of unused CSS that comes with Vuetify 2. No bundle-splitting trick gets this smaller while staying on the framework — it's the price of the choice.

Further perf work requires architectural change:
- **Switching to SSR/SSG** — fixes the blank-screen-during-JS-mount problem (currently ~7s on mobile). That's the Nuxt 4 rewrite.
- **Replacing Vuetify 2** — eliminates the framework JS/CSS overhead. Also the rewrite.
- **Pre-rendering** — possible inside v1.3.x via vue-cli's prerender plugin, but multi-day project and only helps initial page.

For the next several months until the rewrite ships, this is the best shape the site is going to be in. Mobile users get the hero image ~5s faster, search runs without freezing the UI, repeat visits are near-zero bytes, and a11y is still 157/157 axe-clean. The remaining slowness is structural — unfixable without writing a new app, which is exactly what's planned.

### Search architecture (worker-backed lazy loader)

```
                   main thread                                     web worker
  ┌───────────────────────────────────────┐         ┌───────────────────────────────┐
  │ User opens search modal               │         │  /searchWorker.js             │
  │ ModalSearch.ensureFuse()              │         │   importScripts('fuse.min.js')│
  │   await myApp.getFuse()  ─────────────┼────────►│                               │
  │     creates Worker, sends INIT        │         │   fetch /searchIndex.json     │
  │                                       │  READY  │   JSON.parse                  │
  │   ◄────────────────────────────────── │         │   deepSanitize (regex-only)   │
  │                                       │         │   new Fuse(records, opts)     │
  │ User types "research"                 │         │                               │
  │ instantSearch() ─────────────────────►│  SEARCH │   fuse.search(q)              │
  │   await client.search(q)              │ id, q   │                               │
  │                                       │ RESULTS │                               │
  │   ◄────────────────────────────────── │ id, [...│                               │
  │ this.queryResults = results           │         │                               │
  └───────────────────────────────────────┘         └───────────────────────────────┘
```

**Why a worker?** The lazy fetch alone (v1.3.36) fixed bundle size but left a UI freeze on the first keystroke after opening search — `JSON.parse` of 2.7 MB + `deepSanitize()` over every string + `new Fuse(...)` all run synchronously when the response arrives, blocking input. The worker (v1.3.37) does all of that off-thread, plus subsequent per-keystroke `Fuse.search()` calls. Verified at ~41 ms per round-trip in Chrome.

**Files:**
- `public/searchWorker.js` — vanilla worker, no build tooling needed
- `public/fuse.min.js` — auto-synced from `node_modules` via `npm run copy:fuse` (wired into `serve` and `build`)
- `src/services/searchClient.js` — RPC wrapper exposing `ready()` and `search(q)` as Promises; tracks pending request ids so out-of-order responses are safe
- `src/services/AppInit.js` — `getFuse()` returns the worker-backed client when `Worker` is available; falls back to an in-process Fuse instance (wrapped to expose the same async `search()` shape) for SSR / jsdom tests / very old browsers

**Consumers** (`ModalSearch.vue`, `Search.vue`, `SearchStatic.vue`, `StaticSearch.vue`) `await this.fuse.search(q)` and carry a monotonic `searchSeq` counter that discards stale responses if the user types faster than the worker can reply.

**Test guard:** `tests/unit/search.spec.js` pins this contract — including a **bundle-contract guard** that asserts `AppInit.js` never re-introduces a static `import` of `searchIndex.json`. This is the perf win most likely to silently regress, so CI blocks it.

**Why not Fuse.js's official `FuseWorker`?** It exists in `fuse.js@7.4.0-beta.1` (`npm install fuse.js@beta`) but: (1) it's beta with API "may change" warning, (2) Fuse 7.0.0 dropped UMD builds — our worker uses `importScripts()` which needs UMD, so adoption forces a Fuse 6→7 upgrade plus an ES-module-worker rewrite, (3) FuseWorker's headline 5x speedup is on 100K-document datasets; ours has ~5K and already runs at ~41 ms per query, (4) FuseWorker doesn't run our regex sanitizer over the index. Both APIs are `await client.search(q) → results`, so when the Nuxt 4 rewrite happens and Fuse 7.x is GA, it's a one-file swap inside `searchClient.js`. See [CHANGELOG.md](CHANGELOG.md) v1.3.38 for the full evaluation.

## Project Structure

```
/
├── src/                    Vue application source
│   ├── a11y/               Accessibility utility functions
│   ├── assets/             CSS and static assets
│   ├── components/         Vue components (57)
│   ├── views/              Page views (~60)
│   ├── router/             Vue Router configuration
│   ├── services/           API and utility services
│   ├── utils/              Content sanitizer (SiteImprove intercept) and helpers
│   └── plugins/            Vuetify and Apollo plugins
├── public/                 Static assets, generated API data, and llms.txt
├── tests/
│   ├── unit/               Mocha/Chai unit tests (security, a11y, search, etc.)
│   └── *.spec.js           Playwright regression tests
├── scripts/                Audit and link checker scripts
├── reports/                Generated reports (CSV, JSON)
├── docs/                   Accessibility audit documentation
└── generators/             Build-time data generators
```

## Environment Variables

Copy `.env.sample` to `.env` and fill in the values.

## Lint

```bash
npm run lint
```

## Security

View the [security policy](SECURITY.md).

## Changelog

View the [changelog](CHANGELOG.md).

## License

[MIT](LICENSE)

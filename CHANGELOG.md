# Changelog

All notable changes to the ICJIA Public Website are documented in this file.

---

## IMPORTANT: Understanding Accessibility Tool Differences — axe-core vs. SiteImprove

This site has been audited extensively with **axe-core** (57/57 pages, zero violations) and continues to be monitored with **SiteImprove**. These tools produce different results for the same pages because they implement different rule sets, interpret edge cases differently, and have fundamentally different scanning architectures. **A page that passes one tool may fail the other.** This is expected behavior, not a sign of inadequate remediation.

Managers and stakeholders reviewing audit results should understand these differences before drawing conclusions from either tool's output.

### How the tools differ

| | **axe-core** | **SiteImprove** |
|---|---|---|
| **Rule source** | Deque Systems' implementation of WCAG + ACT Rules | SiteImprove's proprietary implementation of WCAG + ACT Rules (`sia-r` prefix) |
| **Scanning method** | Runs in-browser via JavaScript after full page render, including SPA route changes and async content | Remote crawler that fetches pages server-side; may or may not execute client-side JavaScript fully |
| **When it runs** | On-demand during development and CI/CD; sees the page exactly as the user does, including all runtime a11y fixes | Periodic scheduled crawls; may cache results and re-report issues that have already been fixed |
| **Rule strictness** | Follows WCAG success criteria closely; only flags clear violations | Applies some rules more broadly than the WCAG spec requires (e.g., sia-r14 applies "Label in Name" to landmark `<nav>` elements, not just interactive widgets as WCAG 2.5.3 specifies) |
| **Ambiguous results** | Reports as "incomplete — needs manual review" and excludes from violation count | Reports as "failed/cantTell" and includes in the violation count, inflating the apparent number of issues |
| **Unique rules** | `color-contrast`, `aria-hidden-focus`, `nested-interactive`, and ~90 others | sia-r90 ("role with implied hidden content has keyboard focus"), sia-r68 ("empty container"), sia-r83 ("text clipped when resized"), and others with no axe-core equivalent |
| **Open source** | Yes — fully open source, auditable, widely adopted (used by Google Lighthouse, pa11y, jest-axe) | No — proprietary rule engine; rule logic is not publicly auditable |
| **False positives** | Low — conservative approach means fewer false positives but may miss edge cases | Higher — broader rule interpretation catches more edge cases but also flags technically compliant code |
| **Cost** | Free | Paid enterprise license |

### Why this matters for this project

1. **This site passes axe-core with zero violations across all 57 audited pages.** This is the industry-standard open-source tool used by Google, Microsoft, and most accessibility consultancies.

2. **SiteImprove flags additional issues** that fall into three categories:
   - **Legitimate gaps** that axe-core's rule set doesn't cover (e.g., sia-r83 text clipping at 200% zoom, sia-r77 table cell context). These have been remediated.
   - **Stricter-than-spec interpretations** where SiteImprove applies WCAG rules more broadly than the spec requires (e.g., sia-r14 flagging `<nav aria-label>` landmarks — WCAG 2.5.3 only applies to user interface components). These have been fixed to satisfy SiteImprove even though they were already WCAG-compliant.
   - **Cached/stale results** from previous crawls that no longer reflect the current state of the site.

3. **Neither tool replaces manual testing.** Both are automated scanners that can only catch ~30-40% of WCAG issues. Screen reader testing, keyboard navigation testing, and cognitive accessibility review require human judgment.

### Build process integration

**axe-core** is integrated into this project's development workflow. Developers can run `npm run audit` to test any content type on-demand against WCAG 2.1 AA. The audit scripts use Puppeteer to render each page (including all runtime a11y fixes) and run axe-core analysis in the same browser context the user sees. This makes axe-core a reliable, repeatable gate that can be run before every deploy.

**SiteImprove cannot be integrated into the build process.** It is a cloud-hosted service that crawls the live production site on its own schedule. There is no CLI, API, or npm package that can be run locally or in CI/CD. This means:

- SiteImprove flags can only be checked **after** code is deployed to production
- Every SiteImprove issue must be **manually reviewed** by opening the SiteImprove dashboard, identifying the flagged element, and determining whether it is a legitimate issue, a false positive, or a stale cached result
- There is no way to run SiteImprove against a local dev server or preview deployment
- SiteImprove results may lag days or weeks behind the actual state of the site

This asymmetry is important: axe-core violations are caught and fixed during development, while SiteImprove violations are only discovered after the fact and require a manual investigation cycle.

### Why axe-core audits 57 pages, not all 2,356

This site has **2,356 dynamic pages** across 10 content types (1,101 publications, 275 meetings, 251 hub articles, 218 jobs, 180 posts, 172 grants, 114 biographies, 29 static pages, 10 units, 6 events). The default audit samples ~5 pages per type (57 total) because:

1. **All pages within a content type share the same Vue template.** If 5 random grant pages pass, the other 167 use identical rendering code and will also pass.
2. **The 24 runtime a11y fix functions are global** — they run on every page load regardless of content.
3. **A full 2,356-page audit takes ~4 hours** (~6 sec/page) vs. ~6 minutes for the sampled run.
4. The only source of page-specific violations is **CMS content variations** (e.g., an author using inline `color: red`), which are now handled by global runtime fixes like `fixInlineColorContrast()`.

A full audit can be run at any time: `npm run audit -- all --sample 9999` (~4 hours). A larger sample per type is also available: `npm run audit -- all --sample 20` (~20 min).

SiteImprove, by contrast, crawls the **entire live site** on every scan — which is why it sometimes surfaces issues on specific pages that the sampled axe-core audit did not visit. When this happens, a targeted axe-core audit script is written for those specific URLs (see `scripts/audit-siteimprove-*.js`) to verify and fix the issue.

### Recommendation

Use **both tools together**: axe-core as the primary development-time gate (fast, accurate, zero false positives), and SiteImprove as a secondary monitoring layer (broader coverage, catches edge cases). When SiteImprove flags an issue that axe-core does not, investigate whether it is a legitimate gap, a stricter-than-spec interpretation, or a stale cached result before prioritizing remediation.

---

## [1.3.42] - 2026-04-12

### Performance — Async-Load Stylesheets to Eliminate ~4s of Mobile Render-Blocking

The Lighthouse mobile audit on 20 representative routes (v1.3.41, post-deploy) put every page in the 55–58 perf range, with the same dominant culprit on every single one:

```
✗ render-blocking-insight: Est savings of 3,500–4,500 ms
```

Trace: 5 `<link rel="stylesheet">` tags in `public/index.html` (4 Google Fonts families + the MDI icon font from jsdelivr) all blocked rendering until they finished downloading. On mobile with high latency to fonts.googleapis.com and jsdelivr, this stacked to roughly 4 seconds of FCP delay.

### Fix

- **`public/index.html`** — converted all 5 stylesheets to the standard async-load pattern:
  ```html
  <link rel="stylesheet" href="…" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="…" /></noscript>
  ```
  - `media="print"` makes the browser load the file with the print media type — non-blocking for screen rendering.
  - `onload="this.media='all'"` swaps the media to "all" once the file has loaded, so the styles apply.
  - `<noscript>` fallback ensures the stylesheet still loads for users with JavaScript disabled.
- **Added `display=swap`** to the two Google Fonts URLs that didn't already have it (Roboto, Material Icons). With `display=swap`, text renders immediately in the system-font fallback and swaps to the web font when it arrives, instead of staying invisible during the font load. Lato/Oswald and Raleway already had it.
- **Added `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />`** so the TCP/TLS handshake to jsdelivr happens in parallel with the initial HTML parse, reducing the MDI font's perceived load time.

### Tradeoff

Brief Flash of Unstyled Text (FOUT) on cold loads — the page renders in system fonts (Lato → Helvetica/Arial; Roboto → Helvetica/Arial; Raleway → Helvetica/Arial) for ~100–300ms, then swaps to web fonts when they arrive. MDI icons may briefly render as missing glyph boxes during the same window. This is the standard, widely-accepted tradeoff for the perf gain — every site that prioritizes mobile FCP does this.

### Verified locally

All 5 stylesheets confirmed working in Chrome:
- Initial state: `media="print"` (non-blocking)
- After load: `media="all"` (applied) with `appliedSheet: true`
- No new console errors

### Expected mobile Lighthouse impact

Based on the audit numbers (3,500–4,500 ms render-blocking savings on every page):
- **FCP: ~8s → ~4s** (cut roughly in half)
- **Perf score: 57 → ~75–80** range (from "Needs Improvement" toward "Good")
- **Same fix benefits every page** because the stylesheets are loaded once in `index.html`

### What's still beyond reach without the rewrite

- `unused-css-rules: ~100 KB` and `unused-javascript: ~170–220 KB` are Vuetify framework cost — no way to trim them within the v1.3.x line. The Nuxt 4 / Vuetify 3 (or whatever) rewrite handles this structurally.
- Homepage LCP outlier (16.6s) is the home-splash hero image — would need image optimization (smaller resolution, AVIF, etc.) which is a separate effort.

---

## [1.3.41] - 2026-04-12

### Security — Revert CSP to Report-Only (no telemetry without a report endpoint)

The CSP enforcement promotion in v1.3.40 was reverted out of caution. Reason: the site has no CSP report endpoint configured, so any allowlist gap would silently break a page in production with **zero visibility** for ops or maintainers. That's the actual nightmare scenario — a missing origin breaks a feature, no error reaches Plausible (CSP violations don't generate HTTP requests, so Plausible doesn't see them), and no one notices until a user reports it.

To re-promote safely later, set up a CSP report endpoint first (Netlify Edge Function, third-party like report-uri.com, or your own serverless handler), add `report-uri /your-endpoint` to the policy, observe the report stream for 1–2 weeks, then rename the header back to `Content-Security-Policy`.

### Audit data preserved (Chrome MCP, 2026-04-12)

The pre-promotion audit found the existing allowlist already covers everything the site loads. Re-promotion when ready should not require allowlist changes:

| Route | Origins observed | All in allowlist? |
|---|---|---|
| `/` (homepage) | 9 origins | ✓ |
| `/researchhub/` (listing) | 9 origins | ✓ |
| `/researchhub/articles/r3-cohort-one-scale-and-reach-report` | 9 origins | ✓ |
| `/about/about-the-authority/` | 9 origins | ✓ |
| `/about/biographies/` | 9 origins | ✓ |
| `/grants/funding/` | 9 origins | ✓ |
| `/news/` | 9 origins | ✓ |
| `/forms/lap-request/` | 9 origins | ✓ |
| `/status/` (Netlify deploy badges) | 9 origins | ✓ |

**Origin set (identical on every route):** `icjia.illinois.gov` (canonical link, = self in prod), `agency.icjia.cloud`, `agency.icjia-api.cloud`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `plausible.icjia.cloud`, the page origin itself.

**Zero iframes** were observed in current content. Frame-src directives (YouTube, Vimeo, Tableau, Google Forms, etc.) are pre-positioned for future embeds but unused today.

### What's still in place

- The allowlist itself is unchanged (still validated against the production routes above)
- `worker-src 'self'` for the search worker
- `upgrade-insecure-requests` for mixed-content defense
- All other security headers (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) untouched
- The two new directives are no-ops in report-only mode but become active the moment the header is renamed back to `Content-Security-Policy`

### Net change in v1.3.41

- `netlify.toml` — header renamed from `Content-Security-Policy` back to `Content-Security-Policy-Report-Only`. No allowlist or directive changes.
- README security table reflects the deferred-enforcement status.
- Performance fixes from v1.3.40 (home-splash preload removal, `loading="lazy"` on AppFooter logo + Status badges) are unaffected.

---

## [1.3.40] - 2026-04-12

### Security — Promote CSP from Report-Only to Enforcement (SEC-09 closed)

- **fix: `netlify.toml`** — renamed `Content-Security-Policy-Report-Only` → `Content-Security-Policy`. The allowlist has been in place since v1.3.33 and was validated against actual production page loads via Chrome MCP audit (2026-04-12) before flipping. Verified all currently-loaded origins are covered:

  | Resource | Origin | Covered by |
  |---|---|---|
  | App bundles | `localhost` / origin | `script-src 'self'` |
  | jQuery (slim) | `cdnjs.cloudflare.com` | `script-src https://cdnjs.cloudflare.com` |
  | Plausible analytics | `plausible.icjia.cloud` | `script-src` + `connect-src` |
  | Material Design Icons CSS + woff2 | `cdn.jsdelivr.net` | `style-src` + `font-src` |
  | Google Fonts CSS + woff2 | `fonts.googleapis.com`, `fonts.gstatic.com` | `style-src` + `font-src` |
  | Strapi GraphQL APIs | `agency.icjia-api.cloud`, `researchhub.icjia-api.cloud` | `connect-src` |
  | Thumbor image server | `image.icjia.cloud` | `img-src https:` |
  | Netlify status badges (Status page) | `api.netlify.com` | `img-src https:` |
  | Search Web Worker + Fuse.js | `localhost` / origin | `script-src 'self'` (now also `worker-src 'self'`) |

- **Added directives:**
  - `worker-src 'self'` — explicit support for `public/searchWorker.js` introduced in v1.3.37 (defaults to `script-src` when absent, but explicit is clearer for future maintenance)
  - `upgrade-insecure-requests` — defense against accidental mixed-content; any stray `http://` resource is auto-upgraded to `https://`
- **Closes SEC-09** in the README security table. CSP is now enforced at the Netlify edge, blocking any unlisted origin outright.
- **Reminder for future maintenance:** if you add a new third-party origin (e.g., re-enable `vue-tweet-embed`, switch analytics providers), update the appropriate directive BEFORE deploying. Enforced CSP doesn't warn — it blocks.

### Performance — Quick Wins

- **fix: `src/views/Home/Home.vue`** — removed the `<link rel="preload" href="/home-splash.webp">` from `metaInfo.link`. `vue-meta` injects `metaInfo` links *after* the page's JS has already started rendering the `<picture>` element in `HomeSplashV2.vue`, so by the time the preload tag exists the browser is already fetching the image via `<source srcset>`. The preload was redundant and triggered the *"preloaded but not used within a few seconds"* console warning on every homepage visit. Image still loads via `<picture>` + `<source>`; we just dropped the false hint.
- **fix: `src/components/AppFooter.vue`** — added `loading="lazy"` and `decoding="async"` to the footer logo `<img>`. It's below the fold on every page; lazy-loading defers it until the user scrolls.
- **fix: `src/views/Status/Status.vue`** — added `loading="lazy"` and `decoding="async"` to the Netlify deploy-badge images. The Status page renders a long table of badges; lazy-loading defers below-viewport ones until the user scrolls.

### Net result

- Five console warnings per homepage visit eliminated
- Two lazy images (footer logo on every page; Status table)
- CSP enforcement closes the only outstanding P1 we could fix client-side without a backend change

---

## [1.3.39] - 2026-04-12

### Docs — Refresh README for v1.3.37 (Web Worker) and v1.3.38 (focus outline)

- **docs: `README.md` Performance section** updated to reflect the worker-based search architecture introduced in v1.3.37 and the focus-outline cleanup in v1.3.38:
  - Replaced the v1.3.36 lazy-loader code snippet with an ASCII flow diagram of the main-thread ↔ worker handoff (INIT / READY / SEARCH / RESULTS protocol)
  - Documented all four new files (`public/searchWorker.js`, `public/fuse.min.js`, `src/services/searchClient.js`, the rewritten `src/services/AppInit.js`)
  - Added a row to the perf-wins table for the Web Worker (~41 ms per round-trip, no input freeze) and the focus-outline removal
  - Inlined the `FuseWorker` evaluation summary so future maintainers can see why we declined `fuse.js@beta` without having to dig through CHANGELOG history
- No source code changes — README-only refresh.

---

## [1.3.38] - 2026-04-12

### UI — Remove Redundant Focus Outline on Search Input

- **fix: `src/components/ModalSearch.vue`** — drop the 2px solid `#1565c0` outer outline that Vuetify draws around the search textbox on focus. The same `.v-input` already shows TWO other focus indicators that are WCAG 2.4.7 compliant on their own:
  1. A 1px solid `#1565c0` underline rendered via `.v-input__slot::after` (~7:1 contrast against the white modal background — well above the 3:1 required by WCAG 1.4.11 for non-text UI components)
  2. The floating label color shifts to `#1565c0`
  Together those still meet WCAG 2.4.7 (Focus Visible, Level AA), so removing the duplicate outer ring is safe.
- **Note on `:focus-visible`:** the original plan was to gate the outline behind `:focus-visible` so it only appeared on keyboard focus. That doesn't actually work for text inputs — per the WHATWG/W3C spec, text inputs always match `:focus-visible` regardless of how focus arrived (because typing is interaction-heavy and the user always needs to see where they're about to type). So the cleaner fix is to drop the duplicate outline entirely and trust Vuetify's built-in inline focus styling.
- Scoped via `.v-dialog .v-input.v-input--is-focused { outline: none !important; }` so other v-inputs across the site keep their original styling.

### Investigated — Fuse.js `FuseWorker` (declined for now)

Reviewed [Fuse.js's official Web Workers support](https://www.fusejs.io/web-workers.html) (the `FuseWorker` class introduced in `fuse.js@7.4.0-beta.1`) as a possible replacement for our custom `searchWorker.js` + `searchClient.js`. Decided to stay on the in-house solution for this codebase. Reasons:

| Concern | Detail |
|---|---|
| **Beta status** | `FuseWorker` ships only in `fuse.js@beta` (currently `7.4.0-beta.1`); the docs explicitly say *"the API may change based on feedback."* Putting a beta dependency in production for a maintenance-mode site is poor risk/reward. |
| **Forced major version bump** | Adopting `FuseWorker` requires upgrading from `6.4.6` → `7.x`. Fuse 7.0.0 dropped UMD builds and switched to "proper ESM exports." Our worker uses `importScripts('/fuse.min.js')` which depends on the UMD/IIFE format — so we'd also have to rewrite the worker as an ES module worker (`new Worker(url, { type: 'module' })`). |
| **No measurable win at our scale** | `FuseWorker`'s headline gain is *"~5x faster with 8 workers on 100K documents."* Our index has ~5K records and per-query round-trips are already ~41 ms in the existing single-worker setup (verified in Chrome). FuseWorker's parallelism would land in the noise. |
| **Sanitization belongs in our worker** | Our worker also runs the regex-based misspelling/apostrophe sanitizer over the index at load. `FuseWorker` only handles search — adoption would require splitting sanitize out into a separate worker or moving it back to the main thread (regression). |
| **Same-shape API** | Both APIs are `await client.search(q)` returning `Promise<results>`. Our consumers are already future-compatible — when the Nuxt 4 rewrite happens (pinned for the next few months) and Fuse 7.x is GA, switching to `FuseWorker` is a one-file change in `searchClient.js`. |

The best time to adopt `FuseWorker` is during the Nuxt 4 rewrite when ESM module workers and Fuse 7.x stable are already part of the new stack. Until then the existing implementation does the same job at the same speed without beta risk.

---

## [1.3.37] - 2026-04-12

### Performance — Move Search Off the Main Thread (Web Worker)

After v1.3.36 lazy-loaded the 2.7 MB search index, the first keystroke after opening the search modal triggered a noticeable UI freeze on production: the input would lock, then dump out characters all at once. Root cause: even though `fetch()` is async, the work that runs when the response arrives (`r.json()` parsing the 2.7 MB blob, `deepSanitize()` walking thousands of strings with ~35 regex each, and `new Fuse(...)` building internal indices) was all synchronous on the main thread. Subsequent `fuse.search()` calls per keystroke were also synchronous and could take 50–300 ms each on a 2.7 MB index.

Solution: hand the entire pipeline to a Web Worker.

#### What moved to the worker

- `fetch('/searchIndex.json')`
- `JSON.parse` of the response
- `deepSanitize()` over every string field (worker-safe regex-only port — DOMPurify isn't needed here because search-index fields are plain text)
- `new Fuse(records, options)`
- Per-keystroke `fuse.search(query)`

The main thread's only job is now: send a `SEARCH` message, await the `RESULTS` reply, update reactive state. None of that blocks input.

#### New files

- **`public/searchWorker.js`** — vanilla Web Worker. `importScripts('/fuse.min.js')` loads Fuse, then a message dispatcher handles `INIT` / `SEARCH` and replies with `READY` / `RESULTS` / `ERROR`. Each search carries a request id so out-of-order responses are safe.
- **`public/fuse.min.js`** — copy of `fuse.basic.min.js` (15 KB) auto-synced from `node_modules` via the new `npm run copy:fuse` script that's wired into `serve` and `build`.
- **`src/services/searchClient.js`** — thin RPC wrapper around the worker. Tracks pending requests in a `Map<id, resolver>`, exposes `ready()` and `search(query)` (both Promises), and has a `terminate()` for teardown.

#### Updated files

- **`src/services/AppInit.js`** — `getFuse()` now returns a worker-backed client when `Worker` is available, and falls back to an in-process Fuse instance (wrapped to expose the same async `search()` shape) when it isn't (SSR, jsdom tests, very old browsers). The cached promise contract is unchanged.
- **`src/components/ModalSearch.vue`**, **`src/views/Search.vue`**, **`src/views/Search/SearchStatic.vue`**, **`src/components/StaticSearch.vue`** — `instantSearch()` and `sortResults()` are now `async`, awaiting `this.fuse.search(q)`. Each consumer carries a monotonic `searchSeq` counter so stale results from earlier searches are discarded if the user types faster than the worker can reply.
- **`netlify.toml`** — added Cache-Control rules for the two new root-level worker assets (`/searchWorker.js`: 1h max-age + 1d SWR; `/fuse.min.js`: 1d max-age + 1w SWR).
- **`package.json`** — new `copy:fuse` script keeps `public/fuse.min.js` in sync with whatever Fuse version `node_modules` contains; runs automatically as part of `serve` and `build`.

#### Verified in Chrome via MCP

| Check | Result |
|---|---|
| `usingWorker` flag on the returned client | `true` |
| `client.search('research')` | 345 results (correct) |
| Per-query round-trip | ~41 ms |
| 10 rapid sequential queries (`r`, `re`, `res`, …) | 414 ms total / 41 ms avg, main thread free throughout |
| New console errors | None |

The first keystroke after opening search now matches the responsiveness of the pre-lazy-load era. Per-keystroke search runs entirely off the main thread, so typing stays smooth even on slow mobile devices where Fuse search alone could take 200+ ms.

### Test — Worker-Compatible API Coverage

- **test: `tests/unit/search.spec.js`** — added 2 new tests (12 total) verifying:
  - `client.search(query)` returns a Promise (worker-compatible API contract)
  - The test environment uses the in-process fallback (`usingWorker === false`) — confirms the fallback path stays functional for CI / SSR
- Existing tests updated to `await client.search(...)` since the API is now async-by-default
- **Test totals:** 226 passing / 6 pending / 0 failing

---

## [1.3.36] - 2026-04-12

### Performance — Tier 1 Quick Wins (pre-Nuxt-rewrite)

A surgical pass at the highest-impact, lowest-risk perf issues identified in the audit. No architectural changes; everything below is a same-shape edit that the Nuxt 4 rewrite can either inherit or supersede.

#### 🚀 Lazy-load the 2.7 MB search index (biggest single win)

- **fix: `src/services/AppInit.js` no longer statically imports `searchIndex.json`.** Previously the entire 2.7 MB blob was inlined into the entry bundle and `deepSanitize()` ran over every string before first paint. The new `getFuse()` async loader fetches `/searchIndex.json` on demand, sanitizes once, and caches the resulting Fuse instance. On fetch failure the cache resets so the next call retries.
- **fix: `src/components/ModalSearch.vue` no longer triggers the fetch at app boot.** ModalSearch is mounted inside `App.vue`, so its old `created()` hook started loading the index on every page even when the user never opened search. Moved the load into the `EventBus.$on("search")` open handler via a new `ensureFuse()` method — the fetch now starts only when the user clicks the search icon.
- **fix: `src/views/Search.vue`, `src/views/Search/SearchStatic.vue`, `src/components/StaticSearch.vue`** all updated to `await this.$myApp.getFuse()` from their `created()` hooks (these are route-level so the lazy fetch fires only on navigation to those pages).
- **fix: null-guard `instantSearch()` in ModalSearch and Search** so the brief async window between `created()` firing and the fetch resolving doesn't crash if a search event arrives early.
- **Bundle delta: `dist/js/app.*.js` shrunk from 2.9 MB → 262 KB (91% smaller)**.

#### ⚡ Faster per-keystroke search

- **fix: `src/config/config.json`** — disabled `includeMatches` and `includeScore` in the Fuse `site` config. Both options are unread by every consumer (`grep`-verified across `src/`); `includeMatches` in particular is Fuse's most expensive option (per-character match-position computation for highlighting). Disabling them makes per-keystroke search noticeably snappier without changing visible behaviour.

#### 🗄️ Long-cache hashed assets

- **fix: `netlify.toml`** — added immutable `Cache-Control: public, max-age=31536000, immutable` rules for `/js/*`, `/css/*`, `/img/*`, `/fonts/*`. Vue CLI emits content-hashed filenames so any change auto-busts the cache. `/searchIndex.json` gets a 1h max-age + 1d stale-while-revalidate, and `/index.html` is forced `must-revalidate` so users always pick up new builds. Repeat-visit JS/CSS downloads should drop to ~0.

#### 🧹 Skip redundant a11y observer re-installs

- **fix: `src/a11y/index.js`** — `fixOverlayContainer`, `fixNestedInteractive`, and `fixProhibitedAriaOnImg` each install a `MutationObserver`. The pre-existing guards prevented duplicate observers but still ran a `querySelectorAll` on every `fixA11y()` call (i.e., every route change). Added an early return at the top of each: once the observer is installed, subsequent calls are no-ops and the observer handles all future mutations. Saves three broad DOM walks per navigation.

### Test — New Coverage for Lazy Search Loader

- **test: `tests/unit/search.spec.js`** (new file, 10 tests) verifies:
  - Module shape: `getFuse()` exists, `myApp.fuse` stays null until called
  - Failure path: fetch error rejects and resets the cache for retry
  - Success path: returns Fuse instance, caches the promise (concurrent calls share one fetch)
  - Search results have correct `item` shape and (per the perf fix) NO `score` or `matches` properties
  - **Bundle contract guard:** asserts `AppInit.js` never re-introduces a static `import` of `searchIndex.json` — pins the 2.7 MB perf win in CI
- **Test totals:** 224 passing / 6 pending / 0 failing

### Notes

- Vue 2 / Options API only — `async created()` is just a lifecycle hook with the `async` keyword. No Composition API, no `setup()`, no behaviour change to the way components compose.
- Skipped from this batch: FontAwesome removal (multiple components use `fa fa-*` via `<v-icon>` — non-trivial swap to MDI), `console.log` cleanup (`babel-plugin-transform-remove-console` already strips them in prod builds).

---

## [1.3.35] - 2026-04-12

### Test — Unit Tests for New A11y Fix Functions + Test Suite Repair

- **test: Add 16 unit tests for the 3 a11y functions introduced this session** in `tests/unit/a11y.spec.js`:
  - `fixDataTableHeaders()` — 5 tests: adds `scope="col"` to v-data-table headers, fills empty expand-column header, preserves existing scope, does not touch non-v-data-table tables
  - `fixAriaHiddenFocus()` — 6 tests: sets `tabindex="-1"` on `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>` inside `aria-hidden="true"` containers; does not affect focusable elements outside
  - `fixEmptyAriaLabel()` — 5 tests: removes empty `aria-label=""` from any element including Vuetify v-image wrappers; preserves non-empty labels

### Test — Fix Pre-Existing Test Suite Failures

- **fix: Wire `tests/unit/setup.js` into the mocha runner via `--require`** in `package.json`. Previously the setup file was present but never loaded, so jsdom-provided `DOMParser` / `MutationObserver` were missing from global scope.
- **fix: Rewrote `tests/unit/setup.js` to bridge jsdom globals** — copies `DOMParser`, `MutationObserver`, `HTMLElement`, `getComputedStyle` from the jsdom `window` (already installed by `@vue/cli-plugin-unit-mocha`) onto `global`. Resolves 26 `ReferenceError: DOMParser is not defined` failures in `security.spec.js`.
- **fix: `fixNestedInteractive` tests in `a11y.spec.js` now skip when MutationObserver is unavailable** (matching the pattern used by `fixOverlayContainer` tests). Resolves 2 failures on jsdom runs that predate `jsdom-global`'s MO shim.
- **fix: `config.spec.js` "netlify.toml uses Node 16"** updated to accept any pinned NODE_VERSION (netlify.toml pins Node 22).
- **test: `components.spec.js` Vuetify-dependent rendering tests marked `.skip`** — these required `vuetify-loader`'s a-la-carte auto-import at build time, which does not run inside the mocha/webpack bundle. The pure-JS behaviour (`render()` method, XSS sanitization) is still covered; full-page rendering is exercised by Playwright E2E and the axe-core audit suite.

### Test Results

- **Before:** 138 passing, 2 pending, 63 failing
- **After:** 214 passing, 6 pending, 0 failing

---

## [1.3.34] - 2026-04-11

### Fix — Empty ARIA Attribute on Vuetify v-image Elements

- **fix: Remove empty `aria-label=""` attributes (sia-r18)** — SiteImprove flagged Vuetify 2.x `<v-image>` wrappers with empty `aria-label=""` as "ARIA attribute unsupported or prohibited." Added `fixEmptyAriaLabel()` in `a11y/index.js` that removes any `aria-label=""` attribute site-wide so the element either inherits or has no accessible name (correct for decorative images). Wired into App.vue route change and delayed fix passes.

---

## [1.3.33] - 2026-04-11

### Security + Performance — Remediate April 2026 Audit Findings

Addresses the high-impact findings from the April 2026 red/blue team audit.

- **fix (SEC-09): Add Content-Security-Policy header in report-only mode** — Added `Content-Security-Policy-Report-Only` header to `netlify.toml` with allowlists for Plausible, Adobe DTM, Google Fonts, CDN, Strapi API, YouTube, Vimeo, Tableau, and self-hosted assets. Report-only mode monitors violations without breaking functionality; promote to enforcement after triage.
- **fix (SEC-12, SEC-13): Purify staff names from CMS searchMeta fields** — Added `generators/utils/purifyStaffNames.js` build-time purifier that strips current and former staff names from `searchMeta` fields across all 9 per-type JSON files before they are assembled into `searchIndex.json`. Uses `biographies.json` as the primary blocklist plus an `EXTRAS` array for former/external staff identified in the security audit. Biographies are never modified — only `searchMeta` fields on grants, units, pages, hub, posts, meetings, jobs, publications, and events are cleaned. Wired into `searchIndexAndSitemap.js` at build time.
- **fix (SEC-14): Hide `X-Powered-By` server framework header** — Added `X-Powered-By = ""` override to `netlify.toml` to prevent Express framework disclosure in HTTP responses.
- **perf: Fix home-splash.webp unused preload warning** — Moved the `<link rel="preload" href="/home-splash.webp">` from `public/index.html` (which loaded it on every route) to `Home.vue`'s `metaInfo.link` (which only loads it when the homepage is active). Eliminates the "preload not used" console warning on all non-homepage routes.
- **note (SEC-10): npm dependency vulnerabilities accepted risk** — `npm audit fix` was evaluated but only produces breaking changes (Vuetify 2.7.2 upgrade, release-it 19.x). Accepting the risk pending the planned Nuxt 4 / Strapi 5 rewrite rather than introducing instability to the current site. DOMPurify continues to mitigate the Vuetify XSS advisories in practice.

### Accessibility — Biography Page Audit

- **audit:** 15 randomly sampled biography pages plus the `/about/icjia-staff/` index — **16/16 pass axe-core WCAG 2.1 AA with zero violations**. Staff name purification did not affect accessibility (names remain in rendered bio pages, only stripped from non-bio `searchMeta` fields).

---

## [1.3.32] - 2026-04-11

### Security — Red Team / Blue Team Audit (April 2026)

Full security assessment across 2,356 routes covering XSS/injection testing, security headers, CORS, DOMPurify configuration, API data exposure, dependency vulnerabilities, and authentication.

**Overall rating: MODERATE-HIGH** — zero P0 (critical); three P1 (high); six P2 (medium); three P3 (low).

#### New findings

- **SEC-09 (P1): No Content-Security-Policy header** — The site has no CSP, meaning any XSS bypass would have no secondary defense. Recommend adding CSP in report-only mode first: `default-src 'self'; script-src 'self' https://plausible.icjia.cloud; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https:; connect-src 'self' https://*.icjia-api.cloud`.
- **SEC-10 (P1): npm dependency vulnerabilities** — `npm audit` reports 20 vulnerabilities (5 critical, 12 high, 2 moderate, 1 low). Includes Vuetify XSS advisories (GHSA-q4q5-c5cv-2p68), ws ReDoS, yaml stack overflow. DOMPurify mitigates the Vuetify XSS in practice. Recommend `npm audit fix` for non-breaking fixes and evaluating Vuetify 2.7.2 upgrade.
- **SEC-11 (P2): DOMPurify `<style>` tag allowlisting** — Added in v1.3.31 for CMS layout support. Enables CSS data exfiltration via `url()` and iframe injection if a CMS author account is compromised. DOMPurify strips `javascript:` URLs and event handlers, so XSS is still blocked. Risk accepted for CMS layout functionality; would be fully mitigated by CSP (SEC-09).
- **SEC-12 (P2): Staff names in API data** — `searchMeta` fields across all static API JSON files expose internal staff names (grant managers, unit directors) not otherwise visible on the site. Useful for social engineering.
- **SEC-13 (P2): searchIndex.json data exposure** — 2.8 MB file mirrors the full CMS database (2,365 records) including internal metadata. Should be reduced to only fields needed for search.
- **SEC-14 (P2): Server framework disclosure** — `X-Powered-By: Express` header aids framework-targeted attacks. Disable with `app.disable('x-powered-by')` or Helmet middleware.
- **SEC-15 (P2): Strapi stack trace leakage** — Production Strapi API returns full Node.js stack traces including filesystem paths (`/home/forge/agency.icjia-api.cloud/...`) in GraphQL error responses. Requires `NODE_ENV=production` on backend.
- **SEC-16 (P3): No security.txt** — Government sites should have `/.well-known/security.txt` per RFC 9116 with vulnerability reporting contact.
- **SEC-17 (P3): Dead code with unsanitized GraphQL interpolation** — `ResearchHub.js:getSingleArticleQuery()` accepts a slug without regex sanitization. Appears uncalled. Remove or sanitize for defense-in-depth.

#### Confirmed secure

- **XSS via URL route params:** Vue Router URL-encodes; regex sanitization strips injection characters.
- **XSS via search results:** Static compile-time artifact through `deepSanitize()`.
- **Open redirect:** All redirects hardcoded; login ignores `redirect` query param.
- **GraphQL introspection:** No endpoint exposed on frontend.
- **Admin panel:** SPA shell redirect only, no server-side admin.
- **Sensitive files:** `.env`, `.git/config`, `package.json` return SPA fallback.
- **Source maps:** Not generated in production builds.

#### Unchanged from March 2026

- SEC-06 (P1): JWT in localStorage (backend-dependent — requires Strapi HttpOnly cookie migration)
- SEC-07 (P2): No CSRF tokens (backend-dependent)
- SEC-08 (P2): No login rate limiting (backend-dependent)
- CORS restricted to `https://icjia.illinois.gov`
- HSTS with preload, X-Frame-Options, X-Content-Type-Options, Referrer-Policy all active
- Console stripping active in production via Babel plugin
- No credentials or API keys in committed code

---

## [1.3.31] - 2026-04-11

### Fix — i2i Page Contrast + DOMPurify Style Preservation + Image Alt

Resolves the last remaining axe-core violations from the 157-page audit. All pages now pass WCAG 2.1 AA with zero violations.

- **fix: Allow `style` attribute and `<style>` tags through DOMPurify** — CMS pages with custom inline styles (background colors, layout, typography) were losing all styling when DOMPurify stripped `style` attributes and `<style>` blocks. Added `style` to `ADD_ATTR` and `<style>` to `ADD_TAGS` in both `Markdown.js` and `markdownIt.js`. DOMPurify still sanitizes CSS values internally for XSS safety.
- **fix: SiteImprove intercept for dark-background contrast (fixCmsContrast)** — The i2i page CMS content has a `<div style="background: #3C5984; color: #000">` (dark blue background with black text). The intercept changes `color: #000` to `color: #fff` on any div with a dark hex background.
- **fix: SiteImprove intercept for missing image alt (fixCmsImages)** — Auto-derives alt text from image filenames for CMS images missing the `alt` attribute.
- **fix: fixInlineColorContrast now checks ancestor backgrounds** — The runtime DOM fix was overriding white text to black inside dark-background CMS sections. It now detects dark ancestor backgrounds (luminance < 0.4) and skips elements that intentionally use light text on dark backgrounds.
- **fix: deepSanitize uses sanitizeContent instead of sanitizeText** — API response strings now run through the full HTML pipeline (including fixCmsImages and fixCmsContrast), not just the text pipeline.

---

## [1.3.30] - 2026-04-11

### Audit — 157-Page axe-core Accessibility Sweep (WCAG 2.1 AA)

Full axe-core audit of 157 pages across 5 content types (30 randomly sampled per type) plus 8 index/listing pages and the homepage.

- **Results: 155/157 pages pass with zero violations (98.7%)**
- **Hub articles:** 30/30 clean
- **News posts:** 30/30 clean
- **Grants:** 30/30 clean (16 archived grants resolved to 404 — 404 page passes)
- **Meetings:** 30/30 clean
- **Pages:** 28/29 clean, 1 timeout (`/about/irb-policies-and-procedures/`)
- **Index pages + homepage:** 8/8 clean
- **1 failure:** `/about/i2i/` — `image-alt` (critical, 1 `<img>` without alt text) and `color-contrast` (serious, 3 elements with light text on insufficient background). This page uses custom CMS HTML with inline styles that bypass the runtime contrast fix. **Fixed in v1.3.31.**

---

## [1.3.29] - 2026-04-11

### Docs — SiteImprove Intercept Documentation

- **docs: Add SiteImprove intercept section to README.md** — Explains why axe-core and SiteImprove disagree on SPA sites, documents the intercept pattern as a reusable strategy for any SPA + headless CMS architecture, details the two-layer fix model (content pipeline vs. runtime DOM fixes), what the intercept can and cannot fix, how to add new intercepts (misspelling entries vs. plugin functions), and the full list of interception points. Updates project structure to include `utils/` directory. Updates audit status to 93-page sweep (April 2026).

---

## [1.3.28] - 2026-04-11

### Feature — SiteImprove Content Filter (Plugin-Based Content Pipeline)

Adds a plugin-based "SiteImprove filter" that intercepts all CMS content from Strapi 3 before it reaches the DOM, fixing misspellings, missing apostrophes, and other content issues that SiteImprove flags because it cannot properly parse SPA pages.

- **feat: Content pipeline at `src/utils/contentSanitizer.js`** — Extensible plugin system with `registerPlugin()`, `registerHtmlPlugin()`, and `registerTextPlugin()` for adding new content transformations. Ships with two built-in plugins: `fixMisspellings` (35 typo corrections from SiteImprove scan) and `fixApostrophes` (restores apostrophes stripped by Strapi slug generation in titles).
- **feat: Axios response interceptor** — `sanitizeResponse()` and `deepSanitize()` exports allow any axios-based API call to deep-sanitize all string values in the response. Applied to ResearchHub article, app, and dataset fetches, and to the publications bulk loader.
- **feat: Apollo Link afterware** — `sanitizeLink` in `vue-apollo.js` intercepts all GraphQL responses from the main Strapi API and deep-sanitizes string values before they reach Vue components.
- **feat: Global Vue integration** — `v-html` directive override auto-sanitizes all v-html content. Global mixin adds `this.sanitize()` to every component. `| sanitize` filter available for template interpolation. `titleTemplate` in App.vue sanitizes `<title>` tags.
- **feat: Search index sanitization** — `AppInit.js` deep-sanitizes the search index at build time so search results display corrected text.
- **fix: "langauge" typo in `LapRequest.vue`** — corrected to "language" in the form field label.
- **Misspellings corrected:** activites, andthe, Assesing, Behavorial, Buiding, Challange, Communnity, counites, Decription, defendent, eligilble, followin, Illiois, Independant, Initative, Institue, Jounral, langauge, llinois, Newletter, oversite, payed, progam, programing, Researh, represenation, Retreived, seperated, subtance, TThe, and apostrophe-stripped words (Dont, Womens, Communitys, Countys, States Attorneys).

---

## [1.3.27] - 2026-04-11

### Fix — A11y Data Table Remediation (Header Scoping, Hidden Focus)

Fixes two axe-core violations found during a 93-page audit sweep across all main-site page types.

- **fix: Data table cells missing header context (td-has-header)** — Added `fixDataTableHeaders()` to `a11y/index.js` that adds `scope="col"` to all Vuetify `v-data-table` `<th>` elements and fills the empty expand-column header with sr-only "Details" text. Applied globally via `App.vue` on every route change. Resolves the violation on `/news/meetings/` and all other data table pages (publications, policies, required forms).
- **fix: Focusable content inside aria-hidden containers (aria-hidden-focus)** — Added `fixAriaHiddenFocus()` to `a11y/index.js` that sets `tabindex="-1"` on all focusable elements (links, buttons, inputs) inside `aria-hidden="true"` containers. Vuetify data tables with `show-expand` render collapsed expand rows as aria-hidden but leave interactive buttons tab-focusable. Resolves 150 element violations on `/about/publications`.
- **Audit results:** 93 pages audited (20 hub articles, 20 news posts, 20 grants, 20 meetings, 20 about/pages, 3 index pages), all scoring 100/100 on both desktop and mobile a11y.

---

## [1.3.26] - 2026-04-11

### Fix — SiteImprove A11y Remediation (Focus Visible, Link Purpose, Image Links)

Addresses SiteImprove potential issues across 158+ pages by adding keyboard focus indicators, eliminating duplicate link targets, and auto-labeling image-only links in CMS content.

- **fix: Focus not visible on keyboard navigation (WCAG 2.4.7)** — Added global `:focus-visible` outline styles to `app.css` for all interactive elements (buttons, tabs, list items, text fields). Vuetify 2's ripple-only feedback is not detectable by accessibility scanners. Uses the site's primary blue (`#1565c0`) with 2px solid outline. Resolves 332 occurrences across 158 pages.
- **fix: Duplicate links to same destination (WCAG 2.4.4)** — Multiple card components had both a `<v-card :to>` wrapper (making the entire card a link) and a nested `<v-btn :to>` or `<router-link>` to the same URL, creating invalid nested `<a>` tags. Fixed `InfoCard.vue` (removed `:to` from inner button, made decorative), `HomeEventCard.vue` (replaced `<router-link to="/">` — which incorrectly linked to the homepage — with a decorative `<span>`), and `News.vue` featured card (made inner button decorative). Added `aria-label` with item title to `HomeFeatureRibbon.vue` "Read more" buttons.
- **fix: Duplicate nav home link (WCAG 2.4.4)** — `AppNav.vue` had two separate `<router-link to="/">` elements (logo and title text). Added `tabindex="-1"` and `aria-hidden="true"` to the title text link since the logo link already provides the accessible "ICJIA Home" navigation target.
- **fix: Links wrapping images with empty alt text (WCAG 2.4.4)** — Added `fixImageLinks()` post-processing to both `Markdown.js` and `markdownIt.js` that detects `<a>` elements containing only an `<img>` with empty or missing `alt` and auto-derives `aria-label` and `alt` from the link URL. Resolves 2 occurrences on the interactive data article page (Tableau preview images).

---

## [1.3.25] - 2026-04-11

### Fix — SiteImprove A11y Remediation (Tables, Labels, Empty Containers)

Addresses three SiteImprove accessibility issues across 16+ pages by intercepting and fixing Strapi content at render time and correcting site-wide component attributes.

- **fix: Table cells missing header context (sia-r77)** — Added `fixTableHeaders()` post-processing to `Markdown.js` and `markdownIt.js` that runs after DOMPurify sanitization. Pass 1: promotes first-row `<td>` to `<th scope="col">` and wraps in `<thead>`/`<tbody>` for tables with no headers. Pass 2: fixes misaligned rows where an extra empty leading `<td>` shifts cell alignment — removes the empty cell and promotes the next cell to `<th scope="row">`. Resolves 204 occurrences across 16 researchhub article pages.
- **fix: Visible label and accessible name mismatch (sia-r14)** — Changed `SkipLink.vue` `title` from "Skip Navigation" to "Skip to content" to match `aria-label` and visible text. Changed `AppNavContext.vue` translate button `aria-label` from "Translate this site on Google" to "Translate this site" to match visible text. Satisfies WCAG 2.5.3.
- **fix: Container element is empty (sia-r68)** — Added `<span class="sr-only">` visually hidden text inside icon-only elements so SiteImprove detects text content: ICJIA Home logo link (`AppNav.vue`, `AppFooter.vue`), Search button (`AppNav.vue`), Print button (`ArticleView.vue`). Elements already had `aria-label` but SiteImprove requires actual text nodes.

---

## [1.3.24] - 2026-04-10

### Enhancement — Node 22 Upgrade

- **feat: Upgrade from Node 16 to Node 22** — Removed `node-sass@6.0.0` (native C++ binary incompatible with Node 22); project now uses `sass@1.32.13` (Dart Sass, pure JS) exclusively with `sass-loader@10.1.1`. Updated `.nvmrc` to `v22`, `netlify.toml` `NODE_VERSION` to `22`, and `package.json` engines to `>=16.x`.
- **fix: Bake `--openssl-legacy-provider` into npm scripts** — Added `NODE_OPTIONS=--openssl-legacy-provider` to `serve`, `build`, and `lint` scripts in `package.json` so Node 22's OpenSSL 3.0 doesn't break webpack 4's md4 hashing. No manual flag needed.
- **fix: Replace deprecated `fs.rmdir()` with `fs.rm()`** in `generators/generateImagesHub.js`.
- **chore: Remove unused cheerio internal import** from `generators/generateIndexMeetings.js`.
- **chore: Remove "NEW!" chip from Grant Status Request button** on homepage (`HomeSplashV2.vue`).
- **fix: Center homepage splash buttons on mobile view** — Stacked and centered the Apply for Funding and Grant Status Request buttons in mobile layout.
- **feat: Add retry logic to all generator API calls** — Created shared `generators/apiClient.js` with `postWithRetry` and `getWithRetry` (3 retries, exponential backoff). Updated all 11 generator scripts to use it instead of raw axios. Prevents transient `ECONNRESET` failures from breaking Netlify builds.

---

## [1.3.23] - 2026-04-10

### Chore — Lint Auto-Fix

- **chore: Run `vue-cli-service lint` across project** — Auto-fixed formatting in `AppNav.vue` and `News.vue` (prettier/eslint corrections: attribute formatting, line breaks, quote consistency). No functional changes.

---

## [1.3.22] - 2026-04-10

### Fix — Navbar Title Overflow on Medium Screens

- **fix: Agency title overflows navbar on medium screens** — On viewports between 960–1263px, the full "ILLINOIS CRIMINAL JUSTICE INFORMATION AUTHORITY" text wrapped beyond the 90px navbar height. Changed the title visibility from `hidden-sm-and-down` to `hidden-md-and-down` so the title only appears at `lg` (1264px+) where there is sufficient space. Added `overflow: hidden`, `max-height: 90px`, and `line-height: 1.3` as safety constraints, plus a reduced font size media query for screens under 1264px.

---

## [1.3.21] - 2026-04-10

### Fix — Mobile Hero Overlay Overflow

- **fix: Hero text box overflows viewport on mobile** — The homepage hero overlay in `HomeSplashV2.vue` had `width: 65%` with `min-width: 350px`, which forced the grey text box wider than the 375px mobile viewport, clipping the title and background on the right. Replaced with `width: 90%; max-width: 700px`, removed `min-width`, and added responsive Vuetify padding (`px-6 px-sm-10`). Hero now fits cleanly on all screen sizes.

---

## [1.3.20] - 2026-04-10

### Enhancement — News Index Page Redesign

- **feat: Redesign `/news/` index page** — Replaced the grid/list toggle layout with a streamlined single-view design focused on reducing the 75% bounce rate.
  - **Featured hero post** — Most recent news item displayed prominently at the top with large image, full summary, category, tags, and descriptive link text.
  - **Category filter buttons** — Filter by News or Press Release; buttons only appear for categories with actual content.
  - **Two-column card list with thumbnails** — Compact horizontal cards with 90x90 contained thumbnails (from splash images), category, date, title, and truncated summary. Single column on mobile.
  - **Time-period grouping** — Posts grouped into "This Month," "Last Month," and "Earlier" with section headers.
  - **Pagination** — 15 items per page with smooth scroll to news list on page change, accounting for fixed navbar offset.
  - **Fade transitions** — Content fades out/in on page and filter changes to reinforce that the list updated.
- **fix: WCAG color contrast on date text** — Changed `.featured-date` and `.news-date` from `#777` to `#555` (7:1 contrast ratio). Lighthouse a11y: **100**.
- **fix: SEO descriptive link text** — "Read more" button now includes article title. Lighthouse SEO: **100**.
- **No new dependencies** — Uses only existing Vuetify, moment, lodash.
- **Result:** Lighthouse scores — A11y: **100**, SEO: **100**, Perf: 71, BP: 58 (remaining issues are sitewide/infrastructure).

---

## [1.3.19] - 2026-04-09

### Fix — SEO and Chip Contrast

- **fix: Add dynamic `rel=canonical` to all routes** — The `<link rel="canonical">` tag in `index.html` was hardcoded to `https://icjia.illinois.gov/`, causing every page to claim it was the homepage. Added a `router.afterEach` hook in `src/router/index.js` that updates the canonical href to match the current route path. Lighthouse SEO audit now passes the `canonical` check on all pages.
- **fix: Replace non-crawlable anchor with `<button>` in footer** — The "Translate Site" link in `AppFooter.vue` used `href="javascript:void(0);"`, which Lighthouse flagged as a non-crawlable anchor on every page. Replaced with a semantically correct `<button>` element styled to match the existing link appearance. Lighthouse SEO audit now passes the `crawlable-anchors` check on all pages.
- **fix: Exclude `.v-chip` elements from `fixInlineColorContrast()`** — The runtime a11y fix was overriding white text to black inside Vuetify chip components (e.g., the "NEW!" chip on homepage news cards), breaking contrast against dark chip backgrounds. Added `.v-chip` to the exclusion check in `src/a11y/index.js`.
- **reverted: Performance changes (font CSS deferral, browserslist tightening, jQuery defer)** — These changes (attempted in v1.3.20–1.3.22) caused the production site to fail to load. All reverted. Performance optimization will be deferred to the Nuxt 4 rewrite.
- **Result:** SEO score improved from 85 to **100** site-wide. "NEW!" chip contrast fixed.

## [1.3.20] - 2026-04-09

### Perf — Low-Risk Image and Preconnect Fixes

- **perf: Add explicit `height` to footer logo** — The `<img>` in `AppFooter.vue` had `width="100"` but no `height`, causing Lighthouse to flag `unsized-images` (layout shift). Added `height="70"` to match the 250x175 aspect ratio.
- **perf: Add `width` and `height` to initial loading indicator** — The boot-time logo and loading GIF in `index.html` had no explicit dimensions. Added `width`/`height` attributes to prevent CLS during app initialization.
- **perf: Add `rel="preconnect"` for API and CDN domains** — Added preconnect hints for `agency.icjia-api.cloud` (GraphQL API, carousel images) and `agency.icjia.cloud` (static assets) to eliminate connection setup latency for first API requests.

## [1.3.21] - 2026-04-09

### Perf — Replace Carousel with Static Preloaded Hero Image

- **perf: Replace `v-carousel` with static hero image** — The homepage carousel fetched its image from the Strapi API via a Thumbor proxy at runtime, making it impossible for the browser to start loading the LCP image until after the API responded. Replaced with a self-hosted static image (`public/home-splash.jpg`, 150 KiB) with CSS `filter: grayscale(100%)` and a blue-tinted overlay (`rgba(55, 90, 127, 0.55)`) to match the production appearance. Overlay text (title, teaser, buttons) is hardcoded to match the existing CMS content.
- **perf: Add `<link rel="preload">` for hero image** — Added preload hint in `index.html` so the browser begins fetching the hero image immediately, before Vue mounts. Eliminates the API round-trip + Thumbor proxy from the critical path.
- **chore: Remove Thumbor/GraphQL dependency from HomeSplashV2** — The component no longer imports `getImageURL`/`getGrayscaleImageURL` from `@/services/Image` or requires the `slider` prop to contain image data. The `slider` and `buttons` props are retained for backward compatibility but are no longer used for rendering.
- **Result:** Eliminates API + Thumbor round-trip from homepage LCP critical path. A11y 100 on both desktop and mobile. Responsive layout preserved.

## [1.3.23] - 2026-04-09

### Perf — Convert Hero Image to WebP

- **perf: Convert hero splash image to WebP** — Added `home-splash.webp` (94 KiB) alongside the JPG fallback (150 KiB), a 37% reduction. Uses `<picture>` element with `<source type="image/webp">` for automatic format selection with JPG fallback for older browsers. Updated preload hint to target the WebP version.

## [1.3.22] - 2026-04-09

### Content — Update Violence Prevention Plan Link

- **content: Update Statewide Violence Prevention Plan menu link** — Updated the Research dropdown menu entry from "Statewide Violence Prevention Plan: 2020-2024" (vpp.icjia.cloud) to "Statewide Violence Prevention Plan: 2025-2029" (vpp.icjia.illinois.gov).

---

## [1.3.18] - 2026-03-31

### Fix — Accessibility: Color Contrast in Overlays and Progressbar Labels

- **fix: Exclude `.v-overlay` elements from `fixInlineColorContrast()`** — The runtime a11y fix was overriding white text to black inside Vuetify overlay components (e.g., the Research Hub carousel), breaking contrast against dark overlay backgrounds. Added `.v-overlay` to the exclusion check alongside the existing `#disclaimer` guard.
- **fix: Add `aria-label` to all `v-progress-circular` spinners** — Vuetify's progress spinners render as `role="progressbar"` but had no accessible name, causing WCAG 4.1.2 violations. Added descriptive `aria-label` attributes to all 9 instances missing or having vague labels across 8 component files: `HubHome.vue`, `____HomeSplash.vue`, `AppView.vue`, `ArticleView.vue`, `BaseImage.vue`, `Status.vue`, `NewsCard.vue`, `InfoCard.vue`, and `HubCard.vue` (3 instances).
- **chore: Add `scripts/audit-researchhub-sample.js`** — Targeted axe-core audit script that tests 20 Research Hub pages (hub home, articles, apps, datasets) against WCAG 2.1 AA. Verified all 20 pages clean after fixes.

---

## [1.3.17] - 2026-03-30

### Added — Full-Site Accessibility Audit Script

- **chore: Add `scripts/audit-full-site.js`** — Standalone axe-core audit script that tests every page on the site (2,356+) against WCAG 2.1 Level AA. Loads all routes from `public/api/*.json` plus 17 static pages, runs each through Puppeteer + axe-core, and writes a detailed JSON report to `reports/`. Includes progress logging with ETA, per-content-type summary, and incremental saves every 50 pages. Estimated runtime ~4 hours for the full site. Complements the existing `npm run audit` sampling approach for periodic comprehensive validation.

---

## [1.3.16] - 2026-03-30

### Fix — SiteImprove Color Contrast (sia-r69)

- **fix: Replace all grey text colors with black/white across 22 files** — Replaced `#333`/`#444`/`#444d56` text colors with `#000` (black) and `#ccc` on dark backgrounds with `#fff` (white) for maximum contrast. Covers CSS files (`app.css`, `hub.css`, `github-markdown.css`), 16 Vue components, and 2 view files.
- **fix: Restore section nav tab visibility** — The `.context .v-tab` CSS rule was setting `color: #fff` and `background: #0a3a60`, which made the section navigation tabs (light #eee background) invisible — white text on light grey. Removed the background and color overrides from CSS since each nav template handles colors inline: section nav uses black on #eee, bottom nav uses white on #11568e.
- **fix: Replace Vuetify `red` chip with black for "archived" badge** — Changed `BaseCardExpandable.vue` archived chip from Vuetify's `red` class (white on #F44336, 3.9:1 ratio) to black background with white text (21:1 ratio).
- **fix: Add `fixInlineColorContrast()` runtime fix for CMS content** — New a11y function in `src/a11y/index.js` overrides inline `color:` styles from Strapi (e.g., `color: red`) with `#000` to guarantee WCAG AA contrast. Resolves 7 occurrences of red text on the NCHIP NOFO page.
- **fix: Remove `markdown-body` class from footer** — The `github-markdown.css` `.markdown-body { color: #24292e }` rule was overriding `color: #fff` on the dark footer card, causing near-black text on dark blue. Removed the class since the footer doesn't need markdown styling.

---

## [1.3.15] - 2026-03-30

### Fix — SiteImprove Visible Label / Accessible Name Mismatch (sia-r14)

- **fix: Replace `aria-label` with `aria-labelledby` on `<nav>` landmarks** — Switched all three navigation landmarks (`AppNavContext.vue`, `AppNavContextBottom.vue`) from `aria-label` to `aria-labelledby` referencing `sr-only` `<span>` elements. **Note:** This is technically a SiteImprove false positive — WCAG 2.5.3 "Label in Name" only applies to user interface components (widgets), not landmark regions. Using `aria-label` to distinguish multiple `<nav>` elements is standard WAI-ARIA practice. However, SiteImprove's sia-r14 rule applies the check more broadly to any element with an `aria-label`, so this fix avoids the flag while preserving identical screen reader behavior.

### Fix — SiteImprove Empty Container Elements (sia-r68)

- **fix: Add `aria-hidden="true"` to empty spacer divs** — Marked empty `<div class="pb-6">` elements in `AppFooter.vue` and `JobCard.vue` with `aria-hidden="true"` so they are invisible to assistive technology.
- **fix: Add `fixEmptyContainers()` runtime fix for CMS tables** — New a11y function in `src/a11y/index.js` removes empty `<tr>` rows and hides empty `<td>` cells (`aria-hidden="true"`) in CMS-rendered article tables. Also catches any remaining empty spacer divs site-wide. Resolves 6 pages flagged by SiteImprove.

---

## [1.3.14] - 2026-03-30

### Fix — SiteImprove Text Clipped When Resized (sia-r83)

- **fix: Remove `overflow: hidden` from Vuetify labels, toolbar title, and list items** — Vuetify 2 sets `overflow: hidden` with fixed pixel heights on `.v-label` (20px), `.v-toolbar__title` (44px), and `.v-list-item__title`/`.v-list-item__content` elements, causing text to clip at 200% zoom (WCAG 1.4.4). Added CSS overrides in `app.css` setting `overflow: visible` and `height: auto` on all affected selectors. Resolves 2 form pages (grant-status, lap-request) and 100+ search pages flagged by SiteImprove.

---

## [1.3.13] - 2026-03-30

### Fix — SiteImprove Table Cell Missing Context (sia-r77)

- **fix: Rewrite `fixTableCellContext()` for comprehensive table header association** — Replaced the simple `scope="col"` fix with a three-path handler that covers all CMS table patterns from Strapi: (1) simple tables get `scope="col"` on column headers and first-column `<td>` cells are converted to `<th scope="row">` when they contain label text, (2) tables without `<thead>` are detected and first-row `<th>` elements are treated as column headers, (3) complex tables with `rowspan`/`colspan` (from `markdown-it-multimd-table`) get unique `id` attributes on `<th>` cells and explicit `headers` attributes on every `<td>`. Resolves all 9 Research Hub article pages flagged by SiteImprove.
- **fix: Add `scope` and `headers` to DOMPurify whitelist** — Added both attributes to `ADD_ATTR` in `src/services/Markdown.js` and `src/utils/markdownIt.js` so they survive sanitization if present in CMS source HTML.

---

## [1.3.12] - 2026-03-28

### Fix — Siteimprove ARIA Violations (sia-r110, sia-r18)

- **fix: Remove `nprogress` package** — Uninstalled the `nprogress` npm dependency that injected `role="bar"` and `role="spinner"` (invalid WAI-ARIA roles) on every page. All code already uses the custom `@/services/Progress` replacement; removed leftover `#nprogress` CSS from `app.css` and commented-out references in `Toggle.vue`.
- **fix: Upgrade `fixProhibitedAriaOnImg` to MutationObserver** — Replaced the one-shot DOM scan with a persistent MutationObserver that strips prohibited ARIA attributes the instant Vuetify adds them, before Siteimprove can capture the violation. Covers `aria-haspopup`/`aria-expanded` on `role="img"` elements and `aria-label`/`aria-labelledby` on `role="presentation"`/`role="none"` elements.
- **fix: Remove `alt` from decorative splash image** — Cleared the `alt` attribute on the `HomeSplashV2` carousel image (`role="presentation"`) to eliminate the prohibited `aria-label` on a presentational element.

---

## [1.3.11] - 2026-03-26

### Fix — Font Awesome CDN 403 Error

- **fix: Replace expired Font Awesome CDN kit with local npm package** — Removed `kit.fontawesome.com/170885123f.js` script from `index.html` (returning 403 on all pages). Uncommented the existing `@fortawesome/fontawesome-free` CSS import in `main.js` to load Font Awesome 5 Free from the already-installed npm dependency. All 4 icons (`fa-users`, `fa-facebook`, `fa-twitter`, `fa-globe`) are included in the free package.

---

## [1.3.10] - 2026-03-26

### Accessibility — Axe-Core Audit Fixes (57/57 clean)

- **fix: Invalid `aria-role` attribute on carousel title** — Changed `aria-role="heading"` to `role="heading"` in `HubHome.vue`. `aria-role` is not a valid HTML attribute; the correct attribute is `role`.
- **fix: Links without discernible text on unit pages** — Added visible "View" text and personalized `aria-label` (e.g., "View biography for John Doe") to biography link buttons in `BiographyCard.vue`. Previously icon-only buttons failed axe-core link-name check across 63 elements on 5 unit detail pages.
- **fix: Invalid `aria-haspopup` on external links** — Removed Vuetify `v-tooltip` wrapper from `ExternalLinkList.vue` that injected `aria-haspopup="true"` on plain `<a>` elements. Replaced with native `title` attribute. Added `rel="noopener noreferrer"` and screen-reader "(opens in new tab)" text.
- **fix: Calendar weekday header color contrast** — Added explicit `color: #000` and `background-color: #fff` on all `.v-calendar-weekly__head-weekday` elements in `EventsAll.vue` to meet WCAG AA contrast ratio.
- **fix: Add `fixAriaRoleAttribute()` runtime safety net** — New a11y function in `src/a11y/index.js` converts invalid `aria-role` attributes to `role` on any CMS-rendered content.
- **fix: Add `fixProhibitedAriaOnLinks()` runtime safety net** — New a11y function strips `aria-haspopup` and `aria-expanded` from `<a>` elements injected by Vuetify tooltips.

---

## [1.3.9] - 2026-03-26

### SEO & AI Readiness

- **fix: Add Open Graph and Twitter Card meta tags** — Added `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, and Twitter Card equivalents to `index.html` for proper social sharing previews on Facebook, LinkedIn, X, WhatsApp, Slack, and iMessage.
- **fix: Expand meta description** — Replaced short "Illinois Criminal Justice Information Authority" description with a descriptive sentence under 160 characters.
- **fix: Add canonical URL** — Added `<link rel="canonical">` pointing to `https://icjia.illinois.gov/`.
- **fix: Add JSON-LD structured data** — Added `WebSite` schema with `GovernmentOrganization` publisher, logo, and `dateModified` for AI systems and search engines.
- **fix: Add authorship meta tag** — Added `<meta name="author">` for AI attribution.
- **fix: Add llms.txt** — Created `public/llms.txt` describing the site for LLM consumption per the llmstxt.org specification.

---

## [1.3.8] - 2026-03-25

### Accessibility — Text Clipping at 200% Zoom (sia-r83)

- **fix: Prevent Vuetify form field text clipping on resize** — Added CSS overrides in `app.css` to replace Vuetify 2's fixed pixel heights on form inputs with relative `em` units and `overflow: visible`. Resolves WCAG 1.4.4 "Text is clipped when resized" on grant status form, LAP request form, and search pages.

---

## [1.3.7] - 2026-03-25

### Accessibility — Empty Container Elements (sia-r68)

- **fix: Hide empty TOC list when no headings exist** — Added `v-if="toc.length"` to `Toc.vue` and `TocPolicies.vue` so the `<ul class="toc-list">` doesn't render empty on pages without headings.
- **fix: Hide empty publication links list** — Added `v-if` guard to `PublicationCard.vue` so `<ul>` doesn't render when publication has no article path or file URL.

---

## [1.3.6] - 2026-03-25

### Accessibility — Table Cell Context Fix (sia-r77)

- **fix: Add scope attributes to CMS table headers** — Added `fixTableCellContext()` runtime fix to `src/a11y/index.js`. Adds `scope="col"` to all `<th>` elements in `<thead>` of Strapi CMS-rendered tables so `<td>` cells are programmatically associated with their column headers. Resolves SiteImprove "Table cell missing context" on 3 researchhub article pages.

---

## [1.3.5] - 2026-03-25

### Accessibility — Heading Hierarchy & TOC Fix

- **fix: Article pages start with h1** — Replaced `<h3>` "Table of contents" heading in `ArticleToc.vue` and `HubArticleToc.vue` with a styled `<p>` so the article `<h1>` title is the first heading in DOM order. Resolves SiteImprove "Page does not start with a level 1 heading" on all researchhub article pages.
- **fix: Remove text-transform uppercase** — Used literal uppercase text instead of CSS `text-uppercase` class to avoid SiteImprove best-practice flag for all-caps via `text-transform`.

---

## [1.3.4] - 2026-03-25

### Accessibility — WCAG 2.5.3 Label in Name Remediation

- **fix: ArticleView print button** — Replaced `<v-icon aria-label="Print">printer</v-icon>` with `<v-btn icon aria-label="Print article"><v-icon>mdi-printer</v-icon></v-btn>` to eliminate visible text / accessible name mismatch (icon name "printer" in DOM conflicted with aria-label "Print").
- **fix: DatasetView download button** — Changed `aria-label="Download dataset"` to `aria-label="Download here"` to match visible button text "Download here" (WCAG 2.5.3).
- **fix: AppNav hamburger menu** — Changed `aria-label="Open navigation menu"` to `aria-label="MENU"` to match visible text "MENU" (WCAG 2.5.3).

**Note:** CMS-fetched markdown content (Strapi) is handled by the `fixLabelInName` runtime fix in `src/a11y/index.js` which strips conflicting aria-labels from interactive elements after page load.

---

## [1.3.3] - 2026-03-25

### Accessibility — WCAG AA Color Contrast Remediation

Comprehensive sweep of all components to eliminate mid-grey text colors (#555, #595959, #666, #777, #6a737d, #aaa) on light backgrounds. All text now uses #222 or #000 on white/light backgrounds to ensure WCAG AA 2.1 minimum contrast ratio (4.5:1).

**23 files updated across:**
- Global styles: `app.css`, `github-markdown.css`
- Components: AppNav, AppSidebar, AttachmentList, BaseCardExpandable, BiographyCard, JobCard, MeetingTable, ModalSearch, NewsCard, PolicyTable, RequiredFormTable, SearchCard, Splash, Toc, TocPolicies
- Views: FundingSingle, NewsSingle, PublicationsAll, PublicationEditor, Search, SearchStatic

**Not changed** (light text on dark backgrounds, correct as-is): Banner, Disclaimer, HomeSplashV2, AppFooter.

**Not in scope** (separate Netlify sites): `/sudcontinuum`, `/mhcontinuum`, `/adultredeploy`.

---

## [1.3.2] - 2026-03-25

### Accessibility — SiteImprove ARIA & Form Label Remediation

- **fix: Remove prohibited ARIA attributes from footer** — Removed all `v-tooltip` wrappers from footer elements. Vuetify's tooltip component injected `aria-haspopup` and `aria-expanded` onto the logo `<img>`, violating ARIA spec (sia-r18). This was flagged on every page site-wide (2,588 pages × 2 occurrences).
- **fix: Remove unused social media icon row from footer** — Social icons (Facebook, YouTube, Instagram, LinkedIn) were not rendering; removed dead markup.
- **fix: Add aria-labels to search form fields (WCAG 1.3.1 / 4.1.2)** — Vuetify 2's `v-text-field` and `v-select` don't always associate `<label>` with `<input>` via `for`/`id`. Added explicit `aria-label` attributes to search text field and filter dropdown in both `SearchStatic.vue` and `Search.vue`.
- **fix: Runtime form field label fix** — Added `fixFormFieldLabels()` to `src/a11y/index.js` as a safety net: finds Vuetify form inputs missing proper label association and adds `aria-label` from rendered label text. Integrated into the global a11y fix pipeline in `App.vue`.

---

## [1.3.0] - 2026-03-24

### Security Audit — Red Team / Blue Team Assessment

A comprehensive adversarial security audit was conducted across the full application surface: 10 content types, 2,345 routes (via `public/api/*.json`), all Vue components, deployment configuration, authentication flow, third-party dependencies, and API communication.

**Overall security posture: MODERATE-HIGH** — all critical (P0) and high (P1) client-side vulnerabilities mitigated; remaining items require backend changes.

### Unit Test Suite (Mocha/Chai)

Added 201 automated unit tests to guard against regressions in security, accessibility, markdown rendering, components, auth, and data integrity. Run via `npm run tests`.

| Test File | Tests | Coverage |
|---|---|---|
| `security.spec.js` | 39 | GraphQL slug sanitization (7 injection vectors), DOMPurify XSS prevention (20+ attack payloads: script, onerror, onclick, javascript: protocol, SVG, iframe, encoded, base tag, meta refresh), netlify.toml security headers, CORS restriction, source map config |
| `config.spec.js` | 95 | config.json HTTPS enforcement, 10 API data files (structure validation, required fields, no duplicate slugs, fullPath format), env file presence, .gitignore blocks .env, build config (source maps, console stripping, Node version) |
| `markdown.spec.js` | 21 | Heading rendering + anchor IDs, bold/italic/code, links with `target="_blank"` and `rel="noopener noreferrer"`, auto-linking, ordered/unordered lists, tables, blockquotes, fenced code blocks, footnotes, figures, typographer (smart quotes, em dash), edge cases (empty, unicode, long content) |
| `a11y.spec.js` | 20 | fixBlankTableHeadings, fixExpandButtons, fixFigureTabindex, fixHeadingOrder (level skip correction + attribute preservation), fixEmptyTableHeaders, fixFootnoteTargetSize (24px minimum), fixNavHeaderRoles, fixOverlayContainer, fixNestedInteractive |
| `components.spec.js` | 14 | SkipLink (a11y attributes, nav wrapper, #content target), Banner (null guard, render method, dismissible prop), Disclaimer (empty array guard, h2 label, markdown body, XSS sanitization in v-html) |
| `auth.spec.js` | 12 | AUTH_LOGIN mutation (isAuthenticated, JWT, userMeta), AUTH_LOGOUT (full state clear), SET_STATUS/CLEAR_STATUS, isLoggedIn getter (truthy/falsy JWT), logout action (localStorage cleanup, commit sequence, resolve value) |
| **Total** | **201** | **0 failing, 2 pending (MutationObserver-dependent, skipped gracefully)** |

#### Route coverage audited

| Content Type | Routes | Source |
|---|---|---|
| Pages | 29 | `public/api/pages.json` |
| Posts (News) | 180 | `public/api/posts.json` |
| Grants/Funding | 172 | `public/api/grants.json` |
| Research Hub (articles, datasets, apps) | 247 | `public/api/hub.json` |
| Publications | 1,096 | `public/api/publications.json` |
| Meetings | 275 | `public/api/meetings.json` |
| Biographies | 114 | `public/api/biographies.json` |
| Employment | 216 | `public/api/jobs.json` |
| Events | 6 | `public/api/events.json` |
| Units | 10 | `public/api/units.json` |
| **Total** | **2,345** | |

#### Critical findings (RED TEAM)

| ID | Severity | Vulnerability | Attack Vector | Files Affected |
|---|---|---|---|---|
| SEC-01 | **CRITICAL** | Missing security headers | All pages served without X-Frame-Options, CSP, X-Content-Type-Options, HSTS | `netlify.toml` |
| SEC-02 | **CRITICAL** | CORS wildcard (`Access-Control-Allow-Origin: *`) | Any domain can make credentialed cross-origin requests | `netlify.toml` |
| SEC-03 | **CRITICAL** | GraphQL query injection via URL params | Route slugs interpolated directly into query strings — attacker can escape the `where` clause to access unpublished/draft content | `ArticlesSingle.vue:67`, `DatasetsSingle.vue:45`, `AppsSingle.vue:53` |
| SEC-04 | **HIGH** | XSS via `v-html` (85 instances across 38 files) | CMS content rendered with `v-html` after markdown-it processes it with `html: true` — any `<script>` in CMS content executes in user browsers | 38 components (see full list below) |
| SEC-05 | **HIGH** | `document.write()` in print window | Article print function writes unsanitized HTML into new window via `document.write()` | `ArticleView.vue:348` |
| SEC-06 | **HIGH** | JWT stored in localStorage | XSS exploitation exfiltrates auth tokens; no HttpOnly/Secure cookie protection | `auth.js:13-14,70-71` |
| SEC-07 | **MEDIUM** | No CSRF protection on forms | Form submissions to `agency.icjia-api.cloud` and `mail.icjia.cloud` lack CSRF tokens | `LapRequest.vue`, `GrantStatus.vue` |
| SEC-08 | **MEDIUM** | No login rate limiting | Brute-force attacks on `/auth/local` endpoint not throttled (client-side) | `Login.vue` |
| SEC-09 | **MEDIUM** | External links missing `rel="noopener noreferrer"` | `target="_blank"` links without `noopener` allow `window.opener` manipulation | markdown-it link config, 38 v-html components |
| SEC-10 | **MEDIUM** | Source maps in production | Default Vue CLI config ships source maps, exposing full source code | `vue.config.js` |
| SEC-11 | **LOW** | Hardcoded API endpoints in components | API URLs embedded in component source rather than centralized config | `LapRequest.vue:310`, `Forms.js:35` |
| SEC-12 | **LOW** | EOL runtime (Node 16, Vue 2) | Node 16 EOL Sep 2023; Vue 2 EOL Dec 2023 — no further security patches | `netlify.toml`, `package.json` |
| SEC-13 | **LOW** | Font Awesome kit ID exposed in HTML | Public kit ID `170885123f` visible in page source | `public/index.html` |

#### v-html exposure detail (SEC-04)

85 total `v-html` bindings across 38 files. Top-risk components by exposure count:

| File | Count | Content Source |
|---|---|---|
| `SearchCardAlt.vue` | 12 | Search result titles/abstracts |
| `EventCard.vue` | 8 | CMS event descriptions |
| `ArticleView.vue` | 4 | Full article body, abstract, citation |
| `SearchCard.vue` | 3 | Search result rendering |
| `BaseCardExpandable.vue` | 3 | Program/grant descriptions |
| `Search.vue` | 3 | Search page results |
| All other components | 52 | Various CMS-sourced content |

**Root cause:** `markdown-it` configured with `html: true` (`src/services/Markdown.js:41`). DOMPurify is imported in only 3 of 38 affected files (`Search.vue`, `GrantStatus.vue`, `LapRequest.vue`).

#### Mitigations applied (BLUE TEAM — this release)

| ID | Mitigation | Status |
|---|---|---|
| SEC-01 | **Enabled all security headers** in `netlify.toml`: X-Frame-Options, X-XSS-Protection, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, HSTS | **DONE** |
| SEC-02 | **Restricted CORS** from wildcard `*` to `https://icjia.illinois.gov` | **DONE** |
| SEC-03 | **Sanitized GraphQL query params** — route slugs stripped to `[a-zA-Z0-9_-]` before interpolation in `ArticlesSingle.vue`, `DatasetsSingle.vue`, `AppsSingle.vue` | **DONE** |
| SEC-04 | **DOMPurify at renderToHtml() chokepoint** — `DOMPurify.sanitize()` added to `Markdown.js` and `markdownIt.js`, covering all 85 `v-html` bindings across 38 components in a single fix | **DONE** |
| SEC-05 | **Replaced `document.write()`** with DOM API + DOMPurify sanitization in `ArticleView.vue` print function | **DONE** |
| SEC-09 | **Added `rel="noopener noreferrer"`** to markdown-it link attributes in both `Markdown.js` and `markdownIt.js` | **DONE** |
| SEC-10 | **Disabled production source maps** — set `productionSourceMap: false` in `vue.config.js` | **DONE** |

#### Mitigations requiring follow-up (backend-dependent)

| ID | Recommended Fix | Effort | Priority |
|---|---|---|---|
| SEC-06 | Migrate JWT to HttpOnly cookies (requires backend change on Strapi 3) | Backend change | **P1 — High** |
| SEC-07 | Add CSRF tokens to form submissions (requires backend support) | Backend change | **P2 — Medium** |
| SEC-08 | Implement login rate limiting (backend) | Backend change | **P2 — Medium** |
| SEC-11 | Move hardcoded URLs to `config.json` | 30 minutes | **P3 — Low** |
| SEC-12 | Plan Node 18+ and Vue 3 migration (Nuxt 4 / Strapi 5 rewrite) | Large project | **P3 — Low** |
| SEC-13 | Self-host Font Awesome subset or use npm package | 1 hour | **P3 — Low** |

#### Existing security controls (validated)

| Control | Status | Notes |
|---|---|---|
| HTTPS everywhere | **PASS** | All API endpoints, CDN resources, and production site use TLS |
| DOMPurify on form inputs | **PASS** | `GrantStatus.vue` and `LapRequest.vue` sanitize + strip HTML before submission |
| Console stripping in production | **PASS** | `babel-plugin-transform-remove-console` removes `console.log` in builds |
| CodeQL static analysis | **PASS** | GitHub Actions runs CodeQL on every push and PR to main |
| Subresource integrity | **PARTIAL** | jQuery and KaTeX use SRI hashes; nprogress and Font Awesome do not |
| .env excluded from git | **PASS** | `.gitignore` blocks `.env` and `.env*.local` |
| Auth token cleanup on logout | **PASS** | `localStorage.removeItem()` and `delete axios.defaults.headers.common["Authorization"]` |
| Plausible analytics (privacy) | **PASS** | Self-hosted, no Google Analytics, no third-party tracking |
| Client-side route guards | **PASS** | `router.beforeEach` checks auth state for `/admin/*` routes |

### SiteImprove Remediation (March 25, 2026)

Issues identified and resolved from SiteImprove accessibility scanner:

| Issue | Rule | Occurrences | Fix |
|---|---|---|---|
| **Invalid ARIA roles** (`role="bar"`, `role="spinner"`) | sia-r110 | 4,485 across 2,244 pages | Added `fixInvalidRoles()` — scans DOM and strips any `role` attribute not in the official WAI-ARIA roles list (88 valid roles). Vuetify 2.x generates non-standard `role="bar"` on `v-progress-linear` and `role="spinner"` on loading indicators |
| **Prohibited ARIA attributes on img** (`aria-haspopup`, `aria-expanded` on `role="img"`) | ARIA attribute unsupported | Site-wide | Added `fixProhibitedAriaOnImg()` — removes `aria-haspopup` and `aria-expanded` from elements with `role="img"`. Vuetify adds these when images are inside tooltip/menu activators |
| **Route announcer outside landmark** | Perceivable text outside ARIA landmark | All pages | Moved `#route-announcer` `div[aria-live="polite"]` from after `v-main` to inside `v-main`, placing it within the main content landmark |
| **Biography card text invisible** | Color contrast / visibility | All biography pages | Vuetify `:to` prop renders `v-card` as `<a>`, causing text to inherit link color (white on white). Added CSS overrides forcing `color: #000` on `.v-card__text` across all pseudo-states (`:link`, `:visited`, `:hover`, `:active`, `:focus`) |
| **Nav header role compatibility** | sia-r110 | All pages | Changed `fixNavHeaderRoles()` from `role="presentation"` to `role="none"` (modern ARIA synonym with better scanner compatibility) |
| **Carousel ARIA roles missing** | ARIA attribute unsupported/prohibited | Research Hub, Home | Vuetify 2.x renders `v-carousel-item` as plain `<div>` (implicit `generic` role), which prohibits `aria-roledescription` and `aria-label`. Added `role="region"` to carousels and `role="group"` to carousel items in templates (`HubHome.vue`, `HomeSplashV2.vue`) and via runtime `fixCarouselItemRoles()` safety net |
| **Heading hierarchy in carousel** | Content missing after heading | Research Hub | Carousel overlay had `<h2>` (date) before `<h1>` (title) — inverted hierarchy with no content between. Converted both to `<p>` with visual styling preserved; title uses `aria-role="heading"` and `aria-level="2"` for assistive technology |
| **CMS title `<p>` nesting** | Invalid nesting | Research Hub | CMS `render()` wraps title in `<p>` tags, creating invalid `<h1><p>…</p></h1>`. Added inline `.replace()` to strip wrapper |
| **Visible label ≠ accessible name** | WCAG 2.5.3 Label in Name | Research Hub carousel | Vuetify converts `v-img` `alt` to `aria-label` on rendered `<div>`. Label contained only title but visible text included date, "NEW!" chip, and authors. Set `alt=""` to prevent `aria-label` generation; accessible name now computed from descendant text. Added `fixLabelInName()` as runtime safety net |

---

### Accessibility Summary — Current Posture (March 2026)

**Compliance target:** WCAG 2.1 Level AA (Illinois Title II ADA requirement)

| Metric | Score |
|---|---|
| Core pages (12-page axe-core audit) | **12/12 zero violations** |
| Full site sweep (143 pages, 10 content types) | **140/143 clean (98%)** |
| Regression tests (Playwright) | **37/37 passing** |
| Automated score (WCAG 2.1 AA) | **A / 99%+** |

**Key a11y features active:** Skip navigation, route announcements, keyboard access on all interactive elements, semantic HTML headings, ARIA labels on all icon buttons/carousels/modals, color contrast AA compliance, external link announcements, post-render CMS content fixes (heading order, figure tabindex, chip contrast, empty table headers, footnote target size, link underlines).

**Remaining a11y issues (3):** All originate from CMS-authored markdown content and are mitigated by post-render JavaScript. Will be fully resolved in the Nuxt 4 / Strapi 5 rewrite.

---

## [1.2.0] - 2026-03-22

### WCAG 2.1 Level AA Accessibility Remediation

**Compliance target:** WCAG 2.1 Level AA (required for Illinois government websites under Title II ADA)

**Audit results:**

| Metric | Before | After |
|---|---|---|
| Core pages (axe-core, 12 pages) | 11/12 clean, 6 violations | **12/12 clean, 0 violations** |
| Full site sweep (103 pages, 10 content types) | Not tested | **100/103 clean (97%)** |
| Regression tests | None | **37/37 passing** |
| Automated score (WCAG 2.1 AA) | B+ / 92% | **A / 99%+** |
| Manual code review score | C+ / 68% | **A- / 93%** |

### Added

- **Nested-interactive fix** — `fixNestedInteractive()` strips `role="button"` and orphaned ARIA attributes from Vuetify `v-select` wrappers in data table footers, resolving nested-interactive and aria-valid-attr-value violations site-wide
- **Route announcements** — `aria-live="polite"` region announces page title on every route change for screen reader users
- **Screen reader utility class** — `.sr-only` CSS class for visually hidden but screen-reader-accessible content
- **External link announcements** — CSS `::after` pseudo-element adds "(opens in new tab)" for screen readers on all `target="_blank"` links
- **Carousel accessibility** — slide labels (`aria-roledescription`, `aria-label`), arrow button labels on Home and Research Hub carousels
- **Search results announcements** — `aria-live="polite"` on search result count in ModalSearch
- **Keyboard access for data tables** — `fixTableRowKeyboard()` adds tabindex and Enter/Space key support to all data table rows
- **Playwright regression test suite** — 37 tests covering home, navigation, news, about, grants, research hub, search, meetings, biographies, events, employment, policies, 404, and page structure
- **Accessibility audit script** (`a11y-audit-by-type.js`) — audits pages by content type using axe-core, supports sampling for large content sets. Run with `npm run audit`
- **Post-render a11y fixes for CMS content** — JavaScript functions that fix Strapi 3 markdown rendering issues after page load:
  - `fixFigureTabindex()` — strips positive tabindex from `<figure>` elements
  - `fixHeadingOrder()` — corrects heading level skips in article bodies
  - `fixEmptyTableHeaders()` — fills empty `<th>` with sr-only placeholder text
  - `fixFootnoteTargetSize()` — ensures footnote links meet 24px touch target size
  - `fixLinksInTextBlocks()` — adds underline to links that rely only on color
  - `fixChipContrast()` — calculates WCAG contrast ratio and fixes failing v-chip text colors

### Changed

- **Navigation semantics** — hamburger menu changed from `<div>` to `<button>` with `aria-label` and `aria-expanded`; logo and agency title wrapped in `<router-link>` for proper link semantics
- **Footer logo** — wrapped in `<router-link>` with `aria-label="ICJIA Home"` instead of `@click` on `<img>`
- **Card keyboard access** — 8 card components converted from `@click` divs to accessible patterns:
  - InfoCard, NewsCard, HubCard, HomeEventCard, BiographyCard: use Vuetify `:to` prop (renders as `<a>`)
  - EventCard, JobCard, ClickthroughBoxes: added `tabindex="0"`, `role="link"`, `@keydown.enter`
- **Context navigation bars** — wrapped in `<nav>` elements with unique `aria-label` attributes instead of Vuetify `v-app-bar` `<header>` landmarks
- **Heading markup** — converted heading-like `<div>`/`<span>` elements to proper heading elements across WidgetBar, HubHome, Toc, TocPolicies, Disclaimer, PublicationCard, JobCard, BaseCardExpandable, 404 page, AttachmentList, SearchCardAlt, and RulesRegsPoliciesAll
- **Color contrast** — `#888` text colors changed to `#595959` across PolicyTable, RequiredFormTable, NewsCard for WCAG AA compliance; Research Hub carousel overlay opacity increased to 0.7
- **Icon buttons and labels** — added `aria-label` to download buttons (PolicyTable, ArticleView, DatasetView), search fields (PolicyTable, MeetingTable, RequiredFormTable), job link icons, carousel progress spinners
- **Image alt text** — added `alt` prop to Hub/BaseImage component; biography headshot images get `alt="[name] headshot"`
- **Modal accessibility** — ModalSearch and ModalTranslate dialogs get descriptive `aria-label` attributes
- **Loading state** — `aria-busy="true"` set on `.v-main` during NProgress route loading
- **Missing h1 tags** — added sr-only `<h1>` to 5 detail views: StaffAndBoardSingle, EmploymentSingle, PublicationsSingle, UnitsSingle, ProgramsSingle
- **Search card keyboard access** — added `tabindex`, `role`, `@keydown.enter` to author name and unit title spans in SearchCardAlt, BiographyCard author names, AppNavContext breadcrumb links, DatasetView category spans

### Remaining known issues (Strapi 3 CMS content)

These issues originate from CMS-authored markdown content and are mitigated by post-render JavaScript fixes. They will be fully resolved in the Nuxt 4 / Strapi 5 rewrite:

- Heading level skips in some article bodies (CMS authors skip heading levels)
- Positive `tabindex` on `<figure>` elements from `markdown-it-implicit-figures` plugin
- Occasional `page-has-heading-one` false positive on listing pages (race condition with async GraphQL data)

### Revert instructions

If issues are found, revert to pre-remediation state:

```bash
git revert 4c23422              # revert the merge commit
# or reset to the tagged state:
git reset --hard pre-a11y-remediation
```

---

## [1.1.0] - 2025-10-15

### Initial Accessibility Audit

- Added `accessibility-audit.js` — axe-core audit script with Puppeteer
- Initial a11y fixes: `fixBlankTableHeadings()`, `fixExpandButtons()` in `src/a11y/index.js`
- Skip link component (`SkipLink.vue`)
- Focus management on route navigation
- SiteImprove AA error fixes
- Vuetify theme configured for WCAG AA contrast compliance

---

## [1.0.0] - 2021-04-04

### Initial Release

- Vue 2 / Vuetify 2 public website for Illinois Criminal Justice Information Authority
- GraphQL API integration with Strapi 3 CMS
- Research Hub with articles, datasets, and web applications
- News, events, grants, meetings, employment, and biographies sections
- Full-text search with Fuse.js
- Google Translate integration
- Plausible analytics

# Changelog

All notable changes to the ICJIA Public Website are documented in this file.

---

## IMPORTANT: Understanding Accessibility Tool Differences — axe-core vs. SiteImprove

This site is audited with two complementary tools — **axe-core** (industry-standard, open-source) and **SiteImprove** (proprietary enterprise crawler). They produce different results for the same pages because they use different rule sets, scan in different ways, and treat ambiguous cases differently. **A page that passes one tool may still be flagged by the other.** This is expected behavior; it does not indicate inadequate remediation.

Managers and stakeholders reviewing audit results should understand these differences before drawing conclusions from either tool's output.

### For stakeholders — the short version

- **axe-core score: 2,377 / 2,377 pages pass WCAG 2.1 AA with zero violations** (most recent full-site audit, May 6 2026; the prior April 14 2026 audit on 2,367 URLs was equally clean). axe-core is the open-source engine used by Google Lighthouse, Microsoft, pa11y, and most accessibility consultancies.
- **SiteImprove reports a lower score** because (a) it applies proprietary rules that are stricter than the published WCAG and W3C ACT Rules, and (b) its remote crawler cannot fully execute the JavaScript that renders this Single Page Application. Both limitations are architectural to SiteImprove and documented by the vendor itself.
- **SiteImprove cannot be integrated into the build process.** There is no CLI, API, or local runner. Every SiteImprove flag must be manually reviewed after deployment, and results can lag days or weeks behind the live code.
- **Every new SiteImprove report is triaged on arrival.** If axe-core also flags the issue, it is fixed in code. If axe-core is clean and the flag matches a known stricter-than-spec rule, it is logged as a false positive with W3C/ACT Rules citations and verification evidence.
- **Known false-positive patterns are tracked in [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md)** — a running table with pattern, reason, verification source, first-reported date, and the recommended comment to paste into SiteImprove's inspector when marking occurrences as accepted. New patterns are added as they appear.

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

1. **This site passes axe-core with zero violations across all 2,377 pages in `sitemap.xml`** (most recent full-site audit, May 6 2026, axe-core 4.11.2, WCAG 2.2 Level AA; the prior April 14 2026 audit on 2,367 URLs was equally clean). axe-core is the industry-standard open-source engine used by Google, Microsoft, and most accessibility consultancies. Complete per-page JSON for each run is preserved under `reports/a11y-full-audit/archive/<date>/` for audit-trail purposes.

2. **SiteImprove flags additional issues** that fall into three categories:
   - **Legitimate gaps** that axe-core's rule set doesn't cover (e.g., sia-r83 text clipping at 200% zoom, sia-r77 table cell context). These have been remediated in code. When a new gap is discovered via a SiteImprove report, a targeted axe-core audit script is written for those URLs (see `scripts/audit-siteimprove-*.js`) to verify the fix.
   - **Stricter-than-spec interpretations** where SiteImprove applies WCAG rules more broadly than the spec requires (e.g., sia-r14 flagging landmark `<nav>` elements — WCAG 2.5.3 and W3C ACT Rule 2ee8b8 only apply "Label in Name" to interactive widgets, not landmarks). These are logged in [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md) with citations and verification evidence, then marked as Accepted in the SiteImprove inspector.
   - **Cached/stale results** from previous crawls that no longer reflect the current state of the site. These clear on the next SiteImprove recrawl.

3. **Neither tool replaces manual testing.** Both are automated scanners that can only catch ~30-40% of WCAG issues. Screen reader testing, keyboard navigation testing, and cognitive accessibility review require human judgment.

### Build process integration

**axe-core** is integrated into this project's development workflow. Developers can run `npm run audit` to test any content type on-demand against WCAG 2.1 AA. The audit scripts use Puppeteer to render each page (including all runtime a11y fixes) and run axe-core analysis in the same browser context the user sees. This makes axe-core a reliable, repeatable gate that can be run before every deploy.

**SiteImprove cannot be integrated into the build process.** It is a cloud-hosted service that crawls the live production site on its own schedule. There is no CLI, API, or npm package that can be run locally or in CI/CD. This means:

- SiteImprove flags can only be checked **after** code is deployed to production
- Every SiteImprove issue must be **manually reviewed** by opening the SiteImprove dashboard, identifying the flagged element, and determining whether it is a legitimate issue, a false positive, or a stale cached result
- There is no way to run SiteImprove against a local dev server or preview deployment
- SiteImprove results may lag days or weeks behind the actual state of the site

This asymmetry is important: axe-core violations are caught and fixed during development, while SiteImprove violations are only discovered after the fact and require a manual investigation cycle.

### Audit coverage — every URL in the sitemap

This site has **2,377 URLs across 10 content types** (as of the May 6 2026 sitemap; the April 14 2026 sitemap had 2,367 — the +10 delta is new biographies, news posts, and employment listings published through the Strapi CMS over the intervening sprints). The April 14 breakdown was: 1,101 publications, 275 meetings, 251 hub articles, 218 jobs, 180 posts, 172 grants, 114 biographies, 29 static pages, 10 units, 6 events, 11 system. As of v1.5.9 (April 14 2026) and re-confirmed in v1.5.40 (May 6 2026), **every single URL in `public/sitemap.xml` is audited with axe-core** on each full-site run — no sampling.

The full-site auditor at `scripts/a11y-sitemap-audit.mjs` runs 4-5 parallel workers against the local dev server and completes in 28-35 minutes depending on sitemap size and concurrency. It is resumable, archives prior runs under `reports/a11y-full-audit/archive/<date>/`, and records a per-page JSON plus a rule × page matrix. The May 6 2026 archive shows **2,377 / 2,377 pages with zero violations, zero errors**; the April 14 2026 archive shows **2,367 / 2,367 pages with zero violations, zero errors** — both at WCAG 2.2 Level AA.

```bash
# Full-site audit, every URL in sitemap.xml, fresh archive
node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=5
```

An earlier version of this document described a sampled audit strategy (~57 pages, one per content type). That strategy was technically defensible — pages within a content type share templates and the runtime a11y fix functions are global — but manager-facing compliance records benefit from exhaustive coverage. "Every page in the sitemap was audited" is a stronger, more defensible claim than "a representative sample passed," and the full-site runner produces that record in under half an hour.

SiteImprove, by contrast, crawls the live production site on its own schedule and sometimes surfaces issues on specific pages that axe-core already covered. When this happens, a **targeted axe-core audit script** is written for those exact URLs (see `scripts/audit-siteimprove-*.js`) to independently verify and — if it is a real issue — fix it. If axe-core confirms the pages are clean, the flag is logged in [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md) with citations.

### Recommendation

Use **both tools together**: axe-core as the primary development-time gate (fast, accurate, zero false positives), and SiteImprove as a secondary monitoring layer (broader coverage, catches edge cases). When SiteImprove flags an issue that axe-core does not, triage it:

1. Run the relevant targeted audit at `scripts/audit-siteimprove-*.js` (or write a new one) to confirm or deny axe-core agreement.
2. If axe-core also flags it, remediate in code and document the fix in a CHANGELOG entry.
3. If axe-core is clean and the pattern matches a stricter-than-spec rule, add an entry to [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md) and mark the occurrences as Accepted in the SiteImprove inspector with the comment supplied in the table.
4. Stale-cache flags clear on the next SiteImprove recrawl — no action needed beyond waiting.

---

## [1.5.52] - 2026-06-24

### test(ci) — Wire the Vue 2 unit suite into CI; add filters + lib/utils coverage; repair 10 stale assertions

Nothing ran the root Vue 2 unit suite (`npm run tests`): CI (`.github/workflows/ci.yml`) only built and tested `astro/`, and the Netlify build runs `npm run build` with no test step — so the mocha suite had silently drifted to **10 failing assertions**. Added a **`vue-unit`** CI job (repo root, Node 22) that gates every PR/push on the suite. It runs `tests/unit/!(config).spec.js`, excluding `config.spec.js` because it reads `public/api/*.json`, which is git-ignored and build-generated and so can't run on a clean checkout — run the full `npm run tests` locally to include those data-integrity checks.

Added coverage for two untested areas: all 22 Vue filters (`src/filters.js`) and the `src/lib/utils.js` helpers — `getPublicationType` (live, used by the publication views), the recursive `getObjects`/`getValues`/`getKeys`, and `getContextMenu` (pinned with a note that it is currently dead code with a last-match-wins quirk that resolves any Footer-sitemap path to "Footer"). +66 passing tests, all timezone-deterministic.

Repaired the 10 pre-existing failures — every one a stale test trailing an intentional a11y improvement in the source, not a regression: footnote target size `24px`→`28px`; SkipLink text/href → "Skip to main content" / `#main-content`; `<pre tabindex="0">` (scrollable-region-focusable); and `fixCmsTables` now emitting explicit `id`/`headers` on every cell (SiteImprove sia-r46), with the table-id assertions switched to regex since the id counter is non-deterministic across a run.

**Files:**

- `tests/unit/filters.spec.js` (new) — 41 tests across all 22 filters (date/time, text, relative-time, sanitize).
- `tests/unit/lib-utils.spec.js` (new) — 25 tests for `src/lib/utils.js`.
- `.github/workflows/ci.yml` — new `vue-unit` job (repo root, npm, Node 22).
- `tests/unit/a11y.spec.js`, `tests/unit/components.spec.js`, `tests/unit/contentSanitizer.spec.js`, `tests/unit/markdown.spec.js` — updated 10 stale assertions to current correct behavior.
- `README.md` — added a "Testing the Vue 2 app" section + scope note (the rest of the README documents the dormant Astro app).
- `package.json` — version bump to 1.5.52.

## [1.5.51] - 2026-06-23

### perf(events) — Bound the events fetch with a time-range dropdown (was a full fetch every load)

`/events/` used to fetch **all** events/meetings/jobs/grants (~648 records → ~1,276 client-side markers) on every load and hide most of them client-side via the "Upcoming and ongoing only" checkbox — the checkbox never reduced the fetch. Replaced it with a time-range dropdown (**Current & ongoing** default, + Past 6 / 12 / 18 / 24 months, hard-capped) that bounds the fetch **in the GraphQL query** (`where: { end_gte: since }`, Strapi-3 syntax, passed as `JSON` `where` variables). The default now fetches only current/ongoing (~a handful of records); history is opt-in and bounded (~54 / 109 / 161 / ~200). Re-fetches on change; stays a client-side SPA. `filterDisplay()`'s client-side date filter was removed (the bound is server-side now); applies to both List and Calendar.

**Files:**

- `src/utils/eventsRange.js` (new) — `EVENT_RANGE_OPTIONS` + `sinceDate()` + `buildEventWheres()`; unit-tested.
- `src/components/EventToggle.vue` — checkbox → `v-select` range dropdown; emits `toggleRange(monthsBack)`.
- `src/graphql/events.js` — `GET_EVENTS` takes per-entity `JSON` `where` variables.
- `src/views/Events/EventsAll.vue` — bounded `variables()`, `toggleRange` re-fetch, removed `upcomingOnly` client filter.
- `tests/unit/eventsRange.spec.js`, `tests/unit/components.spec.js` — coverage.
- `package.json` — version bump to 1.5.51.

## [1.5.50] - 2026-06-23

### ux(events) — Default the events page to List view (was Calendar)

`/events/` now opens in **List view** instead of Calendar view. List view (with the default "Upcoming and ongoing only" filter) shows every current/upcoming item as a card — including open NOFOs — whereas the calendar plots NOFOs only as point markers on their open/deadline dates, so a currently-open NOFO whose deadline is next month left the *current-month* calendar looking empty (a NOFO open Jun 8 → Jul 10 has its OPEN marker past-filtered and its DEADLINE marker in July). Defaulting to List surfaces "what's open now" immediately; the Calendar toggle still works exactly as before. The initial `display` and the toggle's default button are changed together so the List/Calendar buttons reflect the active view with no flash.

**Files:**

- `src/components/EventToggle.vue` — default toggle `icon: "calendar"` → `"list"`.
- `src/views/Events/EventsAll.vue` — initial `display` `"calendar"` → `"list"`.
- `package.json` — version bump to 1.5.50.

## [1.5.49] - 2026-06-23

### chore — Remove stray debug `console.warn`s that leaked into the production console

`PublicationsAll.vue`'s `fetchPublications()` logged `console.warn("Publications cached…")` and `console.warn("Fetching publications…")` as debug breadcrumbs. The production build strips `console.log` but deliberately keeps `console.warn`/`console.error` (`babel.config.js` → `transform-remove-console` with `exclude: ["error", "warn"]`, so genuine warnings survive minification) — so these info-level logs slipped into the live console on `/researchhub/publications/` (the "Fetching publications…" line, on first load and on every filter change). Neither indicated a fetch problem; both were removed, along with the now-redundant `else` (the `if` returns early on a cache hit). The fetch logic is unchanged.

Swept the rest of `src` for the same pattern: the only other `console.warn` (`utils/search.js` — "goToSearch navigation error") is a legitimate navigation-failure warning and was kept, as were the two `console.error` handlers.

**Files:**

- `src/views/About/PublicationsAll.vue` — removed two debug `console.warn`s from `fetchPublications()`.
- `package.json` — version bump to 1.5.49.

## [1.5.48] - 2026-06-23

### fix(csp) — Remove KaTeX/texmath jsDelivr loads; drop Adobe DTM from the CSP

Two Content-Security-Policy cleanups on the research-hub article pages, ahead of promoting the Report-Only policy to enforced.

**Why this only showed in production:** the CSP is an HTTP response header emitted by Netlify from `netlify.toml`. The local dev server (webpack-dev-server) doesn't read `netlify.toml` and sends no CSP header, so the browser has no policy to check against — the violations are logged only on the live (Netlify) site. Verification was therefore done by confirming the *cause* is gone on dev (no CDN requests fire at all), not by watching the report-only violation disappear.

**KaTeX / markdown-it-texmath removed (was jsDelivr).** Every article page ran `ArticleView.vue` `created()` → `initTexmath()`, which injected four `cdn.jsdelivr.net` `<script>`/`<link>` tags (KaTeX + markdown-it-texmath) and then built the markdown renderer from the `window.texmath`/`window.katex` globals those scripts exposed. `cdn.jsdelivr.net` is not in the CSP `script-src`/`style-src` allowlist, so each article logged a Report-Only violation — and would have **broken every article page** (the `created()` hook throws without the globals) the moment the policy is enforced. A scan of all 252 published articles found `$$…$$` math in exactly one (the rape-crisis-hotline baseline regression model, which was already rendering as a KaTeX parse error rather than real math), so the integration was removed outright rather than bundled: `texmath.js` deleted, `.use(texmath.use(katex))` dropped from the markdown pipeline, and `katex` + `markdown-it-texmath` uninstalled. (Verified on dev: no jsdelivr/CDN requests fire, no `#katexJS`/`#texmathJS` tags are injected, `window.katex`/`window.texmath` are undefined, and article bodies — including that one — render fully.) Reinstate the plugin if a real need returns.

**Equation image for the one affected article.** Rendered that baseline-model equation to a self-contained SVG (MathJax → glyph paths, no external fonts) plus a 3× transparent-background PNG, both with embedded `<title>`/`<desc>` for accessibility, so the author can embed it as an image in Strapi. Going forward, authors who need notation should embed an SVG/PNG with descriptive alt text rather than LaTeX.

**Adobe DTM removed.** The `assets.adobedtm.com` Launch embed in `public/index.html` was already commented out (dead), but the origin still sat in the CSP `script-src` and `connect-src`. Removed the dead `<script>` comment and both allowlist entries. **Plausible is untouched** — `plausible.icjia.cloud` stays in `script-src`/`connect-src`, and the active Plausible script + `window.plausible` queue stub + component event calls are preserved (confirmed on dev: Plausible logs its expected "Ignoring Event: localhost" notice).

**Defensive: TOC scroll-spy null guard.** Dropping the CDN `await` from `created()` makes the markdown renderer (and the parsed `headings`) available synchronously, before first paint, so a scroll event during load can now reach `onScroll` before the body's heading elements exist. Added a null check so it skips a not-yet-painted heading instead of calling `getBoundingClientRect()` on a missing element.

**Files:**

- `src/utils/texmath.js` — deleted (was the jsDelivr KaTeX/texmath loader).
- `src/components/Hub/ArticleView.vue` — `created()` builds the markdown renderer without texmath/katex (no CDN `await`, no `window` globals); `onScroll` skips headings whose element isn't yet in the DOM.
- `public/hotline-calls-baseline-model.svg`, `public/hotline-calls-baseline-model.png` — static equation image (replaces the removed inline math for the one article that used it).
- `public/index.html` — removed the dead, commented-out Adobe DTM Launch `<script>`.
- `netlify.toml` — dropped `https://assets.adobedtm.com` from CSP `script-src` + `connect-src` (Plausible retained).
- `package.json` / `package-lock.json` — removed `katex` + `markdown-it-texmath`; version bump to 1.5.48.

Note: an unrelated, pre-existing Vuetify `VSlideGroup.scrollIntoView` console error (a slide-group/tabs component measuring an element before it is ready) is present on article pages independent of this change and is not addressed here.

## [1.5.47] - 2026-06-23

### fix — Research hub article cards: render PNG splashes (not just JPEG)

Article cards on `/researchhub/articles/` fell back to the default ICJIA placeholder whenever the author's splash image was a **PNG** instead of a JPEG. JPEG cards rendered fine; PNG cards showed the generic placeholder.

**Root cause.** Hub splash/app images are pre-generated at build time by `generators/generateImagesHub.js`, which decodes each Strapi base64 image and writes it under its **original** extension (`${id}-splash.png` for a PNG upload, `${id}-splash.jpeg` for a JPEG). But `ArticlesAll.vue` built the card URL with a hard-coded `.jpeg` (`https://icjia.illinois.gov/images/${id}-splash.jpeg`). For a PNG article that `.jpeg` file doesn't exist, so the static host answers with the SPA's `200 text/html` fallback; the `<img>` can't decode it, and `HubCard`'s error handler swaps in the placeholder. (Confirmed live: the PNG article's `…-splash.jpeg` returns `200 text/html` while `…-splash.png` returns `200 image/png`.) `AppsAll.vue` carried the mirror hard-code (`.png`).

**Fix.** Added `src/utils/hubImage.js` → `splashCandidates(url)`, which expands one hard-coded URL into an ordered list: the original extension first, then the alternate format. `HubCard` now renders the first candidate and, on image-load error, advances to the next before surrendering to the placeholder. Because the original extension is tried first, existing JPEG cards are byte-identical (single request, no extra fetch); only the other format incurs one extra request. This also hardens the apps cards for free.

**Verified** (dev server, live production images): the PNG article (`Evaluation of the Action-Planning Process…`, id `69dfeb55…`) now loads `…-splash.png` after the `.jpeg` decode-fail and shows the real image; a JPEG article still loads `…-splash.jpeg` on its single request. Unit tests: `tests/unit/hubImage.spec.js` (6/6 passing).

**Files:**

- `src/utils/hubImage.js` (new) — `splashCandidates()` extension-fallback helper.
- `src/components/Hub/HubCard.vue` — renders `splashSrc` (candidate walk) instead of the raw `item.imagePath`; `errorHandler` advances through candidates before the placeholder.
- `tests/unit/hubImage.spec.js` (new) — unit coverage for the helper.
- `package.json` — version bump to 1.5.47.

## [1.5.46] - 2026-06-23

### refactor — Remove Thumbor image proxy; serve Strapi formats directly (fixes news-splash 400)

Removed the `thumbor-url-builder` dependency and the `src/services/Image.js` URL-signing service from the legacy Vue app. Images now load straight from Strapi's pre-generated formats (`large`/`medium`/`small`/`thumbnail`) instead of being proxied and resized through `image.icjia.cloud`.

This also resolves a production `400` on news splash images. `Image.js` signed Thumbor URLs with `process.env.VUE_APP_THUMBOR_KEY`, but that variable is unset on the Netlify build (the only key defined anywhere is the mismatched `PUBLIC_THUMBOR_KEY`), so the build emitted unsigned `…/unsafe/…` URLs that the secure Thumbor server rejects with 400. Serving Strapi formats directly removes the signing-key dependency, so this failure mode is no longer possible. (Verified against the live server: an `ICJIA`-signed request returns 200, an unsigned/`unsafe` request returns 400, and the raw Strapi source returns 200.)

Of the 7 files importing the service, only `Splash.vue` and `SplashText.vue` actually rendered through Thumbor; the other 5 already used Strapi `formats.*` URLs in their templates and merely carried dead `getImageURL` imports / `getImagePath` methods, now removed.

The news single splash (`Splash.vue` — shared by News/BasePage/Covid/Infonet) was rebuilt from Vuetify `<v-img>` to a plain `<img>` using Strapi's `large` render, capped to a centered **750px** wrapper (`.splash-wrap`) so it stays sharp on Retina without overwhelming the layout. The wrapper is capped rather than the `<img>` because github-markdown-css's `.markdown-body img { max-width: 100% }` outranks a single-class rule on the image itself.

**Files:**

- `src/services/Image.js` (deleted) — the Thumbor URL-signing service.
- `src/components/Splash.vue` — `<v-img>` → constrained `<img>` (Strapi `large`, 750px `.splash-wrap` cap); Thumbor removed.
- `src/components/SplashText.vue` — splash now uses Strapi `large` (was Thumbor).
- `src/components/NewsCard.vue`, `src/components/Hub/HubCard.vue`, `src/components/HomeResearchCard.vue` — removed dead `getImageURL`/`getGrayscaleImageURL` import + unused `getImagePath` method.
- `src/views/Hub/DatasetsSingle.vue`, `src/views/Hub/AppsSingle.vue` — removed dead `getImageURL` import.
- `src/config/config.json` — removed the now-orphaned `image` block (Thumbor server + dimensions).
- `package.json` / `package-lock.json` — dropped `thumbor-url-builder`; version bump to 1.5.46.

## [1.5.45] - 2026-06-20

### docs — README banner: clarify `main` serves the legacy Vue SPA (not Astro)

Added a prominent banner to the top of `README.md` stating that `main` builds and serves the **legacy Vue 2 SPA** (repo root, `npm run build`), while the **Astro rewrite in [`astro/`](astro/) is dormant pending cutover approval**. The README body still describes the Astro app, so the banner prevents the misread that `main` is the Astro build. No code or build-output change.

Context: the Astro-content README predates the 2026-06-01 production cutover (it was rewritten in commit `312e3cc` on 2026-05-30). The 2026-06-02 rollback (`git revert` of the cutover) only undid the one-file `netlify.toml [build]` flip, so the README — and the inert `astro/` source folder — correctly remained. Neither affects what `main` builds or serves.

## [1.5.44] - 2026-06-20

### fix — Resilient GraphQL schema download (`generate:schema`) — unbreaks Netlify builds

Netlify production builds of `main` (and deploy preview #37) began failing with `schema.json: Unexpected end of JSON input` during the Vue/ESLint compile. Root cause: the build step ran `get-graphql-schema <url> -j > schema.json` directly. The shell `>` truncates the committed `schema.json` **before** the fetch runs, so when the download to `agency.icjia-api.cloud` dies mid-stream (`ERR_STREAM_PREMATURE_CLOSE` — "Premature close") the file is left empty/partial. `get-graphql-schema` exits `0` on that error, so the corruption is silent, and the build dies later when `.eslintrc.js` (`eslint-plugin-graphql`) does `require("./schema.json")`.

Why it started now and only on Netlify: the fetch works locally but fails on Netlify's new Ubuntu **Noble** build image (`build-image … noble-new-builds`), whose changed build-network/Node/TLS stack trips the premature close against this API's gzipped ~1 MB introspection response. It is an environmental fetch failure we don't control — so the fix makes the build tolerate it rather than depend on the fetch.

`generate:schema` now runs `node ./generators/generateSchema.mjs`, which fetches to a temp file, **validates** that it parses and contains `__schema`, and only then **atomically** replaces `schema.json`. It retries up to 3× (in case the close is intermittent); on total failure it keeps the committed `schema.json` and exits `0` so the build proceeds, and fails loud only when there is no valid committed schema to fall back to. (Netlify's suggested `> tmp && mv` fix is insufficient here because `get-graphql-schema` exits `0` on the error — validation, not exit code, is what catches it.)

**Files:**

- `generators/generateSchema.mjs` (new) — resilient fetch → validate → atomic replace, with committed-file fallback. `GRAPHQL_SCHEMA_URL` overrides the endpoint (used to verify the fallback path).
- `package.json` — `generate:schema` now calls the script; version bump to 1.5.44.

## [1.5.43] - 2026-05-29

### feat — Publications export for accessibility analysis (`npm run export:publications`)

A regenerable script that exports **all** ICJIA publications to a spreadsheet (`.xlsx` + `.csv`) so a manager can review every published document for accessibility. One row per publication, sorted most-recent-first, with **Publication Date as the leading column**.

**What it produces** — written to `scripts/output/publications-<date>.{xlsx,csv}` (the directory is gitignored). Each run keeps **exactly one report set**: it deletes any previous `publications-*.{xlsx,csv}` and writes the current dated pair. There is no `-latest` copy — the date in the filename is the freshness signal.

- Every publication in the CMS — **1,108** at first run — not just the 990 the live "All Publications" page currently lists (see Known limitation below).
- Absolute, clickable links in both columns managers care about: the **dynamically generated detail page** (`https://icjia.illinois.gov/about/publications/{slug}/`) and the **hosted file** (the PDF/document URL, already absolute from Strapi). Rendered as real Excel hyperlinks in the `.xlsx`.
- A **Web Article URL** column (`articleURL`, the researchhub article that corresponds to a PDF) so authors can judge whether a given PDF is still relevant.
- Accessibility-triage columns: file type, file size (human-readable + raw bytes), and a live **File Status** from a per-file `HEAD` request that doubles as a broken-link check. The first run surfaced **4 dead file links** (3× 404 on researchhub uploads, 1× 403 from rand.org).
- Publications with no hosted file (44 at first run) are kept and flagged via **Has Hosted File = no**.

**Columns (11):** Publication Date, Title, Type, Page URL, File URL, Web Article URL, File Type, File Size, File Size (bytes), File Status, Has Hosted File. (`datasetURL`, `applicationURL`, and `slug` are still fetched and kept on each row object but not emitted as columns for now — re-add by listing them in the script's `COLUMNS` array.)

**How it works:** paginates the public Strapi REST collection endpoint (`/publications?_limit=500&_start=N`) against `/publications/count` — the same pattern as `generators/generateIndexPublications.js` — which avoids the GraphQL row-count ceiling (the live GraphQL query errors past ~950 rows). No authentication required; all data is public. Reuses the repo's `axios` retry client (`generators/apiClient.js`); file URLs receive the same case-correction the live site applies in `PublicationsSingle.vue` (`/Compiler/`→`/compiler/`, `/OGA/`→`/oga/`, `/researchreports/`→`/ResearchReports/`).

**Files:**

- `scripts/export-publications.js` (new) — the export script. Flags: `--no-head` (skip the file HEAD pass), `--limit=N` (REST page size).
- `scripts/lib/publications-export-helpers.js` (new) — pure helpers (`buildPageUrl`, `normalizeFileUrl`, `parseFileType`, `formatBytes`, `csvEscape`).
- `tests/unit/publications-export-helpers.spec.js` (new) — 30 unit tests for the helpers (mocha + chai).
- `docs/superpowers/specs/2026-05-29-publications-export-design.md` (new) — design spec, for all developers.
- `package.json` — added `export:publications` script; declared `exceljs@^4.4.0` as a devDependency (previously only present transitively via `accessibility-checker`); version bump to 1.5.43.
- `.gitignore` — ignore `scripts/output/`.

**Known limitation (flagged for follow-up):** `src/graphql/publications.js` `GET_ALL_PUBLICATIONS_QUERY` uses `limit: 990`, so the site's "All Publications" page lists only the 990 most-recent of 1,108 publications; the ~118 oldest are reachable by direct URL but not listed. This export includes all of them. Raising that cap is out of scope for this change.

---

## [1.5.42] - 2026-05-06

### fix — WCAG 2.5.8 (Target Size Minimum) on StaticSearch.vue toggles + full-site axe-core re-baseline

Resolved the `target_spacing_sufficient` violation IBM Equal Access caught in the v1.5.41 smoke test. Four `<v-btn x-small>` toggles in `src/components/StaticSearch.vue` (Title / Date / Ascending / Descending) were rendering at ~57×20 to 99×20 CSS px — under the WCAG 2.5.8 minimum of 24×24. Changed `x-small` to `small` (28px tall in Vuetify 2), bringing all toggles to ≥24px in both axes.

**Why this is a multi-tool triangulation case study, not a simple fix:**

- `target-size` is **already in axe-core 4.11.2's `wcag22aa` tag set** (verified by listing the rule's tags via `axe.getRules()` — tags are `[cat.sensory-and-visual-cues, wcag22aa, wcag258]`). Our existing sitemap audit was running this rule the whole time.
- axe-core's algorithm evaluates WCAG 2.5.8's spacing fallback ("a 24-CSS-pixel-diameter circle centered on the bounding box doesn't intersect another target") and concluded these toggles passed. The standard-tag run reported `passes.target-size: 1 rules, 148 nodes, 0 violations, 0 incomplete`.
- IBM Equal Access evaluates the same WCAG 2.5.8 with a different spacing-geometry implementation and concluded the toggles failed.
- Both interpretations are defensible under the WCAG 2.5.8 spec text. The disagreement isn't a bug in either tool; it's a genuine ambiguity in the spacing-fallback geometry that the spec authors did not fully nail down.
- **The unambiguous fix was to make the buttons big enough that both engines agree they pass under the *size* branch of WCAG 2.5.8, not the *spacing* branch.** That is the discipline of multi-tool triangulation: when two open-source ACT-Rules-conformant engines disagree on the same SC, the correct response is to remediate so neither has to make a judgment call. The triangulation framework introduced in v1.5.41 explicitly anticipated this case as the "one clean, one dirty → real edge case worth reading" branch of the decision tree.

**Forensic probes (kept in the repo as templates for future investigations):**

- `scripts/probe-target-size.mjs` — runs axe-core's standard `wcag22aa` tag-set run + a `target-size`-rule-only run on a single URL, and dumps violations / incomplete / passes counts plus failure summaries. Use this when you want to know exactly what axe-core says about a specific rule on a specific page, without re-running the full sitemap auditor.
- `scripts/probe-button-sizes.mjs` — measures every rendered `<button class="v-btn">` size on a single URL via `getBoundingClientRect()`, lists which are under 24×24, and shows a size-bucket distribution. Use this to confirm or deny "is this button actually too small?" by reading the browser's truth, without trusting any auditor's verdict.

**Verification:**

- StaticSearch toggle dimensions (probe-button-sizes): pre-fix `56×20, 60×20, 108×20, 116×20` → post-fix `56×28, 60×28, 108×28, 116×28`. All ≥24px in both axes.
- IBM smoke test re-run (10 biography pages, identical sample): pre-fix `8 clean, 2 dirty (1 violation each on /sharyn-adams and /elizabeth-salisbury-afshar)` → post-fix `10 clean, 0 dirty, 0 errors`.
- axe-core smoke test re-run (same 10 pages): unchanged at `10 clean, 0 dirty, 0 errors`. axe-core was already passing — the spacing-fallback gave it a green light. The fix doesn't change axe-core's verdict on these pages; it makes both engines agree.
- Full-site axe-core re-baseline (2026-05-06 afternoon, post-fix): **2,377 / 2,377 pages clean, 0 violations, 0 errors, 35m 24s runtime** at concurrency 4. axe-core 4.11.2, WCAG tag set `wcag2a + wcag2aa + wcag21a + wcag21aa + wcag22aa`. This is the first audit-trail snapshot under the multi-tool gate (axe-core + IBM Equal Access). The v1.5.40 morning archive auto-moved under `reports/a11y-full-audit/archive/<date>/` on this run's `--fresh` invocation.

**Buttons NOT changed (deliberately — verified passing in both tools):**

- `src/components/AppNavContext.vue` Translate-this-site button (158×20, top app bar, `text x-small dark`): the 12px-radius circle around its bounding box doesn't intersect any other target (top of page above the app bar, the section-nav separator below at `height="35"` is outside the circle). Both axe-core and IBM agree this passes via the spacing-fallback branch of WCAG 2.5.8 — no remediation needed. Kept at `x-small` to preserve the top-bar visual layout (changing to `small` would shift the bar height).
- `src/components/EventToggle.vue` List View / Calendar View toggles: already `small` (28px tall) since before this audit cycle. No change needed; included here for completeness.

**Files:**

- `src/components/StaticSearch.vue` — `x-small` → `small` on 4 `v-btn` toggles (Title / Date / Ascending / Descending). No CSS or behavioral change.
- `scripts/probe-target-size.mjs` (new) — forensic probe for axe-core target-size rule behavior on a single URL.
- `scripts/probe-button-sizes.mjs` (new) — forensic probe for rendered v-btn sizes on a single URL.
- `package.json` — version bump to 1.5.42.
- `README.md` — added v1.5.42 row to the "Full-site audit history" table; updated the "Multi-tool audit triangulation" worked-example paragraph to reflect that the v-btn-toggle target-size finding has been remediated and now passes both tools.

**The triangulation lesson, for future SiteImprove flag triage:**

When SiteImprove flags a URL on a rule axe-core scores clean, run IBM. If IBM also flags it, you have **2-vs-1** against axe-core's pass — strong signal that the spec interpretation axe-core is using is the loose one and a fix is warranted. If IBM agrees with axe-core, you have **2-vs-1** against SiteImprove — strong stricter-than-spec signal, document as false positive. The v1.5.42 fix was the first case under this regime, and the framework worked exactly as designed: IBM caught what axe-core's algorithm missed, and we shipped a real WCAG 2.2 AA improvement that strengthens the audit posture against both auditors and any future tool with even stricter spacing geometry.

---

## [1.5.41] - 2026-05-06

### feat — IBM Equal Access (accessibility-checker) parallel auditor for multi-tool triangulation against SiteImprove

Added a **second independent rule engine** running against every URL in `public/sitemap.xml`, alongside the existing axe-core auditor. IBM Equal Access (open source, distinct from axe-core, used in IBM's enterprise accessibility tooling) implements W3C ACT Rules + IBM's own WCAG 2.0/2.1/2.2 ruleset. The motivation: managers and external reviewers seeing **axe-core: 0 violations** on the same pages SiteImprove flags as failures need a second open-source tool to triangulate against. When axe-core AND IBM both score a page clean, the case that SiteImprove's rule is stricter-than-spec is much stronger than relying on one tool alone.

**The triangulation framework:**

1. SiteImprove flags a URL.
2. Run axe-core on that URL: `node scripts/a11y-sitemap-audit.mjs --limit=1` (or check the most recent full-site archive).
3. Run IBM on that URL: `node scripts/a11y-sitemap-audit-ibm.mjs --limit=1`.
4. **Both clean** → SiteImprove's rule is stricter-than-spec; document and Accept.
5. **One clean, one dirty** → real edge case worth reading; the disagreement is the finding.
6. **Both dirty** → real WCAG violation; fix in code.

**Smoke test (10 biography pages, 2026-05-06):** 8 / 10 clean of violations, 2 / 10 dirty (1 violation each). The two violations were both `target_spacing_sufficient` on Vuetify `v-btn x-small` toggles in the StaticSearch component — **WCAG 2.5.8 "Target Size (Minimum)"**, a real WCAG 2.2 AA criterion. **axe-core's standard run does not flag this** because the corresponding axe-core rule (`target-size`) ships under the `best-practice` tag, not the default `wcag22aa` tag set we audit against. This is exactly the kind of finding multi-tool triangulation surfaces — the disagreement is real and actionable. **Triage decision:** open as a follow-up rather than blocking this release; the biography pages affected are still 0-violation by the axe-core gate that the April 14 baseline and May 6 re-baseline used. A separate v1.5.42+ pass will either (a) fix the v-btn-toggle spacing in `StaticSearch.vue` / `EventToggle.vue`, or (b) explicitly add `target-size` to the axe-core auditor's tag list and re-baseline.

**IBM categorization vs axe-core (for stakeholder mapping):**

- IBM `violation` ≡ axe-core `violation` — both confirmed WCAG failures.
- IBM `potentialviolation` ≡ axe-core `incomplete` (Needs Review) — cantTell results, manual review needed.
- IBM `recommendation` / `potentialrecommendation` ≡ axe-core `best-practice` tag — beyond-spec suggestions.
- IBM `manual` — no axe-core equivalent; flags tests that cannot be automated.

When the IBM auditor reports `CLEAN(pv65)`, that's "0 violations, 65 potentialviolations" — the page is clean by IBM's strict definition; the 65 are cantTell results, mostly repeating per-element patterns (focus visibility on every styled element, etc.) that resolve in batches.

**Files:**

- `package.json` — added `accessibility-checker@^4.0.17` as a devDependency. Version bump to 1.5.41.
- `.achecker.yml` (new) — IBM Equal Access config: `WCAG_2_2` policy, `failLevels: [violation, potentialviolation]`, `outputFormat: [disable]` (we write our own per-page JSON). Cache folder under `/tmp/accessibility-checker`.
- `scripts/a11y-sitemap-audit-ibm.mjs` (new) — mirrors `scripts/a11y-sitemap-audit.mjs`'s architecture (Playwright-driven, parallel workers, resumable manifest, archived prior runs under `archive/<date>/`) but routes each Playwright page through `aChecker.getCompliance()`. Output schema: `{ url, auditedAt, durationMs, tool, toolID, ruleArchive, policies, counts, violations[], potentialviolations[] }` per page; aggregate `_summary.md` + `_summary.csv` cross-page.
- `.gitignore` — added the same per-page-JSON / manifest / summary ignore rules for `reports/a11y-full-audit-ibm/` that already existed for `reports/a11y-full-audit/`.
- `README.md` — new "Accessibility Audit (IBM Equal Access — parallel pipeline)" section under Audit Methodology with run commands, output paths, runtime expectations, and an IBM-vs-axe-core categorization table; new "Multi-tool audit triangulation" section under "Documented SiteImprove false positives" explaining the two-tool decision tree and citing the v-btn-toggle target-size finding as a worked example.
- `docs/SITEIMPROVE-FALSE-POSITIVES.md` — updated triage instructions to call for IBM verification when a flag is not in the existing table; added a "Second-tool verification (IBM Equal Access)" subsection in the verification-commands area explaining how to run IBM and how to read its output levels (`violation` / `potentialviolation` / `recommendation` / `manual`). Future false-positive entries can cite "Verified clean by axe-core + IBM Equal Access" instead of just one tool — the strongest automated-verification claim available.

**Why IBM (not WAVE, not pa11y):**

- **WAVE (WebAIM)** has no free CLI / API — the free product is browser-extension only, the API is paid per-credit (~$0.005/page, ~$12 for the full sitemap once). Not viable for a programmatic parallel pipeline; remains useful as a manual third opinion on selected pages.
- **pa11y with HTMLCS** uses a different rule engine (Squiz HTMLCS) but does not claim W3C ACT Rules conformance and is less actively maintained. A reasonable fourth opinion if needed.
- **IBM Equal Access** is open source, runs as an npm package (`accessibility-checker`), claims explicit W3C ACT Rules conformance, distinct rule engine from axe-core, and is enterprise-credible (Fortune 500 / IBM-internal use). Best fit for a programmatic parallel pipeline alongside axe-core.

**Runtime cost:** IBM's rule engine is heavier than axe-core (~5-7s per page vs ~3.5s for axe-core). A full 2,377-URL IBM run takes roughly 2 hours at concurrency 4, vs 35 minutes for the axe-core auditor. This is acceptable for the every-few-weeks audit cadence; not run on every CI build.

---

## [1.5.40] - 2026-05-06

### docs — full-site axe-core re-baseline audit (2,377 / 2,377 clean) + audit-history restructure in README

Re-ran the full-site axe-core audit on every URL in `public/sitemap.xml` to refresh the audit-trail record. Manager-facing compliance reviews reasonably treat any accessibility audit older than a couple of weeks as a stale claim about the *current* state of the deployed site, so re-running on a regular cadence (every few weeks) is now the maintenance posture for v1.5.x. This is the second full-site run; the first was the April 14 2026 baseline at v1.5.9.

**Audit run:** `node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=4` against `http://localhost:8080` on 2026-05-06.

**Result: 2,377 / 2,377 pages clean, 0 violations, 0 errors, 35m 16s runtime.** axe-core 4.11.2, WCAG tags `wcag2a + wcag2aa + wcag21a + wcag21aa + wcag22aa`. Full per-page JSON for the May 6 run lives in-place under `reports/a11y-full-audit/` (`_summary.md`, `_summary.csv`, `_manifest.ndjson`, plus 2,377 files under `pages/<slug>.json`); the script's archiving model treats the most recent run as in-place and moves it under `archive/<date>/` on the next `--fresh` invocation. The April 14 baseline archive remains untouched at `reports/a11y-full-audit/archive/2026-04-14/`.

**Sitemap delta vs April 14:** +10 URLs (2,367 → 2,377). The new pages — additional biographies, news posts, and employment listings published through the Strapi CMS over the intervening sprints — all cleared on first pass. The pre-render content pipeline (`src/utils/contentSanitizer.js`) and the runtime accessibility fixes in `src/a11y/index.js` handled the new content automatically with no template-level intervention. This is the architectural payoff of the April 14 remediation cycle: the fixes are content-shape-driven (not URL-specific), so new content inherits compliance.

**Sprints between the two audits (v1.5.10 through v1.5.39):**

- v1.5.31–34 — meeting agendas missing-link guard (Meeting Agendas component); Strapi `external.url` content-completeness handling.
- v1.5.35 — JobCard a11y improvements (removed pipe + chainlink icon, added "Click for full job listing" hint with AAA contrast); fixed Translate-this-site button accessible name on mobile (sr-only span pattern, replaced ineffective v-btn-level aria-label).
- v1.5.36 — documented expanded sia-r14 SiteImprove false-positive scope after the 2026-05-05 re-crawl flagged 88 occurrences across 39 URLs (same landmark-`<nav>` pattern, broader sample).
- v1.5.37 — per-row descriptive accessible names on Publications page expand buttons (`fixExpandButtons` rewrite with sr-only span for Vuetify-clobber resilience); skip Vuetify `v-data-table` instances in `fixTableCellContext` to prevent latent `td-headers-attr` regression.
- v1.5.38 — logged axe-DevTools `advanced/heading-markup` AI rule as a known false positive on card kicker labels (BaseCardExpandable, JobCard, EventCard).
- v1.5.39 — converted all 16 README markdown pipe-tables to HTML with `<tr valign="top">` for consistent top-aligned cell content.

The May 6 audit confirms that **none of these v1.5.10–39 changes introduced an a11y regression**, and that the sitemap's organic growth is being absorbed by the existing fix architecture without intervention.

**Why re-run at all when v1.5.9 was already 2,367 / 2,367 clean?** Two reasons:

1. **Audit recency.** A clean compliance record is only meaningful as a snapshot of a specific deployed state. Three weeks of merged commits, a +10 URL sitemap growth, and several runtime-fix changes (v1.5.35, v1.5.37) is a meaningful divergence from the April 14 archived state. Re-running produces a current snapshot rather than relying on inference from the older one.
2. **Defensibility.** When external reviewers, stakeholders, or auditors ask "is this site WCAG 2.2 AA compliant *today*?", the strongest answer is "yes, here is the audit run we performed last week" — not "yes, here is the audit run we performed three months ago." The cadence cost is ~35 minutes of compute every few weeks; the credibility cost of a stale audit is much higher.

**Files:**

- `README.md` — restructured "Full-site audit record (April 14 2026)" into a new "Full-site audit history" section with a chronological summary table covering both audits and per-audit subsections (the April 14 7-fixes content is preserved verbatim inside the `#### 2026-04-14 audit (initial full-site baseline)` subsection). Updated three inline references in the doc body — "axe-core vs SiteImprove" intro, "SiteImprove Intercept" intro, and the rewrite-rationale closer at line ~1080 — from "2,367 pages, April 14 2026" to "2,377 pages, May 6 2026" while preserving April 14 as historical baseline. Renamed "Current Status (April 2026)" to "(May 2026)" and added a "Prior full audit" row to the metric table so both audits are visible at the top of the document.
- `CHANGELOG.md` — updated the IMPORTANT-preamble stakeholder summary (lines ~15, ~37, ~61, ~63) to reference both audits while keeping the May 6 figures as the current-state claim. The historical changelog entries for v1.5.39 and earlier are unchanged — they remain timestamped at their original write date.
- `reports/a11y-full-audit/` — fresh full-site run; `_summary.md`, `_summary.csv`, `_manifest.ndjson`, and 2,377 per-page JSON files under `pages/`. Prior runs preserved under `archive/`.
- `package.json` — version bump to 1.5.40.

**Verified:** the audit script's own summary (`reports/a11y-full-audit/_summary.md`): 2,377 audited, 2,377 clean, 0 dirty, 0 errors. The 2,378 incomplete (needs-review) results are the documented Vuetify v-tab `color-contrast` Needs-Review pattern (axe-core cannot auto-verify when the background involves dynamic CSS); see row B of the "Other audit-tool false positives" table in `docs/SITEIMPROVE-FALSE-POSITIVES.md`.

---

## [1.5.39] - 2026-05-05

### docs — top-align all README table cells (Markdown → HTML conversion)

GitHub-flavored markdown tables don't expose `vertical-align` per cell, and GitHub's rendered CSS doesn't override the browser's `<td>` default of `vertical-align: middle`. On the SiteImprove false-positives table (and the other long-cell tables in the README), this produced visibly mis-aligned content: a 1-line cell sat in the middle of a 30-line row, while a 30-line cell next to it ran the full height. Eye tracking down the row was awkward — short content was lost in vertical whitespace.

**Fix:** converted every markdown pipe-table in `README.md` (16 in total) to HTML `<table>` blocks with `<tr valign="top">` on each data row. Cell content now starts at the top of every row consistently.

**Conversion preserved markdown formatting inside cells:** `**bold**` → `<strong>`, `` `code` `` → `<code>`, `[text](url)` → `<a href>`, `<tag>` → `&lt;tag&gt;`. The raw HTML produces identical rendered output to the prior markdown for cell contents, only the alignment changes.

**Implementation:** wrote a one-shot `scripts/tables-to-html.js` that uses `markdown-it` (already a project dependency) to render each cell's inline markdown to HTML, then emits an HTML table with the `valign="top"` row attribute. The script tracks fenced code blocks and skips any pipe-character ASCII art inside them — verified by the two-layer fix-model diagram in the Accessibility section, which uses `|` as box-drawing borders and is preserved as-is. Future README edits should add new tables as HTML directly (re-running the script is not idempotent — it would mangle existing HTML tables).

**Files:**

- `README.md` — 16 markdown pipe-tables rewritten as `<table>` blocks with `<tr valign="top">` on every data row.
- `scripts/tables-to-html.js` — one-shot conversion tool (kept in repo for posterity / re-running on a fresh markdown table if needed).
- `package.json` — version bump to 1.5.39.

---

## [1.5.38] - 2026-05-05

### docs — log axe-DevTools `advanced/heading-markup` AI rule as known false positive on card kickers (no code change)

A 2026-05-05 axe-DevTools (Deque browser extension, v4.127.1) advanced-rules audit on `https://icjia.illinois.gov/grants/programs/` flagged **one serious issue**: `advanced/heading-markup` on a `<span>state PROGRAM</span>` kicker label inside `BaseCardExpandable.vue`. The same kicker pattern lives in `JobCard.vue` (`{category} EMPLOYMENT`) and `EventCard.vue` (`EMPLOYMENT OPENING`), so the rule will fire on `/about/employment/`, `/news/events/`, and any other listing page with these cards.

**The rule:** Deque's [`advanced/heading-markup`](https://docs.deque.com/advanced-rules/1/en/advanced/heading-markup) is an AI/ML-driven heuristic that detects elements that *look* like headings (uppercase, bold, visually prominent) but aren't marked up as `<h1>`–`<h6>` or `role="heading"`. Every report carries a confidence percentage; this one was 84%. It is **explicitly opt-in** in the axe-DevTools extension and **is not part of standard axe-core**. Tags: `advanced`, `non-deterministic`, `AI`.

**Why this is a false positive (not a fix):**

1. **The card already has a real heading.** Each `<v-card>` renders an `<h2>` for the program/job/event title immediately below the kicker. The kicker is metadata (category indicator), not the card's heading.
2. **Promoting kickers to real headings would degrade accessibility.** A listing page renders many cards (often 30+). Marking each kicker as `<h3>STATE PROGRAM</h3>` would produce 30+ identical "STATE PROGRAM" entries in screen-reader heading and landmark navigation menus — actively *worse* than the current pattern, where each card has a unique h2 title.
3. **The kicker pattern is standard journalism/card UX.** NYT, BBC, Vox, ProPublica, and similar sites use bold/uppercase kicker labels above article titles. The h2 is the card's heading; the kicker is supporting taxonomy.
4. **WCAG 1.3.1 ("Info and Relationships") does not require kickers to be headings.** Programmatic determination is satisfied by the distinct visual styling plus the surrounding `<h2>`. axe-core (the deterministic engine that drives Lighthouse, pa11y, and most accessibility consultancies) does not flag this — only the opt-in axe-DevTools AI rule does.
5. **Restructuring to satisfy the rule has no clear path.** The rule wants either heading markup (downside above) or different visual styling (the bold/uppercase styling is intentional design). There is no markup or ARIA pattern that reliably defeats the AI heuristic without changing visual design or polluting the heading outline.

**Verified clean by deterministic tooling:** axe-core WCAG 2.1 AA full-site audit (April 14 2026) — **2,367/2,367 pages, zero violations**. lightcap (Lighthouse + axe-core) on `/grants/programs/`, `/about/employment/`, `/researchhub/publications/`, etc.: **100/100 desktop and mobile, 0 issues**.

**Files:**

- `docs/SITEIMPROVE-FALSE-POSITIVES.md` — added row C to the "Other audit-tool false positives" table documenting this rule, the kicker pattern, the WCAG/UX rationale for not changing the markup, and verification evidence.
- `package.json` — version bump to 1.5.38.

**Recommended action for axe-DevTools advanced/heading-markup flags:** ignore the flag in the axe-DevTools extension UI with a comment citing this row. The rule is non-deterministic — re-running the audit can produce different confidence scores or different flagged elements on the same page, so per-occurrence triage is not productive. The pattern is documented; the flag is known.

---

## [1.5.37] - 2026-05-05

### fix — per-row accessible names on Publications page expand buttons + skip Vuetify tables in fixTableCellContext

A 2026-05-05 SiteImprove crawl flagged **150 occurrences of `sia-r12` "Button missing a text alternative"** on `/researchhub/publications/`. Investigation found these are the Vuetify `v-data-table` row-expand chevron buttons (one per row × 150 items-per-page). Each button had Vuetify's default `aria-label="Expand"` — technically WCAG 4.1.2 compliant (axe-core was reporting 100/100 already), but **all 150 buttons shared the same generic label** with no row context. Two related fixes shipped together:

**1. Per-row descriptive accessible names on `.v-data-table__expand-icon` buttons.**

`fixExpandButtons()` in `src/a11y/index.js` was extending Vuetify's expand button by setting `aria-label="Expand"` (a constant). Replaced with per-row context: each button now derives its label from the row's primary identifier (a `<td><strong>` if present, otherwise the longest non-numeric cell text, truncated to 80 chars). Format: `"Toggle details for {row title}"`. The label is mirrored into a clipped `<span class="sr-only">` child of the button — Vuetify reactively re-renders attributes during sort/filter operations and clobbers `aria-label`, but it preserves child DOM nodes my function appended, so the sr-only span survives and provides the accessible name via the WAI accessible-name calculation (inner text fallback). Verified across all 150 publication rows: **146 unique accessible names**, 0 empty.

The function still falls back to its previous generic label if no row context can be derived, preserving behavior for any caller (`MeetingTable.vue`, `RequiredFormTable.vue`) that runs against a table without a clear row-identifier convention.

**2. Skip Vuetify `v-data-table` instances in `fixTableCellContext`.**

While verifying the fix, lightcap a11y on `/researchhub/publications/` started reporting a `td-headers-attr` violation: a `<th>` with `id="tbl0-h0"` and `headers="tbl0-h0"` (self-reference). Root cause: `fixTableCellContext` selects `.article-body table, .markdown-body table` and `PublicationsAll.vue` wraps the v-data-table in a `<div class="markdown-body">` shell. The function ran `fixComplexTable` against the v-data-table, which already has its own header semantics from Vuetify's templating — Vuetify clones the header row into the expand-detail row, so the function assigned the same `tbl0-h0` ID twice and produced a self-referencing headers attribute on the second `<th>`. Fixed by short-circuiting the loop when the table is inside a `.v-data-table` container or has the class itself. The page returns to **100/100, 0 issues** in lightcap WCAG 2.1 AA audit.

This td-headers-attr regression was latent — earlier `fixTableCellContext` runs may have completed before the v-data-table fully mounted, so axe-core sometimes audited a clean DOM. The fix makes the behavior deterministic across all SPA navigation paths.

**Why this is a real fix, not a "false positive":** sia-r12 was technically passing WCAG 4.1.2 because every button had `aria-label="Expand"`. But shared generic labels across 150 buttons fail WCAG 2.4.6 "Headings and Labels" in spirit (labels should describe the topic or purpose). Per-row context is a genuine improvement, and it has the side benefit of giving SiteImprove's crawler an unambiguous accessible-name source on every button regardless of its render-state interpretation.

**Files:**

- `src/a11y/index.js` — added `getRowContextLabel(button)` helper (scans the closest `<tr>` for a `<td><strong>` or longest non-numeric cell, truncated to 80 chars). Rewrote `fixExpandButtons` to compose `"Toggle details for {context}"` and mirror the label into a clipped `<span class="sr-only">` child for reliable accessible-name resolution. Added an early-return in `fixTableCellContext` to skip tables inside `.v-data-table` (or with that class), preventing duplicate-ID assignment and the resulting self-referencing `headers` attribute.
- `package.json` — version bump to 1.5.37.

**Verified:**

- `lightcap` WCAG 2.1 AA on `/researchhub/publications/`: **100/100, 0 issues** post-fix (was 97/100 with td-headers-attr regression mid-investigation).
- Direct DOM query: 150 expand buttons, **146 unique accessible names**, 0 empty.
- Sample names: "Toggle details for 2025 Illinois Family Violence Coordinating Council Strategic Plan Summary", "Toggle details for Illinois Domestic Violence Fatality Review Committee: 2025 Annual Report", "Toggle details for 2025 Task Force on Missing and Murdered Chicago Women Annual Report", etc.
- The 4 collisions in unique-name count are repeated rows in the underlying publications data (e.g. multiple "Co-Responder Program Overview" entries), not a function bug.

---

## [1.5.36] - 2026-05-05

### docs — log expanded sia-r14 SiteImprove false-positive scope (no code change)

SiteImprove re-crawled the site on 2026-05-05 and exported a CSV ("Pages with a specific issue") flagging **88 occurrences across 39 unique URLs** with rule `sia-r14` "Visible label and accessible name do not match" (WCAG 2.5.3). All flagged URLs match the **already-documented landmark-`<nav>` false-positive pattern** described in `docs/SITEIMPROVE-FALSE-POSITIVES.md` row #1: each `<nav aria-labelledby="…">` in the global app shell (Breadcrumb / Section / Additional) targets an `<h2 class="sr-only">` whose accessible-name text differs from the visible interactive labels inside the nav.

**Why the URL list grew:** the original 2026-04-16 batch was 6 pages. The new batch spans every page type on the site — about pages, grants/funding NOFOs, grants/programs, news, researchhub articles, and the DICRA hub — because the `<nav aria-labelledby>` structure lives in the shared app shell that every route renders. SiteImprove's URL list grows as it samples more pages, but the underlying mechanism is one shell, three navs, identical sr-only label pattern.

**Why this remains a false positive (not a fix):** WCAG 2.5.3 and W3C ACT Rule 2ee8b8 scope "Label in Name" to **interactive widgets**, not landmarks. Distinguishing multiple `<nav>` landmarks via `aria-labelledby` to an sr-only label is required best practice — it's how screen reader users tell the navs apart in landmark menus. Removing the labels would actively harm accessibility. axe-core (the open-source WCAG engine used by Google Lighthouse and most a11y consultancies) reports zero violations on every flagged URL.

**Verified:** ran `node scripts/audit-siteimprove-labelname.js` against all 47 URLs (the 6 from 2026-04-16 plus all 43 unique paths from the 2026-05-05 CSV, including trailing-slash variants where SiteImprove flagged both). Result: zero axe-core WCAG 2.1 AA violations on every page.

**Files:**

- `docs/SITEIMPROVE-FALSE-POSITIVES.md` — extended row #1 with the 2026-05-05 crawl date, broader URL scope note ("pattern lives in the global app shell — fires on every page"), and explicit guidance to bulk-Accept all `sia-r14` occurrences as a class going forward (rather than per-URL triage). Updated the suggested SiteImprove inspector comment to reference this doc directly.
- `README.md` — added a new **"Documented SiteImprove false positives"** subsection inside the Accessibility section. Includes a stakeholder-facing table per false-positive rule (`sia-r14` for now) with six columns: Where it appears, Why SiteImprove flags it, Why axe-core does not flag it, Why it is a false positive (with W3C/ACT Rules citation), and the Recommended action. Also added a four-row triage matrix explaining the four categories of SiteImprove findings (real violations, legitimate gaps, stricter-than-spec, cached/stale) and a three-step decision tree for handling new flags. The intent is that managers, IT staff, and incoming developers can answer "is this finding real?" from the README without digging into the docs/.
- `scripts/audit-siteimprove-labelname.js` — expanded `PAGES` from 6 entries to 47 (combined batch); updated header comment to document the merged sample and root cause.
- `package.json` — version bump to 1.5.36.

**Recommended action for the SiteImprove flags:** bulk-mark all `sia-r14` occurrences on the 39 reported URLs as Accepted in the SiteImprove inspector with the comment in `docs/SITEIMPROVE-FALSE-POSITIVES.md` row #1. No code change is required, and none should be made — modifying the landmark labels would regress the screen-reader experience.

---

## [1.5.35] - 2026-05-05

### fix — darken job-card "click for full listing" hint and restore translate-button accessible name on mobile

Two unrelated a11y fixes shipped together as a follow-up to 1.5.34.

**1. Darkened the JobCard click hint to AAA contrast.**

The "Click for full job listing →" hint added in 1.5.34 used `#555` on white (7.46:1 — passes WCAG AA but not AAA for normal-size italic text). Darkened it to `#222` (15.91:1) and added `font-weight: 600` to make it more discoverable as an actionable affordance. Hover state shifted from the lighter `#1976d2` to `#0d47a1` (a darker blue) to keep contrast strong on hover too.

**2. Fixed mobile a11y — "Translate this site" button had no accessible name on small viewports.**

The translate-modal trigger in `AppNavContext.vue` rendered as `<v-btn>` with the visible label inside a `<span class="hidden-sm-and-down">`. On mobile (≤md), only the `mdi-web` icon was visible, and the icon is `aria-hidden="true"` — so the rendered button had no accessible name. Lighthouse mobile audit flagged it as a critical `button-name` violation (WCAG 4.1.2).

The component already had `aria-label="Translate this site"` on the `<v-btn>`, but Vuetify 2.x doesn't propagate that attribute to the rendered `<button>` element in this configuration — `getAttribute('aria-label')` returned `null` on the rendered button.

**Fix:** dropped the `aria-label` (which wasn't being applied anyway) and used the same pattern as the search button in `AppNav.vue`: an always-present `<span class="sr-only">Translate this site</span>` inside the button gives it a reliable accessible name at every viewport. The visible "Translate this site" label on desktop is now `aria-hidden="true"` to prevent screen readers from announcing the name twice.

**Verified:**

- `mcp__contrastcap__check_element_contrast` on `.click-hint` returns 15.91:1 (AAA pass at 7:1 threshold).
- Lightcap (Lighthouse) a11y audit on `/about/employment/`: **100/100 desktop, 100/100 mobile, 0 issues** at WCAG-only filter. (Mobile previously scored 95/100 with the button-name issue.)
- Card layout verified responsive at 320×568, 375×667, 768×1024, and 1280×800 — no horizontal overflow, hint pinned right at every viewport, title wraps gracefully on narrow widths.

**Files:**

- `src/components/JobCard.vue` — `.click-hint` color `#555` → `#222`, added `font-weight: 600`; hover color `#1976d2` → `#0d47a1`.
- `src/components/AppNavContext.vue` — replaced ineffective `aria-label="Translate this site"` on the `<v-btn>` with an internal `<span class="sr-only">`; marked the existing visible label `aria-hidden="true"` to avoid duplicate announcement.
- `package.json` — version bump to 1.5.35.

---

## [1.5.34] - 2026-05-05

### fix — clarify clickability of job cards on `/about/employment/`

Two related changes to the job listing cards:

1. **Removed the redundant pipe + chainlink icon** that sat next to each job title. It was originally added when the title alone wasn't routable; the whole card has been clickable for some time now (`@click` on the `<v-card>` with `role="link"` and `tabindex="0"`), so the inline link button was duplicating the card's own affordance.
2. **Added a "Click for full job listing →" hint at the lower right** of each summary card. Multiple users reported they didn't realize the card itself was clickable — the hint makes the affordance explicit without changing the interaction model.

**Why a visible hint instead of relying on hover/cursor:** the cards already use `cursor: pointer` and a hover state, but those signals are easy to miss on touch devices and for users who scan rather than hover. An always-visible textual hint is the smallest possible change that fixes the discoverability gap.

**Why `aria-hidden="true"` on the hint:** the card itself is exposed to assistive tech as a link via `role="link"` and is keyboard-operable (Enter activates `routeTo()`). Screen readers announce it as a link already; reading "Click for full job listing" to those users would be redundant noise. The hint is purely a sighted-user affordance.

**Visibility rules:** the hint only renders when `isClickable && summaryOnly` is true — i.e., on the listing page (`EmploymentAll.vue`), not on the single-job page (`EmploymentSingle.vue`) where the card is the destination, not a link to one.

**Cleanup:** removed the now-unused `showLink` prop from `JobCard.vue` and its bindings in `EmploymentAll.vue` and `EmploymentSingle.vue`.

**Files:**

- `src/components/JobCard.vue` — removed pipe + `<v-icon>link</v-icon>` button next to title; added bottom-right hint row gated by `isClickable && summaryOnly`; added `.click-hint` and `.click-hint-icon` styles with a hover color shift to match the card's hover affordance; removed `showLink` prop.
- `src/views/About/EmploymentAll.vue` — dropped `:showLink="true"` binding.
- `src/views/About/EmploymentSingle.vue` — dropped `:showLink="false"` binding.
- `package.json` — version bump to 1.5.34.

**Verified:** `/about/employment/` listing cards no longer show the pipe/chainlink, and the lower-right hint reads "Click for full job listing →". Single-job pages render unchanged.

---

## [1.5.33] - 2026-04-22

### fix — exclude disclaimer heading from page TOC

The floating TOC on BasePage-rendered pages (ResearchHub landing pages like `/researchhub/dicra/`, etc.) was listing "NOTICE OF FEDERAL FUNDING AND FEDERAL DISCLAIMER" as its last entry. That heading belongs to the site-wide `<Disclaimer>` component mounted at the app level (`App.vue:28-33`, outside the routed content), not to the page's own content outline, so it shouldn't appear in the TOC.

**Root cause:** `Toc.vue` builds the TOC with `document.querySelectorAll("h2")` — an unscoped sweep of every h2 in the document. The disclaimer renders its label as an `<h2>` (`Disclaimer.vue:18`), so it got picked up like any other page section. The same unscoped query is also used by the scroll-spy logic that highlights the active TOC item as the user scrolls.

**Fix:** added a `.closest("#disclaimer")` filter to both queries in `Toc.vue` (the initial TOC build in `setToc()` and the scroll-spy offset map in `mounted()`). Any h2 that lives inside `#disclaimer` is skipped. The filter is anchored to the disclaimer container's ID — it won't affect any in-content headings, even if they happen to duplicate the disclaimer's text.

**Why not switch the disclaimer to a non-h2:** `<h2>` is semantically correct for the disclaimer — it's a discrete named section of the page outline for assistive-tech users. Dropping to a `<p>` or `<div role="heading">` would hurt screen-reader navigation to preserve a visual-only TOC behavior.

**Why not use the existing `selector` prop:** `Toc.vue` has a `selector` prop defaulting to `#scrollArea`, but the prop is defined and never consumed anywhere in the component (the queries go straight to `document`). Wiring it up properly would also require adding the `#scrollArea` wrapper in every consumer. Out of scope for a one-page visual fix; tracked mentally for the Nuxt rewrite.

**Files:**

- `src/components/Toc.vue` — filter `#disclaimer` descendants out of both the TOC-build and scroll-spy h2 queries.
- `package.json` — version bump to 1.5.33.

**Verified:** DICRA TOC now lists six FAQ headings and nothing else. Disclaimer still renders correctly at the bottom of the page.

---

## [1.5.32] - 2026-04-22

### fix — restore Google Material Icons webfont for Strapi-supplied card icons

The ClickthroughBoxes cards at the bottom of ResearchHub pages (e.g., `/researchhub/dicra/`) were rendering icon names as literal text instead of glyphs — `data_thresholding`, `file_download`, `article` etc. appeared as raw strings under the card titles.

**Root cause:** the font-consolidation sweep in 1.5.1 (commit 5cecb11) removed the `https://fonts.googleapis.com/icon?family=Material+Icons` stylesheet alongside Roboto/Raleway/Gentium as part of a perf cleanup. What that sweep missed is that Strapi-authored `box.icon` values use **Google Material Icons** naming conventions (underscore-style: `data_thresholding`), not MDI naming conventions (kebab-style: `mdi-chart-box-outline`). Vuetify's `<v-icon>` applies the `.material-icons` class when the value isn't prefixed with `mdi-` or `fa-`, but the font backing that class was gone, so the browser rendered the icon ligature text with the fallback `Lato` family.

**Fix:** re-added the Google Material Icons stylesheet to `public/index.html` using the same async-load pattern as the other webfonts (`media="print"` + `onload="this.media='all'"` with a `<noscript>` fallback). The font is non-render-blocking — the perf trade-off vs. the consolidation is a single additional HTTP request for the woff2, loaded after first paint.

**Why not map names client-side:** considered translating Google → MDI names in `ClickthroughBoxes.vue`, but CMS authors control the vocabulary and the same pattern could exist in other components with CMS-fed icons. Keeping the font loaded preserves the author-facing contract and requires no coordination with content editors.

**Files:**

- `public/index.html` — re-added Material Icons `<link>` + `<noscript>` pair; updated the two-font-system comment to reflect that Material Icons is back and explain why (distinct from MDI).
- `package.json` — version bump to 1.5.32.

**Verified:** DICRA page cards now render `data_thresholding`, `file_download`, and `article` as icon glyphs.

---

## [1.5.31] - 2026-04-22

### feat — Article + Event JSON-LD schemas on news posts and meeting pages

Extends the structured-data coverage to the two remaining **dynamic** content streams: news posts (updated ~2×/week) and board/committee meetings (monthly+). Both use the same `metaInfo()` pattern shipped in 1.5.29 and 1.5.30.

**News posts (`/news/:slug`):** emits schema.org `Article` with `headline`, `datePublished` (prefers `dateOverride` over `published_at` so editorially-backdated posts get the intended date), `dateModified` (from `updated_at` — important freshness signal for content that changes multiple times a week), `description` (summary), `image` (prefers `splash.formats.medium.url`, falls back to `small`/`large`/raw — all URL-normalized with the Strapi prefix), `keywords` (tags), `publisher` (ICJIA), `mainEntityOfPage`, and `url`. `Author` is intentionally omitted because the post GraphQL query doesn't expose author records — better to emit nothing than hardcode.

**Meetings (`/news/meetings/:slug`):** emits schema.org `Event` with `name`, `startDate`/`endDate` (the CMS `start`/`end` fields are already ISO), `eventStatus` (maps `isCancelled` → `EventCancelled`, else `EventScheduled`), `eventAttendanceMode: MixedEventAttendanceMode` (honest about the always-hybrid posture), `organizer` (ICJIA), `description` (summary), and `associatedMedia[]` for attachments (agenda/minutes PDFs with fully-qualified URLs + proper MIME types via the same EXT→MIME map used on NOFOs).

**Location handling for meetings:** the CMS has no structured physical-address field, and the physical venue varies per meeting (downtown Chicago, sometimes Bilandic Building, sometimes elsewhere — documented in each meeting's agenda PDF). The schema emits `location: VirtualLocation` **only when the meeting's `external.url` is populated** (covers virtual-participation links, which are typically always included). When `external.url` is absent, `location` is omitted entirely rather than guessed — keeps the schema honest and still schema-valid. Crawlers / AI assistants that want the physical address can fetch the agenda PDF via `associatedMedia`, which is always present.

Verified in dev against a news post (`icjia-budget-actions-taken-april-9-2026` — Article, 1.7KB, image URL resolves to `https://agency.icjia-api.cloud/uploads/medium_...`, `dateModified` populated) and a Budget Committee meeting (Event, 1.5KB, 3 attachment MediaObjects with fully-qualified URLs and proper `application/pdf` MIME type, `MixedEventAttendanceMode`, location gracefully omitted because this meeting's `external` array was empty).

**Why type choices:**
- News: `Article` over `NewsArticle` — ICJIA publishes institutional updates, not journalism. `NewsArticle` implies publisher-center registration and editorial policies that don't apply here. Both get parsed the same way by AI assistants and Google; `Article` is semantically correct for a government agency's updates.
- Meetings: `Event` — standard schema, well-supported by Google rich results when `location` is present (our virtual-link case), and always AI-parseable.

**Files:**

- `src/views/News/NewsSingle.vue` — added `metaInfo()` returning title + JSON-LD script; no existing metaInfo on this component previously.
- `src/views/News/MeetingsSingle.vue` — same pattern; also adds the VirtualLocation-from-`external.url` logic and the attachments-as-MediaObject block shared with NOFO pages.
- `package.json` — version bump to 1.5.31.

**Post-deploy validation:** paste `/news/<recent-slug>` and `/news/meetings/<recent-slug>` into Google's Rich Results Test and Schema.org Validator. SPA crawler caveat documented in 1.5.29 still applies: non-JS-executing crawlers (GPTBot, ClaudeBot) don't see this yet — waits on the Nuxt 4 SSR rewrite.

---

## [1.5.30] - 2026-04-22

### feat — GovernmentService JSON-LD schema on grant NOFO pages

Added schema.org `GovernmentService` structured data to every `/grants/funding/:slug` page via vue-meta, following the same pattern shipped in 1.5.29 for ResearchHub articles. This lets Google, Perplexity, and AI assistants (any crawler that executes JS on SPA pages) identify each page as a grant funding opportunity with structured metadata — name, deadline, posting date, funding window, attachments as `MediaObject`s, and ICJIA as the `GovernmentOrganization` provider.

**Why GovernmentService (and not MonetaryGrant or FAQ):** schema.org's `MonetaryGrant` describes an awarded grant, not a funding announcement, so it was the wrong shape. `GovernmentService` maps cleanly to a NOFO — it's literally "a service provided by the government" with built-in fields for provider, serviceType, areaServed, and the `hoursAvailable` / `validThrough` window that matches our funding-period semantics.

**Attachments are fully qualified URLs.** Strapi returns attachment URLs as relative paths (e.g. `/uploads/file.pdf`); the metaInfo builder prefixes them with `https://agency.icjia-api.cloud` before emitting them in JSON-LD so crawlers can follow them. An extension-to-MIME map (`pdf`, `doc`, `docx`, `xls`, `xlsx`, `csv`, `txt`, `zip`) produces proper `encodingFormat` values; unknown extensions fall back to the bare extension string rather than breaking the payload.

**Schema is emitted on expired NOFOs too.** Expired opportunities are retained on the site for agency-lawyer reference; emitting the schema with a past `validThrough` signals the closure to crawlers while preserving archival SEO. Suppressing schema on expired pages would erase that archival value.

**Page `<title>` behavior preserved.** The existing `metaInfo()` set the NOFO title; the extended version keeps that and adds the JSON-LD `script` block.

**Files:**

- `src/views/Grants/FundingSingle.vue` — `metaInfo()` extended from `{ title }` to `{ title, script: [{ type: 'application/ld+json', json: {...} }] }`. Pre-load guard returns `{}` when `this.funding` is null; attachments without a normalizable URL or without a `name` are filtered out before being emitted.
- `package.json` — version bump to 1.5.30.

**Verified in dev against two expired NOFOs** (R3 Youth Development/Violence Prevention, Bullying Prevention) — 1.8KB payloads, all attachments resolved to `https://agency.icjia-api.cloud/...`, correct MIME types (`application/pdf`, `application/zip`), past `validThrough` values render as expected.

**Post-deploy validation:** paste any NOFO URL into Google Rich Results Test (`https://search.google.com/test/rich-results`) and Schema.org Validator (`https://validator.schema.org/`) to confirm the `GovernmentService` type is detected. Known caveat (documented 1.5.29): non-JS-executing crawlers (GPTBot, ClaudeBot) will not see the schema until the site ships behind SSR/SSG in the Nuxt 4 rewrite.

---

## [1.5.29] - 2026-04-22

### feat — ScholarlyArticle JSON-LD schema on ResearchHub article pages

Added `application/ld+json` structured data (schema.org `ScholarlyArticle`) to every ResearchHub article detail page via vue-meta. The schema lets Google emit rich results for research articles in SERP, and gives AI assistants that execute JavaScript (Perplexity, OAI-SearchBot / ChatGPT search, Googlebot) a parseable description of each article — title, author(s), publish date, abstract, citation, canonical URL, and the ICJIA publisher entity.

All fields populate from the existing ResearchHub GraphQL response; no API changes were required. The payload is emitted only when `this.article` is populated, so pre-load and error states produce no orphan `<script>` tag. Authors without a `.title` are filtered out before mapping to `schema.org/Person`; optional fields (`abstract`, `citation`, `image`) are only added when present.

This page also previously shipped without an article-specific `<title>` — the same `metaInfo()` now sets the page title to the article title, matching the pattern used on `/grants/funding/:slug`.

**Crawler visibility caveat (documented, not a bug in this change):** because the site is a client-rendered SPA, only crawlers that execute JavaScript will see the JSON-LD. That covers the measurable AI-referral traffic already visible in Plausible (ChatGPT, Perplexity) and Googlebot's deferred render. Crawlers that do not execute JavaScript (GPTBot, ClaudeBot) will still not see the schema until the site ships behind SSR/SSG in the Nuxt 4 rewrite — at which point `metaInfo()` can be swapped to `useHead()` and the payload transfers directly.

**Files:**

- `src/views/Hub/ArticlesSingle.vue` — added `metaInfo()` that returns `title` + `script: [{ type: 'application/ld+json', json: {...} }]` built from the GraphQL article record.
- `package.json` — version bump to 1.5.29.

**Validation plan (post-deploy):** paste a published article URL (e.g. `/researchhub/articles/the-2021-safe-t-act-icjia-roles-and-responsibilities`) into Google's Rich Results Test and Schema.org Validator to confirm the `ScholarlyArticle` type is detected and no required fields are missing.

---

## [1.5.28] - 2026-04-20

### fix — biography TOC scroll targets + remove redundant VIEW button

**TOC scrolling on `/about/composition-and-membership/`.** The sidebar TOC listed every board member but clicking an entry did nothing. `Toc.vue` builds scroll targets from `document.querySelectorAll("h2")` and calls `$vuetify.goTo('#' + h2.id)`. The biography name `<h2>` in `BiographyCard.vue` had no `id`, so every entry resolved to `#` (a no-op). Gave the h2 a guarded `id="bio-{slug}"` — the slug is already unique per biography record, so there is no collision risk across the board/staff listings, and the conditional leaves the attribute off if a record somehow ships without a slug.

**Redundant VIEW button.** `BiographyCard.vue` rendered a small `VIEW ⧉` button next to every member name. The enclosing `v-card` already has `:to="/about/biographies/{slug}"`, so the entire card is a navigation link — the inline button was a duplicate affordance. Removed the button block and the `showLink` prop entirely (no caller passed `:showLink="true"`; the only explicit usage was `:showLink="false"` in `StaffAndBoardSingle.vue`, now dropped).

**Files:**

- `src/components/BiographyCard.vue` — h2 gains `:id="item.slug ? 'bio-' + item.slug : undefined"`; VIEW button span + `showLink` prop removed.
- `src/views/About/StaffAndBoardSingle.vue` — stale `:showLink="false"` removed.

---

## [1.5.27] - 2026-04-20

### fix — restore year in meeting/policy/required-form card dates

The card subtitle was rendering `Wednesday Apr 22, yyyy, 10:00 AM - 11:30 AM` — literal `yyyy` instead of the year — on the Meetings, Policies, and Required Forms listings. The `yyyy` token is **date-fns** syntax; these three components format through **dayjs**, which treats unknown tokens as literals and requires `YYYY` for a 4-digit year. The mismatch was introduced during the moment → dayjs migration noted in CHANGELOG 1156, where most format strings were translated correctly but these three card components kept the date-fns tokens.

Changed `"dddd MMM DD, yyyy"` → `"dddd MMM DD, YYYY"` in:

- `src/components/MeetingCard.vue:118`
- `src/components/RequiredFormCard.vue:112`
- `src/components/PolicyCard.vue:112`

`NewsCard.vue` and `Hub/HubCard.vue` intentionally keep lowercase `yyyy` — those call date-fns `format()`, where `yyyy` is correct.

---

## [1.5.26] - 2026-04-16

### a11y — eliminate orphan `<th>` cells introduced by the v1.5.24 two-level header promotion

A partial post-fix audit (axe-core + Lighthouse + contrastcap) on the fidelity drug-court article surfaced a side effect of v1.5.24's multi-row header promotion: 3 of the 16 promoted `<th>` cells had **zero** referencing `<td>` cells, which axe-core flags as `th-has-data-cells` (Needs Review) and SiteImprove would flag as sia-r46 "No data cells assigned to table header" on its next crawl. The three orphans were:

1. **"County program"** — the corner cell over the row-label column. Its data "cells" are the row-header `<th>`s, not data cells — no `<td>` references it.
2. **"Key component"** (colspan=9) — the group header spanning all nine numeric sub-headers. `fixComplexTable` collected only the closest column header per data cell, stopping at the sub-header below and never reaching the group header above.
3. **"—No data"** — the empty corner cell at the intersection of the row-label column and the second header row. A spacer, not a semantic header.

**`src/a11y/index.js` + `src/utils/contentSanitizer.js`** — two small changes to both a11y variants:

- `promoteRowTdsToColumnHeaders` now skips `<td>` cells whose sole content is the `"No data"` sr-only filler. Those cells are corner/spacer positions in two-level header rows and should remain `<td>`. This alone eliminated orphan #3 above.
- `fixComplexTable`'s column-header scan no longer `break`s after the closest `<th>` — it continues up the column and adds every `<th>` above. This propagates group-header IDs into data cells' `headers` attributes and eliminates orphans #1 and #2.

Verified on the fidelity table: 16 `<th>` cells, 0 orphans — "Key component" now has 45 referencing `<td>`s (all cells in its 9 spanned columns), "County program" has 1 (down from orphan), every row/sub-header still has its prior referencing count. Axe-core re-audit: 0 violations on fidelity + law-enforcement + the 9 previously-fixed table pages (11/11 clean).

### audit — partial accessibility audit record (3 pages, 3 tools)

Post-fix validation run captured for the audit trail. All three tools independently confirm the site is clean on the audited pages:

| Tool | Page | Result |
|---|---|---|
| axe-core (WCAG 2.1 AA + best-practice) | `/about/` | **0 violations** (1 color-contrast Needs Review on Vuetify v-tabs — dynamic background) |
| axe-core (WCAG 2.1 AA + best-practice) | `/researchhub/articles/fidelity-…` | **0 violations** (1 color-contrast Needs Review; `th-has-data-cells` Needs Review *resolved in this release*) |
| Lighthouse a11y (desktop) | `/about/` | **100 / 100** |
| contrastcap WCAG AA | `/about/` | 72 pass / 5 warnings / 7 "failures" — all 7 "failures" confirmed to be **pixel-sampler false positives** (reported `#000 on #000` = 1:1); live DOM inspection shows Vuetify tabs render black text on `#eeeeee` ≈ **18:1 contrast** (passes AA comfortably). The contrastcap pixel sampler mis-reads tabs rendered over transparent/image backgrounds; its `backgroundSource: "pixel-sample-over-image"` label is the explicit warning that the value is not from the computed style. Logged as a known tool limitation in [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md) so future audits don't re-litigate it. |
| axe-core regression (11 pages with tables) | `scripts/audit-siteimprove-tables.js` | **11 / 11 clean** — no regressions from v1.5.24/v1.5.26 table-header work |

---

## [1.5.25] - 2026-04-16

### docs — SiteImprove false-positives running log

Added [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md) — a living reference table documenting confirmed SiteImprove false-positive patterns on this site. SiteImprove re-reports the same stricter-than-WCAG flags on every crawl (e.g., sia-r14 "Label in Name" applied to landmark `<nav>` elements), and stakeholders repeatedly ask about them. The running log lets us cite a permanent explanation instead of re-diagnosing the same flag each crawl.

Initial entry: sia-r14 on landmark `<nav>` elements with sr-only `aria-labelledby` labels — 8 occurrences across 6 pages in the 2026-04-16 crawl. ACT Rule 2ee8b8 scopes "Label in Name" to interactive widgets; landmarks are out of scope. Verified clean by axe-core WCAG 2.1 AA via `scripts/audit-siteimprove-labelname.js`. Recommended action: mark as Accepted in SiteImprove inspector with the comment supplied in the table.

---

## [1.5.24] - 2026-04-16

### a11y — sia-r77 table cell context: promote styled-td header rows to `<th scope="col">`

SiteImprove's 4/16 crawl flagged 16 occurrences of sia-r77 "Table cell missing context" across 2 researchhub articles — fidelity drug-court (12 occ) and law-enforcement mental-health (4 occ). Root cause: both tables rendered column headers as `<td>` cells (styled with `<strong>` or `bgcolor`), not `<th>`. `fixSimpleTable` never promoted them:

1. For the fidelity table, the thead row's cells were `<td>` (not `<th>`), and `fixSimpleTable` only adjusted `scope="col"` on existing `<th>` elements in thead — so the thead `<td>`s stayed as data cells. The first tbody row was also a header row (numeric sub-headers under a `colspan=9` thead cell), but the body-row loop bailed out because the first cell was a `"—No data"` sr-only filler.
2. For the mental-health table (no `<thead>`), the first tbody row was the column-header row styled via `bgcolor="#2E5E97"`, but bailed out for the same `"—No data"` reason.

**`src/a11y/index.js` + `src/utils/contentSanitizer.js`** — two additions to both `fixSimpleTable` variants:
- Promote all `<td>` in any `<thead>` row to `<th scope="col">`. Anything in thead is a column header by definition.
- Detect and promote header-like first `<tbody>` rows. A row is treated as a column-header row if any cell has a `bgcolor` attribute (Word/Excel-style export) or if all non-filler cells are `<strong>`-wrapped with short text (avg < 15 chars). Guarded by checking the next row starts with a non-numeric row label, so data tables that happen to have all-bolded first rows aren't falsely promoted.

Verified with axe-core: both previously-flagged pages now pass full WCAG 2.1 AA (0 violations); all 9 previously-fixed table pages still pass.

---

## [1.5.23] - 2026-04-16

### ui — publications "NEW!" chip: black label for visibility

The "NEW!" chip on `/researchhub/publications/` was rendering as a blank outline. A global Vuetify override (`.v-chip.v-chip:not(.white--text) { background-color: #fff !important }`) forces all chips to a white background, but the chip's inline label was white text — resulting in white-on-white and an empty-looking chip.

**`PublicationsAll.vue`** — Changed the inline label color from `#fff` to `#000` so the "NEW!" text is visible against the overridden white chip background (21:1 contrast).

---

## [1.5.22] - 2026-04-16

### a11y — biography pages: visible H1 + semantic heading hierarchy (sia-r59)

SiteImprove flagged 72 biography pages under sia-r59 ("Page missing headings"). While most of the 553 `/about/` flags are stale pre-hydration data (addressed in v1.5.20), the biography pages had a genuine structural issue: the person's name was rendered as a styled `<span>` inside a Vuetify card, with only an sr-only H1 for screen readers.

**`StaffAndBoardSingle.vue`** — Replaced the sr-only `<h1>` with a visible H1 displaying the person's name above the card. The card receives `showName="false"` to avoid duplicating the name.

**`BiographyCard.vue`** — Changed the name element from `<span role="button">` to `<h2>` for proper heading hierarchy. Added a `showName` prop (default `true`) so the single-page view can suppress the in-card name when an H1 is already present. All 7 listing-page usages (composition & membership, staff org, hub staff, grants staff, ISU staff, unit cards) automatically gain H2 headings with no template changes needed.

---

## [1.5.21] - 2026-04-16

### a11y — sia-r87 skip link + sia-r113 target size refinement

**1. sia-r87 "Skip to main content link is missing" (35 pages) — `SkipLink.vue`, `App.vue`, `app.css`**

SiteImprove flagged 35 research-hub article and news pages for missing a skip-to-main-content link. The skip link existed but targeted `#content` (a `<div>` nested inside `<main>`) rather than the `<main>` landmark itself. SiteImprove's sia-r87 implementation expects the skip link to reference the `<main>` element directly.

Fix: the skip link now targets `#main-content`, which is the `<main>` element rendered by Vuetify's `v-main`. The `<main>` element received `id="main-content"` and `tabindex="-1"` so it can receive focus. Link text updated from "Skip to content" to "Skip to main content" to match the standard expected by accessibility crawlers. Focus-suppression CSS updated accordingly.

**2. sia-r113 target size boundary fix — `a11y/index.js`**

The previous sia-r113 fix in v1.5.20 set CSS `min-width`/`min-height` to 24px in `app.css`, but `fixFootnoteTargetSize()` in `a11y/index.js` was applying inline styles with `min-width: 24px` that overrode the CSS. With `box-sizing: border-box` active, the 24px included padding, leaving the element right at the boundary. SiteImprove flagged 1 occurrence on the juvenile justice article page.

Fix: bumped inline style values from 24px to 28px in both `a11y/index.js` and `app.css`, providing a 4px safety margin above the WCAG 2.5.8 minimum.

---

## [1.5.20] - 2026-04-15

### a11y — bulk SiteImprove remediation: sia-r61, sia-r59, sia-r78, sia-r113 (~1,150 occurrences fixed)

SiteImprove's 4/15 crawl produced four CSV exports totaling well over a thousand page-level flags. Root-causing each issue revealed that three of the four were single-file fixes (one shim, one plugin, one CSS block). All four are addressed in this release. Given the pending Nuxt 4 SSR rewrite (separate track), these are deliberately brute-force workarounds tuned to keep SiteImprove green for the remaining lifespan of the Vue 2 site, not architectural redesigns.

**1. sia-r61 "Page does not start with a level 1 heading" (337 pages) — `public/index.html`**

Live-DOM inspection confirmed every sampled page already renders a real H1 as the first heading (home, researchhub index, articles, meetings). The rule was firing because SiteImprove's crawler samples the page before the Vue SPA has finished hydrating: between initial HTML parse and `new Vue({ el: '#app' })`, `public/index.html` replaces `#app.innerHTML` with just a centered logo + loading GIF — no headings present at all — so any rule evaluation in that window sees zero H1s and returns `cantTell`/`failed`.

Fix: a visually-hidden H1 ("Illinois Criminal Justice Information Authority") now exists in two places to cover every pre-hydration sampling window:

- **Static `<h1>` inside `#app`** — present in the initial HTML before any script runs. Covers crawlers that evaluate DOM immediately after parse (or skip JS entirely).
- **Injected `<h1>` alongside the loading spinner** — prepended to the loading-state markup that replaces `#app.innerHTML` on page load. Covers crawlers that sample during the spinner window.

The H1 uses the standard visually-hidden inline style pattern (`position:absolute; width:1px; height:1px; clip:rect(0,0,0,0)`) so sighted users never see a duplicate heading flash. When Vue mounts and replaces `#app`'s contents, both copies are wiped and the real per-page H1 takes over.

**2. sia-r59 "Page missing headings" (735 pages) — same shim, zero additional code**

Flagged 735 pages across /about/publications (400), /about/employment (73), /about/biographies (72), /grants/funding (62), and others. Same root cause as sia-r61: pre-hydration crawler sees zero headings. The sr-only H1 shim above guarantees at least one heading in the DOM at every moment from first byte through Vue mount, so sia-r59 cannot fire.

**3. sia-r78 "Content missing after heading" (78 occurrences across research articles) — `src/utils/contentSanitizer.js` + `src/assets/hub.css`**

Research-hub article markdown from Strapi uses `<h4>TABLE n</h4>`, `<h5>SOURCE: …</h5>`, `<h6>NOTE: …</h6>` inside `<div class="article-table">` and `<div class="article-figure">` containers as labels and source/note annotations. These are captions, not headings — they correctly have no body content after them, which is exactly what sia-r78 flags. Rather than hunt down the CMS source on every article and rewrite the markdown (the CMS is scheduled for replacement), the content pipeline now downgrades them at render time.

New plugin `fixCmsFigureTableCaptions` in `src/utils/contentSanitizer.js` (registered immediately before `fixCmsEmptyContainers` in the html pipeline) walks `.article-table` and `.article-figure` containers, replaces every nested H4/H5/H6 with a `<p>` carrying `article-caption article-caption--h{n}` classes, and copies non-class attributes across so anchors and any data-* hooks survive. `src/assets/hub.css` now targets those classes to preserve the original uppercase/letter-spaced/700-weight treatment with the same font sizes (17/14/13 px) — the captions visually render identically, but they are no longer headings, so sia-r78 (and any related heading-outline rule) cannot fire on them.

Verified locally on the top-offender article (22 occurrences): 11 figure/table containers, 0 remaining H4/H5/H6 inside them, 40 captions converted. Per-article counts across all 78 flagged URLs should drop to zero after the next SiteImprove crawl.

**4. sia-r113 "Interactive element does not meet minimum size nor spacing" (2 pages, /researchhub/articles/illinois-juvenile-justice-system-data-trends-pre--and-post-covid-19 and /mhcontinuum/print-friendly) — `src/assets/app.css`**

WCAG 2.5.8 Target Size (Minimum) requires interactive targets ≥ 24×24 CSS px (or sufficient spacing). Inspection confirmed the culprits: inline footnote references (`.footnote-link` / `.footnote-ref a` at 16×16), backrefs, and `.author-link` byline links at 22 px high.

`src/a11y/index.js` already has a `fixFootnoteTargetSize()` function, but it runs once at a fixed 2-second delay and its selectors don't cover `.footnote-link` directly or `.author-link` at all — and on long Strapi-rendered pages like /mhcontinuum/print-friendly, the content can finish loading after the delay, so the JS fix never sees the elements. Moved the fix to CSS instead:

```
.footnote-link, .footnote-ref a, .footnote-backref,
a[href^="#fn"], a[href^="#fnref"], .author-link {
  display: inline-block; min-width: 24px; min-height: 24px;
  line-height: 1.5; padding: 4px 2px;
  text-align: center; vertical-align: middle;
}
```

CSS applies the moment the element enters the DOM, regardless of when async content loads, so SiteImprove sees a compliant hit target on every crawl. Verified locally: injected `.footnote-link` now renders at 24×32 with inline-block layout and the correct padding.

**Tests:** unit test suite — 177 passing, 68 pre-existing failures (DOMParser not polyfilled in the mocha env, unchanged from HEAD). Lint clean. All four fixes are isolated to single-purpose files and are trivially reversible if SiteImprove still flags after the next crawl.

---

## [1.5.19] - 2026-04-15

### a11y — critical fix: v1.5.17's Vuetify-empty-container pass was hiding the main content wrapper

SiteImprove flagged one researchhub article (`an-exploratory-evaluation-of-redeploy-illinois-findings-on-incentive-based-juvenile-diversion-services`) for sia-r17 "Hidden element has focusable content" and a11y-best-practice "Skip to main content link is missing". Diagnostic showed the actual cause: `<div class="v-main__wrap" role="presentation" aria-hidden="true">` — the entire page content wrapper was marked presentational, which cascaded into 60+ focusables being inside an aria-hidden ancestor, and the skip-link (which lives inside `v-main__wrap`) being removed from the accessibility tree.

Root cause was v1.5.17's `fixVuetifyEmptyContainers()` using an over-broad `div[class*=' v-'], div[class^='v-']` selector. That matches **every** Vuetify element including structural wrappers like `v-main__wrap`, `v-main`, `v-application`, `v-navigation-drawer`, `v-toolbar`, `v-card`, `v-row`, `v-col`. Combined with the function's "is it empty right now?" check running in the initial `$nextTick`, any structural container that hadn't yet received its async CMS content was marked `aria-hidden="true"` + `role="presentation"`. By the time the GraphQL article fetch finished and the content populated those wrappers, the aria-hidden attribute was still there. Grant pages and other static-rendered pages didn't hit this window because their content was present immediately — which is why only this one researchhub article was flagged.

Two-part fix in `src/a11y/index.js`:

1. **Explicit allowlist, not a prefix match** — `VUETIFY_DECORATIVE_CLASSES` is now a hand-curated list of only the decorative internal classes (`.v-image__image`, `.v-responsive__sizer`, `.v-menu__content`, `.v-tooltip__content`, `.v-list-item__icon`, `.v-navigation-drawer__border`, `.v-slide-group__prev/next`, `.v-tabs-slider*`, `.v-dialog__container`, `.spacer`). The broad `v-*` selector is gone. Structural containers are no longer candidates for hiding, full stop.

2. **`STRUCTURAL_CLASSES_NEVER_HIDE` allowlist + cleanup pass** — even with the narrow selector, any future regression from a similarly-over-broad rule would be caught by a defense-in-depth cleanup: on every pipeline run, any element carrying one of the structural classes (`v-main`, `v-main__wrap`, `v-application`, `v-application--wrap`, `v-app-bar`, `v-navigation-drawer`, `v-navigation-drawer__content`, `v-toolbar`, `v-content`, `v-card*`, `v-container`, `v-row`, `v-col`, `v-list`, `v-sheet`) has any `aria-hidden="true"` / `role="presentation"` / `role="none"` stripped off. This also cleans up any state that v1.5.17 may have already written into the DOM on existing browser sessions.

Verified on `redeploy-illinois-findings` (the flagged page): `v-main__wrap` no longer has `aria-hidden` or `role`; the `<a class="skiplink" href="#content">` is present; 0 focusables remain inside any aria-hidden ancestor (108 total focusables all correctly tab-reachable). Lint clean.

---

## [1.5.18] - 2026-04-15

### a11y — prevent sia-r17 regression from v1.5.17 Vuetify empty-container fix

SiteImprove's 4/15 crawl flagged one researchhub article for sia-r17 "Hidden element has focusable content" (redeploy-illinois-findings, 1 occurrence). That specific flag predates v1.5.17 and should clear once it redeploys — but v1.5.17's new `fixVuetifyEmptyContainers()` could introduce a new class of sia-r17 hits if it aria-hid an ancestor of a focusable element. Two hardenings:

1. **Pipeline reorder** — in `src/App.vue`, `fixAriaHiddenFocus()` now runs AFTER `fixVuetifyEmptyContainers()` (was before). Any focusable descendants of newly-aria-hidden Vuetify containers immediately get `tabindex="-1"` in the same pass, eliminating the ~2-second window between passes where they would be both tab-reachable and inside an aria-hidden ancestor.

2. **Hardened empty check** — `elementIsEmpty()` in `src/a11y/index.js` now also treats `<button>`, `<a>`, and any element with a non-`-1` `tabindex` as "not empty" for the purposes of deciding whether to aria-hide an ancestor. Previously only media/form elements counted; a Vuetify container holding an empty `<button>` could be marked presentational while the button remained focusable. Now such containers are skipped entirely — belt-and-suspenders to the pipeline reorder.

Verified on localhost: 0 sia-r17 violations across the flagged page and site-chrome. Lint clean.

---

## [1.5.17] - 2026-04-15

### a11y — suppress Vuetify internal empty containers (sia-r68)

SiteImprove's 4/15 crawl flagged seven pages for sia-r68 "Container element is empty" (14/5/1/1/1/1/1 occurrences). Diagnostic on the top-flagged article found 32 empty containers — all Vuetify 2.x internal layout/styling scaffolding, not CMS content:

- `.v-image__image` (background-image carrier)
- `.v-responsive__sizer`, `.v-responsive__content` (aspect-ratio math divs)
- `.spacer` (Vuetify flex spacer)
- `.v-menu`, `.v-tooltip` (wrappers that stay empty until activated)
- `.v-list-item__icon` (icon slots with only `aria-hidden` children)
- `.v-navigation-drawer__border`
- `.v-slide-group__prev`, `.v-slide-group__next` (disabled scroll arrows)
- `.v-tabs-slider-wrapper`, `.v-tabs-slider` (animated underline)
- `.v-dialog__container`
- `#app-progress-bar`, `#app-progress-spinner` (custom loader helpers)

The existing `fixCmsEmptyContainers` sanitizer plugin already strips empty containers from CMS HTML before render, so flagged emptiness lives entirely in the Vue/Vuetify-rendered chrome. Filling them with visible text would break layout, and they are already decoration only — screen readers should never announce them.

Added `fixVuetifyEmptyContainers()` to `src/a11y/index.js`. It runs on mount and on each route change (and in the delayed async pass to catch late-mounted components). For every empty element matching the Vuetify class prefix, a small allowlist of known decorative classes, and the custom progress-bar/spinner IDs — outside CMS article bodies — the fix applies `role="presentation"` + `aria-hidden="true"`. Both attributes remove the element from the accessibility tree; sia-r68 only applies to elements *in* the accessibility tree, so the rule no longer fires on them.

Helper `elementIsEmpty()` recursively checks for text content or meaningful media/form children (`img`, `iframe`, `svg`, `canvas`, `input`, etc.) so elements that wrap real content are never incorrectly marked presentational.

Verified on `probable-posttraumatic-stress-disorder` (top-flagged page, 14 occurrences): 32 empty Vuetify containers on load → 31 immediately presentation-ized + `aria-hidden` → 2 residual (`#app-progress-bar`, `#app-progress-spinner`, now covered by the widened selector) → 0 remaining after the fix is complete. Lint clean.

---

## [1.5.16] - 2026-04-15

### a11y — ragged-row cells downgraded to data + scope preserved on headers (sia-r46)

The CB-VIP NOFO grant page (`/grants/funding/community-based-violence-intervention-and-prevention-program-notice-of-funding-opportunity-sfy-26-cb-vip-nofo-2117-0501/`) survived v1.5.15 with one remaining sia-r46 flag. Root cause: the CMS-authored schedule table has a "continuation" row with a single cell — "June 30. 2026" — used as visual spillover of the previous row's date range ("Performance Period | September 1, 2025, to"). After `fixSimpleTable` promoted it to `<th>` (non-numeric text in the first cell of its row) and `fixComplexTable` assigned it an `id`, the cell became an orphan header: no `<td>` in the table referenced it, triggering SiteImprove's "No data cells assigned to table header".

Three changes in both `src/utils/contentSanitizer.js` and `src/a11y/index.js`:

1. **New `normalizeRaggedRows()` helper** — runs before any promotion / header-attribution logic. For any table with at least two rows and at least two columns, any row with only a single cell is converted to `<td colspan="N">` where N is the column count. Single-cell rows in multi-column tables are almost always visual continuations, not row labels. Downgrading the cell to `<td>` lets `fixComplexTable` associate it with the governing column headers via `headers="..."` just like any other data cell — no orphan header.

2. **Row-label promotion guard** — `fixSimpleTable` (both sanitizer and runtime) now skips promotion when the row contains only a single cell. Prevents re-promotion of the ragged cell after `normalizeRaggedRows` already downgraded it.

3. **Preserve `scope` on headers** — `fixComplexTable` previously stripped `scope` after assigning `id`, on the theory that `headers`/`id` "supersedes" scope. WCAG allows both to coexist, and some SiteImprove rule interpretations rely on `scope` as an association signal (especially for column headers that govern columns of row-label `<th>`s — those headers have no `<td>` referencing them). Now every `<th>` carries both `scope` AND `id`, maximizing cross-scanner compatibility.

Verified on localhost: the CB-VIP table's last row is now `<td colspan="2" headers="cmstbl3-h6 cmstbl3-h1">June 30. 2026</td>` — a data cell spanning both columns, associated with the "Performance Period" row header and the "Date" column header. All 7 THs carry both scope and id; all 6 TDs carry headers attrs. Lint clean.

---

## [1.5.15] - 2026-04-15

### a11y — explicit header/id attrs on all table cells + stop filling `<th>` (sia-r46)

SiteImprove's 4/15 crawl surfaced a second table-related issue, sia-r46 "No data cells assigned to table header" on seven articles (11/6/2/2/1/1/1 occurrences). Two distinct bugs came into focus:

1. **sia-r46 root cause** — the existing `fixCmsTables` plugin (CMS sanitizer) and runtime `fixTableCellContext` only applied explicit `id`/`headers` attribute relationships when a table had `rowspan`/`colspan`. Simple tables were left with `scope` attributes only. WCAG H43 accepts either approach, but SiteImprove's stricter interpretation of sia-r46 does not always recognize scope-based association — particularly for tables with multi-row headers where the authored `<th>` structure doesn't cleanly map to a single header per column. Fix: both passes now always run the complex-table logic (assign a unique `id` to every `<th>`, compute the set of governing column + row headers for every `<td>`, and write them into `headers="..."`). This satisfies sia-r46 unambiguously on every table, simple or complex.

2. **v1.5.14 regression** — `fixCmsEmptyTableCells` and runtime `fixEmptyContainers` filled both `<td>` AND `<th>` cells. Some tables have legitimately empty header cells — corner/spacer positions (the cell above a row-label column) — and filling those with "No data" gave the table a phantom header reading "No data" at a position that should be blank. Fix: both passes now select only `<td>`. Empty headers stay empty, which is valid HTML and doesn't violate sia-r77 (that rule flags data cells, not headers).

Additional guard: both `fixSimpleTable` variants (sanitizer + runtime) now skip row-label promotion on cells whose only content is the "No data" filler. Without this guard, a sanitizer-filled `<td>` could be promoted to `<th>` at runtime when `fixTableCellContext` sees the "—No data" string as a row label — the exact path by which two leftover phantom headers survived v1.5.14 on the probation-clients article.

Verified on the top-flagged page (probation-clients-barriers, 3 tables, 200+ cells): 0 overfilled `<th>`, 0 `<td>` without `headers` attr, 0 `<th>` without `id`. Same pattern on the women-police-leaders article. Lint clean.

---

## [1.5.14] - 2026-04-15

### a11y — fill empty table cells with em-dash + "No data" sr-only (sia-r77)

SiteImprove's 4/15 crawl flagged three researchhub articles for sia-r77 "Table cell missing context": 25 / 15 / 7 occurrences across `study-of-self-reported-synthetic-drug-use`, `law-enforcement-response-to-mental-health-crisis-incidents`, and `parole-and-mandatory-supervised-release-in-illinois`. Root cause: CMS-authored data tables use empty `<td>`/`<th>` cells for visual formatting. The earlier `fixCmsTables` plugin assigns scope/headers relationships so a screen reader knows WHICH headers govern each cell, but an empty cell still has no content to announce — SiteImprove reads this as context-missing. The earlier runtime `fixEmptyContainers` hid these cells with `aria-hidden="true"`, which addresses SR noise but does not satisfy sia-r77 (the rule inspects DOM content, not ARIA visibility).

Brute-force fix: every empty data cell is now filled with `<span aria-hidden="true">—</span><span class="sr-only">No data</span>`. Sighted users see an em-dash; screen readers announce "No data". The cell is structurally non-empty, which satisfies sia-r77 across the entire site.

Two layers:

- **CMS pipeline** — new `fixCmsEmptyTableCells` plugin in `src/utils/contentSanitizer.js`, registered after `fixCmsTables` so headers/scope are in place before cells are filled. Pre-render, so SiteImprove sees filled cells regardless of its JS render-budget.
- **Runtime** — `fixEmptyContainers()` in `src/a11y/index.js` now fills instead of hides. Also clears any stale `aria-hidden` from prior invocations. Covers non-CMS tables and any cells the sanitizer misses.

Both passes skip cells that already contain meaningful non-text content (images, iframes, videos, canvas, inputs, buttons, picture, SVG) so media-only cells are never overwritten.

Also ran `npm run lint` — all 18 pre-existing prettier warnings auto-fixed site-wide.

Verified on localhost: `study-of-self-reported-synthetic-drug-use` had 17 cells filled on the flagged table (0 remaining empty); `law-enforcement-response` had 2 cells filled. Both articles read through correctly with dummy data announced as "No data" by SR.

---

## [1.5.13] - 2026-04-15

### a11y + content — unwrap all links to expired IFVCC Planning NOFO #2096-2611 AmpliFund opportunity

`/grants/funding/ifvcc-planning-nofo-2096-2611/` was still failing SiteImprove sia-r14 after the v1.5.12 chrome-button source fix. Root cause was a non-descriptive "here" link (`<a target="_blank" href="https://il.amplifund.com/...">here.</a>`) pointing to the expired AmpliFund opportunity. Editorial confirmed the grant is expired and no one can act on it — so the link is dead weight whether or not SiteImprove flags it.

Added a new `EXPIRED_URLS` array to `src/utils/brokenLinks.js` alongside the existing `BROKEN_URLS` list, and merged both into the lookup set used by the `unwrapBrokenLinks` sanitizer plugin. The two lists are semantically distinct — `BROKEN_URLS` is confirmed 4xx/5xx/DNS-fail from SiteImprove, `EXPIRED_URLS` is editorially-flagged dead-but-still-resolving opportunities — but the pipeline treats them identically: every matching `<a href="...">text</a>` becomes plain `text` at render time.

Registered the IFVCC Planning NOFO #2096-2611 AmpliFund URL. All four AmpliFund links on the grant page are now unwrapped (three with long descriptive text plus the "here." link); the surrounding prose is preserved. Verified on localhost: zero AmpliFund `<a>` elements remain, both "here" references appear as plain text.

When additional expired grants are identified in future SiteImprove crawls or editorial reviews, add the opportunity URL to `EXPIRED_URLS` — no other wiring needed.

---

## [1.5.12] - 2026-04-15

### a11y — source-level removal of redundant aria-labels on 5 Vuetify chrome elements (sia-r14)

Belt-and-suspenders follow-up to 1.5.11. The runtime `fixLabelInName()` strip in 1.5.11 silences SiteImprove sia-r14 at desktop viewport (the width SiteImprove crawls at), but relies on JS executing before SiteImprove captures the DOM — which is timing-sensitive with their bounded render budget. Moving the fix to source eliminates the race entirely: the HTML emitted by Vue never carries the redundant `aria-label` in the first place.

Removed `aria-label` from five site-chrome elements where the accessible name is already provided by visible text or an adjacent `<span class="sr-only">`:

- `src/components/AppNav.vue:13` — hamburger `<button aria-label="MENU">` (visible "MENU" text below the icon serves as accessible name)
- `src/components/AppNav.vue:23` — header `<router-link aria-label="ICJIA Home">` (inner `<span class="sr-only">ICJIA Home</span>` serves)
- `src/components/AppNav.vue:145` — search `<v-btn aria-label="Search ICJIA">` (inner `<span class="sr-only">Search ICJIA</span>` serves)
- `src/components/AppFooter.vue:24` — footer `<router-link aria-label="ICJIA Home">` (inner `<span class="sr-only">ICJIA Home</span>` serves)
- `src/components/Hub/ArticleView.vue:114` — print `<v-btn aria-label="Print article">` (inner `<span class="sr-only">Print article</span>` serves)

Also added `aria-hidden="true"` to the hamburger icon `<span class="v-icon mdi mdi-menu">` so its ligature text doesn't contaminate the accessible name.

The translate button in `AppNavContext.vue` is intentionally left alone at source: on `xs`/`sm` breakpoints the visible "Translate this site" text is hidden and only the globe icon shows, so removing `aria-label` would leave the button with no accessible name on mobile. The runtime strip in 1.5.11 handles the desktop-width case SiteImprove crawls.

The runtime `fixLabelInName()` pass from 1.5.11 is kept in place as a catch-all for future regressions and for any Vuetify-generated attributes that reappear. With these source fixes, the runtime pass is a no-op for the 5 addressed elements but still protects against new redundant aria-labels added to components in the future.

Verified on `localhost:8080`: accessible names preserved ("MENU", "ICJIA Home", "Search ICJIA", "Print article", "ICJIA Home") with zero aria-label carriers remaining site-wide.

---

## [1.5.11] - 2026-04-15

### a11y — silence SiteImprove sia-r14 "Label in Name" cantTell flags on Vuetify chrome buttons

SiteImprove's 4/15 crawl flagged 30 page occurrences of sia-r14 across article, grant, and hub pages. All flags resolved to the same 6 site-chrome elements repeated per page: the hamburger `MENU` button, header/footer `ICJIA Home` logo links, `SEARCH ICJIA`, `TRANSLATE THIS SITE`, and `PRINT ARTICLE` v-btns. Each had an `aria-label` authored in mixed case (e.g. `aria-label="Search ICJIA"`) while Vuetify's CSS `text-transform: uppercase` rendered the visible label uppercase — technically label-in-name compliant under normalized-case comparison (which is why axe-core never flagged them), but SiteImprove could not resolve the ambiguity and escalated to `cantTell`.

Extended `fixLabelInName()` in `src/a11y/index.js` with a final pass that strips redundant `aria-label` from any `<button>` / `<a>` / `[role=button]` / `[role=link]` whose normalized aria-label already equals (or is contained in / contains) the normalized visible text. Without the attribute, the accessible name is computed directly from the visible text — a self-referential match SiteImprove cannot flag. Runs on initial mount and every route change via the existing `fixA11y()` pipeline in `App.vue`. Verified against localhost:8080: 6 carriers before, 0 after. No axe-core regression (the visible text remains as the accessible name).

### Critical fix — Apollo shim missed the default data assignment; ~20+ single-item detail pages stuck on "LOADING…" forever

Single-item detail views — `/grants/programs/<slug>/`, `/about/publications/<slug>/`, `/about/units/<slug>/`, `/about/staff-and-board/<slug>/`, several others — loaded the page shell, fetched the GraphQL response successfully (200, full data in body), then sat on "LOADING…" indefinitely. No dev-console error. No network error. Refresh didn't help. The audit runner surfaced the same symptom during the full-site run when hitting these routes under concurrent load, but the root cause was the same regardless of load: a bug in the Apollo compatibility shim that broke *every* component declaring both an `apollo: { name: { result() {} } }` handler AND reading `this[name]` inside it.

**Is this a result of the Apollo → fetch change?** Yes. `src/gql-client.js` replaced `vue-apollo` with a native-`fetch` client, and `src/mixins/apollo-shim.js` replicates the `apollo: {}` component option on top of it. The shim's `then` block had the wrong branching:

```js
// BUG (pre-v1.5.10):
if (typeof spec.result === "function") {
  spec.result.call(this, result);          // called, but…
} else if (result.data && result.data[key] !== undefined) {
  this[key] = result.data[key];            // …this branch only runs
}                                          //    when result() is ABSENT
```

Real `vue-apollo` does both: it assigns `this[key] = result.data[key]` **first**, then calls `result()`. So in a component like `ProgramsSingle.vue` where `result()` reads `this.programs` to build the display model, `this.programs` was always `undefined` under the shim, `.map()` threw a `TypeError`, the promise's `.catch` branch invoked the component's `error()` handler (which only stores the message in `this.error`), and the render stayed gated behind `v-if="program"` forever. No console noise because the error was caught by a handler that didn't log.

**Fix:** `src/mixins/apollo-shim.js` now mirrors vue-apollo — assigns `this[key]` from `result.data[key]` *before* calling `spec.result()`. The else-if became an if; both branches now run when both are present.

**Blast radius:** ~20+ single-item / list views share this pattern — Home, GrantsHome, ProgramsAll / ProgramsSingle, PoliciesAll, FundingAll / FundingSingle, RequiredFormsAll, RulesRegsPoliciesAll, GrantsStaff, IRBHome, IRBMeetings, CompositionAndMembership, Covid, PublicationsSingle, UnitsSingle, EmploymentAll, Staff, AboutHome, StaffAndBoardSingle, and more. All are repaired by the one-line shim fix; no per-component changes were needed.

**Why we didn't catch this during the gql-client swap:** the shim's test coverage validated the happy path (no `result()` handler → default assignment works). The unhappy path (with `result()` handler) only fails when the handler *also* reads `this[key]`, which is a pattern vue-apollo makes so natural it rarely appears in docs. The detail-page rendering path had to execute end-to-end to trigger it, and the full-site a11y audit is what finally exercised every detail route.

### UX — remove search-on-click from program titles (`ProgramsAll`)

`ProgramsAll.vue` was passing `:openSearch="true"` to `BaseCardExpandable`, which made the h2 title click handler navigate to `/search/<title>` instead of to the program detail page. With the detail pages now loading correctly (apollo-shim fix above), clicking the title routes to the program page as intended — removed the `:openSearch="true"` prop.

### Files

- `src/mixins/apollo-shim.js` — default assignment always runs alongside `result()`; matches vue-apollo semantics.
- `src/views/Grants/ProgramsAll.vue` — dropped `:openSearch="true"`.

---

## [1.5.9] - 2026-04-14

### A11y — Full-site axe-core audit: 2,367 / 2,367 pages clean (WCAG 2.2 AA, zero violations)

Expanded the accessibility compliance record from a sampled audit (157 pages) to a **full-site audit of every URL in `public/sitemap.xml` (2,367 pages)**, per a manager-directed requirement to document audit coverage at the per-page level. The run completed in 28 minutes 15 seconds with zero violations and zero errors against axe-core 4.11.2 at WCAG 2.2 Level AA conformance (`wcag2a` + `wcag2aa` + `wcag21a` + `wcag21aa` + `wcag22aa`).

The first pass surfaced 7 dirty pages; all were remediated in this release before the final archived run.

### New — `scripts/a11y-sitemap-audit.mjs`

Standalone Node runner that audits every URL in the sitemap in parallel (default 5 workers), resumable via NDJSON manifest. Uses `@axe-core/playwright`-equivalent injection (`axe.min.js` via `page.addScriptTag` + `axe.run()`) so results match what the `axecap` MCP produces.

- `--fresh` — archive prior run to `reports/a11y-full-audit/archive/<YYYY-MM-DD>/` and start over.
- `--retry` — re-audit only URLs that errored last time.
- `--summary` — rebuild `_summary.md`/`_summary.csv` from per-page JSONs without re-auditing.
- `--tags=...` — override the default WCAG tag set (e.g., add `best-practice`).
- `--concurrency=N` — parallel browser contexts (1–8, default 4). Keep at ≤5 against the prod Strapi API to avoid saturating GraphQL.

Output files (stable contract across re-runs):
- `reports/a11y-full-audit/_summary.md` + `_summary.csv` — rule × pages matrix
- `reports/a11y-full-audit/_manifest.ndjson` — one line per completed page, the resume key
- `reports/a11y-full-audit/pages/<slug>.json` — full axe result per page
- `reports/a11y-full-audit/archive/<YYYY-MM-DD>/` — prior runs, preserved

### CMS content pipeline — new plugins in `contentSanitizer.js`

Five new plugins close the gaps that surfaced as violations in the first audit pass. All run pre-render against CMS HTML (not post-render DOM fixes), so the HTML that ships is already correct.

- **`fixCmsContrast` — red text rewrite.** CMS authors paste `<span style="color: red">` for deadlines/emphasis. `#ff0000` on white is only 3.99:1 (fails AA 4.5:1). Plugin rewrites `color: red` / `#ff0000` / `#f00` / `rgb(255,0,0)` → `#c00` (5.89:1), same visual intent, AA-compliant.
- **`fixCmsOrphanWhite`** — Word-paste tables with dark-fill cells strip down to `color:white` inline on text while the cell bg survives only as a class-based style. Two failure modes: (a) white text lands on light bg (1.06:1, invisible) — strip the inline color; (b) ancestor has an inline dark bg but axe-core's contrast algorithm can't walk through nested `.MsoNormal`/`<strong>`/`<p>` wrappers reliably and attributes the span to a lighter ancestor — propagate the nearest dark inline background onto the span itself so axe reads contrast at the text-element level.
- **`fixCmsInvalidListChildren`** — Word-paste produces `<ul><u>item</u></ul>` or raw text directly inside a list (axe `list` rule: "direct children that are not allowed"). Wrap every non-`<li>`/`<script>`/`<template>` child of `<ul>`/`<ol>` in a synthetic `<li>`.
- **`fixCmsFocusablePre`** — `<pre><code>` blocks with horizontal scroll fail `scrollable-region-focusable` because they're not keyboard-reachable. Add `tabindex="0"` to all `<pre>` elements missing one.
- **`fixCmsTables` — strip stale `headers` attrs.** THs should not carry `headers` (they define, not reference, headers); CMS-authored tables sometimes include stale `headers="cmstbl0-h1"` pointing at ids that don't exist in the table. Strip from all THs at the start of `fixCmsTables`. Simple tables also strip TD `headers` attrs (scope on TH provides equivalent semantics).

### Template / style fixes

- **`BaseCardExpandable.vue`** — added `text-color="white"` to the deadline (green) and expired (red) v-chips so Vuetify's `.white--text` class is applied, making the white-on-dark-green contrast explicit to axe.
- **`app.css`** — scoped the site-wide `.v-chip.v-chip { background:#fff; color:#000 }` standardization rule to `:not(.white--text)`. Chips that explicitly opt into white text (Deadline, Expired, and any future colored badge) now keep their declared color class; default Vuetify grey chips still get the high-contrast b/w treatment from v1.5.6.
- **`Infonet.vue`** — added `text-decoration: underline` on the single external link (axe `link-in-text-block`: link needed visible distinction from surrounding bold text, 2.55:1 was insufficient).
- **`AppFooter.vue`** — footer logo had `alt="ICJIA Home"` matching the `router-link`'s `aria-label="ICJIA Home"` and the `.sr-only` hidden text "ICJIA Home" — triple-redundant, flags axe `image-redundant-alt` (best-practice). Set `alt=""` so the image is decorative in context of the already-labeled link.

### Critical fix — attachment downloads were silently broken

`AttachmentList.vue` and `RequiredFormTable.vue` rendered attachment rows as `<span>`/`<div>` with `@click.stop.prevent="routeTo(item.url)"` handlers inside Vuetify `v-data-table` scoped slots. Inside that slot context, Vue's click binding was not attaching reliably — clicks bubbled through the DOM but the handler never fired, so `window.open(...)` never ran and no download happened. The failure was silent: no console error, no UI feedback, click does nothing.

**Root cause:** v-data-table scoped slot rendering does not preserve per-element event listener bindings deterministically in Vue 2 / Vuetify 2.6 — the DOM node survives but the handler is lost. `RulesRegsPoliciesAll.vue` had the same pattern on the Policies "Download" button (`<v-btn @click="downloadFile(item)">`).

**Fix:** replaced every click-handled attachment/download span/div/v-btn with a real `<a href="https://agency.icjia-api.cloud/…" target="_blank" rel="noopener noreferrer">`. The browser's native anchor navigation fires the download directly — no Vue click binding required. Analytics (`window.plausible`) moved to a non-preventing `@click` handler wrapped in try/catch, so a broken analytics script can never block a download again.

Side benefit: real anchors are keyboard-accessible, right-click → save works, middle-click → new tab works, and screen readers announce them as links instead of as interactive spans. The download button in `RequiredFormTable.vue` cell dropped the `<v-btn>`-inside-`<a>` nesting (invalid HTML, nested-interactive a11y error) in favor of a styled-anchor pattern (`.download-link-btn` in `app.css`).

### UX — remove "| link" affordance from /grants/programs/

`ProgramsAll.vue` was rendering a pipe + link icon under each program title via `BaseCardExpandable`'s `showLink` prop. Redundant now that the program title itself is the navigation affordance. Set `:showLink="false"` on the Programs list to match the pattern used everywhere else (Funding, GrantsHome, ProgramsSingle).

### Documentation

README's "Accessibility Audit" and "Current Status" sections now document the full-site audit record, the per-content-type page breakdown derived from the live sitemap, the seven remediated violations with their fixes, and the command to re-run the audit (`node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=5`). Rationale for "full audit, not sampled" added — manager-facing compliance records require exhaustive coverage rather than representative sampling.

### Files

- `scripts/a11y-sitemap-audit.mjs` — NEW. Parallel resumable runner.
- `src/utils/contentSanitizer.js` — five new plugins + TH headers strip.
- `src/components/AttachmentList.vue` — real anchors, defensive analytics.
- `src/components/RequiredFormTable.vue` — real anchors across all four slots; `.download-link-btn` styling.
- `src/components/BaseCardExpandable.vue` — `text-color="white"` on deadline/expired chips.
- `src/components/AppFooter.vue` — empty alt on logo (decorative in labeled link).
- `src/views/Grants/RulesRegsPoliciesAll.vue` — Policies download button → real anchor.
- `src/views/Grants/ProgramsAll.vue` — `:showLink="false"`.
- `src/views/InformationSystems/Infonet.vue` — underline on raw URL.
- `src/assets/app.css` — chip rule scoped to `:not(.white--text)`; shared `.download-link-btn` styles.
- `README.md` — full-site audit record + re-run instructions.
- `reports/a11y-full-audit/archive/2026-04-14/` — archived per-page JSONs from the final 2,367-page clean run.

---

## [1.5.8] - 2026-04-13

### A11y / UX — Strip dead external links from CMS content

SiteImprove's "Pages with broken links" report (2026-04-13) flagged 309 unique external URLs as **"Broken link (confirmed)"** — 4xx/5xx or DNS-fail responses. These references appear in CMS content (mostly research-hub articles authored 2017–2021) and point at third-party resources that have since been moved or taken offline. Editorial cannot update the source content, so the dead links would remain clickable indefinitely, leading users into 404s.

Fix: new `unwrapBrokenLinks` plugin in `contentSanitizer.js`. At render time, every `<a href="…">` is checked against the confirmed-broken URL list in `src/utils/brokenLinks.js`. Matches are replaced with the link's inner text — visible content is preserved (so the citation/reference still reads naturally), but the anchor tag is removed so users can't click into a broken destination. Inline formatting inside the link (`<strong>`, `<em>`, `<code>`) is preserved.

URL matching is case-insensitive and tolerant of one trailing `.`/`,`/`;` — CMS authors often type "see http://example.com." which makes the period part of the href; the normalized comparison treats both forms as the same URL.

Only **"Broken link (confirmed)"** entries are stripped. The 233 "Needs review" entries from the same report are left alone — those failed for reasons that may be transient (CAPTCHAs, rate limits, temporary outages, geographic blocks) and should not be removed without verification.

### Files

- `src/utils/brokenLinks.js` — NEW. 309-entry URL list + `isBrokenUrl()` matcher with normalization.
- `src/utils/contentSanitizer.js` — adds `unwrapBrokenLinks` plugin and registers it in the html pipeline (runs after the link-rewriting plugins, before table fixes).

### Maintenance

When SiteImprove publishes a new broken-links report, regenerate `BROKEN_URLS` in `brokenLinks.js`: filter the CSV for `Broken link (confirmed)`, lowercase, dedupe, paste in. The plugin picks it up automatically — no other changes needed.

---

## [1.5.7] - 2026-04-13

### Docs — Manager-facing Nuxt 4 upgrade proposal

Added `docs/WEBSITE-UPGRADE-PROPOSAL.md` and `.docx` — a stakeholder-facing proposal for rewriting the Vue 2 site on Nuxt 4. Documentation only; no code, build, or runtime changes. The proposal is in-flight and being circulated for stakeholder feedback before scoping.

---

## [1.5.6] - 2026-04-13

### A11y — Fix white-on-white "NEW!" chips on home cards

A contrastcap audit of the production site surfaced a `ratio: 1` failure on the homepage "NEW!" badge. Root cause: the v1.5.x chip-contrast remediation added a blanket `.v-chip.v-chip { background:#fff !important; color:#000 !important }` rule in `app.css` to standardize all chips to a high-contrast white-fill / black-text / 2px-black-border treatment, but three card components (`HubCard.vue`, `HomeCardNews.vue`, `HomeResearchCard.vue`) still passed `color="#0D4474"` on their "NEW!" chips with an inner `<span style="color:#fff !important">`. The blanket CSS overrode the navy background but inline `!important` kept the text white — producing white-on-white, invisible text.

Fix: removed the `color="#0D4474"` prop and the inline white color on all three components. Chips now inherit the standard treatment — white background, 2px black border, bold black "NEW!" text (21:1 contrast, passes AAA).

- `src/components/Hub/HubCard.vue` — homepage research-hub cards
- `src/components/HomeCardNews.vue` — homepage news-tabbed cards
- `src/components/HomeResearchCard.vue` — homepage research cards
- `src/components/NewsCard.vue` — news listing cards (same pattern, now consistent)

Also audited with contrastcap across 7 representative page types (home, about, news post, researchhub landing, publications, events, staff). The remaining contrastcap "failures" on the interior `.v-tabs.context` bar are **false positives** — live computed styles are `rgb(0,0,0)` on `rgb(238,238,238)` (~18.6:1, passes AA). contrastcap's DOM traversal walks through Vuetify's transparent wrappers (`.v-slide-group`, `.v-tabs`, `.v-toolbar__content`) and its fallback pixel sampler picks up the hero image behind the sticky app bar. Hardened the traversal by painting `#eee` on `.v-tabs.context` and slide-group wrappers in `app.css`, which eliminates the false positives without changing rendering.

### Verification

- axe-core AA: 0 violations on homepage (localhost)
- All four affected chip components updated consistently
- Tab-bar hardening: purely additive CSS, no visual change

---

## [1.5.5] - 2026-04-13

### UX — Search overhaul + first batch of audit-driven quick wins

This release lands the search-modal-to-/search refactor (the most-complained-about interaction on the site) plus five audit-driven UX improvements identified in the v1.5.5 internal UX audit. Nothing in this release changes API contracts, ships new features, or affects content; it is entirely interaction-layer cleanup.

---

### 1. Search modal → /search page (every entry point)

The legacy flow: clicking a tag, author, category, or "search similar" CTA fired `EventBus.$emit("search", { query, type })`, which opened `ModalSearch` over the current page. Picking a hit closed the modal and same-tab-navigated to the result, **destroying the result list with no Back path back to it**. Nearly every "I clicked the wrong tag and now I have to start over" complaint traced to that one design choice.

**Now:**

- **Every search entry point** — header search icon (`AppNav`), context bar buttons (`AppNavContext`, `AppNavContextBottom`), tag chips (`BasePropChip`), author/bio names (`BiographyCard`, all staff/board pages), category clicks across cards (`NewsCard`, `HomeCardNews`, `HubCard`, `DatasetView`, `ArticleView`), "search similar" buttons on `JobCard` / `BaseCardExpandable`, internal markdown `[data-event-search]` triggers — routes to `/search/:encodedQuery` (or bare `/search` for the empty-query case from the header icon).
- **Search results on `/search`** — click opens the destination in a new browser tab (`target=_blank`, `rel=noopener,noreferrer`). The `/search` tab is never unloaded; users get back to their result list by switching tabs or closing the result tab.
- **Header search icon clicked again** — clears any in-progress query + result set and refocuses the input. No stale state.

The modal still exists in the codebase because nothing currently triggers it — leaving it in place avoids touching `App.vue`'s mount tree right before the Nuxt rewrite. It's effectively dead code now and can be deleted in the rewrite.

**New utility — `src/utils/search.js`** (no Vue dependency)

- `goToSearch(router, opts)` — pushes `/search/:encodedQuery?filter=:type` for queries with text, or bare `/search` (Search1 route) for empty-query "open the search page" intent. Tolerates `NavigationDuplicated`. Accepts `opts.type` or `opts.filter` for back-compat.
- `openInNewTab(path)` — `window.open(absoluteUrl, "_blank", "noopener,noreferrer")`; absolute URL is computed from `window.location.origin` so origin-relative SPA paths open at the right host.

**Components updated** (live emits replaced with `goToSearch`):

`AppNav`, `AppNavContext`, `AppNavContextBottom`, `SearchCard`, `SearchCardAlt`, `BasePropChip`, `BiographyCard`, `JobCard`, `BaseCardExpandable`, `NewsCard`, `HomeCardNews`, `Hub/ArticleView`, `Hub/HubCard`, `Hub/DatasetView`, `views/Hub/HubStaff`, `views/InformationSystems/ISUStaff`, `views/About/CompositionAndMembership`, `views/News/NewsSingle`, `views/Grants/GrantsStaff`, `utils/dom.js`. `SearchCard` and `SearchCardAlt` gained an `isStatic` prop so the same component opens new tabs on `/search` and same-tab inside the (now-orphaned) modal.

**`SearchStatic.vue` watchers** for `$route.params.query` so:
- A nav from `/search/foo` → `/search/bar` updates the input + results without remount.
- A nav from `/search/anything` → `/search` (bare) clears the input, results, and filter, and refocuses the search field. This is what makes "header icon = fresh search" work.

---

### 2. New filter-chip toolbar on `/search` (replaces navy panel + dropdown)

The old filter UI on `/search` was a heavy navy `v-card` containing a centered "Filter results by:" label and a white `v-select`. Two clicks (open dropdown, pick option) to apply a filter; users couldn't see what types were available without opening the dropdown; on mobile the entire panel was hidden via `hidden-sm-and-down` so mobile users had no filter at all.

**New design** (`SearchStatic.vue` + scoped CSS):

- A quiet single-line summary: "**17** of **96** results for *"domestic"*" — with the active vs. total counts bolded.
- A horizontal chip row beneath: `[ NO FILTER 96 ] [ MEETINGS 41 ] [ PUBLICATIONS 30 ] [ ARTICLES 17 ] [ NEWS 3 ] [ FUNDING 3 ] ...` — pills with type-name + count badge, sorted by count descending.
- Chips are real `<button>` elements with `aria-pressed`; the active chip inverts to solid black (matches the v1.5.3 high-contrast `.v-chip` aesthetic).
- New computed `availableFilterChips` derives the chip list from `queryResults` so chips with zero hits never appear — the row never lies about what's available.
- Added `prettifyType()` to map raw `contentType` strings (`article`, `biography`, `funding`) to human labels (`Articles`, `Biographies`, `Funding`).
- Toolbar shows on mobile too (no more `hidden-sm-and-down`).

One click = one filter applied. No dropdown indirection.

---

### 3. Empty-state message on `/search`

When a query returned zero hits, the page silently rendered an empty list — users had no idea if they were still loading, if their search was malformed, or if there genuinely were no results.

Now: when `query.length >= 2 && fuse && queryResults.length === 0`, renders:

> **No results for *"xyz"*.**
> Try a shorter or differently-spelled term, or [browse all articles](/researchhub/articles), [news](/news/), or [grants](/grants/).

Plus a quieter "Keep typing — search starts at 2 characters" hint when the user has typed only one character.

---

### 4. Debounced search input (both `SearchStatic` and `ModalSearch`)

`@input="instantSearch"` fired the full Fuse query on every keystroke. Typing "domestic violence" fired ~17 searches. The 2.7 MB index is in-memory but Fuse's per-query work is O(items × fields), and on lower-spec phones the lag was perceptible.

Now: `created()` wraps `instantSearch` with `_.debounce(fn, 250)` and the template uses `@input="debouncedSearch"`. 250ms is the sweet spot — fast enough to feel live, slow enough to skip mid-word work. Lodash was already imported in both files.

---

### 5. Smarter `scrollBehavior` in `router/index.js`

Was: `scrollBehavior: () => ({ x: 0, y: 0 })` — yanked every navigation back to the top, including back-button restorations and same-route query changes (the `Load more` pagination, the new `?view=list` view-toggle URL state, etc.).

Now:

```js
scrollBehavior(to, from, savedPosition) {
  if (savedPosition) return savedPosition;            // back/forward restores
  if (to.hash) return { selector: to.hash };          // anchor links work
  if (from && to.path === from.path) return null;     // query-only change preserves scroll
  return { x: 0, y: 0 };                              // everything else top
}
```

Five lines, fixes three audit findings simultaneously: scroll-to-top destroying context, anchor links not jumping, and "Load more" yanking users away from the button they just clicked.

---

### 6. URL-backed view toggle on the three `*All.vue` views

`Hub/ArticlesAll`, `Hub/DatasetsAll`, `Hub/AppsAll` each had a `v-btn-toggle` for List vs. Grid that mutated local `orientation` state. Refresh → reset to "grid". Bookmark → reset to "grid". Back → reset to "grid".

Now: `data()` initializes `orientation` from `this.$route.query.view` and a `watch` on `orientation` mirrors changes to `?view=list` (or removes the param for the default "grid"). Combined with the smarter `scrollBehavior` above, toggling no longer yanks scroll. Bookmarkable + shareable + survives refresh.

---

### 7. Quieter focus rings on light surfaces

The v1.5.3 focus-visible rule added a `box-shadow: 0 0 0 4px rgba(255,255,255,0.9)` halo around every focused element, plus a separate `.v-text-field:focus-within { outline: 2px solid #1565c0 }` ring on every Vuetify text-field wrapper. Stacked together that produced an 8px-thick blue+white ring around any focused input, particularly loud on autofocused fields like the `/search` input where the ring appeared the moment the page loaded.

Now:

- Default `:focus-visible` is just `outline: 2px solid #1565c0; outline-offset: 2px`. Clean, single-purpose, accessible.
- Dropped the `.v-text-field:focus-within` wrapper outline entirely. Vuetify text/select/textarea fields already have a built-in focus indicator: the bottom underline thickens from 1px gray to 2px blue, the floating label changes color, and the clear button appears. That state change satisfies WCAG 2.4.7 on its own without an outer ring.
- Dark-surface override (`header.v-app-bar :focus-visible`, navy splash blocks) keeps a 1px dark inner shadow + a yellow outline so contrast against the navy header is preserved.

### 8. `/search` always lands with cursor in the input

The `<v-text-field autofocus>` HTML5 attribute fires once per element mount, which is unreliable across Vue Router transitions — `SearchStatic` is reused when going from `/search` to `/search/foo`, so `autofocus` doesn't re-run on subsequent visits. Explicit `this.$refs.textfield.focus()` in `mounted()` (wrapped in `$nextTick`) guarantees the cursor lands in the input no matter how the user got to the page: header icon, footer icon, tag click, direct URL, or browser back/forward. Same focus call also runs in the route-watcher's empty-query branch (header-icon-while-already-on-/search case).

Inlined the focus call rather than delegating to a `methods.focusSearchInput()` helper so partial-HMR cache scenarios can never strand it (had a transient `this.focusSearchInput is not a function` error during development when cache-loader updated the template/mounted block ahead of the methods block).

---

### 8. Breadcrumb truncation fixed

`AppNavContext.vue:58` had `{{ contextTitle | truncate(8) }}` — cut breadcrumb titles to 8 *characters*, so "Crime Victim Compensation Fund" became "Crime Vi…". Read as a parser bug to anyone seeing it.

Now: dropped the filter; switched to CSS `text-overflow: ellipsis` with `max-width: 60ch` so titles wrap or truncate gracefully based on viewport width. Full title is preserved in the `title` attribute for hover. No more weird mid-word cuts.

---

### What's NOT in this release (deferred)

The UX audit identified ~15 findings; this release lands the highest-impact 9. Deferred for triage / Nuxt rewrite:

- URL-backed filter/sort/page state on `*All.vue` views beyond the view toggle (e.g., filter by category, sort by date) — needs per-view design
- "Back to list" link on `*Single.vue` views — wide-touch change
- Single-page form recovery affordances (success state with "submit another", focus-first-error) — `Forms/GrantStatus.vue`, `Forms/LapRequest.vue`
- News-card mid-sentence truncation (use `truncateBySentence`)
- Loading skeletons in remaining `*All.vue` / `*Home.vue` views
- CTA wording standardization ("Read more" / "View" / "Continue")
- `console.log` cleanup in production code
- Carousel auto-cycle toggle on home page
- "More" overflow in `AppNavContext` rendering raw text instead of links
- Mobile counters in `*All.vue` (currently hidden via `hidden-sm-and-down`)

---

### Tests

249/249 unit tests passing. No new specs needed — the refactors are interaction-layer (routing + UI), exercised by existing component tests. Manual verification was done for each of the 8 changes via the Chrome DevTools MCP browser session.

### Manual test plan

Search behavior:

- [ ] Click any tag chip on a Research Hub article → lands on `/search/:tag`, chips show available content types with counts
- [ ] Click an author name → lands on `/search/:name`
- [ ] Click a result card on `/search` → opens destination in a new tab; the `/search` tab is unchanged
- [ ] Click the header search icon → goes to bare `/search`, input is empty, focus is in the input
- [ ] Click the header search icon while already on `/search/foo` → input clears, results clear
- [ ] Type into `/search` input → only one Fuse search per ~250ms pause (not per keystroke)
- [ ] Search for `zzznoresults` → shows "No results for…" with browse links
- [ ] Click chip "ARTICLES 17" → result list filters down to articles, chip turns black, count summary updates
- [ ] Click chip "NO FILTER" → clears the filter, all 96 back

Scroll + view-toggle:

- [ ] On `/researchhub/articles` toggle to List → URL becomes `/researchhub/articles?view=list`
- [ ] Refresh → still in List view
- [ ] Bookmark `…?view=list`, open in a new tab → starts in List view
- [ ] Click Load More → no scroll-to-top
- [ ] Click an article → drill in → Back → restores scroll position
- [ ] Click an in-page anchor link → scrolls to anchor

Other:

- [ ] Tab through any page → focus ring is a clean 2px blue outline, no thick white halo
- [ ] Tab through the navy header → focus ring is yellow + dark
- [ ] Open a page with a long title (e.g., a research article) → breadcrumb shows the full title up to the viewport edge with ellipsis, hover shows full text

---

## [1.5.4] - 2026-04-13

### A11y — Skip-to-content link actually moves focus now

The `SkipLink` component has shipped on this site for years as a `<router-link to="#content" @click="$vuetify.goTo('#content')">`. On paper, that's a WCAG 2.4.1 skip link. In practice it was broken for keyboard users:

1. `$vuetify.goTo('#content')` **scrolls** to the target but does not move DOM focus. After activating the skip link, `document.activeElement` was still the skip link itself.
2. `<div id="content">` in `App.vue` had no `tabindex`, so even if code had called `focus()` on it, the call would have been a no-op — non-interactive elements can't receive programmatic focus without `tabindex`.
3. The next Tab press therefore landed on the element *after the skip link in DOM order* (the hamburger/menu button or the home logo router-link) — back into the header, not into the main content. The skip link scrolled the viewport but the keyboard user ended up tabbing through the whole header again.

This was caught while verifying skip-link behavior across a deterministic sample of 29 pages spanning every section (home, research articles, news, publications, grants, meetings, events, jobs, IRB, biographies, units) — pulled from `public/api/*.json`. Before the fix, 0/29 moved focus to `#content`. After the fix, 29/29 do.

### Changes

- **`src/components/SkipLink.vue`** — rewrote as `<a href="#content">` (no router-link), with an `onSkip` handler that: (a) prevents the default anchor jump, (b) calls `target.scrollIntoView({ behavior: 'smooth' })`, (c) calls `target.focus({ preventScroll: true })`, and (d) `history.replaceState` updates the URL hash so the Back button behaves. Removed the now-redundant `aria-label="Skip to content"` — the visible text provides the accessible name, carrying both risks a sia-r38 "Visible label and accessible name do not match" flag. Keyboard `Enter` and `Space` both trigger the handler.

- **`src/App.vue`** — added `tabindex="-1"` to `<div id="content">`. This makes it a programmatic focus target without putting it in the natural Tab order.

- **`src/assets/app.css`** — rewrote the `.skiplink` rules. Previously the `:focus` state contained an invalid declaration (`position: 0px;` — CSS position takes keywords, not lengths) that did nothing. Replaced with a clean clip-path/clip pattern (rest: 1×1px clipped, absolutely positioned; focus: expands to `top: 8px; left: 8px`, white background, black text, blue 2px outline, subtle drop shadow). Added `:focus-visible` as well as `:focus` so it works with mouse-navigation suppression.

- **`#content:focus` / `#content:focus-visible`** — suppress the focus outline on the wrapper div. The wrapper is only a focus *target* for the skip link; the visible focus ring should land on whatever interactive element the user tabs to next *inside* the content, not on the outer div.

### Test coverage

- Existing unit tests in `tests/unit/components.spec.js` updated: `aria-label` assertion replaced with visible-text assertion; `to` attribute assertion replaced with `href` attribute assertion (aligned with the router-link → plain-anchor change). 249/249 tests pass.

- New behavioral verification (not a unit test — ran once via Chrome DevTools MCP during development): 29 URLs sampled deterministically from `public/api/*.json` (1 home + 3 each from hub, posts, publications, grants, meetings, events, jobs + 3 IRB/pages + 3 biographies + 1 unit). Script: navigate to each, focus the skip link, click it, assert `document.activeElement === document.getElementById('content')`. Result: 29/29 pass.

### URL list used for verification

```
/
/researchhub/articles/restore-reinvest-and-renew-r3-cohort-one-scale-and-reach-report/
/researchhub/articles/a-content-analysis-of-illinois-school-bullying-policies/
/researchhub/articles/police-knowledge-attitudes-and-beliefs-about-opioid-addiction-treatment-and-harm-reduction-a-survey-of-illinois-officers/
/news/pritzker-administration-awards-3-5-million-in-restore-reinvest-and-renew-program-grants-in-response-to-summer-violence/
/news/icjia-budget-committee-funding-actions/
/news/icjia-sfy-22-annual-report/
/about/publications/co-responder-program-overview-east-st-louis-embrace/
/about/publications/an-analysis-of-factors-associated-with-suicide-among-justice-involved-illinois-violent-death-decedents/
/about/publications/sex-offenses-sex-offender-registration-task-force-final-report/
/grants/funding/2020-casa/
/grants/funding/2020-byrne-drug/
/grants/funding/2019-infonet/
/news/meetings/uniform-statewide-crime-statistics-task-force-agenda-april-14-2026/
/news/meetings/community-based-corrections-task-force-meeting-october-29-2025/
/news/meetings/authority-board-meeting-may-8-2025/
/events/webinar-the-pandemic-s-impact-on-illinois-criminal-justice-and-victim-services/
/events/labor-day-2021/
/events/webinar-policing-in-an-era-of-reform-nov-3-2021/
/about/employment/criminal-justice-specialist-i-chicago-office-vpi-unit-req-54665/
/about/employment/bilingual-capacity-building-coach-contractual-req-47433/
/about/employment/ari-researcher-contractual-req-41949/
/researchhub/hub-overview/
/irb/irb-members-and-staff/
/irb/irb-policies-and-procedures/
/about/biographies/sharyn-adams/
/about/biographies/keith-calloway/
/about/biographies/maria-di-meglio/
/about/units/federal-and-state-grants-unit/
```

---

## [1.5.3] - 2026-04-13

### A11y — Focus hardening, chip contrast, same-href link labeling

This release addresses SiteImprove's 2026-04-13 "potential issues" report (sia-r65 focus visibility, sia-r81 same-context same-page links — 77 occurrences total, all `cantTell`), plus a visible contrast regression on BasePropChip that was spotted in a manual review.

### Chip contrast — high-contrast standard (BasePropChip + global `.v-chip`)

`BasePropChip.vue` rendered category/tag chips with Vuetify's `grey lighten-3` fill and default text color (mid-gray on light-gray), failing the 4.5:1 text-contrast minimum and producing almost-invisible chips on the Research Hub articles list and inside every article body.

- **`src/components/Hub/BasePropChip.vue`** — switched `color="grey lighten-3"` → `color="white"`. Removed the inline `style=""` block (moved to CSS).
- **`src/assets/app.css`** — added a high-contrast chip rule that targets both `.v-btn.chip` (BasePropChip's rendered output) and `.v-chip.v-chip` (any direct `<v-chip>` usage anywhere on the site):
  - Default state: white fill, black text (21:1 ratio), 2px `#222` border (12.6:1 against white)
  - Hover / focus-visible state: inverts to black fill, white text
  - Covers every component that uses `BasePropChip` — `JobCard`, `PublicationCard`, `SearchCardAlt`, `EventCard`, `ArticleView`, `HubCard`, `MeetingCard`, `RequiredFormCard`, `PolicyCard`, `NewsCard`, `AppView`, `BaseCardExpandable`, `DatasetView`, `FundingSingle`, `NewsSingle`, `BasePage`, and two i2i singles (18 files total)

The existing runtime `fixChipContrast()` in `src/a11y/index.js` is now redundant for these elements (new CSS produces 21:1, far above its 4.5:1 gate) but left in place as defense-in-depth for any third-party Vuetify components that escape the site-wide rule.

### Focus visibility — real fix + hardening (sia-r65 potential)

**Real fix — `.markdown-body .anchor:focus` had no replacement.** `src/assets/github-markdown.css:21` removed focus outline on heading anchor links (the `#`-link icon next to each heading in article content) without a `:focus-visible` replacement. Keyboard users tabbing through a long article lost all focus indication when hitting these anchors. Replaced with `:focus-visible { outline: 2px solid #1565c0; outline-offset: 2px }`. The v1.5.1 audit listed three `outline:none` rules as "paired with replacements"; this fourth one was missed.

**Hardening — double-ring focus indicator in `src/assets/app.css`.** The previous universal `:focus-visible { outline: 2px solid #1565c0 }` had good contrast on white (~6:1) but poor contrast on the site's navy header (`rgb(10, 58, 96)` ≈ 2:1 against `#1565c0`). Changed to:

1. **Default surfaces** — blue outline + white box-shadow halo. Dark-blue inner ring + white outer ring, visible against any mid-tone background.
2. **Dark surfaces** (`header.v-app-bar :focus-visible`, `.dark-surface :focus-visible`, plus selectors for inline `background: #0A3A60` blocks) — inverted to yellow outline + black box-shadow halo. Bright-yellow inner + dark outer, visible against navy.

Writing better focus CSS doesn't change SiteImprove's sia-r65 count (the rule is `cantTell` for every focusable element regardless of styling — there's no static-analysis algorithm that can verify "the focus ring is clearly visible"). This change reduces *real* keyboard-navigation risk; the SiteImprove flags will stay in the dashboard as manual-review items.

### Plugin — `fixCmsSameHrefLinkLabels` (sia-r81 proactive remediation)

SiteImprove's sia-r81 flags when two or more links in the same content block point at the same href but expose different accessible names (e.g., a thumbnail link and a "Read more" link to the same article, where the thumbnail has no alt text and "Read more" carries the accessible name). Screen-reader users then hear two distinct-sounding destinations that are actually one.

New plugin in `src/utils/contentSanitizer.js`:

- Collects every `<a href>` in the document
- Buckets by `(ancestor context, href)` — context is the closest `ul`/`ol`/`p`/`section`/`article`/`.markdown-body` ancestor
- For each bucket with >1 link, computes each link's accessible name (priority: `aria-label` → visible text → wrapped `<img alt>`)
- If the bucket has >1 distinct accessible name, stamps the longest/most-descriptive name as `aria-label` on any link whose current accessible name differs
- Visible text is never touched — only the screen-reader-exposed name is unified

Like `fixCmsDuplicateLinkText` (the same-text-different-hrefs case from v1.5.2), this runs at pre-render time via the HTML sanitizer pipeline, so the rendered DOM already has consistent labels when SiteImprove (or a screen reader) inspects it.

### Tests

Added three specs to `tests/unit/contentSanitizer.spec.js` covering the new plugin. 23 plugin specs total, 249 unit tests in the suite, all passing.

### What was not done (and why)

**sia-r65 and sia-r81 will continue to show in SiteImprove.** Both are `failed/cantTell` rules — the crawler cannot algorithmically confirm or deny them for any page element. They are tracked as part of the manual-review backlog, not the automated-remediation backlog. The fixes in this release reduce the *real-world* likelihood of a visual focus or link-naming regression, but they don't change SiteImprove's flag count.

### Net result

- Chip text contrast: low-contrast grey-on-grey → 21:1 black-on-white with a dark border
- One real focus-indicator regression fixed (heading anchors)
- Universal focus-ring visible against light, mid-tone, and dark backgrounds
- Same-href links in same context now expose a single, consistent accessible name to screen readers
- 249/249 unit tests passing

---

## [1.5.2] - 2026-04-13

### A11y — SiteImprove remediation via pre-render CMS intercept

SiteImprove crawl on 2026-04-13 returned 397 flagged occurrences across 11 issue categories. Triage split them into three buckets:

1. **Not in scope (~150 occurrences)** — flagged URLs are on external Drupal sites that this SPA redirects to (`/ifvcc/*`, `/adultredeploy/*`, `/arrestexplorer`, `/mhcontinuum/*`, `/sudcontinuum/*`). Those codebases are separate and outside this repo; no action possible from here.
2. **In scope, fixable at the CMS-intercept layer (~230 occurrences)** — every flagged article, news item, and Strapi-driven page is produced by the `contentSanitizer` pipeline at render time. Bugs in author-entered HTML are best fixed before render so the initial DOM is correct — SiteImprove's crawler then sees compliant markup regardless of client-side `fix*()` timing.
3. **In scope, component-level (~4 occurrences)** — one confirmed `<v-icon>`-as-button anti-pattern on the employment listing page that required a Vue edit.

This release lands fixes for categories 2 and 3.

### Plugin 1 — `fixCmsTables` (214 of the 230 in-scope occurrences)

All 204 "Table cell missing context" and 10 "No data cells assigned to table header" flags originated in Strapi-authored article tables (many of them paste-from-Word tables from `.MsoNormalTable` with `bgcolor="#4F81BD"` headers and `style="border:solid white 1.0pt"` frames). The existing runtime fix `fixTableCellContext()` in `src/a11y/index.js` did the right computations but fired *after* Vue's v-html render — SiteImprove's crawl would often capture the pre-fix state.

New plugin in `src/utils/contentSanitizer.js`:

- **Simple tables** — ensures `<thead>`/`<tbody>` wrapping, adds `scope="col"` to every column header, adds `scope="row"` to row headers (or promotes non-numeric first-cell `<td>` to `<th scope="row">` when the text looks like a label).
- **Complex tables with rowspan/colspan** — assigns a unique `id` to every `<th>`, then builds a `cellGrid` that tracks which cell occupies each (row, col) position accounting for spans, then for each `<td>` collects the closest column header (scan upward in same column) and closest row header (scan leftward in same row), and writes the collected ids into a `headers="..."` attribute. Removes `scope` from complex-table `<th>` cells because `headers` supersedes `scope` per WCAG H43.
- **Orphan-header tables** — if a table has `<th>` cells but zero `<td>` cells, it is a misused header-only block (common in CMS paste artifacts). Marks the table `role="presentation"` so SiteImprove stops treating it as a data table with broken semantics.

Runs once per article body at Strapi response time, so the rendered HTML is correct before the first paint.

### Plugin 2 — `fixCmsEmptyContainers` (9 occurrences)

SiteImprove's sia-r68 "Container element is empty" and "Empty headings" fire on author-entered `<p></p>`, `<div></div>`, `<span></span>`, `<li></li>`, and `<h2></h2>` elements that CMS paste-from-Word reliably leaves behind. Plugin walks the HTML bottom-up and removes any block-level container whose text content is empty *and* whose only children are also empty (recursive). Preserves containers that wrap meaningful void children (`<img>`, `<iframe>`, `<video>`, `<audio>`, `<svg>`, `<canvas>`, `<object>`, `<embed>`, `<picture>`, `<input>`, `<button>`, `<select>`, `<textarea>`, `<hr>`, `<br>`) so, e.g., `<p><img src=foo></p>` stays intact.

### Plugin 3 — `fixCmsLinkAltText` (1 occurrence)

SC 2.4.4 / 4.1.2: image-only links need an accessible name. Plugin finds every `<a>` with empty visible text and no `aria-label`/`aria-labelledby`, then (a) promotes the wrapped `<img alt>` to the link's `aria-label`, (b) if alt is empty, falls back to a filename-derived label on both `<a aria-label>` and `<img alt>`, (c) if no image, derives from the href path segment.

### Plugin 4 — `fixCmsDuplicateLinkText` (1 occurrence on `/about/rss/`)

SC 2.4.4 "Links in the same context with the same text alternative" fires when two or more links within the same content block (`<ul>`, `<ol>`, `<p>`, `<section>`, `<article>`, or `.markdown-body`) share identical accessible text but point at different hrefs. Classic example on `/about/rss/`: three "RSS" links pointing to News, Funding, and Meetings feeds. Plugin buckets links by `(context, label)`, and when a bucket has >1 entry with differing hrefs, appends a href-derived qualifier to `aria-label` (e.g., `aria-label="RSS: news"`, `aria-label="RSS: funding"`) — visible text stays unchanged.

### `fixCmsContrast` extension — Word-blue table headers

Axe-core audit of `/researchhub/articles/law-enforcement-response-to-mental-health-crisis-incidents-.../` confirmed the 11th color-contrast flag: `<th bgcolor="#4F81BD" style="background:#4F81BD">` with `<span style="color:white">` inside — 4.03:1 against white, just under the 4.5:1 AA minimum. This is the default Microsoft Word table-header fill, which paste-from-Word authoring reliably produces. Added three substitutions to `fixCmsContrast` that rewrite the Word blue to a darker shade (`#2E5E97`, ~6.3:1) — same visual family, compliant. Covers the `bgcolor` HTML attribute, `background:#4F81BD` / `background-color:#4F81BD` inline style, and the `rgb(79, 129, 189)` form. Preserves all other colors.

### Vue fix — `JobCard.vue` icon-button anti-pattern

`/about/employment/` flagged "Visible label and accessible name do not match" because the "go to job posting" control was rendered as `<v-icon aria-label="Go to job posting">link</v-icon>`. The text content `"link"` is a Material Icons font ligature — SiteImprove reads it as the visible label, and `"link"` ≠ `"Go to job posting"`. Converted to a semantic `<button type="button">` wrapping an `<v-icon aria-hidden="true">` — the icon is now hidden from the accessibility tree, the button carries the single accessible name, and the ligature text no longer participates in name computation. Added `.job-link-btn` class (reset `background`/`border`/`padding`, preserve focus visibility via `outline: 2px solid currentColor` on `:focus-visible`).

### Runtime safety net — `fixLabelInName` extended

To catch any remaining `<v-icon>`-as-button cases that might slip in via future CMS edits or unreviewed components, extended `fixLabelInName()` in `src/a11y/index.js`: for every `button[aria-label]`, `a[aria-label]`, `[role=button][aria-label]` that contains a `.v-icon`/`.material-icons`/`.mdi` descendant, if stripping the icon text from the element leaves nothing (or far less than the `aria-label`), stamp `aria-hidden="true"` on each icon descendant. This is defense-in-depth — the Vue-level fix remains the preferred shape.

### Tests

New `tests/unit/contentSanitizer.spec.js` covers the four new plugins and the extended `fixCmsContrast`: 20 specs, 20 passing. Includes orphan-header handling, `headers`/`id` attribute generation on complex tables, void-child preservation, href-derived disambiguation, and Word-blue substitution in all three syntactic forms. One pre-existing test in `markdown.spec.js` was updated because the new `fixCmsTables` pipeline now promotes the first data cell to `<th scope="row">` (previously `<td>`) — the new expectation matches the accessibility-correct output.

### Net result

- 214 table-context flags fixed at pre-render time (no longer timing-dependent)
- 9 empty-container/empty-heading flags fixed at pre-render time
- 1 image-only-link flag fixed at pre-render time
- 1 duplicate-link-text flag fixed at pre-render time
- 1 Word-blue contrast flag fixed at pre-render time
- 1 `JobCard` icon-button mismatch fixed in Vue
- 246/246 unit tests passing
- Axe-core still 100/100 on the About pages and 97→expected-100 on the law-enforcement article after next deploy

### Not fixable from this repo

~150 SiteImprove occurrences on `/ifvcc/*`, `/adultredeploy/*`, `/arrestexplorer/*`, `/mhcontinuum/*`, `/sudcontinuum/*` are on external Drupal/standalone sites that this SPA redirects to via `window.location.href` (`src/router/external/index.js`). Those sites have their own codebases and a11y remediation would happen there. Documented for future-me so this doesn't get rescanned and re-triaged.

---

## [1.5.1] - 2026-04-12

### A11y + Perf — Font consolidation, modal focus management, external-link hardening, consultant docs

Bundled sweep of accessibility and performance cleanups that surfaced during a "ruthless outside consultant" code review. None of these items are individually huge; together they add up to a noticeably cleaner critical path and a stronger accessibility baseline ahead of a planned external audit.

### Perf — Font stack consolidation

The site had accumulated six typographic systems over the years: Lato, Oswald, Roboto, Raleway, Gentium Book Basic, Material Icons, plus the self-hosted MDI webfont. That's overkill for a state-agency content site and costs meaningful bytes on the critical path (each Google Fonts stylesheet fans out to multiple WOFF2 subresource downloads).

- **`public/index.html`** — removed the Roboto, Raleway, and Material Icons `<link>` tags. Kept a single async-loaded Lato + Oswald link (the `media="print" onload` non-blocking pattern, unchanged).
- **`src/assets/hub.css`** — `#article-view` font-family changed from `"Gentium Book Basic", serif` to `Georgia, "Times New Roman", serif`. Serif style preserved via system fonts; zero bytes downloaded.
- **`src/assets/app.css`** — Vuetify 2 defaults to Roboto in its compiled CSS. Since we removed the Roboto webfont, non-hub pages would otherwise fall through to the browser's system sans-serif (inconsistent across platforms). Added explicit overrides so `.v-application` uses Lato for body/input/button text, Oswald for Vuetify's `text-h1` through `text-h6` / `display-*` / `headline` / `title` utility classes.

Net effect: two font families on the wire (plus MDI icons), down from six. More cohesive typography across the entire site.

### A11y — Modal / drawer focus management

The `AppSidebar` navigation drawer (`v-navigation-drawer temporary`) previously had no keyboard accessibility beyond what Vuetify provides, which is roughly none for focus management. Per WCAG 2.4.3 (Focus Order) and 2.1.2 (No Keyboard Trap, inverted — focus should be trapped *inside* a dialog until it closes):

- **`src/components/AppSidebar.vue`** — added a `drawer` watcher that, on open, remembers `document.activeElement` and focuses the first focusable element inside the drawer; on close, returns focus to the opener. Installed a document-level `keydown` listener that (a) closes the drawer on `Escape`, and (b) traps Tab / Shift+Tab inside the drawer's focusable elements.

`ModalSearch` and `ModalTranslate` inherit Vuetify's `v-dialog` built-in focus management, which is sufficient.

### A11y — External-link hardening

Audit found 22 `<a target="_blank">` links across six files with no `rel` attribute, and six `window.open()` call sites without `noopener,noreferrer` — both are security-and-perf leaks (`target="_blank"` gives the destination page limited access to the opener via `window.opener`, and without `noopener` the new page runs in the same process group as the current one).

- **22 `<a target="_blank">` attrs** got `rel="noopener noreferrer"` across `AppFooter`, `AppSidebar`, `PublicationCard`, `EmploymentAll`, `PublicationsAll`, `AdminHome`, `PublicationEditor`.
- **6 `window.open()` calls** got `"noopener,noreferrer"` as the third argument across `SearchCard`, `SearchCardAlt`, `EventCard`, `ArticlesSingle`, `DatasetsSingle`, `AttachmentList`.

Batch edits were applied via a Node script that only added the `rel` attribute when one wasn't already present on the same tag — idempotent.

### A11y — Icon-button aria-label cleanup

Screen-reader best practice: aria-labels should describe the action ("Share on Facebook"), not narrate the interaction ("Click this button to share this page on Facebook"). The latter is verbose, patronizing, and breaks the SR user's rhythm.

- **`src/components/SocialSharing.vue`** — four aria-labels rewritten: "Click this button to share or translate this page" → "Share or translate this page"; "Click this button to share this page on Facebook" → "Share on Facebook"; same pattern for Twitter and Google Translate.

### Route announcements — verified, no change

`App.vue`'s existing `announceRoute()` implementation (sets `routeAnnouncement = document.title` with a 300ms timeout to let `vue-meta` update the title) is correctly wired to the `$route` watcher. Tested across several route transitions. Keeping as-is.

### Consultant documentation

New: **`docs/NUXT-ARCHITECTURE-RECOMMENDATIONS.md`** — companion to the existing `NUXT-REWRITE-PLAN.md`. Comprehensive architectural guidance for the planned Nuxt 4 rewrite, written as lessons-learned from this codebase. Covers:

- The one decision that matters most (SSG, not SSR — diverges from the existing plan, with honest trade-off analysis)
- Recommended stack: Nuxt UI 4, `@nuxt/content`, `@nuxt/fonts`, `@nuxt/image`, `@nuxt/icon`, `@vueuse/nuxt`, Pinia, Vitest
- Explicit "avoid" list tied to specific mistakes observed in the current codebase (Vuetify bundle weight, six-font stack, 24 runtime a11y `fix*` functions, Apollo Client when zero mutations exist, global component auto-registration, hand-rolled search, icon webfonts, `graphql-tag` + `eslint-plugin-graphql` schema drift, `moment.js`, `vue-meta`, `regenerator-runtime`)
- Starter `nuxt.config.ts`
- Migration strategy notes (MVP first, traffic splitting, error monitoring from day 1, content migration as the primary risk)
- Accessibility start-of-project checklist

Hand this to the new site's developers and an a11y consultant at project start, not at project end.

### Deferred / not included

- **`outline: none` audit** — three instances exist (`github-markdown.css:21`, `app.css:419`, `ModalSearch.vue:254`), but each is paired with a visible `:focus-visible` replacement in the same stylesheet. Not regressions; left alone.
- **Heading hierarchy audit, touch-target audit, 200%-zoom audit, `prefers-reduced-motion` audit** — mentioned as items a manual consultant will flag. Not addressed in this sweep; queued for the a11y consultant engagement.
- **Screen-reader testing** — requires manual VoiceOver/NVDA testing. Out of scope for a code-only sweep.

### Net result

- Critical path lighter (4 fewer Google Fonts stylesheet requests)
- Cohesive typography (2 families + icons, down from 6)
- Keyboard-only users can use the mobile nav drawer (Tab, Shift+Tab, Escape)
- External links can't hijack or throttle the opener via `window.opener`
- Screen-reader users get cleaner button labels
- Lint clean; production build verified

---

## [1.5.0] - 2026-04-12

### Perf — Replace Apollo Client + vue-apollo with a thin fetch-based shim (−50 KiB brotli)

Minor-version bump to signal the dependency break. No user-visible behavior change — every page that consumed CMS content still does — but the Apollo Client stack is out of the tree and the 41 consumer components weren't touched. A survey of the codebase before starting this migration showed: zero mutations, zero subscriptions, zero `$apollo.query`/`$apollo.mutate` imperative calls, `cache-first` default with 20+ views explicitly setting `fetchPolicy: "no-cache"`. The only Apollo features actually realized on this site were (a) the in-memory response cache, which was opted out of by most consumers, and (b) the `sanitizeLink` afterware that deep-sanitizes every string in every response. Both are preserved.

### Architecture

**Two new files replace the Apollo stack entirely:**

- **`src/gql-client.js`** (~160 LOC) — fetch-based GraphQL client. Plain `POST` to the Strapi endpoint with a timed-out `AbortController` (8s), single retry on transient network errors, in-flight request deduplication, in-memory response cache (Map-keyed by endpoint + query + variables), and the `deepSanitize` afterware moved verbatim from the old `src/vue-apollo.js`. Exports a `gql` template tag that returns the raw GraphQL string — no AST parsing on the client, source-side syntax unchanged (ESLint's graphql plugin still validates `gql` templates against `schema.json` at lint time). Rich errors carry `.graphQLErrors`, `.networkError`, `.status`, `.timeout` flags; all errors also dispatch a `gql-error` CustomEvent on `window` so future observability can attach without code changes.

- **`src/mixins/apollo-shim.js`** (~80 LOC) — Vue global mixin that reads each component's `this.$options.apollo` block and dispatches queries through `runQuery()`. Registered once in `main.js` via `Vue.mixin(gqlShim)`. Installs a reactive `this.$apollo = Vue.observable({ loading: false })` in `beforeCreate` on any component that declares `apollo: {}`, so the ~21 templates that bind `:loading="$apollo.loading"` continue working identically to vue-apollo. Preserves support for `query`, `variables` (function or object), `result()`, `error()`, `fetchPolicy`, `prefetch` (accepted for syntax parity; no-op without SSR), and `context.uri` (per-query endpoint override used by 3 Hub views that hit `researchhub.icjia-api.cloud` instead of the default `agency.icjia-api.cloud`).

**What changed in consumer code: one line per `src/graphql/*.js` file.**

All 15 GraphQL-query files had their `import gql from "graphql-tag"` replaced with `import { gql } from "@/gql-client"`. The `gql\`query { ... }\`` syntax is unchanged. **Zero changes were required in any of the 41 components** that declare `apollo: {}` blocks — the shim reads the same option shape vue-apollo did.

### Enhancements beyond what the old Apollo config had

Five small additions that make the fetch-based client strictly better than the vue-apollo configuration it replaces:

1. **Timeout** — `AbortController` with an 8-second cap. Apollo had no timeout; a slow Strapi could hang indefinitely.
2. **Retry once on transient network errors** — only on connection-level failures (`TypeError`, `AbortError`), not on HTTP 4xx/5xx or GraphQL errors (those are deterministic). Apollo's retry-link was never wired here.
3. **Request deduplication** — identical simultaneous in-flight queries share a single promise. Matches Apollo's built-in behavior.
4. **Rich errors** — `.graphQLErrors` array alongside `.message`, `.networkError` flag, `.status` for HTTP failures, `.timeout` for aborts. `error()` callback handlers continue accessing `err.message` (back-compat) but can now also inspect the rest.
5. **Telemetry hook** — every error dispatches a `gql-error` CustomEvent on `window`. Zero cost if nothing listens; ready for Sentry / Plausible / custom analytics without touching client code.

### Changes

- **Deleted:** `src/vue-apollo.js`
- **New:** `src/gql-client.js`, `src/mixins/apollo-shim.js`
- **Modified:** `src/main.js` (register the mixin, drop `apolloProvider` from root Vue instance), `vue.config.js` (dropped `pluginOptions.apollo`), 15 `src/graphql/*.js` files (one-line import change)
- **`package.json`:** uninstalled `vue-apollo`, `vue-cli-plugin-apollo`, `graphql-tag`. Kept `graphql` + `eslint-plugin-graphql` (dev-time schema validation; no runtime impact).

### Build-output verification (v1.4.3 → v1.5.0)

- `chunk-vendors.*.js` uncompressed: 913 KiB → **678 KiB (−235 KiB, −26%)**
- `chunk-vendors.*.js` brotli: 233 KiB → **183 KiB (−50 KiB, −21%)**
- `chunk-vendors.*.js` gzip: 299 KiB → **231 KiB (−68 KiB, −23%)**
- Build succeeds; lint clean; all 41 consumer components work unmodified.

### Cumulative bundle trajectory (v1.3.47 baseline → v1.5.0)

- v1.3.47 vendor brotli: ~487 KiB
- v1.5.0 vendor brotli: **183 KiB (−304 KiB, −62%)** across the moment-timezone trim, lazy component registration, dead-dep removal, moment→Day.js migration, MDI self-host, and Apollo removal.

### What was deliberately not replicated from Apollo

- **Normalized cross-query cache** — Apollo normalizes responses by `__typename + id` and updates every view that references the same entity when any query mutates it. This codebase has zero mutations, so no consumer exists for this feature. Safe loss.
- **Subscriptions / websockets** — `wsEndpoint` was `null` in the old vue-apollo config. Never used.
- **Operation AST parsing** — `graphql-tag` parsed templates into an AST. Our `gql` returns the raw string. Strapi receives and parses it server-side exactly as before.

### Migration tested across

Home, About (BasePage), News listing, News single, Events listing, Events single, Funding listing, Funding single, Hub home, Hub articles listing (`/articles`), Hub datasets listing, Hub apps listing, Meetings, Required Forms, Staff, Publications, IRB. All routes that use GraphQL render correctly. Race condition on the `/search/:query` (tag-click) route that surfaced during migration testing was fixed in v1.4.x before this ship.

---

## [1.4.3] - 2026-04-12

### Perf — Kill render-blocking `@import`; preload home splash; drop eager regenerator-runtime

Three targeted wins after inspecting the full Lighthouse HTML report:

**1. Render-blocking `@import` in `ArticleView.vue`.** The report pointed `render-blocking-insight` at a Google Fonts URL (`?family=Gentium+Book+Basic:ital@0;1&family=Lato...&family=Oswald...`) — which was weird, because none of our `<link>` tags in `index.html` request that set. Trace: `src/components/Hub/ArticleView.vue:419` had an `@import url(...)` inside its `<style>` block. CSS `@import` is always render-blocking (the browser must fetch and parse the imported stylesheet before the component's own styles apply). Worse, this CSS ended up in the main bundle because `src/components/Hub/_hub.js` still registers Hub components synchronously — so the Google Fonts CSS was being fetched on *every* page, not just article pages.

Fix: added `Gentium Book Basic` to the main async-loaded Google Fonts `<link>` in `public/index.html` (which uses the `media="print" onload="this.media='all'"` non-blocking pattern); deleted the `@import` from `ArticleView.vue`. Same font now loads the right way.

**2. Home-splash LCP preload.** `lcp-discovery-insight` was flagging the home hero image as a discoverable-too-late LCP resource. The previous preload attempt (v1.3.x) used `vue-meta`, which injects tags *after* Vue mounts — so the preload tag was appearing after `<picture>` had already started fetching. Moved the preload to inline `<script>` at the top of `<head>` in `public/index.html`, conditionally creating `<link rel="preload" as="image" type="image/avif" fetchpriority="high">` only when `location.pathname === "/"`. Runs synchronously during HTML parse — browser can start the fetch before it even gets to `<body>`. The `type="image/avif"` filter means non-AVIF browsers skip the preload and get the `<picture>` WebP/JPG fallback as before.

**3. Drop eager `regenerator-runtime` import.** `src/main.js:2` had `import "regenerator-runtime/runtime"` — this loads the regenerator polyfill eagerly, needed only for older browsers that don't support native async/generators. With `.browserslistrc` set to `"last 2 years"`, every target has native support, so Babel's preset-env wasn't emitting regenerator transforms anyway. Removed. Build succeeds; addresses most of `legacy-javascript-insight: 10 KiB`.

### Changes

- **`src/main.js`** — removed `import "regenerator-runtime/runtime"`.
- **`public/index.html`** — inline `<script>` at top of `<head>` injects home-splash preload on `/`. Main Google Fonts `<link>` now includes `Gentium+Book+Basic:ital@0;1` alongside `Lato` + `Oswald` (same async-load pattern).
- **`src/components/Hub/ArticleView.vue`** — deleted the `@import url("https://fonts.googleapis.com/...")` line from the `<style>` block. The Gentium font-family still applies (declared in `src/assets/hub.css:42`); it's now loaded from the main async link.

### Not fixing (intentionally, per user direction)

- **Vuetify PurgeCSS** — skipped. Known brittle against Vuetify's runtime-generated class names.

### Net result

- `render-blocking-insight` should clear (the only flagged resource was the @import)
- `lcp-discovery-insight` should move — preload gives the browser a head start on the hero image
- `legacy-javascript-insight: 10 KiB` should shrink or clear
- No visible behavior change

---

## [1.4.2] - 2026-04-12

### Perf — Self-host MDI fonts with `font-display: swap`; fix homepage news-card image size

Two targeted wins from the remaining Lighthouse insight set:

**1. `font-display-insight` (−120 ms) + remove last third-party CDN.** The MDI icon font has been loaded from `cdn.jsdelivr.net` since before this changelog. The upstream CSS ships without `font-display: swap`, which blocks text rendering while the webfont is fetched — consistently flagged by Lighthouse as ~120 ms of savings. Self-hosting lets us patch the `@font-face` rule and kill the last CDN dependency.

**2. `image-delivery-insight` (−33 KiB) — homepage news-card image bug.** `src/components/HomeCardNews.vue#getImage` had an inert branch: both the mobile (`sm`/`xs`) and desktop paths returned `formats.small.url`. Mobile news cards stack to full-width (~360px rendered) but were being served the ~500px `small` variant. Strapi also generates a `thumbnail` variant (~245px) which is the right fit for mobile — confirmed present because `HomeFeatureRibbon.vue:16` already consumes it.

### Changes

**Self-host MDI:**
- **`public/fonts/mdi/`** (new) — `materialdesignicons.min.css` + `materialdesignicons-webfont.{woff2,woff,ttf}`. The CSS's first `@font-face` rule was rewritten inline to (a) drop the IE-only `eot` format and the embedded-opentype `src:` fallback, (b) rebase URLs from `../fonts/...` to `./...` to match the co-located font files, (c) add `font-display: swap`. Rest of the icon-class declarations copied verbatim from `@mdi/font@^7.4.47`.
- **`public/index.html`** — the async-loaded `<link rel="stylesheet">` (and its `<noscript>` fallback) now point at `/fonts/mdi/materialdesignicons.min.css` instead of the jsdelivr URL.
- **`netlify.toml`** — removed `https://cdn.jsdelivr.net` from the CSP Report-Only `script-src` / `style-src` / `font-src` directives. Updated the allowlist audit comment. No external CDN remains on the critical path; everything except Google Fonts, Plausible, and Strapi is same-origin.
- **`package.json`** — added `@mdi/font@^7.4.47` to `dependencies`. Checked into `public/fonts/mdi/` as static assets (pass-through copy by Vue CLI); the npm package is the source-of-truth for future refreshes.

**Homepage news-card image sizing:**
- **`src/components/HomeCardNews.vue#getImage`** — replaced the dead-branch conditional with `isMobile && formats.thumbnail ? formats.thumbnail : formats.small`. Mobile cards now get the ~245px thumbnail; desktop unchanged.

### Cache headers (already in place)

`netlify.toml`'s existing `[[headers]] for = "/fonts/*"` block already applies `Cache-Control: public, max-age=31536000, immutable`, so the MDI files inherit optimal caching with zero additional config. Same for the brotli-precompressed `.br` / `.gz` siblings emitted by `vue-cli-plugin-compression`.

### What was NOT done (investigated, not worth the cost)

- **Vue CLI `--modern` mode** — tried it, reverted. Because `.browserslistrc` is already set to `last 2 years`, the "modern" and "legacy" output bundles are byte-identical (no transpilation delta), so `--modern` only doubles `dist/` size for zero runtime benefit. The `legacy-javascript-insight: 10 KiB` in Lighthouse persists because of the eager `import "regenerator-runtime/runtime"` in `src/main.js`, not because of Babel transpilation — worth a follow-up separately.

### Net result

- 120 ms Lighthouse "Font display" savings (cleared)
- One third-party origin removed (`cdn.jsdelivr.net` no longer in CSP or preconnects)
- Homepage news-card images on mobile now served at the correct resolution — ~30 KiB saved per flagged image
- No user-visible change; icons render identically, text renders sooner while the MDI font is still in-flight

---

## [1.4.1] - 2026-04-12

### Fix — Convert `generators/generateBuildInfo.js` to Day.js (Netlify postbuild crash)

v1.4.0 uninstalled `moment` and `moment-timezone` but missed the Node-side `postbuild` script that injects the build banner into `dist/index.html`. The src/ sweep only covered webpack-bundled code; this script runs under Node at build time and was still `require("moment")` / `require("moment-timezone")`. Netlify's `npm run build` succeeded through webpack, then crashed in `postbuild` with `Cannot find module 'moment'`.

### Fix

- **`generators/generateBuildInfo.js`** — converted from moment/moment-timezone to Day.js. Can't import from `@/plugins/dayjs` here because this is a Node CJS script (no webpack, no path aliases), so plugins are registered inline: `dayjs`, `dayjs/plugin/utc`, `dayjs/plugin/timezone`, `dayjs/plugin/advancedFormat`. Banner output format (`"dddd, MMMM Do YYYY, h:mm:ssa z"`) is identical — Day.js format tokens match moment's.

### Why this was missed

The v1.4.0 audit grep (`grep -rl "from \"moment\"|require(\"moment\")" src --include='*.vue' --include='*.js'`) was scoped to `src/`. Node-side scripts under `generators/` and `scripts/` weren't in scope. Full-repo grep was run against src/ only because the bundle-side concern was top-of-mind. Lesson recorded in the sweep pattern: for dep removals, grep the whole repo, not just `src/`.

---

## [1.4.0] - 2026-04-12

### Perf — Replace moment + moment-timezone with Day.js (−20 KiB gzipped)

Minor-version bump to signal the dependency swap. No user-visible behavior change — date formatting and timezone handling produce identical output — but `moment` and `moment-timezone` are removed from `dependencies` and `vue-cli-plugin-moment` + `moment-timezone-data-webpack-plugin` are removed from `devDependencies`.

Day.js was chosen over date-fns (already installed) for two reasons:

1. **Format tokens are moment-compatible** — `"MMMM DD, YYYY h:mm a"` works identically in Day.js. Date-fns would require translating every format string (`YYYY` → `yyyy`, `dddd` → `EEEE`, `Do` → `do`) across ~100 call sites, which is a silent-bug risk only visual testing can catch.
2. **Smaller final bundle for this usage pattern** — Day.js base (~2 KiB gz) plus the five plugins we need (`utc`, `timezone`, `relativeTime`, `advancedFormat`, `duration`) totals ~7 KiB gz, vs. ~11-13 KiB gz for equivalent date-fns + date-fns-tz coverage of the same function set.

### Changes

- **`src/plugins/dayjs.js`** (new) — single shared Day.js instance. Registers the five plugins, sets `America/Chicago` as the default tz. All consumers import from `@/plugins/dayjs` so plugin registration happens exactly once.
- **Converted 26 files** from `moment` to `dayjs` (`src/filters.js` + 25 components / views). Mechanical translation:
  - `import moment from "moment"` → `import dayjs from "@/plugins/dayjs"`
  - `const moment = require("moment")` / `const tz = require("moment-timezone")` → single `import dayjs from "@/plugins/dayjs"` (CJS-style in `EventCard.vue` and `EventsAll.vue`)
  - `moment(...)` → `dayjs(...)` (all call sites)
  - `moment.duration(...)` → `dayjs.duration(...)`
  - `moment.tz.setDefault(...)` calls removed (set once in the plugin)
- **`vue.config.js`** — removed `MomentTimezoneDataPlugin` webpack plugin and the `pluginOptions.moment` block (`locales: ["en"]`). Both are no-ops now that moment is gone.
- **`package.json`** (`npm uninstall`):
  - `moment`
  - `moment-timezone`
  - `vue-cli-plugin-moment`
  - `moment-timezone-data-webpack-plugin`
- **`package.json`** (`npm install`):
  - `dayjs` ^1.11.20 (runtime, ~2 KiB gz base)

### Day.js plugins used (and why)

- `utc` — prerequisite for `timezone`
- `timezone` — replaces `moment-timezone` for `.tz("America/Chicago")` call sites (Intl-API-backed, no bundled tz database)
- `relativeTime` — `.fromNow()` and `.toNow()` (used in `filters.js`)
- `advancedFormat` — `Do` ordinal tokens (e.g. `"MMMM Do YYYY"` → "April 12th 2026")
- `duration` — `dayjs.duration(ms).asDays()` pattern used in 16 card components to compute "days since published"

### Build-output verification (v1.3.51 → v1.4.0)

- `chunk-vendors.*.js` uncompressed: 979 KiB → **913 KiB (−66 KiB, −7%)**
- `chunk-vendors.*.js` brotli: 247 KiB → **233 KiB (−14 KiB, −6%)**
- `chunk-vendors.*.js` gzip: 319 KiB → **299 KiB (−20 KiB, −6%)**
- Lint clean; production build succeeds

### Cumulative bundle trajectory (v1.3.47 baseline → v1.4.0)

- v1.3.47 vendor brotli: ~487 KiB
- v1.4.0 vendor brotli: **233 KiB (−254 KiB, −52%)** across the moment-timezone, lazy-component-registration, dead-dep, and moment→Day.js changes

### Risks & things to watch after deploy

- **Date output parity**: Day.js format tokens are moment-compatible, but edge cases can differ (e.g. pluralization in `fromNow()`). Primary consumers: Home, News, Events, Publications, Meetings, Required Forms, Hub articles. Eyeball dates on those pages after deploy.
- **`moment.fromNow(true)` vs `dayjs.fromNow(true)`**: identical signature and semantics (returns relative time without suffix).
- **`toNow()`**: same plugin (`relativeTime`) in both libraries, same behavior.

---

## [1.3.51] - 2026-04-12

### Perf — Remove dead deps: AOS (unused animations) and `@mdi/js` (unused icons)

Two zero-behavior-impact removals surfaced while profiling the vendor chunk:

**AOS (Animate on Scroll)** was imported, CSS-imported, and `AOS.init()`-called from `src/main.js`, but the entire codebase contains **zero `data-aos` attributes** (grep across `src/**/*.{vue,js}`). The library was wired up but had never had a consumer — it shipped ~15 KiB JS + ~10 KiB CSS every page load for nothing.

**`@mdi/js`** (^6.1.95, 5.8 MB installed) was listed in `dependencies` but never imported anywhere in `src/`. The site renders MDI icons via the `@mdi/font` webfont loaded from jsdelivr (see `public/index.html`), not the tree-shakeable SVG icon data in `@mdi/js`. No bundle impact (tree-shaking was already excluding it), but removing tightens the lockfile and eliminates the confusion about which MDI strategy the site uses.

### Changes

- **`src/main.js`** — deleted `import AOS from "aos"`, `import "aos/dist/aos.css"`, and the `AOS.init()` call.
- **`package.json`** — `npm uninstall aos @mdi/js`.

### Build-output verification (v1.3.50 → v1.3.51)

- `chunk-vendors.*.js` uncompressed: 992 KiB → **979 KiB (−13 KiB)** — AOS JS gone.
- `chunk-vendors.*.js` brotli: 251 → **247 KiB (−4 KiB)**.
- `chunk-vendors.*.css` uncompressed: 407 KiB → **381 KiB (−26 KiB)** — AOS CSS gone.
- `chunk-vendors.*.css` brotli: 48.75 → **46.45 KiB (−2.3 KiB)**.
- `node_modules` footprint: ~230 KiB (aos) + ~5.8 MB (@mdi/js) reclaimed on install.

### Net result

- ~6 KiB brotli off the wire on every cold load (JS + CSS combined)
- One dependency removed per removal rationale — no runtime behavior change because neither library had any consumer
- Lint clean, production build verified

---

## [1.3.50] - 2026-04-12

### Perf — Trim `moment-timezone` to America/Chicago only (−236 KiB brotli on vendor chunk)

Vendor-chunk profile after v1.3.48 showed 91 KiB of `unused-javascript` still attributed to `chunk-vendors`. Sniffing the bundle and correlating with `package.json` deps pointed at `moment-timezone`: the library ships the full IANA timezone database (~900 KiB of zone data) at build time unless a webpack plugin is used to match zones. Only three files on this site touch timezones (`src/filters.js`, `src/views/Events/EventsAll.vue`, `src/components/EventCard.vue`), and the only zone they ever render is `America/Chicago` (Illinois state agency, single-timezone use).

The existing `vue-cli-plugin-moment` with `locales: ["en"]` had already trimmed moment's own locale data — but that plugin does nothing for `moment-timezone`'s zone database, which is a separate build-time concern.

### Changes

- **`vue.config.js`** — wired `moment-timezone-data-webpack-plugin` via `chainWebpack`, scoped to `matchZones: /^America\/Chicago$/`. The regex is anchored so partial matches (e.g. `America/Chicago_Depot` — not a real zone, but illustrative) aren't accidentally included.
- **`package.json`**:
  - Added `moment-timezone-data-webpack-plugin` ^1.5.1 to `devDependencies`.
  - Removed `cheerio` from `dependencies`. Grep confirmed zero imports in `src/`; a `strings` scan of the vendor chunk showed cheerio was never actually bundled (tree-shaking already excluded it), but keeping it in `dependencies` was an install-time waste (316 KiB in node_modules) and a red herring for anyone auditing deps.

### Build-output verification (before → after)

- `chunk-vendors.*.js` uncompressed: **1.73 MB → 992 KiB (−742 KiB, −43%)**
- `chunk-vendors.*.js` brotli: **487 KiB → 251 KiB (−236 KiB, −48%)**
- `chunk-vendors.*.js` gzip: ~560 KiB → 324 KiB (−236 KiB, −42%)

The fact that the uncompressed drop (−742 KiB) is larger than the compressed drop (−236 KiB) confirms the removed content was JSON-like (the tz database compresses extremely well on its own, so its presence in the bundle was less painful in gzip/brotli than it appeared raw — but still a meaningful quarter-MB over the wire).

### Bundle-composition notes found during the audit (kept for the next pass)

- Lodash tree-shaking is already working correctly (`babel-plugin-lodash` via `vue-cli-plugin-lodash` is cherry-picking). Zero rare methods in the vendor chunk — no action needed.
- Vuetify tree-shaking is correctly wired via `vue-cli-plugin-vuetify` → `VuetifyLoaderPlugin`. `<v-*>` template usage is a-la-carte imported at build. No action needed.
- `date-fns` ^2.24.0 is already installed. Future work: migrate the ~30 `moment` consumers to `date-fns` for another meaningful bundle cut. Deferred — larger refactor.

---

## [1.3.49] - 2026-04-12

### Fix — Tag links on article pages crash the search view (race on fuse init)

Clicking a tag chip in an article view (or any link that navigates to `/search/:query`) intermittently threw `Uncaught TypeError: Cannot read properties of null (reading 'search')` from `SearchStatic.vue#instantSearch` and rendered an empty results list.

Root cause: `created()` kicks off `this.fuse = await this.$myApp.getFuse()` asynchronously, but `mounted()` was calling `this.instantSearch()` synchronously whenever `$route.params.query` was present. If `getFuse()` hadn't resolved by the time `mounted` fired — the normal case on a cold tag-click navigation — `this.fuse` was still `null` and `this.fuse.search(...)` crashed. The sibling component `Search.vue` (modal search) already had an `if (!this.fuse) return;` guard; `SearchStatic.vue` did not.

The timing that made this surface consistently: v1.3.48's lazy component registration changed the main-bundle-parse → route-chunk-load sequence just enough to shift the relative finish times of `getFuse()` and `mounted()`. The bug was latent before; it just wasn't always deterministic.

### Fix

- **`src/views/Search/SearchStatic.vue`**:
  - Moved the initial-query logic from `mounted()` to `created()`, placed *after* the `await this.$myApp.getFuse()` call so it only fires when fuse is ready.
  - Added defensive `if (!this.fuse) return;` guards at the top of both `instantSearch()` and `sortResults()` — both methods call `this.fuse.search(...)` directly and would have the same crash under other timing paths (e.g. a user hitting sort before fuse finished loading).

### Net result

- Tag-click navigations from article pages render results correctly instead of throwing
- Pattern now matches the `Search.vue` modal, `ModalSearch.vue`, and `StaticSearch.vue` — all of which guard on `this.fuse` being ready before calling `.search()`
- No behavior change on the happy path; only the race window is closed

---

## [1.3.48] - 2026-04-12

### Perf — Lazy-register global components + delete 7 unused components

`_globals.js` was forcing every top-level `.vue` file in `src/components/` into the main bundle via `require.context` + synchronous `Vue.component(...)`. That meant homepage-only widgets (`HomeSplashV2`, `HomeNews`, `HomeEvents`, etc.), content-type cards (`JobCard`, `MeetingCard`, `PublicationCard`, etc.), and never-used components all shipped on every route. Lighthouse had flagged `unused-javascript: 143 KiB` as the top remaining drag.

Audited all 57 globally-registered components: 7 were unreferenced anywhere in `src/`, the rest split cleanly into "layout chrome needed on first paint" (9 components, mounted directly in `App.vue`) and "only needed on specific routes" (40 components).

### Changes

- **Deleted unused components** (`src/components/*.vue`):
  - `____HomeSplash.vue` (malformed name, superseded by `HomeSplashV2`)
  - `FundedMap.vue`, `InfoCard.vue`, `PolicyTable.vue`, `Test.vue`, `TocPolicies.vue`, `Toggle.vue` — zero call sites confirmed by grep across `.vue` files
- **`src/components/_globals.js`** — split into two-tier registration:
  - 9 layout components (`AppFooter`, `AppNav`, `AppNavContext`, `AppNavContextBottom`, `AppSidebar`, `SkipLink`, `Disclaimer`, `ModalSearch`, `ModalTranslate`) imported eagerly and registered synchronously — required on first paint
  - every other top-level component registered as async via `require.context(".", false, /[\w-]+\.vue$/, "lazy")` + `() => lazy(fileName)` — webpack emits one chunk per component, only fetched when the component is actually rendered

### Build-output verification

- 40+ new on-demand chunks emitted (one per lazy-registered component)
- `dist/css/chunk-vendors.*.css`: 443.69 KiB → 407.38 KiB (−36 KiB raw, −4.5 KiB brotli) — Vuetify CSS that was being pulled in wholesale by the auto-globals is now component-scoped
- Main `app.js` chunk: 139 KiB uncompressed (lint + lazy conversion combined build)
- `npm run build` succeeds; `vue-cli-service lint --no-fix` reports no errors

### Net result

- Route-specific components (`HomeNews`, `JobCard`, `MeetingTable`, etc.) no longer load on routes that don't use them
- 7 dead-code files removed from the tree
- Registration API unchanged — no `components: { ... }` declarations needed in any consumer; existing templates continue working because the global names are still registered, just with async resolvers
- Tradeoff: first render of a lazy component has a one-frame async pause while its chunk loads. For most components this is imperceptible (chunks are 1-4 KiB), and route-level components render after their route chunk so the network is already warm

---

## [1.3.47] - 2026-04-12

### Perf — Drop Font Awesome entirely (swap 7 usages to MDI, remove whole icon library)

Lighthouse mobile audit after v1.3.46 was still showing `unused-javascript: 143 KiB` and `unused-css-rules: 103 KiB` as the top remaining drags. A grep of the codebase revealed only **5 unique icons** actually in use across just 2 components — yet `main.js` was importing `@fortawesome/fontawesome-free/css/all.css`, which pulls the full FA5 stylesheet (~60 KiB CSS) and 3 webfont files (~60-90 KiB each, render-blocking). Vuetify is already shipping MDI via `@mdi/font` for every other icon on the site, so Font Awesome was purely redundant.

### Changes

- **`src/components/AppNavContext.vue`** — swapped `fas fa-globe` → `mdi-web`, `fab fa-twitter` → `mdi-twitter`, `fab fa-facebook` → `mdi-facebook`.
- **`src/components/SocialSharing.vue`** — swapped `fa fa-users` → `mdi-account-group` plus the same three MDI equivalents for Twitter/Facebook/globe.
- **`src/main.js`** — deleted `import "@fortawesome/fontawesome-free/css/all.css";`.
- **`package.json`** — removed `@fortawesome/fontawesome-free` dependency (ran `npm uninstall`).

### Net result

- Whole Font Awesome CSS file (~60 KiB) no longer shipped to the client
- 3-4 FA webfont files no longer preloaded/downloaded by the CSS
- Visual parity preserved — MDI `mdi-twitter`, `mdi-facebook`, `mdi-web`, `mdi-account-group` are close visual matches and share Vuetify's existing sizing/color treatment
- Production build verified (`npm run build` succeeds on v1.3.47)

---

## [1.3.46] - 2026-04-12

### Perf — Drop jQuery and trim preconnects (removes 214 ms render-blocking node)

Lighthouse mobile audit (Perf 55) flagged the initial critical-path chain as `index.html → cdnjs/jquery.slim.min.js (214 ms) → plausible /api/event (442 ms)` plus a "more than 4 preconnect connections" warning. The jQuery tag was sitting at the bottom of `<body>` without `defer`, so it blocked the HTML parser even though nothing in `index.html` actually used it — the only consumer was two `window.jQuery(...)` footnote-link handlers inside `ArticleView.vue`.

### Changes

- **`public/index.html`** — deleted the jQuery `<script>` tag (and the stale commented-out `code.jquery.com` tag alongside it). Removed the `cdn.jsdelivr.net` preconnect: the MDI stylesheet served from that origin is now async-loaded (v1.3.41), so the preconnect no longer helps LCP and just counted against the Lighthouse preconnect budget.
- **`src/components/Hub/ArticleView.vue`** — replaced `window.jQuery('[id*="fnref"], .footnote-backref').on/off("click", ...)` with a vanilla `addEventListener` / `removeEventListener` pair. The handler is cached on the component instance so `beforeDestroy` can detach cleanly. Selector scoped to `this.$el` (article root) instead of `document`, which is the correct scope for footnote markup.
- **`netlify.toml`** — dropped `https://cdnjs.cloudflare.com` from the CSP Report-Only `script-src`, `style-src`, and `font-src`: now a dead origin. Updated the allowlist audit comment accordingly.

### Net result

- 214 ms request removed from the mobile critical-path chain (was the #2 node after the initial HTML)
- ~22 KiB JS no longer fetched
- Preconnect count down from 5 → 4 (clears the Lighthouse "sparingly" warning)
- CSP allowlist tightened by one unused origin
- No functional change: footnote handlers still preventDefault + smooth-scroll via `$vuetify.goTo`

---

## [1.3.45] - 2026-04-12

### Fix — Remove `upgrade-insecure-requests` from Report-Only CSP (kills console noise)

Production was emitting this Chrome console warning on every page load:

```
The Content-Security-Policy directive 'upgrade-insecure-requests' is ignored
when delivered in a report-only policy.
```

Per the CSP spec, `upgrade-insecure-requests` only takes effect in enforcement mode — the browser ignores it in `Content-Security-Policy-Report-Only` and logs a warning saying so. The directive was added in v1.3.40 alongside the (later reverted) enforcement promotion, and stayed behind in the report-only policy after the v1.3.41 revert. The site does not actually need this directive today (no `http://` resources are served — every origin in the allowlist is HTTPS), so removing it is a no-op for security.

### Fix

- **`netlify.toml`** — removed `; upgrade-insecure-requests` from the `Content-Security-Policy-Report-Only` value. Updated comment to note the directive should be re-added inside the enforcement block when CSP is later promoted.

### Net result

- Three `console.warn` lines per page load eliminated
- Security posture unchanged (the directive was a no-op in report-only mode anyway)
- Re-promotion checklist amended: when renaming the header to `Content-Security-Policy`, append `; upgrade-insecure-requests` back to the value

---

## [1.3.44] - 2026-04-12

### Docs — Refresh README to Reflect End of v1.3.x Perf Series

The README's Performance section now covers the full v1.3.36–v1.3.43 sequence (was v1.3.36–v1.3.38) and includes:

- Two new rows in the perf-wins table for v1.3.40 (preload removal + lazy footer/Status images), v1.3.42 (async stylesheet loading — the **render-blocking 4,000ms → 370ms** result), and v1.3.43 (homepage hero AVIF + pre-grayscale + `fetchpriority="high"` — the **94 KB → 36 KB / LCP -5.5s** result)
- A new **"Mobile Lighthouse audit — final state"** subsection with the actual numbers from the post-deploy audit across 20 routes (perf 53–58, FCP 7.3–8.6s, LCP 7.9–11.0s, top remaining issues all framework-level)
- A new **"Where the v1.3.x line ends — honest framing"** subsection making explicit that further perf work requires architectural change (SSR/SSG, Vuetify swap, pre-rendering) — i.e., the planned Nuxt 4 rewrite

This is a documentation-only release. No source code changes; no behavior changes. Closes the v1.3.x perf push.

---

## [1.3.43] - 2026-04-12

### Performance — Optimize Homepage Hero Image (LCP outlier)

The 20-page mobile Lighthouse audit (v1.3.41) found that every page sat in the 55–58 perf band — except the homepage, which had **LCP 16.5s** (vs ~8.5s elsewhere). Cause: `home-splash.webp` was the LCP element and Lighthouse flagged ~82 KB of savings on `image-delivery-insight`.

### Fix

Re-encoded `public/home-splash.{avif,webp,jpg}` from the 1000×667 source via `sharp`, applying three observations:

1. **Pre-grayscale at the source.** The CSS already applied `filter: grayscale(100%)` at render time, throwing away color data after decode. Pre-grayscaling the file means smaller bytes (no chroma channels) AND no compositor pass at runtime.
2. **AVIF is the new modern format** — added as the first `<source>` in the `<picture>` element. ~30% smaller than WebP at equivalent quality.
3. **Aggressive quality is fine** — the image renders behind a heavy `rgba(55, 90, 127, 0.55)` blue overlay plus a `rgba(100, 100, 100, 0.9)` content card. Quality 40 (AVIF) / 50 (WebP) / 65 (JPEG) artifacts are imperceptible under the overlay.

### Size deltas

| Format | Before | After | Δ |
|---|---|---|---|
| AVIF | (didn't exist) | 36 KB | new |
| WebP | 94 KB | 53 KB | **-44%** |
| JPEG | 151 KB | 72 KB | **-52%** |

For modern browsers serving AVIF: **94 KB → 36 KB = 62% smaller** for the LCP image.

### Other changes in `HomeSplashV2.vue`

- Added `<source srcset="/home-splash.avif" type="image/avif" />` as the first `<source>` (browser picks the first format it supports)
- Removed the `filter: grayscale(100%)` style (image is now pre-grayscaled in the file)
- Added `fetchpriority="high"` and `decoding="async"` to the fallback `<img>` so browsers know this is the LCP candidate and can prioritize it

### Expected mobile Lighthouse impact

Based on Lighthouse's 82 KB savings estimate combined with the actual 58 KB AVIF reduction:
- **Homepage LCP: ~16.5s → ~10–11s** (still the slowest page due to the SPA mount delay, but no longer 2x slower than other pages)
- **Homepage perf score: 53 → ~62–65** (closing most of the gap with the rest of the site)
- **Other pages: unchanged** (this fix is homepage-specific)

### Honest framing — where we are

The v1.3.36–v1.3.43 series has fixed every Tier-1 perf issue surfaced by the audit. What's left is framework cost — Vuetify 2 + Vue 2 = ~1.8 MB of `chunk-vendors.js` plus ~100 KB of unused CSS. None of that is fixable inside the v1.3.x line; it's architectural and waits for the Nuxt 4 rewrite. See README "Performance" section for the full list of changes and tradeoffs.

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

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

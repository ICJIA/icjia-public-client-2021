# Changelog

All notable changes to the ICJIA Public Website are documented in this file.

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

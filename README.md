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
- **Node:** 16.x (required — `node-sass@6` blocks Node 17+)

## Requirements

**Node.js 16.x is required** for local development and builds.

```bash
# Install and use Node 16
nvm install 16
nvm use 16
node --version  # Should show v16.x.x
```

This project includes a `.nvmrc` file. If your shell is configured for auto-switching, it will use Node 16 automatically.

## Setup

```bash
nvm use 16
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

201 automated unit tests covering security mitigations, accessibility functions, markdown rendering, Vue components, auth store, and data integrity.

```bash
npm run tests
```

| Suite | Tests | What it guards |
|---|---|---|
| `security.spec.js` | 39 | XSS payloads (20+), GraphQL injection, security headers, CORS, source maps |
| `config.spec.js` | 95 | HTTPS enforcement, 10 API data files, build config, env security |
| `markdown.spec.js` | 21 | Heading anchors, link attributes, tables, code blocks, edge cases |
| `a11y.spec.js` | 20 | All 8 a11y DOM fix functions (headings, tabindex, ARIA, target size) |
| `components.spec.js` | 14 | SkipLink, Banner, Disclaimer — rendering, props, XSS in v-html |
| `auth.spec.js` | 12 | Vuex mutations/getters, logout localStorage cleanup |

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

**Last audit:** March 24, 2026 — Red Team / Blue Team assessment across 2,345 routes and all application components.

**Overall rating: MODERATE-HIGH** — all critical (P0) and high (P1) client-side vulnerabilities mitigated; remaining items require backend changes.

| Category | Status | Details |
|---|---|---|
| **Security headers** | **Hardened** | X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy enabled |
| **CORS** | **Restricted** | Locked to `https://icjia.illinois.gov` (was wildcard `*`) |
| **XSS prevention** | **Hardened** | DOMPurify sanitization at `renderToHtml()` chokepoint covers all 85 `v-html` bindings; `document.write()` replaced with DOM API |
| **GraphQL injection** | **Mitigated** | Route params sanitized to `[a-zA-Z0-9_-]` before query interpolation |
| **External links** | **Hardened** | `rel="noopener noreferrer"` on all markdown-rendered links |
| **Auth tokens** | **localStorage** | JWT in localStorage; HttpOnly cookies require Strapi 3 backend migration |
| **HTTPS** | **Full** | All endpoints and CDN resources use TLS |
| **Static analysis** | **Active** | CodeQL runs on every push/PR; Dependabot monitoring enabled |
| **Console stripping** | **Active** | Production builds remove `console.log` via Babel plugin |

**Remaining items (backend-dependent):** SEC-06 (JWT HttpOnly cookies), SEC-07 (CSRF tokens), SEC-08 (login rate limiting). See [CHANGELOG.md](CHANGELOG.md) for full findings and remediation plan.

View the [security policy](SECURITY.md).

## Accessibility

**Compliance target:** WCAG 2.1 Level AA (Illinois Title II ADA requirement)

### Accessibility Testing Tools: axe-core vs. SiteImprove

This site is audited with two complementary tools that produce **different results for the same pages**. This is expected — not a sign of inadequate remediation.

**axe-core** (primary, open-source) runs in-browser after full page render, including all runtime accessibility fixes. It follows WCAG success criteria closely and only flags clear violations. This site passes axe-core with **zero violations across 57 sampled pages** (see "Why 57 pages?" below).

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

### Current Status (March 2026)

| Metric | Score |
|---|---|
| Sampled audit (57 pages, 10 content types) | **57/57 zero violations (100%)** |
| Regression tests (Playwright) | **37/37 passing** |
| Unit tests — a11y functions (Mocha/Chai) | **20/20 passing** |
| Unit tests — security (Mocha/Chai) | **39/39 passing** |
| Automated score (WCAG 2.1 AA) | **A / 100%** |

### Why 57 pages? (axe-core sampling strategy)

This site has **2,356 dynamic pages** generated from CMS content across 10 content types. The default axe-core audit tests **57 pages** (~5 randomly sampled per content type plus listing pages). This sampling approach is used because:

1. **Shared templates** — all 172 grant pages render through the same Vue component, all 251 Research Hub articles use the same `ArticleView.vue`, etc. If 5 random grant pages pass, the remaining 167 will pass too — they execute identical code paths.

2. **Runtime a11y fixes are global** — the 24 post-render fix functions in `src/a11y/index.js` run on every page. A fix like `fixTableCellContext()` applies to all CMS tables regardless of which article they appear in.

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
| **Total** | **2,356** | **~57** |

### Accessibility Features

- **Route announcements** — `aria-live` region announces page title on navigation for screen readers
- **Keyboard navigation** — all cards, buttons, and interactive elements are keyboard accessible
- **Semantic HTML** — proper heading hierarchy, `<nav>` landmarks, `<button>` elements
- **ARIA labels** — carousel slides, icon buttons, search fields, modals, download links
- **Skip navigation** — skip-to-content link for keyboard users
- **Color contrast** — all text uses black (#000) or white (#fff) for maximum contrast; runtime fix overrides CMS inline color styles
- **External links** — screen reader announcement of "(opens in new tab)"
- **Post-render CMS fixes** — JavaScript corrects accessibility issues from Strapi 3 markdown rendering (heading order, figure tabindex, chip contrast, empty table headers, table cell context with scope/headers for simple and complex tables, footnote target size, link underlines, form field labels, label-in-name conflicts, invalid ARIA roles, empty containers, inline color contrast)

### Known Remaining Issues

These originate from CMS-authored content or external proxy sites and are mitigated by post-render JavaScript where possible. They will be fully resolved in the planned Nuxt 4 / Strapi 5 rewrite:

- Heading level skips in some article bodies (CMS authors skip heading levels)
- Occasional async data race condition on listing pages (`page-has-heading-one`)
- Contrast issues on `/adultredeploy` (separate Netlify site proxied via `_redirects`)

See [CHANGELOG.md](CHANGELOG.md) for full audit details and remediation history.

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
│   └── plugins/            Vuetify and Apollo plugins
├── public/                 Static assets, generated API data, and llms.txt
├── tests/                  Playwright regression tests
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

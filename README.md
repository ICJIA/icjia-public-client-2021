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

## Accessibility

This site targets **WCAG 2.1 Level AA** compliance, as required for Illinois government websites under Title II of the ADA.

### Current Status (March 2026)

| Metric | Score |
|---|---|
| Core pages (12-page axe-core audit) | **12/12 zero violations** |
| Full site sweep (103 pages, 10 content types) | **100/103 clean (97%)** |
| Regression tests | **37/37 passing** |

### Accessibility Features

- **Route announcements** — `aria-live` region announces page title on navigation for screen readers
- **Keyboard navigation** — all cards, buttons, and interactive elements are keyboard accessible
- **Semantic HTML** — proper heading hierarchy, `<nav>` landmarks, `<button>` elements
- **ARIA labels** — carousel slides, icon buttons, search fields, modals, download links
- **Skip navigation** — skip-to-content link for keyboard users
- **Color contrast** — WCAG AA compliant (4.5:1 ratio minimum)
- **External links** — screen reader announcement of "(opens in new tab)"
- **Post-render CMS fixes** — JavaScript corrects accessibility issues from Strapi 3 markdown rendering (heading order, figure tabindex, chip contrast, empty table headers)

### Known Remaining Issues

These originate from CMS-authored content and are mitigated by post-render JavaScript. They will be fully resolved in the planned Nuxt 4 / Strapi 5 rewrite:

- Heading level skips in some article bodies (CMS authors skip heading levels)
- Occasional async data race condition on listing pages (`page-has-heading-one`)

See [CHANGELOG.md](CHANGELOG.md) for full remediation details.

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
├── public/                 Static assets and generated API data
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

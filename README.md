# ICJIA Public Client 2021

[![Netlify Status](https://api.netlify.com/api/v1/badges/e6614e77-00b4-4772-8034-a3b9c9c9986d/deploy-status)](https://app.netlify.com/sites/icjia-public/deploys) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Public website for the Illinois Criminal Justice Information Authority (ICJIA).

**Production:** https://icjia.illinois.gov

## Tech Stack

- **Framework:** Vue 2.6 / Vuetify 2.5
- **Build:** Vue CLI 4 / Webpack 4
- **CMS:** Strapi 3 (GraphQL, accessed via a ~160-line fetch-based client in `src/gql-client.js` as of v1.5.0 — Apollo stack removed)
- **Date handling:** Day.js (migrated from moment in v1.4.0)
- **Icons:** MDI webfont, self-hosted at `/fonts/mdi/` with `font-display: swap` (v1.4.2)
- **Typography:** Lato (body) + Oswald (headings), consolidated in v1.5.1 from six font families
- **Search:** Fuse.js (client-side full-text search, Web Worker). Page-first UX as of v1.5.5: every search entry point (header icon, footer icon, tags, names, categories) navigates to `/search/:query`; result clicks open in new tabs so the result list survives. Filter chips show available content types with hit counts.
- **Hosting:** Netlify
- **Analytics:** Plausible (self-hosted)
- **Node:** 22.x in production (Netlify); 16.x or newer for local development

**Planning for the successor site:** see `docs/NUXT-REWRITE-PLAN.md` and `docs/NUXT-ARCHITECTURE-RECOMMENDATIONS.md` for the Nuxt 4 rewrite plan and lessons-learned guidance.

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

**249 passing / 6 pending / 0 failing** — covers security mitigations, accessibility functions, markdown rendering, Vue components, the auth store, the lazy search-index loader, the CMS-content sanitizer pipeline (v1.5.2), and data integrity.

```bash
npm run tests
```

<table>
  <thead>
    <tr>
      <th align="left">Suite</th>
      <th align="left">Tests</th>
      <th align="left">What it guards</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><code>security.spec.js</code></td>
      <td>41</td>
      <td>XSS payloads (20+), GraphQL injection, security headers, CORS, source maps</td>
    </tr>
    <tr valign="top">
      <td><code>config.spec.js</code></td>
      <td>84</td>
      <td>HTTPS enforcement, 10 API data files, build config, env security</td>
    </tr>
    <tr valign="top">
      <td><code>a11y.spec.js</code></td>
      <td>38</td>
      <td>All 13 a11y DOM fix functions (headings, tabindex, ARIA, target size, data-table headers, aria-hidden focus, empty aria-label)</td>
    </tr>
    <tr valign="top">
      <td><code>markdown.spec.js</code></td>
      <td>27</td>
      <td>Heading anchors, link attributes, tables, code blocks, edge cases</td>
    </tr>
    <tr valign="top">
      <td><code>auth.spec.js</code></td>
      <td>15</td>
      <td>Vuex mutations/getters, logout localStorage cleanup</td>
    </tr>
    <tr valign="top">
      <td><code>search.spec.js</code></td>
      <td>10</td>
      <td>Lazy-loaded search index — <code>getFuse()</code> contract, caching, failure recovery, bundle-contract guard</td>
    </tr>
    <tr valign="top">
      <td><code>contentSanitizer.spec.js</code></td>
      <td>23</td>
      <td>CMS-intercept pipeline — table scope/headers/id, empty-container stripping, image-only link alt, duplicate-link-text disambiguation, Word-blue contrast (v1.5.2)</td>
    </tr>
    <tr valign="top">
      <td><code>components.spec.js</code></td>
      <td>9 + 6 pending</td>
      <td>SkipLink rendering; Banner/Disclaimer pure-JS (<code>render()</code>, XSS sanitization). Vuetify-mount tests are skipped — <code>vuetify-loader</code> doesn't run inside the mocha bundle; full rendering is covered by the Playwright suite</td>
    </tr>
  </tbody>
</table>

### Regression Tests (Playwright)

37 end-to-end tests covering navigation, page loads, search, cards, and page structure across all major sections.

```bash
# Requires dev server running on localhost:8080
npm run test
```

### Accessibility Audit (axe-core)

WCAG 2.2 Level AA compliance testing across every page in `public/sitemap.xml` using axe-core (the same engine the `axecap` MCP wraps).

```bash
# Full-site audit — every URL in sitemap.xml, 5 parallel workers, resumable
node scripts/a11y-sitemap-audit.mjs --concurrency=5

# Start a fresh audit (archives the prior run under reports/a11y-full-audit/archive/<date>/)
node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=5

# Include axe-core best-practice rules alongside WCAG A/AA
node scripts/a11y-sitemap-audit.mjs --fresh --tags=wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa,best-practice

# Re-run only the pages that errored last time
node scripts/a11y-sitemap-audit.mjs --retry

# Rebuild summary from existing per-page JSON without re-auditing
node scripts/a11y-sitemap-audit.mjs --summary

# Smoke test on a handful of URLs
node scripts/a11y-sitemap-audit.mjs --limit=10
```

Requires dev server on `localhost:8080` (`npm run dev`). Results land in:

- `reports/a11y-full-audit/_summary.md` — human-readable, rule × page matrix
- `reports/a11y-full-audit/_summary.csv` — same data, CSV
- `reports/a11y-full-audit/_manifest.ndjson` — one line per completed page (the resume key — re-running without `--fresh` skips anything already recorded here)
- `reports/a11y-full-audit/pages/<slug>.json` — full axe result per page
- `reports/a11y-full-audit/_failures.ndjson` — unreachable / timed-out URLs
- `reports/a11y-full-audit/archive/<date>/` — prior full runs, preserved by `--fresh`

Legacy sampled auditor (kept for quick content-type checks):

```bash
npm run audit              # list content types
npm run audit -- posts     # 5 random samples of one type
npm run audit -- all --sample 20
```

### Accessibility Audit (IBM Equal Access — parallel pipeline)

A second, independent rule engine running against the same sitemap, used to **triangulate** axe-core results when SiteImprove flags pages that axe-core scores clean. IBM's [Equal Access Toolkit](https://github.com/IBMa/equal-access) implements W3C ACT Rules + IBM's own WCAG 2.0/2.1/2.2 ruleset and is the engine behind IBM's enterprise accessibility tooling. Distinct from axe-core; not the same tool with a different name. Configured via `.achecker.yml` at the repo root (currently scoped to `WCAG_2_2`).

```bash
# Full-site IBM audit — every URL in sitemap.xml, 4 parallel workers, resumable
node scripts/a11y-sitemap-audit-ibm.mjs --fresh --concurrency=4

# Smoke test on a handful of URLs
node scripts/a11y-sitemap-audit-ibm.mjs --fresh --concurrency=2 --limit=10

# Re-run only the pages that errored last time
node scripts/a11y-sitemap-audit-ibm.mjs --retry

# Rebuild summary from existing per-page JSON without re-auditing
node scripts/a11y-sitemap-audit-ibm.mjs --summary
```

Requires dev server on `localhost:8080` (`npm run serve`). Results land in `reports/a11y-full-audit-ibm/` with the same shape as the axe-core auditor (`_summary.md`, `_summary.csv`, `_manifest.ndjson`, `pages/<slug>.json`, `_failures.ndjson`, `archive/<date>/`). Runtime is ~3-4× the axe-core auditor — IBM's rule engine is heavier and the per-page scan time is longer (5-7s vs ~3.5s).

**How IBM categorizes findings (vs axe-core):**

<table>
  <thead>
    <tr>
      <th align="left">IBM level</th>
      <th align="left">axe-core equivalent</th>
      <th align="left">What it means</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><code>violation</code></td>
      <td><code>violation</code></td>
      <td>Confirmed WCAG failure. Both tools agree this is a real fix.</td>
    </tr>
    <tr valign="top">
      <td><code>potentialviolation</code></td>
      <td><code>incomplete</code> (Needs Review)</td>
      <td>Tool can't auto-determine. Manual review needed. Often a "Verify..." or "Confirm..." check on patterns the static analyzer can't disambiguate (focus visibility under dynamic CSS, sensory language, kicker-vs-heading detection).</td>
    </tr>
    <tr valign="top">
      <td><code>recommendation</code> / <code>potentialrecommendation</code></td>
      <td><code>best-practice</code> tag</td>
      <td>Beyond-spec suggestions (UX-flavored a11y patterns). Not a WCAG conformance gate.</td>
    </tr>
    <tr valign="top">
      <td><code>manual</code></td>
      <td>(no equivalent)</td>
      <td>Test cannot be automated at all — requires human keyboard / AT testing.</td>
    </tr>
  </tbody>
</table>

When the auditor reports `CLEAN(pv65)`, that's "0 violations, 65 potentialviolations" — the page is clean by IBM's strict definition; the 65 are cantTell results where IBM is asking for human review. Most are repeating patterns (focus-visibility on every styled element, etc.) that require one decision per pattern, not one per element.

See "Multi-tool audit triangulation" below for how to use IBM + axe-core together.

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

<table>
  <thead>
    <tr>
      <th align="left">Category</th>
      <th align="left">Status</th>
      <th align="left">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><strong>Security headers</strong></td>
      <td><strong>Hardened</strong></td>
      <td>X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy enabled. <strong>CSP in report-only mode</strong> (v1.3.41) — allowlist validated against 9 representative routes via Chrome MCP audit; promotion to enforcement deferred until a CSP report endpoint is in place to give visibility into any silent breakage. <code>worker-src 'self'</code> + <code>upgrade-insecure-requests</code> directives are present (no-op in report-only)</td>
    </tr>
    <tr valign="top">
      <td><strong>CORS</strong></td>
      <td><strong>Restricted</strong></td>
      <td>Locked to <code>https://icjia.illinois.gov</code>; no wildcard</td>
    </tr>
    <tr valign="top">
      <td><strong>XSS prevention</strong></td>
      <td><strong>Hardened</strong></td>
      <td>DOMPurify sanitization at <code>renderToHtml()</code> chokepoint covers all <code>v-html</code> bindings; route params regex-sanitized; <code>v-html</code> directive globally overridden with content pipeline</td>
    </tr>
    <tr valign="top">
      <td><strong>CSS injection</strong></td>
      <td><strong>Mitigated (P2)</strong></td>
      <td>DOMPurify now allows <code>&lt;style&gt;</code> tags and <code>style</code> attributes for CMS layout support. DOMPurify strips <code>javascript:</code> URLs and event handlers but CSS <code>url()</code> exfiltration is possible if CMS account is compromised. Mitigated by CMS auth; would be fully blocked by CSP</td>
    </tr>
    <tr valign="top">
      <td><strong>GraphQL injection</strong></td>
      <td><strong>Mitigated</strong></td>
      <td>Route params sanitized to <code>[a-zA-Z0-9_-]</code> before query interpolation; fetch-based parameterized queries (variables, not string interpolation) used elsewhere — see <code>src/gql-client.js</code></td>
    </tr>
    <tr valign="top">
      <td><strong>External links</strong></td>
      <td><strong>Mostly hardened</strong></td>
      <td><code>rel=&quot;noopener noreferrer&quot;</code> on all markdown-rendered links; 3 template links to first-party domains missing <code>rel</code> (P3)</td>
    </tr>
    <tr valign="top">
      <td><strong>Auth tokens</strong></td>
      <td><strong>localStorage (P1)</strong></td>
      <td>JWT in localStorage; HttpOnly cookies require Strapi 3 backend migration</td>
    </tr>
    <tr valign="top">
      <td><strong>Data exposure</strong></td>
      <td><strong>Hardened (v1.3.33)</strong></td>
      <td>Build-time <code>purifySearchMeta</code> strips staff names from all 9 per-type JSONs and <code>searchIndex.json</code> before publish. Biographies themselves are unmodified.</td>
    </tr>
    <tr valign="top">
      <td><strong>Server disclosure</strong></td>
      <td><strong>Mitigated</strong></td>
      <td><code>X-Powered-By</code> header hidden via <code>netlify.toml</code> (v1.3.33). Strapi stack trace suppression still requires backend <code>NODE_ENV=production</code> (SEC-15)</td>
    </tr>
    <tr valign="top">
      <td><strong>Source maps</strong></td>
      <td><strong>Hardened</strong></td>
      <td><code>productionSourceMap: false</code>; no <code>.map</code> files served</td>
    </tr>
    <tr valign="top">
      <td><strong>HTTPS</strong></td>
      <td><strong>Full</strong></td>
      <td>All endpoints and CDN resources use TLS</td>
    </tr>
    <tr valign="top">
      <td><strong>Console stripping</strong></td>
      <td><strong>Active</strong></td>
      <td>Production builds remove <code>console.log</code> via Babel plugin</td>
    </tr>
    <tr valign="top">
      <td><strong>Dependencies</strong></td>
      <td><strong>Accepted risk</strong></td>
      <td><code>npm audit</code> reports 20 production vulnerabilities (5 critical, 12 high), all requiring breaking changes. DOMPurify mitigates the Vuetify XSS advisories in practice. Deferred to the planned Nuxt 4 / Strapi 5 rewrite</td>
    </tr>
    <tr valign="top">
      <td><strong>Env / secrets</strong></td>
      <td><strong>Hardened</strong></td>
      <td><code>.env</code> in <code>.gitignore</code>, no credentials committed, no source maps</td>
    </tr>
  </tbody>
</table>

### New findings (April 2026)

<table>
  <thead>
    <tr>
      <th align="left"><h1></h1></th>
      <th align="left">Finding</th>
      <th align="left">Severity</th>
      <th align="left">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>SEC-09</td>
      <td>No Content-Security-Policy header</td>
      <td><strong>P1</strong></td>
      <td><strong>Mitigated (v1.3.33 report-only)</strong> — allowlist in place since v1.3.33, validated against live page loads via Chrome MCP audit (9 routes, zero unlisted origins). Briefly enforced in v1.3.40, reverted to report-only in v1.3.41 pending a CSP report endpoint for post-deploy visibility. <code>worker-src 'self'</code> + <code>upgrade-insecure-requests</code> added</td>
    </tr>
    <tr valign="top">
      <td>SEC-10</td>
      <td>npm dependency vulnerabilities (20 total, 5 critical)</td>
      <td><strong>P1</strong></td>
      <td>Accepted — breaking changes only; deferred to Nuxt 4 rewrite; DOMPurify mitigates Vuetify XSS</td>
    </tr>
    <tr valign="top">
      <td>SEC-11</td>
      <td>DOMPurify <code>&lt;style&gt;</code> tag + <code>style</code> attr allowlisting enables CSS exfiltration</td>
      <td><strong>P2</strong></td>
      <td>Accepted — required for CMS layout; mitigated by CMS auth; mitigated by CSP (SEC-09)</td>
    </tr>
    <tr valign="top">
      <td>SEC-12</td>
      <td>Staff names leaked in <code>searchMeta</code> across API JSON files</td>
      <td><strong>P2</strong></td>
      <td><strong>Fixed (v1.3.33)</strong> — build-time <code>purifySearchMeta</code> strips names</td>
    </tr>
    <tr valign="top">
      <td>SEC-13</td>
      <td><code>searchIndex.json</code> exposes staff names alongside search data</td>
      <td><strong>P2</strong></td>
      <td><strong>Fixed (v1.3.33)</strong> — same purification pass as SEC-12</td>
    </tr>
    <tr valign="top">
      <td>SEC-14</td>
      <td><code>X-Powered-By</code> header discloses server framework</td>
      <td><strong>P2</strong></td>
      <td><strong>Fixed (v1.3.33)</strong> — empty header override in <code>netlify.toml</code></td>
    </tr>
    <tr valign="top">
      <td>SEC-15</td>
      <td>Strapi production API leaks stack traces in error responses</td>
      <td><strong>P2</strong></td>
      <td>Open — requires Strapi backend <code>NODE_ENV=production</code></td>
    </tr>
    <tr valign="top">
      <td>SEC-16</td>
      <td>No <code>/.well-known/security.txt</code> (RFC 9116)</td>
      <td><strong>P3</strong></td>
      <td>Open — recommended for government sites</td>
    </tr>
    <tr valign="top">
      <td>SEC-17</td>
      <td>Dead code <code>ResearchHub.js:getSingleArticleQuery()</code> with unsanitized interpolation</td>
      <td><strong>P3</strong></td>
      <td>Open — remove or sanitize</td>
    </tr>
  </tbody>
</table>

### Previously known items (unchanged)

<table>
  <thead>
    <tr>
      <th align="left"><h1></h1></th>
      <th align="left">Finding</th>
      <th align="left">Severity</th>
      <th align="left">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>SEC-06</td>
      <td>JWT in localStorage (HttpOnly cookies require Strapi migration)</td>
      <td><strong>P1</strong></td>
      <td>Backend-dependent</td>
    </tr>
    <tr valign="top">
      <td>SEC-07</td>
      <td>No CSRF tokens</td>
      <td><strong>P2</strong></td>
      <td>Backend-dependent</td>
    </tr>
    <tr valign="top">
      <td>SEC-08</td>
      <td>No login rate limiting</td>
      <td><strong>P2</strong></td>
      <td>Backend-dependent</td>
    </tr>
  </tbody>
</table>

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

**axe-core** (primary, open-source) runs in-browser after full page render, including all runtime accessibility fixes. It follows WCAG success criteria closely and only flags clear violations. This site passes axe-core with **zero violations across all 2,377 pages in `sitemap.xml`** (most recent full-site audit, May 6 2026; the prior April 14 2026 audit on 2,367 URLs was equally clean — see "Full-site audit history" below for the full audit record).

**SiteImprove** (secondary, enterprise) crawls pages remotely on a schedule. It uses a proprietary rule set (`sia-r` prefix) that applies some WCAG rules more broadly than the spec requires and includes ambiguous "cantTell" results in its violation count. SiteImprove flags issues in three categories:

<table>
  <thead>
    <tr>
      <th align="left">Category</th>
      <th align="left">Example</th>
      <th align="left">Action</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><strong>Legitimate gaps</strong> not covered by axe-core</td>
      <td>sia-r83 (text clipping at 200% zoom), sia-r77 (table cell context)</td>
      <td>Remediated</td>
    </tr>
    <tr valign="top">
      <td><strong>Stricter-than-spec interpretations</strong></td>
      <td>sia-r14 (flags <code>&lt;nav aria-label&gt;</code> — WCAG 2.5.3 only applies to widgets)</td>
      <td>Fixed to satisfy SiteImprove, though already WCAG-compliant</td>
    </tr>
    <tr valign="top">
      <td><strong>Cached/stale results</strong></td>
      <td>Issues fixed in code but not yet recrawled</td>
      <td>Clear on next SiteImprove scan</td>
    </tr>
  </tbody>
</table>

**Key differences:**

<table>
  <thead>
    <tr>
      <th align="left"></th>
      <th align="left">axe-core</th>
      <th align="left">SiteImprove</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Rule source</td>
      <td>Open-source (Deque Systems)</td>
      <td>Proprietary (<code>sia-r</code> rules)</td>
    </tr>
    <tr valign="top">
      <td>Scanning</td>
      <td>In-browser, sees runtime JS fixes</td>
      <td>Remote crawler, may miss client-side fixes</td>
    </tr>
    <tr valign="top">
      <td>False positives</td>
      <td>Low</td>
      <td>Higher — broader rule interpretation</td>
    </tr>
    <tr valign="top">
      <td>Ambiguous cases</td>
      <td>&quot;Incomplete — needs review&quot; (excluded from count)</td>
      <td>&quot;Failed/cantTell&quot; (included in count)</td>
    </tr>
    <tr valign="top">
      <td>Cost</td>
      <td>Free</td>
      <td>Paid enterprise license</td>
    </tr>
  </tbody>
</table>

**Build process integration:** axe-core is integrated into the development workflow (`npm run audit`) and can be run on-demand against a local dev server before every deploy. **SiteImprove cannot be integrated into the build process** — it is a cloud service that crawls the live production site on its own schedule with no CLI, API, or local runner. Every SiteImprove flag must be manually reviewed after deployment, and results may lag days or weeks behind the current state of the code.

**Recommendation:** Use axe-core as the development-time gate and SiteImprove as a monitoring layer. When SiteImprove flags an issue axe-core does not, investigate whether it is a legitimate gap, a stricter interpretation, or a stale result. Known stricter-than-spec false-positive patterns are logged in [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md) with W3C/ACT Rules citations, verification evidence, and the exact comment to paste when marking occurrences as Accepted in the SiteImprove inspector. See [CHANGELOG.md](CHANGELOG.md) for detailed analysis.

> **Neither tool replaces manual testing.** Automated scanners catch ~30-40% of WCAG issues. Screen reader testing, keyboard navigation, and cognitive accessibility review require human judgment.

### Documented SiteImprove false positives

The table below catalogs SiteImprove flags that have been confirmed as false positives — issues SiteImprove reports as failures (or `failed cantTell`) that **are not actual WCAG violations** and should not be remediated in code. Each entry has been cross-checked against axe-core (the open-source engine used by Google, Microsoft, and most accessibility consultancies) and the W3C ACT Rules. The canonical, frequently-updated source is [docs/SITEIMPROVE-FALSE-POSITIVES.md](docs/SITEIMPROVE-FALSE-POSITIVES.md); this table is a summary for stakeholders.

<table>
  <thead>
    <tr>
      <th align="left">Rule</th>
      <th align="left">Issue name</th>
      <th align="left">Where it appears</th>
      <th align="left">Why SiteImprove flags it</th>
      <th align="left">Why axe-core does not flag it</th>
      <th align="left">Why it is a false positive</th>
      <th align="left">Recommended action</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><strong>sia-r14</strong></td>
      <td>Visible label and accessible name do not match</td>
      <td>Every page on the site (the global app shell renders three landmark <code>&lt;nav&gt;</code> elements: Breadcrumb, Section, Additional). Each <code>&lt;nav aria-labelledby=&quot;…&quot;&gt;</code> points to an <code>&lt;h2 class=&quot;sr-only&quot;&gt;</code> like &quot;Breadcrumb navigation&quot; / &quot;Section navigation&quot; / &quot;Additional navigation&quot;.</td>
      <td>SiteImprove applies &quot;Label in Name&quot; (WCAG 2.5.3) more broadly than the W3C spec — it compares the nav's accessible name (the sr-only <code>aria-labelledby</code> text) to the visible labels of interactive children inside the nav. They do not match by design (e.g. <code>&lt;nav&gt;</code> accessible name = &quot;Breadcrumb navigation&quot;, visible link text = &quot;ICJIA » About » Employment&quot;), so SiteImprove returns <code>failed cantTell</code> (&quot;can't auto-verify, needs manual review&quot;). Every page has 3 navs × 1 mismatch each → flag count grows linearly with crawl scope.</td>
      <td>axe-core implements WCAG 2.5.3 to its published scope: the rule applies to <strong>interactive widgets</strong> (buttons, links, form controls, custom widgets with <code>role=&quot;button&quot;</code>, etc.), not to <strong>landmarks</strong>. Landmarks (<code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;aside&gt;</code>, etc.) labelled via <code>aria-labelledby</code> are explicitly out of scope, so axe-core does not apply the rule to them at all. Result: zero violations on every flagged page.</td>
      <td><a href="https://www.w3.org/WAI/standards-guidelines/act/rules/2ee8b8/">W3C ACT Rule 2ee8b8 &quot;Visible label is part of accessible name&quot;</a> — the canonical implementation of WCAG 2.5.3 — explicitly scopes the rule to &quot;any element [that] has a [semantic role][] inheriting from <code>widget</code>.&quot; Landmarks do not inherit from <code>widget</code>, so the rule does not apply. Furthermore, <strong>distinguishing multiple <code>&lt;nav&gt;</code> landmarks via sr-only <code>aria-labelledby</code> is required best practice</strong>: when a page has more than one nav, screen readers list them in their landmark menu by accessible name, and unlabeled or duplicate-labeled navs are unusable. Removing the labels to satisfy SiteImprove would actively harm screen-reader users.</td>
      <td>Bulk-mark every <code>sia-r14</code> occurrence as Accepted in the SiteImprove inspector with the comment in <a href="docs/SITEIMPROVE-FALSE-POSITIVES.md">docs/SITEIMPROVE-FALSE-POSITIVES.md</a> row #1. Because the pattern lives in the shared app shell, future crawls will continue to surface new URLs with this flag — Accept them as a class, not per-URL.</td>
    </tr>
  </tbody>
</table>

**Why the two tools disagree, in one sentence:** axe-core implements published WCAG/ACT rules at their stated scope; SiteImprove's proprietary `sia-r` rules apply some of those same WCAG criteria more broadly than the spec defines, then return `failed cantTell` on the broader set — counting ambiguous cases as failures that other auditors classify as out-of-scope.

**Categories of SiteImprove findings (full triage workflow):**

<table>
  <thead>
    <tr>
      <th align="left">Category</th>
      <th align="left">What it is</th>
      <th align="left">What to do</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Real WCAG violations also flagged by axe-core</td>
      <td>Confirmed accessibility bug</td>
      <td>Fix in code (CMS-content fixes go through <code>src/utils/contentSanitizer.js</code>; component fixes go in the relevant <code>.vue</code> file)</td>
    </tr>
    <tr valign="top">
      <td>Legitimate gaps not covered by axe-core</td>
      <td>E.g. <code>sia-r83</code> (text clipping at 200% zoom), <code>sia-r77</code> (table cell context). axe-core's rule set genuinely does not check these.</td>
      <td>Fix in code; add a targeted axe-core verification script under <code>scripts/audit-siteimprove-&lt;rule&gt;.js</code></td>
    </tr>
    <tr valign="top">
      <td><strong>Stricter-than-spec interpretations (this table)</strong></td>
      <td>SiteImprove applies a WCAG rule beyond the scope the spec/ACT defines. axe-core is silent because the rule does not apply.</td>
      <td><strong>Do not fix.</strong> Document in <code>docs/SITEIMPROVE-FALSE-POSITIVES.md</code>, mark as Accepted in SiteImprove with citation.</td>
    </tr>
    <tr valign="top">
      <td>Cached/stale results</td>
      <td>Issue was fixed in code but SiteImprove's last crawl was earlier.</td>
      <td>Wait for next recrawl; verify with axe-core that the fix is still in place.</td>
    </tr>
  </tbody>
</table>

The decision tree: **(1)** does axe-core also flag this URL? If yes, fix the code. **(2)** Is the rule a known stricter-than-spec pattern from this table? If yes, mark Accepted with the citation. **(3)** Otherwise, treat as a new pattern: write a targeted audit script, verify with axe-core, and if axe-core is clean, add a new row to `docs/SITEIMPROVE-FALSE-POSITIVES.md`.

### Multi-tool audit triangulation

Two independent automated rule engines now run against every page in `public/sitemap.xml`:

<table>
  <thead>
    <tr>
      <th align="left">Tool</th>
      <th align="left">Rule engine</th>
      <th align="left">Standard surface</th>
      <th align="left">Script</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><strong>axe-core 4.11.2</strong></td>
      <td>Deque (open source)</td>
      <td>WCAG 2.x SC + W3C ACT Rules. The reference implementation that Lighthouse, pa11y, jest-axe, and most consultancies wrap.</td>
      <td><code>scripts/a11y-sitemap-audit.mjs</code></td>
    </tr>
    <tr valign="top">
      <td><strong>IBM Equal Access</strong></td>
      <td>IBM (open source, distinct from axe-core)</td>
      <td>WCAG 2.0/2.1/2.2 + W3C ACT Rules + IBM's own ruleset. Configured to <code>WCAG_2_2</code> policy via <code>.achecker.yml</code>.</td>
      <td><code>scripts/a11y-sitemap-audit-ibm.mjs</code></td>
    </tr>
  </tbody>
</table>

**Why two tools, not just one:** axe-core and IBM Equal Access implement WCAG and the W3C ACT Rules independently. They agree on most violations (the rule sets overlap heavily for WCAG 2.0 / 2.1 A + AA), but they diverge in edge cases — different default tag groupings, different cantTell vs violation thresholds, different non-spec extras. When **both tools score a page clean** and SiteImprove still flags it, that's a strong signal SiteImprove's rule is stricter-than-spec. When **the two tools disagree**, the disagreement itself is the finding — it points at exactly the rule that needs human review.

**Triangulation decision tree (when SiteImprove flags a URL):**

1. Run axe-core: `node scripts/a11y-sitemap-audit.mjs --limit=1` (or check the most recent full-site archive).
2. Run IBM: `node scripts/a11y-sitemap-audit-ibm.mjs --limit=1` against the same URL.
3. **Both clean** → SiteImprove's rule is stricter-than-spec. Document in `docs/SITEIMPROVE-FALSE-POSITIVES.md` with both tools cited and mark Accepted in SiteImprove.
4. **One clean, one dirty** → real edge case worth reading. Look at which rule fired and why; the disagreeing tool usually documents its rationale in its rule reference. Decide based on the WCAG SC text.
5. **Both dirty** → real WCAG violation. Fix in code.

A practical example of (4) — **WCAG 2.5.8 "Target Size (Minimum)" on `v-btn x-small` toggles, fixed in v1.5.42 (2026-05-06).** The IBM smoke test on 10 biography pages caught two violations of `target_spacing_sufficient` on Vuetify `v-btn x-small` toggles in `src/components/StaticSearch.vue` (Title / Date / Ascending / Descending — rendering at ~57×20 to 99×20 CSS px). Forensic probe (`scripts/probe-target-size.mjs`) confirmed axe-core 4.11.2's `target-size` rule **is** in the `wcag22aa` tag set (tags: `[cat.sensory-and-visual-cues, wcag22aa, wcag258]`) — so our standard sitemap audit was running it. axe-core simply concluded the toggles passed via WCAG 2.5.8's spacing-fallback ("a 24-CSS-pixel-diameter circle around each undersized target doesn't intersect another target"); IBM evaluated the same fallback geometry and concluded they failed. Both interpretations are defensible under the spec text. The unambiguous fix: change `x-small` (~20px tall) to `small` (28px tall) so both engines agree under the *size* branch of WCAG 2.5.8 instead of the *spacing* branch. After the fix, IBM smoke 10/10 clean (was 8/10), axe-core unchanged at 10/10 clean. See `CHANGELOG.md` v1.5.42 for the full investigation and `scripts/probe-button-sizes.mjs` for the rendered-size measurement template.

### Current Status (May 2026)

<table>
  <thead>
    <tr>
      <th align="left">Metric</th>
      <th align="left">Score</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td><strong>Full-site axe-core audit — every URL in <code>sitemap.xml</code> (v1.5.42, May 6 2026 afternoon)</strong></td>
      <td><strong>2,377 / 2,377 zero violations (100%)</strong></td>
    </tr>
    <tr valign="top">
      <td>Pre-target-size baseline (v1.5.40, May 6 2026 morning)</td>
      <td>2,377 / 2,377 zero violations (100%)</td>
    </tr>
    <tr valign="top">
      <td>Prior full audit (v1.5.9, April 14 2026)</td>
      <td>2,367 / 2,367 zero violations (100%)</td>
    </tr>
    <tr valign="top">
      <td>WCAG tags audited</td>
      <td><code>wcag2a</code> + <code>wcag2aa</code> + <code>wcag21a</code> + <code>wcag21aa</code> + <code>wcag22aa</code></td>
    </tr>
    <tr valign="top">
      <td>axe-core version</td>
      <td>4.11.2</td>
    </tr>
    <tr valign="top">
      <td>Runtime (most recent)</td>
      <td>35m 16s (4 parallel workers, 2,377 URLs)</td>
    </tr>
    <tr valign="top">
      <td>Errors / unreachable</td>
      <td>0</td>
    </tr>
    <tr valign="top">
      <td>Prior Lighthouse a11y audit (93 pages, desktop + mobile)</td>
      <td><strong>93/93 score 100/100</strong></td>
    </tr>
    <tr valign="top">
      <td>Regression tests (Playwright)</td>
      <td><strong>37/37 passing</strong></td>
    </tr>
    <tr valign="top">
      <td>Unit tests — a11y functions (Mocha/Chai)</td>
      <td><strong>38/38 passing</strong></td>
    </tr>
    <tr valign="top">
      <td>Unit tests — security (Mocha/Chai)</td>
      <td><strong>41/41 passing</strong></td>
    </tr>
    <tr valign="top">
      <td>Automated score (WCAG 2.2 AA)</td>
      <td><strong>A / 100%</strong></td>
    </tr>
  </tbody>
</table>

### Full-site audit history

The site is audited end-to-end (every URL in `public/sitemap.xml`) with axe-core 4.11.2 at WCAG 2.2 Level AA conformance every few weeks. Each run is preserved as a forensic record under `reports/a11y-full-audit/archive/<date>/`. The cadence is intentional: managers and external reviewers reasonably treat any accessibility audit older than a couple of weeks as a stale claim about the *current* state of the deployed site, so re-running on a regular schedule keeps the record defensible.

<table>
  <thead>
    <tr>
      <th align="left">Audit date</th>
      <th align="left">Version</th>
      <th align="left">Sitemap URLs</th>
      <th align="left">Pages audited</th>
      <th align="left">Violations</th>
      <th align="left">Errors</th>
      <th align="left">Runtime</th>
      <th align="left">Archive</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>2026-05-06 (afternoon)</td>
      <td>1.5.42</td>
      <td>2,377</td>
      <td>2,377</td>
      <td><strong>0</strong></td>
      <td>0</td>
      <td>35m 24s</td>
      <td><code>reports/a11y-full-audit/</code> (in-place; archived on next <code>--fresh</code>)</td>
    </tr>
    <tr valign="top">
      <td>2026-05-06 (morning)</td>
      <td>1.5.40</td>
      <td>2,377</td>
      <td>2,377</td>
      <td><strong>0</strong></td>
      <td>0</td>
      <td>35m 16s</td>
      <td>archived in v1.5.42 baseline run</td>
    </tr>
    <tr valign="top">
      <td>2026-04-14</td>
      <td>1.5.9</td>
      <td>2,367</td>
      <td>2,367</td>
      <td><strong>0</strong></td>
      <td>0</td>
      <td>28m 15s</td>
      <td><code>reports/a11y-full-audit/archive/2026-04-14/</code></td>
    </tr>
  </tbody>
</table>

#### 2026-05-06 (afternoon) audit (v1.5.42 — post-target-size remediation)

Same-day re-baseline after the v1.5.42 fix to `src/components/StaticSearch.vue` toggles. IBM Equal Access (the new parallel auditor introduced in v1.5.41) caught a `target_spacing_sufficient` violation on the four `<v-btn x-small>` toggles (Title / Date / Ascending / Descending) on biography pages — WCAG 2.5.8 (Target Size Minimum). axe-core's standard `wcag22aa` tag-set run was passing the same toggles via WCAG 2.5.8's spacing-fallback. The fix changed `x-small` (~20px tall) to `small` (28px tall) so **both** engines agree under the *size* branch of WCAG 2.5.8.

- 2,377 / 2,377 pages clean
- 0 violations across all WCAG 2.0 / 2.1 / 2.2 A + AA tags
- 0 errors / unreachable URLs
- 35m 24s runtime, 4 parallel workers
- axe-core 4.11.2, run via `node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=4`

**One real WCAG 2.2 AA fix landed** (StaticSearch toggles), with no new regressions site-wide. This run is the multi-tool gate's first end-to-end success — IBM caught what axe-core's algorithm missed, the fix shipped, and both engines now agree the site is clean. Full per-page JSON lives in-place under `reports/a11y-full-audit/`; the v1.5.40 morning archive moved under `archive/<date>/` automatically on this run's `--fresh` invocation.

#### 2026-05-06 (morning) audit (v1.5.40 — pre-target-size baseline)

Re-run of the full sitemap audit, three weeks after the April 14 baseline. The sitemap grew by **+10 URLs** over the intervening sprints (new biographies, news posts, and employment listings published through the Strapi CMS). All new pages cleared on first pass — the pre-render content pipeline and runtime accessibility fixes from the April 14 cycle handled the new content automatically with no template-level intervention.

- 2,377 / 2,377 pages clean
- 0 violations across all WCAG 2.0 / 2.1 / 2.2 A + AA tags
- 0 errors / unreachable URLs
- 35m 16s runtime, 4 parallel workers
- axe-core 4.11.2, run via `node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=4`

**No new fixes were required at this stage.** This run confirms the April 14 remediation is durable across content additions and that no regression has been introduced over the intervening sprints (v1.5.10–v1.5.39 — JobCard cleanup, mobile a11y improvements on the Translate-this-site button, per-row accessible names on Publications expand buttons, table cell vertical-alignment, and assorted SiteImprove false-positive triage). The afternoon v1.5.42 run above supersedes this archive as the current claim — but this morning run is preserved as the **pre-IBM-triangulation** baseline, since the target-size finding was discovered between this run and the afternoon re-baseline.

#### 2026-04-14 audit (initial full-site baseline)

Every single URL in `public/sitemap.xml` (2,367 URLs) was audited in one pass with axe-core 4.11.2 at WCAG 2.2 Level AA conformance. Zero violations, zero errors. Full per-page JSON is preserved under `reports/a11y-full-audit/archive/2026-04-14/` for audit-trail purposes.

**Seven pages originally failed on first pass; all were remediated before the final archived run:**

<table>
  <thead>
    <tr>
      <th align="left">Page</th>
      <th align="left">Rule</th>
      <th align="left">Fix</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>researchhub/articles/illinois-firearm-prohibitors-…</td>
      <td><code>list</code></td>
      <td><code>fixCmsInvalidListChildren</code> — wrap non-<code>&lt;li&gt;</code> children of <code>&lt;ul&gt;</code>/<code>&lt;ol&gt;</code></td>
    </tr>
    <tr valign="top">
      <td>researchhub/articles/firearm-restraining-orders…</td>
      <td><code>td-headers-attr</code></td>
      <td><code>fixCmsTables</code> now strips stale <code>headers</code> from TH elements</td>
    </tr>
    <tr valign="top">
      <td>researchhub/articles/law-enforcement-response-to-mental-health-crisis…</td>
      <td><code>color-contrast</code></td>
      <td><code>fixCmsOrphanWhite</code> — propagate dark TD background onto the inner span so axe resolves contrast correctly</td>
    </tr>
    <tr valign="top">
      <td>grants/funding/2019-ifvcc</td>
      <td><code>scrollable-region-focusable</code></td>
      <td><code>fixCmsFocusablePre</code> — add <code>tabindex=&quot;0&quot;</code> to <code>&lt;pre&gt;</code> blocks</td>
    </tr>
    <tr valign="top">
      <td>grants/funding/nchip-LE-for-live-scan-equipment…</td>
      <td><code>color-contrast</code></td>
      <td><code>fixCmsContrast</code> rewrites <code>color: red</code> (<code>#ff0000</code>, 3.99:1) to <code>#c00</code> (5.89:1)</td>
    </tr>
    <tr valign="top">
      <td>innovation-and-digital-services/infonet</td>
      <td><code>link-in-text-block</code></td>
      <td>Added <code>text-decoration: underline</code> in <code>Infonet.vue</code></td>
    </tr>
    <tr valign="top">
      <td>grants/funding (listings)</td>
      <td><code>color-contrast</code></td>
      <td><code>text-color=&quot;white&quot;</code> on deadline v-chips + <code>app.css</code> override scoped to <code>:not(.white--text)</code></td>
    </tr>
  </tbody>
</table>

All CMS-content fixes go through the pre-render pipeline (`src/utils/contentSanitizer.js`) so the HTML that ships is already correct — no flash of inaccessible content, no post-render DOM mutations, SSR-safe if the site later migrates to Nuxt.

### Re-running the full audit

Six months from now, on any branch, against any state of the sitemap:

```bash
npm run dev     # in one terminal — serves on :8080
node scripts/a11y-sitemap-audit.mjs --fresh --concurrency=5
```

`--fresh` archives the prior run to `reports/a11y-full-audit/archive/<YYYY-MM-DD>/` before starting, so no history is lost. If the run is interrupted, omit `--fresh` to resume from the manifest.

### Why "full audit, not sampled"

An earlier version of this page documented a sampled strategy (157 pages of 2,356). That strategy was correct for its time — pages within a content type share templates, and runtime fixes propagate globally. But manager-facing compliance records require exhaustive coverage: "every page was audited" is a stronger claim than "a representative sample passed." The full-site runner above produces that record in ~28 minutes, so there is no reason not to run it.

Page counts by content type at the most recent audit (May 6 2026; derived from `sitemap.xml`):

<table>
  <thead>
    <tr>
      <th align="left">Content Type</th>
      <th align="left">Total Pages</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>publications</td>
      <td>1,107</td>
    </tr>
    <tr valign="top">
      <td>meetings</td>
      <td>282</td>
    </tr>
    <tr valign="top">
      <td>hub (articles)</td>
      <td>249</td>
    </tr>
    <tr valign="top">
      <td>jobs</td>
      <td>220</td>
    </tr>
    <tr valign="top">
      <td>posts (news)</td>
      <td>186</td>
    </tr>
    <tr valign="top">
      <td>grants</td>
      <td>171</td>
    </tr>
    <tr valign="top">
      <td>biographies</td>
      <td>109</td>
    </tr>
    <tr valign="top">
      <td>static / system / units / events</td>
      <td>53</td>
    </tr>
    <tr valign="top">
      <td><strong>Total</strong></td>
      <td><strong>2,377</strong></td>
    </tr>
  </tbody>
</table>

The April 14 2026 baseline broke "static / system / units / events" out as four sub-rows (29 + 10 + 6 + 11 = 56). The May 6 grouping consolidates them because the URL conventions don't draw a clean boundary between them; the small (-3) delta is normal sitemap drift across CMS edits.

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

**axe-core** runs inside the browser after JavaScript executes. It sees the same DOM the user sees — including SPA route changes, async content, and runtime accessibility fixes. This site scores **zero violations on axe-core across all 2,377 pages in `sitemap.xml`** (full-site audit, May 6 2026; previously 2,367/2,367 on April 14 2026).

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

<table>
  <thead>
    <tr>
      <th align="left">Category</th>
      <th align="left">Examples</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Misspellings</td>
      <td>Typos in Strapi content fields (<code>fixMisspellings</code>)</td>
    </tr>
    <tr valign="top">
      <td>Missing punctuation</td>
      <td>Apostrophes stripped by slug generation (<code>fixApostrophes</code>)</td>
    </tr>
    <tr valign="top">
      <td>Missing image alt text</td>
      <td>Auto-derive alt from filenames (<code>fixCmsImages</code>)</td>
    </tr>
    <tr valign="top">
      <td>CMS color contrast</td>
      <td>Fix dark-bg/black-text conflicts (<code>fixCmsContrast</code>)</td>
    </tr>
    <tr valign="top">
      <td>HTML attribute injection</td>
      <td>Add <code>scope</code>, <code>aria-label</code>, <code>lang</code> to CMS HTML elements</td>
    </tr>
    <tr valign="top">
      <td>Tag wrapping/restructuring</td>
      <td>Wrap <code>&lt;table&gt;</code> in scrollable <code>&lt;div role=&quot;region&quot;&gt;</code></td>
    </tr>
    <tr valign="top">
      <td>Lang attributes for foreign text</td>
      <td>Wrap British spellings in <code>&lt;span lang=&quot;en-GB&quot;&gt;</code></td>
    </tr>
    <tr valign="top">
      <td>Link text augmentation</td>
      <td>Append sr-only text to vague &quot;click here&quot; links</td>
    </tr>
    <tr valign="top">
      <td>Empty element removal</td>
      <td>Strip empty <code>&lt;p&gt;</code>, <code>&lt;span&gt;</code>, <code>&lt;div&gt;</code> from markdown output</td>
    </tr>
  </tbody>
</table>

#### What the intercept CANNOT fix

Anything involving **Vuetify's runtime DOM**, **CSS**, **layout**, or **behavior** — these are handled by `src/a11y/index.js` instead:

<table>
  <thead>
    <tr>
      <th align="left">Category</th>
      <th align="left">Why</th>
      <th align="left">Fix location</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Vuetify component ARIA</td>
      <td>Vuetify generates DOM at runtime</td>
      <td><code>a11y/index.js</code></td>
    </tr>
    <tr valign="top">
      <td>Vuetify/CSS color contrast</td>
      <td>CSS computed styles on framework elements</td>
      <td><code>app.css</code> or <code>a11y/index.js</code></td>
    </tr>
    <tr valign="top">
      <td>Focus indicators</td>
      <td>CSS <code>:focus-visible</code></td>
      <td><code>app.css</code></td>
    </tr>
    <tr valign="top">
      <td>Text clipping at zoom</td>
      <td>CSS overflow/layout</td>
      <td>Component CSS</td>
    </tr>
    <tr valign="top">
      <td>Keyboard navigation</td>
      <td>Event handlers, tabindex</td>
      <td><code>a11y/index.js</code></td>
    </tr>
    <tr valign="top">
      <td>Landmark structure</td>
      <td>Vue template structure</td>
      <td>Component templates</td>
    </tr>
    <tr valign="top">
      <td>Nested interactive elements</td>
      <td>Vuetify nests interactive controls</td>
      <td><code>a11y/index.js</code></td>
    </tr>
    <tr valign="top">
      <td>Dynamic overlays/tooltips</td>
      <td>Created after render</td>
      <td><code>a11y/index.js</code> (MutationObserver)</td>
    </tr>
  </tbody>
</table>

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

<table>
  <thead>
    <tr>
      <th align="left">Entry Point</th>
      <th align="left">Mechanism</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Markdown bodies</td>
      <td><code>sanitizeContent()</code> in <code>Markdown.js</code> and <code>markdownIt.js</code></td>
    </tr>
    <tr valign="top">
      <td>ResearchHub API (axios)</td>
      <td><code>sanitizeResponse()</code> interceptor</td>
    </tr>
    <tr valign="top">
      <td>Publications API (axios)</td>
      <td><code>deepSanitize()</code> on response data</td>
    </tr>
    <tr valign="top">
      <td>GraphQL responses</td>
      <td><code>deepSanitize</code> afterware in <code>src/gql-client.js</code> (recursively sanitizes every string in every response)</td>
    </tr>
    <tr valign="top">
      <td><code>v-html</code> directive</td>
      <td>Global override in <code>main.js</code> auto-sanitizes</td>
    </tr>
    <tr valign="top">
      <td>Template interpolation</td>
      <td><code>\| sanitize</code> filter and global <code>this.sanitize()</code> mixin</td>
    </tr>
    <tr valign="top">
      <td>Page <code>&lt;title&gt;</code> tags</td>
      <td><code>titleTemplate</code> in <code>App.vue</code> uses <code>sanitizeText()</code></td>
    </tr>
    <tr valign="top">
      <td>Search index</td>
      <td><code>deepSanitize()</code> in <code>AppInit.js</code></td>
    </tr>
  </tbody>
</table>

### Known Remaining Issues

These originate from CMS-authored content or external proxy sites and are mitigated by post-render JavaScript where possible. They will be fully resolved in the planned Nuxt 4 / Strapi 5 rewrite:

- Heading level skips in some article bodies (CMS authors skip heading levels)
- Occasional async data race condition on listing pages (`page-has-heading-one`)
- Contrast issues on `/adultredeploy` (separate Netlify site proxied via `_redirects`)

See [CHANGELOG.md](CHANGELOG.md) for full audit details and remediation history.

## Performance

A Tier 1 perf pass (April 2026, v1.3.36–v1.3.43) targeted the highest-impact, lowest-risk wins identified in the pre-rewrite audit. No architectural changes — every fix below is a same-shape edit that the planned Nuxt 4 rewrite can either inherit or supersede.

<table>
  <thead>
    <tr>
      <th align="left">Fix</th>
      <th align="left">Win</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Lazy-load the 2.7 MB <code>searchIndex.json</code> instead of static-importing it into the entry chunk (v1.3.36)</td>
      <td><strong><code>dist/js/app.*.js</code>: 2.9 MB → 262 KB (-91%)</strong></td>
    </tr>
    <tr valign="top">
      <td>Move the entire search pipeline (fetch + parse + sanitize + Fuse build + per-keystroke search) into a Web Worker (v1.3.37)</td>
      <td>Main thread stays free during search; per-query round-trip ~41 ms verified in Chrome; no input freeze</td>
    </tr>
    <tr valign="top">
      <td>Defer the search-index fetch until the user opens the search modal (was firing at app boot from <code>ModalSearch</code>'s <code>created()</code> hook)</td>
      <td>First paint no longer waits on a 2.7 MB JSON parse + sanitize + Fuse build</td>
    </tr>
    <tr valign="top">
      <td>Disable unused Fuse options (<code>includeMatches</code>, <code>includeScore</code>) — neither was read anywhere in the UI; <code>includeMatches</code> is Fuse's most expensive setting (per-character match positions for highlighting)</td>
      <td>Faster per-keystroke search response in the modal</td>
    </tr>
    <tr valign="top">
      <td>Immutable <code>Cache-Control</code> headers on <code>/js/*</code>, <code>/css/*</code>, <code>/img/*</code>, <code>/fonts/*</code> (Vue CLI emits content-hashed filenames so this is safe); <code>searchIndex.json</code> / <code>searchWorker.js</code> get <code>max-age=3600 + stale-while-revalidate=86400</code>; <code>fuse.min.js</code> gets <code>max-age=86400</code>; <code>index.html</code> is <code>must-revalidate</code> so users always pick up new builds</td>
      <td>Repeat-visit JS/CSS downloads drop to ~0</td>
    </tr>
    <tr valign="top">
      <td>Early-return on the 3 <code>MutationObserver</code>-installing a11y fixes once their observer is wired (<code>fixOverlayContainer</code>, <code>fixNestedInteractive</code>, <code>fixProhibitedAriaOnImg</code>)</td>
      <td>Saves three broad <code>querySelectorAll</code> calls per route navigation</td>
    </tr>
    <tr valign="top">
      <td>Drop the redundant 2px outer focus outline on the search input (Vuetify's built-in 1px underline + label color shift already meet WCAG 2.4.7 on their own) (v1.3.38)</td>
      <td>Cleaner search modal UI with no a11y regression</td>
    </tr>
    <tr valign="top">
      <td>Remove the <code>&lt;link rel=&quot;preload&quot; href=&quot;/home-splash.webp&quot;&gt;</code> that vue-meta injected after <code>&lt;picture&gt;</code> had already started fetching, plus add <code>loading=&quot;lazy&quot;</code> to the AppFooter logo and Status-page Netlify deploy badges (v1.3.40)</td>
      <td>Eliminates 5 console warnings per homepage visit; defers below-fold images</td>
    </tr>
    <tr valign="top">
      <td>Async-load all 5 stylesheets in <code>index.html</code> (Lato/Oswald, Roboto, Material Icons, Raleway, MDI) using <code>media=&quot;print&quot; onload=&quot;this.media='all'&quot;</code> + <code>&lt;noscript&gt;</code> fallback; add <code>display=swap</code> to the two Google Fonts URLs that didn't have it; preconnect <code>cdn.jsdelivr.net</code> (v1.3.42)</td>
      <td><strong>Render-blocking estimated savings: 4,000 ms → 370 ms (-90%)</strong> across every page</td>
    </tr>
    <tr valign="top">
      <td>Re-encode the homepage hero image: pre-grayscale at the source (CSS already applied <code>filter: grayscale(100%)</code> at runtime), generate AVIF as the first <code>&lt;source&gt;</code>, drop quality (overlay hides artifacts), add <code>fetchpriority=&quot;high&quot;</code> + <code>decoding=&quot;async&quot;</code> (v1.3.43)</td>
      <td>Hero file 94 KB WebP → <strong>36 KB AVIF (-62%)</strong>; homepage LCP ~16.5s → ~11s</td>
    </tr>
  </tbody>
</table>

### Mobile Lighthouse audit — final state (April 2026, post v1.3.43)

20 routes sampled across all 10 content types (homepage, hub listing + article, publications, grants, posts, jobs, meetings, biographies, units, events, IRB, forms, status):

<table>
  <thead>
    <tr>
      <th align="left">Metric</th>
      <th align="left">Value</th>
      <th align="left">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr valign="top">
      <td>Performance score</td>
      <td><strong>53–58</strong> (avg ~57)</td>
      <td>&quot;Needs Improvement&quot; range; consistent across content types</td>
    </tr>
    <tr valign="top">
      <td>FCP</td>
      <td>7.3–8.6s</td>
      <td>Gated by Vue mount + JS bundle parse, not by CSS or images</td>
    </tr>
    <tr valign="top">
      <td>LCP</td>
      <td>7.9–11.0s</td>
      <td>Homepage no longer the outlier (was 16.5s, now ~11s after the AVIF fix)</td>
    </tr>
    <tr valign="top">
      <td>Render-blocking insight</td>
      <td>~370 ms savings</td>
      <td>Down from ~4,000 ms before async stylesheets</td>
    </tr>
    <tr valign="top">
      <td>Top remaining issues</td>
      <td>Vuetify framework cost — <code>unused-css-rules</code> (~103 KB), <code>unused-javascript</code> (~143–194 KB), long network-dependency tree</td>
      <td>All structural; require the rewrite</td>
    </tr>
  </tbody>
</table>

### Where the v1.3.x line ends — honest framing

Everything fixable inside Vue 2 / Vuetify 2 has been fixed. The remaining mobile slowness is **framework cost**: ~1.8 MB of `chunk-vendors.js` (Vue 2 + Vuetify 2 + dependencies) plus ~100 KB of unused CSS that comes with Vuetify 2. No bundle-splitting trick gets this smaller while staying on the framework — it's the price of the choice.

Further perf work requires architectural change:
- **Switching to SSR/SSG** — fixes the blank-screen-during-JS-mount problem (currently ~7s on mobile). That's the Nuxt 4 rewrite.
- **Replacing Vuetify 2** — eliminates the framework JS/CSS overhead. Also the rewrite.
- **Pre-rendering** — possible inside v1.3.x via vue-cli's prerender plugin, but multi-day project and only helps initial page.

For the next several months until the rewrite ships, this is the best shape the site is going to be in. Mobile users get the hero image ~5s faster, search runs without freezing the UI, repeat visits are near-zero bytes, and a11y is still 2,377/2,377 axe-clean (full-site audit, May 6 2026 — re-baseline of the April 14 2026 run that was 2,367/2,367 clean). The remaining slowness is structural — unfixable without writing a new app, which is exactly what's planned.

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
│   ├── mixins/             Global mixins (e.g. apollo-shim.js — reads components' `apollo: {}` blocks)
│   ├── gql-client.js       Fetch-based GraphQL client (replaces Apollo, v1.5.0)
│   └── plugins/            Vuetify, Day.js plugins
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

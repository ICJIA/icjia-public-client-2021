# Changelog

All notable changes to the ICJIA Public Website are documented in this file.

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

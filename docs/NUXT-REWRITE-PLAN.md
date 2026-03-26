# ICJIA Public Website: Nuxt 4 / Nuxt UI Rewrite Plan

**Status:** PLANNING (no code yet)
**New repo:** `icjia-public-nuxt` (separate from this Vue 2 repo)
**Current stack (this repo):** Vue 2.6 + Vuetify 2.5 + Vue Apollo 3 + Vue Router 3 + Vuex
**Target stack (new repo):** Nuxt 4.4.x + Nuxt UI 4.x + Tailwind CSS + `useFetch`/`useAsyncData`
**Data source:** Strapi 3 GraphQL API (`https://agency.icjia-api.cloud/graphql`) -- live queries, no static generation
**Deployment:** Netlify (SSR or SPA mode)

---

## Repository Strategy

**New repo (`icjia-public-nuxt`)** rather than a branch of this repo.

**Why:**
- The dependency trees are incompatible (Vue 2/Webpack vs. Nuxt 4/Vite) -- zero shared `node_modules`
- The directory structure is a complete replacement (`src/` -> `pages/` + `composables/` + `server/`), not an evolution
- A branch would never merge back into `main` -- it's not a diff, it's a replacement
- Separate repos allow both sites to run simultaneously during migration

**Migration workflow:**
1. Create `ICJIA/icjia-public-nuxt` on GitHub
2. This repo (`icjia-public-client-2021`) stays in production throughout the rewrite
3. New repo deploys to staging: `next.icjia.illinois.gov`
4. Content authors test Strapi -> new frontend flow on staging
5. When approved, swap Netlify deploy target to new repo
6. Archive this repo (tag final release, mark read-only)

---

## Why This Is Feasible

| Concern | Assessment |
| --- | --- |
| **Visual parity** | Nuxt UI 4 has equivalents for every Vuetify component used (Card, Button, Table, Tabs, Accordion, Dialog, Breadcrumb, Chip, Alert, Carousel, etc.). Tailwind CSS gives pixel-level control to match the current dark-blue/white theme. |
| **Live data from Strapi 3** | Nuxt's `useFetch` / `useAsyncData` composables fetch on every request (SSR) or on every client navigation (SPA). No build-time generation needed. Authors publish in Strapi 3, refresh the page, see changes immediately. |
| **GraphQL compatibility** | Strapi 3's GraphQL endpoint works with any HTTP client. We can use `$fetch` with POST requests directly -- no Apollo dependency required. Alternatively, `nuxt-graphql-client` module provides a typed composable. |
| **SEO** | Nuxt SSR gives us server-rendered HTML with meta tags out of the box -- better than the current SPA + vue-meta approach. |
| **Component count** | 72 components + 56 views = ~128 files to migrate. Most are presentational cards/lists that map cleanly to Nuxt UI primitives. |

---

## Key Architectural Decisions

### 1. Rendering Mode: SSR (Hybrid) -- Recommended

```
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
  routeRules: {
    '/admin/**': { ssr: false }  // SPA for auth-protected admin
  }
})
```

- Public pages render server-side (SEO, fast first paint, live data on every request)
- Admin pages render client-side only (JWT auth, no SSR needed)
- Strapi 3 GraphQL is called server-side, so the API base URL never leaks to the browser

### 2. Data Fetching: Drop Apollo, Use Composables

```typescript
// composables/useStrapi.ts
export const useStrapi = <T>(query: string, variables?: Record<string, any>) => {
  return useFetch<T>('/api/graphql', {
    method: 'POST',
    body: { query, variables },
  })
}
```

- Wraps Nuxt's built-in `useFetch` around the Strapi 3 GraphQL endpoint
- Server-side calls avoid CORS; response is serialized to the client
- No Apollo overhead, no cache-store mismatch between server/client
- Existing `.js` query files in `src/graphql/` can be reused with minimal changes

### 3. Styling: Tailwind CSS + Nuxt UI Theme + Dark Mode

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',    // maps to Tailwind blue-800 (#1565c0 equivalent)
      neutral: 'slate'
    }
  }
})
```

- Nuxt UI uses Tailwind Variants for component styling
- Custom CSS kept to a minimum -- override via `ui` prop on components
- Global styles for markdown content (`github-markdown.css`) carried over as-is
- **Dark mode:** Full light/dark toggle via `@nuxtjs/color-mode`. Both palettes WCAG AA compliant (4.5:1 text, 3:1 UI). Respects OS `prefers-color-scheme`, user toggle persisted in localStorage.

### 3a. Image Optimization: Nuxt Image + Netlify CDN

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  image: {
    provider: 'netlify'  // automatic resizing, WebP/AVIF, edge caching
  }
})
```

- Replace all `<v-img>` and `<img>` with `<NuxtImg>` or `<NuxtPicture>`
- Netlify Image CDN handles format conversion, resizing, and caching at the edge
- Drop Thumbor dependency (`thumbor-url-builder`, `image.icjia.cloud`)
- Responsive `sizes` attribute on all images for optimal loading

### 3b. Analytics: Plausible (Privacy-First)

- Plausible self-hosted at `plausible.icjia.cloud`
- No Google Analytics -- remove all `vue-gtag` references
- Lightweight script tag or `vue-plausible` Nuxt module
- No cookies, no personal data collection, GDPR/CCPA compliant by default

### 4. Routing: File-Based (Nuxt Convention)

Current Vue Router modules map to Nuxt's `pages/` directory:

```
pages/
  index.vue                          # Home
  about/
    index.vue                        # About landing
    units/
      index.vue                      # Units list
      [slug].vue                     # Unit detail (dynamic)
    staff/index.vue
    employment/index.vue
    publications/index.vue
  news/
    index.vue                        # News landing
    [slug].vue                       # Post detail
    events/
      index.vue
      [slug].vue
    meetings/
      index.vue
      [slug].vue
    press/index.vue
  grants/
    index.vue
    funding/
      [slug].vue
    programs/
      [slug].vue
    policies/index.vue
    required-forms/index.vue
  researchhub/
    index.vue
    articles/[slug].vue
    apps/[slug].vue
    datasets/[slug].vue
  irb/
    index.vue
    meetings/[slug].vue
  admin/
    index.vue
    [...slug].vue                    # Catch-all for admin sub-routes
  search.vue
  status.vue
  [...slug].vue                      # 404 catch-all
```

### 5. State Management: Pinia (Minimal)

- Auth only -- same as current Vuex scope
- Content state lives in composables (`useStrapi`), not a global store
- `useLocalStorage` from VueUse replaces vuex-persistedstate

### 6. Search: Keep Fuse.js, Fetch Index at Runtime

- Current: pre-generated `searchIndex.json` loaded client-side
- New: fetch search index from Strapi at runtime (or keep generated JSON as fallback)
- Fuse.js works identically in Nuxt

### 7. Icons: Nuxt Icon Module (Iconify)

- Maps MDI icons: `mdi-chevron-right` -> `i-heroicons-chevron-right` or `i-mdi-chevron-right`
- Maps Font Awesome: `fa-facebook` -> `i-fa-brands-facebook`
- Iconify supports 200k+ icons, no CDN dependency

---

## Component Mapping: Vuetify -> Nuxt UI

| Vuetify (current) | Nuxt UI 4 | Count | Notes |
| --- | --- | --- | --- |
| `v-btn` | `UButton` | 148 | Direct 1:1. Variants: solid, outline, ghost, link |
| `v-card` | `UCard` | 117 | Slots: header, default, footer |
| `v-row` / `v-col` | Tailwind `grid` / `flex` | 232 | No wrapper component needed |
| `v-icon` | `UIcon` | 92 | Via Iconify; `name="i-mdi-*"` |
| `v-container` | `UContainer` or `<div class="container mx-auto">` | 74 | Tailwind utility |
| `v-chip` | `UChip` or `UBadge` | 52 | UBadge for labels, UChip for interactive |
| `v-img` | `<NuxtImg>` / `<NuxtPicture>` (via `@nuxt/image`) | 42 | Netlify Image CDN -- auto WebP/AVIF, resizing, edge caching |
| `v-tabs` / `v-tab-item` | `UTabs` | 29 | Slot-based, supports lazy loading |
| `v-data-table` | `UTable` | 10 | Built on TanStack Table |
| `v-app-bar` | Custom `<header>` + Nuxt UI nav components | 1 | `UNavigationMenu` for dropdowns |
| `v-menu` | `UDropdownMenu` | 8 | Popover-based |
| `v-dialog` | `UDialog` / `UModal` | 6 | Accessible by default |
| `v-tooltip` | `UTooltip` | 16 | 1:1 |
| `v-text-field` | `UInput` | 7 | 1:1 |
| `v-skeleton-loader` | `USkeleton` | 10 | 1:1 |
| `v-list` / `v-list-item` | Tailwind list or `UNavigationMenu` | 14 | Context-dependent |
| `v-divider` | `USeparator` | 14 | 1:1 |
| `v-overlay` | `UOverlay` | 8 | 1:1 |
| `v-progress-circular` | `UProgress` or spinner | 33 | Use loading states |
| `v-expansion-panel` | `UAccordion` | -- | Slot-based |
| `v-breadcrumbs` | `UBreadcrumb` | -- | 1:1 |
| `v-alert` | `UAlert` | -- | 1:1 |
| `v-btn-toggle` | `UButtonGroup` | 8 | 1:1 |

---

## Phase Plan

### Phase 0: Scaffold & Infrastructure (Week 1)

**Goal:** Empty Nuxt 4 app that builds, deploys to Netlify, and connects to Strapi 3.

- [ ] Initialize Nuxt 4.4.x project in a new directory (or new repo)
- [ ] Install Nuxt UI 4.x, `@nuxt/image`, `@nuxt/icon`, `@nuxtjs/color-mode`
- [ ] Configure `nuxt.config.ts`:
  - SSR enabled, admin routes SPA-only
  - Runtime config for Strapi API base URL
  - Tailwind theme matching current colors (#1565c0 primary, #212e5a dark)
  - `@nuxt/image` with Netlify provider (drop Thumbor)
  - `@nuxtjs/color-mode` for light/dark toggle
  - Plausible analytics script (`plausible.icjia.cloud`)
- [ ] Create `composables/useStrapi.ts` -- generic GraphQL fetcher
- [ ] Port `src/graphql/*.js` query strings to `graphql/*.ts`
- [ ] Create `server/api/graphql.post.ts` proxy (optional, avoids CORS)
- [ ] Set up Netlify deployment config (`netlify.toml`)
- [ ] Verify: app starts, fetches one query from Strapi 3, renders result
- [ ] Set up ESLint + Prettier config matching current conventions
- [ ] Port `.env` variables to Nuxt runtime config

**Deliverable:** Skeleton app on Netlify returning live Strapi data.

---

### Phase 1: Layout Shell & Navigation (Week 2)

**Goal:** Global layout matches current site -- header, footer, sidebar, skip links.

- [ ] Create `layouts/default.vue`:
  - Header (logo + navigation dropdowns) from `menus.json`
  - Mobile sidebar/drawer (hamburger toggle)
  - Footer
  - Skip link (`SkipLink.vue`)
  - Context menus (top/bottom) from `contextMenus.json`
  - Route announcer (sr-only, for screen readers)
- [ ] Port `AppNav.vue` -> Nuxt UI `UNavigationMenu` + `UButton`
- [ ] Port `AppFooter.vue` -> Tailwind layout
- [ ] Port `AppSidebar.vue` -> Nuxt UI `UDrawer` (mobile nav)
- [ ] Port `AppNavContext.vue` / `AppNavContextBottom.vue`
- [ ] Port `ModalSearch.vue` -> `UModal` + search input
- [ ] Port `ModalTranslate.vue` -> `UModal`
- [ ] Implement NProgress equivalent (Nuxt has `<NuxtLoadingIndicator>`)
- [ ] Port config JSONs: `config.json`, `menus.json`, `contextMenus.json`, `disclaimers.json`
- [ ] Create `layouts/admin.vue` (minimal, for auth pages)
- [ ] Visual QA: compare screenshots side-by-side

**Deliverable:** Full layout shell that looks like the current site on desktop and mobile.

---

### Phase 2: Home Page (Week 3)

**Goal:** Home page with live data, visually matching current design.

- [ ] Create `pages/index.vue` with sections:
  - Hero carousel/splash (`HomeSplashV2.vue` -> `UCarousel` or custom)
  - Featured content ribbon (`HomeFeatureRibbon.vue`)
  - News section (`HomeNews.vue` + `HomeCardNews.vue`)
  - Events grid (`HomeEvents.vue` + `HomeEventCard.vue`)
  - Tabbed section: grants/employment/meetings (`HomeTabbed.vue` -> `UTabs`)
  - Research hub featured (`HomeResearch.vue` + `HomeResearchCard.vue`)
  - Click-through boxes (`HomeClickThroughBoxes.vue`)
- [ ] Port all home-specific components (7 components)
- [ ] Wire up GraphQL queries: `GET_HOME` (posts, meetings, jobs, grants, events)
- [ ] Implement `Banner.vue` -> `UAlert` (dismissible site banner)
- [ ] Implement `Disclaimer.vue` (path-based disclaimers)
- [ ] AOS (animate on scroll) -- evaluate if needed or use CSS `@starting-style`

**Deliverable:** Home page rendering live data, visually matching current.

---

### Phase 3: Content Card Components (Week 3-4)

**Goal:** All reusable card/list components ported and styled.

- [ ] Port card components (each becomes a Nuxt UI `UCard` variant):
  - `NewsCard.vue`
  - `EventCard.vue`
  - `JobCard.vue`
  - `MeetingCard.vue`
  - `UnitCard.vue`
  - `BiographyCard.vue`
  - `PublicationCard.vue`
  - `RequiredFormCard.vue`
  - `PolicyCard.vue`
  - `InfoCard.vue`
  - `SearchCard.vue` / `SearchCardAlt.vue`
  - `HubCard.vue`
  - `EmptyCard.vue` (empty state)
- [ ] Port utility components:
  - `AttachmentList.vue`
  - `RelatedList.vue`
  - `ExternalLinkList.vue`
  - `Toc.vue` / `TocPolicies.vue`
  - `SocialSharing.vue`
  - `Toggle.vue` / `EventToggle.vue`
  - `Loader.vue` -> `USkeleton`
  - `WidgetBar.vue`
  - `BaseContent.vue`
  - `BaseCardExpandable.vue` -> `UAccordion`
- [ ] Port Hub-specific components (17 components):
  - `HubCard.vue`, `BaseCard.vue`, `BaseButton.vue`, etc.
  - `ArticleToc.vue`, `HubArticleToc.vue`
  - Marker components
- [ ] Port table components:
  - `MeetingTable.vue` -> `UTable`
  - `PolicyTable.vue` -> `UTable`
  - `RequiredFormTable.vue` -> `UTable`

**Deliverable:** Component library complete, each visually verified against current site.

---

### Phase 4: Content Pages -- News, Events, Meetings (Week 4-5)

**Goal:** All news/events/meetings routes live with real data.

- [ ] `pages/news/index.vue` -- news listing with pagination
- [ ] `pages/news/[slug].vue` -- single post detail
- [ ] `pages/news/press/index.vue` -- press releases
- [ ] `pages/news/events/index.vue` -- events listing with type toggle
- [ ] `pages/news/events/[slug].vue` -- single event detail
- [ ] `pages/news/meetings/index.vue` -- meetings schedule
- [ ] `pages/news/meetings/[slug].vue` -- single meeting detail
- [ ] Port Markdown rendering pipeline:
  - `markdown-it` with all plugins (anchor, attrs, footnote, figures, tables)
  - DOMPurify sanitization
  - `github-markdown.css` styles
- [ ] Wire up all GraphQL queries: posts, events, meetings
- [ ] Implement breadcrumbs on detail pages (`UBreadcrumb`)
- [ ] Implement vue-meta equivalent (Nuxt `useHead` / `useSeoMeta`)

**Deliverable:** All news/events/meetings pages functional with live Strapi data.

---

### Phase 5: Content Pages -- Grants, About, Research Hub (Week 5-6)

**Goal:** Remaining content sections ported.

#### Grants Section
- [ ] `pages/grants/index.vue` -- grants landing
- [ ] `pages/grants/funding/[slug].vue` -- funding detail
- [ ] `pages/grants/programs/[slug].vue` -- program detail
- [ ] `pages/grants/policies/index.vue` -- policies listing
- [ ] `pages/grants/required-forms/index.vue` -- forms listing

#### About Section
- [ ] `pages/about/index.vue` -- about landing
- [ ] `pages/about/units/index.vue` -- units listing
- [ ] `pages/about/units/[slug].vue` -- unit detail (with biographies)
- [ ] `pages/about/staff/index.vue`
- [ ] `pages/about/employment/index.vue`
- [ ] `pages/about/publications/index.vue`

#### Research Hub
- [ ] `pages/researchhub/index.vue` -- hub landing
- [ ] `pages/researchhub/articles/[slug].vue`
- [ ] `pages/researchhub/apps/[slug].vue`
- [ ] `pages/researchhub/datasets/[slug].vue`
- [ ] Port Hub layout components (`AppView`, `ArticleView`, `DatasetView`)

#### IRB
- [ ] `pages/irb/index.vue`
- [ ] `pages/irb/meetings/[slug].vue`

#### Misc
- [ ] `pages/search.vue` -- global search (Fuse.js)
- [ ] `pages/status.vue` -- status page
- [ ] Single/custom pages (from `singles` route module)
- [ ] External link redirect pages
- [ ] `FundedMap.vue` -- map component

**Deliverable:** All public content pages functional.

---

### Phase 6: Search, Auth & Admin (Week 6-7)

**Goal:** Client-side search and admin section working.

#### Search
- [ ] Port Fuse.js search with `searchIndex.json`
- [ ] Option A: Generate index at build time (keep generator scripts)
- [ ] Option B: Fetch index from Strapi at runtime (preferred for live data)
- [ ] `UInput` with debounced search, results in `UCard` list
- [ ] `UModal` for quick search overlay (header icon trigger)

#### Auth & Admin
- [ ] Create Pinia `auth` store (port from Vuex auth module)
- [ ] JWT login flow against Strapi `/auth/local`
- [ ] Route middleware for `/admin/**` (redirect to login if no JWT)
- [ ] `pages/admin/index.vue` -- admin dashboard
- [ ] Port admin sub-pages

**Deliverable:** Full search and admin functionality.

---

### Phase 7: SEO, Accessibility & Polish (Week 7-8)

**Goal:** Parity with current a11y compliance + SEO improvements.

#### SEO
- [ ] `useSeoMeta()` on all pages (title, description, OG, Twitter Card)
- [ ] JSON-LD structured data (WebSite, GovernmentOrganization)
- [ ] `server/routes/sitemap.xml.ts` -- dynamic sitemap from Strapi
- [ ] RSS feeds (port generator scripts or generate server-side)
- [ ] `public/llms.txt` -- carry over
- [ ] Canonical URLs on all pages
- [ ] `robots.txt`

#### Accessibility (WCAG AA — Both Light & Dark Modes)
- [ ] Port a11y runtime fixes from `src/a11y/index.js` (only those needed for CMS-rendered HTML):
  - `fixBlankTableHeadings()` -- Strapi content tables
  - `fixHeadingOrder()` -- CMS heading level skips
  - `fixEmptyTableHeaders()` -- CMS tables
  - `fixFootnoteTargetSize()` -- markdown footnotes
  - `fixFigureTabindex()` -- markdown figures
  - `fixAriaRoleAttribute()` -- CMS content
- [ ] Nuxt UI handles the rest natively (skip links, focus management, roles, aria)
- [ ] Focus management on route change (Nuxt built-in or custom plugin)
- [ ] Route announcer for screen readers
- [ ] Keyboard navigation testing (all interactive elements)
- [ ] **Dark mode contrast audit:**
  - All text: 4.5:1 minimum contrast ratio
  - All UI elements (borders, icons, focus rings): 3:1 minimum
  - Test both modes with axe-core on every page
  - Verify color-on-color combinations (chips, badges, alerts, cards)
- [ ] Run axe-core audit on all pages in BOTH modes -- target 57/57 clean x2

#### Dark Mode Design
- [ ] Define dark palette using Nuxt UI semantic colors:
  - Background: `slate-900` / `slate-950`
  - Surface (cards): `slate-800`
  - Text primary: `slate-50`
  - Text secondary: `slate-300`
  - Primary accent: `blue-400` (lighter than light mode for dark bg contrast)
  - Links: `blue-300` with underline
- [ ] Color mode toggle in header (sun/moon icon)
- [ ] Respect OS `prefers-color-scheme` on first visit
- [ ] Persist user choice in localStorage
- [ ] Smooth transition between modes (CSS `transition: background-color 0.2s`)
- [ ] Markdown content area: dark-compatible `github-markdown.css` variant
- [ ] Images: consider `brightness`/`contrast` filter for dark mode comfort

#### Visual Polish
- [ ] Side-by-side screenshot comparison of every page (both modes)
- [ ] Hover effects on cards (box-shadow + scale transform)
- [ ] Responsive breakpoint parity (xs/sm/md/lg/xl)
- [ ] NuxtLoadingIndicator styled to match current NProgress bar
- [ ] Dark blue (#1565c0, #212e5a) color scheme exact match (light mode)
- [ ] Typography: font sizes, weights, link styles
- [ ] Print styles (force light mode for print)

**Deliverable:** Fully WCAG AA accessible site in both light and dark modes, SEO-optimized, visually matching current design.

---

### Phase 8: Testing & QA (Week 8-9)

**Goal:** Test coverage at parity or better than current 201 tests.

- [ ] Port unit tests to Vitest (Nuxt's default test runner):
  - A11y function tests (19 tests)
  - Auth store tests (14 tests)
  - Component rendering tests (14 tests)
  - Config/data validation tests (76 tests)
  - Markdown rendering tests (26 tests)
  - Security tests (44 tests)
- [ ] Port Playwright E2E tests (update selectors for Nuxt UI markup)
- [ ] Port axe-core accessibility audit scripts
- [ ] Add new tests:
  - Dark mode: axe-core audit in both color modes (light + dark)
  - Dark mode: contrast ratio validation for all semantic colors
  - Nuxt-specific: `useFetch` composable tests
  - SSR rendering tests
  - Route middleware tests
  - SEO meta tag validation
- [ ] Performance testing:
  - Lighthouse scores (target: 90+ across all categories)
  - Core Web Vitals (LCP, FID, CLS)
  - Bundle size comparison vs. current build
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing

**Deliverable:** Full test suite green, performance benchmarks documented.

---

### Phase 9: Migration & Cutover (Week 9-10)

**Goal:** Production deployment with zero downtime.

- [ ] Final visual QA pass -- every page compared to current production
- [ ] Update `netlify.toml` for Nuxt SSR deployment:
  - Build command: `nuxt build`
  - Publish directory: `.output/public`
  - Functions directory: `.output/server`
  - Security headers carried over
- [ ] DNS/routing: deploy to staging subdomain first (e.g., `next.icjia.illinois.gov`)
- [ ] Stakeholder review period (content authors test Strapi -> frontend flow)
- [ ] Set up redirects for any changed URL patterns
- [ ] Archive `icjia-public-client-2021` repo (tag final release, mark read-only)
- [ ] Point Netlify production deploy to `icjia-public-nuxt` repo
- [ ] Monitor error logs and performance for 1 week post-launch
- [ ] Remove deprecated generator scripts (no longer needed for live data)

**Deliverable:** Production site running on Nuxt 4 with live Strapi 3 data.

---

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Strapi 3 GraphQL quirks with Nuxt SSR** | Medium | Server-side proxy (`server/api/graphql.post.ts`) isolates Strapi calls; test early in Phase 0 |
| **Nuxt UI missing a Vuetify component** | Low | Nuxt UI 4 covers all 25+ components we use; gaps filled with Tailwind + Headless UI primitives |
| **Visual regression during migration** | High | Side-by-side screenshot comparison at every phase; deploy to staging for stakeholder review |
| **SSR hydration mismatches** | Medium | Use `<ClientOnly>` for browser-dependent components (maps, AOS animations); test with `nuxi dev --ssr` |
| **Build-time data generation removal** | Low | Generator scripts only feed search index + sitemap; both can be server-generated at runtime |
| **Content author disruption** | High | Zero backend changes -- Strapi 3 untouched; frontend-only rewrite; staging period for author testing |
| **Bundle size increase** | Low | Nuxt 4 tree-shakes aggressively; Tailwind purges unused CSS; expect smaller bundle than Vuetify 2 |
| **Node.js version jump** | Low | Nuxt 4 requires Node 18+; new repo uses Node 22+ (LTS). Already available via nvm. |

---

## What Stays the Same

- **Strapi 3 backend** -- zero changes, same GraphQL API
- **Content workflow** -- authors publish in Strapi, refresh page, see changes
- **URL structure** -- all routes preserved (same paths)
- **JWT auth flow** -- same `/auth/local` endpoint
- **Netlify hosting** -- same platform, just SSR instead of SPA
- **Markdown rendering** -- same `markdown-it` pipeline + DOMPurify
- **Fuse.js search** -- same client-side fuzzy search
- **Security headers** -- same `netlify.toml` headers

## What Changes

| Before (Vue 2) | After (Nuxt 4) |
| --- | --- |
| Vue 2.6 SPA | Nuxt 4.4 SSR (hybrid) |
| Vuetify 2.5 | Nuxt UI 4.x + Tailwind CSS |
| Vue Apollo 3 (heavy) | `useFetch` composable (lightweight) |
| Vuex (auth only) | Pinia (auth only) |
| Vue Router (manual) | File-based routing (automatic) |
| vue-meta (client-side) | `useSeoMeta` (server-rendered) |
| Pre-generated JSON (build time) | Live GraphQL queries (runtime) |
| Node 16 | Node 22+ (LTS) |
| Webpack (Vue CLI) | Vite (Nuxt built-in) |

---

## Estimated Timeline

| Phase | Duration | Cumulative |
| --- | --- | --- |
| 0. Scaffold & Infrastructure | 1 week | Week 1 |
| 1. Layout Shell & Navigation | 1 week | Week 2 |
| 2. Home Page | 1 week | Week 3 |
| 3. Content Card Components | 1-2 weeks | Week 4 |
| 4. News, Events, Meetings | 1-2 weeks | Week 5 |
| 5. Grants, About, Hub, IRB | 1-2 weeks | Week 6 |
| 6. Search, Auth & Admin | 1 week | Week 7 |
| 7. SEO, A11y & Polish | 1-2 weeks | Week 8 |
| 8. Testing & QA | 1-2 weeks | Week 9 |
| 9. Migration & Cutover | 1 week | Week 10 |

**Total: ~8-10 weeks** for a single developer working full-time, with Claude Code assistance.

---

## Open Questions

1. ~~**New repo or same repo?**~~ **DECIDED:** New repo (`icjia-public-nuxt`). See "Repository Strategy" above.
2. ~~**Strapi 3 longevity?**~~ **DECIDED:** Strapi 3 stays for now. Strapi 5 migration is a separate, future project. This rewrite targets the frontend only. Design the `useStrapi` composable with a clean abstraction layer so that swapping Strapi 3 -> Strapi 5 later only requires changing the GraphQL queries and composable internals, not every page.
3. ~~**Image optimization?**~~ **DECIDED:** Use `@nuxt/image` with Netlify provider. Netlify Image CDN handles resizing, format conversion (WebP/AVIF), and caching automatically -- no Thumbor dependency. Drop `thumbor-url-builder` package. Use `<NuxtImg>` and `<NuxtPicture>` components throughout.
4. ~~**Analytics?**~~ **DECIDED:** Plausible only (privacy-first). No Google Analytics. Use `vue-plausible` Nuxt module or lightweight script tag pointing to `plausible.icjia.cloud`. Remove all `vue-gtag` references.
5. ~~**Color mode?**~~ **DECIDED:** Full light/dark mode toggle via `@nuxtjs/color-mode`. WCAG AA compliance required in both modes -- all color combinations must meet 4.5:1 contrast ratio (text) and 3:1 (UI elements). This means:
   - Design two complete color palettes (light + dark) using Nuxt UI's semantic color system
   - Test every component in both modes with axe-core
   - Respect `prefers-color-scheme` OS setting by default, with manual toggle
   - Persist user preference in localStorage

---

## Future: Strapi 5 Migration (Separate Project)

After the Nuxt 4 frontend is stable in production, the backend CMS can be migrated from Strapi 3 to Strapi 5 as a separate effort. The Nuxt rewrite is designed to make this easier:

- **Abstraction layer:** All Strapi calls go through `composables/useStrapi.ts` and query files in `graphql/`. Swapping the backend means updating these files, not touching pages or components.
- **GraphQL differences:** Strapi 5 uses a different GraphQL schema (filters, pagination, response shape). The composable layer absorbs these changes.
- **Sequence:** Frontend first (this plan) -> Backend second (future plan). One migration at a time.

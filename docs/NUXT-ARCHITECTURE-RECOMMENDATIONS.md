# Architecture Recommendations for the Nuxt 4 Rewrite

**Companion document to:** `docs/NUXT-REWRITE-PLAN.md`
**Audience:** developers building the replacement site (`icjia-public-nuxt`)
**Purpose:** codify the lessons learned from the Vue 2 codebase so the new site doesn't repeat the same architectural mistakes, and provide concrete module/pattern recommendations

---

## TL;DR — the one decision that matters most

**Pre-render the content pages as static HTML at build time. Serve them from the Netlify CDN edge.**

This website is a content publication, not a web application. Treat it like a newspaper: the New York Times doesn't render its homepage by booting a JavaScript framework and querying GraphQL. It delivers HTML. The agency's content changes a few times per week, not per second.

- Use `nuxi generate` (SSG mode) or Nitro's `prerender` for every public page
- Fetch Strapi content at build time, cache the result, bake it into HTML
- Rebuild via Strapi webhook on publish (Netlify Build Hook)
- Admin UI, LAP request form, status lookup, live search — those stay interactive; they're **islands** in an otherwise static site

**Outcome:** Lighthouse 95+ on first deploy. TTFB measured in single-digit ms. LCP in hundreds of ms instead of 16 seconds. Virtually every perf metric this team has been grinding on for months becomes a non-issue by default, because the browser doesn't have to execute JS to render content.

This recommendation **differs from the current `NUXT-REWRITE-PLAN.md`**, which specifies live-query SSR. SSR is a reasonable middle-ground (HTML ships on first paint, hydration follows) but for this content profile it's strictly inferior to SSG: SSR still requires the server to query Strapi on every cold cache miss, which means TTFB is still bound by Strapi's response time. With SSG, Strapi is queried once per build — shared across millions of visitors.

**If rebuild-on-publish latency is the blocker**, Nuxt's ISR (incremental static regeneration) on Netlify hybrid mode lets you keep SSG semantics with on-demand revalidation. That's the best of both worlds and should be the first option evaluated.

---

## Stack recommendations

### Core

- **Nuxt 4.x** — current stable. Don't wait for Nuxt 5; it's not production-stable as of early 2026 and will have breaking changes.
- **Nuxt UI 4** — built on [Reka UI](https://reka-ui.com/) (successor to Radix Vue). **Accessibility is table-stakes, not an afterthought.** Way lighter than Vuetify. Tree-shaken per-component. Tailwind v4 under the hood.
- **TypeScript** — Nuxt 4 defaults to it. Resist the urge to opt out. "I'll add it later" always means "never."

### Data layer

- **`useFetch` / `$fetch`** — Nuxt's built-in data composables. SSR-aware caching. No client bundle cost.
- **No Apollo client.** Do not reinstall it. This codebase had it, used zero mutations/subscriptions/normalized cache, and shipped v1.5.0 removing it. If you need GraphQL, use `graphql-request` (~4 KB) or raw `$fetch` — not `@apollo/client` (50+ KB).
- **Strapi queries at build time**, cached in the Nuxt prerender pipeline. Not runtime.
- **Consider `@nuxt/content`** — Markdown + frontmatter, versioned in Git. If Strapi can be retired (or pared back to just the editor UI + build-time export), this is the cleanest option. Content lives with code. Zero CMS at runtime. Free hosting. Perfect SEO.

### Styling

- **Tailwind v4** (via Nuxt UI)
- **Two font families, max.** Pick one for headings (serif or display), one for body. Self-host via `@nuxt/fonts` module — it auto-subsets and serves with `font-display: swap` by default. Do not accumulate six fonts over time like the current codebase.
- **No icon webfonts.** Use `@nuxt/icon` for SVG icons via Iconify — only the icons you use end up in the bundle. This replaces Material Icons, MDI, and Font Awesome.

### Images

- **`@nuxt/image`** — automatic responsive `srcset`, automatic WebP/AVIF/JPG `<picture>` fallbacks, lazy-loading by default. Works with Strapi (has a provider), Cloudinary, Netlify, or local files.

### State & composition

- **Pinia** — successor to Vuex. Smaller API, TypeScript-first, Composition API native.
- **`@vueuse/nuxt`** — composable utilities (debounce, throttle, intersection observer, local storage, etc.) that replace ~80% of what lodash is used for today.

### Testing

- **Vitest** — dramatically faster than `vue-cli-service test:unit`. Chai-compatible.
- **Playwright** — already in use in this repo; keep it.
- **axe-core** in CI (the current repo has this; port the pattern).
- **Screen-reader testing manually once per sprint** — VoiceOver on macOS (Cmd+F5), NVDA on Windows. axe-core covers ~30% of WCAG. The rest is keyboard + screen-reader.

### SEO / meta

- **Nuxt's `useHead`** — replaces `vue-meta`.
- **`@nuxtjs/sitemap`** + **`@nuxtjs/robots`** — declarative config.

### Analytics

- **Keep Plausible** (you already self-host it). Nuxt has `@nuxtjs/plausible` but a simple `<script>` tag works identically. Do not use Google Analytics; you've earned the privacy-respecting moral high ground.

### Deployment

- **Netlify** — you're already there. Works great. Alternatives (Cloudflare Pages, Vercel) are equivalent for this workload.
- **Edge functions** for the dynamic bits (LAP request, status lookup) — far lower latency than round-tripping to Strapi.

---

## Concrete things to AVOID — specific lessons from the Vue 2 codebase

These are failure modes the current codebase exhibits. They caused real pain. Do not re-introduce them.

### Architecture

- **Don't build another client-side SPA for a content site.** If you learn one thing from the current codebase, learn this. Client-side SPAs are for apps with lots of interaction (Gmail, Figma). Not for publishing static-ish content.
- **Don't fetch CMS content at runtime from the client.** Fetch at build. Cache at the edge. Your users should never be billed (in latency) for your database queries.
- **Don't write a custom "SiteImprove filter" content pipeline.** The current codebase deep-scans every CMS response and rewrites content at runtime because Strapi responses contain raw HTML from authors. If content is authored in Markdown (`@nuxt/content`) or rendered with proper Vue components, this entire class of problem disappears.

### Libraries / dependencies

- **Don't use Vuetify.** The bundle weight is painful. The a11y regressions are worse. The design feels dated (Material Design is tired for a gov site). Nuxt UI 4, shadcn-vue, or PrimeVue all do the job lighter and with better a11y defaults.
- **Don't use moment.js.** Day.js or date-fns from day 1. Or better: `Intl.DateTimeFormat` (native, zero bytes).
- **Don't use icon webfonts.** 400+ KiB to render 12 glyphs. Use SVG icons via `@nuxt/icon`.
- **Don't accumulate font families.** This codebase ships Lato + Oswald + Roboto + Raleway + Gentium + Material Icons + MDI. That's six typographic systems for a state agency page. Pick two.
- **Don't use `graphql-tag` + `eslint-plugin-graphql`.** Schema-tied, brittle, drifts from CMS reality. Schema validation should happen server-side or in a dedicated CI test, not inline with every query.

### Code patterns

- **Don't write runtime DOM-fixing functions for a11y.** The current `src/a11y.js` has 24 `fix*` functions that run after every render to patch the DOM (missing ARIA roles, bad table headers, etc.). This is a symptom of using components that generate incorrect markup. Using components that generate correct markup makes those functions unnecessary. If Nuxt UI 4 ever requires a `fix*` function, file an upstream bug.
- **Don't auto-register components globally.** Nuxt's auto-import does this per-route. The current codebase had `_globals.js` forcing every component into the main bundle; it took a v1.3.48 rewrite to fix.
- **Don't register global Vue mixins for cross-cutting concerns.** Use Nuxt plugins, middleware, or composables.
- **Don't set `fetchPolicy: "no-cache"` on every query** (if you end up with any GraphQL queries at all). If you never use the cache, don't have a cache.
- **Don't inline `<script>` blocks in `app.vue`** to do route-conditional preloads or init hacks. Nuxt's route metadata and plugin system handle this.

### Tooling

- **Don't keep Vue CLI, Webpack, or any of the 2021-era tooling.** Vite + Nitro is faster, smaller, and actually maintained. Nuxt 4 uses these natively.
- **Don't use `vue-meta`.** Nuxt's `useHead` replaces it.
- **Don't ship `regenerator-runtime`.** With modern browserslist targets, nothing needs it.
- **Don't hand-roll route preloading.** Nuxt's `<NuxtLink>` does this correctly.

### Accessibility specifics

- **Don't treat axe-core 57/57 as "done."** It's roughly 30% of WCAG coverage. The rest is keyboard testing, screen-reader testing, 200%-zoom testing, color contrast on overlays, reduced-motion support.
- **Don't build your own focus-trapping for modals.** Use Nuxt UI / Reka UI's dialog primitive. It's been audited by paid a11y consultants.
- **Don't override `outline: none`** anywhere without a paired `:focus-visible` replacement. Grep for it in CI.
- **Don't use color alone** to convey state (chip status, form validation, required indicators). Pair color with icons, text, or patterns.

### Performance

- **Don't pre-load everything.** Pre-load the LCP resource. That's it. Every additional preload steals bandwidth from the critical path.
- **Don't load analytics synchronously.** Plausible is async-safe; keep it that way.
- **Don't treat Lighthouse mobile score as the only perf metric.** Add RUM via Vercel Analytics / Cloudflare Analytics / Plausible Web Vitals. Measure your real users on real devices.

---

## Punchlist — `nuxt.config.ts` starter

```ts
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
  modules: [
    '@nuxt/ui',            // replaces Vuetify
    '@nuxt/content',       // replaces Strapi for public content (if feasible)
    '@nuxt/image',         // replaces hand-rolled image variants
    '@nuxt/icon',          // replaces Material Icons + MDI + FA
    '@nuxt/fonts',         // replaces the 6-font mess in public/index.html
    '@vueuse/nuxt',        // replaces most lodash usage
    '@nuxtjs/sitemap',     // replaces hand-rolled sitemap generator
    '@nuxtjs/robots',      // replaces the robots.txt file
    '@nuxtjs/plausible',   // keep your existing Plausible instance
  ],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  fonts: {
    families: [
      { name: 'Lato',   provider: 'google', weights: [300, 400, 700, 900] },
      { name: 'Oswald', provider: 'google', weights: [400, 500, 600, 700] },
    ],
    // @nuxt/fonts subsets, self-hosts, and swap-loads automatically
  },
})
```

---

## Migration strategy notes

The existing `NUXT-REWRITE-PLAN.md` already covers the migration workflow (new repo, parallel deploys, etc.) — that plan is sound. A few additions:

1. **Ship an MVP first.** Don't port all 128 components in one release. Start with the 5 most-visited routes. Validate the architecture. Iterate.

2. **A/B traffic split during rollout.** Netlify supports route-level traffic splitting. Send 10% of traffic to the new site for a week before cutting over. Compare real-world metrics (Plausible Web Vitals) not just Lighthouse.

3. **Set up error monitoring from day 1.** Sentry free tier, or Netlify's built-in. Silent errors are harder to catch after cutover.

4. **Content migration is the biggest risk, not code migration.** If Strapi stays: test every content type's rendering at build time with real production data. If moving to `@nuxt/content`: plan the export pipeline carefully (Strapi → Markdown is not trivial for rich CMS content with relations).

5. **Keep the current repo in production during the entire rewrite.** Do not cutover until the new site is feature-complete, content-verified, and has been running on staging for at least a week with real editor activity.

6. **Don't chase feature parity for features no one uses.** The current codebase has 3 search implementations, several commented-out analytics providers, and stale admin views. Audit before you port. Killing is cheaper than porting.

---

## Accessibility — start-of-project checklist

Hand this to your a11y consultant at the start, not the end:

- [ ] Keyboard-only navigation: can every interactive element be reached via Tab?
- [ ] Focus visible at every step (no missing or hidden focus rings)
- [ ] Modals trap focus; Esc closes; focus returns to the opener on close
- [ ] Route changes announced via `aria-live` region
- [ ] Headings follow hierarchy (H1 → H2 → H3, no skips)
- [ ] Landmarks: single `<main>`, proper `<header>` / `<nav>` / `<footer>`
- [ ] Forms: programmatic label association; error messages in `role="alert"`; first-invalid-field focus on submit failure
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for UI components (manual check on semi-transparent overlays — automated tools miss these)
- [ ] Touch targets ≥ 44×44 CSS pixels (WCAG 2.5.5)
- [ ] Respects `prefers-reduced-motion`
- [ ] Readable at 200% zoom (WCAG 1.4.4)
- [ ] `<iframe>` titles for embeds (YouTube, Tableau, Google Forms, Vimeo)
- [ ] External links: `rel="noopener noreferrer"` + visible "opens in new window" indicator for screen readers
- [ ] `lang` attribute on `<html>` (and on foreign-language spans if content is bilingual)
- [ ] Screen-reader pass (VoiceOver on macOS + NVDA on Windows; both are free)
- [ ] Print styles (gov content often needs to print readably)

---

## The honest bottom line

The current Vue 2 codebase is stuck at Lighthouse mobile 67 after months of work. It's not because the team is bad at perf. It's because the **architecture is wrong** for what this website does. A content-heavy government site doesn't need a SPA; it needs HTML.

The Nuxt 4 rewrite is an opportunity to reset on a simpler, smaller, more maintainable architecture. **Resist the urge to port the current patterns.** Most of what's in this repo shouldn't exist in the next one:

- No custom CMS content sanitization pipeline (Markdown is already clean)
- No 24 runtime a11y fix functions (proper components don't need them)
- No GraphQL client (REST + fetch, or `@nuxt/content`)
- No global component mixin for "loading" states (`useAsyncData` handles this)
- No hand-rolled search (Nuxt Content or Algolia DocSearch)
- No hand-rolled image variants (`@nuxt/image`)
- No six-font stack (two, max)
- No Vuetify

Let the new site be simpler. Government content sites are newspapers with a CMS backend. Build them like newspapers: pre-rendered HTML, small runtime, accessible by default.

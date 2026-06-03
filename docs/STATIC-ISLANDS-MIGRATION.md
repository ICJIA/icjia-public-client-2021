# De‑serverless: Static build + client‑side live‑islands (migration plan)

**Status:** proposal · **Branch:** `feat/astro-researchhub-fixes` · **Date:** 2026‑06‑03
**Reference model:** [`ICJIA/adult-redeploy-client-next`](https://github.com/ICJIA/adult-redeploy-client-next) (Astro 5, static + Alpine live‑islands, zero functions)

---

## 1. Why

Netlify Functions usage hit **>50% of quota in two days**. Root cause is the rendering model, not traffic:

- **`output: 'server'`** — every page view is a Netlify Function invocation.
- **`keep-warm.mjs`** runs on a **`*/5 * * * *`** cron and *deliberately* pings the busiest SSR routes to fight cold‑starts — self‑inflicting ~288 runs/day × N routes **on top of** real traffic.
- Plus `nightly-rebuild.mjs` and `purge-cache.mjs`.

SSR + keep‑warm is inherently function‑hungry; edge caching only softens it. **Goal: take runtime functions to zero** by moving to a static build with client‑side live‑islands — the model already proven on Adult Redeploy.

> Production is currently the legacy Vue site (post‑rollback). This plan is for the **re‑cutover** to Astro — done right this time, functionless.

---

## 2. Target architecture (Adult Redeploy model — verified from its repo)

- **`output: 'static'`** — every page prerendered to HTML at build, served from the CDN. **Zero functions.**
- **Content baked at build time** → still **crawlable / SiteImprove‑readable**. *This preserves the entire reason we left the Vue SPA* (SiteImprove can't parse a client‑only SPA).
- **Alpine "live‑islands"** poll Strapi's **public** GraphQL *in the browser* and swap changed content on load → also **live**: *"publish in Strapi, reload the page, ~1s later it's updated"* — **no rebuild** for content edits.
- **New pages** (new slugs/URLs) appear on a **rebuild**, triggered functionlessly (§5).

Net: **crawlable (baked) + live (islands) + zero functions.**

---

## 3. Current‑state inventory

**LIVE / SSR today** (convert): `/` · `/news` + `/news/[slug]` · `/news/meetings` + `[slug]` · `/news/press` · `/news/events` · `/events` + `[slug]` · entire `/researchhub/*` (articles/datasets/apps + indexes + overview/staff + carousel) · `/grants/funding` + `[slug]` · `/grants/programs` + `[slug]` · `/grants/fsgu-home|fsgu-staff` · `/grants/required-forms` · `/about/biographies/[slug]` · `/about/icjia-staff` · `/about/composition-and-membership` · `/about/employment` + `[slug]` · `/about/publications/[slug]` · `/innovation-and-digital-services/*` (+ infonet, isu-staff) · `/irb/irb-meetings` · `/search/[query]`

**Already static** (`prerender=true`, keep): `/about` + `/about/[slug]` · `/about/units/[slug]` · `/about/publications` (listing) · `/news/publications` · `/grants/[slug]` · `/grants/rules-regs-policies` · `/grants/training` · `/forms/grant-status|lap-request` · `/irb` + `/irb/[slug]` · `/search` (shell) · `/404` · `/api/publications.json`

**`/api` JSON endpoints:** `home-research.json` (SSR), `hub-app-images.json` (SSR), `meeting.json` (SSR), `publications.json` (already static)

**Alpine islands already present (19):** HomeResearch, HomeTabbed, NewsListing, MeetingsListing, MeetingTable, EventsListing, FundingListing, ProgramsListing, EmploymentListing, PublicationTable, WidgetBar, FsguHome, PageToc, SiteHeader, researchhub/{HubListing, HubCarousel, ArticleView, ArticleToc, AppView}

**To delete:** `netlify/functions/{keep-warm,nightly-rebuild,purge-cache}.mjs`; `src/lib/cache.ts` (`setCache`); the `keepWarm` + `cacheTTL` blocks in `icjia.config.mjs`.

**Data layer:** `src/lib/data.ts` + `research.ts` + the graphql modules already run **at build time** (they power the existing static routes), so the fetchers are reused as‑is — no rewrite.

---

## 4. Migration — phased & route‑by‑route

### Phase 1 — Flip the renderer to static
- `astro.config.ts`: `output: 'server'` → **`'static'`**. Drop the `@astrojs/netlify` SSR adapter; keep build‑time image optimization (`astro:assets` via `CmsImage.astro`) — no Image‑CDN function needed.
- **Add `export const prerender = true`** to every SSR page (the ~38 `setCache` files).
- **Add `getStaticPaths()`** to every dynamic route so Astro enumerates the slugs at build (fetch the full id/slug list from Strapi, mirror the existing static `[slug]` routes):
  `/news/[slug]`, `/news/meetings/[slug]`, `/events/[slug]`, `/researchhub/articles|datasets|apps/[slug]`, `/grants/funding|programs/[slug]`, `/about/biographies/[slug]`, `/about/employment/[slug]`, `/about/publications/[slug]`, `/innovation-and-digital-services/[slug]`.
- **`/search/[query]`** → pure client‑side search (Pagefind or the existing prebuilt search index); drop the SSR query route.
- **`/api/*` SSR endpoints** → build‑time static JSON: set `prerender = true` (or move to a `prebuild` generator that writes `public/api/*.json`) for `home-research.json`, `hub-app-images.json`, `meeting.json`. (`publications.json` already is.)
- **Remove `setCache(...)`** from all pages + delete `src/lib/cache.ts`.

### Phase 2 — Live‑islands (freshness without a rebuild)
Add the Adult‑Redeploy **fetch → signature → swap** pattern to the islands on edit‑sensitive surfaces. Each island, on `init`: fetch the section's current data from the **public** Strapi GraphQL, compute a lightweight content signature (e.g. hash of ids+`updatedAt`), compare to the build‑baked signature, and replace the rendered nodes only if it changed.

| Surface | Island(s) to upgrade | Why live |
|---|---|---|
| Home news/meetings/research strip | HomeTabbed, HomeResearch | top‑traffic, editor‑visible |
| News list + detail | NewsListing, `/news/[slug]` | post‑publish must show immediately |
| Meetings list + detail | MeetingsListing, MeetingTable, `/news/meetings/[slug]` | agendas updated late |
| Events | EventsListing | time‑sensitive |
| Grants NOFOs | FundingListing, `/grants/funding/[slug]` | deadlines |
| ResearchHub listings + article | HubListing, ArticleView | "changes constantly" |
| Bios / staff / board | icjia-staff, composition, biographies/[slug] | edit‑sensitive (the reason they were SSR‑live) |

Lower‑churn sections (units, about/[slug], rules‑regs, IRB, press, programs, employment, ISU) → **static only**, refreshed on the next rebuild (no island needed).

### Phase 3 — Functions / adapter / cache teardown
- Delete `netlify/functions/keep-warm.mjs`, `nightly-rebuild.mjs`, `purge-cache.mjs`.
- Remove `keepWarm` + `cacheTTL` from `icjia.config.mjs`; remove `setCache` + `src/lib/cache.ts` + its test.
- `netlify.toml`: drop `functions = "netlify/functions"`; `publish = "dist"` static. No adapter env.
- Drop the related env vars (KEEP_WARM_*, NIGHTLY_*, PURGE_SECRET, NETLIFY_BUILD_HOOK_URL stays only for §5).

### Phase 4 — Re‑cutover (one‑file flip, as before)
- `netlify.toml` `[build]` already toggles base/command; point production at the static Astro build (`base="astro"`, `command="pnpm build"`, `publish="dist"`) — same flip as the prior cutover, minus `functions`.

### Phase 5 — New‑page rebuilds (functionless)
- **Strapi publish webhook → Netlify Build Hook URL**, posted **directly** by Strapi (no intermediary function), debounced in the Strapi webhook config. This mints new slugs within one build (~minutes).
- **Optional safety net:** a **GitHub Actions** scheduled workflow (cron) that POSTs the same build hook nightly — still zero Netlify functions.

---

## 5. Verification (success criteria)
- `dist/` is fully static — **no `.netlify/functions/`** output; Netlify deploy shows 0 functions.
- **View‑source** of a list/detail page contains the actual content (baked) → SiteImprove/crawler‑readable.
- Edit content in Strapi → **reload** an existing page → the live‑island swaps it in within ~1s, **no rebuild**.
- Publish a **new** item → after the webhook rebuild, its new URL resolves (200, not 404).
- VR sweep parity (static build vs the current branch) at the 5 viewports; axe‑core clean.
- Netlify Functions usage flatlines at ~0.

---

## 6. Tradeoffs / risks
- **Build time grows** — baking hundreds of pages (251 articles + bios + units + news + …) adds a few minutes per build; builds are infrequent, and **build minutes are far more generous than function calls.** Mitigate with the existing batched fetchers + incremental thought later if needed.
- **New pages** appear on a rebuild (minutes), not instantly. Existing‑page **edits** are instant via islands.
- **Detail‑page edits** are instant only where we add a detail island (bios, NOFOs, news/meetings); elsewhere they wait for the next rebuild.
- **Client‑fetch from Strapi** must stay CORS‑open + public (it already is — the legacy Vue SPA and Adult Redeploy both do this).

## 7. Rough effort
- Phase 1 (static flip + getStaticPaths + api‑to‑static): ~1 focused day — mostly mechanical (`prerender=true` + a getStaticPaths per `[slug]`, reusing existing fetchers).
- Phase 2 (live‑islands): ~1–2 days — build the fetch/signature/swap once (port Adult Redeploy's island), then apply to ~7 surfaces.
- Phase 3–5 (teardown + webhook + verify): ~½ day.
- **Total ~3 days**, low‑risk (additive, branch‑isolated, reuses the existing data layer + islands).

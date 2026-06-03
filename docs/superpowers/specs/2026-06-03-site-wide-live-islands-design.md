# Site-wide live-on-refresh (live-islands everywhere) — design

**Status:** approved design · **Branch:** `feat/astro-researchhub-fixes` · **Date:** 2026-06-03
**Reference model:** `ICJIA/adult-redeploy-client-next` (Astro static + Alpine live-islands, zero functions)
**Supersedes the rationing in:** `docs/STATIC-ISLANDS-MIGRATION.md` §2–3 (which limited live-islands to "edit-sensitive surfaces"). With zero serverless cost there is no reason to ration; this design makes **every** content surface live-on-refresh.

---

## 1. Goal

When an editor publishes or edits content in Strapi, a **browser refresh** of the relevant page reflects it — across the **whole** site — with **no rebuild**, while the site stays **fully static** (zero Netlify functions) and **crawler/SiteImprove-readable**.

### Success criteria
- Edit or **delete** an existing item in Strapi → refresh any **list/home** surface that includes it → the change appears (~1s, post-paint), no rebuild.
- Edit an existing **detail** page's body/metadata in Strapi → refresh that page → the change appears, no rebuild.
- **View-source** of every surface still contains the real content (baked baseline) → crawler/SiteImprove-readable.
- `dist/` ships **0 functions**.
- A brand-**new** item appears in lists on refresh; its **new standalone URL** resolves only after the webhook rebuild (documented boundary, not a regression).

---

## 2. Current state (verified)

- `astro.config.ts`: `output: 'static'`, **no adapter** → every route prerendered to HTML at build; every `src/pages/api/*.json.ts` has `export const prerender = true` → baked to static JSON at build.
- **Only `PublicationTable.astro` is genuinely live**: on `init()` it renders the baked baseline, then `fetchLive()` hits `https://agency.icjia-api.cloud/publications` (REST, `/count` + `_limit`/`_start` slices) in the browser and swaps. It is explicitly the "pilot for the de-serverless live-island pattern."
- Everything else is **baked at build**:
  - `HomeCardNews` + `HomeTabbed` — inline server HTML from build-time `getHome()`.
  - `HomeResearch` — client-fetches `/api/home-research.json`, but that endpoint is `prerender=true` (build-frozen snapshot), so it *looks* live but isn't.
  - `NewsListing`, `HubListing`, `MeetingTable` — Alpine over a baked JSON island; no live network call (HubListing/MeetingTable's only fetches are to baked `/api/*.json`).
- **Root cause of the reported bug:** Phase 2 (live-islands) was completed for publications only; every other surface is frozen baked HTML. New Strapi content cannot appear on a deployed static build until a rebuild.

### Data sources (verified)
- `agency.icjia-api.cloud` — GraphQL (`/graphql`, config `baseGraphQL`) **and** REST. News collection is **`/posts`** (`/news` 404s). REST returns `Access-Control-Allow-Origin: *`.
- `researchhub.icjia-api.cloud` — GraphQL (`/graphql`, `HUB_GRAPHQL`) + uploads (`/uploads`). Powers researchhub lists/details + home "Latest Research".
- **CORS:** both hosts' GraphQL **reflect only the production origin** (`https://icjia.illinois.gov`) → would break on Netlify preview URLs. REST returns wildcard `*` → works from prod, previews, and localhost. **⇒ use REST for the live fetch.**

### Render stack (verified)
- `markdown-it` v12 + 6 plugins (anchor, footnote, link-attributes, multimd-table, implicit-figures, attrs) + `dompurify` + `src/lib/contentSanitizer.js`.
- `src/lib/markdown.js` is **server-bound** — imports `jsdom` + `./server-dom` (linkedom) to back DOMPurify with a DOM on the server. Cannot ship to the browser as-is.
- `src/lib/contentSanitizer.js` is **client-portable** — only imports `./brokenLinks` (no jsdom/node built-ins). `dompurify` is browser-native; `markdown-it` is isomorphic.

---

## 3. Fixed constraints

1. **Baked baseline always stays** — the server-rendered HTML is the no-JS/crawler/SiteImprove view; the live fetch only layers on top. Never an empty shell. (This is the reason the project left the Vue SPA.)
2. **REST, not GraphQL, for the live fetch** — wildcard CORS works on every origin; GraphQL would break on previews.
3. **New-slug boundary** — live-islands deliver *edits* and *list membership* on refresh; a brand-new page **URL** still 404s until a rebuild. Strapi→Netlify build-hook (the existing plan's **Phase 5**) remains required and complementary.

---

## 4. Architecture

Two shared client cores, built once, applied across all surfaces.

### 4.1 `live-list` core (`src/lib/live/live-list.js`)
Each surface supplies `{ host, collection, shaper, signatureKeys }`. On the page, after the baseline has painted:
1. read the baked baseline from the surface's JSON island;
2. `fetch(host + '/' + collection + '/count')`, then `_limit`/`_start` slices → full collection;
3. shape each row via the surface's **shared** shaper;
4. compute a **content signature** (hash over `id + updatedAt` across the collection);
5. **swap only if the signature differs** from the baked baseline's signature.

**Upgrades over the publications pilot (done once, centrally):**
- **Signature-based swap** replaces the pilot's `liveRows.length > baseline.length` test, which catches new items but silently misses **edits and deletions**. The signature catches all three.
- **Shared isomorphic shapers** — extract each collection's **pure** shaper (no `getImage`/server-dom) into a small module imported by **both** `data.ts`/`research.ts` at build **and** the client core. One shaper, two callers, no drift. (Replaces the pilot's duplicated `shapePublication`.)

### 4.2 `live-detail` core (`src/lib/live/live-detail.js`)
On a detail page, after first paint:
1. **dynamically import** the render bundle (markdown-it + plugins + dompurify + contentSanitizer) — detail pages only, post-paint;
2. fetch the record by slug via REST;
3. if live `updatedAt` ≠ the baked `updatedAt` embedded in the page, render the body through the **shared markdown-it config + `contentSanitizer.js`** (native-DOM DOMPurify), swap the content container, and rebuild the TOC (`ArticleToc`/`PageToc` are already Alpine/client-side);
4. swap declared metadata fields (title, date, tags, authors, attachments).

### 4.3 Detail-render parity mechanism
Extract the markdown-it **config/factory** (the 6 plugins + options + render→sanitize sequence) into a module shared by both:
- the existing **server** entry (`markdown.js`, which adds jsdom-backed DOMPurify), and
- a new **client** entry (native-DOM DOMPurify).

Both reuse `contentSanitizer.js` **unchanged**. Same config + same sanitizer ⇒ byte-identical output server vs client (enforced by test — §7).

### 4.4 Host/collection routing
A single map declares each surface's `{ host, collection }`. Known: news=`agency/posts`, publications=`agency/publications`; researchhub articles/datasets/apps=`researchhub/<collection>`; meetings/events/funding/programs/bios/units=`agency/<collection>`. **The exact collection-name map is finalized in the implementation plan** (probe each `/count` like the verified `/posts`).

---

## 5. Phase A — live-list (all list/home surfaces)

**Surfaces:** `/` (HomeCardNews, HomeTabbed, HomeResearch), `/news`, `/news/meetings`, `/news/events` (+ `/events`), `/grants/funding`, `/grants/programs`, all `/researchhub/*` lists, `/publications` (migrate the pilot onto the shared core).

**Notes:**
- `NewsListing`, `HubListing`, `PublicationTable` already ship a JSON-island baseline → wire straight to the core.
- **Home refactor:** `HomeCardNews` + `HomeTabbed` render inline HTML today; refactor to the island+`x-for` pattern (same shape as `NewsListing`) so the core can swap them.
- `HomeResearch` already fetches client-side → repoint its source from baked `/api/home-research.json` to live researchhub REST (top-N of articles/apps/datasets).

**Fallback & error handling:** live fetch fails or returns empty → keep the baked baseline (and the baked `/api/*.json` where it exists). The crawler/no-JS view is never affected.

**Gate before Phase B:** ship Phase A, then **verify on a real Netlify deploy** (REST-CORS in the deploy env, full-collection fetch perf, image-swap parity) before starting the heavier client-render work.

---

## 6. Phase B — live-detail (all `[slug]` templates)

**Tier 1 — markdown-body (uniform):** `news/[slug]`, `researchhub/articles/[slug]`, `about/[slug]`, `grants/[slug]`, `innovation-and-digital-services/[slug]`, `irb/[slug]`, `about/biographies/[slug]`, `about/units/[slug]`, `about/employment/[slug]`, `about/publications/[slug]`. Body + TOC swap handled uniformly by the core.

**Tier 2 — component-structured (extra work):** `news/meetings/[slug]` (bodyHtml + attachments/related/external), `researchhub/datasets/[slug]` + `researchhub/apps/[slug]` (`DatasetView`/`AppView` render structured props, not a markdown blob). These re-render their sub-parts, not just a body.

**Tier 3 — skip:** `publications/[slug]` is a 301 redirect; nothing to make live.

**Bundle discipline:** the render bundle loads **only on detail pages, only after paint**, via dynamic import → zero FCP/LCP/baseline impact.

---

## 7. Cross-cutting concerns & verification

**Cross-cutting:**
- **Images:** live-swapped content uses raw Strapi upload URLs (cross-host, unoptimized) vs the baked optimized same-origin webp. **Accept** — post-paint only, and in-body markdown images are raw Strapi URLs regardless. Minor visual/perf delta on the swapped layer only.
- **CSP:** live fetches require `connect-src` to include both Strapi hosts and `img-src` to include researchhub uploads. Intersects the cutover "CSP enforce" TODO — this design adds those origins.
- **Performance:** each list fetches its full collection post-paint (publications already does); baseline protects FCP/LCP. Detail adds the lazy render bundle. Both bounded and post-paint.
- **Cleanup as we touch files:** correct stale comments (e.g. `home-research.json.ts`'s "Live per request; edge-cached 120s" — it is `prerender=true` = baked).

**Verification (per phase):**
1. **Parity test** — extend the existing `contentSanitizer.parity` suite so the shared markdown-it config produces **byte-identical** HTML server vs client.
2. **Deploy acceptance** — publish/edit/**delete** in Strapi → refresh a real **build/preview/deploy** (**not** `astro dev` — dev re-runs build-time code per request and masks the bug) → swap appears ~1s, no rebuild.
3. **VR sweep** — baked baseline vs post-swap must match at the 5 viewports (the swap must not shift layout); **axe-core** clean after swap.
4. **Functionless** — `dist/` ships 0 functions.
5. **New-slug** — new item 404s until the webhook rebuild, then 200 (confirms the Phase 5 boundary).

---

## 8. Out of scope / non-goals
- Serving brand-new page **URLs** without a rebuild (impossible in a static model; handled by the Phase 5 build-hook).
- GraphQL-based live fetches (rejected: preview-origin CORS).
- Re-introducing any serverless function or SSR.
- Search (`/search`) — already client-side; unchanged here.

## 9. Open items to resolve in the implementation plan
- Finalize the per-surface **collection-name map** (probe each REST `/count`).
- Confirm `brokenLinks.js` (pulled in by `contentSanitizer.js`) is **client-safe**; if not, isolate the client-needed portion.
- Decide the home "Latest Research" live shape (top-N per researchhub collection) and whether to retire `/api/home-research.json` or keep it as fallback.
- Define the shared signature hash (stable, order-independent over `id + updatedAt`).

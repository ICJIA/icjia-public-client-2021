# Live Detail Fallback — render post-build CMS content client-side

**Status:** spec (awaiting review) · **Branch:** `feat/astro-researchhub-fixes` · **Date:** 2026-06-05
**Related:** [`STATIC-ISLANDS-MIGRATION.md`](./STATIC-ISLANDS-MIGRATION.md) (this lifts the §6 tradeoff "new pages appear on a rebuild, not instantly")

---

## 1. Problem

The site is a pure static build (`output: 'static'`, zero functions). Detail pages are
generated one-per-slug at build via `getStaticPaths()`. A record added to Strapi **after**
the last build has no HTML file, so Netlify serves `404.astro`.

Concrete failing case (live on the branch deploy): a meeting published minutes ago —
`/news/meetings/uniform-statewide-crime-statistics-task-force-agenda-june-9-2026` — 404s,
though the record exists in Strapi and renders on legacy prod.

Nightly rebuilds mint the real (pixel-perfect, crawlable) page within ≤24h. The gap to close:
**an author adds content via the CMS and must see the live page immediately, before the rebuild.**

## 2. Goal / non-goals

**Goal:** On a hit to an unbuilt content-detail URL, if the record exists in Strapi, render the
real detail page **client-side** — byte-identical to the eventual built page except for
build-time-optimized images (§4). Transient: replaced by the real static page on the next
nightly build.

**Non-goals (explicit, per owner):**
- SEO / JSON-LD / search indexing of these transient pages.
- HTTP 200 status — the response stays a 404 status; the content renders regardless.
- Listing freshness — `/news`, `/news/meetings/`, `/researchhub/*` indexes already run
  `liveList` islands that fetch fresh Strapi and swap on change. Verified separately (§7), not
  re-built here.

## 3. Architecture

**Host:** extend the existing smart-404 (`src/pages/404.astro`). It is already the Netlify
catch-all for every unbuilt path, and already detects the content type via its `DETECT` array
(prefix → host + collection + query, ordered most-specific-first). Today it stops at a
"This page is being published" placeholder; we take it the last step to **render the content**.

**Flow on a content-detail hit:**
1. **Fetch** the full record: `GET {host}/{collection}?slug={slug}[&{query}]` (Strapi v3 REST).
   Verified CORS-open (`access-control-allow-origin: *`) from the preview origin on both
   `agency.icjia-api.cloud` and `researchhub.icjia-api.cloud`; REST returns relations
   (`attachments`, `external`, `tags`, related `posts`) inline — no GraphQL needed.
2. **Shape** the REST-raw record → the build's display shape via an isomorphic per-type
   detail shaper in `src/lib/live/shapers/` (extends the existing list shapers; they already
   normalize REST snake_case, e.g. `raw.updated_at ?? raw.updatedAt`).
3. **Body HTML** via the isomorphic `renderToHtml()` (§5).
4. **Render** via a per-type client renderer → HTML string → inject in place of the `.nf`
   body; render the detected section's context bar; set `document.title`.
5. **No record / error / timeout** → the existing 404 (unchanged).

**Lazy load:** the 404 page dynamically `import()`s the renderer module **only** on a
content-detail hit, so normal 404s never download the markdown/sanitizer bundle.

## 4. Accepted deviation (a physical limit, already the team's pattern)

`astro:assets` optimizes images at **build** (Sharp → hashed `/_astro/…` assets). A brand-new
image has **no optimized asset until a build runs** — it cannot be reproduced client-side. The
existing live-islands already accept this: `src/lib/live/shapers/news.ts:41-44` documents that
live-fetched rows carry the **raw Strapi image URL** (the `<img>` tag accepts both). So:

- **Meetings, grants/funding** — text/markdown/attachments only → **full byte-match.**
- **News posts, events, researchhub articles/datasets/apps** — hero/splash images render from
  the **raw Strapi URL** (visually identical, different `<img>` markup). Everything else matches.

This is the single deviation from "exact," and it is unavoidable in any static build.

**Owner ruling (2026-06-05):** the transient window is an explicitly accepted tradeoff — for the
≤12–24h until the nightly rebuild, the new page may be un-optimized (raw images), **not yet in
the sitemap / search index / SEO**. That is fine. The **non-negotiable** requirement is that an
author who adds content in the CMS **sees the live page immediately** via the client-side render.
The rebuild then mints the canonical optimized + indexed page.

## 5. Isomorphic markdown pipeline

`renderToHtml()` (`src/lib/markdown.js`) is the one function that turns body markdown →
sanitized, a11y-fixed HTML (used across `data.ts` for `safeBodyHtml` / `bodyHtml`). Making it
run in the browser is the foundation of byte-matching the body.

**Owner suggestion (2026-06-05): "use markdown-it (it runs in client)."** `renderToHtml()` *is*
markdown-it + the same plugin set. So instead of standing up a **separate** client-side markdown-it
config (which would drift from the build's output), we **reuse `renderToHtml()` itself** —
realizing exactly the owner's suggestion while guaranteeing the body is identical to the built page.

- `contentSanitizer.js` (1277 lines, the "SiteImprove filter") + `server-dom.ts` are already
  **DOM-API-based**: native `DOMParser` in the browser; the linkedom shim is guarded to install
  only when `DOMParser` is undefined (Node) → **no-op in the browser**.
- `brokenLinks.js` is a **pure data module** (hardcoded known-broken list + a pure predicate;
  no Node/network imports).
- The **only** Node dependency is markdown.js's DOMPurify/JSDOM wiring. Make it env-aware:
  browser → `createDOMPurify(window)`; Node → `createDOMPurify(new JSDOM('').window)`.
  `markdown-it` + all plugins (anchor, footnote, link-attributes, multimd-table,
  implicit-figures, attrs) are browser-safe.
- **Lock it:** a parity test mirroring `contentSanitizer.parity.test.ts` — assert the
  browser-path `renderToHtml` output equals the Node-path output on realistic CMS fixtures.

## 6. Per-type renderers (all detected types)

One pure `renderXDetail(shaped): string` per type: meetings · news posts (`/news/`, `/news/press/`)
· events · researchhub articles/datasets/apps · grants/funding.

**Build pages stay untouched** (their Astro components + `astro:assets` keep the pixel-perfect
built output — zero risk to production-approved pages). Each client renderer is a **twin** of its
Astro component, and parity is **locked by an Astro Container API test**: render the real
`[slug]` component and the twin for the same fixture, normalize the accepted image-markup
deviation (§4), assert equal. Drift fails CI.

> **Open choice for review:** twin-renderer + parity test (recommended; build untouched, safest
> for the pixel-perfect pages) **vs** a shared string renderer used by both build and client
> (DRY, but converts `MeetingCard.astro` et al. to string templates → touches production pages).

## 7. Verification (success criteria)

- Load the live failing URL on the branch deploy → the **meeting renders** (heading, date line,
  body, attachment link), `document.title` set — **not** the "being published" placeholder.
- Markdown isomorphism parity test green; per-type container parity tests green.
- A random unmatched path still shows the normal 404, and the markdown bundle is **not** loaded.
- Spot-check one image type (news post) → renders with the raw Strapi image.
- Listings (`/news/meetings/` etc.) confirmed to surface the new item via their existing island.

## 8. Phasing (within "all types at once")

1. **Foundation:** isomorphic `renderToHtml` + its parity test.
2. **Meetings vertical slice** end-to-end → proves the architecture on the live failing URL.
3. **Replicate** per type: grants (text) → news/events → researchhub (articles/datasets/apps).
4. **Section context-bar** injection + `document.title` for each type.
5. **Verify** on the branch deploy + append the lesson to the migration checklist.

## 9. Status & key finding (2026-06-05)

**Meetings slice: built and verified end-to-end.** Local static build served with a
Netlify-like 404 fallback, the June-9 meeting moved aside to simulate a post-build slug:
- The unbuilt slug renders the full meeting client-side (heading, date line, body,
  attachments table, "view all" link) with the correct `document.title` — **not** the
  "being published" placeholder.
- A random unmatched path still shows the normal 404, and the `detail-preview` chunk is
  **not** loaded (lazy-load confirmed).
- Build clean: 3528 pages, **no jsdom in the client bundle**, renderer split to a lazy chunk.
- Tests: 99/99 (isomorphic-markdown parity incl. footnotes/headings, MeetingCard
  Container-API parity, shaper drift-guard + correctness).

**Root-cause bug found (and fixed): the smart-404 detection had never run.** The original
404's inline detection + resolver were authored as `<script is:inline>{`…IIFE…`}</script>`.
`is:inline` emits content **verbatim**, so the `{`…`}` shipped as a literal block + template
*string* — the IIFE was never executed. That is why a published-but-unbuilt slug always hit
the hard 404. Fix: inline detection is now **raw** executing JS (no `{`…`}` wrapper; regex
un-double-escaped to `/\/$/`); the resolver is a bundled (non-inline) module script.
**Lesson:** an `is:inline` script's body must be the literal JS to run — never wrap it in a
`{`…`}` expression (use `set:html` for dynamic values, as the `nf-detect` JSON does).

**Known remaining gap:** the per-section **context bar** (navy breadcrumb + grey tabs) is not
yet rendered on the transient view (it uses Astro scoped CSS and renders nothing at build for
`/404`). Content renders fully styled; only that nav strip is absent until addressed.

# Outstanding — Astro cutover punch list

**Branch:** `feat/astro-researchhub-fixes` — static build + client-side Alpine **live-islands** (de-serverless model)
**Last updated:** 2026-06-24

**Status:** No hard engineering blockers. The researchhub bugs that forced the 6/2 rollback are fixed; the static build is green (**3,532 pages, ~4m35s, exit 0**), **242 unit tests pass**, the axe (WCAG AA, mobile) + Lighthouse sweep is clean (a11y/BP/SEO 100, mobile perf 96–100), and the client-side live layer has cleared **four red/blue security audits**. What remains is operational + hardening + polish + docs hygiene.

> Note: `main`'s `astro/` snapshot and `docs/CUTOVER.md` still describe the **older SSR** plan. The current architecture is static + live-islands; the accurate docs are `STATIC-ISLANDS-MIGRATION.md`, `LIVE-DETAIL-FALLBACK.md`, `nightly-rebuild.md`, and `astro-conversion-checklist-fable-v1.0.md`.

---

## 1 · Cutover — operational (owner / Netlify / Strapi)

- [ ] **Make this branch the source of truth** — merge to `main` or cut over directly from the branch (the branch `netlify.toml` is already configured: `base = "astro"`, `pnpm build`).
- [ ] **Flip Netlify production** build to base `astro/` (swap from the legacy Vue build).
- [ ] **Strapi rebuild webhooks on BOTH admins** (agency + researchhub) — entry **create / update / publish / unpublish / delete**, debounced. This is the live-freshness mechanism in the static model (see `docs/nightly-rebuild.md`). v3 fires `entry.update` (not `publish`) on edits to published entries — include it.
- [ ] **301 redirect audit** — diff legacy vs new sitemap; add a 301 for every legacy URL missing from the new sitemap.
- [ ] **48–72h deploy preview + full SiteImprove crawl** on the preview URL before the flip.
- [ ] **Stakeholder side-by-side sign-off** vs prod.
- [ ] **Post-cutover verification** — route/301 sweep, axe spot-check across templates, warm Lighthouse sweep.

## 2 · Security / hardening

- [ ] **CSP-1 (High): enforce the CSP.** Ships Report-Only today; switch to enforced from `astro/public/_headers` after adding a `report-to`/`report-uri` sink and confirming zero violations. *Accepted: `script-src` keeps `'unsafe-inline' 'unsafe-eval'` (Alpine); compensating control is server-side DOMPurify on all CMS content.*
- [ ] **Drop stale SSR-era `netlify.toml`** — the `functions =` line + the legacy `[[headers]]` block (`public/_headers` takes over post-cutover).
- [ ] **OBS-2 (Medium, backend): tighten the Strapi public-role policy.** A direct `…/meetings?_publicationState=preview` returns unpublished records (290 vs 288). The audited client can't reach it (`encodeURIComponent` slug, no `_publicationState`), but close it at cutover.
- [ ] **Confirm the markdown `<iframe>` host allowlist** (`src/lib/markdown.js`) covers every legitimate CMS embed; extend if one is blocked.
- [ ] **Rotate `.env` credentials** (SEC-1) — precautionary; gitignored/never committed, but read during audits.
- [ ] **Merge the 4 pending Astro dependabot bumps** — `astro 6.4.6`, `@astrojs/netlify 7.0.13`, `dompurify 3.4.9`, `markdown-it 14.2.0` (within-Astro-6 patch bumps).

## 3 · Polish / known gaps

- [ ] **Final pixel/VR eyeball** on `app` and `irb-meetings` (higher-% drift in the 5-viewport sweep).
- [ ] *(Optional)* **`heading-order`** — one news post whose CMS body starts at `<h3>`; authored content, not a defect. Add a content-pipeline demotion only if the team wants it gone.
- **Accepted by-design** (transient client-rendered detail for content added *after* a build, until the next rebuild — owner OK'd; the non-negotiable was immediate author visibility): no per-section context bar, some component-scoped styles, unit detail's related-staff list, and optimized images (raw Strapi/base64); the item's SEO/sitemap/search-index entry lands on the rebuild.

## 4 · Repo / docs hygiene

- [ ] **Refresh `docs/CUTOVER.md` + README "Security audit"** to the static + live-islands reality. The SSR-era items (purge-cache webhooks, scheduled-function gates FN-1/2/3, API-1 rate-limit, edge-cache warming) are **moot post-de-serverless** and will mislead anyone following them.

## 5 · Future (post-cutover)

- [ ] **Strapi 5 migration** — the rebuild webhooks live inside the Strapi admin, so a fresh v5 instance loses them (live updates silently stop). Re-add the webhooks per admin and verify the `MODEL_TAG` map vs v5's changed payload shape / content-type IDs.
- [ ] **Astro 7 upgrade** (Vite 8 → faster builds, which also means faster post-publish rebuilds). Fast-follow *after* cutover; gate on a full VR pass because of the JSX-whitespace breaking change.

---

## Pre-cutover sequence (tight path)

1. Reconcile branch + docs (this branch → source of truth; refresh `CUTOVER.md`).
2. Merge the 4 Astro dependabot bumps.
3. Final eyeball on `app` + `irb-meetings`.
4. Deploy preview 48–72h + SiteImprove crawl + 301 diff.
5. At flip: enforce CSP, wire rebuild webhooks on both admins, tighten Strapi draft policy, rotate `.env`.
6. Stakeholder sign-off → flip → post-cutover verification.

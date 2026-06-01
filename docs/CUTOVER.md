# Cutover Runbook — ICJIA Astro site → production

**What this is:** the ordered, owner-facing checklist to promote the Astro rebuild
(`feat/astro-migration`) to production at `icjia.illinois.gov`, replacing the legacy
Vue app. As of 2026-06-01 there are **no engineering blockers** — every item below is
an operational / Netlify-dashboard / Strapi-admin step.

**Rollback at any point:** revert the Netlify production build to the legacy Vue (swap
the base back), or reset to the tag **`legacy-pre-cutover`** (→ `main` pre-cutover). The
branch deploy is independent of production, so nothing here is one-way until step 1.

**Context:** SSR site on Netlify (base `astro/`), two Strapi v3 CMS backends, edge cache
via `Netlify-CDN-Cache-Control`. Security audit + fixes are recorded in `README.md` →
"Security audit". Quality gates (vitest + lint + `astro check`) run in CI on every PR.

---

## 0 · Pre-flight (before the flip)

- [ ] **Branch deploy is green** on Netlify (latest `feat/astro-migration` build succeeded).
- [ ] **CI is green** — `.github/workflows/ci.yml` (vitest + eslint + `astro check`).
- [ ] **Rotate the local `.env` credentials** (`NETLIFY_AUTH_TOKEN`, `MAILGUN_API_KEY`,
      `NETLIFY_BUILD_HOOK_URL`, `PURGE_SECRET`) — precaution (audit SEC-1; they were read
      during the audit). Update Netlify env + the Strapi webhook header to the new value.
- [ ] **Stakeholder side-by-side** review of the branch deploy vs prod (final sign-off).
- [ ] **SiteImprove crawl** of the branch deploy (accessibility/links rollup).
- [ ] Confirm the **`legacy-pre-cutover`** rollback tag exists and points at the live Vue commit.

## 1 · Promote the build (the flip — first irreversible step)

- [ ] In Netlify, point the **production** site's build at **base `astro/`** (swap from the
      legacy Vue build). [B1]
- The **edge function** (`netlify/edge-functions/trailing-slash.ts`) and **scheduled
      functions** (keep-warm, nightly-rebuild) deploy automatically once `astro/` is the
      production build — no separate step, but verify in §6.

## 2 · Production environment variables (Netlify → Site config → Env)

> Netlify env vars can be scoped per context (prod / branch-deploy / preview) — set these in **production**.

- [ ] `PURGE_SECRET` present in the **production** context (must match the Strapi webhook header in §4).
- [ ] `NETLIFY_BUILD_HOOK_URL` → the **main/prod** build hook (used by nightly-rebuild + static-purge).
- [ ] `KEEP_WARM_DISABLED=0` and `NIGHTLY_REBUILD_DISABLED=0` (enable the scheduled functions in prod).
- [ ] *(optional)* `PURGE_TRIGGER_BUILD=1` — also rebuild on STATIC-section edits (page/publication/unit).

## 3 · CSP — promote to enforced (audit CSP-1)

- [ ] Remove the **legacy root `netlify.toml [[headers]]`** block so `astro/public/_headers` takes over.
- [ ] In `astro/public/_headers`, change **`Content-Security-Policy-Report-Only` → `Content-Security-Policy`**.
- [ ] Add a `report-to`/`report-uri` sink **first**, and confirm **zero violations** in report-only before enforcing.
- [ ] Verify the proxied sub-apps (`/adultredeploy/`, `/ifvcc/`, `/arrestexplorer/`, …) still work under the
      enforced policy (CSP intersection — sub-apps should carry their own headers).
- Note: `script-src` keeps `'unsafe-inline' 'unsafe-eval'` (required by Alpine; accepted risk — compensating
  control is server-side DOMPurify on all CMS content; see README "Security audit" CSP-2).

## 4 · Strapi purge-on-publish webhooks (BOTH admins)

> Wire these only **after** step 1 — the prod URL resolves to the Astro function only once `astro/` is live.

- [ ] **agency.icjia-api.cloud** → Settings → Webhooks → Create:
  - URL: `https://icjia.illinois.gov/.netlify/functions/purge-cache`
  - Header: `x-icjia-purge-secret: <PURGE_SECRET>`  *(header only — the `?secret=` query param was removed)*
  - Events: Entry **create / update / delete / publish / unpublish**
- [ ] **researchhub.icjia-api.cloud** → same URL + header + events.
- [ ] Smoke test: edit a record → save/publish → reload the live page → the change appears within the route's TTL.

## 5 · Platform rate-limit on `/api/*` (audit API-1)

- [ ] Configure **Netlify rate-limiting** on `/api/*` (dashboard / edge feature). The SSR `?slug=` endpoints
      are publicly enumerable; the code already caps malformed-slug abuse + caches negatives, but a platform
      rate-limit closes the valid-slug-enumeration cost vector. (All data is public records — cost/availability only.)

## 6 · Post-cutover verification

- [ ] `curl -sI https://icjia.illinois.gov/news` → **301** to `/news/` (trailing-slash edge fn); repeat for
      `/grants/funding`, `/researchhub`, `/events`, `/irb`.
- [ ] Proxied sub-apps resolve **200**: `/adultredeploy/`, `/ifvcc/`, `/arrestexplorer/`, `/mhcontinuum/`, `/sudcontinuum/`.
- [ ] Edge cache live: `curl -sD- https://icjia.illinois.gov/ | grep -i cache-status` → **`hit`** (not `fwd=bypass`).
- [ ] Scheduled functions registered (Netlify API `function_schedules[]`); keep-warm + nightly-rebuild firing.
- [ ] **Warm the Durable cache** (hit each key route 2–3×, or `pnpm warm`) **AFTER the final deploy**, *then*
      run the warm Lighthouse sweep — a new deploy clears the Durable cache, so warming first is required for a
      representative perf score (target: a11y/BP/SEO 100, perf 95–100 warm).
- [ ] `pnpm health:full` (route/301 sweep) + sitemap reconcile + an axe spot-check across templates.

---

## Security follow-ups (from the red-team audit — see `README.md` → "Security audit")

- [x] Critical/High stored-XSS — **fixed** (`0.42.26`).
- [x] A-list hardening (purge-cache constant-time + header-only, scheduled-fn gates, iframe allowlist, slug guard) — **fixed** (`0.42.27`).
- [ ] **Confirm the markdown `<iframe>` allowlist** (`src/lib/markdown.js`) covers every legitimate CMS embed;
      extend the host list if a real embed is blocked.
- [ ] Platform rate-limit (§5) and `.env` rotation (§0) — owner steps above.

## Future: Strapi 5 backend migration

The purge webhook config lives **inside** the Strapi admin, so a fresh Strapi 5 instance loses it → live
updates silently stop. On that migration: re-add the webhook in each new admin (§4), and verify the `MODEL_TAG`
map in `netlify/functions/purge-cache.mjs` still matches Strapi 5's webhook payload (v5 changed the payload
shape + content-type IDs vs v3). Full notes in `docs/astro-conversion-checklist-v7.1.md`.

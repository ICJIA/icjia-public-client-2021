# Rebuilds (functionless) — nightly cron + Strapi content webhook

The site is a **fully static build** (de-serverless — see `docs/STATIC-ISLANDS-MIGRATION.md`).
**Listing** surfaces are live without a rebuild (the client-side Alpine live-islands
probe + swap from Strapi in the browser), and the meetings table's row-expand detects a
post-build edit (`updatedAt` gate) and fetches the live record. But the **built detail
pages themselves** render what the last build baked — so a rebuild is needed to mint
**new pages** (new Strapi slugs), to refresh **edited** detail pages, and to refresh
build-time artifacts (hub images, search index, sitemap, RSS).

Both rebuild triggers are **functionless** — they POST a Netlify **build hook** (a URL that
enqueues one build). Neither runs a Netlify function:

| Trigger | Mechanism | Latency |
|---|---|---|
| **Content published / edited / deleted** | Strapi webhook → build hook (direct POST) | minutes |
| **Nightly safety net** | GitHub Actions cron → build hook | next run |

A build hook can only *enqueue* a build — no fan-out/loop risk. The hook URL is the
credential, so it lives in a secret/env var, never in code.

**During the publish → build window: the smart 404.** A new slug is live in Strapi the
moment it's published, but its static page doesn't exist until the triggered build finishes
(the "minutes" above). To avoid a dead end in that gap, `src/pages/404.astro` is
**slug-aware**: for a known content-detail path (`/news/<slug>/`, `/news/meetings/<slug>/`,
`/researchhub/{articles,datasets,apps}/<slug>/`, `/events/<slug>/`, `/grants/funding/<slug>/`)
it REST-checks Strapi in the browser (hosts from `src/lib/live/sources.ts`) and, if the record
exists, shows a **"this page is being published"** message with a *Try again* button instead of
a hard 404. No matching record → the normal 404. It's purely client-side (this page is still
prerendered at `/404`, served by Netlify for any miss — no function per hit), and it's the
complement to the rebuild triggers below: the build mints the real page within minutes; the
smart 404 keeps the link from looking broken in the meantime.

## 1. Create the build hook (one-time)

Netlify → Site configuration → Build & deploy → **Build hooks** → *Add build hook*
(branch `main` after cutover). Copy the URL — both triggers below use this same URL.

## 2. Strapi content webhook (new pages AND edits land within minutes)

⚠️ **Configure on BOTH Strapi admins** — `agency.icjia-api.cloud` *and*
`researchhub.icjia-api.cloud` (hub articles/datasets/apps publish from the second
instance; without its webhook, new hub content only appears on the nightly rebuild).

Each Strapi admin → Settings → **Webhooks** → *Create new webhook*:
- **URL** = the build hook from step 1 (same URL on both admins).
- **Events** = entry **publish / unpublish / update / delete** (+ media events if new
  uploads must trigger a build). Strapi POSTs the hook → Netlify enqueues one build.
  - **update/delete matter:** in Strapi v3, editing an already-published entry fires
    `entry.update` (NOT publish) — with publish-only events, an edited meeting agenda
    or corrected date stays stale on its built detail page (and the static home
    snapshot) until the nightly rebuild. With update/delete subscribed, everything
    converges in minutes.
- **Debounce** in the Strapi webhook config (5–10 min if available) so an authoring
  session's save-burst coalesces into one build instead of one build per save.
  Netlify also queues builds serially per site, so bursts degrade gracefully.

This replaces the old SSR purge-on-publish webhook (`netlify/functions/purge-cache.mjs`, removed)
— there is no edge cache to purge anymore; a publish simply rebuilds.

## 3. Nightly cron (safety net)

`.github/workflows/nightly-rebuild.yml` runs on **GitHub's CI minutes** (not the Netlify
function meter) and POSTs the same build hook nightly at **~midnight US Central**
(cron `0 5 * * *` UTC). This replaces the deleted Netlify scheduled function
(`netlify/functions/nightly-rebuild.mjs`).

Add the hook URL as a repo secret: GitHub → Settings → Secrets and variables → Actions →
`NETLIFY_BUILD_HOOK_URL` = the URL from step 1. (Without the secret the job no-ops.)

## Controls

- **Change the nightly time:** edit `cron` in `.github/workflows/nightly-rebuild.yml`.
- **Kill switch (nightly):** disable the workflow in the GitHub Actions UI, or remove the
  `NETLIFY_BUILD_HOOK_URL` secret (job no-ops).
- **Trigger a rebuild manually:** Actions tab → *Nightly rebuild* → *Run workflow*; or
  `curl -X POST <hook>`; or Netlify UI → Deploys → *Trigger deploy*.

## Cost

~30 cron builds/month + one per publish. Netlify Pro includes generous build minutes; each
build is a few minutes → trivial. Crucially: **zero Netlify function invocations.**

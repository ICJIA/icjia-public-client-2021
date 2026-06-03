# Rebuilds (functionless) — nightly cron + Strapi publish webhook

The site is a **fully static build** (de-serverless — see `docs/STATIC-ISLANDS-MIGRATION.md`).
Existing-page **edits** are already live without a rebuild (the client-side Alpine
live-islands poll Strapi in the browser). A **rebuild** is only needed to mint **new pages**
(new Strapi slugs) and to refresh build-time artifacts (hub images, search index, sitemap, RSS).

Both rebuild triggers are **functionless** — they POST a Netlify **build hook** (a URL that
enqueues one build). Neither runs a Netlify function:

| Trigger | Mechanism | Latency |
|---|---|---|
| **New content published** | Strapi webhook → build hook (direct POST) | minutes |
| **Nightly safety net** | GitHub Actions cron → build hook | next run |

A build hook can only *enqueue* a build — no fan-out/loop risk. The hook URL is the
credential, so it lives in a secret/env var, never in code.

## 1. Create the build hook (one-time)

Netlify → Site configuration → Build & deploy → **Build hooks** → *Add build hook*
(branch `main` after cutover). Copy the URL — both triggers below use this same URL.

## 2. Strapi publish webhook (new pages appear within minutes)

Strapi admin → Settings → **Webhooks** → *Create new webhook*:
- **URL** = the build hook from step 1.
- **Events** = entry **publish** / **unpublish** (add media events if new uploads must trigger
  a build). Strapi POSTs the hook on publish → Netlify enqueues one build.
- Debounce in the Strapi webhook config if publishes cluster, to coalesce a burst into one build.

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

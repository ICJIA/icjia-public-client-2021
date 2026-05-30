# Nightly full rebuild

A Netlify **scheduled function** (`astro/netlify/functions/nightly-rebuild.mjs`) triggers a
full site build every night at **~midnight US Central** (cron `0 5 * * *` UTC), so the
build-time artifacts refresh daily **without a code push**:

- **Hub images** re-extracted (`scripts/generate-hub-images.mjs`) — articles/apps published
  that day get their `splash`/`thumbnail`/`image` files written to `public/hub-images/`
  (until then they ride the live base64 fallback).
- **Search index + sitemap + RSS** regenerated (as those generators are wired into
  `prebuild`) so search engines pick up the day's new/changed content.

## How it works

The function POSTs a **Netlify build hook** (a URL that enqueues one build). The hook URL is
the credential, so it lives in an env var, never in code. A build hook can only enqueue a
build — no fan-out/loop risk — but the function still no-ops without the hook, honors a kill
switch, and 403s any non-scheduled HTTP invocation.

## Setup (one-time)

1. **Create the build hook:** Netlify → Site configuration → Build & deploy → **Build hooks**
   → *Add build hook* (name it e.g. "nightly", branch `feat/astro-migration` for now, `main`
   after cutover). Copy the URL.
2. **Add the env var:** Netlify → Site configuration → Environment variables →
   `NETLIFY_BUILD_HOOK_URL` = the hook URL from step 1.
3. Deploy. The scheduled function appears under Functions; it fires nightly.

## Controls

- **Change the time:** edit `CRON` in `nightly-rebuild.mjs` (it's a literal — Netlify's
  bundler static-parses it, same as keep-warm).
- **Kill switch:** env `NIGHTLY_REBUILD_DISABLED=1` (Netlify UI, no redeploy), or disable the
  scheduled function in the Netlify UI (instant).
- **Trigger a rebuild manually anytime:** POST the build hook URL (`curl -X POST <hook>`), or
  Netlify UI → Deploys → Trigger deploy.

## Cost

~30 builds/month. Pro includes 25,000 build minutes; each build is a few minutes → trivial.

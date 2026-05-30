# Hosting decision memo — Netlify vs. DigitalOcean (ICJIA Astro SSR)

**Status:** decision support, not a commitment. Decide at/near cutover.
**Date:** 2026-05-30 · **Author:** migration notes
**TL;DR:** Both work. **Netlify = zero-ops, cold-start risk (mitigated).** **DigitalOcean
droplet = no cold starts + flat cost, but you own the ops.** The app is kept
**adapter-agnostic**, so moving is a config change, not a rewrite — so this is reversible
and does not need to block the migration.

---

## 1. Why this is even a question

The site has always been on Netlify "because that's how it's been done" — there is no
hard requirement. The Astro app runs **SSR on-demand** (live Strapi data per request),
which on Netlify means a **serverless function** per uncached request → the cold-start
problem we've been mitigating (loading overlay, nav progress bar, Durable Cache,
keep-warm ping). A persistent server (droplet) has **no cold starts at all**, which is why
it's worth comparing.

## 2. The core architectural difference

| | **Netlify (current)** | **DigitalOcean droplet** |
|---|---|---|
| Runtime | Serverless function (`@astrojs/netlify`), spun up per uncached request | Persistent Node process (`@astrojs/node`), always running |
| Cold starts | Yes (~1s) — mitigated, not eliminated | **None** — process is always warm |
| Edge cache | **Built in** (CDN + Durable Cache, ~150ms warm hits, global) | **You add it** (Cloudflare in front, or nginx microcache) |
| TLS / certs | Automatic | You manage (Caddy/Certbot auto-renew) |
| Deploys | `git push` → build → atomic deploy + instant rollback | You build the pipeline (CI → build → reload, zero-downtime via pm2/systemd) |
| Scaling | Automatic | Manual (resize droplet / add nodes + LB) |
| OS patching | None (managed) | **Yours** (security updates, kernel, Node upgrades) |
| Cost model | Metered (free tier generous; overages possible) | **Flat** (~$6–12/mo droplet, predictable) |
| Ops burden | ~Zero | Real, ongoing |

## 3. What a droplet *fixes outright*

- **Cold starts disappear.** The #1 perceived-speed issue is gone by construction.
- **The entire keep-warm apparatus becomes unnecessary** — delete `keep-warm.mjs` +
  config + its Blobs guard + the cron. No ping, no invocation cost, no audit surface.
- **Flat, predictable cost.** No "did we blow the function quota this month" anxiety —
  which is the same anxiety motivating the usage-monitor request (see the companion
  monitor). On a droplet that monitor is mostly moot.
- **No per-invocation metering** to reason about under traffic spikes.

## 4. What a droplet *costs you* (the honest other side)

- **You become the ops team.** OS + Node patching, process supervision (pm2/systemd),
  log rotation, restart-on-crash, monitoring/uptime alerts.
- **You must rebuild the edge.** Today the majority of hits never invoke the function —
  they serve from Netlify's edge cache. **A single droplet serves every request itself**
  unless you put a CDN in front. To match today's performance you'd run **Cloudflare
  (free tier)** ahead of the droplet, replicating the `s-maxage` / stale-while-revalidate
  behavior our `cache.ts` already emits (the `Netlify-CDN-Cache-Control` header would be
  swapped for standard `Cache-Control` that Cloudflare honors). Without a CDN, a cold
  droplet under a traffic spike is *more* fragile than Netlify, not less.
- **You build zero-downtime deploys.** Netlify gives atomic deploys + one-click rollback
  for free. On a droplet that's a script (build to a new dir, symlink swap, reload pm2) —
  doable, but yours to get right.
- **Single point of failure** unless you run ≥2 droplets + a load balancer (then cost and
  ops both rise).

## 5. Cost reality at this traffic (~40K pageviews/mo)

From the migration plan's traffic pull: ~40.6K pageviews/30d, peak ~47K/mo, ~1,300/day.

- **Netlify Pro:** function usage included is generous (125K invocations / 100 compute-hrs);
  with the Durable Cache most requests never invoke the function, so real usage is a few
  thousand invocations/mo + the bounded keep-warm. **Comfortably inside the plan** — the
  dollar risk is overage only if cache hit-rate collapses or traffic 10×s.
- **DigitalOcean:** a $6–12/mo basic droplet handles this traffic with headroom; +$0 for
  Cloudflare free. **Flat ~$6–12/mo.**
- **Verdict on cost:** at this scale the dollar difference is **noise** (tens of dollars/yr
  either way). Cost is **not** the deciding factor — **ops model is.**

## 6. Portability (why this is low-risk either way)

The migration deliberately keeps `src/lib` (data layer) and all pages **adapter-agnostic**:
- `astro.config.ts` already swaps adapter by context: `@astrojs/node` (dev) vs
  `@astrojs/netlify` (deploy). A DO move flips that to `node` for production too.
- The only Netlify-specific code is: the adapter line, `cache.ts`'s `Netlify-CDN-Cache-Control`
  header (swap for `Cache-Control` honored by Cloudflare), the keep-warm function (delete),
  and `netlify.toml` (replace with a droplet deploy script + Cloudflare cache rules).
- **Estimate:** ~½–1 day to stand up a droplet + Cloudflare + deploy pipeline; the app code
  itself barely changes.

## 7. Recommendation

- **Stay on Netlify through cutover.** Zero-ops keeps the migration focused; the cold-start
  mitigations we shipped (Durable Cache warm hits ~150ms + hardened keep-warm + nav bar)
  cover the real cases, and the usage monitor will catch any cost drift.
- **Move to a DO droplet (behind Cloudflare) IF** any of these become true post-launch:
  1. Cold starts remain a visible UX complaint despite keep-warm, **or**
  2. Netlify function/bandwidth **overages** show up on the bill, **or**
  3. You want flat, predictable cost and are comfortable owning OS/process/TLS/CDN ops.
- **Don't decide now.** Everything stays portable; the keep-warm work is one-line-disposable
  if you move. Re-evaluate with real post-launch traffic + billing data.

## 8. If you do move — the concrete checklist

1. `astro.config.ts`: production adapter → `@astrojs/node` (`mode: 'standalone'`).
2. `cache.ts`: emit standard `Cache-Control: public, s-maxage=…, stale-while-revalidate=…`
   (Cloudflare honors it); drop the `Netlify-CDN-Cache-Control` line.
3. Droplet: Node 22 + the built server under **pm2** (or systemd) with restart-on-crash.
4. **Cloudflare** in front: proxy on, cache-everything rule respecting origin `Cache-Control`,
   so you keep edge-fast cached hits (this replaces Netlify's Durable Cache).
5. TLS: Cloudflare (or Caddy on the droplet) with auto-renew.
6. Deploys: CI builds, rsyncs to a release dir, reloads pm2 (zero-downtime).
7. Delete: `netlify.toml`, `netlify/functions/keep-warm.mjs` + config (cold starts gone),
   the keep-warm audit test.
8. Uptime monitoring (the one thing Netlify gave implicitly): UptimeRobot/Better Stack ping.

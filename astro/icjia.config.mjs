// ─────────────────────────────────────────────────────────────────────────────
// icjia.config.mjs — single source of truth for the Astro app's tunables.
//
// Plain .mjs (NOT .ts) on purpose: this is imported by THREE different runtimes
//   1. the Astro app (TS) — src/lib/cache.ts
//   2. the raw Netlify function — netlify/functions/keep-warm.mjs (runs
//      UNCOMPILED, so it can't import .ts)
//   3. (read for reference by ops scripts)
// JSDoc gives editor types without a compile step. Lives inside astro/ (the
// deployed base dir) so Netlify's function bundler includes it — a repo-root file
// would be ABOVE base="astro" and may not bundle.
//
// ⚠️ ONE thing is NOT here and cannot be: the keep-warm CRON schedule. Netlify's
// function bundler STATICALLY parses the schedule() call, so the cron must be a
// string literal inside keep-warm.mjs (an imported value fails the build). Edit
// the cadence there; everything else lives here.
// ─────────────────────────────────────────────────────────────────────────────

/** Site-wide constants. */
export const site = {
  /** Canonical production origin (used for <link rel=canonical>, JSON-LD, keep-warm fallback). */
  origin: "https://icjia.illinois.gov",
  /** Strapi (agency) GraphQL host — relative /uploads/ URLs resolve against this. */
  strapiHost: "https://agency.icjia-api.cloud",
  /** ResearchHub (2nd Strapi) GraphQL host. */
  hubHost: "https://researchhub.icjia-api.cloud",
};

/**
 * Keep-warm cold-start pings.
 * KILL SWITCH: set `enabled: false`, commit → ~1 min auto-deploy stops the pings.
 *   (Faster options: env var KEEP_WARM_DISABLED=1 in the Netlify UI = no commit;
 *    or disable the scheduled function in the Netlify UI = instant, no deploy.)
 * Routes (Plausible entry data, 30d): home (top entry by far, ~2.6K) + the
 * /researchhub/* family dominate entries; we ALSO warm the live list/landing
 * pages editors and grant-seekers hit — /news/, /news/meetings/, /grants/funding/.
 * DETAIL pages (individual articles/news/meetings/NOFOs) are intentionally left
 * COLD — a one-time ~1s render is fine ("folks can wait"). All SSR routes share
 * ONE function, so warmth needs frequency (the CRON in keep-warm.mjs), not breadth.
 */
export const keepWarm = {
  enabled: true,
  routes: [
    "/", // homepage — top entry by far (~2.6K entry visitors/30d)
    "/researchhub/", // hub landing — the /researchhub/* family dominates entries
    "/researchhub/articles/",
    "/researchhub/datasets/",
    "/researchhub/apps/",
    "/researchhub/hub-overview/",
    "/news/", // COMMs-facing news list — warmed so editors never hit a cold render post-publish (workflow-critical; raw entry traffic is modest ~81/30d)
    "/news/meetings/", // meetings list (the 25 most recent) — the section's one important page
    "/grants/funding/", // live NOFO landing — ~178 entry / 1.3K PV per 30d (outranks /news/)
  ],
};

/**
 * Canonical render-strategy manifest — the single source of truth for which
 * sections are LIVE (SSR, fresh per request) vs STATIC (prerendered at build,
 * refreshed by the nightly cron + manual build hook). This documents INTENT; the
 * actual switch is each route's `export const prerender` literal, which Astro
 * reads statically at build (it cannot be driven from this object at runtime).
 * Keep them in sync — a route's flag should match its section's bucket here.
 *
 * Rule of thumb: when in doubt, LIVE. A wrongly-static page serves stale content
 * (editors complain "the site is broken"); a wrongly-live page only costs a bit
 * of perf. Prerendering a section ALSO removes it from keep-warm entirely —
 * static files never cold-start, so the warm list only ever needs LIVE landings.
 *
 * STATUS — Phase A: only code routes are static (search shell + 404; robots/llms/
 * sitemap are generated static files in public/). Phase B wires the `static`
 * sections below to `prerender = true` + getStaticPaths.
 */
export const renderStrategy = {
  // SSR, live at view time (edge-cached; keep-warmed where high-traffic):
  live: [
    "/", // home
    "/news", // + /news/[slug] news items
    "/news/meetings", // + /news/meetings/[slug] meeting details
    "/researchhub", // entire hub — changes constantly
    "/events",
    "/grants/funding", // NOFOs — must be live
    "/search/[query]", // search results
  ],
  // Prerendered: stable content; a new/changed page appears on the NEXT build:
  static: [
    "/about", // about pages
    "/about/biographies", // staff / bios
    "/grants/training",
    "/grants/rules-regs-policies",
    "/forms", // grant-status + lap-request shells (no live data)
    "/units",
    "/search", // search shell (already static)
    "/404", // (already static)
  ],
};

/**
 * Per-content-type edge cache TTLs: [s-maxage, stale-while-revalidate] seconds.
 * Tuned by editorial cadence. Consumed by src/lib/cache.ts (setCache).
 */
export const cacheTTL = {
  // [s-maxage, stale-while-revalidate] seconds.
  // KEEP-WARM NOTE: for the warmed routes (home + the /researchhub/* family, kinds
  // `home` + `hub`), SWR is set FAR above the 5-min (300s) keep-warm ping interval
  // so the edge cache never fully expires between pings — each ping lands inside
  // the stale window, serves instantly, and triggers a background refresh. Keeping
  // s-maxage SMALL (60/120) means content is still fresh within ~1-2 min for the
  // revalidating request; SWR (not s-maxage) is what holds the warm copy. This is
  // why warmed routes get ~150ms TTFB while staying live-enough (≤5 min via pings).
  home: [60, 3600], // warmed — SWR ≫ 300s ping so it never goes cold
  news: [60, 1800], // warmed (/news/) — SWR bumped ≫ 300s ping (was 300 = the ping interval, too tight)
  meetings: [120, 1800], // warmed (/news/meetings/) — SWR ≫ 300s ping
  grants: [120, 1800], // warmed (/grants/funding/) — SWR ≫ 300s ping
  events: [120, 600],
  jobs: [300, 900],
  publications: [300, 1800],
  bios: [600, 3600],
  page: [600, 3600],
  hub: [120, 3600], // warmed (/researchhub/*) — SWR ≫ 300s ping
};

/**
 * Usage-monitor thresholds (% of quota). The monitor (scripts/, runs in GitHub
 * Actions) reads these from ENV (WARN_PCT/CRIT_PCT) since it's not part of the
 * deployed app; these are the documented defaults / single reference point.
 */
export const monitor = {
  warnPct: 70,
  critPct: 90,
};

export default { site, keepWarm, renderStrategy, cacheTTL, monitor };

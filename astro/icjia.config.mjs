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
 * Routes: the highest-entry SSR routes (Plausible: homepage ~21% + /researchhub/*
 * ~56% = ~77% of entries). All SSR routes share ONE function, so warmth needs
 * frequency (the CRON in keep-warm.mjs), not breadth.
 */
export const keepWarm = {
  enabled: true,
  routes: [
    "/", // homepage — ~21% of all entries
    "/researchhub/", // research hub landing (the /researchhub/* family ~56% of entries)
    "/researchhub/articles/",
    "/researchhub/datasets/",
    "/researchhub/apps/",
    "/researchhub/hub-overview/",
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
  news: [60, 300],
  meetings: [120, 600],
  grants: [120, 600],
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

export default { site, keepWarm, cacheTTL, monitor };

// Keep-warm configuration — EDIT HERE to change cadence or routes.
//
// Why these defaults: per Plausible (icjia.illinois.gov, 30d = 14.1K sessions),
// ResearchHub is the entry page for ~56% of sessions (7.9K) and the homepage for
// ~21% (3.0K) — together ~77% of all ENTRIES (where a visitor lands first), so
// they're the routes most likely to take a cold-start hit. All SSR routes share
// ONE Netlify function, so any single ping keeps the lambda warm; the extra
// routes just pre-populate each one's edge cache.
//
// COST NOTE: invocations/month ≈ cronFires × (1 + ROUTES.length).
//   */5 cron = ~8,640 fires/mo; with 6 routes ≈ ~60K invocations/mo worst case
//   (cache hits past TTL don't re-invoke the SSR fn, so real usage is lower).
//   Netlify Pro includes 125K — comfortable headroom. To cut cost: raise the
//   interval (e.g. "*/10 * * * *") or trim ROUTES.

// Cron schedule (UTC). Every 5 minutes. (Raise the interval to cut invocations.)
export const SCHEDULE = "*/5 * * * *";

/** Routes to keep warm. Use trailing-slash canonical forms (trailingSlash:'always'
 *  → a no-slash URL 301s at the edge; warm the form the SSR fn actually renders).
 *  Add "/about/employment/" here if you want the #4 entry page warmed too. */
export const ROUTES = [
  "/", // homepage — ~21% of all entries
  "/researchhub/", // research hub landing (the /researchhub/* family ~56% of entries)
  "/researchhub/articles/",
  "/researchhub/datasets/",
  "/researchhub/apps/",
  "/researchhub/hub-overview/",
];

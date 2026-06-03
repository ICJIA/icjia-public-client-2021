// ─────────────────────────────────────────────────────────────────────────────
// icjia.config.mjs — single source of truth for the Astro app's tunables.
//
// Plain .mjs (NOT .ts) on purpose: it is imported UNCOMPILED by ops scripts that
// can't consume .ts — e.g. scripts/generate-search-index.mjs reads `site`. JSDoc
// gives editor types without a compile step.
//
// HISTORY: this file also used to carry the live-data SSR render/cache tunables
// (renderStrategy, cacheTTL, keepWarm) consumed by src/lib/cache.ts and the
// netlify/functions/keep-warm.mjs cron. The site is now a fully static build with
// client-side Alpine live-islands (zero Netlify functions), so those blocks — and
// the function + cache module that read them — were removed. See
// docs/STATIC-ISLANDS-MIGRATION.md.
// ─────────────────────────────────────────────────────────────────────────────

/** Site-wide constants. */
export const site = {
  /** Canonical production origin (used for <link rel=canonical>, JSON-LD). */
  origin: "https://icjia.illinois.gov",
  /** Strapi (agency) GraphQL host — relative /uploads/ URLs resolve against this. */
  strapiHost: "https://agency.icjia-api.cloud",
  /** ResearchHub (2nd Strapi) GraphQL host. */
  hubHost: "https://researchhub.icjia-api.cloud",
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

export default { site, monitor };

/**
 * Pure formatting helpers for live-island news rows — client-safe.
 * CLIENT-SAFE: zero server-only imports (no data.ts, no node:*, no graphql,
 * no linkedom, no markdown, no astro:assets).
 *
 * These are relocations of the helpers originally in data.ts that the
 * NewsListing Alpine x-for rendering requires. data.ts re-exports all of
 * them so existing server-side callers are unaffected.
 */

// ── truncateWords ─────────────────────────────────────────────────────────────

/**
 * Legacy News.vue truncate(): first `max` words, append "..." when truncated.
 * Faithful port — splits on any whitespace run (matches the legacy split(/\s+/)).
 */
export function truncateWords(str?: string, max = 25): string {
  if (!str) return '';
  const arr = str.trim().split(/\s+/);
  const out = arr.slice(0, max).join(' ');
  return arr.length > max ? out + '...' : out;
}

// ── isNew ─────────────────────────────────────────────────────────────────────

const DAYS_TO_SHOW_NEW = 5;

/**
 * Within the "NEW!" window (days since published).
 * Uses Date.now() — client-safe; under SSR this is request time.
 */
export function isNew(iso?: string, days = DAYS_TO_SHOW_NEW): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return (Date.now() - then) / 86_400_000 <= days;
}

// ── formatNewsDate ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Exact port of the legacy `format` Vue filter: full month name + zero-padded
 * day + year ("May 05, 2026"). Reads UTC components to match prod regardless
 * of server timezone.
 */
export function formatNewsDate(d?: string): string {
  if (!d) return '';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '';
  const day = t.getUTCDate();
  const pad = day < 10 ? '0' + day : String(day);
  return `${MONTH_NAMES[t.getUTCMonth()]} ${pad}, ${t.getUTCFullYear()}`;
}

// ── newsCategoryLabel ─────────────────────────────────────────────────────────

const NEWS_LABELS: Record<string, string> = {
  news: 'News',
  pressRelease: 'Press Release',
  outreach: 'Community Outreach',
  mediaAdvisory: 'Media Advisory',
};

/**
 * News category → display label.
 * Defaults to "News" for unknown/missing categories.
 */
export function newsCategoryLabel(cat?: string): string {
  return (cat && NEWS_LABELS[cat]) || 'News';
}

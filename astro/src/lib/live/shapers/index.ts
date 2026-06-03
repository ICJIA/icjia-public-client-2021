/**
 * Shared pure helpers for live-island shapers.
 * CLIENT-SAFE: zero server-only imports (no node:*, no graphql client,
 * no linkedom, no markdown, no astro:assets).
 */

// ── Strapi image type ─────────────────────────────────────────────────────────

export interface StrapiImage {
  caption?: string;
  alternativeText?: string;
  url?: string;
  width?: number;
  height?: number;
  formats?: Record<string, unknown>;
}

// ── Month-grouping helpers ────────────────────────────────────────────────────

// Month-grouping for the /news/ list (legacy groups by This Month / Last Month
// / Earlier). Computed in America/Chicago so it matches the displayed dates.
// SSR NOTE: "now" is request time; under the frozen-clock VR run a record within
// ~1 day of a month boundary could bucket differently than prod (a VR-tune item).
function chicagoMonthIndex(d: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "numeric",
    }).formatToParts(d);
    const y = Number(parts.find((p) => p.type === "year")?.value);
    const m = Number(parts.find((p) => p.type === "month")?.value);
    if (!y || !m) return null;
    return y * 12 + (m - 1);
  } catch {
    return null;
  }
}

export type MonthBucket = "this" | "last" | "earlier";

export function monthBucket(iso?: string): MonthBucket {
  if (!iso) return "earlier";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "earlier";
  const a = chicagoMonthIndex(d);
  const now = chicagoMonthIndex(new Date());
  if (a == null || now == null) return "earlier";
  const diff = now - a;
  if (diff <= 0) return "this";
  if (diff === 1) return "last";
  return "earlier";
}

export const BUCKET_LABELS: Record<MonthBucket, string> = {
  this: "This Month",
  last: "Last Month",
  earlier: "Earlier",
};

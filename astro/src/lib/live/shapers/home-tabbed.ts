/**
 * Home tabbed widget (Funding / Meetings / Employment) ROW shaper — pure,
 * client-safe.
 *
 * Reproduces the exact fields HomeTabbed.astro's baked `.map` cards render, so the
 * live Alpine x-for layer can swap in fresh Strapi rows CLIENT-SIDE (a post-build
 * funding NOFO / meeting / job appears on the home strip without a rebuild),
 * byte-identical to the eventual nightly-built card. Every field is PLAIN TEXT
 * (x-text on the home cards — none bind x-html), so NO markdown renderer is needed
 * here (unlike the funding/employment LIST rows, whose summaries render via x-html).
 *
 * CLIENT-SAFE: zero server-only imports. Reuses the already drift-guarded
 * fundingCategoryLabel + isExpired (grant shaper), formatNewsDate + isNew
 * (format.ts), and a local formatDate/formatDateShort port (Chicago Intl, matching
 * data.ts formatDate/formatDateShort which HomeTabbed.astro uses for the SSR cards).
 *
 * SORT/LIMIT parity with data.ts getHome (so live order == baked order):
 *   funding   → re-sorted end:desc, capped 5  (GET_HOME fundingLimit 5)
 *   meetings  → query end:desc, capped 5       (GET_HOME meetingLimit 5)
 *   employment→ re-sorted end:desc, capped 3   (GET_HOME employmentLimit 3)
 */
import { fundingCategoryLabel, isExpired } from "./grant";
import { isNew } from "./format";

// ── pure formatters (data.ts formatDate / formatDateShort — Chicago Intl) ──────
// HomeTabbed.astro's SSR cards call data.ts formatDate (long month) for meetings +
// employment, and formatDateShort (short month) for the funding date range. Ported
// here verbatim so the live rows match the baked cards exactly.

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatDateShort(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

// ── Funding rows ──────────────────────────────────────────────────────────────

/** Every field the home Funding card renders (all x-text). `end` raw ISO carried
 *  only so the live swap can re-sort end:desc (REST returns insertion order). */
export interface HomeFundingRow {
  id: string;
  end?: string;
  p: string;
  /** fundingCategoryLabel(category) — bold lead. */
  cl: string;
  expired: boolean;
  /** "{short start} to {short end}" — shown when not expired. */
  range: string;
  t: string;
  s: string;
}
export function shapeHomeFundingRow(g: any): HomeFundingRow {
  return {
    id: String(g.id),
    end: g.end,
    p: `/grants/funding/${g.slug}/`,
    cl: fundingCategoryLabel(g.category),
    expired: isExpired(g.end),
    range: `${formatDateShort(g.start)} to ${formatDateShort(g.end)}`,
    t: g.title,
    s: g.summary ?? "",
  };
}

// ── Meeting rows ──────────────────────────────────────────────────────────────

/** Every field the home Meetings card renders (all x-text). */
export interface HomeMeetingRow {
  id: string;
  end?: string;
  p: string;
  /** "{long start}" date. */
  d: string;
  cancelled: boolean;
  t: string;
  s: string;
}
export function shapeHomeMeetingRow(m: any): HomeMeetingRow {
  return {
    id: String(m.id),
    end: m.end,
    p: `/news/meetings/${m.slug}/`,
    d: formatDate(m.start),
    cancelled: !!m.isCancelled,
    t: m.title,
    s: m.summary ?? "",
  };
}

// ── Employment rows ───────────────────────────────────────────────────────────

/** Every field the home Employment card renders (all x-text). */
export interface HomeEmploymentRow {
  id: string;
  end?: string;
  p: string;
  expired: boolean;
  /** "{long end}" — the "Accepting applications through …" date (when not expired). */
  acceptEnd: string;
  isNew: boolean;
  t: string;
  s: string;
}
export function shapeHomeEmploymentRow(j: any): HomeEmploymentRow {
  return {
    id: String(j.id),
    end: j.end,
    p: `/about/employment/${j.slug}/`,
    expired: isExpired(j.end),
    acceptEnd: formatDate(j.end),
    // Home card flags NEW! at 7 days off published_at (HomeTabbed.astro isNew(_, 7)).
    isNew: isNew(j.published_at, 7),
    t: j.title,
    s: j.summary ?? "",
  };
}

// ── assembly (sort/limit parity with data.ts getHome) ─────────────────────────

const byEndDesc = (a: { end?: string }, b: { end?: string }) =>
  String(b.end || "").localeCompare(String(a.end || ""));

export interface HomeTabbedData {
  grants: HomeFundingRow[];
  meetings: HomeMeetingRow[];
  employment: HomeEmploymentRow[];
}

/** Build the home-tabbed payload from the three raw Strapi record sets (each the
 *  full collection from fetchCollection): shape + sort end:desc + cap to getHome's
 *  per-tab limit. */
export function shapeHomeTabbed(
  grants: any[] | null,
  meetings: any[] | null,
  jobs: any[] | null,
): HomeTabbedData {
  const g = (Array.isArray(grants) ? grants : []).map(shapeHomeFundingRow);
  const m = (Array.isArray(meetings) ? meetings : []).map(shapeHomeMeetingRow);
  const j = (Array.isArray(jobs) ? jobs : []).map(shapeHomeEmploymentRow);
  g.sort(byEndDesc);
  m.sort(byEndDesc);
  j.sort(byEndDesc);
  return {
    grants: g.slice(0, 5),
    meetings: m.slice(0, 5),
    employment: j.slice(0, 3),
  };
}

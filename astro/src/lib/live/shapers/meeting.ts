/**
 * Meeting DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `shapeMeeting` so the live-detail fallback can
 * render a brand-new (post-build) meeting CLIENT-SIDE from the Strapi v3 REST
 * record, byte-identical to the eventual nightly-built page (see
 * docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record and the GraphQL
 * record carry the same fields meetings use (category, tags[].title, attachments[]
 * with url/name/ext/size/updated_at, events[]/posts[], external[], start/end/body),
 * so the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The pure formatters below are duplicated from data.ts and locked
 * to the originals by shapers/meeting.drift.test.ts — they cannot silently diverge.
 */
import { AGENCY } from "../sources";
import { safeUrl } from "../safe-url";

export interface MeetingAttachmentItem {
  name: string;
  url: string;
  ext: string;
  niceSize: string;
  updatedAlt: string;
}
export interface MeetingRelatedItem {
  displayTitle: string;
  fullPath: string;
}
export interface MeetingExternalItem {
  title: string;
  url: string;
}
export interface MeetingItem {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  isCancelled: boolean;
  category: string;
  catLabel: string;
  start?: string;
  end?: string;
  summary?: string;
  altDate: string;
  startMs: number;
  dateLine: string;
  bodyHtml: string;
  tags: string[];
  attachments: MeetingAttachmentItem[];
  attCount: number;
  external: MeetingExternalItem[];
  related: MeetingRelatedItem[];
  haystack: string;
}

// ── pure formatters (duplicated from data.ts; guarded by meeting.drift.test.ts) ──

const MEETING_LABELS: Record<string, string> = {
  board: "Authority Board",
  budget: "Budget Committee",
  irb: "Institutional Review Board",
  special: "Special",
};
/** Meeting category → label (legacy MeetingCard.displayCategory). */
export function meetingCategoryLabel(cat?: string): string {
  return (cat && MEETING_LABELS[cat]) || "Special";
}

// Chicago-local date/time parts (the legacy dayjs default tz is America/Chicago).
// formatToParts is DST-aware; we compose the exact legacy format strings.
function chicagoParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    weekday: g("weekday"),
    month: g("month"),
    day: g("day"),
    year: g("year"),
    hour: g("hour"),
    minute: g("minute"),
    dayPeriod: g("dayPeriod").toUpperCase().replace(/\./g, ""),
  };
}
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
/** Legacy `dateFormatAlt`: "MMM DD, YYYY" (Chicago) → "May 14, 2026". Date-only
 *  values are read literally (no tz shift); timestamped values use Chicago time. */
export function dateFormatAlt(iso?: string): string {
  if (!iso) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const mi = Number(m) - 1;
    return MONTH_ABBR[mi] ? `${MONTH_ABBR[mi]} ${d}, ${y}` : "";
  }
  const p = chicagoParts(iso);
  return p.month ? `${p.month} ${p.day}, ${p.year}` : "";
}

/** Legacy MeetingCard.displayDate(start, end): multi-day (> 1 day) → "MMM Do - MMM Do";
 *  same-day → "dddd MMM DD, YYYY, hh:mm A - hh:mm A". */
export function meetingDateLine(start?: string, end?: string): string {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  if (e && (e.getTime() - s.getTime()) / 86_400_000 > 1) {
    const a = chicagoParts(start);
    const b = chicagoParts(end as string);
    return `${a.month} ${ordinal(parseInt(a.day, 10))} - ${b.month} ${ordinal(parseInt(b.day, 10))}`;
  }
  const p = chicagoParts(start);
  const t = (iso: string) => {
    const q = chicagoParts(iso);
    return `${q.hour.padStart(2, "0")}:${q.minute} ${q.dayPeriod}`;
  };
  const startStr = `${p.weekday} ${p.month} ${p.day}, ${p.year}, ${t(start)}`;
  return end ? `${startStr} - ${t(end)}` : startStr;
}

// Faithful port of the legacy AttachmentList.niceBytes — replicated verbatim so
// sizes match production exactly (the VR gate would flag any "fix").
const NICE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export function niceBytes(x?: number): string {
  let l = 0;
  let n = typeof x === "number" ? x : parseInt(String(x ?? 0), 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + NICE_UNITS[l];
}

/** Resolve a Strapi image URL (relative /uploads/... → absolute). */
export function strapiUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : AGENCY + url;
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi meeting (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time shapeMeeting does: flatten tags, sort attachments by name asc,
 * build the related list from events+posts, pre-render the body. `render` is the
 * environment's markdown→HTML renderer (markdown.js at build / markdown.client.js
 * in the browser).
 */
export function shapeMeeting(m: any, render: (md: string) => string): MeetingItem {
  const cat = m.category ?? "";
  const catLabel = meetingCategoryLabel(cat);
  const tags = Array.isArray(m.tags) ? m.tags.map((t: any) => t.title) : [];
  const attachments: MeetingAttachmentItem[] = (
    Array.isArray(m.attachments) ? [...m.attachments] : []
  )
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .map((a: any) => ({
      name: a.name,
      url: strapiUrl(a.url) || a.url,
      ext: (a.ext || "").replace(/^\./, "").toLowerCase(),
      niceSize: niceBytes(a.size),
      updatedAlt: dateFormatAlt(a.updated_at),
    }));
  const related: MeetingRelatedItem[] = [];
  if (Array.isArray(m.events))
    m.events.forEach((e: any) =>
      related.push({ displayTitle: `[Event]: ${e.title}`, fullPath: `/events/${e.slug}/` }),
    );
  if (Array.isArray(m.posts))
    m.posts.forEach((e: any) =>
      related.push({ displayTitle: `[News]: ${e.title}`, fullPath: `/news/${e.slug}/` }),
    );
  related.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
  const external: MeetingExternalItem[] = Array.isArray(m.external)
    ? m.external
        .filter((e: any) => e && e.url)
        .map((e: any) => ({ title: e.title || e.url, url: safeUrl(e.url) }))
    : [];
  const altDate = dateFormatAlt(m.start);
  return {
    id: String(m.id),
    slug: m.slug,
    title: m.title,
    fullPath: `/news/meetings/${m.slug}/`,
    isCancelled: !!m.isCancelled,
    category: cat,
    catLabel,
    start: m.start,
    end: m.end,
    summary: m.summary,
    altDate,
    startMs: m.start ? new Date(m.start).getTime() : 0,
    dateLine: meetingDateLine(m.start, m.end),
    bodyHtml: !m.isCancelled && m.body ? render(m.body) : "",
    tags,
    attachments,
    attCount: attachments.length,
    external,
    related,
    haystack: [m.title, catLabel, altDate, m.isCancelled ? "cancelled" : ""]
      .join(" ")
      .toLowerCase(),
  };
}

// ── LIGHT list-row shape (live listings) ──────────────────────────────────────

/** The compact row MeetingTable.astro renders from #meetings-data — every field it
 *  reads (id, altDate, catLabel, title, isCancelled, attCount, startMs, dateLine,
 *  slug, fullPath, category, haystack), NONE of the heavy detail (body/tags/
 *  attachments load lazily on expand). Mirrors data.ts `shapeMeetingLight`. */
export interface MeetingRow {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  isCancelled: boolean;
  category: string;
  catLabel: string;
  altDate: string;
  startMs: number;
  dateLine: string;
  attCount: number;
  haystack: string;
}

/** Shape one raw Strapi v3 REST meeting → the compact MeetingRow the live listing
 *  swaps in (so a post-build meeting appears in the table without a rebuild). */
export function shapeMeetingRow(m: any): MeetingRow {
  const cat = m.category ?? "";
  const catLabel = meetingCategoryLabel(cat);
  const altDate = dateFormatAlt(m.start);
  return {
    id: String(m.id),
    slug: m.slug,
    title: m.title,
    fullPath: `/news/meetings/${m.slug}/`,
    isCancelled: !!m.isCancelled,
    category: cat,
    catLabel,
    altDate,
    startMs: m.start ? new Date(m.start).getTime() : 0,
    dateLine: meetingDateLine(m.start, m.end),
    attCount: Array.isArray(m.attachments) ? m.attachments.length : 0,
    haystack: [m.title, catLabel, altDate, m.isCancelled ? "cancelled" : ""]
      .join(" ")
      .toLowerCase(),
  };
}

// Server-side data layer — the single entry point Astro pages call.
//
// Each function fetches LIVE from Strapi per request (fetchPolicy "no-cache"),
// runs the body through the markdown + sanitize pipeline server-side, and
// returns plain data the .astro page renders. The full sanitized HTML lands in
// the SSR response (so SiteImprove/axe/Google see real content); freshness is
// governed by the per-route CDN cache (see cache.ts).
import "./server-dom"; // ensure global DOMParser (linkedom) is installed
// @ts-expect-error — gql-client.js is plain JS (ported verbatim)
import { runQuery, deepSanitize } from "./gql-client.js";
import { renderToHtml, renderInline, parseHeadings } from "./markdown.js";
import {
  GET_SINGLE_POST_QUERY,
  GET_ALL_NEWS_QUERY,
  GET_ALL_PRESS_QUERY,
} from "../graphql/news.js";
// @ts-expect-error — GET_HOME from plain-JS graphql module
import { GET_HOME } from "../graphql/home.js";
import {
  GET_ALL_MEETINGS_QUERY,
  GET_SINGLE_MEETING_QUERY,
} from "../graphql/meetings.js";
import {
  GET_ALL_FUNDING_QUERY,
  GET_SINGLE_FUNDING_QUERY,
  GET_ALL_PROGRAMS_QUERY,
  GET_SINGLE_PROGRAM_QUERY,
} from "../graphql/grants.js";
import { GET_SINGLE_PAGE_QUERY } from "../graphql/page.js";
import {
  GET_ALL_RULES_QUERY,
  GET_ALL_POLICIES_QUERY,
  GET_ALL_REGULATIONS_QUERY,
} from "../graphql/rules-regs-policies.js";
import {
  GET_ALL_JOBS_QUERY,
  GET_SINGLE_JOB_QUERY,
} from "../graphql/employment.js";
import { GET_EVENTS, GET_SINGLE_EVENT_QUERY } from "../graphql/events.js";
import { GET_SINGLE_PUBLICATION_QUERY } from "../graphql/publications.js";
import {
  GET_SINGLE_BIOGRAPHY_QUERY,
  GET_ALL_BIOGRAPHIES_QUERY,
  GET_BIOGRAPHIES_BY_UNIT_QUERY,
} from "../graphql/biographies.js";
import { GET_SINGLE_UNIT_QUERY } from "../graphql/units.js";

// Strapi (agency) host — splash URLs come back as /uploads/... relative paths.
const STRAPI_BASE = "https://agency.icjia-api.cloud";

// News category → display label (config.maps.news).
const NEWS_LABELS: Record<string, string> = {
  news: "News",
  pressRelease: "Press Release",
  outreach: "Community Outreach",
  mediaAdvisory: "Media Advisory",
};
export function newsCategoryLabel(cat?: string): string {
  return (cat && NEWS_LABELS[cat]) || "News";
}

// config.maps.news — order + labels for the /news/ category filter buttons.
export const NEWS_CATEGORIES: Array<{ category: string; label: string }> = [
  { category: "news", label: "News" },
  { category: "pressRelease", label: "Press Release" },
  { category: "outreach", label: "Community Outreach" },
  { category: "mediaAdvisory", label: "Media Advisory" },
];

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

// Legacy News.vue truncate(): first `max` words, append "..." when truncated.
export function truncateWords(str?: string, max = 25): string {
  if (!str) return "";
  const arr = str.trim().split(/\s+/);
  const out = arr.slice(0, max).join(" ");
  return arr.length > max ? out + "..." : out;
}

// Funding category → label (HomeTabbed.getCategory).
export function fundingCategoryLabel(cat?: string): string {
  if (cat === "nofo") return "Notice of Funding Opportunity";
  if (cat === "rfi") return "Request for Information";
  return "";
}

const DAYS_TO_SHOW_NEW = 5;

/** Within the "NEW!" window (days since published). */
export function isNew(iso?: string, days = DAYS_TO_SHOW_NEW): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  // FROZEN-CLOCK NOTE: under SSR this uses request time; VR freezes the clock.
  return (Date.now() - then) / 86_400_000 <= days;
}

/** Expired = now is past end-of-(end-date) (legacy adds one day to `end`). */
export function isExpired(end?: string): boolean {
  if (!end) return false;
  const exp = new Date(end);
  if (Number.isNaN(exp.getTime())) return false;
  exp.setDate(exp.getDate() + 1);
  return Date.now() > exp.getTime();
}

/** Short date (dateFormatAlt): "Jan 5, 2026", America/Chicago. */
export function formatDateShort(iso?: string): string {
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

export interface StrapiImage {
  caption?: string;
  alternativeText?: string;
  url?: string;
  width?: number;
  height?: number;
  formats?: Record<string, unknown>;
}

export interface StrapiImagePick {
  url: string;
  width: number;
  height: number;
}

/**
 * Pick the best Strapi image format for an optimized astro:assets <Image> —
 * returns an absolute url + intrinsic width/height so <Image> needn't fetch the
 * image to infer dimensions at request time. Prefers ~card-sized sources
 * (small ≈ 500px, medium ≈ 750px) over thumbnail/large, then the original.
 */
export function pickStrapiImage(splash?: StrapiImage | null): StrapiImagePick | null {
  if (!splash) return null;
  const f = (splash.formats || {}) as Record<
    string,
    { url?: string; width?: number; height?: number }
  >;
  for (const c of [f.small, f.medium, f.thumbnail, f.large]) {
    if (c?.url && c.width && c.height) {
      const u = strapiUrl(c.url);
      if (u) return { url: u, width: c.width, height: c.height };
    }
  }
  if (splash.url && splash.width && splash.height) {
    const u = strapiUrl(splash.url);
    if (u) return { url: u, width: splash.width, height: splash.height };
  }
  return null;
}

/**
 * Like pickStrapiImage but prefers LARGER formats — for full-width hero/splash
 * images (a card-sized `small`≈500px upscaled into a full column is flagged
 * low-res by Lighthouse's image-size-responsive). Prefers large (≈1000px) →
 * medium → original → small, so the optimizer downscales from a big-enough source.
 */
export function pickStrapiHero(splash?: StrapiImage | null): StrapiImagePick | null {
  if (!splash) return null;
  const f = (splash.formats || {}) as Record<
    string,
    { url?: string; width?: number; height?: number }
  >;
  for (const c of [f.large, f.medium]) {
    if (c?.url && c.width && c.height) {
      const u = strapiUrl(c.url);
      if (u) return { url: u, width: c.width, height: c.height };
    }
  }
  // original (often the biggest) before falling back to the small card format.
  if (splash.url && splash.width && splash.height) {
    const u = strapiUrl(splash.url);
    if (u) return { url: u, width: splash.width, height: splash.height };
  }
  const s = f.small;
  if (s?.url && s.width && s.height) {
    const u = strapiUrl(s.url);
    if (u) return { url: u, width: s.width, height: s.height };
  }
  return null;
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body?: string;
  /** markdown body rendered + XSS-sanitized + a11y-fixed, server-side. */
  safeBodyHtml: string;
  showTOC?: boolean;
  category?: string;
  /** newsCategoryLabel(category) — the uppercase kicker in the date/category header. */
  catLabel: string;
  published_at?: string;
  updated_at?: string;
  dateOverride?: string;
  /** dateOverride || published_at, formatted "May 05, 2026" (legacy `format`). */
  publicationDate: string;
  hideSplash?: boolean;
  splash?: StrapiImage | null;
  /** AttachmentList heading; "" when none set (legacy passed "" → default "Attachments"). */
  attachmentLabel: string;
  /** shaped like the grant/page attachment tables (absolute url, niceBytes, dateFormatAlt). */
  attachments: AttachmentItem[];
  /** "[Type]: title" related links (posts/meetings/grants/programs/events/biographies). */
  related: RelatedItem[];
  /** flattened tag titles → chips (legacy getUnifiedTags). */
  tags: string[];
  /** h2 anchors for the showTOC sidebar (legacy Toc). */
  toc: TocItem[];
}

/**
 * Fetch a single news post by slug, live, and render its body server-side.
 * Returns null when no post matches (page should 404).
 *
 * Shapes the related arrays, attachments, tags, and the on-page TOC the same way
 * the grant/page detail loaders do (buildRelated/shapeAttachments/buildToc), so
 * NewsSingle.vue's full layout — splash, date/category header, body, attachments,
 * related, tags, showTOC sidebar — renders server-side with no client fetch.
 */
export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  const { data } = await runQuery(GET_SINGLE_POST_QUERY, { slug }, "no-cache");
  const post = data?.posts?.[0];
  if (!post) return null;
  const safeBodyHtml = post.body ? renderToHtml(post.body) : "";
  // legacy getPublicationDate: dateOverride (when non-empty) else published_at.
  const publicationISO =
    post.dateOverride && post.dateOverride.length ? post.dateOverride : post.published_at;
  return {
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    body: post.body,
    safeBodyHtml,
    showTOC: post.showTOC,
    category: post.category,
    catLabel: newsCategoryLabel(post.category),
    published_at: post.published_at,
    updated_at: post.updated_at,
    dateOverride: post.dateOverride,
    publicationDate: formatNewsDate(publicationISO),
    hideSplash: post.hideSplash,
    splash: (post.splash as StrapiImage) || null,
    attachmentLabel: post.attachmentLabel || "",
    attachments: shapeAttachments(post.attachments),
    related: buildRelated(post),
    tags: Array.isArray(post.tags) ? post.tags.map((t: any) => t.title) : [],
    toc: buildToc(safeBodyHtml),
  };
}

export interface NewsListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  category?: string;
  published_at?: string;
  dateOverride?: string;
  /** dateOverride || published_at (legacy getPublicationDate). */
  publicationDate?: string;
  fullPath?: string;
  bucket?: MonthBucket;
  /** flattened tag titles (legacy getUnifiedTags). */
  tags?: string[];
  splash?: StrapiImage | null;
}

/**
 * Shape raw Strapi posts for a news listing the way News.vue does: flatten
 * tags to title strings, derive publicationDate (dateOverride || published_at)
 * + month bucket, set fullPath, sort newest-first.
 */
function shapeNewsList(posts: any[]): NewsListItem[] {
  return (posts ?? [])
    .map((e: any) => {
      const publicationDate =
        e.dateOverride && e.dateOverride.length ? e.dateOverride : e.published_at;
      return {
        ...e,
        tags: Array.isArray(e.tags) ? e.tags.map((t: any) => t.title) : [],
        publicationDate,
        fullPath: `/news/${e.slug}/`,
        bucket: monthBucket(publicationDate),
      } as NewsListItem;
    })
    .sort((a, b) =>
      String(b.publicationDate || "").localeCompare(String(a.publicationDate || "")),
    );
}

/** Fetch all news posts (newest first), live, for the /news/ listing. */
export async function getAllNews(): Promise<NewsListItem[]> {
  const { data } = await runQuery(GET_ALL_NEWS_QUERY, {}, "no-cache");
  return shapeNewsList(data?.posts ?? []);
}

/** Fetch press releases + media advisories (newest first), for /news/press/. */
export async function getAllPress(): Promise<NewsListItem[]> {
  const { data } = await runQuery(GET_ALL_PRESS_QUERY, {}, "no-cache");
  return shapeNewsList(data?.posts ?? []);
}

// ── Meetings (/news/meetings/) ────────────────────────────────────
// config.maps.meetings — category order + labels (+ schedule text shown above
// each table in the "By category" view). 'special' is the catch-all bucket.
export const MEETING_CATEGORIES: Array<{
  category: string;
  label: string;
  text?: string;
}> = [
  {
    category: "board",
    label: "Authority Board",
    text: "ICJIA Board meetings are held at the offices of ICJIA, 300 West Adams Street, 2nd Floor, Large Conference Room, Chicago, Illinois, 60606.",
  },
  {
    category: "budget",
    label: "Budget Committee",
    text: "Budget Committee meetings are held at the offices of ICJIA, 300 West Adams Street, 2nd Floor, Large Conference Room, Chicago, Illinois, 60606.",
  },
  {
    category: "irb",
    label: "Institutional Review Board",
    text: "IRB meetings are held at the offices of ICJIA, 300 West Adams Street, 2nd Floor, Large Conference Room, Chicago, Illinois, 60606.",
  },
  { category: "special", label: "Special" },
];
const MEETING_LABELS: Record<string, string> = Object.fromEntries(
  MEETING_CATEGORIES.map((c) => [c.category, c.label]),
);
/** Meeting category → label (legacy MeetingCard.displayCategory). */
export function meetingCategoryLabel(cat?: string): string {
  return (cat && MEETING_LABELS[cat]) || "Special";
}

/** slugify a heading the way the legacy `slug` pkg does (for TOC anchors). */
export function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Chicago-local date/time parts (the legacy dayjs default tz is America/Chicago,
// so all meeting dates/times render in Chicago time). formatToParts is DST-aware
// and lets us compose the exact legacy format strings with our own padding.
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
/** Legacy `dateFormatAlt` filter: dayjs "MMM DD, YYYY" (Chicago) → "May 14, 2026".
 *  Date-only values ("YYYY-MM-DD", e.g. a publication's publicationDate) have no
 *  time/zone, so converting them through a Chicago tz shift moves them a day
 *  earlier (midnight-UTC → previous-evening Chicago). For those, read the literal
 *  calendar parts (no shift); only timestamped values get the Chicago conversion. */
export function dateFormatAlt(iso?: string): string {
  if (!iso) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const mi = Number(m) - 1;
    // dayjs "MMM DD, YYYY" → zero-padded day, matching the timestamped branch.
    return MONTH_ABBR[mi] ? `${MONTH_ABBR[mi]} ${d}, ${y}` : "";
  }
  const p = chicagoParts(iso);
  return p.month ? `${p.month} ${p.day}, ${p.year}` : "";
}

/**
 * Legacy MeetingCard.displayDate(start, end): a multi-day meeting (> 1 day)
 * renders "MMM Do - MMM Do" ("May 14th - May 16th"); a same-day meeting renders
 * "dddd MMM DD, YYYY, hh:mm A - hh:mm A" ("Thursday May 14, 2026, 10:00 AM - 12:00 PM").
 */
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

// Faithful port of the legacy AttachmentList.niceBytes — INCLUDING its known
// upstream label quirk: the units table is ["B","MB","MB",…] (no "KB"), so files
// in the 1 KB–1 MB range render labeled "MB" (e.g. a 488 KB file → "488 MB").
// Replicated verbatim so sizes match production exactly (the VR gate would flag
// any "fix"). FLAGGED to the user as a pre-existing bug to correct separately.
const NICE_UNITS = ["B", "MB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export function niceBytes(x?: number): string {
  let l = 0;
  let n = typeof x === "number" ? x : parseInt(String(x ?? 0), 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + NICE_UNITS[l];
}

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
  /** raw ISO start/end + summary — kept for the single page's JSON-LD Event. */
  start?: string;
  end?: string;
  summary?: string;
  /** "May 14, 2026" — table date column + a search/sort proxy. */
  altDate: string;
  startMs: number;
  /** "Thursday May 14, 2026, 10:00 AM - 12:00 PM" (or multi-day range). */
  dateLine: string;
  /** body markdown rendered + sanitized server-side (empty when cancelled). */
  bodyHtml: string;
  tags: string[];
  attachments: MeetingAttachmentItem[];
  attCount: number;
  external: MeetingExternalItem[];
  related: MeetingRelatedItem[];
  /** lowercased search haystack (title + category + date + status). */
  haystack: string;
}

// Shape one raw Strapi meeting the way the legacy card/table do: flatten tags,
// sort attachments by name asc (AttachmentList.mounted), build the related list
// from posts+events (the only relations the meetings query returns), and
// pre-render the body so the table can expand a card with NO client fetch.
function shapeMeeting(m: any): MeetingItem {
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
        .map((e: any) => ({ title: e.title || e.url, url: e.url }))
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
    bodyHtml: !m.isCancelled && m.body ? renderToHtml(m.body) : "",
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

/** All meetings (start desc), live, for /news/meetings/. */
export async function getAllMeetings(): Promise<MeetingItem[]> {
  const { data } = await runQuery(GET_ALL_MEETINGS_QUERY, {}, "no-cache");
  return (data?.meetings ?? [])
    .map(shapeMeeting)
    .sort((a: MeetingItem, b: MeetingItem) => b.startMs - a.startMs);
}

/** A single meeting by slug, live; null when none matches (page 404s). */
export async function getMeeting(slug: string): Promise<MeetingItem | null> {
  const { data } = await runQuery(GET_SINGLE_MEETING_QUERY, { slug }, "no-cache");
  const m = data?.meetings?.[0];
  return m ? shapeMeeting(m) : null;
}

// ── Shared content helpers (reused across sections) ───────────────
export interface AttachmentItem {
  name: string;
  url: string;
  ext: string;
  niceSize: string;
  updatedAlt: string;
}
/** Shape Strapi attachments like the legacy AttachmentList: absolute url, niceBytes
 *  size, dateFormatAlt updated, sorted by name asc. */
export function shapeAttachments(arr?: any[]): AttachmentItem[] {
  return (Array.isArray(arr) ? [...arr] : [])
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .map((a) => ({
      name: a.name,
      url: strapiUrl(a.url) || a.url,
      ext: (a.ext || "").replace(/^\./, "").toLowerCase(),
      niceSize: niceBytes(a.size),
      updatedAlt: dateFormatAlt(a.updated_at),
    }));
}

export interface RelatedItem {
  displayTitle: string;
  fullPath: string;
}
/** Build the legacy RelatedList: "[Type]: title" linking to each type's route,
 *  sorted by displayTitle. Handles all relation kinds a record may carry. */
export function buildRelated(content: any): RelatedItem[] {
  const out: RelatedItem[] = [];
  const push = (arr: any, type: string, base: string) => {
    if (Array.isArray(arr))
      arr.forEach((e: any) =>
        out.push({ displayTitle: `[${type}]: ${e.title}`, fullPath: `${base}${e.slug}/` }),
      );
  };
  push(content?.events, "Event", "/events/");
  push(content?.meetings, "Meeting", "/news/meetings/");
  push(content?.posts, "News", "/news/");
  push(content?.grants, "Funding", "/grants/funding/");
  push(content?.programs, "Program", "/grants/programs/");
  push(content?.biographies, "Biography", "/about/biographies/");
  return out.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
}

// ── CMS page (section intros + generic CMS pages) ─────────────────
export interface TocItem {
  /** anchor id (markdown-it-anchor slug) — scroll target is `#${id}`. */
  id: string;
  /** heading text. */
  text: string;
}
export interface CmsClickthrough {
  title?: string;
  teaser?: string;
  /** teaser markdown rendered + sanitized server-side. */
  teaserHtml: string;
  icon?: string;
  url?: string;
  datePosted?: string;
}
export interface CmsPage {
  title: string;
  /** title rendered as inline markdown (a title may contain markdown). */
  titleHtml: string;
  hideTitle: boolean;
  summary?: string;
  /** body markdown rendered + sanitized server-side. */
  safeBodyHtml: string;
  showTOC?: boolean;
  /** AttachmentList heading; "" → "Attachments" (legacy default). */
  attachmentLabel: string;
  attachments: AttachmentItem[];
  /** clickthrough boxes (About/units/hub landings), teaser pre-rendered. */
  clickthrough: CmsClickthrough[];
  /** splash image passthrough for CmsImage (null when absent). */
  splash: StrapiImage | null;
  /** h2 anchors for an on-page TOC (legacy Toc: h2[id] not under #disclaimer). */
  toc: TocItem[];
  tags: string[];
  published_at?: string;
}

/**
 * Build the legacy Toc list from rendered body HTML: every <h2> that is NOT
 * inside #disclaimer, in document order, as {id (anchor slug already injected
 * by markdown-it-anchor), text}. Mirrors Toc.vue's setToc()/closest("#disclaimer")
 * filter; the anchor scroll target is `#${id}`.
 */
function buildToc(html: string): TocItem[] {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h2"))
      .filter((h2: any) => !h2.closest("#disclaimer"))
      .map((h2: any) => ({
        id: h2.getAttribute("id") || "",
        text: (h2.textContent || "").trim(),
      }))
      .filter((t: TocItem) => t.text.length > 0);
  } catch {
    return [];
  }
}

/** Fetch a CMS "page" by slug (live) + render its body. null when none matches. */
export async function getPage(slug: string): Promise<CmsPage | null> {
  const { data } = await runQuery(GET_SINGLE_PAGE_QUERY, { slug }, "no-cache");
  const p = data?.pages?.[0];
  if (!p) return null;
  const safeBodyHtml = p.body ? renderToHtml(p.body) : "";
  return {
    title: p.title,
    // INLINE render (no <p> wrapper) — titleHtml goes inside an <h1>, so a block
    // render produced invalid <h1><p>…</p></h1>. renderInline keeps any emphasis/
    // links the legacy v-html=render(title) allowed, without the paragraph.
    titleHtml: p.title ? renderInline(p.title) : "",
    hideTitle: !!p.hideTitle,
    summary: p.summary,
    safeBodyHtml,
    showTOC: p.showTOC,
    attachmentLabel: p.attachmentLabel || "Attachments",
    attachments: shapeAttachments(p.attachments),
    clickthrough: Array.isArray(p.clickthrough)
      ? p.clickthrough.map((c: any) => ({
          title: c.title,
          teaser: c.teaser,
          teaserHtml: c.teaser ? renderToHtml(c.teaser) : "",
          icon: c.icon,
          url: c.url,
          datePosted: c.datePosted,
        }))
      : [],
    splash: (p.splash as StrapiImage) || null,
    toc: buildToc(safeBodyHtml),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
    published_at: p.published_at,
  };
}

// ── Funding (/grants/funding/) ────────────────────────────────────
export interface FundingListItem {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  category: string;
  /** uppercase label, e.g. "NOTICE OF FUNDING OPPORTUNITY". */
  catLabel: string;
  summaryHtml: string;
  /** "May 05, 2026 to June 06, 2026" (legacy `format`). */
  dateRange: string;
  /** dateFormatAlt(end) — for the Deadline/Expired chip. */
  deadlineAlt: string;
  isExpired: boolean;
  endMs: number;
  attachments: AttachmentItem[];
  tags: string[];
}
function shapeFundingListItem(g: any): FundingListItem {
  const catLabel =
    fundingCategoryLabel(g.category).toUpperCase() || String(g.category || "").toUpperCase();
  return {
    id: String(g.id),
    slug: g.slug,
    title: g.title,
    fullPath: `/grants/funding/${g.slug}/`,
    category: g.category ?? "",
    catLabel,
    summaryHtml: g.summary ? renderToHtml(g.summary) : "",
    dateRange: g.start && g.end ? `${formatNewsDate(g.start)} to ${formatNewsDate(g.end)}` : "",
    deadlineAlt: dateFormatAlt(g.end),
    isExpired: isExpired(g.end),
    endMs: g.end ? new Date(g.end).getTime() : 0,
    attachments: shapeAttachments(g.attachments),
    tags: Array.isArray(g.tags) ? g.tags.map((t: any) => t.title) : [],
  };
}
/** All funding opportunities (end desc), live, for /grants/funding/. */
export async function getFunding(): Promise<FundingListItem[]> {
  const { data } = await runQuery(GET_ALL_FUNDING_QUERY, {}, "no-cache");
  return (data?.grants ?? [])
    .map(shapeFundingListItem)
    .sort((a: FundingListItem, b: FundingListItem) => b.endMs - a.endMs);
}

// ── Rules, Regulations & Policies (/grants/rules-regs-policies/) ──────────────
// Three distinct Strapi collections (NOT the generic `pages`), each a flat table
// row, sorted by title (legacy _.orderBy title asc). Resilient: a failed
// collection degrades to an empty table rather than failing the page.
export interface RrpRow {
  title: string;
  /** link target — citationURL (rules), url (regulations), or attachment file (policies). */
  href: string;
  /** secondary cell text — citation (rules) / url (regulations); empty for policies. */
  meta: string;
  /** policies render a Download button instead of the meta cell. */
  download: boolean;
}
export interface RulesRegsPolicies {
  rules: RrpRow[];
  regulations: RrpRow[];
  policies: RrpRow[];
}
export async function getRulesRegsPolicies(): Promise<RulesRegsPolicies> {
  const [rulesR, polR, regR] = await Promise.allSettled([
    runQuery(GET_ALL_RULES_QUERY, {}, "no-cache"),
    runQuery(GET_ALL_POLICIES_QUERY, {}, "no-cache"),
    runQuery(GET_ALL_REGULATIONS_QUERY, {}, "no-cache"),
  ]);
  const d = (r: PromiseSettledResult<any>) => (r.status === "fulfilled" ? r.value?.data : null);
  const byTitle = (a: RrpRow, b: RrpRow) => a.title.localeCompare(b.title);
  const rules: RrpRow[] = (d(rulesR)?.rules ?? [])
    .map((x: any) => ({ title: x.title, href: x.citationURL || "#", meta: x.citation || "", download: false }))
    .sort(byTitle);
  const regulations: RrpRow[] = (d(regR)?.regulations ?? [])
    .map((x: any) => ({ title: x.title, href: x.url || "#", meta: x.url || "", download: false }))
    .sort(byTitle);
  const policies: RrpRow[] = (d(polR)?.policies ?? [])
    .map((x: any) => {
      const att = Array.isArray(x.attachments) ? x.attachments[0] : null;
      const url = att ? strapiUrl(att.url) : null;
      return { title: x.title, href: url || "#", meta: "", download: !!url };
    })
    .sort(byTitle);
  return { rules, regulations, policies };
}

export interface GrantDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  catLabel: string;
  bodyHtml: string;
  summary?: string;
  start?: string;
  end?: string;
  published_at?: string;
  isExpired: boolean;
  /** formatNewsDate(end) — for the "Expired on …" banner. */
  endFormatted: string;
  attachments: AttachmentItem[];
  related: RelatedItem[];
  tags: string[];
}
/** A single grant by slug, live; null when none matches (404). */
export async function getGrant(slug: string): Promise<GrantDetail | null> {
  const { data } = await runQuery(GET_SINGLE_FUNDING_QUERY, { slug }, "no-cache");
  const g = data?.grants?.[0];
  if (!g) return null;
  return {
    id: String(g.id),
    slug: g.slug,
    title: g.title,
    category: g.category ?? "",
    catLabel: fundingCategoryLabel(g.category).toUpperCase(),
    bodyHtml: g.body ? renderToHtml(g.body) : "",
    summary: g.summary,
    start: g.start,
    end: g.end,
    published_at: g.published_at,
    isExpired: isExpired(g.end),
    endFormatted: formatNewsDate(g.end),
    attachments: shapeAttachments(g.attachments),
    related: buildRelated(g),
    tags: Array.isArray(g.tags) ? g.tags.map((t: any) => t.title) : [],
  };
}

// ── Funded Programs (/grants/programs/) ───────────────────────────
// Mirrors funding above. Programs carry status ('current'|'archived') +
// category ('federal'|'state'). The legacy BaseCardExpandable kicker for a
// program (contentType 'program', category != 'nofo') is "{CATEGORY} PROGRAM"
// (uppercase) — e.g. "FEDERAL PROGRAM". A status chip shows ONLY when archived.
export interface ProgramListItem {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  status: string;
  category: string;
  /** uppercase kicker, e.g. "FEDERAL PROGRAM" (legacy BaseCardExpandable). */
  catLabel: string;
  /** ProgramsAll uses BaseCardExpandable WITHOUT summaryOnly → renders body. */
  bodyHtml: string;
  summary?: string;
  published_at?: string;
  attachments: AttachmentItem[];
  tags: string[];
}
function shapeProgramListItem(p: any): ProgramListItem {
  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    fullPath: `/grants/programs/${p.slug}/`,
    status: p.status ?? "",
    category: p.category ?? "",
    catLabel: `${String(p.category || "").toUpperCase()} PROGRAM`,
    bodyHtml: p.body ? renderToHtml(p.body) : "",
    summary: p.summary,
    published_at: p.published_at,
    attachments: shapeAttachments(p.attachments),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
  };
}
/** All funded programs (title asc — legacy _.orderBy title), live, for /grants/programs/. */
export async function getAllPrograms(): Promise<ProgramListItem[]> {
  const { data } = await runQuery(GET_ALL_PROGRAMS_QUERY, {}, "no-cache");
  return (data?.programs ?? [])
    .map(shapeProgramListItem)
    .sort((a: ProgramListItem, b: ProgramListItem) =>
      a.title.localeCompare(b.title),
    );
}

export interface ProgramDetail {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  catLabel: string;
  bodyHtml: string;
  summary?: string;
  published_at?: string;
  attachments: AttachmentItem[];
  /** related News + Funding (Program type exposes only posts + grants). */
  related: RelatedItem[];
  tags: string[];
}
/** A single program by slug, live; null when none matches (404). */
export async function getProgram(slug: string): Promise<ProgramDetail | null> {
  const { data } = await runQuery(GET_SINGLE_PROGRAM_QUERY, { slug }, "no-cache");
  const p = data?.programs?.[0];
  if (!p) return null;
  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    status: p.status ?? "",
    category: p.category ?? "",
    catLabel: `${String(p.category || "").toUpperCase()} PROGRAM`,
    bodyHtml: p.body ? renderToHtml(p.body) : "",
    summary: p.summary,
    published_at: p.published_at,
    attachments: shapeAttachments(p.attachments),
    related: buildRelated(p),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
  };
}

/**
 * Exact port of the legacy `format` Vue filter: full month name + zero-padded
 * day + year ("May 05, 2026"). The legacy filter ran in the browser and added
 * abs(tz-offset) to pin the UTC calendar date; reading UTC components here is
 * the tz-independent server equivalent (so it matches regardless of where it
 * runs). Use for news/press dates so they match prod to the day.
 */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function formatNewsDate(d?: string): string {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  const day = t.getUTCDate();
  const pad = day < 10 ? "0" + day : String(day);
  return `${MONTH_NAMES[t.getUTCMonth()]} ${pad}, ${t.getUTCFullYear()}`;
}

/** Format an ISO date in America/Chicago (matches the legacy site's tz). */
export function formatDate(iso?: string): string {
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

/** Resolve a Strapi image URL (relative /uploads/... → absolute). */
export function strapiUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : STRAPI_BASE + url;
}

export interface HomeData {
  news: any[];
  meetings: any[];
  funding: any[];
  employment: any[];
  boxes: any[];
}

/** Fetch + shape the home page data, live. Mirrors Home.vue's result(). */
export async function getHome(): Promise<HomeData> {
  const { data } = await runQuery(
    GET_HOME,
    { postLimit: 15, meetingLimit: 5, fundingLimit: 5, employmentLimit: 3 },
    "no-cache",
  );
  const pub = (e: any) => e.dateOverride || e.published_at;
  const news = (data?.posts ?? [])
    .map((e: any) => ({ ...e, fullPath: `/news/${e.slug}/`, publicationDate: pub(e) }))
    .sort((a: any, b: any) =>
      String(b.publicationDate || "").localeCompare(String(a.publicationDate || "")),
    )
    .slice(0, 5);
  const meetings = (data?.meetings ?? []).map((e: any) => ({
    ...e,
    fullPath: `/news/meetings/${e.slug}/`,
  }));
  const funding = (data?.grants ?? []).map((e: any) => ({
    ...e,
    fullPath: `/grants/funding/${e.slug}/`,
  }));
  const employment = (data?.jobs ?? []).map((e: any) => ({
    ...e,
    fullPath: `/about/employment/${e.slug}/`,
  }));
  const boxes = data?.home?.clickThroughBoxes ?? [];
  return { news, meetings, funding, employment, boxes };
}

// ── Employment (/about/employment/) ───────────────────────────────
// config.maps.employment — category → label. Fallback "Undefined" (legacy
// getProperCategory). Card kicker = employmentCategoryLabel(cat).toUpperCase()
// + " EMPLOYMENT" (legacy JobCard).
const EMPLOYMENT_LABELS: Record<string, string> = {
  contract: "Contract",
  fullTime: "Full Time",
  internship: "Internship",
  partTime: "Part Time",
};
export function employmentCategoryLabel(cat?: string): string {
  return (cat && EMPLOYMENT_LABELS[cat]) || "Undefined";
}

export interface JobListItem {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  category: string;
  /** "{CAT} EMPLOYMENT" — uppercase label + " EMPLOYMENT" (legacy kicker). */
  catLabel: string;
  summaryHtml: string;
  /** "Posted {date}" source date (legacy `format(start)`). */
  postedLine: string;
  start?: string;
  end?: string;
  expired: boolean;
  /** "Accepting applications through {date}" — only when not expired + dates. */
  acceptingLine: string;
  /** "Expired: {dateFormatAlt(end)}" — the expired chip. */
  expiredChip: string;
  endMs: number;
  tags: string[];
}
// Shape a raw Strapi job the way JobCard does: uppercase category + " EMPLOYMENT"
// kicker, "Posted {format(start)}" line, accepting/expired states keyed off
// isExpired(end) (legacy `addOneDayToDate(end) >/< now`). endMs kept so a client
// island can re-filter/sort without a refetch (server already sorts end:desc).
function shapeJobList(j: any): JobListItem {
  const catLabel = `${employmentCategoryLabel(j.category).toUpperCase()} EMPLOYMENT`;
  const expired = isExpired(j.end);
  return {
    id: String(j.id),
    slug: j.slug,
    title: j.title,
    fullPath: `/about/employment/${j.slug}/`,
    category: j.category ?? "",
    catLabel,
    summaryHtml: j.summary ? renderToHtml(j.summary) : "",
    postedLine: j.start ? `Posted ${formatNewsDate(j.start)}` : "",
    start: j.start,
    end: j.end,
    expired,
    acceptingLine:
      !expired && j.start && j.end
        ? `Accepting applications through ${formatNewsDate(j.end)}`
        : "",
    expiredChip: expired ? `Expired: ${dateFormatAlt(j.end)}` : "",
    endMs: j.end ? new Date(j.end).getTime() : 0,
    tags: Array.isArray(j.tags) ? j.tags.map((t: any) => t.title) : [],
  };
}

/** All jobs (end desc — server-sorted), live, for /about/employment/. */
export async function getAllJobs(): Promise<JobListItem[]> {
  const { data } = await runQuery(GET_ALL_JOBS_QUERY, {}, "no-cache");
  return (data?.jobs ?? []).map(shapeJobList);
}

export interface JobDetail extends JobListItem {
  bodyHtml: string;
  attachments: AttachmentItem[];
  external: MeetingExternalItem[];
  /** related News only — "Related ICJIA Content" heading (legacy JobCard). */
  related: RelatedItem[];
  published_at?: string;
}
/** A single job by slug, live; null when none matches (page 404s). */
export async function getJob(slug: string): Promise<JobDetail | null> {
  const { data } = await runQuery(GET_SINGLE_JOB_QUERY, { slug }, "no-cache");
  const j = data?.jobs?.[0];
  if (!j) return null;
  const base = shapeJobList(j);
  const external: MeetingExternalItem[] = Array.isArray(j.external)
    ? j.external
        .filter((e: any) => e && e.url)
        .map((e: any) => ({ title: e.title || e.url, url: e.url }))
    : [];
  // JobCard wires RelatedList off the job's relations; the single query returns
  // only `posts`, so related is News-only (heading "Related ICJIA Content").
  const related: RelatedItem[] = (Array.isArray(j.posts) ? j.posts : [])
    .map((p: any) => ({
      displayTitle: `[News]: ${p.title}`,
      fullPath: `/news/${p.slug}/`,
    }))
    .sort((a: RelatedItem, b: RelatedItem) =>
      a.displayTitle.localeCompare(b.displayTitle),
    );
  return {
    ...base,
    bodyHtml: j.body ? renderToHtml(j.body) : "",
    attachments: shapeAttachments(j.attachments),
    external,
    related,
    published_at: j.published_at,
  };
}

// ── Events (/events/) ─────────────────────────────────────────────
// Chicago-tz parts with FULL month name + numeric pieces, for the legacy
// EventsAll.getRange() format strings. (chicagoParts above uses short months;
// events need full + h:mm a, so a dedicated extractor.)
function chicagoEventParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    month: g("month"),
    day: g("day"),
    year: g("year"),
    hour: g("hour"),
    minute: g("minute"),
    dayPeriod: g("dayPeriod").toLowerCase().replace(/\./g, ""),
  };
}
// Chicago-local calendar-day difference (legacy dayjs diff in days, both tz'd).
function chicagoDayDiff(start: string, end: string): number {
  const dayMs = 86_400_000;
  const toChicagoMidnight = (iso: string): number => {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(iso));
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"));
  };
  return Math.floor((toChicagoMidnight(end) - toChicagoMidnight(start)) / dayMs);
}
function isMultiDay(start?: string, end?: string): boolean {
  if (!start || !end) return false;
  return chicagoDayDiff(start, end) > 0;
}

/**
 * Legacy EventsAll.getRange(start, end, timed) — PLAIN-TEXT form (the legacy
 * wrapped the date in <span style='font-weight:400'>; here it's the text the
 * section renders, styled in the component). America/Chicago, three branches:
 *   timed + same day  → "h:mm a to h:mm a | MMMM DD, YYYY"
 *   !timed + same day → "All Day | MMMM DD, YYYY"
 *   multi-day         → "MMMM D through MMMM D, YYYY"
 * (Differs from meetingDateLine — DO NOT reuse.)
 */
export function eventRangeLine(
  start?: string,
  end?: string,
  timed?: boolean,
): string {
  if (!start || !end) return "";
  const s = chicagoEventParts(start);
  const e = chicagoEventParts(end);
  const days = chicagoDayDiff(start, end);
  const time = (p: ReturnType<typeof chicagoEventParts>) =>
    `${p.hour}:${p.minute} ${p.dayPeriod}`;
  const padDay = (d: string) => (d.length < 2 ? "0" + d : d);
  if (days === 0 && timed) {
    return `${time(s)} to ${time(e)} | ${s.month} ${padDay(s.day)}, ${s.year}`;
  }
  if (days === 0 && !timed) {
    return `All Day | ${s.month} ${padDay(s.day)}, ${s.year}`;
  }
  return `${s.month} ${s.day} through ${e.month} ${e.day}, ${e.year}`;
}

export type EventColor = "green" | "blue" | "indigo" | "purple";
export interface CalendarItem {
  id?: string;
  name: string;
  slug: string;
  fullPath: string;
  contentType: "event" | "meeting" | "funding" | "employment";
  category?: string;
  summary?: string;
  details?: string;
  start?: string;
  end?: string;
  timed: boolean;
  color: EventColor;
  hideFromList: boolean;
  hideFromCalendar: boolean;
  /** raw start in ms (sort key — legacy orderBy start asc). */
  startMs: number;
  tags: string[];
}
export interface EventListItem {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  category?: string;
  summary?: string;
  start?: string;
  end?: string;
  timed: boolean;
  /** legacy getRange line (Chicago). */
  rangeLine: string;
  startMs: number;
  tags: string[];
}
export interface EventsAggregate {
  /** events only (hideFromList=false), legacy list view source. */
  eventsList: EventListItem[];
  /** full calendar feed: events+meetings+grants(+open/deadline)+jobs(+open/deadline). */
  calendarFeed: CalendarItem[];
}

const tags = (x: any): string[] =>
  Array.isArray(x?.tags) ? x.tags.map((t: any) => t.title) : [];
const ms = (iso?: string): number => (iso ? new Date(iso).getTime() : 0);

// Build the calendar feed exactly as EventsAll.result() does: per-type color +
// fullPath + hideFrom* flags, derived `timed` for meetings/grants/jobs, then the
// synthetic grant/job OPEN + DEADLINE point-events. Sorted start asc.
function buildCalendarFeed(data: any): CalendarItem[] {
  const out: CalendarItem[] = [];
  const events = Array.isArray(data?.events) ? data.events : [];
  const meetings = Array.isArray(data?.meetings) ? data.meetings : [];
  const grants = Array.isArray(data?.grants) ? data.grants : [];
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  for (const e of events)
    out.push({
      id: String(e.id),
      name: e.name,
      slug: e.slug,
      fullPath: `/events/${e.slug}/`,
      contentType: "event",
      category: e.category,
      summary: e.summary,
      details: e.details,
      start: e.start,
      end: e.end,
      timed: !!e.timed,
      color: "green",
      hideFromList: false,
      hideFromCalendar: false,
      startMs: ms(e.start),
      tags: tags(e),
    });
  for (const m of meetings)
    out.push({
      id: String(m.id),
      name: m.name, // aliased title in GET_EVENTS
      slug: m.slug,
      fullPath: `/news/meetings/${m.slug}/`,
      contentType: "meeting",
      category: m.category,
      summary: m.summary,
      start: m.start,
      end: m.end,
      timed: !isMultiDay(m.start, m.end),
      color: "blue",
      hideFromList: false,
      hideFromCalendar: false,
      startMs: ms(m.start),
      tags: tags(m),
    });
  for (const g of grants) {
    const fullPath = `/grants/funding/${g.slug}/`;
    out.push({
      id: String(g.id),
      name: g.name, // aliased title in GET_EVENTS
      slug: g.slug,
      fullPath,
      contentType: "funding",
      category: g.category,
      summary: g.summary,
      start: g.start,
      end: g.end,
      timed: !isMultiDay(g.start, g.end),
      color: "indigo",
      hideFromList: false,
      hideFromCalendar: true,
      startMs: ms(g.start),
      tags: tags(g),
    });
    out.push({
      name: `OPEN: ${g.name}`,
      slug: g.slug,
      fullPath,
      contentType: "funding",
      category: g.category,
      summary: g.summary,
      start: g.start,
      end: g.start,
      timed: false,
      color: "indigo",
      hideFromList: true,
      hideFromCalendar: false,
      startMs: ms(g.start),
      tags: [],
    });
    out.push({
      name: `DEADLINE: ${g.name}`,
      slug: g.slug,
      fullPath,
      contentType: "funding",
      category: g.category,
      summary: g.summary,
      start: g.end,
      end: g.end,
      timed: false,
      color: "indigo",
      hideFromList: true,
      hideFromCalendar: false,
      startMs: ms(g.end),
      tags: [],
    });
  }
  for (const j of jobs) {
    const fullPath = `/about/employment/${j.slug}/`;
    out.push({
      id: String(j.id),
      name: j.title,
      slug: j.slug,
      fullPath,
      contentType: "employment",
      category: j.category,
      summary: j.summary,
      start: j.start,
      end: j.end,
      timed: !isMultiDay(j.start, j.end),
      color: "purple",
      hideFromList: false,
      hideFromCalendar: true,
      startMs: ms(j.start),
      tags: tags(j),
    });
    out.push({
      name: `OPEN: ${j.title}`,
      slug: j.slug,
      fullPath,
      contentType: "employment",
      category: j.category,
      summary: j.summary,
      start: j.start,
      end: j.start,
      timed: false,
      color: "purple",
      hideFromList: true,
      hideFromCalendar: false,
      startMs: ms(j.start),
      tags: [],
    });
    out.push({
      name: `DEADLINE: ${j.title}`,
      slug: j.slug,
      fullPath,
      contentType: "employment",
      category: j.category,
      summary: j.summary,
      start: j.end,
      end: j.end,
      timed: false,
      color: "purple",
      hideFromList: true,
      hideFromCalendar: false,
      startMs: ms(j.end),
      tags: [],
    });
  }
  return out.sort((a, b) => a.startMs - b.startMs);
}

function shapeEventListItem(e: any): EventListItem {
  return {
    id: String(e.id),
    name: e.name,
    slug: e.slug,
    fullPath: `/events/${e.slug}/`,
    category: e.category,
    summary: e.summary,
    start: e.start,
    end: e.end,
    timed: !!e.timed,
    rangeLine: eventRangeLine(e.start, e.end, !!e.timed),
    startMs: ms(e.start),
    tags: tags(e),
  };
}

/**
 * Events list + calendar aggregate, live. The single GET_EVENTS returns
 * events+meetings+grants+jobs; eventsList is events-only (start asc), and
 * calendarFeed is the full feed (incl. synthetic OPEN/DEADLINE point-events).
 * UPCOMING filter (default true in the legacy) is a CLIENT concern (a toggle);
 * see filterUpcoming() for the exact legacy boundary if a section pre-filters.
 */
export async function getEventsCalendarData(): Promise<EventsAggregate> {
  const { data } = await runQuery(GET_EVENTS, {}, "no-cache");
  const eventsList = (data?.events ?? [])
    .map(shapeEventListItem)
    .sort((a: EventListItem, b: EventListItem) => a.startMs - b.startMs);
  return { eventsList, calendarFeed: buildCalendarFeed(data) };
}
/** Alias — some callers want just the aggregate. */
export const getEvents = getEventsCalendarData;

/**
 * Legacy EventsAll upcoming filter: keep items whose end-date, advanced to the
 * NEXT midnight (`setHours(24,0,0,0)`), is still >= now — i.e. anything ending
 * today or later. Ported verbatim from EventsAll.filterDisplay(). Exposed so a
 * section can pre-filter server-side (the legacy default is upcomingOnly=true).
 */
export function filterUpcoming<T extends { end?: string }>(items: T[]): T[] {
  const now = new Date();
  return items.filter((it) => {
    if (!it.end) return false;
    const exp = new Date(it.end);
    exp.setHours(24, 0, 0, 0);
    return exp >= now;
  });
}

export interface EventDetail {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  category?: string;
  summary?: string;
  start?: string;
  end?: string;
  timed: boolean;
  rangeLine: string;
  bodyHtml: string;
  /** related News + Meetings, "Related" heading (legacy EventsSingle). */
  related: RelatedItem[];
  tags: string[];
  published_at?: string;
}
/** A single event by slug, live; null when none matches (page 404s). */
export async function getEvent(slug: string): Promise<EventDetail | null> {
  const { data } = await runQuery(GET_SINGLE_EVENT_QUERY, { slug }, "no-cache");
  const e = data?.events?.[0];
  if (!e) return null;
  // EventsSingle renders the body from details||summary.
  const bodySource = e.details || e.summary || "";
  return {
    id: String(e.id),
    name: e.name,
    slug: e.slug,
    fullPath: `/events/${e.slug}/`,
    category: e.category,
    summary: e.summary,
    start: e.start,
    end: e.end,
    timed: !!e.timed,
    rangeLine: eventRangeLine(e.start, e.end, !!e.timed),
    bodyHtml: bodySource ? renderToHtml(bodySource) : "",
    related: buildRelated(e),
    tags: tags(e),
    published_at: e.published_at,
  };
}

// ── Publications (/about/publications/) ───────────────────────────
// Verbatim port of src/lib/utils.js getPublicationType — 19-case switch,
// default "General". (NOT a config map; NOT fundingCategoryLabel.)
export function publicationTypeLabel(type?: string): string {
  switch (type) {
    case "researchReport":
      return "Research Report";
    case "researchBulletin":
      return "Research Bulletin";
    case "researchAtAGlance":
      return "Research At A Glance";
    case "trendsAndIssuesUpdate":
      return "Trends and Issues Update";
    case "motorVehicleTheftPublications":
      return "Motor Vehicle Theft Publication";
    case "barj":
      return "BARJ";
    case "compiler":
      return "Compiler";
    case "dataset":
      return "Dataset";
    case "getTheFacts":
      return "GET THE FACTS";
    case "programEvaluationSummary":
      return "Program Evaluation Summary";
    case "megProfiles":
      return "MEG Profiles";
    case "annualReport":
      return "Annual Report";
    case "article":
      return "Article";
    case "report":
      return "Report";
    case "evaluation":
      return "Evaluation";
    case "toolkit":
      return "Toolkit";
    case "onGoodAuthority":
      return "On Good Authority";
    case "application":
      return "Application";
    default:
      return "General";
  }
}

// Legacy PublicationCard.getFileType: last path segment's extension, uppercased.
export function getFileType(url?: string): string {
  if (!url) return "";
  return url.split(/[#?]/)[0].split(".").pop()!.trim().toUpperCase();
}

const PUB_BASE = "https://agency.icjia-api.cloud";
const PUB_CLIENT = "https://icjia.illinois.gov";
const PUB_PAGE_SIZE = 500;

export interface PublicationListItem {
  id: string;
  title: string;
  /** present on the single-row shape; omitted from the listing island (dead there — fullPath is precomputed). */
  slug?: string;
  /** FULL summary on the single-row shape; TRUNCATED (≤25 words) on the listing island to keep the data island small — the listing expand shows a preview, the full text lives on the detail page. Search still matches the full summary via `haystack`. */
  summary?: string;
  pubType?: string;
  /** publicationDate (the archive's own field — NOT published_at). */
  publicationDate?: string;
  tags: string[];
  fileURL?: string;
  articleURL?: string;
  fullPath: string;
  /** path-only when articleURL is an icjia.illinois.gov link, else null. */
  localArticlePath: string | null;
  /** getPublicationType(pubType). */
  typeLabel: string;
  /** dateFormatAlt(publicationDate). */
  dateAlt: string;
  isNew: boolean;
  /** getFileType(fileURL) — the card's file-type chip. */
  fileType: string;
  /** lowercase search haystack (title + summary + type + tags). */
  haystack: string;
}

function shapePublication(p: any): PublicationListItem {
  const tagsArr: string[] = Array.isArray(p.tags)
    ? p.tags.map((t: any) => (typeof t === "string" ? t : t?.title)).filter(Boolean)
    : [];
  const localArticlePath =
    p.articleURL && p.articleURL.includes(PUB_CLIENT)
      ? p.articleURL.replace(PUB_CLIENT, "")
      : null;
  const typeLabel = publicationTypeLabel(p.pubType);
  return {
    id: String(p.id),
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    pubType: p.pubType,
    publicationDate: p.publicationDate,
    tags: tagsArr,
    fileURL: p.fileURL,
    articleURL: p.articleURL,
    fullPath: `/about/publications/${p.slug}/`,
    localArticlePath,
    typeLabel,
    dateAlt: dateFormatAlt(p.publicationDate),
    isNew: isNew(p.publicationDate, DAYS_TO_SHOW_NEW),
    fileType: getFileType(p.fileURL),
    haystack: [p.title, p.summary, typeLabel, tagsArr.join(" ")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

// uniqBy id (lodash parity) — first occurrence wins.
function uniqById<T extends { id: string | number }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = String(item.id);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * All publications, live, for /about/publications/ — REST PAGER (NOT GraphQL).
 * Verbatim port of PublicationsAll.fetchPublications(): GET /publications/count,
 * then ceil(count/500) slices of GET /publications?_limit=500&_start=<n>;
 * uniqBy id; run every row through deepSanitize (the SiteImprove filter — the
 * legacy ran the raw axios payload through it); shape; sort publicationDate desc.
 * GraphQL is deliberately NOT used: limit:990 silently clips the ~1108-row
 * archive and limit:2000 errors.
 */
export async function getAllPublications(): Promise<PublicationListItem[]> {
  const countRes = await fetch(`${PUB_BASE}/publications/count`);
  if (!countRes.ok) throw new Error(`publications/count HTTP ${countRes.status}`);
  const count = Number(await countRes.json());
  const iterations = Math.ceil(count / PUB_PAGE_SIZE);
  let rows: any[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = i * PUB_PAGE_SIZE;
    const res = await fetch(
      `${PUB_BASE}/publications?_limit=${PUB_PAGE_SIZE}&_start=${start}`,
    );
    if (!res.ok) throw new Error(`publications slice HTTP ${res.status}`);
    rows = rows.concat(await res.json());
  }
  const clean = deepSanitize(uniqById(rows));
  return (clean as any[])
    .map(shapePublication)
    // ISLAND TRIM (perf): the listing ships ALL ~1108 rows as one JSON island so
    // the client can search/sort the whole archive. shapePublication keeps the
    // FULL summary (for the full-text `haystack`, matching legacy customFilter)
    // and `slug`; both are redundant in the island once shaped — `haystack`
    // already carries the searchable summary text and `fullPath` already encodes
    // the slug. So drop `slug` and replace the per-row `summary` with a ≤25-word
    // preview (the expand shows a preview; the detail page shows the full text).
    // This cuts the island ~40% without changing search/sort/expand parity.
    .map(({ slug, ...item }) => ({
      ...item,
      summary: truncateWords(item.summary, 25),
    }))
    .sort((a, b) =>
      String(b.publicationDate || "").localeCompare(String(a.publicationDate || "")),
    );
}

/** A single publication by slug, live (GraphQL is fine here — one row). null → 404. */
export async function getPublication(slug: string): Promise<PublicationListItem | null> {
  const { data } = await runQuery(GET_SINGLE_PUBLICATION_QUERY, { slug }, "no-cache");
  const p = data?.publications?.[0];
  if (!p) return null;
  // Legacy PublicationsSingle ad-hoc fileURL capitalization fixups.
  if (p.fileURL) {
    p.fileURL = p.fileURL
      .replace("/Compiler/", "/compiler/")
      .replace("/OGA/", "/oga/")
      .replace("/researchreports/", "/ResearchReports/");
  }
  return shapePublication(p);
}

// ── Biographies (/about/biographies/ + staff lists) ───────────────
// SHARED by: biographies/[slug], about icjia-staff + composition-and-membership,
// and the unit staff lists (FSGU/ISU/R&A). Body is the `bio` field (aliased
// `body` in the queries). Headshot → pickStrapiImage (NO Thumbor; CmsImage);
// 75/109 records have no headshot, so callers gate on headshot != null.
export interface Biography {
  id: string;
  slug: string;
  fullName: string;
  suffix?: string;
  /** "{fullName}, {suffix}" when a suffix exists, else fullName. */
  fullNameWithSuffix: string;
  title?: string;
  unit: { title?: string; shortName?: string; slug?: string; url?: string } | null;
  affiliation?: string;
  sortModifier?: string;
  /** card subtitle pieces: "{unitTitle} | {role}" (both optional, legacy BiographyCard). */
  subtitleParts: { unitTitle?: string; role?: string };
  headshot: StrapiImagePick | null;
  /** bio markdown rendered + sanitized server-side. */
  bodyHtml: string;
}

function shapeBiography(b: any): Biography {
  const fullName = b.fullName || "";
  const suffix = b.suffix || undefined;
  const unit = b.unit
    ? {
        title: b.unit.title,
        shortName: b.unit.shortName,
        slug: b.unit.slug,
        url: b.unit.url,
      }
    : null;
  return {
    id: String(b.id ?? b.slug),
    slug: b.slug,
    fullName,
    suffix,
    fullNameWithSuffix: suffix ? `${fullName}, ${suffix}` : fullName,
    title: b.title,
    unit,
    affiliation: b.affiliation,
    sortModifier: b.sortModifier,
    subtitleParts: { unitTitle: unit?.title, role: b.title },
    headshot: pickStrapiImage(b.headshot),
    bodyHtml: b.body ? renderToHtml(b.body) : "",
  };
}

// lodash _.orderBy(list, ["sortModifier"], ["asc"]) — sortModifier is a string;
// replicate the default ascending string comparison the legacy lists used.
function bySortModifier(a: Biography, b: Biography): number {
  return String(a.sortModifier ?? "").localeCompare(String(b.sortModifier ?? ""));
}

/** A single biography by slug, live; null when none matches (page 404s). */
export async function getBiography(slug: string): Promise<Biography | null> {
  const { data } = await runQuery(GET_SINGLE_BIOGRAPHY_QUERY, { slug }, "no-cache");
  const b = data?.biographies?.[0];
  return b ? shapeBiography(b) : null;
}

/** All biographies, live, re-sorted by sortModifier asc (legacy Staff.vue). */
export async function getAllBiographies(): Promise<Biography[]> {
  const { data } = await runQuery(GET_ALL_BIOGRAPHIES_QUERY, {}, "no-cache");
  return (data?.biographies ?? []).map(shapeBiography).sort(bySortModifier);
}

/**
 * Biographies for one unit (by unit.shortName, e.g. "FSGU"/"ISU"/"RA"), live.
 * The query sorts lastName:asc but the legacy unit-staff views OVERRIDE that
 * with sortModifier asc — replicated here.
 */
export async function getBiographiesByUnit(shortName: string): Promise<Biography[]> {
  const { data } = await runQuery(
    GET_BIOGRAPHIES_BY_UNIT_QUERY,
    { shortName },
    "no-cache",
  );
  return (data?.biographies ?? []).map(shapeBiography).sort(bySortModifier);
}

// ── Units (/about/units/) ─────────────────────────────────────────
// UnitsSingle + the unit staff pages. FSGU/ISU render summaryHtml; R&A renders
// bodyHtml; UnitsSingle renders bodyHtml + title + url. Staff come from
// getBiographiesByUnit(shortName) (above).
export interface UnitDetail {
  id: string;
  slug: string;
  title: string;
  shortName?: string;
  url?: string;
  summaryHtml: string;
  bodyHtml: string;
}
/** A single unit by slug, live; null when none matches (page 404s). */
export async function getUnit(slug: string): Promise<UnitDetail | null> {
  const { data } = await runQuery(GET_SINGLE_UNIT_QUERY, { slug }, "no-cache");
  const u = data?.units?.[0];
  if (!u) return null;
  return {
    id: String(u.id),
    slug: u.slug,
    title: u.title,
    shortName: u.shortName,
    url: u.url,
    summaryHtml: u.summary ? renderToHtml(u.summary) : "",
    bodyHtml: u.body ? renderToHtml(u.body) : "",
  };
}

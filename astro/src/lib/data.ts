// Server-side data layer — the single entry point Astro pages call.
//
// Each function fetches LIVE from Strapi per request (fetchPolicy "no-cache"),
// runs the body through the markdown + sanitize pipeline server-side, and
// returns plain data the .astro page renders. The full sanitized HTML lands in
// the SSR response (so SiteImprove/axe/Google see real content); freshness is
// governed by the per-route CDN cache (see cache.ts).
import "./server-dom"; // ensure global DOMParser (linkedom) is installed
// @ts-expect-error — gql-client.js is plain JS (ported verbatim)
import { runQuery } from "./gql-client.js";
import { renderToHtml } from "./markdown.js";
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
} from "../graphql/grants.js";
import { GET_SINGLE_PAGE_QUERY } from "../graphql/page.js";

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
  published_at?: string;
  updated_at?: string;
  dateOverride?: string;
  hideSplash?: boolean;
  splash?: StrapiImage | null;
  attachments?: Array<Record<string, unknown>>;
  tags?: Array<{ title: string; slug: string }>;
  [key: string]: unknown;
}

/**
 * Fetch a single news post by slug, live, and render its body server-side.
 * Returns null when no post matches (page should 404).
 */
export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  const { data } = await runQuery(GET_SINGLE_POST_QUERY, { slug }, "no-cache");
  const post = data?.posts?.[0];
  if (!post) return null;
  return {
    ...post,
    safeBodyHtml: post.body ? renderToHtml(post.body) : "",
  } as NewsPost;
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

/** Legacy `dateFormatAlt` filter: dayjs "MMM DD, YYYY" (Chicago) → "May 14, 2026". */
export function dateFormatAlt(iso?: string): string {
  if (!iso) return "";
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
export interface CmsPage {
  title: string;
  hideTitle: boolean;
  summary?: string;
  /** body markdown rendered + sanitized server-side. */
  safeBodyHtml: string;
  showTOC?: boolean;
  attachments: AttachmentItem[];
  tags: string[];
  published_at?: string;
}
/** Fetch a CMS "page" by slug (live) + render its body. null when none matches. */
export async function getPage(slug: string): Promise<CmsPage | null> {
  const { data } = await runQuery(GET_SINGLE_PAGE_QUERY, { slug }, "no-cache");
  const p = data?.pages?.[0];
  if (!p) return null;
  return {
    title: p.title,
    hideTitle: !!p.hideTitle,
    summary: p.summary,
    safeBodyHtml: p.body ? renderToHtml(p.body) : "",
    showTOC: p.showTOC,
    attachments: shapeAttachments(p.attachments),
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

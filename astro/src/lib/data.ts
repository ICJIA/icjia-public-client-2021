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
import { GET_SINGLE_POST_QUERY, GET_ALL_NEWS_QUERY } from "../graphql/news.js";
// @ts-expect-error — GET_HOME from plain-JS graphql module
import { GET_HOME } from "../graphql/home.js";

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
  tags?: Array<{ title: string; slug: string }>;
  splash?: StrapiImage | null;
}

/** Fetch all news posts (newest first), live, for the /news/ listing. */
export async function getAllNews(): Promise<NewsListItem[]> {
  const { data } = await runQuery(GET_ALL_NEWS_QUERY, {}, "no-cache");
  return (data?.posts ?? []) as NewsListItem[];
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

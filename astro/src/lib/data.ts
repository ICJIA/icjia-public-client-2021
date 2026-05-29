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

// Strapi (agency) host — splash URLs come back as /uploads/... relative paths.
const STRAPI_BASE = "https://agency.icjia-api.cloud";

export interface StrapiImage {
  caption?: string;
  alternativeText?: string;
  url?: string;
  formats?: Record<string, unknown>;
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

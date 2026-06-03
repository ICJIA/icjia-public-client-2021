/**
 * News-list shaper — pure, client-safe.
 * CLIENT-SAFE: zero server-only imports (no data.ts, no node:*, no graphql,
 * no linkedom, no markdown, no astro:assets).
 */
import type { StrapiImage, MonthBucket } from "./index";
import { monthBucket } from "./index";
import {
  truncateWords,
  isNew,
  formatNewsDate,
  newsCategoryLabel,
} from "./format";

export type { MonthBucket };

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

// ── NewsRowItem (compact Alpine x-for row shape for NewsListing) ──────────────

/**
 * Compact row shape consumed by NewsListing.astro's Alpine x-for loop.
 * Field names are single-character / short to keep the JSON island small
 * (same naming convention as the build-time listData in NewsListing.astro).
 *
 * NOTE: `img` is the raw splash URL (relative /uploads/... or absolute) —
 * the live-island fetch cannot call astro:assets getImage() client-side.
 * Build-time baseline rows carry pre-optimized URLs from getImage(); live-
 * fetched rows carry the raw Strapi URL. Both are accepted by the <img> tag.
 */
export interface NewsRowItem {
  /** id — required by live-list fetchCollection for de-dupe + signature. */
  id: string;
  /** updatedAt — required by contentSignature for change detection. */
  updatedAt?: string;
  /** path: /news/<slug>/ */
  p: string;
  /** title */
  t: string;
  /** summary truncated to 25 words */
  s: string;
  /** category label uppercased (e.g. "PRESS RELEASE") */
  cl: string;
  /** raw category key (e.g. "pressRelease") */
  c: string;
  /** formatted publication date ("May 05, 2026") */
  d: string;
  /** month bucket key: "this" | "last" | "earlier" */
  b: MonthBucket;
  /** within the NEW! window */
  n: boolean;
  /** raw splash URL (may be relative /uploads/...) or null */
  img: string | null;
}

/**
 * Shape ONE raw Strapi /posts record → the compact NewsRowItem consumed by
 * NewsListing.astro's Alpine x-for loop.
 *
 * Called client-side by the live-island fetch (no astro:assets, no getImage).
 * The `img` field carries the raw Strapi URL; the build-time baseline rows
 * carry pre-optimized URLs — both are accepted by the component's <img> tag.
 */
export function shapeNewsRow(raw: any): NewsRowItem {
  // Derive publicationDate the same way shapeNewsList does.
  const publicationDate =
    raw.dateOverride && raw.dateOverride.length ? raw.dateOverride : raw.published_at;
  // Raw splash URL — may be relative (/uploads/…) or absolute.
  const splashUrl = raw.splash?.url ?? null;
  return {
    id: String(raw.id),
    updatedAt: raw.updated_at ?? raw.updatedAt,
    p: `/news/${raw.slug}/`,
    t: raw.title,
    s: truncateWords(raw.summary, 25),
    cl: newsCategoryLabel(raw.category).toUpperCase(),
    c: raw.category ?? '',
    d: formatNewsDate(publicationDate),
    b: monthBucket(publicationDate),
    n: isNew(publicationDate, 5),
    img: splashUrl,
  };
}

/**
 * Shape raw Strapi posts for a news listing the way News.vue does: flatten
 * tags to title strings, derive publicationDate (dateOverride || published_at)
 * + month bucket, set fullPath, sort newest-first.
 */
export function shapeNewsList(posts: any[]): NewsListItem[] {
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

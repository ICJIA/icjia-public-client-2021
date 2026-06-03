/**
 * News-list shaper — pure, client-safe.
 * CLIENT-SAFE: zero server-only imports (no data.ts, no node:*, no graphql,
 * no linkedom, no markdown, no astro:assets).
 */
import type { StrapiImage, MonthBucket } from "./index";
import { monthBucket } from "./index";

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

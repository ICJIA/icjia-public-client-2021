/**
 * Live-detail PREVIEW registry — the client-side renderer the smart-404 uses to
 * show a brand-new (post-build) CMS record immediately, before the nightly rebuild
 * mints its real static page. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * Keyed by the SAME prefix strings as 404.astro's DETECT array. Each entry shapes
 * the raw Strapi v3 REST record (already fetched by the 404 resolver) and renders
 * it with the type's twin renderer — using the BROWSER markdown pipeline
 * (markdown.client.js), so the body matches the build byte-for-byte.
 *
 * This module is dynamically imported ONLY on a content-detail hit, so a normal
 * 404 never downloads the markdown/sanitizer bundle.
 */
import { renderToHtml } from "../markdown.client.js";
import { shapeMeeting } from "./shapers/meeting";
import { renderMeetingDetail } from "./renderers/meeting";

export interface DetailPreview {
  /** innerHTML for the page's content slot (replaces the 404 body). */
  html: string;
  /** document.title — brand-first convention "ICJIA | <chunk>". */
  title: string;
}

// "ICJIA | <chunk>" — same brand-first convention as BaseLayout's buildTitle.
const brandTitle = (chunk: string) => `ICJIA | ${chunk}`;

type Renderer = (record: any) => DetailPreview;

/** prefix (from 404.astro DETECT) → renderer. Add a type by adding an entry. */
const REGISTRY: Record<string, Renderer> = {
  "/news/meetings/": (rec) => ({
    html: renderMeetingDetail(shapeMeeting(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  // Additional types (news posts, events, researchhub, grants) are registered here
  // as their shaper+renderer pairs land — see docs/LIVE-DETAIL-FALLBACK.md §8.
};

/** Render a fetched record for the matched prefix; null when no renderer exists
 *  yet (the 404 then keeps the "being published" notice instead of a hard 404). */
export function renderDetail(prefix: string, record: any): DetailPreview | null {
  const fn = REGISTRY[prefix];
  if (!fn) return null;
  return fn(record);
}

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
import { renderToHtml, renderInline } from "../markdown.client.js";
import { shapeMeeting } from "./shapers/meeting";
import { renderMeetingDetail } from "./renderers/meeting";
import { shapeGrant } from "./shapers/grant";
import { renderGrantDetail } from "./renderers/grant";
import { shapePost } from "./shapers/post";
import { renderPostDetail } from "./renderers/post";
import { shapeEvent } from "./shapers/event";
import { renderEventDetail } from "./renderers/event";
import { shapeArticle } from "./shapers/article";
import { renderArticleDetail } from "./renderers/article";
import { shapeDataset } from "./shapers/dataset";
import { renderDatasetDetail } from "./renderers/dataset";
import { shapeApp } from "./shapers/app";
import { renderAppDetail } from "./renderers/app";
import { shapePublication } from "./shapers/publication";
import { renderPublicationDetail } from "./renderers/publication";
import { shapeBiography } from "./shapers/biography";
import { renderBiographyDetail } from "./renderers/biography";
import { shapeJob } from "./shapers/job";
import { renderJobDetail } from "./renderers/job";
import { shapeUnit } from "./shapers/unit";
import { renderUnitDetail } from "./renderers/unit";
import { shapeProgram } from "./shapers/program";
import { renderProgramDetail } from "./renderers/program";
import { shapePage } from "./shapers/page";
import { renderPageDetail } from "./renderers/page";

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
  "/grants/funding/": (rec) => ({
    html: renderGrantDetail(shapeGrant(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  // /news/press/ + /news/ both resolve through /news/[slug].astro (same `posts`
  // collection) → one renderer, two keys. Keyed by the prefix the 404 DETECT
  // matched (most-specific-first), so press is distinguished from generic news.
  "/news/press/": (rec) => ({
    html: renderPostDetail(shapePost(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  "/news/": (rec) => ({
    html: renderPostDetail(shapePost(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  // Events use `name` (not `title`) — the build page passes title={event.name}.
  "/events/": (rec) => ({
    html: renderEventDetail(shapeEvent(rec, renderToHtml)),
    title: brandTitle(rec.name),
  }),
  // Researchhub (HUB host; the 404 fetch carries status=published). Titles use `title`.
  "/researchhub/articles/": (rec) => ({
    html: renderArticleDetail(shapeArticle(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  "/researchhub/datasets/": (rec) => ({
    html: renderDatasetDetail(shapeDataset(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  "/researchhub/apps/": (rec) => ({
    html: renderAppDetail(shapeApp(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  // Publications (/about/publications/<slug>) — the list is live (PublicationTable
  // pilot) but detail pages 404'd post-build until this was added.
  "/about/publications/": (rec) => ({
    html: renderPublicationDetail(shapePublication(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  "/grants/programs/": (rec) => ({
    html: renderProgramDetail(shapeProgram(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  "/about/biographies/": (rec) => ({
    html: renderBiographyDetail(shapeBiography(rec, renderToHtml)),
    title: brandTitle(rec.fullName),
  }),
  "/about/employment/": (rec) => ({
    html: renderJobDetail(shapeJob(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  "/about/units/": (rec) => ({
    html: renderUnitDetail(shapeUnit(rec, renderToHtml)),
    title: brandTitle(rec.title),
  }),
  // CMS pages — 4 URL prefixes, one `pages` collection. renderInline for the <h1>
  // title (a block render would emit invalid <h1><p>…</p></h1>).
  "/about/": (rec) => ({
    html: renderPageDetail(shapePage(rec, renderToHtml, renderInline)),
    title: brandTitle(rec.title),
  }),
  "/grants/": (rec) => ({
    html: renderPageDetail(shapePage(rec, renderToHtml, renderInline)),
    title: brandTitle(rec.title),
  }),
  "/irb/": (rec) => ({
    html: renderPageDetail(shapePage(rec, renderToHtml, renderInline)),
    title: brandTitle(rec.title),
  }),
  "/innovation-and-digital-services/": (rec) => ({
    html: renderPageDetail(shapePage(rec, renderToHtml, renderInline)),
    title: brandTitle(rec.title),
  }),
};

/** Render a fetched record for the matched prefix; null when no renderer exists
 *  yet (the 404 then keeps the "being published" notice instead of a hard 404). */
export function renderDetail(prefix: string, record: any): DetailPreview | null {
  const fn = REGISTRY[prefix];
  if (!fn) return null;
  return fn(record);
}

/**
 * News-post DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getNewsPost` SHAPE so the live-detail fallback
 * can render a brand-new (post-build) news post CLIENT-SIDE from the Strapi v3 REST
 * record, byte-identical to the eventual nightly-built page except for the splash
 * image (see docs/LIVE-DETAIL-FALLBACK.md §4). The Strapi REST `?slug=` record and
 * the GraphQL record carry the same fields posts use (category, summary, body,
 * showTOC, dateOverride, published_at/updated_at, hideSplash, splash{} with
 * url/alternativeText/caption, attachmentLabel, attachments[] with
 * url/name/ext/size/updated_at, tags[].title, and the related relations
 * events/meetings/posts/grants/programs/biographies), so the same shaping works on
 * both. Serves BOTH `/news/` and `/news/press/` (same posts collection + renderer).
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The pure helpers below (shapeAttachments / buildRelated /
 * buildToc) are duplicated from data.ts and locked to the originals by
 * shapers/post.test.ts — they cannot silently diverge. The splash image uses
 * imageUrl() (raw Strapi URL): a transient client render can't run astro:assets.
 */
import { niceBytes, dateFormatAlt, strapiUrl } from "./meeting";
import { formatNewsDate, newsCategoryLabel } from "./format";
import { imageUrl } from "../imageUrl";

/** Attachment row (shape of data.ts AttachmentItem). */
export interface AttachmentItem {
  name: string;
  url: string;
  ext: string;
  niceSize: string;
  updatedAlt: string;
}
/** Related link (shape of data.ts RelatedItem). */
export interface RelatedItem {
  displayTitle: string;
  fullPath: string;
}

/** TOC anchor (markdown-it-anchor slug + heading text). */
export interface PostTocItem {
  id: string;
  text: string;
}

/** Resolved splash for the transient client render (raw Strapi URL — §4). */
export interface PostSplash {
  url: string;
  alt: string;
  caption?: string;
}

export interface PostItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  /** markdown body rendered + sanitized via the injected renderToHtml. */
  safeBodyHtml: string;
  showTOC: boolean;
  category?: string;
  /** newsCategoryLabel(category) — the uppercase kicker in the date/category header. */
  catLabel: string;
  /** dateOverride || published_at, formatted "May 05, 2026" (legacy `format`). */
  publicationDate: string;
  hideSplash: boolean;
  /** raw-URL splash (null when absent or hidden). */
  splash: PostSplash | null;
  /** AttachmentList heading ("" → component default "Attachments"). */
  attachmentLabel: string;
  attachments: AttachmentItem[];
  related: RelatedItem[];
  tags: string[];
  /** h2 anchors for the showTOC sidebar. */
  toc: PostTocItem[];
}

// ── pure helpers (duplicated from data.ts; guarded by shapers/post.test.ts) ────

/** Shape Strapi attachments like the legacy AttachmentList: absolute url, niceBytes
 *  size, dateFormatAlt updated, sorted by name asc. (data.ts shapeAttachments). */
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

/** Build the legacy RelatedList: "[Type]: title" → each type's route, sorted by
 *  displayTitle. Handles every relation kind a post may carry. (data.ts buildRelated). */
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

/** Build the legacy Toc from rendered body HTML: every <h2> NOT inside #disclaimer,
 *  in document order, as {id, text}. Uses the global DOMParser (native in the
 *  browser; linkedom shim under build/test). (data.ts buildToc). */
export function buildToc(html: string): PostTocItem[] {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h2"))
      .filter((h2: any) => !h2.closest("#disclaimer"))
      .map((h2: any) => ({
        id: h2.getAttribute("id") || "",
        text: (h2.textContent || "").trim(),
      }))
      .filter((t: PostTocItem) => t.text.length > 0);
  } catch {
    return [];
  }
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi news post (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time getNewsPost does: render+sanitize the body, derive the publication
 * date, flatten tags, shape attachments + related, build the on-page TOC. `render`
 * is the environment's markdown→HTML renderer (markdown.js at build /
 * markdown.client.js in the browser). The splash resolves to the RAW Strapi URL
 * (imageUrl) — the accepted transient deviation (§4).
 */
export function shapePost(p: any, render: (md: string) => string): PostItem {
  const safeBodyHtml = p.body ? render(p.body) : "";
  // legacy getPublicationDate: dateOverride (when non-empty) else published_at.
  const publicationISO =
    p.dateOverride && p.dateOverride.length ? p.dateOverride : p.published_at;
  const hideSplash = !!p.hideSplash;
  const rawSplash = p.splash || null;
  const splashSrc = rawSplash ? imageUrl(rawSplash.url) : null;
  const splash: PostSplash | null =
    splashSrc && !hideSplash
      ? {
          url: splashSrc,
          // Legacy Splash alt precedence: Strapi alternativeText → default.
          alt: rawSplash.alternativeText || "ICJIA Internet news item image",
          caption: rawSplash.caption,
        }
      : null;
  return {
    id: String(p.id),
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    safeBodyHtml,
    showTOC: !!p.showTOC,
    category: p.category,
    catLabel: newsCategoryLabel(p.category),
    publicationDate: formatNewsDate(publicationISO),
    hideSplash,
    splash,
    attachmentLabel: p.attachmentLabel || "",
    attachments: shapeAttachments(p.attachments),
    related: buildRelated(p),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
    toc: buildToc(safeBodyHtml),
  };
}

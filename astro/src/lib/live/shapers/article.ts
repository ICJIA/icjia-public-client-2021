/**
 * ResearchHub ARTICLE detail shaper — pure, client-safe.
 *
 * Reproduces research.ts's build-time `getArticle()` SHAPE so the live-detail
 * fallback can render a brand-new (post-build) HUB article CLIENT-SIDE from the
 * Strapi v3 REST record, byte-identical to the eventual nightly-built page except
 * for the splash hero image (see docs/LIVE-DETAIL-FALLBACK.md §4). The HUB REST
 * `?slug=…&status=published` record and the GraphQL record carry the same fields
 * articles use — verified live against researchhub.icjia-api.cloud/articles:
 *   title, slug, date, external, categories[] , tags[] (string[]), authors[]
 *   ({title,description} JSON), images[] ({title,src base64}), abstract, markdown,
 *   splash/thumbnail (base64 string fields), citation, doi, funding, mainfiletype,
 *   mainfile/extrafile (media objects with hash/ext/url) — so the same shaping works
 *   on both. (Strapi v3 REST returns the media objects + relation arrays inline.)
 *
 * CLIENT-SAFE: zero server-only imports (no research.ts → it pulls gql-client +
 * markdown.js/jsdom; no astro:assets). `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser). The splash uses
 * imageUrl(…, HUB) (raw URL): a transient client render can't run astro:assets —
 * and the hub anyway stores splash as a base64 data-URI, which imageUrl passes
 * through unchanged (a relative /uploads path would absolutize against the HUB host).
 *
 * The pure helpers below (formatResearchDate / isNewResearch / joinAuthors /
 * categoriesArray / hubFileUrl) are DUPLICATED from research.ts — which does NOT
 * export them and cannot be imported here (server-only + banned). They are locked to
 * research.ts's exact behavior by shapers/article.test.ts so they cannot silently
 * diverge from the nightly-built page.
 */
import { HUB } from "../sources";
import { imageUrl } from "../imageUrl";

const HUB_UPLOADS = "https://researchhub.icjia-api.cloud/uploads";
const DAYS_TO_SHOW_NEW_RESEARCH = 10; // research.ts (config.json maps.daysToShowNewResearch)

// ── pure helpers (duplicated from research.ts; guarded by shapers/article.test.ts) ──

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
/** research.ts `formatResearchDate`: full month + zero-padded day + year, for the
 *  date's calendar day adjusted by abs(tz offset) (so a UTC server → "May 22, 2026").
 *  NOTE: distinct from format.ts formatNewsDate (UTC components) — keep duplicated. */
export function formatResearchDate(d?: string): string {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  const target = new Date(t.getTime() + Math.abs(t.getTimezoneOffset() * 60000));
  const pad = (n: number) => (n < 10 ? "0" + n : String(n));
  return `${MONTHS[target.getMonth()]} ${pad(target.getDate())}, ${target.getFullYear()}`;
}

/** research.ts `isNewResearch`: days since `date` ≤ 10. */
export function isNewResearch(date?: string): boolean {
  if (!date) return false;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return false;
  return (Date.now() - then) / 86_400_000 <= DAYS_TO_SHOW_NEW_RESEARCH;
}

/** research.ts `joinAuthors`: Oxford-comma join of author .title values. */
export function joinAuthors(authors?: Array<{ title?: string }>): string {
  if (!Array.isArray(authors)) return "";
  const names = authors.map((a) => a && a.title).filter(Boolean) as string[];
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

const upper = (s: any): string => String(s ?? "").toUpperCase();
/** research.ts `categoriesArray`: array → uppercase each; comma-string → split+upper. */
export function categoriesArray(cats: any): string[] {
  if (Array.isArray(cats)) return cats.map(upper).filter(Boolean);
  if (typeof cats === "string")
    return cats
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map(upper);
  return [];
}

/** research.ts `hubFileUrl`: {HUB_UPLOADS}/{hash}{ext} (null without a hash). */
export function hubFileUrl(file: any): string | null {
  if (!file || !file.hash) return null;
  return `${HUB_UPLOADS}/${file.hash}${file.ext || ""}`;
}

// ── shaped detail (subset of research.ts ResearchArticleDetail that the
//    ArticleView component reads — see src/lib/research.ts for the canonical type). ──
export interface ArticleAuthorBio {
  title?: string;
  description?: string;
}
export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  abstract?: string;
  authors: string;
  date?: string;
  dateLabel: string;
  isNew: boolean;
  categories: string[];
  tags: string[];
  external?: string;
  citation?: string;
  doi?: string;
  funding?: string;
  authorBios: ArticleAuthorBio[];
  /** Same-origin extracted hero file — always null on the transient client render
   *  (the build-only hub-image manifest doesn't exist client-side), so the splash
   *  island path renders instead. */
  imgPath: string | null;
  /** Hero source for the island (raw base64 data-URI / absolutized URL). */
  splash: string | null;
  thumbnail: string | null;
  bodyHtml: string;
  mainFileType?: string;
  mainFileUrl: string | null;
  extraFileUrl: string | null;
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw HUB article (REST `?slug=` OR GraphQL) the way research.ts's
 * build-time getArticle does: append each image as a markdown reference-link def so
 * body refs resolve, then render+sanitize the body; render abstract + citation
 * through the same pipeline; flatten authors/categories/tags; resolve download URLs.
 * `render` is the environment's markdown→HTML renderer (markdown.js at build /
 * markdown.client.js in the browser). Hero resolves to the RAW splash (imageUrl) —
 * the accepted transient deviation (§4); imgPath is null client-side.
 */
export function shapeArticle(a: any, render: (md: string) => string): ArticleItem {
  // research.ts addImages(): append each image as a markdown reference-link def.
  let md = a.markdown || "";
  if (Array.isArray(a.images) && a.images.length) {
    md += a.images.map((i: any) => `\n\n[${i.title}]: ${i.src}`).join("\n");
  }
  return {
    id: String(a.id),
    title: a.title,
    slug: a.slug,
    fullPath: `/researchhub/articles/${a.slug}/`,
    // abstract + citation are rendered with set:html on the detail page → MUST be
    // sanitized like bodyHtml (renderToHtml runs DOMPurify), matching research.ts.
    abstract: a.abstract ? render(a.abstract) : a.abstract,
    authors: joinAuthors(a.authors),
    authorBios: Array.isArray(a.authors)
      ? a.authors.map((x: any) => ({ title: x?.title, description: x?.description }))
      : [],
    date: a.date,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    categories: categoriesArray(a.categories),
    tags: Array.isArray(a.tags) ? a.tags : [],
    external: a.external,
    citation: a.citation ? render(a.citation) : a.citation,
    doi: a.doi,
    funding: a.funding,
    // Transient render: no build manifest → imgPath null, hero comes from the raw
    // splash via the island (imageUrl passes a base64 data-URI through unchanged).
    imgPath: null,
    splash: a.splash ? imageUrl(a.splash, HUB) : null,
    thumbnail: a.thumbnail || null,
    bodyHtml: md ? render(md) : "",
    mainFileType: a.mainfiletype,
    mainFileUrl: hubFileUrl(a.mainfile),
    extraFileUrl: hubFileUrl(a.extrafile),
  };
}

// ── LIGHT list-row shape (live listing) ───────────────────────────────────────

/** research.ts `truncateWordsLocal`: first `max` words + "..." only when longer.
 *  (DUPLICATED — research.ts does not export it; locked by shapers/article.test.ts.) */
export function truncateWordsLocal(str?: string, max = 30): string {
  if (!str) return "";
  const arr = str.trim().split(/\s+/);
  const out = arr.slice(0, max).join(" ");
  return arr.length > max ? out + "..." : out;
}

/** The compact row HubListing.astro renders from #hub-articles-data (rows.map):
 *  { p,t,d,n,te,au,cats,tags,ip,hasImg,slug,contrib }. `id` is required by
 *  fetchCollection (de-dupe). `date` is a NON-RENDERED raw ISO carried only so the
 *  init-swap can re-sort live rows date-desc (REST returns insertion order, not the
 *  baked date:desc). Mirrors research.ts shapeArticleListItem; image is build-time
 *  only → ip:null/hasImg:false for a live (post-build) row (the nightly rebuild
 *  adds it). articles carry `au` (authors); contrib is null. */
export interface HubArticleRow {
  id: string;
  date?: string;
  p: string;
  t: string;
  d: string;
  n: boolean;
  te: string;
  au: string;
  cats: string[];
  tags: string[];
  ip: string | null;
  hasImg: boolean;
  slug: string;
  contrib: null;
}

/** Shape one raw HUB article REST record → the compact HubListing row. */
export function shapeArticleRow(a: any): HubArticleRow {
  return {
    id: String(a.id),
    date: a.date,
    p: `/researchhub/articles/${a.slug}/`,
    t: a.title,
    d: formatResearchDate(a.date),
    n: isNewResearch(a.date),
    te: truncateWordsLocal(a.abstract, 30),
    au: joinAuthors(a.authors),
    cats: categoriesArray(a.categories),
    tags: Array.isArray(a.tags) ? a.tags : [],
    ip: null,
    hasImg: false,
    slug: a.slug,
    contrib: null,
  };
}

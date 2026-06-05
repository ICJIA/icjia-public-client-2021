/**
 * ResearchHub APP detail shaper — pure, client-safe.
 *
 * Reproduces research.ts's build-time `getApp()` SHAPE so the live-detail fallback
 * can render a brand-new (post-build) web-app CLIENT-SIDE from the researchhub
 * Strapi v3 REST record, byte-identical to the eventual nightly-built page except
 * for the image (§4). The Strapi REST `?slug=` record and the GraphQL record carry
 * the same fields apps use (title, slug, date, description, contributors, image,
 * external, categories, tags, url, funding, citation, related datasets[]/
 * articles[]), so the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports (no research.ts / node / astro:assets).
 * `renderToHtml` is INJECTED by the caller (markdown.js at build,
 * markdown.client.js in the browser) so this module never pulls in jsdom — the
 * `citation` field is rendered + sanitized through it exactly as getApp does.
 *
 * IMAGE (§4 deviation): getApp prefers a build-extracted same-origin file
 * (hubImagePath, read from public/hub-images-manifest.json at build) and only falls
 * back to the record's base64 `image` for a NEW app not yet in a build. The
 * live-detail render IS that "not yet built" case AND has no manifest client-side,
 * so `imagePath` is always null here and the raw base64 `image` is used — the
 * established transient-image path. (The app `image` is a base64 data-URI, not a
 * relative /uploads URL, so imageUrl()/astro:assets play no part.)
 *
 * The pure helpers reused here live in shapers/dataset.ts (themselves duplicated
 * from research.ts + behaviourally drift-guarded); the app-specific mapping is
 * locked to getApp by shapers/app.test.ts.
 */
import {
  formatResearchDate,
  truncateBySentence,
  isNewResearch,
  categoriesArray,
  hubRelated,
  type DatasetRelatedItem,
} from "./dataset";
import { safeUrl } from "../safe-url";

export type AppRelatedItem = DatasetRelatedItem;

export interface AppItem {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  description?: string;
  /** 2-sentence teaser (unused by the detail view; kept for shape parity). */
  teaser: string;
  date?: string;
  dateLabel: string;
  isNew: boolean;
  categories: string[];
  tags: string[];
  /** Build-extracted same-origin file path — always null client-side (§4). */
  imagePath?: string | null;
  /** base64 data-URI image from the record (the transient client fallback). */
  image?: string | null;
  contributors?: any;
  external?: string;
  url?: string;
  funding?: string;
  /** citation HTML, rendered + sanitized via the injected renderToHtml. */
  citation?: string;
  related: AppRelatedItem[];
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw researchhub app (REST `?slug=` OR GraphQL) the way research.ts's
 * getApp does: list-item base (date/categories/tags/teaser/contributors) plus
 * external/url(http-guarded)/funding/related + the rendered citation. `render` is
 * the environment's markdown→HTML renderer (markdown.js at build /
 * markdown.client.js in the browser).
 */
export function shapeApp(a: any, render: (md: string) => string): AppItem {
  return {
    id: String(a.id),
    title: a.title,
    slug: a.slug,
    fullPath: `/researchhub/apps/${a.slug}/`,
    description: a.description,
    teaser: truncateBySentence(a.description, 2),
    date: a.date,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    categories: categoriesArray(a.categories),
    tags: Array.isArray(a.tags) ? a.tags : [],
    // No build manifest client-side → always the raw base64 image fallback (§4).
    imagePath: null,
    image: a.image || null,
    // contributors[].url reaches an href (set:html) — scheme-guard each before
    // render (the launch `url` below is already http-guarded; leave it).
    contributors: Array.isArray(a.contributors)
      ? a.contributors.map((c: any) => ({ ...c, url: safeUrl(c.url) }))
      : a.contributors,
    external: a.external,
    // url feeds window.open() in AppView — allow only http(s) so a malicious hub
    // `url` (e.g. javascript:) cannot reach window.open (defense-in-depth), exactly
    // as getApp does.
    url: a.url && /^https?:\/\//i.test(a.url) ? a.url : undefined,
    funding: a.funding,
    // citation is rendered via set:html (InfoBlock) — MUST be DOMPurify-sanitized
    // through the injected renderer, exactly as getApp does.
    citation: a.citation ? render(a.citation) : a.citation,
    related: [
      ...hubRelated(a.datasets, "Dataset", "/researchhub/datasets/"),
      ...hubRelated(a.articles, "Article", "/researchhub/articles/"),
    ],
  };
}

// ── LIGHT list-row shape (live listing) ───────────────────────────────────────

/** The compact row HubListing.astro renders from #hub-apps-data (rows.map):
 *  { p,t,d,n,te,au,cats,tags,ip,hasImg,slug,contrib }. `id` is required by
 *  fetchCollection (de-dupe); `date` is a NON-RENDERED raw ISO carried only so the
 *  init-swap can re-sort live rows date-desc (REST returns insertion order, not the
 *  baked date:desc). Mirrors research.ts shapeAppListItem; the app image
 *  (base64 / build-extracted file) is build-time only → ip:null/hasImg:false for a
 *  live (post-build) row (the nightly rebuild adds it). apps carry `contrib`
 *  (contributors); au is ''. */
export interface HubAppRow {
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
  ip: null;
  hasImg: boolean;
  slug: string;
  contrib: any;
}

/** Shape one raw HUB app REST record → the compact HubListing row. */
export function shapeAppRow(a: any): HubAppRow {
  return {
    id: String(a.id),
    date: a.date,
    p: `/researchhub/apps/${a.slug}/`,
    t: a.title,
    d: formatResearchDate(a.date),
    n: isNewResearch(a.date),
    te: truncateBySentence(a.description, 2),
    au: "",
    cats: categoriesArray(a.categories),
    tags: Array.isArray(a.tags) ? a.tags : [],
    ip: null,
    hasImg: false,
    slug: a.slug,
    contrib: a.contributors ?? null,
  };
}

/**
 * ResearchHub DATASET detail shaper — pure, client-safe.
 *
 * Reproduces research.ts's build-time `getDataset()` SHAPE so the live-detail
 * fallback can render a brand-new (post-build) dataset CLIENT-SIDE from the
 * researchhub Strapi v3 REST record, byte-identical to the eventual nightly-built
 * page (see docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record and the
 * GraphQL record carry the same fields datasets use (title, slug, date,
 * description, external, categories, tags, project, timeperiod, sources, notes,
 * variables, funding, citation, datafile{hash,name,ext,url}, related apps[]/
 * articles[]), so the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports (no research.ts / node / astro:assets).
 * `renderToHtml` is INJECTED by the caller (markdown.js at build,
 * markdown.client.js in the browser) so this module never pulls in jsdom — the
 * `citation` field is rendered + sanitized through it exactly as getDataset does.
 *
 * Image note: datasets have NO splash/thumbnail; the only media is the `datafile`
 * download, whose URL is built from {hash,ext} against the HUB host (hubFileUrl),
 * NOT a relative /uploads path — so imageUrl()/astro:assets play no part here.
 *
 * The pure helpers below are duplicated from research.ts (which does NOT export
 * them) and are locked to those originals by shapers/dataset.test.ts behaviourally
 * (same inputs → same outputs) — they cannot silently diverge.
 */
import { HUB } from "../sources";
import { safeUrl } from "../safe-url";

export interface DatasetRelatedItem {
  displayTitle: string;
  fullPath: string;
}
export interface DatasetItem {
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
  project?: string;
  external?: string;
  timeperiod?: any;
  /** sources with url !== "undefined" (legacy filter). */
  sources: any[];
  notes?: any;
  variables?: any;
  funding?: string;
  /** citation HTML, rendered + sanitized via the injected renderToHtml. */
  citation?: string;
  dataFileUrl: string | null;
  related: DatasetRelatedItem[];
}

// ── pure helpers (duplicated from research.ts; guarded by shapers/dataset.test.ts) ──

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
/** research.ts formatResearchDate: full month + zero-padded day + year, rendered
 *  for the date's UTC calendar day (the legacy filter adds back the tz offset). */
export function formatResearchDate(d?: string): string {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  const target = new Date(t.getTime() + Math.abs(t.getTimezoneOffset() * 60000));
  const pad = (n: number) => (n < 10 ? "0" + n : String(n));
  return `${MONTHS[target.getMonth()]} ${pad(target.getDate())}, ${target.getFullYear()}`;
}

/** research.ts truncateBySentence: first `n` sentences ONLY when strictly more than
 *  `n`; otherwise the full string (no ellipsis). */
export function truncateBySentence(str?: string, n = 2): string {
  if (!str) return "";
  const sentences = str.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > n) {
    return sentences.slice(0, n).join(" ");
  }
  return str;
}

const DAYS_TO_SHOW_NEW_RESEARCH = 10;
/** research.ts isNewResearch: days since `date` ≤ 10. */
export function isNewResearch(date?: string): boolean {
  if (!date) return false;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return false;
  return (Date.now() - then) / 86_400_000 <= DAYS_TO_SHOW_NEW_RESEARCH;
}

const upper = (s: any): string => String(s ?? "").toUpperCase();
/** research.ts categoriesArray: array → uppercase each; comma-string → split + upper. */
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

/** research.ts hubFileUrl: HUB /uploads/{hash}{ext} download link. */
export function hubFileUrl(file: any): string | null {
  if (!file || !file.hash) return null;
  return `${HUB}/uploads/${file.hash}${file.ext || ""}`;
}

/** research.ts hubRelated: "[Type]: title" → route, sorted by displayTitle. */
export function hubRelated(
  arr: any,
  type: string,
  base: string,
): DatasetRelatedItem[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((e) => e && e.slug)
    .map((e) => ({ displayTitle: `[${type}]: ${e.title}`, fullPath: `${base}${e.slug}/` }))
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw researchhub dataset (REST `?slug=` OR GraphQL) the way
 * research.ts's getDataset does: list-item base (date/categories/tags/teaser) plus
 * external/timeperiod/sources(filtered)/notes/variables/funding/related + the
 * rendered citation + datafile URL. `render` is the environment's markdown→HTML
 * renderer (markdown.js at build / markdown.client.js in the browser).
 */
export function shapeDataset(d: any, render: (md: string) => string): DatasetItem {
  const sources = Array.isArray(d.sources)
    ? d.sources
        .filter((s: any) => s && s.url !== "undefined")
        // sources[].url reaches an href (set:html) — scheme-guard each before
        // render, but ONLY when a url exists: safeUrl('') → '#' would turn a
        // url-less (text-only) source into a dead '#' link (2026-06-10 audit).
        .map((s: any) => (s.url ? { ...s, url: safeUrl(s.url) } : { ...s }))
    : [];
  return {
    id: String(d.id),
    title: d.title,
    slug: d.slug,
    fullPath: `/researchhub/datasets/${d.slug}/`,
    description: d.description,
    teaser: truncateBySentence(d.description, 2),
    date: d.date,
    dateLabel: formatResearchDate(d.date),
    isNew: isNewResearch(d.date),
    categories: categoriesArray(d.categories),
    tags: Array.isArray(d.tags) ? d.tags : [],
    project: d.project,
    external: d.external,
    timeperiod: d.timeperiod,
    sources,
    notes: d.notes,
    variables: d.variables,
    funding: d.funding,
    // citation is rendered via set:html (InfoBlock) — MUST be DOMPurify-sanitized
    // through the injected renderer, exactly as getDataset does (raw hub HTML
    // otherwise = stored XSS).
    citation: d.citation ? render(d.citation) : d.citation,
    dataFileUrl: hubFileUrl(d.datafile),
    related: [
      ...hubRelated(d.apps, "App", "/researchhub/apps/"),
      ...hubRelated(d.articles, "Article", "/researchhub/articles/"),
    ],
  };
}

// ── LIGHT list-row shape (live listing) ───────────────────────────────────────

/** The compact row HubListing.astro renders from #hub-datasets-data (rows.map):
 *  { p,t,d,n,te,au,cats,tags,ip,hasImg,slug,contrib }. `id` is required by
 *  fetchCollection (de-dupe); `date` is a NON-RENDERED raw ISO carried only so the
 *  init-swap can re-sort live rows date-desc (REST returns insertion order, not the
 *  baked date:desc). Mirrors research.ts shapeDatasetListItem; datasets have no
 *  image (ip:null/hasImg:false) and carry neither authors nor contributors
 *  (au:''/contrib:null). */
export interface HubDatasetRow {
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
  contrib: null;
}

/** Shape one raw HUB dataset REST record → the compact HubListing row. */
export function shapeDatasetRow(d: any): HubDatasetRow {
  return {
    id: String(d.id),
    date: d.date,
    p: `/researchhub/datasets/${d.slug}/`,
    t: d.title,
    d: formatResearchDate(d.date),
    n: isNewResearch(d.date),
    te: truncateBySentence(d.description, 2),
    au: "",
    cats: categoriesArray(d.categories),
    tags: Array.isArray(d.tags) ? d.tags : [],
    ip: null,
    hasImg: false,
    slug: d.slug,
    contrib: null,
  };
}

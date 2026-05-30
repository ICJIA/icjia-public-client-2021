// ResearchHub data layer for the home "Latest Research" strip.
//
// This is the SECOND Strapi (researchhub.icjia-api.cloud) — a separate GraphQL
// schema. The legacy HomeResearch.vue fetched it CLIENT-SIDE in mounted() via a
// plain axios call (src/services/ResearchHub.js), bypassing the gql-client's
// deepSanitize afterware. We reproduce that faithfully: a plain server-side
// fetch (no deepSanitize), exposed through a same-origin SSR JSON endpoint
// (src/pages/api/home-research.json.ts) that the home page fetches AFTER load.
//
// Why not inline this in the home SSR HTML: the hub stores splash/app images as
// base64 data-URIs in the GraphQL response (49KB–674KB each) — inlining 3
// articles + 3 apps would add ~2MB to the home response and sink mobile perf.
// The legacy never pays that on initial load (it fetches client-side, below the
// fold). The same-origin endpoint keeps the initial HTML lean, avoids a browser
// CORS dependency on the hub, and is edge-cacheable.

// @ts-expect-error — gql-client.js is plain JS (ported verbatim)
import { runQuery } from "./gql-client.js";
import { renderToHtml } from "./markdown.js";

// Build-time hub-image manifest: the set of "<id>-<attr>" keys that have a real
// extracted file under /hub-images/ (written by scripts/generate-hub-images.mjs
// at prebuild). Loaded once. If a record's image IS stored, cards reference the
// same-origin file (fast, cached, no base64 in the response); if NOT (e.g. an
// article published AFTER the last build), the data layer keeps the base64 so the
// card still shows an image — "only fetch/use base64 if not stored", live-safe.
// Import is static + optional: missing manifest (first build) → empty set.
let HUB_IMG_MANIFEST: Record<string, string> = {};
try {
  const m = await import("../../public/hub-images-manifest.json", { with: { type: "json" } });
  HUB_IMG_MANIFEST = (m.default as Record<string, string>) || {};
} catch {
  HUB_IMG_MANIFEST = {};
}
/** Stored same-origin path for a hub image if extracted at build, else null.
 *  Uses the manifest's exact filename (correct extension — jpeg/png vary). */
export function hubImagePath(id: string, attr: "splash" | "thumbnail" | "image"): string | null {
  const file = HUB_IMG_MANIFEST[`${id}-${attr}`];
  return file ? `/hub-images/${file}` : null;
}
import {
  GET_ARTICLE_COUNT_QUERY,
  GET_ARTICLE_GROUP_QUERY,
  GET_ALL_DATASETS_QUERY,
  GET_ALL_APPS_QUERY,
  GET_HUB_SINGLE_ARTICLE_QUERY,
  GET_HUB_SINGLE_DATASET_QUERY,
  GET_HUB_SINGLE_APP_QUERY,
  GET_HUB_HOME_BANNER_ARTICLES,
} from "../graphql/hub.js";

const HUB_GRAPHQL = "https://researchhub.icjia-api.cloud/graphql";
const HUB_UPLOADS = "https://researchhub.icjia-api.cloud/uploads";
const TIMEOUT_MS = 8000;
const DAYS_TO_SHOW_NEW_RESEARCH = 10; // config.json maps.daysToShowNewResearch

// ── text helpers (ported verbatim from src/filters.js) ──────────────────────

/** `format` filter: full month + zero-padded day + year, rendered for the
 *  date's UTC calendar day (the filter adds back the tz offset). On Netlify
 *  functions (UTC) the offset is 0, so a "2026-05-22T00:00:00.000Z" date →
 *  "May 22, 2026". */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function formatResearchDate(d?: string): string {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  const target = new Date(t.getTime() + Math.abs(t.getTimezoneOffset() * 60000));
  const pad = (n: number) => (n < 10 ? "0" + n : String(n));
  return `${MONTHS[target.getMonth()]} ${pad(target.getDate())}, ${target.getFullYear()}`;
}

/** `truncateBySentence` filter: first `n` sentences ONLY when there are strictly
 *  more than `n`; otherwise the full string. moreText is "" (no ellipsis). */
function truncateBySentence(str?: string, n = 2): string {
  if (!str) return "";
  const sentences = str.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > n) {
    return sentences.slice(0, n).join(" ");
  }
  return str;
}

/** `arrford(authors.map(a => a.title))` — Oxford-comma join. */
function joinAuthors(authors?: Array<{ title?: string }>): string {
  if (!Array.isArray(authors)) return "";
  const names = authors.map((a) => a && a.title).filter(Boolean) as string[];
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** isItNew: days since `date` ≤ daysToShowNewResearch (10). */
function isNewResearch(date?: string): boolean {
  if (!date) return false;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return false;
  // FROZEN-CLOCK NOTE: request-time on the server; VR freezes the browser clock
  // only — the "NEW!" chip is a VR mask candidate.
  return (Date.now() - then) / 86_400_000 <= DAYS_TO_SHOW_NEW_RESEARCH;
}

// ── hub fetch (plain fetch, no deepSanitize — matches ResearchHub.js) ────────

async function hubQuery(query: string, variables?: any): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(HUB_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variables ? { query, variables } : { query }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null; // hub down → section degrades to empty, like the legacy
  } finally {
    clearTimeout(timer);
  }
}

// Home-strip queries (limit 3 each), ported from src/services/ResearchHub.js.
// Only the fields the card renders are selected (keeps the JSON lean).
const ARTICLES_Q = `{ articles(sort: "date:desc", limit: 3, where: { status: "published", hideFromBanner_ne: true }) { id title slug splash abstract authors date } }`;
const APPS_Q = `{ apps(sort: "date:desc", limit: 3, where: { status: "published" }) { id title slug image description date } }`;
const DATASETS_Q = `{ datasets(sort: "date:desc", limit: 3, where: { status: "published" }) { title slug description date } }`;

export interface ResearchCard {
  title: string;
  fullPath: string;
  dateLabel: string;
  isNew: boolean;
  teaser: string;
  authors?: string;
  img?: string | null;
}

export interface HomeResearchData {
  articles: ResearchCard[];
  apps: ResearchCard[];
  datasets: ResearchCard[];
}

/** Fetch + shape the home Research strip, live. Mirrors HomeResearch.vue. */
export async function getHomeResearch(): Promise<HomeResearchData> {
  const [art, app, ds] = await Promise.all([
    hubQuery(ARTICLES_Q),
    hubQuery(APPS_Q),
    hubQuery(DATASETS_Q),
  ]);

  // img: prefer the build-time-extracted same-origin file (no base64 in the
  // response → big payload/latency win); fall back to the live base64 ONLY when
  // the record wasn't in the last build (a new post) — "use base64 if not stored".
  const articles: ResearchCard[] = (art?.articles ?? []).map((a: any) => ({
    title: a.title,
    fullPath: `/researchhub/articles/${a.slug}/`,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    authors: joinAuthors(a.authors),
    teaser: truncateBySentence(a.abstract, 2),
    // Card image is ~370×250 (object-fit:cover), so the 300×300 thumbnail is too
    // small (soft). Use full-size splash (1297×734); thumbnail/base64 only fall back.
    img: hubImagePath(String(a.id), "splash") || hubImagePath(String(a.id), "thumbnail") || a.splash || null,
  }));

  const apps: ResearchCard[] = (app?.apps ?? []).map((a: any) => ({
    title: a.title,
    fullPath: `/researchhub/apps/${a.slug}/`,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    teaser: truncateBySentence(a.description, 2),
    img: hubImagePath(String(a.id), "image") || a.image || null,
  }));

  const datasets: ResearchCard[] = (ds?.datasets ?? []).map((d: any) => ({
    title: d.title,
    fullPath: `/researchhub/datasets/${d.slug}/`,
    dateLabel: formatResearchDate(d.date),
    isNew: isNewResearch(d.date),
    teaser: truncateBySentence(d.description, 2),
    img: null, // datasets have no image in the legacy card
  }));

  return { articles, apps, datasets };
}

// ════════════════════════════════════════════════════════════════════════════
// ResearchHub LIST + DETAIL data layer (/researchhub/{articles,datasets,apps})
//
// FIDELITY (matches the legacy Vue hub views, NOT the home strip above):
//   - LISTS + COUNT + BANNER go through gql-client runQuery(...,HUB_GRAPHQL),
//     which applies deepSanitize — exactly what Apollo's sanitizeLink did for
//     the legacy ArticlesAll/DatasetsAll/AppsAll views (they passed
//     context:{uri: <hub>}). Parameterized $slug/$limit queries from
//     ../graphql/hub.js.
//   - DETAIL goes through the raw hubQuery() (NO deepSanitize) and renders the
//     body via markdown.js renderToHtml — which already runs contentSanitizer.
//     The legacy single views (ArticlesSingle etc.) used a raw axios POST +
//     renderToHtml, so deepSanitize must NOT also run (no double-sanitize).
//
// base64 IMAGES: splash/thumbnail/image come back as data-URI strings. They are
// returned AS DATA (img/splash/thumbnail) — section agents emit them in a JSON
// island or a lazy <img>, NOT inlined into SSR HTML (keeps the response lean).
// ════════════════════════════════════════════════════════════════════════════

/** first `max` words, "..." appended when truncated (data.ts truncateWords parity). */
function truncateWordsLocal(str?: string, max = 30): string {
  if (!str) return "";
  const arr = str.trim().split(/\s+/);
  const out = arr.slice(0, max).join(" ");
  return arr.length > max ? out + "..." : out;
}

const upper = (s: any): string => String(s ?? "").toUpperCase();
// article.categories is a raw array → uppercase each; dataset/app.categories is
// a comma/format string in the legacy cards → split + join uppercased.
function categoriesArray(cats: any): string[] {
  if (Array.isArray(cats)) return cats.map(upper).filter(Boolean);
  if (typeof cats === "string")
    return cats
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map(upper);
  return [];
}
// hub download URL: https://researchhub.icjia-api.cloud/uploads/{hash}{ext}
function hubFileUrl(file: any): string | null {
  if (!file || !file.hash) return null;
  return `${HUB_UPLOADS}/${file.hash}${file.ext || ""}`;
}
function hubRelated(arr: any, type: string, base: string) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((e) => e && e.slug)
    .map((e) => ({ displayTitle: `[${type}]: ${e.title}`, fullPath: `${base}${e.slug}/` }))
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
}

// ── Articles ────────────────────────────────────────────────────────────────
export interface ResearchArticleListItem {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  abstract?: string;
  /** 30-word grid teaser. */
  teaser: string;
  authors: string;
  date?: string;
  dateLabel: string;
  isNew: boolean;
  categories: string[];
  tags: string[];
  /** Legacy ArticlesAll convention thumbnail: /images/<id>-splash.jpeg (served
   *  from icjia.illinois.gov). Not every article has one — the card hides it on
   *  load error (mirrors legacy errorHandler/imageOK). Same-origin in prod. */
  imagePath: string;
}
function shapeArticleListItem(a: any): ResearchArticleListItem {
  return {
    id: String(a.id),
    title: a.title,
    slug: a.slug,
    fullPath: `/researchhub/articles/${a.slug}/`,
    abstract: a.abstract,
    teaser: truncateWordsLocal(a.abstract, 30),
    authors: joinAuthors(a.authors),
    date: a.date,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    categories: categoriesArray(a.categories),
    tags: Array.isArray(a.tags) ? a.tags : [],
    // Prefer the build-time-extracted same-origin file; if this article wasn't in
    // the last build (new post) fall back to the prod convention URL. Both hide on
    // error (not every article has an image). Same-origin is faster + cutover-safe.
    imagePath:
      hubImagePath(String(a.id), "splash") ||
      `https://icjia.illinois.gov/images/${String(a.id)}-splash.jpeg`,
  };
}

/** All published articles (date desc), live, for /researchhub/articles/ (client Load-more). */
export async function getAllArticles(): Promise<ResearchArticleListItem[]> {
  const countRes = await runQuery(GET_ARTICLE_COUNT_QUERY, {}, "no-cache", HUB_GRAPHQL);
  const count = Number(
    countRes?.data?.articlesConnection?.aggregate?.count ?? 0,
  );
  if (!count) return [];
  const { data } = await runQuery(
    GET_ARTICLE_GROUP_QUERY,
    { articleLimit: count, start: 0 },
    "no-cache",
    HUB_GRAPHQL,
  );
  return (data?.articles ?? []).map(shapeArticleListItem);
}

export interface ResearchArticleDetail {
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
  /** DOI URL appended to the citation InfoBlock (legacy article.doi). */
  doi?: string;
  funding?: string;
  /** Same-origin extracted hero file (full-size splash) when stored at build —
   *  preferred; the detail hero renders this directly (no base64 island). */
  imgPath?: string | null;
  /** base64 data-URI fallback (only when imgPath is null — new post). */
  splash?: string | null;
  thumbnail?: string | null;
  /** body markdown rendered + sanitized server-side (images appended as refs). */
  bodyHtml: string;
  mainFileType?: string;
  mainFileUrl: string | null;
  extraFileUrl: string | null;
}
/** A single article by slug, live; null when none matches (page 404s). */
export async function getArticle(slug: string): Promise<ResearchArticleDetail | null> {
  const data = await hubQuery(GET_HUB_SINGLE_ARTICLE_QUERY(slug));
  const a = data?.articles?.[0];
  if (!a) return null;
  // legacy addImages(): append each image as a markdown reference-link def so
  // body references resolve, then render (markdown.js sanitizes).
  let md = a.markdown || "";
  if (Array.isArray(a.images) && a.images.length) {
    md += a.images.map((i: any) => `\n\n[${i.title}]: ${i.src}`).join("\n");
  }
  return {
    id: String(a.id),
    title: a.title,
    slug: a.slug,
    fullPath: `/researchhub/articles/${a.slug}/`,
    abstract: a.abstract,
    authors: joinAuthors(a.authors),
    date: a.date,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    categories: categoriesArray(a.categories),
    tags: Array.isArray(a.tags) ? a.tags : [],
    external: a.external,
    citation: a.citation,
    doi: a.doi,
    funding: a.funding,
    // Hero: prefer the extracted full-size splash file; base64 only for new posts.
    imgPath: hubImagePath(String(a.id), "splash") || null,
    splash: hubImagePath(String(a.id), "splash") ? null : a.splash || null,
    thumbnail: a.thumbnail || null,
    bodyHtml: md ? renderToHtml(md) : "",
    mainFileType: a.mainfiletype,
    mainFileUrl: hubFileUrl(a.mainfile),
    extraFileUrl: hubFileUrl(a.extrafile),
  };
}

// ── Datasets ──────────────────────────────────────────────────────────────
export interface ResearchDatasetListItem {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  description?: string;
  teaser: string;
  date?: string;
  dateLabel: string;
  isNew: boolean;
  categories: string[];
  tags: string[];
  project?: string;
}
function shapeDatasetListItem(d: any): ResearchDatasetListItem {
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
  };
}
/** All published datasets (date desc), live, for /researchhub/datasets/. */
export async function getAllDatasets(): Promise<ResearchDatasetListItem[]> {
  const { data } = await runQuery(GET_ALL_DATASETS_QUERY, {}, "no-cache", HUB_GRAPHQL);
  return (data?.datasets ?? []).map(shapeDatasetListItem);
}

export interface ResearchDatasetDetail extends ResearchDatasetListItem {
  external?: string;
  timeperiod?: string;
  /** sources with url !== "undefined" (legacy filter). */
  sources: any[];
  notes?: string;
  /** variables table rows (raw passthrough). */
  variables?: any;
  funding?: string;
  citation?: string;
  dataFileUrl: string | null;
  related: Array<{ displayTitle: string; fullPath: string }>;
}
/** A single dataset by slug, live; null when none matches (page 404s). */
export async function getDataset(slug: string): Promise<ResearchDatasetDetail | null> {
  const data = await hubQuery(GET_HUB_SINGLE_DATASET_QUERY(slug));
  const d = data?.datasets?.[0];
  if (!d) return null;
  const sources = Array.isArray(d.sources)
    ? d.sources.filter((s: any) => s && s.url !== "undefined")
    : [];
  return {
    ...shapeDatasetListItem(d),
    external: d.external,
    timeperiod: d.timeperiod,
    sources,
    notes: d.notes,
    variables: d.variables,
    funding: d.funding,
    citation: d.citation,
    dataFileUrl: hubFileUrl(d.datafile),
    related: [
      ...hubRelated(d.apps, "App", "/researchhub/apps/"),
      ...hubRelated(d.articles, "Article", "/researchhub/articles/"),
    ],
  };
}

// ── Apps ──────────────────────────────────────────────────────────────────
export interface ResearchAppListItem {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  description?: string;
  teaser: string;
  date?: string;
  dateLabel: string;
  isNew: boolean;
  categories: string[];
  tags: string[];
  /** Same-origin extracted file path when stored at build (preferred). */
  imagePath?: string | null;
  /** base64 data-URI fallback (only when imagePath is null — new post). */
  image?: string | null;
  contributors?: any;
}
function shapeAppListItem(a: any): ResearchAppListItem {
  const imagePath = hubImagePath(String(a.id), "image");
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
    imagePath: imagePath || null,
    // Drop heavy base64 when we have a file path (keeps the island tiny).
    image: imagePath ? null : a.image || null,
    contributors: a.contributors,
  };
}
/** All published apps (date desc), live, for /researchhub/apps/. */
export async function getAllApps(): Promise<ResearchAppListItem[]> {
  const { data } = await runQuery(GET_ALL_APPS_QUERY, {}, "no-cache", HUB_GRAPHQL);
  return (data?.apps ?? []).map(shapeAppListItem);
}

export interface ResearchAppDetail extends ResearchAppListItem {
  external?: string;
  url?: string;
  funding?: string;
  citation?: string;
  related: Array<{ displayTitle: string; fullPath: string }>;
}
/** A single app by slug, live; null when none matches (page 404s). */
export async function getApp(slug: string): Promise<ResearchAppDetail | null> {
  const data = await hubQuery(GET_HUB_SINGLE_APP_QUERY(slug));
  const a = data?.apps?.[0];
  if (!a) return null;
  return {
    ...shapeAppListItem(a),
    external: a.external,
    url: a.url,
    funding: a.funding,
    citation: a.citation,
    related: [
      ...hubRelated(a.datasets, "Dataset", "/researchhub/datasets/"),
      ...hubRelated(a.articles, "Article", "/researchhub/articles/"),
    ],
  };
}

// ── Hub home banner ─────────────────────────────────────────────────────────
export interface HubBannerArticle {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  abstract?: string;
  authors: string;
  date?: string;
  dateLabel: string;
  /** Same-origin extracted file path when stored at build (preferred — tiny URL,
   *  cached, no base64 in the island). Null for records added after the last build. */
  imgPath?: string | null;
  /** base64 data-URI fallback (only used when imgPath is null — new post). */
  splash?: string | null;
  thumbnail?: string | null;
}
/** Hub-home carousel: latest `limit` published, hideFromBanner != true. */
export async function getHubBannerArticles(limit = 5): Promise<HubBannerArticle[]> {
  const { data } = await runQuery(
    GET_HUB_HOME_BANNER_ARTICLES,
    { limit },
    "no-cache",
    HUB_GRAPHQL,
  );
  return (data?.articles ?? []).map((a: any) => {
    const id = String(a.id);
    // The carousel is a 650px hero, so use the FULL-SIZE splash (1297×734, ~77KB
    // as an extracted file) — the thumbnail (300×300) looked pixelated stretched
    // to 650px. The base64-weight concern that once justified the thumbnail is
    // moot now these are real lazy-loaded files. Fall back to thumbnail only if no
    // splash was extracted, then base64 for brand-new posts.
    const imgPath = hubImagePath(id, "splash") || hubImagePath(id, "thumbnail");
    return {
      id,
      title: a.title,
      slug: a.slug,
      fullPath: `/researchhub/articles/${a.slug}/`,
      abstract: a.abstract,
      authors: joinAuthors(a.authors),
      date: a.date,
      dateLabel: formatResearchDate(a.date),
      imgPath: imgPath || null,
      // Drop the heavy base64 when we have a file path (keeps the island tiny).
      splash: imgPath ? null : a.splash || null,
      thumbnail: imgPath ? null : a.thumbnail || null,
    };
  });
}

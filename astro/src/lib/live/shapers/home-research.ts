/**
 * Home "Latest Research" strip card shaper — pure, client-safe.
 *
 * Reproduces research.ts's build-time `getHomeResearch()` CARD shape so the live
 * HomeResearch island can render the top-3 articles / apps / datasets CLIENT-SIDE
 * from raw researchhub Strapi v3 REST records, in place of the stale build-time
 * /api/home-research.json snapshot. Card fields match ResearchCard exactly:
 *   { title, fullPath, dateLabel, isNew, teaser, authors?, img? }
 *
 * CLIENT-SAFE: zero server-only imports. Reuses the already drift-guarded research
 * helpers re-exported from the dataset/article shapers (formatResearchDate,
 * isNewResearch, truncateBySentence, joinAuthors) — no markdown renderer is needed
 * (every card field is plain text).
 *
 * IMAGE note: getHomeResearch prefers a build-extracted same-origin file
 * (hubImagePath, read from the build-only manifest) and falls back to the record's
 * base64 splash/image only for a NOT-YET-BUILT record. The live island IS that
 * "not built / no manifest client-side" case, so `img` is the raw base64 data-URI
 * (articles → splash, apps → image, datasets → null). base64 is acceptable here:
 * the strip fetches AFTER page load (same as the legacy mounted()), so the ~2MB of
 * hub base64 never touches the initial HTML / LCP.
 */
import {
  formatResearchDate,
  isNewResearch,
  truncateBySentence,
} from "./dataset";
import { joinAuthors } from "./article";

export interface HomeResearchCard {
  title: string;
  fullPath: string;
  dateLabel: string;
  isNew: boolean;
  teaser: string;
  authors?: string;
  img?: string | null;
}

export interface HomeResearchData {
  articles: HomeResearchCard[];
  apps: HomeResearchCard[];
  datasets: HomeResearchCard[];
}

/** Newest-first by raw ISO `date`, then top-3 (REST returns insertion order, not
 *  the GraphQL date:desc the build snapshot used). */
function topThree<T extends { date?: string }>(rows: T[] | null): T[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 3);
}

/** Shape one raw HUB article REST record → home strip card (research.ts getHomeResearch). */
export function shapeHomeArticleCard(a: any): HomeResearchCard {
  return {
    title: a.title,
    fullPath: `/researchhub/articles/${a.slug}/`,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    authors: joinAuthors(a.authors),
    teaser: truncateBySentence(a.abstract, 2),
    // No build manifest client-side → raw base64 splash data-URI (the live fallback).
    img: a.splash || null,
  };
}

/** Shape one raw HUB app REST record → home strip card. */
export function shapeHomeAppCard(a: any): HomeResearchCard {
  return {
    title: a.title,
    fullPath: `/researchhub/apps/${a.slug}/`,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    teaser: truncateBySentence(a.description, 2),
    img: a.image || null,
  };
}

/** Shape one raw HUB dataset REST record → home strip card (no image, per the legacy). */
export function shapeHomeDatasetCard(d: any): HomeResearchCard {
  return {
    title: d.title,
    fullPath: `/researchhub/datasets/${d.slug}/`,
    dateLabel: formatResearchDate(d.date),
    isNew: isNewResearch(d.date),
    teaser: truncateBySentence(d.description, 2),
    img: null,
  };
}

/** Assemble the home strip payload from the three raw HUB record sets (each the full
 *  published collection from fetchCollection): sort date-desc + top-3 + shape. */
export function shapeHomeResearch(
  articles: any[] | null,
  apps: any[] | null,
  datasets: any[] | null,
): HomeResearchData {
  return {
    articles: topThree(articles).map(shapeHomeArticleCard),
    apps: topThree(apps).map(shapeHomeAppCard),
    datasets: topThree(datasets).map(shapeHomeDatasetCard),
  };
}

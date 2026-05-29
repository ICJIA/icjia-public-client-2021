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

const HUB_GRAPHQL = "https://researchhub.icjia-api.cloud/graphql";
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

async function hubQuery(query: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(HUB_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
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
const ARTICLES_Q = `{ articles(sort: "date:desc", limit: 3, where: { status: "published", hideFromBanner_ne: true }) { title slug splash abstract authors date } }`;
const APPS_Q = `{ apps(sort: "date:desc", limit: 3, where: { status: "published" }) { title slug image description date } }`;
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

  const articles: ResearchCard[] = (art?.articles ?? []).map((a: any) => ({
    title: a.title,
    fullPath: `/researchhub/articles/${a.slug}/`,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    authors: joinAuthors(a.authors),
    teaser: truncateBySentence(a.abstract, 2),
    img: a.splash || null,
  }));

  const apps: ResearchCard[] = (app?.apps ?? []).map((a: any) => ({
    title: a.title,
    fullPath: `/researchhub/apps/${a.slug}/`,
    dateLabel: formatResearchDate(a.date),
    isNew: isNewResearch(a.date),
    teaser: truncateBySentence(a.description, 2),
    img: a.image || null,
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

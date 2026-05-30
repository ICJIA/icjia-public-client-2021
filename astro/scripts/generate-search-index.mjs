// Build-time content index — ports the legacy generators/ pipeline
// (generateIndex*.js + searchIndexAndSitemap.js) into ONE self-contained prebuild
// step. It fetches every public content type ONCE and emits BOTH artifacts that
// derive from the same enumeration:
//
//   public/searchIndex.json  → the Fuse index the /search worker loads (Phase 4d)
//   public/sitemap.xml       → trailing-slash sitemap, prod origin (Phase 4c SEO)
//
// Splitting these into two scripts would double-fetch ~12 Strapi endpoints at
// build; the legacy code combined them for exactly this reason.
//
// SECURITY (SEC-12/13): searchMeta is purified of staff names before it is written
// (CMS editors stuff staff names into searchMeta so pages surface on name searches;
// shipping that JSON leaks an internal personnel roster usable for spear-phishing).
// Biographies are the PUBLIC roster and are deliberately NOT purified.
//
// Robust by design: each type is fetched independently (Promise.allSettled). A
// single failed type is logged loudly and dropped from THIS build's artifacts; a
// TOTAL failure (zero records) leaves the existing files untouched (last-known-good)
// and exits 0 so a transient Strapi outage never ships an empty sitemap/index or
// fails the build.
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { site } from "../icjia.config.mjs";

const AGENCY = process.env.PUBLIC_STRAPI_GRAPHQL || `${site.strapiHost}/graphql`;
const AGENCY_REST = process.env.PUBLIC_STRAPI_REST || site.strapiHost;
const HUB = process.env.PUBLIC_HUB_GRAPHQL || `${site.hubHost}/graphql`;
const ORIGIN = site.origin;

const OUT_INDEX = new URL("../public/searchIndex.json", import.meta.url);
const OUT_SITEMAP = new URL("../public/sitemap.xml", import.meta.url);

const RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postGraphQL(endpoint, query) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 200)}`);
      return json.data;
    } catch (e) {
      if (attempt < RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      } else {
        throw new Error(`${endpoint} failed after ${RETRIES} tries: ${e.message}`);
      }
    }
  }
}

async function getJSON(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt < RETRIES) await sleep(RETRY_DELAY_MS * attempt);
      else throw new Error(`${url} failed after ${RETRIES} tries: ${e.message}`);
    }
  }
}

// tags { title slug } relation → flat string array + keep originals as tagsAlt
// (the Fuse config searches both `tags` and `tagsAlt.title`). Mirrors getUnifiedTags.
function unifyTags(arr) {
  for (const item of arr) {
    if (item.tagsAlt && item.tagsAlt.length) continue;
    if (item.tags && item.tags.length > 0) {
      item.tagsAlt = item.tags;
      item.tags = Object.values(item.tags).map((t) => t.title);
    }
  }
  return arr;
}

// ── Per-type fetchers (each mirrors a legacy generators/generateIndex*.js) ──

async function fetchPosts() {
  const q = `query { posts { id title created_at updated_at slug summary category searchMeta published_at dateOverride tags { title slug } splash { name caption alternativeText url formats } } }`;
  const posts = unifyTags((await postGraphQL(AGENCY, q)).posts || []);
  return posts.map((p) => ({
    ...p,
    altTitle: p.title?.toLowerCase(),
    fullPath: `/news/${p.slug}/`,
    imagePath: p.splash ? `${site.strapiHost}${p.splash.url}` : null,
    displayCategory: p.category,
    contentType: "news",
    publicationDate: p.dateOverride && p.dateOverride.length ? p.dateOverride : p.published_at,
  }));
}

async function fetchEvents() {
  const q = `query { events(sort: "start:asc") { id created_at updated_at published_at title: name start end timed summary category searchMeta slug tags { title slug } } }`;
  const events = unifyTags((await postGraphQL(AGENCY, q)).events || []);
  return events.map((e) => ({
    ...e,
    altTitle: e.title?.toLowerCase(),
    fullPath: `/events/${e.slug}/`,
    imagePath: null,
    contentType: "event",
  }));
}

async function fetchUnits() {
  const q = `query { units { title id slug summary shortName searchMeta url published_at tags { title slug } } }`;
  const units = unifyTags((await postGraphQL(AGENCY, q)).units || []);
  return units.map((u) => ({
    ...u,
    fullPath: `/about/units/${u.slug}/`,
    altTitle: u.title?.toLowerCase(),
    imagePath: null,
    contentType: "unit",
    searchMeta: u.searchMeta && u.searchMeta.length ? ` ${u.searchMeta} ${u.shortName} ` : ` ${u.shortName} `,
  }));
}

async function fetchGrants() {
  const q = `query { grants { id updated_at title slug summary start category end published_at searchMeta tags { title slug } } programs { id updated_at title slug status category summary published_at searchMeta tags { title slug } } }`;
  const data = await postGraphQL(AGENCY, q);
  const grants = unifyTags(data.grants || []).map((e) => ({
    ...e,
    fullPath: `/grants/funding/${e.slug}/`,
    imagePath: null,
    altTitle: e.title?.toLowerCase(),
    contentType: "funding",
    category: "funding",
    searchMeta: e.searchMeta && e.searchMeta.length ? `${e.searchMeta} nofo notice funding ` : " nofo notice funding ",
  }));
  const programs = unifyTags(data.programs || []).map((e) => ({
    ...e,
    fullPath: `/grants/programs/${e.slug}/`,
    imagePath: null,
    altTitle: e.title?.toLowerCase(),
    contentType: "program",
    searchMeta: e.searchMeta && e.searchMeta.length ? `${e.searchMeta} grant program ` : " grant program ",
  }));
  return [...grants, ...programs];
}

async function fetchBiographies() {
  const q = `query { biographies(sort: "lastName:asc") { id firstName lastName fullName title: fullName position: title suffix summary: bio tags { title slug } unit { title shortName slug } slug updated_at published_at affiliation sortField sortModifier searchMeta } }`;
  const bios = unifyTags((await postGraphQL(AGENCY, q)).biographies || []);
  return bios.map((b) => {
    const add = b.unit && b.unit.shortName && b.unit.title ? ` ${b.unit.shortName} ${b.unit.title} ` : "";
    return {
      ...b,
      altTitle: b.title?.toLowerCase(),
      contentType: "biography",
      fullPath: `/about/biographies/${b.slug}/`,
      imagePath: null,
      searchMeta: b.searchMeta && b.searchMeta.length ? b.searchMeta + add : add,
    };
  });
}

async function fetchJobs() {
  const q = `query { jobs { title id start end slug summary searchMeta published_at tags { title slug } } }`;
  const jobs = unifyTags((await postGraphQL(AGENCY, q)).jobs || []);
  return jobs.map((e) => ({
    ...e,
    fullPath: `/about/employment/${e.slug}/`,
    altTitle: e.title?.toLowerCase(),
    imagePath: null,
    contentType: "employment",
    searchMeta: e.searchMeta && e.searchMeta.length ? `${e.searchMeta} jobs help wanted ` : " jobs help wanted ",
  }));
}

async function fetchMeetings() {
  const q = `query { meetings { id title slug start end isCancelled summary category published_at tags { title id slug } } }`;
  const meetings = unifyTags((await postGraphQL(AGENCY, q)).meetings || []);
  return meetings.map((e) => ({
    ...e,
    fullPath: `/news/meetings/${e.slug}/`,
    altTitle: e.title?.toLowerCase(),
    imagePath: null,
    contentType: "meeting",
  }));
}

async function fetchPages() {
  const q = `query { pages { id title created_at updated_at slug summary category searchMeta published_at hideFromSearch tags { title slug } splash { name caption alternativeText url formats } } }`;
  let pages = (await postGraphQL(AGENCY, q)).pages || [];
  for (const page of pages) {
    if (page.category === "informationSystems") page.category = "information-systems";
    if (page.category === "innovationAndDigitalServices") page.category = "innovation-and-digital-services";
  }
  pages = unifyTags(pages.filter((p) => !p.hideFromSearch));
  return pages.map((p) => ({
    ...p,
    altTitle: p.title?.toLowerCase(),
    fullPath: p.category === "general" ? `/${p.slug}/` : `/${p.category}/${p.slug}/`,
    imagePath: p.splash ? `${site.strapiHost}${p.splash.url}` : null,
    contentType: "page",
  }));
}

async function fetchPublications() {
  const allowedHost = `${ORIGIN}/researchhub`;
  const limit = 500;
  let count = await getJSON(`${AGENCY_REST}/publications/count`);
  count = typeof count === "number" ? count : Number(count) || 0;
  const iterations = Math.ceil(count / limit);
  let pubArray = [];
  for (let i = 0, start = 0; i < iterations; i++, start += limit) {
    const page = await getJSON(`${AGENCY_REST}/publications?_limit=${limit}&_start=${start}`);
    pubArray = pubArray.concat(page);
  }
  // uniqBy id (REST pages can overlap if records shift between requests)
  const seen = new Set();
  pubArray = pubArray.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  return pubArray.map((p) => ({
    ...p,
    altTitle: p.title?.toLowerCase(),
    localArticlePath:
      p.articleURL && p.articleURL.includes(allowedHost) ? p.articleURL.replace(ORIGIN, "") : null,
    fullPath: `/about/publications/${p.slug}/`,
    contentType: "publication",
  }));
}

async function fetchHub() {
  const q = `query { articles(where: { status: "published" }) { id title slug summary: abstract authors tags date categories published_at: date } apps(where: { status: "published" }) { id title status slug authors: contributors date slug summary: description url tags categories published_at: date } datasets(where: { status: "published" }) { title slug date external categories tags project published_at: date summary: description } }`;
  const data = await postGraphQL(HUB, q);
  const articles = (data.articles || []).map((e) => ({
    ...e,
    fullPath: `/researchhub/articles/${e.slug}/`,
    imagePath: `${ORIGIN}/researchhub/images/${e.id}-splash.jpeg`,
    contentType: "article",
  }));
  const apps = (data.apps || []).map((e) => ({
    ...e,
    abstract: e.summary,
    fullPath: `/researchhub/apps/${e.slug}/`,
    imagePath: `${ORIGIN}/researchhub/images/${e.id}-image.jpeg`,
    contentType: "web application",
  }));
  const datasets = (data.datasets || []).map((e) => ({
    ...e,
    fullPath: `/researchhub/datasets/${e.slug}/`,
    imagePath: null,
    abstract: e.summary,
    contentType: "dataset",
  }));
  return [...articles, ...apps, ...datasets];
}

// ── Staff-name purification (port of generators/utils/purifyStaffNames.js) ──
// Former/external names found in CMS searchMeta but not in the public roster.
const EXTRAS = [
  "Aisha Williams", "Alan Blackmon", "Andy Krupin", "Gregory Stevenson",
  "Haley Aubrey", "Jashay Fisher", "Karen Sheley", "Mary Ratliff",
  "Mitchell Troup", "Nathan Bossick", "Reshma Desai", "Roberto Lopez",
  "Ronnie Reichgelt", "Schweda", "Shai Hoffman", "Zina Smith",
];

function buildBlocklist(biographies) {
  const names = new Set();
  for (const bio of biographies) {
    const { firstName, lastName, fullName } = bio;
    if (fullName && fullName.trim()) names.add(fullName.trim());
    if (firstName && lastName) names.add(`${firstName.trim()} ${lastName.trim()}`);
    if (lastName && lastName.trim().length > 2) names.add(lastName.trim());
  }
  for (const name of EXTRAS) {
    names.add(name);
    const parts = name.split(/\s+/);
    if (parts.length === 2 && parts[1].length > 2) names.add(parts[1]);
  }
  // longest-first so "Mary Ratliff" matches before "Ratliff"
  return [...names].sort((a, b) => b.length - a.length);
}

function purifyString(input, blocklist) {
  if (!input || typeof input !== "string") return input;
  let out = input;
  for (const name of blocklist) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }
  return out.replace(/\s+/g, " ").trim();
}

// Purify searchMeta on every record EXCEPT biographies (the public roster).
function purify(records, blocklist) {
  for (const r of records) {
    if (r.contentType === "biography") continue;
    if ("searchMeta" in r) r.searchMeta = purifyString(r.searchMeta, blocklist);
  }
  return records;
}

const xmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function buildSitemap(urls) {
  const body = urls
    .map((u) => `  <url><loc>${xmlEscape(u)}</loc><changefreq>weekly</changefreq><priority>0.3</priority></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  // Biographies first — needed both as index records AND to build the purify
  // blocklist. If it fails we proceed with an EXTRAS-only blocklist (degraded).
  let biographies = [];
  try {
    biographies = await fetchBiographies();
  } catch (e) {
    console.warn(`[search-index] biographies fetch failed: ${e.message}`);
  }

  // Remaining types, in parallel, each independently fallible.
  const types = [
    ["hub", fetchHub],
    ["grants", fetchGrants],
    ["pages", fetchPages],
    ["publications", fetchPublications],
    ["units", fetchUnits],
    ["jobs", fetchJobs],
    ["meetings", fetchMeetings],
    ["posts", fetchPosts],
    ["events", fetchEvents],
  ];
  const settled = await Promise.allSettled(types.map(([, fn]) => fn()));
  const got = {};
  const failed = [];
  settled.forEach((r, i) => {
    const name = types[i][0];
    if (r.status === "fulfilled") got[name] = r.value;
    else {
      got[name] = [];
      failed.push(`${name} (${r.reason?.message || r.reason})`);
    }
  });
  if (failed.length) console.warn(`[search-index] FAILED types (dropped this build): ${failed.join(", ")}`);

  const blocklist = buildBlocklist(biographies);

  // Assemble in the legacy siteIndex order, purifying searchMeta (not bios).
  const siteIndex = purify(
    [
      ...biographies,
      ...got.hub, ...got.grants, ...got.pages, ...got.publications,
      ...got.units, ...got.jobs, ...got.meetings, ...got.posts, ...got.events,
    ],
    blocklist,
  );

  // Total failure → keep last-known-good files; never ship an empty index/sitemap.
  if (siteIndex.length === 0) {
    console.warn("[search-index] zero records (Strapi outage?) — keeping existing files, exit 0");
    return;
  }

  // ── searchIndex.json ──
  await writeFile(OUT_INDEX, JSON.stringify(siteIndex));

  // ── sitemap.xml ── content fullPaths (trailing slash) + the manual /news/press/.
  const manual = ["/news/press/"];
  const urls = [...siteIndex.map((i) => i.fullPath), ...manual]
    .filter(Boolean)
    .map((p) => ORIGIN + (p.endsWith("/") ? p : `${p}/`));
  await writeFile(OUT_SITEMAP, buildSitemap(urls));

  const sizeMB = (JSON.stringify(siteIndex).length / 1048576).toFixed(2);
  console.log(
    `[search-index] wrote searchIndex.json (${siteIndex.length} records, ${sizeMB} MB) + sitemap.xml (${urls.length} urls)` +
      (failed.length ? ` — ${failed.length} type(s) degraded` : ""),
  );
}

main().catch((e) => {
  // Never fail the build over the index/sitemap (keep last-known-good).
  console.warn(`[search-index] unexpected error (keeping existing files, continuing): ${e.message}`);
});

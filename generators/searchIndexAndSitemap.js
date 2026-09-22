/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");

const config = require("../src/config/config.json");
const { createWriteStream } = require("fs");
const { SitemapStream } = require("sitemap");
const { purifySearchMeta } = require("./utils/purifyStaffNames");

// ── Purification pass (SEC-12/13): strip staff names from searchMeta ──
// CMS editors add staff names to searchMeta so pages surface when users
// search for those names. This leaks an internal personnel roster in the
// static JSON. Purify each per-type JSON against the biographies roster
// before they are assembled into the public searchIndex.
const typeFiles = [
  "hub",
  "grants",
  "pages",
  "publications",
  "units",
  "jobs",
  "meetings",
  "posts",
  "events",
];

for (const name of typeFiles) {
  const filePath = `./public/api/${name}.json`;
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const cleaned = purifySearchMeta(data);
  jsonfile.writeFileSync(filePath, cleaned);
}
console.log(`Purified searchMeta across ${typeFiles.length} API files`);

// Re-require after purification (clear cache)
delete require.cache[require.resolve("../public/api/hub.json")];
delete require.cache[require.resolve("../public/api/grants.json")];
delete require.cache[require.resolve("../public/api/pages.json")];
delete require.cache[require.resolve("../public/api/publications.json")];
delete require.cache[require.resolve("../public/api/units.json")];
delete require.cache[require.resolve("../public/api/jobs.json")];
delete require.cache[require.resolve("../public/api/meetings.json")];
delete require.cache[require.resolve("../public/api/posts.json")];
delete require.cache[require.resolve("../public/api/events.json")];

const hub = require("../public/api/hub.json");
const grants = require("../public/api/grants.json");
const pages = require("../public/api/pages.json");
const biographies = require("../public/api/biographies.json");
const publications = require("../public/api/publications.json");
const units = require("../public/api/units.json");
const jobs = require("../public/api/jobs.json");
const meetings = require("../public/api/meetings.json");
const posts = require("../public/api/posts.json");
const events = require("../public/api/events.json");
// const policies = require("../public/api/policies.json");

// ── Hand-built routes (not Strapi content) ─────────────────────────────
// Listed once in ./manualPages.js; see that file. `shell` holds head tags for
// generatePageShells.js and is left out of the search index.
const manualPages = require("./manualPages").map(
  ({ shell, ...record }) => record
);

// ── Words people search for that a CMS page's keywords lack ────────────
// "nofo" for the Funding Opportunities page; see ./pageKeywords.js.
const { addKeywords, labelsByPage } = require("./pageKeywords");

// The names of the links on Required Forms and on Rules, Regulations, and
// Policies, fetched by generateIndexPageLinks.js. The index is built without
// them if that fetch failed.
const pageLinks = labelsByPage(
  fs.existsSync("./public/api/pageLinks.json")
    ? JSON.parse(fs.readFileSync("./public/api/pageLinks.json", "utf8"))
    : {}
);

// ── CMS records whose page is somewhere else ───────────────────────────
// The empty "Rules, Regulations, Policies" page; see ./retiredPages.js.
const { withoutRetired } = require("./retiredPages");

// ── The Partners menu: the agency's other sites and its plans ──────────
// Built from src/config/menus.json; see ./partnerLinks.js. They point off this
// site, so they are in the search index and not in the sitemap.
const partnerLinks = require("./partnerLinks").partnerRecords(
  require("../src/config/menus.json")
);

let siteIndex = [
  ...biographies,
  ...hub,
  ...grants,
  ...withoutRetired(addKeywords(pages, pageLinks)),
  ...publications,
  ...units,
  ...jobs,
  ...meetings,
  ...posts,
  ...events,
  // ...policies,
  ...addKeywords(manualPages, pageLinks),
  ...partnerLinks,
];

// Sitemap-only paths: hand-built routes that have no search record. Empty since
// v1.5.119: every hand-built page is in ./manualPages.js, which feeds both.
const manualIndex = [];

const dirpath = "./public/api";
if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

jsonfile.writeFile(`./public/searchIndex.json`, siteIndex, function (err) {
  if (err) console.error(err);
  console.log(`Created: ./public/searchIndex.json`);
});

// Create Sitemap.xml here

const sitemap = new SitemapStream({ hostname: `${config.api.baseClient}` });
const writeStream = createWriteStream("./public/sitemap.xml");
let sitemapCounter = 0;
sitemap.pipe(writeStream);

siteIndex
  .filter((item) => !item.external)
  .forEach((item) => {
    let url = `${config.api.baseClient}${item.fullPath}`;
    url += url.endsWith("/") ? "" : "/";
    sitemap.write({ url, changefreq: "weekly", priority: 0.3 });
    sitemapCounter++;
  });

manualIndex.forEach((path) => {
  let url = `${config.api.baseClient}${path}`;
  url += url.endsWith("/") ? "" : "/";
  sitemap.write({ url, changefreq: "weekly", priority: 0.3 });
  sitemapCounter++;
});

sitemap.end();

console.log("Created: ./public/sitemap.xml");

// // temp api directory path
// const dir = "./public/api/";

// //delete directory recursively

// fs.rm(dir, { recursive: true }, (err) => {
//   if (err) {
//     throw err;
//   }

//   console.log(`Deleted: ${dir}`);
// });

console.log("Total pages: ", sitemapCounter);

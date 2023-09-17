/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");

const config = require("../src/config/config.json");
const { createWriteStream } = require("fs");
const { SitemapStream } = require("sitemap");

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
const policies = require("../public/api/policies.json");

let siteIndex = [
  ...biographies,
  ...hub,
  ...grants,
  ...pages,
  ...publications,
  ...units,
  ...jobs,
  ...meetings,
  ...posts,
  ...events,
  // ...policies,
];

const manualIndex = ["/news/press/"];

const dirpath = "./public/api";
if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

jsonfile.writeFile(`./public/searchIndex.json`, siteIndex, function (err) {
  if (err) console.error(err);
  console.log(`Created: ./public/searchIndex.json`);
});

jsonfile.writeFile(`./src/lambda/searchIndex.json`, siteIndex, function (err) {
  if (err) console.error(err);
  console.log(`Created: ./src/lambda/searchIndex.json`);
});

// Create Sitemap.xml here

const sitemap = new SitemapStream({ hostname: `${config.api.baseClient}` });
const writeStream = createWriteStream("./public/sitemap.xml");
let sitemapCounter = 0;
sitemap.pipe(writeStream);

siteIndex.forEach((item) => {
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

// temp api directory path
const dir = "./public/api/";

//delete directory recursively

fs.rm(dir, { recursive: true }, (err) => {
  if (err) {
    throw err;
  }

  console.log(`Deleted: ${dir}`);
});

console.log("Total pages: ", sitemapCounter);

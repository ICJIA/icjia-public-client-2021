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
];

const dirpath = "./public/api";
if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);
console.log("Site index length: ", siteIndex.length);
jsonfile.writeFile(`./public/searchIndex.json`, siteIndex, function (err) {
  if (err) console.error(err);
  console.log(`Created: ./public/searchIndex.json`);
});

// Create Sitemap.xmp here

const sitemap = new SitemapStream({ hostname: `${config.api.baseClient}` });
const writeStream = createWriteStream("./public/sitemap.xml");
sitemap.pipe(writeStream);

siteIndex.forEach((item) => {
  let url = `${config.api.baseClient}${item.fullPath}`;
  url += url.endsWith("/") ? "" : "/";
  sitemap.write({ url, changefreq: "weekly", priority: 0.3 });
});

sitemap.end();

console.log("Created: ./public/Sitemap.xml");

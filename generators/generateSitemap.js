/* eslint-disable no-unused-vars */

const _ = require("lodash");
const config = require("../src/config/config.json");
const { createWriteStream } = require("fs");
const { SitemapStream } = require("sitemap");

const siteIndex = require("../public/api/searchIndex.json");
const sitemap = new SitemapStream({ hostname: `${config.api.baseClient}` });
const writeStream = createWriteStream("./public/sitemap.xml");
sitemap.pipe(writeStream);

siteIndex.forEach((item) => {
  let url = `${config.api.baseClient}${item.fullPath}`;
  url += url.endsWith("/") ? "" : "/";
  sitemap.write({ url, changefreq: "weekly", priority: 0.3 });
});

sitemap.end();

console.log("Sitemap generated");

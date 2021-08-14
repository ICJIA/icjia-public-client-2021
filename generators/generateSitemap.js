/* eslint-disable no-unused-vars */
// const fs = require("fs");
// const axios = require("axios");
// const jsonfile = require("jsonfile");
// const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const { createWriteStream } = require("fs");
const { SitemapStream } = require("sitemap");

// Creates a sitemap object given the input configuration with URLs
const sitemap = new SitemapStream({ hostname: "http://example.com" });

const writeStream = createWriteStream("./public/sitemap.xml");
sitemap.pipe(writeStream);

sitemap.write({ url: "/page-1/", changefreq: "daily", priority: 0.3 });
sitemap.write("/page-2");
sitemap.end();

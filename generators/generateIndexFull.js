/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");

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

// siteIndex = _.orderBy(siteIndex, ["date"], ["desc"]);
const dirpath = "./public/api";
if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);
console.log("Site index length: ", siteIndex.length);
jsonfile.writeFile(`./public/api/searchIndex.json`, siteIndex, function (err) {
  if (err) console.error(err);
  console.log(`Created: ./public/api/searchIndex.json`);
});

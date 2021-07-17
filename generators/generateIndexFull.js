/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");

const hub = require("../src/config/hub.json");
const grants = require("../src/config/grants.json");
const pages = require("../src/config/pages.json");
const biographies = require("../src/config/biographies.json");
const publications = require("../src/config/publications.json");
const units = require("../src/config/units.json");

let siteIndex = [
  ...biographies,
  ...hub,
  ...grants,
  ...pages,
  ...publications,
  ...units,
];

// siteIndex = _.orderBy(siteIndex, ["date"], ["desc"]);
console.log("Site index length: ", siteIndex.length);
jsonfile.writeFile(`./src/config/searchIndex.json`, siteIndex, function (err) {
  if (err) console.error(err);
  console.log(`Created: ./src/config/searchIndex.json`);
});

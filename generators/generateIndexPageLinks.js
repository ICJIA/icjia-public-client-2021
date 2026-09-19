// The names of the links on pages that are lists of links (v1.5.97): the forms
// on /grants/required-forms/, and the rules, regulations and policies on
// /grants/rules-regs-policies/.
//
// The pages draw them from CMS collections that have no search records of
// their own: "time certification" found nothing. The titles are fetched here,
// as the other generateIndex* scripts fetch theirs, and
// searchIndexAndSitemap.js adds them to each page's keywords. Which
// collections belong to which page is in ./pageKeywords.js. If the fetch fails
// the index is built without them.
const fs = require("fs");
const jsonfile = require("jsonfile");
const { createApiClient } = require("./apiClient");
const { LINKED_COLLECTIONS } = require("./pageKeywords");

const collections = [].concat(...Object.values(LINKED_COLLECTIONS));
const query = `query {
${collections.map((name) => `  ${name}(limit: -1) { title }`).join("\n")}
}`;

const api = createApiClient("https://agency.icjia-api.cloud");
api
  .postWithRetry("/graphql", { query })
  .then((res) => {
    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(
      `./public/api/pageLinks.json`,
      res.data.data,
      function (err) {
        if (err) console.error(err);
        console.log(`Created: ./public/api/pageLinks.json`);
      }
    );
  })
  .catch((err) => console.error(err));

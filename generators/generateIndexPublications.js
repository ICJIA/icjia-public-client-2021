/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");
const allowedHost = "https://icjia.illinois.gov/researchhub";

const init = async () => {
  const limit = 500;
  let pubArray = [];
  let start = 0;
  let count = await axios.get(
    "https://agency.icjia-api.cloud/publications/count"
  );
  count = count.data;
  let iterations = Math.ceil(count / limit);

  for (let i = 0; i < iterations; i++) {
    let response = await axios.get(
      `https://agency.icjia-api.cloud/publications?_limit=${limit}&_start=${start}`
    );
    pubArray = pubArray.concat(response.data);
    start += limit;
  }
  pubArray = _.uniqBy(pubArray, "id");
  let publications = pubArray.map((p) => {
    let obj = {
      ...p,
      altTitle: p.title.toLowerCase(),
      localArticlePath:
        p.articleURL && p.articleURL.includes(allowedHost)
          ? p.articleURL.replace("https://icjia.illinois.gov", "")
          : null,
      fullPath: `/about/publications/${p.slug}`,
      contentType: "publication",
    };
    return obj;
  });
  let content = [...publications];
  content = _.orderBy(content, ["publicationDate"], ["desc"]);

  const dirpath = "./public/api";
  if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);
  jsonfile.writeFile(`./public/api/publications.json`, content, function (err) {
    if (err) console.error(err);
    console.log(`Created: ./public/api/publications.json`);
  });
};

init();

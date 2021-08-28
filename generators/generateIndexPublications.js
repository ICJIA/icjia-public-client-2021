/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");
const allowedHost = "https://icjia.illinois.gov/researchhub";

const query = `query {
  publications(limit: 990, sort: "published_at:desc") {
      id
      published_at
      publicationDate
      title
      slug
      summary
      fileURL
      articleURL
      datasetURL
      applicationURL
      pubType
      tags
      searchMeta
    }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let publications = res.data.data.publications;
    publications = publications.map((p) => {
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

    jsonfile.writeFile(
      `./public/api/publications.json`,
      content,
      function (err) {
        if (err) console.error(err);
        console.log(`Created: ./public/api/publications.json`);
      }
    );
  })
  .catch((err) => console.error(err));

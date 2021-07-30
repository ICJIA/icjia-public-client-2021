/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  publications {
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
          p.articleURL &&
          p.articleURL.includes("https://icjia.illinois.gov/researchhub")
            ? p.articleURL.replace("https://icjia.illinois.gov", "")
            : null,
        fullPath: `/about/publications/${p.slug}`,
        contentType: "publication",
      };
      return obj;
    });

    let content = [...publications];
    content = _.orderBy(content, ["publicationDate"], ["desc"]);

    jsonfile.writeFile(
      `./src/config/publications.json`,
      content,
      function (err) {
        if (err) console.error(err);
        console.log(`Created: ./src/config/publications.json`);
      }
    );
  })
  .catch((err) => console.error(err));

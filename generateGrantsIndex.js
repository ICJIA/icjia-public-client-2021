/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  grants {
    id
    updated_at
    title
    slug
    summary
    start
    end
    published_at
    tags {
      title
      slug
    }
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let grants = res.data.data.grants;

    grants = grants.map((e) => ({
      ...e,
      fullPath: `/grants/funding/${e.slug}/`,
      imagePath: null,
      contentType: "grant",
    }));

    let content = [...grants];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/grants.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/grants.json`);
    });
  })
  .catch((err) => console.error(err));

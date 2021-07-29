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
    category
    end
    published_at
    searchMeta
    tags {
      title
      slug
    }
  }

   programs {
    id
    updated_at
    title
    slug
    status
    category
    summary
    published_at
    searchMeta
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
    let programs = res.data.data.programs;

    grants = grants.map((e) => ({
      ...e,
      fullPath: `/grants/funding/${e.slug}/`,
      imagePath: null,
      altTitle: e.title.toLowerCase(),
      contentType: "funding",
      category: "funding",
      searchMeta:
        e.searchMeta && e.searchMeta.length
          ? e.searchMeta + " nofo notice funding "
          : "nofo notice funding",
    }));

    programs = programs.map((e) => ({
      ...e,
      fullPath: `/grants/programs/${e.slug}/`,
      imagePath: null,
      altTitle: e.title.toLowerCase(),
      contentType: "program",
    }));

    let content = [...grants, ...programs];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/config/grants.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/grants.json`);
    });
  })
  .catch((err) => console.error(err));

/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 pages {
    id
    title
    created_at
    updated_at
    slug
    summary
    category
    
    published_at
    tags {
      title
      slug
    }
    
    splash {
      name
      caption
      alternativeText
      url
      formats
    }
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let pages = res.data.data.pages;
    pages = pages.map((p) => {
      let imagePath;
      if (p.splash) {
        imagePath = `https://agency.icjia-api.cloud${p.splash.url}`;
      } else {
        imagePath = null;
      }
      let obj = {
        ...p,
        fullPath:
          p.category === "general"
            ? `/${p.slug}/`
            : `/${p.category}/${p.slug}/`,
        imagePath,
        contentType: "page",
      };
      return obj;
    });

    let content = [...pages];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/config/pages.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/pages.json`);
    });
  })
  .catch((err) => console.error(err));

/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  articles (where: { status: "published" }) {
    id
      title
      status
      slug
      date
      external
      categories
      tags
      authors
      images
     
    abstract
    markdown
    mainfile {
      name
      url
    }
    extrafile {
      name
      url
    }
  }
}`;

axios
  .create({ baseURL: "https://researchhub.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let articles = res.data.data.articles;

    articles = articles.map((e) => ({
      ...e,
      fullPath: `/researchhub/articles/${e.slug}/`,
      imagePath: `https://icjia.illinois.gov/researchhub/images/${e.id}-splash.jpeg`,
      contentType: "article",
    }));

    let content = [...articles];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/hubArticles.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/hubArticles.json`);
    });
  })
  .catch((err) => console.error(err));

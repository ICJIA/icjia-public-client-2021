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
    slug
    abstract
    authors
    tags
    date
    categories
   
  }
  apps (where: { status: "published" }) {
    id
    title
    status
    slug
    authors: contributors
    date
    slug
    description
    url
    tags
    categories
    
  }

   datasets (where: {status: "published"}) {
    title
    slug
    date
    external
    categories
    tags
    project
   description
    categories
  }
}`;

axios
  .create({ baseURL: "https://researchhub.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let articles = res.data.data.articles;
    let apps = res.data.data.apps;
    let datasets = res.data.data.datasets;
    articles = articles.map((e) => ({
      ...e,
      fullPath: `/researchhub/articles/${e.slug}/`,
      imagePath: `https://icjia.illinois.gov/researchhub/images/${e.id}-splash.jpeg`,
      contentType: "article",
    }));
    apps = apps.map((e) => ({
      ...e,
      abstract: e.description,
      fullPath: `/researchhub/apps/${e.slug}/`,
      imagePath: `https://icjia.illinois.gov/researchhub/images/${e.id}-image.jpeg`,
      contentType: "app",
    }));

    datasets = datasets.map((e) => ({
      ...e,
      fullPath: `/researchhub/datasets/${e.slug}/`,
      imagePath: null,
      abstract: e.description,
      contentType: "dataset",
    }));

    let content = [...articles, ...apps, ...datasets];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/config/hub.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/hub.json`);
    });
  })
  .catch((err) => console.error(err));

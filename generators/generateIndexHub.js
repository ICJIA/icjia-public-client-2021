/* eslint-disable no-unused-vars */
const fs = require("fs");
const { createApiClient } = require("./apiClient");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  articles (where: { status: "published" }) {
    id
    title
    slug
    summary: abstract
    authors
    tags
    date
    categories
    published_at: date
    
   
  }
  apps (where: { status: "published" }) {
    id
    title
    status
    slug
    authors: contributors
    date
    slug
    summary: description
    url
    tags
    categories
    published_at: date
   
    
  }

   datasets (where: {status: "published"}) {
    title
    slug
    date
    external
    categories
    tags
    project
    published_at: date
   summary: description
    categories
  }
}`;

const api = createApiClient("https://researchhub.icjia-api.cloud");
api.postWithRetry("/graphql", { query })
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
      contentType: "web application",
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

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/hub.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/hub.json`);
    });
  })
  .catch((err) => console.error(err));

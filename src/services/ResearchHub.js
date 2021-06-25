import { EventBus } from "@/event-bus";
import NProgress from "nprogress";

const axios = require("axios");
const api = axios.create({
  baseURL: "https://researchhub.icjia-api.cloud/graphql",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  NProgress.start();
  return config;
});

api.interceptors.response.use((response) => {
  NProgress.done();
  return response;
});

async function queryEndpoint(query) {
  let content = await api({
    method: "post",
    data: {
      query,
    },
  });
  return content;
}

const getHubArticlesQuery = (limit) => {
  return `{
      articles (sort: "date:desc", limit: ${limit}, where: {status: "published"}) {
        id
        title
        status
       slug
        thumbnail
       splash
       createdAt
        abstract
        authors 
        slug
        date
        createdAt
      }
    }`;
};

const getAllHubArticlesQuery = () => {
  return `{
      articles (where: {status: "published"}) {
        id
        title
       slug
        abstract
        authors 
        date
      }
    }`;
};

const getSingleArticleQuery = (slug) => {
  return `{
      articles (where: {slug: ${slug}}) {
        id
        title
       slug
        title
        authors 
        date
      }
    }`;
};

const getHubApplicationsQuery = (limit) => {
  return `{
    apps (sort: "date:desc", limit: ${limit}, where: {status: "published"}) {
      id
      title
      status
      slug
      createdAt
      updatedAt
      image
      contributors
      date
      slug
      description
      image
      tags
      url
      articles {
        title
        slug
      }
      datasets {
        title
        slug
      }
    }
  }`;
};

const getHubDatasetsQuery = (limit = 20) => {
  return `{
    datasets (sort: "date:desc", limit: ${limit}, where: {status: "published"}) {
      id
      title
      date
      slug
      description
      status
      external
      categories
      tags
      project
    }
  }`;
};

const getHubArticles = async (limit) => {
  try {
    let articles = await queryEndpoint(getHubArticlesQuery(limit));
    //console.log(articles.data.data.articles);
    return articles.data.data.articles;
  } catch (e) {
    console.log("researchHub articles error: ", e.toString());
    EventBus.$emit("error", e.toString());
    NProgress.done();
    return null;
  }
};

const getAllHubArticles = async () => {
  try {
    let articles = await queryEndpoint(getAllHubArticlesQuery());
    //console.log(articles.data.data.articles);
    return articles.data.data.articles;
  } catch (e) {
    console.log("researchHub articles error: ", e.toString());
    EventBus.$emit("error", e.toString());
    NProgress.done();
    return null;
  }
};

const getSingleArticle = async (slug) => {
  try {
    let article = await queryEndpoint(getSingleArticleQuery(slug));
    console.log(article);
    return article.data.data.articles;
  } catch (e) {
    console.log("researchHub articles error: ", e.toString());
    EventBus.$emit("error", e.toString());
    NProgress.done();
    return null;
  }
};

const getHubApplications = async (limit) => {
  try {
    let apps = await queryEndpoint(getHubApplicationsQuery(limit));
    //console.log(apps.data.data.apps);
    return apps.data.data.apps;
  } catch (e) {
    //console.log("researchHub applications error:", e.toString());
    EventBus.$emit("error", e.toString());
    NProgress.done();
    return [];
  }
};

const getHubDatasets = async (limit) => {
  try {
    let datasets = await queryEndpoint(getHubDatasetsQuery(limit));
    //console.log(datasets.data.data.datasets);
    return datasets.data.data.datasets;
  } catch (e) {
    //console.log("researchHub datasets error:", e.toString());
    EventBus.$emit("error", e.toString());
    NProgress.done();
    return [];
  }
};

export {
  getHubArticles,
  getHubApplications,
  getHubDatasets,
  getAllHubArticles,
  getSingleArticle,
};

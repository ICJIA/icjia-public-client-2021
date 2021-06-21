/* eslint-disable graphql/template-strings */
/* Querying different GraphQL server -- no way for multiple schemas. */
/* See: https://github.com/apollographql/apollo-tooling/issues/1535 */

import gql from "graphql-tag";
const ignoredGqlTag = gql;

const GET_ARTICLE_COUNT_QUERY = ignoredGqlTag`
  query countFilterArticles {
    articlesConnection(where: { status: "published" }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_DATASET_COUNT_QUERY = ignoredGqlTag`
  query countDataset{
    datasetsConnection(where: { status: "published" }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_ALL_DATASETS_QUERY = ignoredGqlTag`
  query datasets {
   datasets (sort: "date:desc",  where: {status: "published"}) {
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
  }
`;

const GET_ALL_ARTICLES_QUERY = ignoredGqlTag`
  query articles {
    articles(where: { status: "published" }) {
      id
      title
      slug
      abstract
      authors
      date
    }
  }
`;

const GET_ARTICLE_GROUP_QUERY = ignoredGqlTag`
  query articleGroup ($articleLimit: Int!, $start: Int!) {
    articles(
      limit: $articleLimit
      start: $start
      sort: "date:desc"
      where: { status: "published" }
    ) {
      id
      title
      slug
      abstract
      authors
      date
    }
  }
`;

const GET_ALL_APPS_QUERY = ignoredGqlTag`
  query apps {
    apps(sort: "date:desc", where: { status: "published" }) {
      id
      title
      slug
      date
      description
      date
      contributors
      image
      
    }
  }
`;

export {
  GET_ALL_ARTICLES_QUERY,
  GET_ARTICLE_GROUP_QUERY,
  GET_ARTICLE_COUNT_QUERY,
  GET_DATASET_COUNT_QUERY,
  GET_ALL_DATASETS_QUERY,
  GET_ALL_APPS_QUERY,
};

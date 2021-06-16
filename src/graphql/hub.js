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

const GET_SINGLE_ARTICLE_QUERY = ignoredGqlTag`
  query singleArticle($slug: String!) {
    articles(where: { slug: $slug }){
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
  }
`;

export {
  GET_ALL_ARTICLES_QUERY,
  GET_ARTICLE_GROUP_QUERY,
  GET_ARTICLE_COUNT_QUERY,
  GET_SINGLE_ARTICLE_QUERY,
};

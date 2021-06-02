/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ARTICLE_COUNT_QUERY = gql`
  query countFilterArticles {
    articlesConnection(where: { status: "published" }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_ALL_ARTICLES_QUERY = gql`
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

const GET_ARTICLE_GROUP_QUERY = gql`
  query articleGroup($articleLimit: Int!, $start: Int!) {
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

export {
  GET_ALL_ARTICLES_QUERY,
  GET_ARTICLE_GROUP_QUERY,
  GET_ARTICLE_COUNT_QUERY,
};

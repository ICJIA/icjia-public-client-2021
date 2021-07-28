/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ALL_NEWS_QUERY = gql`
  query news {
    posts(sort: "published_at:desc") {
      id
      title
      slug
      summary
      created_at
      updated_at
      published_at
      tags {
        title
        slug
      }
      splash {
        caption
        alternativeText
        url
        formats
      }
    }
  }
`;

const GET_SINGLE_POST_QUERY = gql`
  query post($slug: String!) {
    posts(where: { slug: $slug }) {
      id
      title
      slug
      summary
      showTOC
      body
      created_at
      updated_at
      published_at
      tags(sort: "title:asc") {
        title
        slug
      }
      splash {
        caption
        alternativeText
        url
        formats
      }
    }
  }
`;

export { GET_ALL_NEWS_QUERY, GET_SINGLE_POST_QUERY };

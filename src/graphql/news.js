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
      tags(sort: "title:asc") {
        title
        slug
      }
      splash {
        url
        formats
      }
    }

    meetings(sort: "published_at:desc") {
      id
      title
      summary
      slug
      start
      end
      created_at
      updated_at
      published_at
    }
  }
`;
export { GET_ALL_NEWS_QUERY };

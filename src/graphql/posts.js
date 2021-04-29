/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ALL_POSTS_QUERY = gql`
  query getAllPosts {
    posts(sort: "published_at:desc") {
      id
      slug

      title
      summary
      created_at
      updated_at
      published_at

      tags(sort: "title:asc") {
        id
        title
        slug
        created_at
        summary
      }

      body
      splash {
        url
        formats
      }
    }
  }
`;
export { GET_ALL_POSTS_QUERY };

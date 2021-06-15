/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_SINGLE_FUNDING_QUERY = gql`
  query grant($slug: String!) {
    grants(where: { slug: $slug }) {
      id
      created_at
      updated_at
      title
      slug
      summary
      body
      start
      end
      category
      published_at
      attachments {
        name
      }
      tags {
        title
        slug
      }
    }
  }
`;

export { GET_SINGLE_FUNDING_QUERY };

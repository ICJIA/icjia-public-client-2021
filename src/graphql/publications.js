/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ALL_PUBLICATIONS_QUERY = gql`
  query allPubs {
    publications {
      id
      published_at
      publicationDate
      title
      slug
      summary
      fileURL
      articleURL
      pubType
    }
  }
`;

export { GET_ALL_PUBLICATIONS_QUERY };

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
      datasetURL
      applicationURL
      pubType
      tags
    }
  }
`;

const GET_SINGLE_PUBLICATION_QUERY = gql`
  query singlePub($slug: String!) {
    publications(where: { slug: $slug }) {
      id
      published_at
      publicationDate
      title
      slug
      summary
      fileURL
      articleURL
      datasetURL
      applicationURL
      pubType
      tags
    }
  }
`;

export { GET_ALL_PUBLICATIONS_QUERY, GET_SINGLE_PUBLICATION_QUERY };

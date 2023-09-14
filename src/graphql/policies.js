import gql from "graphql-tag";

const GET_ALL_POLICIES_QUERY = gql`
  query allPolicies {
    publications(sort: "published_at:desc") {
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

const GET_SINGLE_POLICY_QUERY = gql`
  query singlePolicy($slug: String!) {
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

export { GET_ALL_POLICIES_QUERY, GET_SINGLE_POLICY_QUERY };

import gql from "graphql-tag";

const GET_ALL_POLICIES_QUERY = gql`
  query allPolicies {
    policies(sort: "published_at:desc") {
      id
      created_at
      updated_at
      title
      slug
      summary
      searchMeta
      body
      category
      attachment {
        id
        created_at
        updated_at
        size
        name
        ext
        url
      }
      tags {
        id
        title
        slug
      }
    }
  }
`;

const GET_SINGLE_POLICY_QUERY = gql`
  query singlePolicy($slug: String!) {
    policies(where: { slug: $slug }) {
      id
      created_at
      updated_at
      title
      slug
      summary
      searchMeta
      body
      category
      attachment {
        id
        created_at
        updated_at
        size
        name
        ext
        url
      }
      tags {
        id
        title
        slug
      }
    }
  }
`;

export { GET_ALL_POLICIES_QUERY, GET_SINGLE_POLICY_QUERY };

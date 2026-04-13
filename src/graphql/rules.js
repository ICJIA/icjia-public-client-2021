import { gql } from "@/gql-client";

const GET_ALL_RULES_QUERY = gql`
  query allRules {
    rules(sort: "published_at:desc") {
      id
      created_at
      updated_at
      published_at
      title
      slug
      summary
      citation
      citationURL
    }
  }
`;

const GET_SINGLE_RULE_QUERY = gql`
  query singleRules($slug: String!) {
    rules(where: { slug: $slug }) {
      id
      created_at
      updated_at
      published_at
      title
      slug
      summary
      citation
      citationURL
    }
  }
`;

export { GET_ALL_RULES_QUERY, GET_SINGLE_RULE_QUERY };

/* eslint-disable graphql/template-strings */
// Ported from the legacy src/graphql/{rules,policies,regulations}.js — the three
// distinct Strapi collections behind /grants/rules-regs-policies/ (NOT the generic
// `pages` collection). Import path fixed to the Astro lib gql-client.
import { gql } from "../lib/gql-client";

const GET_ALL_RULES_QUERY = gql`
  query allRules {
    rules(sort: "published_at:desc") {
      id
      title
      slug
      summary
      citation
      citationURL
    }
  }
`;

const GET_ALL_POLICIES_QUERY = gql`
  query allPolicies {
    policies(sort: "published_at:desc") {
      id
      title
      slug
      summary
      category
      attachments {
        size
        name
        ext
        url
      }
    }
  }
`;

const GET_ALL_REGULATIONS_QUERY = gql`
  query allRegulations {
    regulations(sort: "published_at:desc") {
      id
      title
      slug
      summary
      url
    }
  }
`;

export { GET_ALL_RULES_QUERY, GET_ALL_POLICIES_QUERY, GET_ALL_REGULATIONS_QUERY };

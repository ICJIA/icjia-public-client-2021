/* eslint-disable graphql/template-strings */
// Ported from src/graphql/grants.js — funding (NOFO/RFI) list + single. Import
// path fixed to the Astro lib gql-client.
import { gql } from "../lib/gql-client";

const GET_ALL_FUNDING_QUERY = gql`
  query allGrants {
    grants {
      id
      created_at
      updated_at
      title
      slug
      summary
      start
      end
      category
      published_at
      attachments {
        updated_at
        created_at
        size
        name
        ext
        url
      }
      tags {
        title
        slug
      }
    }
  }
`;

const GET_SINGLE_FUNDING_QUERY = gql`
  query singleGrant($slug: String!) {
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
      biographies {
        title: fullName
        slug
      }
      attachments {
        updated_at
        created_at
        size
        name
        ext
        url
      }
      programs {
        title
        slug
      }
      posts {
        title
        slug
      }
      tags {
        title
        slug
      }
    }
  }
`;

export { GET_ALL_FUNDING_QUERY, GET_SINGLE_FUNDING_QUERY };

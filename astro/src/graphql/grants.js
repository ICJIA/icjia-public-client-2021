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

// Funded Programs — ported from src/graphql/grants.js (legacy Vue).
const GET_ALL_PROGRAMS_QUERY = gql`
  query allPrograms {
    programs {
      id
      updated_at
      title
      slug
      summary
      status
      body
      category
      published_at
      tags {
        title
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
    }
  }
`;

// Single program — body + attachments + tags + related POSTS only. Matches the
// legacy GET_SINGLE_PROGRAM_QUERY EXACTLY (posts as the sole content relation →
// "Related Web Content" is News-only on prod). Do NOT add `grants`/`biographies`
// here: `grants` would surface Funding links absent from approved prod (zero-
// deviation rule), and `biographies` is a hard GraphQL validation error on Program.
const GET_SINGLE_PROGRAM_QUERY = gql`
  query singleProgram($slug: String!) {
    programs(where: { slug: $slug }) {
      id
      created_at
      updated_at
      title
      slug
      summary
      body
      category
      status
      published_at
      attachments {
        updated_at
        created_at
        size
        name
        ext
        url
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

export {
  GET_ALL_FUNDING_QUERY,
  GET_SINGLE_FUNDING_QUERY,
  GET_ALL_PROGRAMS_QUERY,
  GET_SINGLE_PROGRAM_QUERY,
};

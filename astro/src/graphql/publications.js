/* eslint-disable graphql/template-strings */
// Ported from src/graphql/publications.js. Import path fixed to the Astro
// lib gql-client.
//
// NOTE: The publications LIST does NOT use GraphQL — it is fetched via REST
// (getAllPublications in data.ts) because the GraphQL `limit:990` silently
// clips the 1108-row archive and `limit:2000` errors. GET_ALL_PUBLICATIONS_QUERY
// is retained here for completeness/parity with legacy but is intentionally
// unused by the data layer. Only GET_SINGLE_PUBLICATION_QUERY (detail) is used.
import { gql } from "../lib/gql-client";

const GET_ALL_PUBLICATIONS_QUERY = gql`
  query allPubs {
    publications(limit: 990, sort: "published_at:desc") {
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

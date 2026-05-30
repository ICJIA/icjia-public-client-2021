/* eslint-disable graphql/template-strings */
// Ported from src/graphql/units.js — single unit detail.
// Import path fixed to the Astro lib gql-client.
//
// NOTE: GET_BIOGRAPHIES_BY_UNIT_QUERY lives in ./biographies.js (the unit
// staff lists are a biographies concern); import it from there.
import { gql } from "../lib/gql-client";

const GET_SINGLE_UNIT_QUERY = gql`
  query unit($slug: String!) {
    units(where: { slug: $slug }) {
      id
      title
      shortName
      created_at
      updated_at
      url
      summary
      slug
      body
    }
  }
`;

export { GET_SINGLE_UNIT_QUERY };

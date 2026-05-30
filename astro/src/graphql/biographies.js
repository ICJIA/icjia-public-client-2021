/* eslint-disable graphql/template-strings */
// Ported from src/graphql/biographies.js — single + all + by-unit.
// Import path fixed to the Astro lib gql-client.
//
// ENHANCEMENT over legacy: headshot selections add `width` + `height` so the
// Astro <Image>/CmsImage component has intrinsic dimensions up front and need
// not perform a request-time dimension fetch. `body: bio` alias preserved.
import { gql } from "../lib/gql-client";

const GET_SINGLE_BIOGRAPHY_QUERY = gql`
  query biographies($slug: String!) {
    biographies(where: { slug: $slug }) {
      id
      title
      firstName
      lastName
      fullName
      suffix
      body: bio
      unit {
        title
        shortName
        slug
        url
      }
      slug
      updated_at
      published_at

      affiliation
      sortField
      sortModifier
      headshot {
        url
        width
        height
        formats
      }
    }
  }
`;

const GET_ALL_BIOGRAPHIES_QUERY = gql`
  query allBiographies {
    biographies(sort: "sortField:asc") {
      fullName
      firstName
      lastName
      title
      body: bio
      unit {
        title
        shortName
        slug
        url
      }
      slug
      updated_at
      published_at

      affiliation
      sortField
      sortModifier
      headshot {
        url
        width
        height
        formats
      }
    }
  }
`;

const GET_BIOGRAPHIES_BY_UNIT_QUERY = gql`
  query unitBiographies($shortName: String!) {
    biographies(
      sort: "lastName:asc"
      where: { unit: { shortName: $shortName } }
    ) {
      id
      title
      firstName
      lastName
      fullName
      suffix
      body: bio
      unit {
        title
        shortName
        slug
      }
      slug
      updated_at
      published_at

      affiliation
      sortField
      sortModifier
      headshot {
        url
        width
        height
        formats
      }
    }
  }
`;

export {
  GET_SINGLE_BIOGRAPHY_QUERY,
  GET_ALL_BIOGRAPHIES_QUERY,
  GET_BIOGRAPHIES_BY_UNIT_QUERY,
};

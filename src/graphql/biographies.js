/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

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
      email
      affiliation
      sortField
      sortModifier
      headshot {
        url
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
      email
      affiliation
      sortField
      sortModifier
      headshot {
        url
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
      email
      affiliation
      sortField
      sortModifier
      headshot {
        url
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

/* eslint-disable graphql/template-strings */
import { gql } from "@/gql-client";

const GET_ALL_UNITS_QUERY = gql`
  query allUnits {
    units {
      id
      title
      shortName
      url
      summary
      created_at
      updated_at
      body
    }
  }
`;

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

export { GET_ALL_UNITS_QUERY, GET_SINGLE_UNIT_QUERY };

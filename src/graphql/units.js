/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ALL_UNITS_QUERY = gql`
  query allUnits {
    units {
      title
      shortName
      url
      summary
      body
    }
  }
`;

const GET_SINGLE_UNIT_QUERY = gql`
  query unit($slug: String!) {
    units(where: { slug: $slug }) {
      title
      shortName
      url
      summary
      body
    }
  }
`;

export { GET_ALL_UNITS_QUERY, GET_SINGLE_UNIT_QUERY };

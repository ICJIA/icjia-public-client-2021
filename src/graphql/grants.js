/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

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
        url
        name
      }
    }
  }
`;
const GET_ALL_FUNDING_QUERY = gql`
  query allGrants {
    grants {
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
      attachments {
        name
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
      attachments {
        name
        url
      }
      tags {
        title
        slug
      }
    }
  }
`;

export {
  GET_SINGLE_FUNDING_QUERY,
  GET_ALL_PROGRAMS_QUERY,
  GET_ALL_FUNDING_QUERY,
};

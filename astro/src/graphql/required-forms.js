/* eslint-disable graphql/template-strings */
// Ported from the legacy src/graphql/requiredForms.js — the `requiredForms` Strapi
// collection behind /grants/required-forms/ (a dedicated view, NOT the generic
// `pages` collection — the `required-forms` page has an empty body). Import path
// fixed to the Astro lib gql-client.
import { gql } from "../lib/gql-client";

const GET_ALL_REQUIRED_FORMS_QUERY = gql`
  query allRequiredForms {
    requiredForms(sort: "title:asc") {
      id
      title
      slug
      summary
      updated_at
      attachments {
        size
        name
        ext
        url
      }
    }
  }
`;

export { GET_ALL_REQUIRED_FORMS_QUERY };

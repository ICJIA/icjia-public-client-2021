/* eslint-disable graphql/template-strings */
import { gql } from "@/gql-client";

const GET_ALL_REQUIRED_FORMS_QUERY = gql`
  query allRequiredForms {
    requiredForms(sort: "published_at:desc") {
      id
      created_at
      updated_at
      published_at
      title
      slug
      summary
      body
      category
      attachments {
        id
        created_at
        updated_at
        size
        name
        ext
        url
      }
      tags {
        id
        title
        slug
      }
    }
  }
`;

export { GET_ALL_REQUIRED_FORMS_QUERY };

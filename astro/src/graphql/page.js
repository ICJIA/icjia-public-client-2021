/* eslint-disable graphql/template-strings */
// CMS "page" single query (subset of the legacy GET_SINGLE_PAGE_QUERY) — used for
// section intros like the /grants/funding/ heading + body, and reusable for the
// generic CMS pages (About, Grants catch-all, …) as they land.
import { gql } from "../lib/gql-client";

const GET_SINGLE_PAGE_QUERY = gql`
  query page($slug: String!) {
    pages(where: { slug: $slug }) {
      id
      title
      hideTitle
      created_at
      updated_at
      slug
      summary
      category
      showTOC
      body
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

export { GET_SINGLE_PAGE_QUERY };

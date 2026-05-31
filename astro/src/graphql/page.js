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
      attachmentLabel
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
      clickthrough {
        title
        teaser
        icon
        url
        datePosted
      }
      splash {
        name
        caption
        alternativeText
        url
        width
        height
        formats
      }
    }
  }
`;

// All page slugs + categories — for prerendering the section catch-alls
// (about/[slug], grants/[slug]) via getStaticPaths (build-time enumeration).
const GET_ALL_PAGES_QUERY = gql`
  query pages {
    pages {
      slug
      category
    }
  }
`;

export { GET_SINGLE_PAGE_QUERY, GET_ALL_PAGES_QUERY };

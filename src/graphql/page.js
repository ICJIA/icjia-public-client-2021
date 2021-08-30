/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ALL_PAGES_QUERY = gql`
  query allPages {
    pages {
      id
      title
      created_at
      updated_at
      slug
      summary
      category
      body
      published_at
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
        formats
      }
    }
  }
`;

const GET_SINGLE_PAGE_QUERY = gql`
  query page($slug: String!) {
    pages(where: { slug: $slug }) {
      id
      title
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
        size
        name
        ext
        url
      }
      attachmentLabel
      tags {
        title
        slug
      }
      clickthrough {
        id
        title
        teaser
        icon
        url
      }
      splash {
        name
        caption
        alternativeText
        url
        formats
      }
    }
  }
`;

export { GET_ALL_PAGES_QUERY, GET_SINGLE_PAGE_QUERY };

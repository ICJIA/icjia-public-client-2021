/* eslint-disable graphql/template-strings */
import { gql } from "../lib/gql-client";

const GET_ALL_NEWS_QUERY = gql`
  query news {
    posts(sort: "published_at:desc") {
      id
      title
      slug
      summary
      dateOverride
      category
      created_at
      updated_at
      published_at
      tags {
        title
        slug
      }
      splash {
        caption
        alternativeText
        url
        formats
      }
    }
  }
`;

const GET_ALL_PRESS_QUERY = gql`
  query press {
    posts(
      sort: "published_at:desc"
      where: {
        _or: [
          { category_contains: "pressRelease" }
          { category_contains: "mediaAdvisory" }
        ]
      }
    ) {
      id
      title
      slug
      summary
      dateOverride
      category
      created_at
      updated_at
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
      splash {
        caption
        alternativeText
        url
        formats
      }
    }
  }
`;

const GET_SINGLE_POST_QUERY = gql`
  query post($slug: String!) {
    posts(where: { slug: $slug }) {
      id
      title
      slug
      summary
      showTOC
      body
      dateOverride
      created_at
      updated_at
      hideSplash
      category
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
      meetings {
        title
        slug
      }
      grants {
        title
        slug
      }
      programs {
        title
        slug
      }
      posts {
        title
        slug
      }
      biographies {
        title: fullName
        slug
      }
      events {
        title: name
        slug
      }
      tags(sort: "title:asc") {
        title
        slug
      }
      splash {
        caption
        alternativeText
        url
        formats
      }
    }
  }
`;

export { GET_ALL_NEWS_QUERY, GET_SINGLE_POST_QUERY, GET_ALL_PRESS_QUERY };

/* eslint-disable graphql/template-strings */
// Ported verbatim from src/graphql/meetings.js (legacy), import path fixed to the
// Astro lib gql-client. Drives /news/meetings/ (all) + /news/meetings/[slug].
import { gql } from "../lib/gql-client";

const GET_ALL_MEETINGS_QUERY = gql`
  query allMeetings {
    meetings(sort: "start:desc") {
      id
      title
      slug
      summary
      created_at
      updated_at
      published_at
      isCancelled
      start
      end
      category
      body
      posts {
        title
        slug
      }
      events {
        title: name
        slug
      }
      tags {
        title
        slug
      }
      attachments {
        id
        formats
        size
        name
        ext
        url
        updated_at
        created_at
        hash
      }
      external {
        title
        url
      }
    }
  }
`;

const GET_SINGLE_MEETING_QUERY = gql`
  query singleMeeting($slug: String!) {
    meetings(where: { slug: $slug }) {
      id
      title
      slug
      summary
      isCancelled
      body
      start
      end
      category
      created_at
      updated_at
      posts {
        title
        slug
      }
      events {
        title: name
        slug
      }
      published_at
      attachments {
        id
        formats
        size
        name
        ext
        url
        updated_at
        created_at
        hash
      }
      external {
        title
        url
      }
      tags {
        title
        slug
      }
    }
  }
`;

export { GET_ALL_MEETINGS_QUERY, GET_SINGLE_MEETING_QUERY };

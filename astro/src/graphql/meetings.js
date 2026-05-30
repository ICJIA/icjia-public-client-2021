/* eslint-disable graphql/template-strings */
// Ported verbatim from src/graphql/meetings.js (legacy), import path fixed to the
// Astro lib gql-client. A LIGHT list query (table view) + the full single-meeting
// query (detail page + the lazy /news/meetings/[slug].json row-expand endpoint).
import { gql } from "../lib/gql-client";

// LIGHT list query for /news/meetings/ — only the fields the table, search, sort,
// and SSR baseline need. Body + all relation populates (posts/events/tags/external)
// are DROPPED and attachments reduced to a count ({ id }); the full detail is fetched
// lazily per-row on expand via /news/meetings/[slug].json (GET_SINGLE_MEETING_QUERY →
// shapeMeeting). This is what keeps the meetings cold render fast (~285 records).
const GET_MEETINGS_LIST_QUERY = gql`
  query meetingsList {
    meetings(sort: "start:desc") {
      id
      title
      slug
      summary
      isCancelled
      start
      end
      category
      attachments {
        id
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

export { GET_MEETINGS_LIST_QUERY, GET_SINGLE_MEETING_QUERY };

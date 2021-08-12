/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

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
      tags {
        title
        slug
      }
    }
  }
`;

const GET_MEETINGS_BY_CATEGORY_QUERY = gql`
  query meetingsByCat($category: String!) {
    meetings(where: { category: $category }) {
      id
      title
      slug
      summary
      body
      start
      end
      category
      created_at
      updated_at
      published_at
      attachments {
        id
        formats
        name
        ext
        url
        updated_at
        created_at
        hash
        size
      }
      tags {
        title
        slug
      }
    }
  }
`;

export {
  GET_ALL_MEETINGS_QUERY,
  GET_SINGLE_MEETING_QUERY,
  GET_MEETINGS_BY_CATEGORY_QUERY,
};

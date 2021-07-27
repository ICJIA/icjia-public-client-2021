import gql from "graphql-tag";

const GET_EVENTS = gql`
  query Events {
    events(sort: "start:asc") {
      id
      created_at
      updated_at
      published_at
      name
      start
      end
      timed
      summary
      category
      slug
      details
    }
    meetings(sort: "start:asc", where: { addToEventCalendar: true }) {
      id
      name: title
      summary
      slug
      start
      end
      category
      created_at
      updated_at
      published_at
    }

    grants(sort: "start:asc") {
      id
      name: title
      slug
      summary
      start
      category
      end
      created_at
      updated_at
      published_at
      tags(sort: "title:asc") {
        title
        slug
      }
    }
  }
`;

const GET_SINGLE_EVENT_QUERY = gql`
  query singleEvent($slug: String!) {
    events(where: { slug: $slug }) {
      id
      created_at
      updated_at
      published_at
      name
      start
      end
      timed
      summary
      category
      slug
      details
    }
  }
`;

export { GET_EVENTS, GET_SINGLE_EVENT_QUERY };

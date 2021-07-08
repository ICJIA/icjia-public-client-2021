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
    meetings(sort: "published_at:desc") {
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
  }
`;

const GET_SINGLE_EVENT = gql`
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

export { GET_EVENTS, GET_SINGLE_EVENT };

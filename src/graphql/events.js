import { gql } from "@/gql-client";

const GET_EVENTS = gql`
  query Events($eventsWhere: JSON, $meetingsWhere: JSON, $jobsWhere: JSON, $grantsWhere: JSON) {
    events(sort: "start:asc", where: $eventsWhere) {
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
      meetings {
        title
        slug
      }
      posts {
        title
        slug
      }
      tags {
        title
        slug
      }
    }
    meetings(sort: "start:asc", where: $meetingsWhere) {
      id
      name: title
      summary
      slug
      isCancelled
      start
      end
      category
      created_at
      updated_at
      published_at
      tags {
        title
        slug
      }
    }
    jobs(sort: "start:asc", where: $jobsWhere) {
      id
      title
      summary
      slug
      start
      end
      category
      created_at
      updated_at
      published_at
      tags {
        title
        slug
      }
    }

    grants(sort: "start:asc", where: $grantsWhere) {
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
      meetings {
        title
        slug
      }
      posts {
        title
        slug
      }
      tags {
        title
        slug
      }
    }
  }
`;

export { GET_EVENTS, GET_SINGLE_EVENT_QUERY };

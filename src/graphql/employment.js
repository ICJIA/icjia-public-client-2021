/* eslint-disable graphql/template-strings */
import gql from "graphql-tag";

const GET_ALL_JOBS_QUERY = gql`
  query allJobs {
    jobs {
      id
      updated_at
      title
      slug
      summary
      category
      published_at
      start
      end
      external {
        title
        url
      }
      posts {
        title
        slug
      }
      tags {
        title
        slug
      }
      attachments {
        url
        name
      }
    }
  }
`;

const GET_SINGLE_JOB_QUERY = gql`
  query allJobs($slug: String!) {
    jobs(where: { slug: $slug }) {
      id
      updated_at
      title
      slug
      summary
      body
      category
      published_at
      start
      end
      external {
        title
        url
      }
      posts {
        title
        slug
      }
      tags {
        title
        slug
      }
      attachments {
        url
        name
      }
    }
  }
`;

export { GET_ALL_JOBS_QUERY, GET_SINGLE_JOB_QUERY };

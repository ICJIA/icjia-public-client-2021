/* eslint-disable graphql/template-strings */
// Ported verbatim from src/graphql/employment.js — jobs list + single.
// Import path fixed to the Astro lib gql-client.
import { gql } from "../lib/gql-client";

const GET_ALL_JOBS_QUERY = gql`
  query allJobs {
    jobs(sort: "end:desc") {
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
        updated_at
        created_at
      }
    }
  }
`;

const GET_SINGLE_JOB_QUERY = gql`
  query singleJob($slug: String!) {
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
        updated_at
        created_at
        size
        name
        ext
        url
      }
    }
  }
`;

export { GET_ALL_JOBS_QUERY, GET_SINGLE_JOB_QUERY };

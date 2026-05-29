/* eslint-disable graphql/template-strings */
import { gql } from "../lib/gql-client";

// Active home query (the commented event queries from the Vue version are
// dropped — HomeEvents is disabled in Home.vue).
const GET_HOME = gql`
  query Home(
    $postLimit: Int!
    $meetingLimit: Int!
    $fundingLimit: Int!
    $employmentLimit: Int!
  ) {
    home {
      homeBanner {
        id
        bannerText
        bannerColor
        whiteText
        dismissable
      }
      homeCarousel {
        title
        slide {
          title
          teaser
          grayscale
          tint
          opacity
          image {
            formats
            url
          }
        }
      }
      clickThroughBoxes {
        title
        url
        teaser
        icon
        datePosted
      }
    }

    posts(sort: "published_at:desc", limit: $postLimit) {
      id
      title
      slug
      summary
      created_at
      updated_at
      published_at
      dateOverride
      category
      tags(sort: "title:asc") {
        title
        slug
      }
      splash {
        url
        width
        height
        formats
      }
    }

    meetings(sort: "end:desc", limit: $meetingLimit) {
      id
      title
      summary
      isCancelled
      slug
      start
      end
      created_at
      updated_at
      published_at
    }

    jobs(sort: "published_at:desc", limit: $employmentLimit) {
      title
      slug
      start
      end
      category
      summary
      published_at
    }

    grants(sort: "start:desc", limit: $fundingLimit) {
      id
      title
      slug
      summary
      start
      category
      published_at
      end
      tags(sort: "title:asc") {
        title
        slug
      }
    }
  }
`;

export { GET_HOME };

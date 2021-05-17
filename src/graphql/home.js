import gql from "graphql-tag";
/* eslint-disable graphql/template-strings */
const GET_HOME = gql`
  query Home(
    $now: String!
    $eventLimit: Int!
    $postLimit: Int!
    $meetingLimit: Int!
    $fundingLimit: Int!
  ) {
    home {
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
      homeCarouselButton {
        id
        label
        menuItem {
          label
          url
        }
      }
      clickThroughBoxes {
        title
        url
        teaser
        icon
      }
    }

    meeting: events(
      limit: $eventLimit
      where: { type: "meeting", start_gte: $now }
      sort: "start:asc"
    ) {
      name
      type
      start
      end
      published_at
      timed
      summary
      slug
      type
      tags {
        title
        slug
      }
    }
    funding: events(
      limit: $eventLimit
      where: { type: "funding", start_gte: $now }
      sort: "start:asc"
    ) {
      name
      type
      start
      end
      published_at
      timed
      summary
      slug
      type
      tags {
        title
        slug
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

      tags(sort: "title:asc") {
        title
        slug
      }
      splash {
        url
        formats
      }
    }

    meetings(sort: "published_at:desc", limit: $meetingLimit) {
      id
      title
      summary
      slug
      created_at
      updated_at
      published_at
    }

    grants(sort: "posted:desc", limit: $fundingLimit) {
      id
      title
      slug
      summary
      posted
      expires
      tags(sort: "title:asc") {
        title
        slug
      }
    }
  }
`;

export { GET_HOME };

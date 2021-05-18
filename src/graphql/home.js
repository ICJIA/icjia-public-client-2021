import gql from "graphql-tag";
/* eslint-disable graphql/template-strings */
const GET_HOME = gql`
  query Home(
    $now: String!
    $eventLimit: Int!
    $postLimit: Int!
    $meetingLimit: Int!
    $fundingLimit: Int!
    $employmentLimit: Int!
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

    fundingEvents: grants(
      limit: $eventLimit
      where: { end_gte: $now }
      sort: "start:asc"
    ) {
      id
      published_at
      title
      start
      end
      summary
      slug
      category
    }

    meetingEvents: meetings(
      limit: $eventLimit
      where: { end_gte: $now }
      sort: "start:asc"
    ) {
      id
      published_at
      title
      start
      end
      summary
      slug
      category
    }

    communityEvents: events(
      where: { category: "community" }
      sort: "start:asc"
    ) {
      name
      slug
      summary
      start
      category
      end
    }

    trainingEvents: events(where: { category: "training" }, sort: "start:asc") {
      name
      slug
      summary
      start
      category
      end
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
      start
      end
      created_at
      updated_at
      published_at
    }

    jobs(sort: "published_at:desc", limit: $employmentLimit) {
      title
    }

    grants(sort: "start:desc", limit: $fundingLimit) {
      id
      title
      slug
      summary
      start
      end
      tags(sort: "title:asc") {
        title
        slug
      }
    }
  }
`;

export { GET_HOME };

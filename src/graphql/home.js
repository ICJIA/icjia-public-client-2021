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
      limit: $eventLimit
      where: { category: "community", end_gte: $now }
      sort: "start:asc"
    ) {
      name
      slug
      summary
      start
      category
      end
      published_at
    }

    trainingEvents: events(
      limit: $eventLimit
      where: { category: "training", end_gte: $now }
      sort: "start:asc"
    ) {
      name
      slug
      summary
      start
      category
      end
      published_at
    }

    featured: posts(
      sort: "published_at:desc"
      limit: 3
      where: { isFeatured: true }
    ) {
      id
      title
      slug
      summary
      created_at
      updated_at
      published_at
      dateOverride
      isFeatured
      splash {
        url
        formats
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

    jobs(sort: "end:desc", limit: $employmentLimit) {
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

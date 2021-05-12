import gql from "graphql-tag";
/* eslint-disable graphql/template-strings */
const GET_HOME = gql`
  query Home($now: String!, $eventLimit: Int!, $postLimit: Int!) {
    home {
      homeCarousel {
        title
        slide {
          title
          teaser
          image {
            formats
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
    }

    eventRange: events(
      limit: $eventLimit
      where: { start_lte: $now, end_gte: $now }
      sort: "start:asc"
    ) {
      id
      published_at
      name
      start
      end
      timed
      summary
      details
      slug

      type
    }

    events(limit: $eventLimit, where: { start_gte: $now }, sort: "start:asc") {
      id
      name
      start
      end
      published_at
      timed
      summary
      details
      slug
      type
    }

    posts(sort: "published_at:desc", limit: $postLimit) {
      id
      title
      slug
      summary
      body
      created_at
      updated_at
      published_at

      tags(sort: "title:asc") {
        id
        title
        slug
        created_at
        summary
      }
      splash {
        url
        formats
      }
    }
  }
`;

export { GET_HOME };

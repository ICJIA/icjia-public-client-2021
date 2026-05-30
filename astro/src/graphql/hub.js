/* eslint-disable graphql/template-strings */
// ResearchHub queries — these run against the SECOND Strapi instance
// (https://researchhub.icjia-api.cloud/graphql), passed to runQuery via the
// `endpoint` override (PUBLIC_HUB_GRAPHQL). The repo's ESLint graphql plugin
// only knows the agency schema, so — exactly as the legacy src/graphql/hub.js
// did — the tag is aliased to defeat schema validation on these strings.
import { gql } from "../lib/gql-client";
const ignoredGqlTag = gql;

// ── Counts + list (ported verbatim from src/graphql/hub.js) ──────────────────

const GET_ARTICLE_COUNT_QUERY = ignoredGqlTag`
  query countFilterArticles {
    articlesConnection(where: { status: "published" }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_ARTICLE_GROUP_QUERY = ignoredGqlTag`
  query articleGroup ($articleLimit: Int!, $start: Int!) {
    articles(
      limit: $articleLimit
      start: $start
      sort: "date:desc"
      where: { status: "published" }
    ) {
      id
      title
      slug
      abstract
      authors
      date
       tags
      categories
    }
  }
`;

const GET_ALL_DATASETS_QUERY = ignoredGqlTag`
  query datasets {
   datasets (sort: "date:desc",  where: {status: "published"}) {
      id
      title
      date
      slug
      description
      status
      external
      categories
      tags
      project
      updatedAt
    }
  }
`;

const GET_ALL_APPS_QUERY = ignoredGqlTag`
  query apps {
    apps(sort: "date:desc", where: { status: "published" }) {
      id
      title
      slug
      date
      description
      date
      contributors
      image
      tags
      categories
      updatedAt

    }
  }
`;

// ── Single-item detail + home banner (built from the legacy Hub single views;
//    fields verbatim from src/views/Hub/{ArticlesSingle,DatasetsSingle,
//    AppsSingle}.vue, parameterized with $slug instead of the legacy inline
//    string interpolation). ────────────────────────────────────────────────

// NOTE: the researchhub Strapi v3 SILENTLY IGNORES GraphQL `where` variables
// (a $slug variable returns ALL rows — the cause of the "every detail page shows
// article[0]" defect). Inline the slug (JSON.stringify → quoted + escaped) so the
// filter actually applies. Verified against the live hub: inline → exactly 1 row.
const GET_HUB_SINGLE_ARTICLE_QUERY = (slug) => ignoredGqlTag`
  query singleArticle {
    articles(where: { status: "published", slug: ${JSON.stringify(slug)} }) {
      id
      mainfiletype
      mainfile {
        name
        hash
        ext
        url
      }
      extrafile {
        name
        hash
        ext
        url
      }
      title
      status
      slug
      date
      external
      categories
      tags
      authors
      images
      abstract
      markdown
      splash
      thumbnail
      citation
      funding
    }
  }
`;

const GET_HUB_SINGLE_DATASET_QUERY = (slug) => ignoredGqlTag`
  query singleDataset {
    datasets(where: { status: "published", slug: ${JSON.stringify(slug)} }) {
      id
      title
      date
      slug
      description
      status
      external
      categories
      tags
      project
      timeperiod
      sources
      notes
      variables
      funding
      citation
      datafile {
        hash
        name
        ext
        url
      }
      createdAt
      updatedAt
      apps {
        title
        slug
      }
      articles {
        title
        slug
      }
    }
  }
`;

const GET_HUB_SINGLE_APP_QUERY = (slug) => ignoredGqlTag`
  query singleApp {
    apps(where: { status: "published", slug: ${JSON.stringify(slug)} }) {
      id
      title
      slug
      date
      description
      contributors
      image
      status
      external
      categories
      tags
      url
      funding
      citation
      createdAt
      updatedAt
      datasets {
        title
        slug
      }
      articles {
        title
        slug
      }
    }
  }
`;

const GET_HUB_HOME_BANNER_ARTICLES = ignoredGqlTag`
  query bannerArticles($limit: Int!) {
    articles(
      sort: "date:desc"
      limit: $limit
      where: { status: "published", hideFromBanner_ne: true }
    ) {
      id
      title
      status
      slug
      thumbnail
      hideFromBanner
      splash
      createdAt
      abstract
      authors
      date
    }
  }
`;

export {
  GET_ARTICLE_COUNT_QUERY,
  GET_ARTICLE_GROUP_QUERY,
  GET_ALL_DATASETS_QUERY,
  GET_ALL_APPS_QUERY,
  GET_HUB_SINGLE_ARTICLE_QUERY,
  GET_HUB_SINGLE_DATASET_QUERY,
  GET_HUB_SINGLE_APP_QUERY,
  GET_HUB_HOME_BANNER_ARTICLES,
};

<template>
  <div style="background: #fff; margin-top: -25px" class="news-item">
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-container class="markdown-body mt-8">
          <Splash
            v-if="news && news.splash && !news.hideSplash"
            :splash="news.splash"
            :key="news.title"
          ></Splash>
          <v-row>
            <v-col cols="12" :md="news.showTOC ? 8 : 12">
              <div style="font-weight: 900">
                <span
                  class="category"
                  style="font-size: 16px"
                  @click="search(getCategory(news.category))"
                  >{{ getCategory(news.category).toUpperCase() }}</span
                >
                |
                {{ news.publicationDate | format }}
              </div>
              <h1 v-html="render(news.title)" style="margin-top: 15px"></h1>
              <div v-html="render(news.body)"></div>
              <BasePropDisplay v-if="news.tags" name="">
                <BasePropChip v-for="tag in news.tags" :key="tag" class="mt-0">
                  <template>{{ tag }}</template>
                </BasePropChip>
              </BasePropDisplay>
              <div class="mt-12">
                <AttachmentList
                  :items="news.attachments"
                  :baseItemPublished="news.published_at"
                  v-if="news.attachments && news.attachments.length"
                  class="mt-8"
                  :hideUpdated="true"
                  :key="news.slug"
                  :label="
                    news.attachmentLabel && news.attachmentLabel.length
                      ? news.attachmentLabel
                      : ''
                  "
                ></AttachmentList>

                <RelatedList
                  :content="news"
                  title="Related Web Content"
                  class="mt-10"
                  v-if="isRelated"
                  background="white"
                  indentation=""
                ></RelatedList>
              </div>
            </v-col>
            <v-col
              cols="12"
              v-if="news && news.showTOC"
              md="4"
              class="px-3 hidden-sm-and-down"
              ><Toc :key="news.title"></Toc
            ></v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_POST_QUERY } from "@/graphql/news";
import { getProperCategory } from "@/utils/content";
import {
  getUnifiedTags,
  isRelatedContent,
  getPublicationDate,
} from "@/utils/content";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { EventBus } from "@/event-bus";
import { goToSearch } from "@/utils/search";
export default {
  data() {
    return {
      loading: true,
      error: null,
      news: null,
      isRelated: false,
    };
  },
  metaInfo() {
    const news = this.news;
    if (!news) return {};
    const slug = news.slug || this.$route.params.slug;
    const url = `https://icjia.illinois.gov/news/${slug}`;
    const STRAPI_BASE = "https://agency.icjia-api.cloud";
    const normalizeUrl = (u) => {
      if (typeof u !== "string" || !u) return null;
      const t = u.trim();
      if (/^https?:\/\//.test(t)) return t;
      if (t.startsWith("/")) return `${STRAPI_BASE}${t}`;
      return null;
    };
    let image = null;
    if (news.splash) {
      const fmts = news.splash.formats || {};
      const raw =
        (fmts.medium && fmts.medium.url) ||
        (fmts.small && fmts.small.url) ||
        (fmts.large && fmts.large.url) ||
        news.splash.url;
      image = normalizeUrl(raw);
    }
    const datePublished = news.dateOverride || news.published_at;
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: news.title,
      name: news.title,
      url,
      inLanguage: "en-US",
      publisher: {
        "@type": "GovernmentOrganization",
        name: "Illinois Criminal Justice Information Authority",
        alternateName: "ICJIA",
        url: "https://icjia.illinois.gov",
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    };
    if (datePublished) jsonld.datePublished = datePublished;
    if (news.updated_at) jsonld.dateModified = news.updated_at;
    if (news.summary) jsonld.description = news.summary;
    if (image) jsonld.image = image;
    if (Array.isArray(news.tags) && news.tags.length) {
      const keywords = news.tags
        .map((t) => (typeof t === "string" ? t : t && t.title))
        .filter(Boolean);
      if (keywords.length) jsonld.keywords = keywords.join(", ");
    }
    return {
      title: news.title,
      script: [{ type: "application/ld+json", json: jsonld }],
    };
  },
  created() {
    NProgress.start();
  },
  methods: {
    search(name) {
      goToSearch(this.$router, { query: name, type: "general" });
    },
    getCategory(category) {
      return getProperCategory(this.$myApp.config.maps.news, category);
    },
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    posts: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_POST_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.posts.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          let news = ApolloQueryResult.data.posts;
          news = getUnifiedTags(news);
          news = getPublicationDate(news);
          this.news = news[0];
          this.isRelated = isRelatedContent(this.news);
          EventBus.$emit("context-label", this.news.title);
          attachInternalLinks(this);
          attachSearchEvents(this);
          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>

<style>
/* .markdown-body .caption {
  font-size: 12px !important;
  color: #333;
  margin-top: -45px !important;
  margin-bottom: 30px;
} */
.news-item .markdown-body img {
  /* margin-bottom: 30px !important; */
  display: block !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
.news-item figure {
  margin-top: 25px;
  margin-bottom: 15px;
}

.news-item img + em {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #222;
  font-size: 12px;
  font-style: normal;
  margin-top: 5px;
  margin-bottom: 20px;
  font-family: "Lato", sans-serif !important;
}
</style>

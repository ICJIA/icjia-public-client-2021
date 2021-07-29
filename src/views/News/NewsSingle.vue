<template>
  <div
    style="background: #fff; min-height: 100vh !important; margin-top: -25px"
  >
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-container class="markdown-body mt-8">
          <Splash v-if="news && news.splash" :splash="news.splash"></Splash>
          <v-row>
            <v-col cols="12" :md="news.showTOC ? 9 : 12">
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
              <div class="my-5">
                <BasePropDisplay v-if="news.tags" name="">
                  <BasePropChip v-for="tag in news.tags" :key="tag">
                    <template>{{ tag }}</template>
                  </BasePropChip>
                </BasePropDisplay>
                <AttachmentList
                  :items="news.attachments"
                  v-if="news.attachments && news.attachments.length"
                  class="mt-8 pl-3"
                  :key="news.slug"
                  title="Attachments"
                ></AttachmentList>
              </div>

              <RelatedList
                :content="news"
                title="Related Content"
                class="mt-12"
                v-if="isRelated"
                background="white"
                indentation="ml-4 px-0 py-0"
              ></RelatedList>
            </v-col>
            <v-col
              cols="12"
              v-if="news && news.showTOC"
              md="3"
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
import NProgress from "nprogress";
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
export default {
  data() {
    return {
      loading: true,
      error: null,
      news: null,
      isRelated: false,
    };
  },
  created() {
    NProgress.start();
  },
  methods: {
    search(name) {
      let opts = {
        query: name,
        type: "general",
      };
      EventBus.$emit("search", opts);
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

<style></style>

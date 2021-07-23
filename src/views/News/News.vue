<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container>
          <v-row class="mb-10">
            <v-col cols="12">
              <h1>Latest News</h1>
              <div class="text-left">
                <Toggle @toggle="toggle"></Toggle>
              </div>
            </v-col>
          </v-row>

          <v-row v-if="view === 'grid'" class="masonry" dense>
            <v-col
              v-for="(item, index) in news"
              :key="index"
              class="child"
              cols="12"
              md="4"
              v-resize="resize"
            >
              <info-card
                :item="item"
                :view="view"
                :text-only="false"
                @init="resize"
                @imageLoaded="resize"
              ></info-card>
            </v-col>
          </v-row>
          <v-row v-if="view === 'list'" class="masonry" no-gutters>
            <v-col cols="12" sm="12" class="child">
              <div v-for="(item, index) in news" :key="`list-${index}`">
                <info-card
                  :item="item"
                  :view="view"
                  :text-only="true"
                  @init="resize"
                  @imageLoaded="resize"
                ></info-card>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { GET_ALL_NEWS_QUERY } from "@/graphql/news";
import { EventBus } from "@/event-bus";
// import moment from "moment";
// import _ from "lodash";

export default {
  name: "News",
  data() {
    return {
      filteredPosts: null,
      error: null,
      news: null,
      masonry: null,
      view: "grid",
    };
  },
  methods: {
    // eslint-disable-next-line no-unused-vars
    // mergePostsAndMeetings(posts, meetings) {
    //   let news = posts.concat(meetings);
    //   news.sort((b, a) => {
    //     return a.published_at.localeCompare(b.published_at);
    //   });
    //   this.news = news.slice(0, this.totalNewsItems);
    // },
    toggle(e) {
      this.view = e;
      // console.log('view: ', this.view)
      this.resize();
    },
    resize() {
      const elem = document.querySelector(".masonry");
      const masonry = new window.Masonry(elem, {
        itemSelector: ".child",
      });
      masonry.layout();
      console.log("layout resized");
    },
  },
  apollo: {
    posts: {
      prefetch: true,
      query: GET_ALL_NEWS_QUERY,
      variables() {
        return {};
      },

      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        let posts = ApolloQueryResult.data.posts.map((e) => ({
          ...e,
          fullPath: `/news/${e.slug}/`,
          contentType: "News",
        }));
        this.news = posts;
        EventBus.$emit("context-label", "Latest News");
        NProgress.done();
      },
    },
  },
};
</script>

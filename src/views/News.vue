<template>
  <div>
    <!-- {{ posts }}
    <div>
      {{ $apollo.error }}
    </div> -->
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <div class="text-right">
                <Toggle @toggle="toggle"></Toggle>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-container class="view-container" :fluid="view === 'block'">
          <v-row v-if="view === 'block'" class="masonry">
            <v-col
              v-for="(item, index) in news"
              :key="index"
              class="child"
              cols="12"
              md="4"
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
          <v-row
            v-if="view === 'list'"
            style="margin-top: -20px"
            class="masonry"
          >
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
import { GET_ALL_NEWS_QUERY } from "@/graphql/news";
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
      view: "block",
    };
  },
  methods: {
    // eslint-disable-next-line no-unused-vars
    mergePostsAndMeetings(posts, meetings) {
      let news = posts.concat(meetings);
      news.sort((b, a) => {
        return a.published_at.localeCompare(b.published_at);
      });
      this.news = news.slice(0, this.totalNewsItems);
    },
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
        let meetings = ApolloQueryResult.data.meetings.map((e) => ({
          ...e,
          fullPath: `/meetings/${e.slug}/`,
          contentType: "Meeting",
        }));
        this.mergePostsAndMeetings(posts, meetings);
      },
    },
  },
};
</script>

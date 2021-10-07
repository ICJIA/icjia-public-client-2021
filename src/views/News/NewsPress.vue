<template>
  <div class="markdown-body mb-12">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container>
          <v-row class="mb-10 page-heading">
            <v-col cols="12">
              <h1>Press Releases</h1>
            </v-col>
          </v-row>

          <v-row v-if="view === 'grid'" dense style="margin-top: -30px">
            <v-col
              v-for="(item, index) in news"
              :key="index"
              class="flex-container"
              cols="12"
              md="6"
            >
              <NewsCard
                :item="item"
                class="flex-item"
                :textOnly="false"
                :showUpdated="false"
                :imageHeight="275"
              ></NewsCard>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { GET_ALL_PRESS_QUERY } from "@/graphql/news";
import { EventBus } from "@/event-bus";
import { getUnifiedTags, getPublicationDate } from "@/utils/content";
// import moment from "moment";
import _ from "lodash";

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
    toggle(e) {
      this.view = e;
      // console.log('view: ', this.view)
      //this.resize();
    },
  },
  mounted() {},
  apollo: {
    posts: {
      prefetch: true,
      query: GET_ALL_PRESS_QUERY,
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
        //TODO: Make these chainable
        posts = getUnifiedTags(posts);
        posts = getPublicationDate(posts);
        this.news = _.orderBy(posts, ["publicationDate"], ["desc"]);
        EventBus.$emit("context-label", "Press Releases");
        NProgress.done();
      },
    },
  },
};
</script>

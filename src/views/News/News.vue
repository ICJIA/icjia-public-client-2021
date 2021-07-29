<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container>
          <v-row class="mb-10 page-heading">
            <v-col cols="12">
              <h1>News & Information</h1>
              <div>
                <Toggle @toggle="toggle"></Toggle>
              </div>
            </v-col>
          </v-row>

          <v-row v-if="view === 'grid'" dense>
            <v-col
              v-for="(item, index) in news"
              :key="index"
              class="flex-container"
              cols="12"
              md="4"
            >
              <NewsCard
                :item="item"
                class="flex-item"
                :textOnly="false"
                :showUpdated="false"
              ></NewsCard>
            </v-col>
          </v-row>

          <v-row v-if="view === 'list'" no-gutters>
            <v-col cols="12" sm="12">
              <div
                v-for="(item, index) in news"
                :key="`list-${index}`"
                class="mb-8"
              >
                <info-card
                  :item="item"
                  :view="view"
                  :text-only="true"
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
      this.resize();
    },
  },
  mounted() {
    EventBus.$emit("context-label", "All News & Information");
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
        //TODO: Make these chainable
        posts = getUnifiedTags(posts);
        posts = getPublicationDate(posts);
        this.news = _.orderBy(posts, ["publicationDate"], ["desc"]);
        NProgress.done();
      },
    },
  },
};
</script>

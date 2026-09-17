<template>
  <div class="pt-10 pb-12 markdown-body">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1>Articles</h1>
        </v-col>
      </v-row>
      <v-row v-if="initialLoad">
        <v-col cols="12" md="4" v-for="n in 3" :key="n">
          <Loader loaderType="skeleton" :repeat="1"></Loader>
        </v-col>
      </v-row>

      <v-row v-if="!initialLoad" style="margin-top: -25px">
        <v-col cols="12" md="6" class="hidden-sm-and-down">
          <div style="font-weight: 900; font-size: 12px">
            Showing: {{ shownCount }} of {{ articleCount }} articles
          </div>
        </v-col>
        <v-col cols="12" md="6" class="hidden-sm-and-down">
          <div class="text-right">
            <!-- aria-pressed exposes the selected view, which is otherwise
                 shown only by style (WCAG 4.1.2). -->
            <v-btn-toggle v-model="orientation">
              <v-btn
                value="list"
                small
                aria-label="List view"
                :aria-pressed="orientation === 'list' ? 'true' : 'false'"
              >
                <span>List</span>

                <span aria-hidden="true" class="mdi mdi-format-list-bulleted">
                </span>
              </v-btn>

              <v-btn
                value="grid"
                small
                aria-label="Grid view"
                :aria-pressed="orientation === 'grid' ? 'true' : 'false'"
              >
                <span>Grid</span>

                <span class="mdi mdi-view-module" aria-hidden="true"> </span>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col> </v-col>
      </v-row>
      <v-row dense v-if="orientation === 'grid'">
        <v-col
          v-for="(item, index) in hubArticles"
          :key="index"
          :data-article-index="index"
          cols="12"
          md="4"
          class="flex-container"
        >
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="false"
            class="flex-item"
          ></HubCard>
        </v-col>
      </v-row>
      <v-row dense v-else>
        <v-col
          v-for="(item, index) in hubArticles"
          :key="index"
          :data-article-index="index"
          cols="12"
        >
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="true"
          ></HubCard>
        </v-col>
      </v-row>

      <v-row v-if="!initialLoad">
        <v-col
          v-if="start + articleLimit < articleCount"
          cols="12"
          class="text-center"
        >
          <v-btn
            @click="loadMore()"
            :loading="$apollo.loading"
            :disabled="$apollo.loading"
            >Load more
          </v-btn>
          <p
            v-if="loadMoreFailed"
            role="alert"
            class="error white--text d-inline-block px-3 py-1 mt-3 mb-0"
          >
            The articles could not be loaded. Try again.
          </p>
        </v-col>
        <v-col cols="12" class="text-center"
          ><div style="font-size: 10px; font-weight: 900; margin-top: -15px">
            <span v-if="shownCount < articleCount"
              >Showing {{ shownCount }} of {{ articleCount }} articles</span
            >
            <span v-else>Showing all {{ articleCount }} articles</span>
          </div></v-col
        >
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import {
  GET_ARTICLE_GROUP_QUERY,
  GET_ARTICLE_COUNT_QUERY,
} from "@/graphql/hub";
import dayjs from "@/plugins/dayjs";
import _ from "lodash";
import NProgress from "@/services/Progress";
import { EventBus } from "@/event-bus";
import { runQuery } from "@/gql-client";
export default {
  metaInfo: {
    title: "Research Hub Articles",
  },
  name: "Articles",
  data() {
    return {
      filteredPosts: null,
      error: null,
      loading: true,
      hubArticles: [],
      start: 0,
      articleLimit: 42,
      articleCount: null,
      view: "grid",
      loadMoreFailed: false,
      initialLoad: true,
      masonry: null,
      // Initialize from URL so deep links and back-navigations restore
      // the user's view + pagination. Was: hard-coded "grid" / start: 0
      // which threw away state on every visit.
      orientation: this.$route.query.view === "list" ? "list" : "grid",
    };
  },

  computed: {
    // The last group can be short: 265 articles in groups of 42 end at 265,
    // not 294.
    shownCount() {
      const upTo = this.start + this.articleLimit;
      return this.articleCount == null
        ? upTo
        : Math.min(upTo, this.articleCount);
    },
  },

  watch: {
    // Mirror the view toggle into ?view=list so the toggle is
    // bookmarkable, shareable, and survives a refresh.
    orientation(next) {
      const desired = next === "list" ? "list" : undefined;
      if ((this.$route.query.view || undefined) === desired) return;
      const query = { ...this.$route.query };
      if (desired) query.view = desired;
      else delete query.view;
      this.$router.replace({ path: this.$route.path, query }).catch(() => {});
    },
  },

  methods: {
    progress() {
      NProgress.start();
      if (!this.$apollo.loading) {
        NProgress.done();
      }
    },
    toggle(e) {
      this.view = e;
      this.initialView = true;
      this.resize();
      NProgress.done();
    },
    // The fetch shim (mixins/apollo-shim.js) runs each query once, on
    // created(), and does not run it again when its variables change, so
    // changing `start` alone fetched nothing and "Load more" did nothing.
    // Fetch the next group here and feed it through the initial load's
    // handler, as EventsAll's toggleRange does. `start` moves only once the
    // group has arrived: a failed request leaves the count and the button
    // as they were, says so, and the next press asks for the same group. The
    // button is disabled while loading, which drops keyboard focus, so focus
    // then moves to the first new article (WCAG 2.4.3).
    loadMore() {
      const firstNew = this.hubArticles.length;
      const start = this.start + this.articleLimit;
      this.loadMoreFailed = false;
      this.$apollo.loading = true;
      runQuery(
        GET_ARTICLE_GROUP_QUERY,
        { articleLimit: this.articleLimit, start },
        "no-cache",
        this.$options.apollo.articles.context.uri
      )
        .then((r) => {
          this.start = start;
          this.$options.apollo.articles.result.call(this, r);
          this.$nextTick(() => {
            const col = this.$el.querySelector(
              `[data-article-index="${firstNew}"]`
            );
            const link = col && col.querySelector("a[href]");
            if (link) link.focus();
          });
        })
        .catch(() => {
          this.loadMoreFailed = true;
        })
        .finally(() => {
          this.$apollo.loading = false;
        });
    },
  },
  mounted() {
    NProgress.start();
    EventBus.$emit("context-label", "Articles");
  },
  apollo: {
    articlesConnection: {
      prefetch: true,
      // fetchPolicy: "no-cache",
      query: GET_ARTICLE_COUNT_QUERY,
      variables() {
        return {};
      },
      context: {
        uri: "https://researchhub.icjia-api.cloud/graphql",
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        NProgress.done();
        this.articleCount =
          ApolloQueryResult.data.articlesConnection.aggregate.count;
      },
    },
    articles: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_ARTICLE_GROUP_QUERY,
      variables() {
        return {
          articleLimit: this.articleLimit,
          start: this.start,
        };
      },
      context: {
        uri: "https://researchhub.icjia-api.cloud/graphql",
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        //console.log(ApolloQueryResult.data.articles);
        this.initialLoad = false;
        let hubArticles = ApolloQueryResult.data.articles;
        hubArticles = _.orderBy(hubArticles, ["date"], ["desc"]);
        hubArticles = hubArticles.map((e) => ({
          ...e,
          fullPath: `/researchhub/articles/${e.slug}/`,
          imagePath: `https://icjia.illinois.gov/images/${e.id}-splash.jpeg`,
          contentType: "article",
        }));
        this.hubArticles.push(...hubArticles);
        this.initialLoad = false;
        this.loading = false;
        NProgress.done();
      },
    },
  },
};
</script>

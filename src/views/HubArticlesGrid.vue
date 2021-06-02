<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <div class="text-right">
            <v-btn-toggle v-model="icon" borderless>
              <v-btn
                value="list"
                small
                aria-label="List view"
                @click="$router.push('/researchhub/articles/list/')"
              >
                <span class="hidden-sm-and-down">List</span>

                <span aria-hidden="true" class="mdi mdi-format-list-bulleted">
                </span>
              </v-btn>

              <v-btn value="grid" small>
                <span class="hidden-sm-and-down" aria-label="Grid view"
                  >Grid</span
                >

                <span class="mdi mdi-view-module" aria-hidden="true"> </span>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col> </v-col>
      </v-row>
      <v-row class="masonry" dense>
        <v-col v-if="initialLoad" cols="12" md="4" class="text-center">
          <v-skeleton-loader
            type="card-avatar, article, actions"
          ></v-skeleton-loader>
        </v-col>
        <v-col v-if="initialLoad" cols="12" md="4" class="text-center">
          <v-skeleton-loader
            type="card-avatar, article, actions"
          ></v-skeleton-loader>
        </v-col>
        <v-col v-if="initialLoad" cols="12" md="4" class="text-center">
          <v-skeleton-loader
            type="card-avatar, article, actions"
          ></v-skeleton-loader>
        </v-col>

        <v-col
          v-for="(item, index) in hubArticles"
          :key="index"
          class="child"
          cols="12"
          md="4"
        >
          <HubCard
            :item="item"
            :textOnly="false"
            @init="resizeInit"
            @imageLoaded="resize"
          ></HubCard>
        </v-col>
      </v-row>

      <v-row v-if="start + articleLimit <= articleCount">
        <v-col cols="12" class="text-center">
          <v-btn
            @click="loadMore()"
            :loading="$apollo.loading"
            :disabled="$apollo.loading"
            >Load more
          </v-btn>
        </v-col>
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
import moment from "moment";
import _ from "lodash";
import nprogress from "nprogress";
export default {
  name: "Articles",
  data() {
    return {
      filteredPosts: null,
      error: null,
      loading: true,
      hubArticles: [],
      start: 0,
      articleLimit: 24,
      articleCount: null,
      view: "grid",
      initialLoad: true,
      masonry: null,
      icon: "block",
    };
  },

  methods: {
    progress() {
      nprogress.start();
      if (!this.$apollo.loading) {
        nprogress.done();
      }
    },
    toggle(e) {
      this.view = e;
      this.initialView = true;
      // console.log('view: ', this.view)
      this.resize();
      nprogress.done();
    },
    loadMore() {
      this.start = this.start + this.articleLimit;
      console.log("load more here", this.start, this.articleLimit);
    },
    resizeInit() {
      nprogress.start();
      const elem = document.querySelector(".masonry");
      this.masonry = new window.Masonry(elem, {
        itemSelector: ".child",
      });
      this.resize();
      //console.log("layout init");
    },
    resize() {
      this.masonry.layout();
      nprogress.done();
      //console.log("layout resized");
    },
  },
  mounted() {
    nprogress.start();
  },
  apollo: {
    articlesConnection: {
      prefetch: true,
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
        nprogress.done();
        this.articleCount =
          ApolloQueryResult.data.articlesConnection.aggregate.count;
      },
    },
    articles: {
      prefetch: true,

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
          imagePath: `https://icjia.illinois.gov/researchhub/images/${e.id}-splash.jpeg`,
          contentType: "Article",
        }));
        this.hubArticles.push(...hubArticles);
        nprogress.done();
      },
    },
  },
};
</script>

<template>
  <div>
    <v-container fluid>
      <v-row class="masonry" dense>
        <v-col
          v-for="(item, index) in hubArticles"
          :key="index"
          class="child"
          cols="12"
          md="4"
          v-resize="resize"
        >
          <HubCard :item="item" @init="resize" @imageLoaded="resize"></HubCard>
        </v-col>
      </v-row>
      {{ articleCount }}
      <v-row>
        <v-col cols="12" class="text-center">
          <v-btn @click="loadMore()">Load more </v-btn>
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
    };
  },
  methods: {
    loadMore() {
      console.log("load more here", this.start, this.articleLimit);
      this.start = this.start + this.articleLimit;
    },
    resize() {
      const elem = document.querySelector(".masonry");
      const masonry = new window.Masonry(elem, {
        itemSelector: ".child",
      });
      masonry.layout();
      //console.log("layout resized", elem);
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

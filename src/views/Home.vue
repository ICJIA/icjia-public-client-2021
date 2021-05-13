<template>
  <div>
    <div v-if="!homeLoading && !hubLoading">
      <!-- <h2>Slider</h2>
      {{ slider }}
      <h2>Slider buttons</h2>
      {{ buttons }}
      <h2>Events</h2>
      {{ events }}
      <h2>Posts</h2>
      {{ posts }}
      <h2>Research Hub Apps</h2>
      {{ hubApplications }}
      <h2>Research Hub Articles</h2>
      {{ hubArticles }}
      <h2>Research Hub Datasets</h2>
      {{ hubDatasets }} -->
      <HomeSplash :slider="slider"></HomeSplash>
    </div>
    <div v-else>
      <Loader></Loader>
    </div>

    <div>{{ error }}</div>
  </div>
</template>

<script>
import { GET_HOME } from "@/graphql/home";
import {
  getHubApplications,
  getHubArticles,
  getHubDatasets,
} from "@/services/ResearchHub";
export default {
  data() {
    return {
      slides: null,
      error: null,
      homeLoading: true,
      hubLoading: true,
      events: null,
      posts: null,
      slider: null,
      buttons: null,
      hubApplications: null,
      hubArticles: null,
      hubDatasets: null,
      limit: 3,
    };
  },
  methods: {
    async fetchHubContent() {
      this.hubApplications = await getHubApplications(this.limit);
      this.hubArticles = await getHubArticles(this.limit);
      this.hubDatasets = await getHubDatasets(this.limit);
      this.hubLoading = false;
    },
  },
  apollo: {
    home: {
      prefetch: true,
      query: GET_HOME,
      variables() {
        return {
          now: new Date(),
          eventLimit: 25,
          postLimit: 5,
        };
      },

      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        // console.log(ApolloQueryResult);
        this.events = ApolloQueryResult.data.events;
        this.posts = ApolloQueryResult.data.posts;
        this.slider = ApolloQueryResult.data.home.homeCarousel;
        this.buttons = ApolloQueryResult.data.home.homeCarouselButton;
        this.homeLoading = false;
        this.fetchHubContent();
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

<template>
  <div>
    <div v-if="!homeLoading">
      <h2>Slider</h2>
      {{ slider }}
      <h2>Slider buttons</h2>
      {{ buttons }}
      <h2>Events</h2>
      {{ events }}
      <h2>Posts</h2>
      {{ posts }}
    </div>
    <div v-else>
      <Loader></Loader>
    </div>
  </div>
</template>

<script>
import { GET_HOME } from "@/graphql/home";
export default {
  data() {
    return {
      slides: null,
      error: null,
      homeLoading: true,
      events: null,
      posts: null,
      slider: null,
      buttons: null,
    };
  },
  apollo: {
    home: {
      prefetch: true,
      query: GET_HOME,
      variables() {
        return {
          now: new Date(),
          eventLimit: 5,
          postLimit: 5,
        };
      },

      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        console.log(ApolloQueryResult);
        this.events = ApolloQueryResult.data.events;
        this.posts = ApolloQueryResult.data.posts;
        this.slider = ApolloQueryResult.data.home.homeCarousel;
        this.buttons = ApolloQueryResult.data.home.homeCarouselButton;
        this.homeLoading = false;
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

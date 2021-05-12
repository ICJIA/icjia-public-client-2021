<template>
  <div>
    <!-- <HomeSplash :slides="slides" :loading="loading"></HomeSplash>  -->
    <h2>Slider</h2>
    {{ slider }}
    <h2>Events</h2>
    {{ events }}
    <h2>Posts</h2>
    {{ posts }}
  </div>
</template>

<script>
import { GET_HOME } from "@/graphql/home";
export default {
  data() {
    return {
      slides: null,
      error: null,
      loading: false,
      events: null,
      posts: null,
      slider: null,
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
      // context: {
      //   uri: "http://127.0.0.1:8000/graphql/countries",
      // },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        console.log(ApolloQueryResult);
        this.events = ApolloQueryResult.data.events;
        this.posts = ApolloQueryResult.data.posts;
        this.slider = ApolloQueryResult.data.home.homeCarousel;
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

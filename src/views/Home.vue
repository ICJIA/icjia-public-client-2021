<template>
  <div>
    <div v-if="!homeLoading">
      <HomeSplash :slider="slider" :buttons="buttons"></HomeSplash>

      <HomeResearch style="margin-top: -10px"></HomeResearch>
      <HomeClickThroughBoxes
        :boxes="boxes"
        style="margin-top: -30px"
      ></HomeClickThroughBoxes>
    </div>
    <div v-else>
      <Loader></Loader>
    </div>

    <div>{{ error }}</div>
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
      hubLoading: true,
      events: null,
      posts: null,
      slider: null,
      buttons: null,

      limit: 3,
    };
  },
  methods: {},
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
        this.boxes = ApolloQueryResult.data.home.clickThroughBoxes;
        //console.log("home: ", ApolloQueryResult.data.home);
        this.homeLoading = false;
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

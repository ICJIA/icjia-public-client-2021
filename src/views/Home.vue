<template>
  <div>
    <div v-if="error">{{ error }}</div>
    <HomeSplash
      :slider="slider"
      :buttons="buttons"
      v-if="!homeLoading"
    ></HomeSplash>
    <v-card height="550" class="px-3 py-3" v-if="homeLoading">
      <Loader></Loader>
    </v-card>
    <HomeClickThroughBoxes
      :boxes="boxes"
      v-if="!homeLoading"
    ></HomeClickThroughBoxes>

    <HomeResearch style="margin-top: -10px"></HomeResearch>
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
        this.events = ApolloQueryResult.data.events;
        this.posts = ApolloQueryResult.data.posts;
        this.slider = ApolloQueryResult.data.home.homeCarousel;
        this.buttons = ApolloQueryResult.data.home.homeCarouselButton;
        this.boxes = ApolloQueryResult.data.home.clickThroughBoxes;
        this.homeLoading = false;
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

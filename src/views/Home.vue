<template>
  <div>
    <div v-if="error">{{ error }}</div>
    <HomeSplash
      :slider="slider"
      :buttons="buttons"
      v-if="!loading"
    ></HomeSplash>
    <v-card height="550" class="px-3 py-3" v-if="loading">
      <Loader></Loader>
    </v-card>

    <HomeResearch style="margin-top: 15px"></HomeResearch>
    <HomeClickThroughBoxes
      :boxes="boxes"
      v-if="!loading"
      style="margin-top: -5px"
    ></HomeClickThroughBoxes>
    <v-container fluid style="margin-top: -5px">
      <v-row>
        <v-col cols="12" md="6">
          <HomeNews :items="news" :loading="loading"></HomeNews
        ></v-col>
        <v-col cols="12" md="6"
          ><HomeTabbed
            :grants="grants"
            :employment="employment"
            :loading="loading"
          ></HomeTabbed
        ></v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { GET_HOME } from "@/graphql/home";

export default {
  data() {
    return {
      slides: null,
      error: null,
      loading: true,
      hubLoading: true,
      news: null,
      grants: null,
      employment: null,
      slider: null,
      buttons: null,
      totalNewsItems: 4,
      limit: 3,
    };
  },
  methods: {
    // eslint-disable-next-line no-unused-vars
    mergePostsAndMeetings(posts, meetings) {
      let news = posts.concat(meetings);
      news.sort((b, a) => {
        return a.published_at.localeCompare(b.published_at);
      });
      this.news = news.slice(0, this.totalNewsItems);
    },
  },
  apollo: {
    home: {
      prefetch: true,
      query: GET_HOME,
      variables() {
        return {
          now: new Date(),
          eventLimit: 6,
          postLimit: 6,
          fundingLimit: 5,
          meetingLimit: 5,
          employmentLimit: 5,
        };
      },

      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        // News and Info
        const posts = ApolloQueryResult.data.posts;
        const meetings = ApolloQueryResult.data.meetings;
        this.mergePostsAndMeetings(posts, meetings);
        // Funding and Employment
        this.grants = ApolloQueryResult.data.grants;
        this.employment = ApolloQueryResult.data.jobs;
        //Home page UI
        this.slider = ApolloQueryResult.data.home.homeCarousel;
        this.buttons = ApolloQueryResult.data.home.homeCarouselButton;
        this.boxes = ApolloQueryResult.data.home.clickThroughBoxes;
        this.loading = false;
        //Events
        console.log("fundingEvents: ", ApolloQueryResult.data.fundingEvents);
        console.log("meetingEvents: ", ApolloQueryResult.data.meetingEvents);
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

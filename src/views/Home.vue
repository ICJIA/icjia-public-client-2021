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

    <HomeResearch></HomeResearch>
    <HomeClickThroughBoxes
      :boxes="boxes"
      v-if="!loading && boxes.length > 0"
      style="margin-top: -30px"
    ></HomeClickThroughBoxes>
    <div style="background: #fff; z-index: 1">
      <WidgetBar
        title="News & Information"
        mobileTitle="Latest News"
        :menuItems="newsMenuItems"
        style="margin-top: -10px"
      ></WidgetBar>
      <v-container fluid style="margin-top: 0px; z-index: 10">
        <v-row>
          <v-col
            cols="12"
            md="6"
            style="
              margin: 0;
              padding: 0;
              margin-top: 0px;
              border-right: 1px solid #e8e8e8;
            "
          >
            <div
              style="
                height: 15px;
                background: #fff !important;
                border-top: 1px solid #e8e8e8;
              "
            ></div>
            <HomeNews :items="news" :loading="loading"></HomeNews
          ></v-col>
          <v-col
            cols="12"
            md="6"
            style="margin: 0; padding: 0; margin-top: -8px"
            ><HomeTabbed
              :grants="grants"
              :employment="employment"
              :loading="loading"
            ></HomeTabbed
          ></v-col>
        </v-row>
      </v-container>
    </div>

    <HomeClickThroughBoxes
      :boxes="boxesSecondTier"
      v-if="!loading && boxesSecondTier.length > 0"
      style="margin-top: 10px"
    ></HomeClickThroughBoxes>

    <HomeEvents
      :meetings="meetingEvents"
      :funding="fundingEvents"
      :training="trainingEvents"
      :community="communityEvents"
      :loading="loading"
      style="margin-top: -10px"
    ></HomeEvents>
  </div>
</template>

<script>
import { GET_HOME } from "@/graphql/home";
import nprogress from "nprogress";
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
      totalNewsItems: 5,
      limit: 3,
      trainingEvents: null,
      fundingEvents: null,
      meetingEvents: null,
      communityEvents: null,
      newsMenuItems: [
        {
          label: "News",
          url: "/news/",
        },
        {
          label: "Funding",
          url: "/gata/funding/",
        },
        {
          label: "Employment",
          url: "/employment/",
        },
      ],
    };
  },
  mounted() {
    nprogress.start();
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
          eventLimit: 3,
          postLimit: 6,
          fundingLimit: 4,
          meetingLimit: 5,
          employmentLimit: 5,
        };
      },

      error(error) {
        this.error = JSON.stringify(error.message);
        nprogress.done();
      },
      result(ApolloQueryResult) {
        // News and Info

        let posts = ApolloQueryResult.data.posts.map((e) => ({
          ...e,
          fullPath: `/news/${e.slug}/`,
          contentType: "News",
        }));
        let meetings = ApolloQueryResult.data.meetings.map((e) => ({
          ...e,
          fullPath: `/meetings/${e.slug}/`,
          contentType: "Meeting",
        }));
        this.mergePostsAndMeetings(posts, meetings);
        // Funding and Employment
        this.grants = ApolloQueryResult.data.grants.map((e) => ({
          ...e,
          fullPath: `/gata/funding/${e.slug}/`,
          contentType: "Funding",
        }));
        this.employment = ApolloQueryResult.data.jobs.map((e) => ({
          ...e,
          fullPath: `/employment/${e.slug}/`,
          contentType: "Employment",
        }));
        //Home page UI
        this.slider = ApolloQueryResult.data.home.homeCarousel;
        this.buttons = ApolloQueryResult.data.home.homeCarouselButton;
        this.boxes = ApolloQueryResult.data.home.clickThroughBoxes;
        this.boxesSecondTier =
          ApolloQueryResult.data.home.clickThroughBoxesSecondTier;

        //Data adjustments

        this.trainingEvents = ApolloQueryResult.data.trainingEvents.map(
          (e) => ({
            ...e,
            title: e.name,
          })
        );
        this.communityEvents = ApolloQueryResult.data.communityEvents.map(
          (e) => ({
            ...e,
            title: e.name,
          })
        );
        this.meetingEvents = ApolloQueryResult.data.meetingEvents;
        this.fundingEvents = ApolloQueryResult.data.fundingEvents;
        this.loading = false;
        nprogress.done();
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

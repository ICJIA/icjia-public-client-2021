<template>
  <div>
    <div v-if="error">{{ error }}</div>
    <HomeSplash
      :slider="slider"
      :buttons="buttons"
      v-if="!loading"
    ></HomeSplash>
    <v-card height="550" class="px-3 py-3" v-if="loading">
      <Loader
        loaderType="skeleton"
        :repeat="3"
        loaderDisplayType="card"
      ></Loader>
    </v-card>

    <HomeResearch></HomeResearch>
    <!-- <HomeClickThroughBoxes
      :boxes="boxes"
      v-if="!loading && boxes.length > 0"
      style="margin-top: -30px"
    ></HomeClickThroughBoxes> -->
    <div style="background: #fff; z-index: 1; margin-top: -20px">
      <WidgetBar
        title="News & Information"
        mobileTitle="News"
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
            <div style="height: 15px; background: #fff !important"></div>
            <HomeNews :items="news" :loading="loading"></HomeNews
          ></v-col>
          <v-col
            cols="12"
            md="6"
            style="margin: 0; padding: 0; margin-top: -8px"
            ><HomeTabbed
              :grants="grants"
              :employment="employment"
              :meetings="meetings"
              :loading="loading"
            ></HomeTabbed
          ></v-col>
        </v-row>
      </v-container>
    </div>

    <!-- <HomeClickThroughBoxes
      :boxes="boxesSecondTier"
      v-if="!loading && boxesSecondTier.length > 0"
      style="margin-top: 10px"
    ></HomeClickThroughBoxes> -->

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
// eslint-disable-next-line no-unused-vars
import { getUnifiedTags, getPublicationDate } from "@/utils/content";
import _ from "lodash";
export default {
  name: "Home",
  metaInfo: {
    title: "Home",
  },
  data() {
    return {
      slides: null,
      error: null,
      loading: true,
      hubLoading: true,
      news: null,
      meetings: null,
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
          label: "Meetings",
          url: "/news/meetings/",
        },
        {
          label: "Funding",
          url: "/grants/funding/",
        },
        {
          label: "Employment",
          url: "/about/employment/",
        },
        {
          label: "Events",
          url: "/news/events/",
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
          eventLimit: this.$myApp.config.home.eventLimit,
          postLimit: this.$myApp.config.home.postLimit,
          fundingLimit: this.$myApp.config.home.fundingLimit,
          meetingLimit: this.$myApp.config.home.meetingLimit,
          employmentLimit: this.$myApp.config.home.employmentLimit,
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
        posts = getPublicationDate(posts);
        this.news = _.orderBy(posts, ["publicationDate"], ["desc"]);

        let meetings = ApolloQueryResult.data.meetings.map((e) => ({
          ...e,
          fullPath: `/news/meetings/${e.slug}/`,
          contentType: "Meeting",
        }));
        this.meetings = _.orderBy(meetings, ["end"], ["desc"]);
        //console.log("meetings: ", meetings);
        // Funding and Employment
        this.grants = ApolloQueryResult.data.grants.map((e) => ({
          ...e,
          fullPath: `/grants/funding/${e.slug}/`,
          contentType: "Funding",
        }));
        this.grants = _.orderBy(this.grants, ["end"], ["desc"]);
        this.employment = ApolloQueryResult.data.jobs.map((e) => ({
          ...e,
          fullPath: `/about/employment/${e.slug}/`,
          contentType: "Employment",
        }));
        this.employment = _.orderBy(this.employment, ["end"], ["desc"]);
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
            fullPath: `/events/${e.slug}/`,
            contentType: "Event",
            color: "green darken-4",
          })
        );
        this.communityEvents = ApolloQueryResult.data.communityEvents.map(
          (e) => ({
            ...e,
            title: e.name,
            fullPath: `/events/${e.slug}/`,
            contentType: "Event",
            color: "green darken-4",
          })
        );
        this.meetingEvents = ApolloQueryResult.data.meetingEvents.map((e) => ({
          ...e,
          fullPath: `/news/meetings/${e.slug}/`,
          contentType: "Meeting",
          color: "blue darken-2",
        }));
        this.fundingEvents = ApolloQueryResult.data.fundingEvents.map((e) => ({
          ...e,
          fullPath: `/grants/funding/${e.slug}/`,
          contentType: "Funding",
          color: "indigo darken-4",
        }));
        this.loading = false;
        nprogress.done();
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>

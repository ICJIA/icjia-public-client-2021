<template>
  <div class="mt-10 mb-12">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container class="mb-6">
          <v-row>
            <v-col cols="12" :md="viewToggle === 'category' ? 8 : 12">
              <div class="markdown-body mb-10 page-heading">
                <h1>ICJIA Meetings</h1>

                <v-btn-toggle v-model="viewToggle" mandatory>
                  <v-btn value="all" small elevation="1">
                    <span class="button-weight" aria-label="By date"
                      >By date</span
                    >

                    <span class="mdi mdi-calendar" aria-hidden="true"> </span>
                  </v-btn>
                  <v-btn
                    value="category"
                    elevation="1"
                    small
                    aria-label="By category"
                  >
                    <span class="button-weight" aria-label="By category"
                      >By category</span
                    >

                    <span
                      aria-hidden="true"
                      class="mdi mdi-format-list-bulleted"
                    >
                    </span>
                  </v-btn>
                </v-btn-toggle>
              </div>
            </v-col>
          </v-row>
        </v-container>

        <v-container v-if="viewToggle == 'all'" style="margin-top: -25px">
          <v-row>
            <v-col cols="12">
              <MeetingTable :items="meetings" v-if="meetings"></MeetingTable>
            </v-col>
          </v-row>
        </v-container>
        <v-container v-if="viewToggle == 'category'" style="margin-top: -25px">
          <v-row>
            <v-col cols="12" md="8">
              <div
                v-for="(category, index) in categoryMap"
                :key="index"
                class="mb-10"
              >
                <MeetingTable
                  v-if="meetings"
                  :items="filterMeetingsByCategory(category.category)"
                  :heading="category.label"
                  :text="category.text || null"
                  class="elevation-1"
                ></MeetingTable>
              </div>
            </v-col>
            <v-col
              cols="12"
              v-if="meetings"
              md="4"
              class="px-3 hidden-sm-and-down"
              style="margin-top: -150px"
            >
              <Toc :key="viewToggle" tocHeading="Meetings"></Toc>
            </v-col>
          </v-row>
        </v-container>
        <v-container
          ><v-row
            ><v-col>
              <div
                class="mt-0 text-left"
                style="font-size: 12px; margin-bottom: 75px"
              >
                Meeting materials prior to December, 2020 are available in the
                <a href="https://archive.icjia.cloud">ICJIA Document Archive</a
                >.
              </div></v-col
            ></v-row
          ></v-container
        >
      </template>
    </BaseContent>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";

import { GET_ALL_MEETINGS_QUERY } from "@/graphql/meetings";
import { getUnifiedTags } from "@/utils/content";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      viewToggle: "all",
      loading: true,
      error: null,
      content: null,
      meetings: null,
      categoryMap: this.$myApp.config.maps.meetings,
    };
  },

  created() {
    NProgress.start();
  },
  mounted() {
    EventBus.$emit("context-label", "Meetings");
  },
  methods: {
    filterMeetingsByCategory(category) {
      let filteredMeetings = this.meetings.filter((meeting) => {
        if (meeting.category === category) {
          return meeting;
        }
      });

      return filteredMeetings;
    },
  },
  apollo: {
    meetings: {
      prefetch: true,

      query: GET_ALL_MEETINGS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log(ApolloQueryResult);
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.meetings.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          let meetings = ApolloQueryResult.data.meetings;
          console.log("meetings fetch here");
          meetings = getUnifiedTags(meetings);
          this.meetings = _.orderBy(meetings, ["start"], ["desc"]);
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>

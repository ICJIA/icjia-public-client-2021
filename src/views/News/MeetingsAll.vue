<template>
  <div class="mt-10">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container class="mb-6">
          <v-row>
            <v-col cols="12" :md="viewToggle === 'category' ? 9 : 12">
              <div class="markdown-body mb-10 page-heading">
                <h1>ICJIA Meetings</h1>

                <v-btn-toggle v-model="viewToggle" mandatory>
                  <v-btn value="category" small aria-label="List view">
                    <span style="font-weight: 900">Meetings by Category</span>

                    <span
                      aria-hidden="true"
                      class="mdi mdi-format-list-bulleted"
                    >
                    </span>
                  </v-btn>

                  <v-btn value="all" small>
                    <span style="font-weight: 900" aria-label="Grid view"
                      >All Meetings</span
                    >

                    <span class="mdi mdi-view-module" aria-hidden="true">
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
            <v-col cols="12" md="9">
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
                ></MeetingTable>
              </div>
            </v-col>
            <v-col
              cols="12"
              v-if="meetings"
              md="3"
              class="px-3 hidden-sm-and-down"
            >
              <Toc :key="viewToggle" tocHeading="Meetings"></Toc>
            </v-col>
          </v-row>
        </v-container>
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

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      viewToggle: "category",
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
          this.meetings = ApolloQueryResult.data.meetings;
          this.meetings = _.orderBy(this.meetings, ["start"], ["desc"]);
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>

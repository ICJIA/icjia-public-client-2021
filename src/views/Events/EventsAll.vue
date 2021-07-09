<template>
  <div>
    <!-- <Breadcrumb :key="$route.path" title="Events"></Breadcrumb> -->
    <v-container v-if="$apollo.loading">
      <v-row>
        <v-col class="text-center">
          <Loader loadingText="Loading events..."></Loader>
        </v-col>
      </v-row>
    </v-container>

    <v-container
      v-if="!$apollo.loading"
      :fluid="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
    >
      <v-row class="fill-height" v-if="display">
        <v-col>
          <div v-if="$apollo.error" class="text-center error apollo">
            {{ error }}
            <div>Please <a href="/login">login again</a>.</div>
          </div>

          <div class="text-center mb-10">
            <h1 class="mb-6">ICJIA Events</h1>
            <EventToggle
              @toggleEventView="toggleEventView"
              @toggleUpcoming="toggleUpcoming"
            ></EventToggle>
          </div>

          <div v-show="display === 'calendar'">
            <v-sheet height="64" elevation="3" v-if="!$apollo.loading">
              <v-toolbar flat color="white">
                <v-btn
                  outlined
                  class="mr-4"
                  color="grey darken-2"
                  @click="setToday"
                  >Today</v-btn
                >
                <v-btn fab text small color="grey darken-2" @click="prev">
                  <v-icon small>mdi-chevron-left</v-icon>
                </v-btn>
                <v-btn fab text small color="grey darken-2" @click="next">
                  <v-icon small>mdi-chevron-right</v-icon>
                </v-btn>
                <v-toolbar-title v-if="$refs.calendar">{{
                  $refs.calendar.title
                }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-menu bottom right>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      outlined
                      color="grey darken-2"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <span>{{ typeToLabel[type] }}</span>
                      <v-icon right>mdi-menu-down</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="type = 'day'">
                      <v-list-item-title>Day</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="type = 'week'">
                      <v-list-item-title>Week</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="type = 'month'">
                      <v-list-item-title>Month</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-toolbar>
            </v-sheet>
            <v-sheet>
              <v-calendar
                ref="calendar"
                v-model="focus"
                color="primary"
                :events="filteredEvents"
                :event-color="getEventColor"
                :type="type"
                @change="change"
                @click:event="showEvent"
                @click:more="viewDay"
                @click:date="viewDay"
                style="min-height: 100vh !important"
              ></v-calendar>
              <v-menu
                v-model="selectedOpen"
                :close-on-content-click="false"
                :activator="selectedElement"
                offset-x
              >
                <v-card color="grey lighten-4" min-width="250px" flat>
                  <EventCard
                    :item="selectedEvent"
                    @clicked="selectedOpen = false"
                  ></EventCard>
                </v-card>
              </v-menu>
            </v-sheet>
          </div>
          <div v-show="display === 'list'">
            <div
              v-for="(event, index) in filteredEvents"
              :key="index + event.id"
              class="mb-5"
            >
              <EventCard
                :item="event"
                :showClose="false"
                class="hover"
              ></EventCard>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { GET_EVENTS } from "@/graphql/events";
// import { fixButtonText } from "@/a11y";
import _ from "lodash";
import NProgress from "nprogress";
const moment = require("moment");
const tz = require("moment-timezone");
import { EventBus } from "@/event-bus";
export default {
  watch: {
    isLoading(newValue, oldValue) {
      console.log(newValue, oldValue);
      // if (!newValue) {
      //   this.a11yfixes();
      // }
    },
  },
  async mounted() {
    if (this.$refs.calendar) {
      this.$refs.calendar.checkChange();
    }
  },
  updated() {
    //console.log("updated");
    if (this.$refs.calendar) {
      this.$refs.calendar.checkChange();
    }
  },
  data: () => ({
    focus: "",
    error: "",
    upcomingOnly: true,
    type: "month",
    typeToLabel: {
      month: "Month",
      week: "Week",
      day: "Day",
    },
    selectedEvent: {},
    selectedElement: null,
    selectedID: null,
    selectedOpen: false,
    filteredEvents: [],
    display: "calendar",
    events: [],
    meetings: [],
    grants: [],
    allEvents: [],
    eventKicker: "",
    isLoading: true,
  }),
  methods: {
    async change() {
      console.log("change here");
      await this.$nextTick();
      // this.a11yfixes();
    },
    // a11yfixes() {
    //   console.log("a11y fixes here");
    //   fixButtonText("mdi-chevron-right", "Click to move forward");
    //   fixButtonText("mdi-chevron-left", "Click to move previous");
    // },
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    toggleEventView(val) {
      this.display = val;
    },
    filterUpcoming() {
      let now = new Date();
      this.filteredEvents = this.allEvents.filter((event) => {
        if (event.end >= now) {
          return event;
        }
      });
    },
    toggleUpcoming(val) {
      console.log("upcoming only: ", val);
      if (val) {
        this.filterUpcoming();
      } else {
        this.filteredEvents = this.allEvents;
      }
      this.$refs.calendar.checkChange();
    },
    getEventColor(event) {
      return event.color;
    },
    setToday() {
      this.focus = "";
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        // console.log(event.id);
        // this.$vuetify.goTo(`#page-top`);
        this.selectedEvent = event;
        this.selectedID = event.id;
        this.selectedElement = nativeEvent.target;
        setTimeout(() => (this.selectedOpen = true), 10);
        //this.$vuetify.goTo(`#event-title-${this.selectedID}`);
      };
      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
        console.log("event-id: ", this.selectedID);
      }
      nativeEvent.stopPropagation();
    },
    getRange(start, end, timed) {
      let range;
      let localStart = moment(start).tz(this.$myApp.config.timezone);
      let localEnd = moment(end).tz(this.$myApp.config.timezone);
      let daysBetween = moment(localEnd).diff(moment(localStart), "days");
      if (daysBetween === 0 && timed) {
        range = ` | ${localStart.format("h:mm a")} to ${localEnd.format(
          "h:mm a"
        )} | <span style='font-weight: 400'>${localStart.format(
          "MMMM DD, YYYY"
        )}</span>`;
      } else if (daysBetween === 0 && !timed) {
        range = ` | All Day  | <span style='font-weight: 400'>${localStart.format(
          "MMMM DD, YYYY"
        )}</span>`;
      } else if (daysBetween > 0) {
        range = ` | <span style='font-weight: 400'>${localStart.format(
          "MMMM D"
        )}</span> <span style='font-weight: 400'>through</span> <span style='font-weight: 400'>${localEnd.format(
          "MMMM D, YYYY"
        )}</span>`;
      }
      return range;
    },
    isItMultiday(start, end) {
      let range;
      let localStart = moment(start).tz(this.$myApp.config.timezone);
      let localEnd = moment(end).tz(this.$myApp.config.timezone);
      let daysBetween = moment(localEnd).diff(moment(localStart), "days");
      let isItMultiday;
      if (daysBetween > 0) {
        isItMultiday = true;
      } else {
        isItMultiday = false;
      }
      return isItMultiday;
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
    closeEvent() {
      console.log("click", this.selectedOpen);
    },
  },
  apollo: {
    events: {
      query: GET_EVENTS,
      variables() {},
      error(error) {
        this.error = JSON.stringify(error.message);
        this.isLoading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log("Result: ", ApolloQueryResult.data.events);
        let events = ApolloQueryResult.data.events.map((event) => {
          event.start = moment(event.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          event.end = moment(event.end)
            .tz(this.$myApp.config.timezone)
            .toDate();

          event.color = "green darken-4";
          event.show = false;
          event.fullPath = `/events/${event.slug}`;
          event.contentType = "event";
          return event;
        });
        let meetings = ApolloQueryResult.data.meetings.map((meeting) => {
          meeting.start = moment(meeting.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          meeting.end = moment(meeting.end)
            .tz(this.$myApp.config.timezone)
            .toDate();

          let localStart = moment(meeting.start).tz(
            this.$myApp.config.timezone
          );

          if (!this.isItMultiday(meeting.start, meeting.end)) {
            meeting.timed = true;
          } else {
            meeting.timed = false;
          }
          meeting.color = "blue darken-4";
          meeting.show = false;
          meeting.fullPath = `/meetings/${meeting.slug}`;
          meeting.contentType = "meeting";
          return meeting;
        });
        let grants = ApolloQueryResult.data.grants.map((grant) => {
          grant.start = moment(grant.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          grant.end = moment(grant.end)
            .tz(this.$myApp.config.timezone)
            .toDate();

          let localStart = moment(grant.start).tz(this.$myApp.config.timezone);

          if (!this.isItMultiday(grant.start, grant.end)) {
            grant.timed = true;
          } else {
            grant.timed = false;
          }
          grant.color = "indigo darken-4";
          grant.show = false;
          grant.fullPath = `/grants/fsgu-funding/${grant.slug}`;
          grant.contentType = "grant";
          return grant;
        });

        let allEvents = [...events, ...meetings, ...grants];
        this.allEvents = _.orderBy(allEvents, ["start"], ["asc"]);
        this.filterUpcoming();
        this.isLoading = false;
        NProgress.done();
      },
    },
  },
};
</script>

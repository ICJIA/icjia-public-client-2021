<template>
  <div>
    <v-container v-if="isLoading">
      <v-row>
        <v-col class="text-center">
          <Loader loadingText="Loading events..."></Loader>
        </v-col>
      </v-row>
    </v-container>

    <v-container
      v-if="!isLoading"
      :fluid="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
      style="padding-bottom: 200px"
    >
      <v-row class="fill-height" v-if="display">
        <v-col>
          <div v-if="$apollo.error" class="text-center error apollo">
            {{ error }}
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
                <v-btn
                  fab
                  text
                  small
                  color="grey darken-2"
                  @click="prev"
                  aria-label="Previous"
                >
                  <v-icon small>mdi-chevron-left</v-icon>
                </v-btn>
                <v-btn
                  fab
                  text
                  small
                  color="grey darken-2"
                  @click="next"
                  aria-label="Next"
                >
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
            <v-sheet style="height: 100vh !important">
              <v-calendar
                ref="calendar"
                v-model="focus"
                color="primary"
                :events="filterDisplay()"
                :event-color="getEventColor"
                :type="type"
                @change="change"
                @click:event="showEvent"
                @click:more="viewDay"
                @click:date="viewDay"
              ></v-calendar>
              <v-menu
                v-model="selectedOpen"
                :close-on-content-click="false"
                :activator="selectedElement"
                offset-x
              >
                <v-card
                  color="grey lighten-4"
                  min-width="250px"
                  flat
                  style="z-index: 9999 !important"
                >
                  <EventCard
                    :item="selectedEvent"
                    @clicked="selectedOpen = false"
                    :key="nanoid()"
                  ></EventCard>
                </v-card>
              </v-menu>
            </v-sheet>
          </div>
          <div v-show="display === 'list'">
            <div
              v-for="(event, index) in filterDisplay()"
              :key="`${index}${nanoid()}`"
              class="mb-8"
            >
              <EventCard
                :item="event"
                :showClose="false"
                class="hover"
                :key="`${nanoid()}`"
              ></EventCard>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
const addOneDayToDate = function (date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};
import { nanoid } from "nanoid";
/* eslint-disable no-unused-vars */
import { GET_EVENTS } from "@/graphql/events";
// import { fixButtonText } from "@/a11y";
import _ from "lodash";
import NProgress from "@/services/Progress";
import dayjs from "@/plugins/dayjs";
import { EventBus } from "@/event-bus";
import { getUnifiedTags } from "@/utils/content";
export default {
  watch: {},
  name: "Events",
  metaInfo: {
    title: "Events",
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
    nanoid,
    focus: "",
    error: "",
    upcomingOnly: null,
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
    display: null,
    events: [],
    meetings: [],
    grants: [],
    allEvents: [],
    eventKicker: "",
    isLoading: true,
    addOneDayToDate,
  }),
  methods: {
    filterDisplay() {
      // console.log(
      //   "filter for: ",
      //   this.display,
      //   " upcomingOnly: ",
      //   this.upcomingOnly
      // );
      let newItems;
      if (this.display === "list") {
        newItems = this.allEvents.filter((item) => {
          if (!item.hideFromList) {
            return item;
          }
        });
      }

      if (this.display === "calendar") {
        newItems = this.allEvents.filter((item) => {
          if (!item.hideFromCalendar) {
            return item;
          }
        });
      }
      let filteredNewItems;
      if (this.upcomingOnly) {
        filteredNewItems = newItems.filter((item) => {
          let expired = new Date(item.end);
          //expired.setHours(0, 0, 0, 0);
          expired.setHours(24, 0, 0, 0);
          if (expired >= new Date()) {
            return item;
          }
        });
        return filteredNewItems;
      } else {
        return newItems;
      }
    },
    async change() {
      //console.log("change here");
      await this.$nextTick();
    },

    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    toggleEventView(val) {
      this.display = val;
      // console.log("toggle event view ", val);
    },

    toggleUpcoming(val) {
      //console.log("upcoming only: ", val);
      this.upcomingOnly = val;
      this.filterDisplay(this.display, val);
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
      let localStart = dayjs(start).tz(this.$myApp.config.timezone);
      let localEnd = dayjs(end).tz(this.$myApp.config.timezone);
      let daysBetween = dayjs(localEnd).diff(dayjs(localStart), "days");
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
      let localStart = dayjs(start).tz(this.$myApp.config.timezone);
      let localEnd = dayjs(end).tz(this.$myApp.config.timezone);
      let daysBetween = dayjs(localEnd).diff(dayjs(localStart), "days");
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
      fetchPolicy: "no-cache",
      error(error) {
        this.error = JSON.stringify(error.message);
        this.isLoading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log("Result: ", ApolloQueryResult.data.events);
        let events = ApolloQueryResult.data.events.map((event) => {
          event.start = dayjs(event.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          event.end = dayjs(event.end).tz(this.$myApp.config.timezone).toDate();

          event.color = "green darken-4";
          event.show = false;
          event.fullPath = `/events/${event.slug}`;
          event.contentType = "event";
          event.hideFromList = false;
          event.hideFromCalendar = false;
          return event;
        });
        let meetings = ApolloQueryResult.data.meetings.map((meeting) => {
          meeting.start = dayjs(meeting.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          meeting.end = dayjs(meeting.end)
            .tz(this.$myApp.config.timezone)
            .toDate();

          let localStart = dayjs(meeting.start).tz(this.$myApp.config.timezone);

          if (!this.isItMultiday(meeting.start, meeting.end)) {
            meeting.timed = true;
          } else {
            meeting.timed = false;
          }
          meeting.color = "blue darken-2";
          meeting.show = false;
          meeting.fullPath = `/news/meetings/${meeting.slug}`;
          meeting.contentType = "meeting";
          meeting.hideFromList = false;
          meeting.hideFromCalendar = false;
          return meeting;
        });
        let grants = ApolloQueryResult.data.grants.map((grant) => {
          grant.start = dayjs(grant.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          grant.end = dayjs(grant.end).tz(this.$myApp.config.timezone).toDate();
          grant.startDate = grant.start;
          grant.endDate = grant.end;
          let localStart = dayjs(grant.start).tz(this.$myApp.config.timezone);

          if (!this.isItMultiday(grant.start, grant.end)) {
            grant.timed = true;
          } else {
            grant.timed = false;
          }
          grant.color = "indigo darken-4";
          grant.show = false;
          grant.fullPath = `/grants/funding/${grant.slug}`;
          grant.contentType = "funding";
          grant.hideFromCalendar = true;
          grant.hideFromList = false;
          return grant;
        });

        let grantStartEvents = grants.map((grant) => {
          let obj = {};
          obj.startDate = grant.start;
          obj.endDate = grant.end;
          obj.name = "OPEN: " + grant.name;
          obj.start = grant.start;
          obj.slug = grant.slug;
          obj.category = grant.category;
          obj.end = grant.start;
          obj.timed = false;
          obj.color = "indigo darken-4";
          obj.show = false;
          obj.fullPath = grant.fullPath;
          obj.hideFromList = true;
          obj.hideFromCalendar = false;
          obj.details = grant.details;
          obj.contentType = "funding";
          obj.summary = grant.summary;
          return obj;
        });

        let grantEndEvents = grants.map((grant) => {
          let obj = {};
          obj.startDate = grant.start;
          obj.endDate = grant.end;
          obj.slug = grant.slug;
          obj.category = grant.category;
          obj.start = grant.end;
          obj.name = "DEADLINE: " + grant.name;
          obj.end = grant.end;
          obj.timed = false;
          obj.color = "indigo darken-4";
          obj.show = false;
          obj.fullPath = grant.fullPath;
          obj.hideFromList = true;
          obj.hideFromCalendar = false;
          obj.details = grant.details;
          obj.contentType = "funding";
          obj.summary = grant.summary;
          return obj;
        });
        let jobs = ApolloQueryResult.data.jobs.map((job) => {
          job.start = dayjs(job.start).tz(this.$myApp.config.timezone).toDate();
          job.end = dayjs(job.end).tz(this.$myApp.config.timezone).toDate();
          job.startDate = job.start;
          job.endDate = job.end;

          if (!this.isItMultiday(job.start, job.end)) {
            job.timed = true;
          } else {
            job.timed = false;
          }
          job.color = "purple darken-4";
          job.show = false;
          job.fullPath = `/about/employment/${job.slug}`;
          job.contentType = "employment";
          job.hideFromCalendar = true;
          job.hideFromList = false;
          job.name = job.title;
          return job;
        });

        let jobStartEvents = jobs.map((job) => {
          let obj = {};
          obj.startDate = job.start;
          obj.endDate = job.end;
          obj.name = "OPEN: " + job.title;
          obj.start = job.start;
          obj.slug = job.slug;
          obj.category = job.category;
          obj.end = job.start;
          obj.timed = false;
          obj.color = "purple darken-4";
          obj.show = false;
          obj.fullPath = job.fullPath;
          obj.hideFromList = true;
          obj.hideFromCalendar = false;
          obj.details = job.details;
          obj.contentType = "employment";
          obj.summary = job.summary;
          return obj;
        });

        let jobEndEvents = jobs.map((job) => {
          let obj = {};
          obj.startDate = job.start;
          obj.endDate = job.end;
          obj.slug = job.slug;
          obj.category = job.category;
          obj.start = job.end;
          obj.name = "DEADLINE: " + job.title;
          obj.end = job.end;
          obj.timed = false;
          obj.color = "purple darken-4";
          obj.show = false;
          obj.fullPath = job.fullPath;
          obj.hideFromList = true;
          obj.hideFromCalendar = false;
          obj.details = job.details;
          obj.contentType = "employment";
          obj.summary = job.summary;
          return obj;
        });

        let allEvents = [
          ...events,
          ...meetings,
          ...grants,
          ...grantStartEvents,
          ...grantEndEvents,
          ...jobs,
          ...jobEndEvents,
          ...jobStartEvents,
        ];

        allEvents = getUnifiedTags(allEvents);
        // let calendarEvents = [...events, ...meetings, ...grants];
        // this.calendarEvents = _.orderBy(calendarEvents, ["start"], ["asc"]);
        this.allEvents = _.orderBy(allEvents, ["start"], ["asc"]);

        this.display = "calendar";
        this.upcomingOnly = true;
        this.isLoading = false;
        NProgress.done();

        EventBus.$emit("context-label", "ICJIA Event Calendar");
      },
    },
  },
};
</script>

<style>
.theme--light.v-calendar-weekly .v-calendar-weekly__head-weekday.v-past {
  color: #000 !important;
  background-color: #fff !important;
}
.theme--light.v-calendar-weekly .v-calendar-weekly__head-weekday {
  color: #000 !important;
  background-color: #fff !important;
}
</style>

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
              @toggleRange="toggleRange"
            ></EventToggle>
          </div>

          <div v-show="display === 'calendar'">
            <v-sheet
              height="64"
              elevation="3"
              v-if="!$apollo.loading"
              class="calendar-toolbar"
            >
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
                <!-- A menu button (src/utils/menuButton.js), like the header
                     drop-downs: opened from the keyboard, focus moves into
                     the menu, and choosing a view returns focus to the
                     button. Each item says whether it is the view shown. -->
                <v-menu bottom right disable-keys ref="viewMenu">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      outlined
                      color="grey darken-2"
                      v-bind="attrs"
                      v-on="on"
                      @click="onMenuButtonClick($event, $refs.viewMenu)"
                      @keydown="onMenuButtonKeydown($event, $refs.viewMenu)"
                    >
                      <span>{{ typeToLabel[type] }}</span>
                      <v-icon right>mdi-menu-down</v-icon>
                    </v-btn>
                  </template>
                  <v-list
                    @keydown.native="onMenuKeydown($event, $refs.viewMenu)"
                  >
                    <v-list-item
                      v-for="view in ['day', 'week', 'month']"
                      :key="view"
                      role="menuitemradio"
                      :aria-checked="type === view ? 'true' : 'false'"
                      @click="setView(view)"
                    >
                      <v-list-item-title>{{
                        typeToLabel[view]
                      }}</v-list-item-title>
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
              >
                <!-- Each entry is a button, named by its text and its date,
                     so a keyboard reaches and opens it (WCAG 2.1.1, 4.1.2).
                     The entry's box still takes the click, as before. -->
                <template v-slot:event="{ event, eventSummary }">
                  <button type="button" class="calendar-entry pl-1">
                    <span v-html="eventSummary()"></span
                    ><span class="sr-only"> {{ entryDates(event) }}</span>
                  </button>
                </template>
                <!-- Day numbers are named by the full date, which contains
                     the number shown ("Wednesday, September 30, 2026"), in
                     text a screen reader reads and the page does not show. -->
                <template v-slot:day-label="day">
                  <v-btn
                    fab
                    depressed
                    small
                    :color="day.present ? 'primary' : 'transparent'"
                    @click.stop="viewDay(day)"
                    ><span aria-hidden="true">{{ dayNumber(day, true) }}</span
                    ><span class="sr-only">{{
                      dayName(day, true)
                    }}</span></v-btn
                  >
                </template>
                <template v-slot:day-label-header="day">
                  <v-btn
                    fab
                    depressed
                    :color="day.present ? 'primary' : 'transparent'"
                    @click.stop="viewDay(day)"
                    ><span aria-hidden="true">{{ dayNumber(day) }}</span
                    ><span class="sr-only">{{ dayName(day) }}</span></v-btn
                  >
                </template>
              </v-calendar>
              <!-- An entry's details: a dialog that takes focus, keeps Tab
                   inside, and closes with Escape or Close, returning focus to
                   the entry. It used to be a menu (role "menu") that focus
                   never reached. -->
              <v-menu
                v-model="selectedOpen"
                :close-on-content-click="false"
                :activator="selectedElement"
                offset-x
                role="dialog"
                ref="details"
              >
                <v-card
                  color="grey lighten-4"
                  min-width="250px"
                  flat
                  style="z-index: 9999 !important"
                  @keydown.native="keepFocusInDetails"
                >
                  <!-- Keyed by the entry, not anew on every render, so the
                       element holding focus in the dialog is not replaced. -->
                  <EventCard
                    :item="selectedEvent"
                    @clicked="selectedOpen = false"
                    :key="`${selectedEvent.fullPath}|${selectedEvent.name}`"
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
import { buildEventWheres } from "@/utils/eventsRange";
import { runQuery } from "@/gql-client";
import {
  onMenuButtonClick,
  onMenuButtonKeydown,
  onMenuKeydown,
} from "@/utils/menuButton";
import { keepFocusWithin } from "@/utils/focus";
export default {
  watch: {
    // The details dialog takes focus when it opens. Closed from inside it
    // (Close, or Escape), focus goes back to the entry that opened it.
    selectedOpen(open) {
      if (open) {
        this.focusDetails();
        return;
      }
      const content = this.$refs.details && this.$refs.details.$refs.content;
      const active = document.activeElement;
      const fromInside =
        !active ||
        active === document.body ||
        (content && content.contains(active));
      const entry = this.selectedElement;
      if (fromInside && entry && typeof entry.focus === "function") {
        this.$nextTick(() => entry.focus());
      }
    },
  },
  name: "Events",
  metaInfo: {
    title: "Events",
  },
  async mounted() {
    if (this.$refs.calendar) {
      this.$refs.calendar.checkChange();
    }
    this.decorateCalendar();
  },

  updated() {
    //console.log("updated");
    if (this.$refs.calendar) {
      this.$refs.calendar.checkChange();
    }
    this.decorateCalendar();
  },
  data: () => ({
    nanoid,
    focus: "",
    error: "",
    monthsBack: 0,
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
      // console.log("filter for: ", this.display);
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
      // Date bounding now happens server-side via buildEventWheres(); here we
      // only split list vs calendar visibility.
      return newItems;
    },
    async change({ start, end } = {}) {
      //console.log("change here");
      // The dates shown, for the name of the hours (not reactive: nothing
      // on the page renders it).
      this.shownRange = { start: start && start.date, end: end && end.date };
      await this.$nextTick();
      this.decorateCalendar();
    },

    // A day number or a "more" link opens that day. The control pressed is
    // gone once the Day view renders, so focus moves to the Day view's own
    // day button, named by the date (WCAG 2.4.3); it used to fall to the
    // page.
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
      this.$nextTick(() =>
        this.focusRendered(() => {
          const cal = this.$refs.calendar && this.$refs.calendar.$el;
          const days = cal
            ? cal.querySelectorAll(".v-calendar-daily_head-day-label .v-btn")
            : [];
          // The Day view has rendered once a single day is shown.
          return days.length === 1 ? days[0] : null;
        })
      );
    },
    // The Month, Week or Day menu: show the view, and return focus to the
    // menu button (menu button pattern).
    setView(view) {
      this.type = view;
      const menu = this.$refs.viewMenu;
      const button = menu && menu.getActivator && menu.getActivator();
      if (button) this.$nextTick(() => button.focus());
    },
    onMenuButtonClick,
    onMenuButtonKeydown,
    onMenuKeydown,
    // Focus an element once it has rendered.
    focusRendered(find, attempts = 20) {
      const el = find();
      if (el) {
        el.focus();
      } else if (attempts > 0) {
        setTimeout(() => this.focusRendered(find, attempts - 1), 25);
      }
    },
    // A day button shows its number, or on the first of the month in the
    // Month view "Sep 1", as Vuetify's own did. Its name is the full date,
    // which contains that visible label (WCAG 2.5.3): "Friday, September 4,
    // 2026", "Tuesday, Sep 1, 2026".
    dayNumber(day, monthOnFirst = false) {
      return monthOnFirst && day.day === 1
        ? dayjs(day.date).format("MMM D")
        : String(day.day);
    },
    dayName(day, monthOnFirst = false) {
      return dayjs(day.date).format(
        monthOnFirst && day.day === 1
          ? "dddd, MMM D, YYYY"
          : "dddd, MMMM D, YYYY"
      );
    },
    // An entry's date, or its first and last dates, in words: "on Friday,
    // September 4, 2026", "from Friday, September 4, 2026 to Monday, …".
    entryDates(event) {
      const zone = this.$myApp.config.timezone;
      const start = dayjs(event.start).tz(zone);
      const end = dayjs(event.end).tz(zone);
      const format = "dddd, MMMM D, YYYY";
      if (end.format("YYYY-MM-DD") !== start.format("YYYY-MM-DD")) {
        return `from ${start.format(format)} to ${end.format(format)}`;
      }
      return `on ${start.format(format)}`;
    },
    keepFocusInDetails(event) {
      const content = this.$refs.details && this.$refs.details.$refs.content;
      keepFocusWithin(event, content);
    },
    // Once the details are shown: name the dialog by the entry and move focus
    // into it.
    focusDetails(attempts = 20) {
      const menu = this.$refs.details;
      const content = menu && menu.$refs.content;
      const shown =
        content && window.getComputedStyle(content).display !== "none";
      if (!this.selectedOpen) return;
      if (!shown) {
        if (attempts > 0) {
          setTimeout(() => this.focusDetails(attempts - 1), 25);
        }
        return;
      }
      content.setAttribute("aria-modal", "true");
      content.setAttribute(
        "aria-label",
        String(this.selectedEvent.name || this.selectedEvent.title || "")
          .replace(/<[^>]*>/g, "")
          .trim() || "Event details"
      );
      const first = content.querySelector(
        '[tabindex="0"], button, a[href], [href]'
      );
      if (first) first.focus();
    },
    // What the calendar renders without slots: the "N more" links, and the
    // scrolling hours of the Week and Day views. The links become buttons
    // named with their day; the hours take focus, with a name, so they can
    // be scrolled from the keyboard (WCAG 2.1.1, 4.1.2).
    decorateCalendar() {
      const cal = this.$refs.calendar && this.$refs.calendar.$el;
      if (!cal || !cal.querySelectorAll) return;
      cal.querySelectorAll(".v-event-more").forEach((more) => {
        if (!more.hasAttribute("role")) {
          more.setAttribute("role", "button");
          more.setAttribute("tabindex", "0");
          more.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            more.click();
          });
          // Its text ("2 more") changes when the calendar is resized.
          more.addEventListener("focus", () => this.nameMoreLink(more));
        }
        this.nameMoreLink(more);
      });
      const hours = cal.querySelector(".v-calendar-daily__scroll-area");
      if (hours) {
        const { start, end } = this.shownRange || {};
        const day = "dddd, MMMM D, YYYY";
        const dates =
          start && end && start !== end
            ? `${dayjs(start).format("MMMM D")} to ${dayjs(end).format(
                "MMMM D, YYYY"
              )}`
            : start
            ? dayjs(start).format(day)
            : "";
        hours.setAttribute("tabindex", "0");
        hours.setAttribute("role", "region");
        hours.setAttribute("aria-label", `Hours${dates ? ", " + dates : ""}`);
      }
    },
    nameMoreLink(more) {
      const date = more.getAttribute("data-date");
      const text = (more.textContent || "").trim();
      if (date && text) {
        more.setAttribute(
          "aria-label",
          `${text} on ${dayjs(date).format("dddd, MMMM D, YYYY")}`
        );
      }
    },
    toggleEventView(val) {
      this.display = val;
      // console.log("toggle event view ", val);
    },

    toggleRange(monthsBack) {
      this.monthsBack = monthsBack;
      // The fetch-shim (mixins/apollo-shim.js) runs each query once on
      // created() and does NOT expose $apollo.queries.*/refetch(), so re-run
      // the bounded query directly and feed the result through the same
      // handler that processed the initial load.
      this.$apollo.loading = true;
      runQuery(GET_EVENTS, buildEventWheres(this.monthsBack), "no-cache")
        .then((r) => this.$options.apollo.events.result.call(this, r))
        .catch((err) => {
          this.error = JSON.stringify(err && err.message ? err.message : err);
        })
        .finally(() => {
          this.$apollo.loading = false;
        });
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
        // The entry's button: the details open beside it, and focus returns
        // to it when they close.
        this.selectedElement =
          (nativeEvent.target.closest &&
            nativeEvent.target.closest(".calendar-entry")) ||
          nativeEvent.target;
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
      variables() {
        return buildEventWheres(this.monthsBack);
      },
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

        // Only bootstrap the default view on the initial load — a range
        // re-fetch must not bounce the user back to List if they're on Calendar.
        if (!this.display) this.display = "list";
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
/* The Week and Day views' names of past days were Vuetify's 38% black,
   #9e9e9e on white, 2.68:1 (WCAG 1.4.3); black, as in the Month view. */
.theme--light.v-calendar-daily
  .v-calendar-daily_head-day.v-past
  .v-calendar-daily_head-weekday {
  color: #000 !important;
}

/* An entry's button keeps the look of the entry's text. Its box clips
   anything drawn outside it, so the focus ring is drawn inside, in white,
   which stands out from every entry colour (4.6:1 to 13.2:1). */
.v-calendar .calendar-entry {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font: inherit;
  line-height: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.v-calendar .calendar-entry:focus-visible {
  outline: 2px solid #fff !important;
  outline-offset: -3px !important;
}
/* A day button's name is its full date in hidden text; the buttons' capitals
   are not wanted there. */
.v-calendar .v-btn .sr-only {
  text-transform: none;
}
/* "N more" and the hours scroll inside boxes that clip, so their rings are
   drawn inside too (blue on white, 5.75:1). */
.v-calendar .v-event-more:focus-visible,
.v-calendar .v-calendar-daily__scroll-area:focus-visible {
  outline-offset: -2px !important;
}

/* Below 400 px the toolbar wraps onto a second line: the view button was cut
   to "MO" at 320 px, with its focus ring, and its arrow at 375 px. */
@media (max-width: 400px) {
  .calendar-toolbar.v-sheet {
    height: auto !important;
  }
  .calendar-toolbar .v-toolbar,
  .calendar-toolbar .v-toolbar__content {
    height: auto !important;
  }
  .calendar-toolbar .v-toolbar__content {
    flex-wrap: wrap;
    row-gap: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
}
</style>

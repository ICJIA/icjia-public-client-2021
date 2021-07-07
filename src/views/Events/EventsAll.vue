<template>
  <div>
    {{ filteredEvents }}
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { GET_EVENTS } from "@/graphql/queries/events";
import { fixButtonText } from "@/a11y";

// import NProgress from "nprogress";
const moment = require("moment");
const tz = require("moment-timezone");
import { EventBus } from "@/event-bus";
export default {
  apollo: {
    events: {
      query: GET_EVENTS,
      variables() {},
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        this.events = this.events.map((event) => {
          event.start = moment(event.start)
            .tz(this.$myApp.config.timezone)
            .toDate();
          event.end = moment(event.end)
            .tz(this.$myApp.config.timezone)
            .toDate();
          //console.log(this.$myApp.config.events[event.type]["color"]);
          if (this.$myApp.config.events[event.type]) {
            event.color = this.$myApp.config.events[event.type]["color"];
          } else {
            event.color = "grey darken-4";
          }
          //event.color = this.colors[this.rnd(0, this.colors.length - 1)];
          event.show = false;
          return event;
        });
        //this.filteredEvents = this.events;

        this.filterUpcoming();
        this.isLoading = false;
        window.NProgress.done();
      },
    },
  },
};
</script>

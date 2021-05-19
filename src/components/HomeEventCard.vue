<template>
  <div>
    <v-card
      class="hover event-card mr-2 mt-1 mb-1"
      style="height: 425px; overflow-y: auto"
    >
      <v-container fluid>
        <v-row no-gutters>
          <v-col>
            <div class="text-right">
              <span
                style="
                  background: #333;
                  color: white;
                  font-size: 11px;
                  font-weight: 700;
                  text-transform: uppercase;
                "
                class="px-2 py-2"
                >{{ tag }}</span
              >
            </div>
          </v-col>
        </v-row>
      </v-container>

      <v-container fluid style="margin-top: -25px">
        <v-row no-gutters>
          <v-col class="px-4 py-2">
            <div
              style="
                font-size: 18px;
                font-weight: 900;
                color: #333;
                text-transform: uppercase;
              "
              class="mb-2"
              v-html="getEventDayName()"
            ></div>
            <h2
              class="mt-0"
              style="
                font-size: 32px;
                font-weight: 900;
                margin-top: -15px;
                border-bottom: 5px solid #333;
              "
            >
              {{ getEventDateSpan() }}
            </h2>
            <div
              class="eventTime mt-4 text-left"
              style="
                color: #333;
                font-weight: 900;
                text-transform: uppercase;
                font-size: 12px;
              "
              v-html="getEventTimeSpan()"
            ></div>

            <div class="mt-6">
              <span
                class="eventTitle"
                style="font-weight: 900"
                v-if="event.title"
              >
                {{ event.title }}</span
              ><span class="eventTitle" style="font-weight: 900" v-else>
                {{ event.name }}</span
              >
            </div>
            <p style="color: #000" class="mt-3">
              {{ truncate(event.summary) }}
            </p>
            <router-link
              to="/"
              aria-label="Read more about this item."
              class="skiplink dark"
              title="Read more about this item."
              style="font-size: 12px; margin-top: 5px"
            >
              Read more about this event
            </router-link>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import moment from "moment";
export default {
  methods: {
    getEventDayName() {
      let start = moment(this.event.start);
      let end = moment(this.event.end);
      let dayName;
      if (end.diff(start, "days")) {
        dayName = "<br/>";
        //   moment(this.event.start).format("dddd") +
        //   " - " +
        //   moment(this.event.end).format("dddd")
      } else {
        dayName = moment(this.event.start).format("dddd");
      }
      return dayName;
    },
    truncate(string, maxWords = 30) {
      var strippedString = string.trim();
      var array = strippedString.split(" ");
      var wordCount = array.length;
      string = array.splice(0, maxWords).join(" ");

      if (wordCount > maxWords) {
        string += "...";
      }

      return string;
    },
    getEventTimeSpan() {
      let start = moment(this.event.start);
      let end = moment(this.event.end);
      let days = end.diff(start, "days");
      let hours = end.diff(start, "hours");
      let timeSpanText = "<br/>";
      if (days === 0 && hours > 7) {
        timeSpanText = "All Day";
      } else if (days === 0 && hours <= 7) {
        timeSpanText =
          moment(this.event.start).format("h:mm a") +
          " - " +
          moment(this.event.end).format("h:mm a");
      } else {
        timeSpanText =
          moment(this.event.start).format("ddd, MMM DD @ h:mm a") +
          " - " +
          moment(this.event.end).format("ddd, MMM DD @ h:mm a");
      }
      console.log(days, hours);
      return timeSpanText;
    },
    getEventDateSpan() {
      let start = moment(this.event.start);
      let end = moment(this.event.end);
      if (start.format("MMM") === end.format("MMM")) {
        let month = moment(this.event.start).format("MMMM");
        let daySpan;
        if (end.diff(start, "days")) {
          daySpan =
            moment(this.event.start).format("D") +
            " - " +
            moment(this.event.end).format("D");
        } else {
          daySpan = moment(this.event.start).format("D");
        }
        return (
          month + " " + daySpan + ", " + moment(this.event.end).format("YYYY")
        );
      } else {
        return (
          moment(this.event.start).format("MMM") +
          " " +
          moment(this.event.start).format("DD") +
          " - " +
          moment(this.event.end).format("MMM") +
          " " +
          moment(this.event.end).format("DD") +
          ", " +
          moment(this.event.end).format("YYYY")
        );
      }
    },

    getEventYear() {
      return moment(this.event.start).format("YYYY");
    },
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.sm || this.$vuetify.breakpoint.xs;
    },
  },
  props: {
    event: {
      type: Object,
      default: () => {},
    },
    tag: {
      type: String,
      default: "general",
    },
  },
};
</script>

<style>
.eventBorder {
  border-right: 1px solid #ccc;
}

.evenBottomtBorder {
  border-bottom: 1px solid #aaa;
}
</style>

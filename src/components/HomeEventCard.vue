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
            >
              {{ getEventDayName() }}
            </div>
            <h2 style="font-size: 64px; font-weight: 900; margin-top: -15px">
              {{ getEventDay() }}
            </h2>

            <h3
              style="
                border-bottom: 5px solid #333;
                font-size: 36px;
                margin-top: -15px;
              "
            >
              {{ getEventMonth() }}, {{ getEventYear() }}
            </h3>
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

              <div class="eventTime" style="color: #666">
                {{ event.start }} - {{ event.end }}
              </div>
            </div>
            <p style="color: #000" class="mt-3">
              Lorem markdownum Oechalia tenus, bracchia concolor tum, et in tota
              a generum. Ludit et nostri idemque circum. Tela tamen verba, tenet
              domui Dymantis.
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
      return moment(this.event.start).format("dddd");
    },
    getEventDay() {
      return moment(this.event.start).format("D");
    },
    getEventMonth() {
      return moment(this.event.start).format("MMMM");
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

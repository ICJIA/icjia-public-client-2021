<template>
  <div>
    <div>
      <v-btn-toggle v-model="icon" v-if="!listViewOnly">
        <v-btn value="list" small elevation="1">
          <span class="button-weight">List View</span>

          <v-icon right small>mdi-format-list-bulleted</v-icon>
        </v-btn>

        <v-btn value="calendar" small elevation="1">
          <span class="button-weight">Calendar View</span>

          <v-icon right small> calendar_today </v-icon>
        </v-btn>
      </v-btn-toggle>
      <div class="mt-5">
        <v-select
          v-model="monthsBack"
          :items="rangeItems"
          item-text="label"
          item-value="monthsBack"
          dense
          outlined
          hide-details
          label="Show events from"
          aria-label="Show events from time range"
          style="max-width: 260px; margin: 0 auto"
        ></v-select>
      </div>
    </div>
  </div>
</template>

<script>
import { EVENT_RANGE_OPTIONS } from "@/utils/eventsRange";
export default {
  data() {
    return {
      icon: "list",
      monthsBack: 0,
      rangeItems: EVENT_RANGE_OPTIONS,
    };
  },
  props: {
    listViewOnly: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    this.$emit("toggleEventView", this.icon);
    this.$emit("toggleRange", this.monthsBack);
  },
  watch: {
    icon(newValue, oldValue) {
      this.$emit("toggleEventView", newValue || oldValue);
    },
    monthsBack(newValue) {
      this.$emit("toggleRange", newValue);
    },
  },
};
</script>

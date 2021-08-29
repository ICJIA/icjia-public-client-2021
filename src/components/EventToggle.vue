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
        <input
          type="checkbox"
          id="showHideUpcoming"
          name="showHideUpcoming"
          v-model="showHideUpcoming"
        />
        <label
          for="showHideUpcoming"
          aria-label="Show/Hide Upcoming events"
          style="font-size: 12px"
        >
          Upcoming and ongoing events only</label
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      icon: "calendar",
      showHideUpcoming: true,
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
    this.$emit("toggleUpcoming", this.showHideUpcoming);
  },
  watch: {
    icon(newValue, oldValue) {
      if (!newValue) {
        this.$emit("toggleEventView", oldValue);
      } else {
        this.$emit("toggleEventView", newValue);
      }
    },
    // eslint-disable-next-line no-unused-vars
    showHideUpcoming(newValue, oldValue) {
      this.$emit("toggleUpcoming", newValue);
      //console.log(newValue);
    },
  },
};
</script>

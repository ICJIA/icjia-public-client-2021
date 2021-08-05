<template>
  <v-btn
    class="chip mr-1"
    x-small
    color="grey lighten-3"
    depressed
    rounded
    @click.prevent.stop="chipClick($event)"
    style="font-size: 10px; font-weight: bold"
  >
    <slot></slot>
  </v-btn>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { EventBus } from "@/event-bus";
export default {
  methods: {
    chipClick(e) {
      //console.log("chip click: ", e.target.innerHTML);
      let opts = {
        query: e.target.innerText.trim(),
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
  },
};
</script>

<template>
  <v-btn
    class="chip mr-1"
    x-small
    color="white"
    depressed
    rounded
    @click.prevent.stop="chipClick($event)"
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
      console.log("tag click: ", e.target.innerText.trim().toLowerCase());
      window.plausible("tag_click", {
        props: { tag: e.target.innerText.trim().toLowerCase() },
      });
      let opts = {
        query: e.target.innerText.trim(),
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
  },
};
</script>

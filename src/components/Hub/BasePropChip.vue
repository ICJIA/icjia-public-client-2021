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
import { goToSearch } from "@/utils/search";
export default {
  methods: {
    chipClick(e) {
      const query = e.target.innerText.trim();
      try {
        window.plausible("tag_click", { props: { tag: query.toLowerCase() } });
      } catch (_e) {
        /* plausible may not be loaded in dev/test */
      }
      // Was: EventBus.$emit("search", { query, type: "hub" }) — opened the
      // search modal and destroyed the user's current scroll/result context.
      // Now navigates to /search/:query; the result page keeps the user's
      // context intact and lets them open hits in new tabs.
      goToSearch(this.$router, { query, type: "hub" });
    },
  },
};
</script>

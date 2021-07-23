<template>
  <div>
    <v-card class="px-5 py-5">
      {{ item }}
    </v-card>
  </div>
</template>

<script>
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  mounted() {
    attachInternalLinks(this);
    attachSearchEvents(this);
  },
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style lang="scss" scoped></style>

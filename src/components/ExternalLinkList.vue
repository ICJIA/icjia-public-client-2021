<template>
  <v-sheet v-if="externalLinks">
    <div
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
    >
      <span v-if="label && label.length"> {{ label }}</span
      ><span v-else>External Links</span>
    </div>
    <ul v-for="(item, index) in externalLinks" :key="index" class="mt-6">
      <li class="attachment-link">
        <a :href="item.url" target="_blank">{{ item.title }}</a>
      </li>
    </ul>
  </v-sheet>
</template>

<script>
import _ from "lodash";
export default {
  data() {
    return {
      externalLinks: null,
    };
  },
  mounted() {
    this.externalLinks = _.orderBy(this.items, "name", "asc");
  },
  props: {
    label: {
      type: String,
      default: null,
    },
    items: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped></style>

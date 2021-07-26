<template>
  <v-sheet v-if="attachments">
    <div
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
      v-if="title && title.length"
    >
      {{ title }}
    </div>
    <ul v-for="(attachment, index) in attachments" :key="index" class="mt-6">
      <li>
        <a
          :href="`https://agency.icjia-api.cloud${attachment.url}`"
          target="_blank"
          >{{ attachment.name }}</a
        >
      </li>
    </ul>
  </v-sheet>
</template>

<script>
import _ from "lodash";
export default {
  data() {
    return {
      attachments: null,
    };
  },
  mounted() {
    this.attachments = _.orderBy(this.items, "name", "asc");
  },
  props: {
    title: {
      type: String,
      default: "",
    },
    items: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped></style>

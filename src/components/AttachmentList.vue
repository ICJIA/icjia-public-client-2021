<template>
  <v-sheet v-if="attachments">
    <div
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
    >
      <span v-if="label && label.length"> {{ label }}</span
      ><span v-else>Attachments</span>
    </div>
    <ul v-for="(attachment, index) in attachments" :key="index" class="mt-6">
      <li class="attachment-link">
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

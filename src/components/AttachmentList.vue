<template>
  <div v-if="attachments">
    <v-sheet color="#fff" class="px-5 py-5">
      <div
        style="
          font-weight: 700;
          border-bottom: 1px solid #ccc;
          padding-bottom: 8px;
          text-transform: uppercase;
        "
      >
        {{ title }}
      </div>
      <ul v-for="(attachment, index) in attachments" :key="index" class="mt-3">
        <li>
          <a
            :href="`https://agency.icjia-api.cloud${attachment.url}`"
            target="_blank"
            >{{ attachment.name }}</a
          >
        </li>
      </ul>
    </v-sheet>
  </div>
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
      default: "Attachments",
    },
    items: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped></style>

<template>
  <v-sheet v-if="attachments">
    <div v-if="useSecondLevelHeading">
      <h2 v-if="label && label.length" id="attachments">{{ label }}</h2>
      <h2 v-else class="" id="attachments">Attachments</h2>
    </div>
    <div
      v-else
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
    >
      <span v-if="label && label.length"> {{ label }}</span
      ><span v-else class="">Attachments</span>
    </div>
    <ul v-for="(attachment, index) in attachments" :key="index" class="mt-6">
      <li class="attachment-link">
        <a
          :href="`https://agency.icjia-api.cloud${attachment.url}`"
          target="_blank"
          >{{ attachment.name }}</a
        >
        <ul v-if="showLastUpdated" style="font-size: 12px">
          <li>Last updated on {{ attachment.updated_at | format }}</li>
        </ul>
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
    useSecondLevelHeading: {
      type: Boolean,
      default: false,
    },
    showLastUpdated: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped></style>

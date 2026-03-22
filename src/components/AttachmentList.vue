<template>
  <v-sheet v-if="attachments" class="py-2">
    <div v-if="useSecondLevelHeading">
      <h2 v-if="label && label.length" id="attachments">{{ label }}</h2>
      <h2 v-else class="" id="attachments">Attachments</h2>
    </div>
    <h3
      v-if="!useSecondLevelHeading"
      style="
        font-weight: 900;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
        font-size: inherit;
        margin: 0;
      "
      class="px-0"
      id="attachments"
    >
      <span v-if="label && label.length">{{ label }}</span>
      <span v-else>Attachments</span>
    </h3>

    <div class="">
      <v-data-table
        v-if="!hideUpdated"
        dense
        :headers="headers"
        :items="attachments"
        hide-default-footer
        :items-per-page="-1"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        class="elevation-0"
      >
        <template v-slot:item.updated_at="{ item }">
          <span
            style="width: 90px; font-size: 14px; font-weight: 700; color: #555"
          >
            {{ item.updated_at | dateFormatAlt }}&nbsp;&nbsp;
          </span>
        </template>
        <template v-slot:item.size="{ item }">
          <span style="font-size: 12px">{{ niceBytes(item.size) }}</span>
        </template>
        <template v-slot:item.name="{ item }">
          <span
            style="font-size: 14px; font-weight: 400; color: #555"
            @click.stop.prevent="routeTo(item.url)"
          >
            <span class="attachment">
              {{ item.name }}
            </span>
          </span>
        </template>
      </v-data-table>
      <v-data-table
        v-if="hideUpdated"
        dense
        :headers="slimHeaders"
        :items="attachments"
        hide-default-footer
        :items-per-page="-1"
        :sort-by.sync="slimSortBy"
        :sort-desc.sync="slimSortDesc"
        class="elevation-0"
      >
        <template v-slot:item.size="{ item }">
          <span style="font-size: 12px">{{ niceBytes(item.size) }}</span>
        </template>
        <template v-slot:item.name="{ item }">
          <span
            style="font-size: 14px; font-weight: 400; color: #555"
            @click.stop.prevent="routeTo(item.url)"
          >
            <span class="attachment">
              {{ item.name }}
            </span>
          </span>
        </template>
      </v-data-table>
    </div>
  </v-sheet>
</template>

<script>
const units = ["B", "MB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

function niceBytes(x) {
  let l = 0,
    n = parseInt(x, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

import _ from "lodash";
// eslint-disable-next-line no-unused-vars
import moment from "moment";
export default {
  data() {
    return {
      attachments: null,
      sortBy: "updated_at",
      sortDesc: true,
      slimSortBy: "name",
      slimSortDesc: false,

      niceBytes,
      headers: [
        {
          text: "Filename",
          align: "start",
          sortable: true,
          value: "name",
        },
        { text: "Last Updated", value: "updated_at" },

        { text: "Size", value: "size" },
      ],
      slimHeaders: [
        {
          text: "Filename",
          align: "start",
          sortable: true,
          value: "name",
        },

        { text: "Size", value: "size" },
      ],
    };
  },
  methods: {
    routeTo(url) {
      console.log(url);
      window.plausible("file_download", { props: { url: url } });
      window.plausible("Outbound Link: Click", {
        props: { url: "https://agency.icjia-api.cloud" + url },
      });
      window.open(`https://agency.icjia-api.cloud${url}`, "_blank");
    },
    isItUpdated(item) {
      const created = moment(this.baseItemPublished);
      const updated = moment(item.updated_at); // another date
      const duration = moment.duration(updated.diff(created));
      const days = duration.asDays();
      if (days > 1 && days < 30) {
        return true;
      } else {
        return false;
      }
    },
  },
  mounted() {
    this.attachments = _.orderBy(this.items, "name", "asc");
  },
  props: {
    label: {
      type: String,
      default: null,
    },
    baseItemPublished: {
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
    showAsTable: {
      type: Boolean,
      default: true,
    },
    hideUpdated: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.attachment {
  font-weight: 900;
  color: #0a3a60;
  text-decoration: underline;
  cursor: pointer;
}

.attachment:hover {
  color: #aaa;
  text-decoration: none;
}

.file-name {
  font-weight: 700;
}

.file-name:hover {
  text-decoration: underline;
  color: #555;
}
</style>

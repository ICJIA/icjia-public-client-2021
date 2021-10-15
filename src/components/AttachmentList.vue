<template>
  <v-sheet v-if="attachments" class="py-2">
    <!-- <div v-if="useSecondLevelHeading">
      <h2 v-if="label && label.length" id="attachments">{{ label }}</h2>
      <h2 v-else class="" id="attachments">Attachments</h2>
    </div> -->
    <div
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
      class="px-4"
    >
      <span v-if="label && label.length"> {{ label }}</span
      ><span v-else class="" style="">Attachments</span>
    </div>

    <div class="">
      <v-data-table
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
          <div
            style="width: 90px; font-size: 14px; font-weight: 400; color: #555"
          >
            {{ item.updated_at | dateFormatAlt }}
          </div>
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
    </div>
  </v-sheet>
</template>

<script>
// function humanFileSize(size) {
//   var i = Math.floor(Math.log(size) / Math.log(1024));
//   return (
//     (size / Math.pow(1024, i)).toFixed(2) * 1 +
//     " " +
//     ["B", "kB", "MB", "GB", "TB"][i]
//   );
// }

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
import moment from "moment";
export default {
  data() {
    return {
      attachments: null,
      sortBy: "name",
      sortDesc: false,

      niceBytes,
      headers: [
        {
          text: "Filename",
          align: "start",
          sortable: true,
          value: "name",
        },

        { text: "Size", value: "size" },
        { text: "Last Updated", value: "updated_at" },
      ],
    };
  },
  methods: {
    routeTo(url) {
      console.log(url);
      window.open(`https://agency.icjia-api.cloud${url}`, "_blank");
    },
    isItNew(item) {
      let targetDate;
      if (item.publicationDate) {
        targetDate = item.publicationDate;
      } else {
        targetDate = item.created_at;
      }

      const now = moment(new Date());
      const end = moment(targetDate); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();

      if (days <= 7) {
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

<template>
  <v-sheet v-if="attachments" class="py-2">
    <div v-if="useSecondLevelHeading">
      <h2 v-if="label && label.length" id="attachments">{{ label }}</h2>
      <h2 v-else class="" id="attachments">Attachments</h2>
    </div>
    <!-- The same label at the level its place calls for (headingTag): h3 in a
         card under an h2, h2 under a page's h1. -->
    <component
      :is="headingTag"
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
    </component>

    <div class="">
      <!-- Sorting is off (WCAG 2.1.1): the sortable headers worked with a
           mouse only, and a short list of attachments does not need
           re-sorting. Each table keeps the order it used to show by default. -->
      <v-data-table
        v-if="!hideUpdated"
        dense
        :headers="headers"
        :items="attachmentsByDate"
        hide-default-footer
        :items-per-page="-1"
        disable-sort
        class="elevation-0"
      >
        <template v-slot:item.updated_at="{ item }">
          <span
            style="width: 90px; font-size: 14px; font-weight: 700; color: #222"
          >
            {{ item.updated_at | dateFormatAlt }}&nbsp;&nbsp;
          </span>
        </template>
        <template v-slot:item.size="{ item }">
          <span style="font-size: 12px">{{ niceBytes(item.size) }}</span>
        </template>
        <template v-slot:item.name="{ item }">
          <a
            :href="fileUrl(item.url)"
            target="_blank"
            rel="noopener noreferrer"
            class="attachment"
            @click.stop="trackDownload(item.url)"
          >
            {{ item.name }}
          </a>
        </template>
      </v-data-table>
      <v-data-table
        v-if="hideUpdated"
        dense
        :headers="slimHeaders"
        :items="attachmentsByName"
        hide-default-footer
        :items-per-page="-1"
        disable-sort
        class="elevation-0"
      >
        <template v-slot:item.size="{ item }">
          <span style="font-size: 12px">{{ niceBytes(item.size) }}</span>
        </template>
        <template v-slot:item.name="{ item }">
          <a
            :href="fileUrl(item.url)"
            target="_blank"
            rel="noopener noreferrer"
            class="attachment"
            @click.stop="trackDownload(item.url)"
          >
            {{ item.name }}
          </a>
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
import { sortItems } from "vuetify/lib/util/helpers";
// eslint-disable-next-line no-unused-vars
import dayjs from "@/plugins/dayjs";
export default {
  data() {
    return {
      attachments: null,

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
  computed: {
    // The orders the tables used to sort into by default (newest first, or
    // by file name when Last Updated is hidden), using Vuetify's own
    // comparator so the rows appear in exactly the same order.
    attachmentsByDate() {
      if (!this.attachments) return [];
      return sortItems(
        [...this.attachments],
        ["updated_at"],
        [true],
        this.$vuetify.lang.current
      );
    },
    attachmentsByName() {
      if (!this.attachments) return [];
      return sortItems(
        [...this.attachments],
        ["name"],
        [false],
        this.$vuetify.lang.current
      );
    },
  },
  methods: {
    fileUrl(url) {
      return `https://agency.icjia-api.cloud${url}`;
    },
    trackDownload(url) {
      // Fire-and-forget analytics; do NOT block the browser's native download
      // (no preventDefault — the anchor's href triggers the download directly).
      try {
        if (typeof window.plausible === "function") {
          window.plausible("file_download", { props: { url } });
          window.plausible("Outbound Link: Click", {
            props: { url: this.fileUrl(url) },
          });
        }
      } catch (_e) {
        /* analytics failure must never block downloads */
      }
    },
    // Below 600 px v-data-table stacks each row's cells, each under its own
    // label, and drops the header row. With sorting off there is then no
    // header cell at all, and the table's cells have no headers (WCAG 1.3.1;
    // axe and Lighthouse: td-has-header). Stacked, it is a list of labelled
    // values ("Filename: notice.pdf"), not a grid: it is marked
    // presentational, and is a table again when the header row is back.
    markStackedTables() {
      if (!this.$el || !this.$el.querySelectorAll) return;
      this.$el.querySelectorAll("table").forEach((table) => {
        if (table.querySelector(".v-data-table__mobile-table-row"))
          table.setAttribute("role", "presentation");
        else table.removeAttribute("role");
      });
    },
    isItUpdated(item) {
      const created = dayjs(this.baseItemPublished);
      const updated = dayjs(item.updated_at); // another date
      const duration = dayjs.duration(updated.diff(created));
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
    // Once the table has been drawn.
    this.$nextTick(() => this.$nextTick(this.markStackedTables));
  },
  watch: {
    // The table stacks, and unstacks, as the window's width crosses 600 px.
    "$vuetify.breakpoint.width"() {
      this.$nextTick(this.markStackedTables);
    },
  },
  props: {
    label: {
      type: String,
      default: null,
    },
    // The level of the small uppercase label (not of the plain h2 that
    // useSecondLevelHeading gives).
    headingTag: {
      type: String,
      default: "h3",
      validator: (tag) => ["h2", "h3", "h4"].includes(tag),
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
  color: #000;
  text-decoration: none;
}

.file-name {
  font-weight: 700;
}

.file-name:hover {
  text-decoration: underline;
  color: #222;
}
</style>

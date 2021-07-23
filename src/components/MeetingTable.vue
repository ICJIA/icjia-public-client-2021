<template>
  <div>
    <v-data-table
      :headers="meetingHeaders"
      :items="items"
      :single-expand="true"
      :expanded.sync="expanded"
      item-key="title"
      show-expand
      class="elevation-0 hover"
      :search="search"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      @click:row="clicked"
      :footer-props="{
        'items-per-page-options': [25, 50, 100, 150],
      }"
      :items-per-page="25"
      style="border: 1px solid #ddd"
    >
      <template v-slot:item.start="{ item }">
        <div
          style="width: 140px; font-size: 14px; font-weight: 700; color: #555"
        >
          {{ item.start | dateFormat }}
        </div>
      </template>
      <template v-slot:item.category="{ item }">
        <div style="font-size: 14px; font-weight: 700; color: #555">
          {{ getCleanCategory(item.category) }}
        </div>
      </template>
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <MeetingCard :item="item" class="mx-2 my-4"></MeetingCard>
        </td>
      </template>

      <template v-slot:top>
        <v-sheet class="px-5 py-5 markdown-body">
          <h2 :id="generateSlug(heading)" v-if="heading && heading.length">
            {{ heading }}
          </h2>
          <div
            v-if="text && text.length"
            style="font-size: 14px"
            class="px-2 py-4"
          >
            {{ text }}
          </div>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          ></v-text-field>
        </v-sheet>
      </template>
    </v-data-table>
    <div v-if="showDisclaimer">
      <p class="text-center mt-2" style="font-size: 11px; font-weight: 700">
        For meeting materials prior to {{ $myApp.config.archiveDate }} please
        see the
        <a href="https://archive.icjia.cloud" target="_blank"
          >ICJIA Document Archive.</a
        >
      </p>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import NProgress from "nprogress";
// eslint-disable-next-line no-unused-vars
import { EventBus } from "@/event-bus";
import slug from "slug";
import { renderToHtml } from "@/services/Markdown";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      search: "",
      sortBy: "start",
      sortDesc: true,
      expanded: [],
      singleExpand: false,
      meetingHeaders: [
        { text: "Meeting Date", value: "start" },
        {
          text: "Category",
          align: "start",
          sortable: true,

          value: "category",
        },

        { text: "Title", value: "title" },
      ],
    };
  },
  mounted() {
    attachInternalLinks(this);
    attachSearchEvents(this);
  },
  methods: {
    generateSlug(heading) {
      return slug(heading);
    },
    render(content) {
      return renderToHtml(content);
    },
    getCleanCategory(category) {
      let categoryMap = this.$myApp.config.maps.meetings;
      let obj = categoryMap.find((o) => o.category === category);
      if (_.isEmpty(obj)) {
        return "Undefined";
      } else {
        return obj.label;
      }
    },
    clicked(value) {
      //console.log(value);
      if (value === this.expanded[0]) {
        this.expanded = [];
      } else {
        if (this.expanded.length) {
          this.expanded.shift();
          this.expanded.push(value);
        } else {
          this.expanded.push(value);
        }
      }
    },
  },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    heading: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
    showDisclaimer: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style>
tbody tr:nth-of-type(even) {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>

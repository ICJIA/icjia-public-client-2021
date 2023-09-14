<template>
  <div>
    <v-data-table
      :headers="policyHeaders"
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
        'items-per-page-options': [50, 100, 250, -1],
      }"
      :items-per-page="100"
      style="border: 1px solid #eee; background: #fff"
    >
      <template v-slot:item.updated_at="{ item }">
        <div
          style="width: 110px; font-size: 14px; font-weight: 700; color: #555"
        >
          {{ item.updated_at | dateFormatAlt }}
        </div>
      </template>

      <template v-slot:item.title="{ item }">
        <div v-if="item.isCancelled" style="text-decoration: line-through">
          {{ item.title }}
        </div>
        <div v-else>
          {{ item.title }}
        </div>
      </template>

      <template v-slot:item.category="{ item }">
        <div style="font-size: 14px; font-weight: 700; color: #555">
          {{ getCleanCategory(item.category) }}
        </div>
      </template>

      <!-- eslint-disable-next-line vue/no-unused-vars -->
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <PolicyCard
            :item="item"
            class="mx-2 my-4"
            :key="item.id"
          ></PolicyCard>
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
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import NProgress from "nprogress";
// eslint-disable-next-line no-unused-vars
import { EventBus } from "@/event-bus";
import { fixExpandButtons } from "@/a11y";
import slug from "slug";
import { renderToHtml } from "@/services/Markdown";
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      search: "",
      sortBy: "updated_at",
      sortDesc: true,
      expanded: [],
      singleExpand: false,
      policyHeaders: [
        { text: "Last updated", value: "updated_at" },
        {
          text: "Category",
          align: "start",
          sortable: true,

          value: "category",
        },

        { text: "Title", value: "title", align: "start" },
      ],
    };
  },
  mounted() {
    // attachInternalLinks(this);
    attachSearchEvents(this);
    fixExpandButtons();
  },
  methods: {
    generateSlug(heading) {
      return slug(heading);
    },
    render(content) {
      return renderToHtml(content);
    },
    getCleanCategory(category) {
      let categoryMap = this.$myApp.config.maps.policies;
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

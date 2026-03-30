<template>
  <div>
    <v-data-table
      :headers="showByDate ? policyHeadersFull : policyHeadersSimple"
      :items="items"
      item-key="title"
      class="elevation-0 hover"
      :search="search"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      :footer-props="{
        'items-per-page-options': [100, 200, 300 - 1],
      }"
      :items-per-page="100"
      style="border: 1px solid #eee; background: #fff"
    >
      <template v-slot:item.published_at="{ item }">
        <div
          style="width: 110px; font-size: 14px; font-weight: 400; color: #222"
          class=""
          @click.stop.prevent="downloadFile(item.attachments[0])"
        >
          <span class="">
            {{ item.published_at | dateFormatAlt }}
          </span>
        </div>
      </template>

      <!--eslint-disable-next-line vue/no-unused-vars -->
      <template v-slot:item.updated_at="{ item }">
        <div
          class="text-center"
          style="margin-left: -5px"
          @click.stop.prevent="downloadFile(item.attachments[0])"
        >
          {{ formatDate(item.updated_at) }}
        </div>
      </template>

      <template v-slot:item.title="{ item }">
        <div
          @click.stop.prevent="downloadFile(item.attachments[0])"
          style="
            font-size: 14px;
            font-weight: 700;
            color: #000;
            padding-top: 5px;
            padding-bottom: 5px;
            text-transform: uppercase;
          "
        >
          <span class="">
            <strong>{{ item.title }}</strong>
          </span>
        </div>
      </template>

      <!--eslint-disable-next-line vue/no-unused-vars -->
      <template v-slot:item.attachments[0].url="{ item }">
        <div
          @click.stop.prevent="downloadFile(item.attachments[0])"
          style="
            font-size: 14px;
            font-weight: 700;
            color: #595959;
            margin-left: -20px;
          "
          class="text-center"
        >
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <!-- {{ item.attachments[0].url }} -->
              <v-btn x-small
                >Download Form&nbsp;<v-icon
                  right
                  color="blue"
                  v-bind="attrs"
                  v-on="on"
                  >mdi mdi-download-circle-outline</v-icon
                ></v-btn
              >
            </template>
            <span>Click to download form</span>
          </v-tooltip>
        </div>
      </template>

      <!-- eslint-disable-next-line vue/no-unused-vars -->
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <RequiredFormCard
            :item="item"
            class="mx-2 my-4"
            :key="item.id"
          ></RequiredFormCard>
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
            aria-label="Search required forms"
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
import NProgress from "@/services/Progress";
// eslint-disable-next-line no-unused-vars
import { EventBus } from "@/event-bus";
import { fixExpandButtons } from "@/a11y";
import slug from "slug";
import { renderToHtml } from "@/services/Markdown";
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
// import _ from "lodash";
import moment from "moment";
export default {
  data() {
    return {
      search: "",
      sortBy: "title",
      sortByDate: "published_at",
      sortDesc: false,
      sortDescByDate: true,
      expanded: [],
      singleExpand: false,
      policyHeadersFull: [
        { text: "Published", value: "published_at" },
        { text: "Last Updated", value: "updated_at" },

        { text: "Title", value: "title", align: "start" },
      ],
      policyHeadersSimple: [
        { text: "Title", value: "title", align: "start", width: "30%" },
        { text: "Last Updated", value: "updated_at", align: "center" },
        { text: "Download", value: "attachments[0].url", align: "center" },
        // { text: "Published", value: "published_at" },
      ],
    };
  },
  mounted() {
    // attachInternalLinks(this);
    attachSearchEvents(this);
    fixExpandButtons();
    if (this.showByDate) {
      this.sortBy = "updated_at";
      this.sortDesc = true;
    } else {
      this.sortBy = "title";
    }
  },
  methods: {
    formatDate(date) {
      return moment(date).format("MMM D, YYYY");
    },
    daysBetween({ publishedAt, updatedAt }) {
      const start = moment(publishedAt);
      const end = moment(updatedAt);
      const duration = end.diff(start, "days");
      return `${duration}`;
    },
    isItNew(item) {
      let targetDate;

      targetDate = item.updated_at;

      const now = moment(new Date());
      const end = moment(targetDate); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();

      // if (days <= this.$myApp.config.daysToShowNew) {
      //   return true;
      // } else {
      //   return false;
      // }

      if (days <= 1) {
        return true;
      } else {
        return false;
      }
    },
    downloadFile(item) {
      let url = "https://agency.icjia-api.cloud" + item.url;
      window.plausible("Outbound Link: Click", { props: { url: url } });
      window.open(url, "_blank");
    },
    generateSlug(heading) {
      return slug(heading);
    },
    render(content) {
      return renderToHtml(content);
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
    showByDate: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style>
tbody tr:nth-of-type(even) {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>

<template>
  <div class="markdown-body text-center pb-12">
    <div>
      <v-container v-if="publications"
        ><v-row>
          <v-card
            class="px-5 py-5 mt-10 text-center"
            style="width: 100% !important"
          >
            <h1>ICJIA Publications</h1>

            <v-card-title class="mb-5">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
              ></v-text-field>
            </v-card-title>
            <DataTable
              :headers="headers"
              :items="publications"
              :search="search"
              show-expand
              item-key="id"
              :single-expand="singleExpand"
              :expanded.sync="expanded"
              @click:row="clicked"
              :loading="tableLoading"
              dense
              :page.sync="page"
              class="text-center"
              :sort-by.sync="sortBy"
              :sort-desc.sync="sortDesc"
              :footer-props="{
                'items-per-page-options': [100, 150, 200, 250, 500],
              }"
              :items-per-page="150"
              id="pubTable"
            >
              <!-- Sortable column headers hold a real button (WCAG 2.1.1): the
                   header cell sorted on a mouse click only. The button's click
                   reaches the header cell, so Vuetify sorts exactly as before and
                   keeps aria-sort on the cell. -->
              <template
                v-for="header in sortableHeaders"
                v-slot:[`header.${header.value}`]
              >
                <button
                  :key="header.value"
                  type="button"
                  class="table-sort-button"
                >
                  {{ header.text }}
                </button>
              </template>
              <template v-slot:item.publicationDate="{ item }">
                <div
                  style="
                    width: 90px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #222;
                  "
                >
                  {{ item.publicationDate | dateFormatAlt }}
                </div>
              </template>
              <template v-slot:item.title="{ item }">
                <div class="my-2">
                  <span class="">
                    <v-chip
                      v-if="isItNew(item)"
                      label
                      x-small
                      color="#0D4474"
                      class="mr-2"
                      style="margin-top: 0px"
                    >
                      <span style="color: #000 !important; font-weight: 400">
                        NEW!
                      </span>
                    </v-chip>

                    <strong>{{ item.title }}</strong>
                  </span>
                </div>
              </template>
              <template v-slot:item.pubType="{ item }">
                <div class="my-2">
                  <span class="">{{ getPublicationType(item.pubType) }}</span>
                </div>
              </template>
              <!-- <template v-slot:item.fullPath="{ item }">
                <div class="my-2">
                  <v-button :to="item.fullPath">
                    <v-icon>link</v-icon>
                  </v-button>
                </div>
              </template> -->
              <template v-slot:item.articleURL="{ item }">
                <div
                  class="my-2"
                  v-if="item.localArticlePath && item.localArticlePath.length"
                >
                  <!-- A hidden title makes each "Web Article" and "Download PDF"
                       name unique ("Download PDF: <title>") and keeps the visible
                       words first (WCAG 2.4.4, 2.5.3). -->
                  <span class=""
                    ><v-btn
                      outlined
                      x-small
                      color="blue darken-4"
                      @click="registerArticleView(item)"
                      >Web Article<span class="sr-only"
                        >: {{ item.title }}</span
                      ></v-btn
                    ></span
                  >
                </div>
              </template>
              <template v-slot:item.fileURL="{ item }">
                <div class="my-2" v-if="item.fileURL && item.fileURL.length">
                  <span v-if="item.pubType !== 'application'"
                    ><v-btn
                      :href="item.fileURL"
                      target="_blank"
                      rel="noopener noreferrer"
                      x-small
                      @click="registerDownload(item)"
                      >Download PDF<span class="sr-only"
                        >: {{ item.title }}</span
                      ><v-icon right>mdi-download</v-icon></v-btn
                    ></span
                  >
                  <span v-else
                    ><v-btn x-small
                      >Open Application<v-icon right
                        >mdi-open-in-new</v-icon
                      ></v-btn
                    ></span
                  >
                </div>
              </template>
              <template v-slot:expanded-item="{ headers, item }">
                <td
                  :colspan="headers.length"
                  style="padding: 0 !important; margin: 0 !important"
                >
                  <PublicationCard :item="item"></PublicationCard>
                </td> </template
            ></DataTable>
          </v-card>
          <div class="mt-5" style="font-size: 12px; text-align: center">
            Individual publications are also available for download from the
            ICJIA Document Archive:
            <a
              href="https://archive.icjia.cloud"
              target="_blank"
              rel="noopener noreferrer"
              >https://archive.icjia.cloud</a
            >
          </div></v-row
        ></v-container
      >
      <v-container v-else
        ><v-row
          ><v-col><Loader loaderType="skeleton"></Loader></v-col
        ></v-row>
      </v-container>
      <div style="height: 200px"></div>
    </div>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { fixExpandButtons, fixNestedInteractive } from "@/a11y";
import DataTable from "@/components/DataTable";
import { getPublicationType } from "@/lib/utils";
import { deepSanitize } from "@/utils/contentSanitizer";
import { moveFocusTo } from "@/utils/focus";
import { goToOptions } from "@/utils/motion";
import { EventBus } from "@/event-bus";
import _ from "lodash";
import dayjs from "@/plugins/dayjs";
import axios from "axios";

export default {
  name: "Publications",
  components: { DataTable },
  metaInfo() {
    return {
      title: "Publications",
    };
  },
  data() {
    return {
      sortBy: "publicationDate",
      sortDesc: true,
      page: 1,
      expanded: [],
      search: "",
      singleExpand: true,
      publications: null,
      getPublicationType,
      tableLoading: true,

      headers: [
        { text: "Date", value: "publicationDate" },
        {
          text: "Title",
          align: "start",

          value: "title",
        },
        { text: "Type", value: "pubType" },

        {
          text: "Article",
          value: "articleURL",
          align: "center",
          sortable: false,
        },
        {
          text: "File",
          value: "fileURL",
          align: "center",
          sortable: false,
        },
      ],
    };
  },
  computed: {
    sortableHeaders() {
      return this.headers.filter((header) => header.sortable !== false);
    },
  },
  watch: {
    // Sorting re-renders the rows, which drops the names fixExpandButtons
    // gave the expand buttons; name them again once the rows are back.
    sortBy() {
      this.$nextTick(fixExpandButtons);
    },
    sortDesc() {
      this.$nextTick(fixExpandButtons);
    },
    page(newValue) {
      console.log("paginate: ", newValue);

      setTimeout(fixExpandButtons, 2000);
      setTimeout(fixNestedInteractive, 2000);
      console.log("a11y expand button: hacky fix (paginate)");
      // Paged from the table's footer, focus moves to the new page's first
      // row, where the table scrolls back to: it stayed on "Next page", some
      // 8,000 px below the window (WCAG 2.4.3). A page change from sorting
      // or searching leaves focus where it is. The table jumps back when
      // reduced motion is requested.
      const active = document.activeElement;
      const fromFooter = Boolean(active && active.closest(".v-data-footer"));
      this.$vuetify.goTo("#pubTable", goToOptions({ offset: 350 }));
      if (fromFooter) {
        this.$nextTick(() =>
          moveFocusTo(this.$el.querySelector("#pubTable tbody tr"))
        );
      }
    },
    tableLoading(newValue) {
      console.log("table loading: ", newValue);

      //TODO: This works for siteImprove a11y -- but need to adjust this hacky fix
      setTimeout(fixExpandButtons, 2000);
      setTimeout(fixNestedInteractive, 2000);
      console.log("a11y expand button: hacky fix (original load)");
    },
  },
  mounted() {
    NProgress.start();

    this.fetchPublications();
    EventBus.$emit("context-label", "Publications");
    // fixExpandButtons();
    NProgress.done();
    this.tableLoading = false;
  },
  methods: {
    registerArticleView(item) {
      //console.log("publicationList_article_view: ", item.articleURL);
      window.plausible("publicationList_article_view", {
        props: {
          url: item.articleURL,
        },
      });
      this.$router.push({ path: item.localArticlePath });
    },

    registerDownload(item) {
      //console.log("publicationList_file_download: ", item.fileURL);
      window.plausible("publicationList_file_download", {
        props: {
          url: item.fileURL,
        },
      });
    },
    async fetchPublications() {
      if (this.$myApp.publications && this.$myApp.publications.length) {
        this.publications = this.$myApp.publications;
        this.tableLoading = false;
        return;
      }
      const limit = 500;
      let pubArray = [];
      let start = 0;
      let count = await axios.get(
        `https://agency.icjia-api.cloud/publications/count`
      );
      count = count.data;
      let iterations = Math.ceil(count / limit);

      for (let i = 0; i < iterations; i++) {
        let response = await axios.get(
          `https://agency.icjia-api.cloud/publications?_limit=${limit}&_start=${start}`
        );
        pubArray = pubArray.concat(response.data);
        start += limit;
      }
      pubArray = deepSanitize(_.uniqBy(pubArray, "id"));
      let publications = pubArray.map((p) => {
        let obj = {
          ...p,
          altTitle: p.title.toLowerCase(),
          localArticlePath:
            p.articleURL && p.articleURL.includes("https://icjia.illinois.gov")
              ? p.articleURL.replace("https://icjia.illinois.gov", "")
              : null,
          fullPath: `/about/publications/${p.slug}`,
          contentType: "publication",
        };
        return obj;
      });

      this.publications = _.orderBy(
        publications,
        ["publicationDate"],
        ["desc"]
      );
      this.$myApp.publications = this.publications;

      NProgress.done();
    },
    isItNew(item) {
      let targetDate;
      if (item.publicationDate) {
        targetDate = item.publicationDate;
      } else {
        targetDate = item.created_at;
      }

      const now = dayjs(new Date());
      const end = dayjs(targetDate); // another date
      const duration = dayjs.duration(now.diff(end));
      const days = duration.asDays();

      if (days <= this.$myApp.config.daysToShowNew) {
        return true;
      } else {
        return false;
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
};
</script>

<style>
tr {
  cursor: pointer !important;
}
</style>

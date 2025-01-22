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
            <v-data-table
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
              <template v-slot:item.publicationDate="{ item }">
                <div
                  style="
                    width: 90px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #555;
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
                      <span style="color: #fff !important; font-weight: 400">
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
                  <span class=""
                    ><v-btn
                      outlined
                      x-small
                      color="blue darken-4"
                      @click="registerArticleView(item)"
                      >Web Article</v-btn
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
                      x-small
                      @click="registerDownload(item)"
                      >Download PDF<v-icon right>mdi-download</v-icon></v-btn
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
            ></v-data-table>
          </v-card>
          <div class="mt-5" style="font-size: 12px; text-align: center">
            Individual publications are also available for download from the
            ICJIA Document Archive:
            <a href="https://archive.icjia.cloud" target="_blank"
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
import NProgress from "nprogress";
import { fixExpandButtons } from "@/a11y";
import { getPublicationType } from "@/lib/utils";
import { EventBus } from "@/event-bus";
import _ from "lodash";
import moment from "moment";
import axios from "axios";

export default {
  name: "Publications",
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
  watch: {
    page(newValue) {
      console.log("paginate: ", newValue);

      setTimeout(fixExpandButtons, 2000);
      console.log("a11y expand button: hacky fix (paginate)");
      this.$vuetify.goTo("#pubTable", { offset: 350 });
    },
    tableLoading(newValue) {
      console.log("table loading: ", newValue);

      //TODO: This works for siteImprove a11y -- but need to adjust this hacky fix
      setTimeout(fixExpandButtons, 2000);
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
        console.warn("Publications cached...");
        this.tableLoading = false;
        return;
      } else {
        console.warn("Fetching publications...");
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
      pubArray = _.uniqBy(pubArray, "id");
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

      const now = moment(new Date());
      const end = moment(targetDate); // another date
      const duration = moment.duration(now.diff(end));
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

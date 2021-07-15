<template>
  <div class="markdown-body text-center mt-10">
    <div>
      <v-container v-if="publications" fluid
        ><v-row
          ><v-col cols="12" md="6">
            <div style="height: 900px !important; overflow-y: auto">
              <v-card
                class="px-5 py-5 text-center"
                style="width: 100% !important"
              >
                <h1>Publication List Checker</h1>

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
                  item-key="id"
                  @click:row="rowClick"
                  dense
                  class="text-center"
                  :sort-by.sync="sortBy"
                  :sort-desc.sync="sortDesc"
                  :footer-props="{
                    'items-per-page-options': [100, 150, 200, 250, 500],
                  }"
                  :items-per-page="150"
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
                      <span class="" style="font-size: 12px"
                        ><strong>{{ item.title }}</strong></span
                      >
                    </div>
                  </template>
                  <template v-slot:item.pubType="{ item }">
                    <div class="my-2">
                      <span class="">{{
                        getPublicationType(item.pubType)
                      }}</span>
                    </div>
                  </template>
                  <template v-slot:item.id="{ item }">
                    <div class="my-2">
                      <span class=""
                        ><v-btn
                          x-small
                          @click.stop.prevent="fetchSinglePublication(item.id)"
                          >Edit</v-btn
                        ></span
                      >
                    </div>
                  </template>
                  <template v-slot:item.verified="{ item }">
                    <div class="my-2" v-if="item.verified" style="width: 90px">
                      <span class="">{{ item.verified | dateFormatAlt }}</span>
                    </div>
                    <div class="my-2" v-else style="width: 90px">
                      <span class=""></span>
                    </div>
                  </template>
                </v-data-table>
              </v-card></div
          ></v-col>

          <v-col cols="12" md="6" class="">
            <div v-if="!singlePublication">
              <h3>Select a publication to edit</h3>
            </div>
            <div v-else>
              <v-card class="px-5 py-10">
                <v-text-field
                  :value="singlePublication.title"
                  style="font-weight: 900 !important; font-size: 24px"
                  label="Title"
                  ref="title"
                  class="mt-8"
                  v-model="singlePublication.title"
                ></v-text-field>

                <div
                  d-flex
                  class="text-left"
                  style="font-size: 12px; font-weight: 900; color: #666"
                >
                  Publication Type
                </div>
                <v-select
                  v-model="pubTypeSelect"
                  :items="pubTypes"
                  persistent-hint
                  filled
                  dense
                  return-object
                  item-text="text"
                  item-value="value"
                  label="Publication Type"
                  single-line
                  ref="pubType"
                  style="font-weight: 900 !important"
                  class="mb-2"
                ></v-select>
                <div
                  d-flex
                  class="text-left mb-3"
                  style="font-size: 12px; font-weight: 900; color: #666"
                >
                  Summary
                </div>
                <v-textarea
                  style="font-size: 12px"
                  v-model="singlePublication.summary"
                  auto-grow
                  filled
                  :value="
                    singlePublication.summary &&
                    singlePublication.summary.length
                      ? singlePublication.summary
                      : 'No summary available.'
                  "
                  ref="summary"
                ></v-textarea>
                <div
                  style="
                    border: 1px solid #ccc;
                    padding: 15px;
                    background: #eee;
                  "
                >
                  <v-text-field
                    v-model="singlePublication.articleURL"
                    :value="
                      singlePublication.articleURL &&
                      singlePublication.articleURL.length
                        ? singlePublication.articleURL
                        : 'n/a'
                    "
                    style="font-weight: 900 !important; font-size: 12px"
                    label="Article URL"
                    ref="articleURL"
                    class="mt-2"
                  ></v-text-field>
                  <div
                    d-flex
                    class="text-left"
                    style="margin-top: -10px"
                    v-if="
                      singlePublication.articleURL &&
                      singlePublication.articleURL.length
                    "
                  >
                    <v-btn x-small @click="checkArticleURL"
                      >Check URL <v-icon right>link</v-icon></v-btn
                    >
                  </div>
                  <v-text-field
                    v-model="singlePublication.fileURL"
                    :value="
                      singlePublication.fileURL &&
                      singlePublication.fileURL.length
                        ? singlePublication.fileURL
                        : 'n/a'
                    "
                    style="font-weight: 900 !important; font-size: 12px"
                    label="File URL"
                    ref="fileURL"
                    class="mt-6"
                  ></v-text-field>
                  <div
                    d-flex
                    class="text-left"
                    style="margin-top: -10px"
                    v-if="
                      singlePublication.fileURL &&
                      singlePublication.fileURL.length
                    "
                  >
                    <v-btn x-small @click="checkFileURL"
                      >Check File <v-icon right>download</v-icon></v-btn
                    >
                  </div>
                </div>
                <div
                  class="text-left px-5 py-5 mt-8"
                  style="font-size: 12px; font-weight: 900; background: #eee"
                >
                  Permalink<br />

                  <a
                    :href="getPermaLink(singlePublication.slug)"
                    target="_blank"
                    class="permalink"
                  >
                    {{ getPermaLink(singlePublication.slug) }}</a
                  >
                </div>
                <v-card-actions class="mt-10">
                  <v-btn outlined @click.stop.prevent="cancel">Cancel</v-btn>
                  <v-btn
                    outlined
                    @click.stop.prevent="unpublish(singlePublication.id)"
                    >Unpublish</v-btn
                  >
                  <v-spacer></v-spacer>
                  <v-btn
                    color="grey lighten-2"
                    @click="saveOnly(singlePublication.id)"
                    >Save only</v-btn
                  >
                  <v-btn
                    dark
                    color="green darken-4"
                    @click="saveAndVerify(singlePublication.id)"
                    >Save and Verify</v-btn
                  >
                </v-card-actions>
              </v-card>
            </div>
          </v-col>
        </v-row></v-container
      >
      <v-container fluid v-else
        ><v-row
          ><v-col cols="12" md="6"
            ><Loader loaderType="skeleton" :repeat="5"></Loader></v-col
        ></v-row>
      </v-container>
    </div>
    <v-snackbar top v-model="snackbar">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import NProgress from "nprogress";
// eslint-disable-next-line no-unused-vars
import { renderToHtml } from "@/services/Markdown";
const axios = require("axios");

const api = axios.create({
  baseURL: "https://agency.icjia-api.cloud",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  NProgress.start();
  return config;
});

api.interceptors.response.use((response) => {
  NProgress.done();
  return response;
});
import { getPublicationType } from "@/lib/utils";
import _ from "lodash";
export default {
  name: "Publications",
  data() {
    return {
      sortBy: "publicationDate",
      sortDesc: true,
      snackbar: false,
      snackbarText: null,
      expanded: [],
      search: "",
      singleExpand: true,
      publications: null,
      getPublicationType,
      singlePublication: null,
      pubTypeSelect: null,
      pubTypes: [
        { text: "researchReport", value: "researchReport" },
        { text: "researchBulletin", value: "researchBulletin" },
        { text: "researchAtAGlance", value: "researchAtAGlance" },
        { text: "trendsAndIssuesUpdate", value: "trendsAndIssuesUpdate" },
        {
          text: "motorVehicleTheftPublications",
          value: "motorVehicleTheftPublications",
        },
        { text: "barj", value: "barj" },
        { text: "compiler", value: "compiler" },
        { text: "getTheFacts", value: "getTheFacts" },
        { text: "programEvaluationSummary", value: "programEvaluationSummary" },
        { text: "megProfiles", value: "megProfiles" },
        { text: "annualReport", value: "annualReport" },
        { text: "article", value: "article" },
        { text: "report", value: "report" },
        { text: "evaluation", value: "evaluation" },
        { text: "toolkit", value: "toolkit" },
        { text: "onGoodAuthority", value: "onGoodAuthority" },
        { text: "application", value: "application" },
        { text: "general", value: "general" },
      ],

      headers: [
        { text: "Date", value: "publicationDate" },
        {
          text: "Title",
          align: "start",

          value: "title",
        },
        { text: "Type", value: "pubType" },

        {
          text: "Edit",
          value: "id",
          align: "center",
          sortable: false,
        },
        {
          text: "Verified",
          value: "verified",
          align: "center",
          sortable: false,
        },
      ],
    };
  },
  mounted() {
    NProgress.start();
    this.fetchAllPublications();
    this.pubTypes = _.orderBy(this.pubTypes, ["text"], ["asc"]);
  },
  methods: {
    async saveOnly(id) {
      let headers = {
        headers: { Authorization: `Bearer ${this.$store.state.auth.jwt}` },
      };
      let saveData = {
        title: this.singlePublication.title,
        summary: this.singlePublication.summary,
        pubType: this.pubTypeSelect.value,
        fileURL: this.singlePublication.fileURL,
        articleURL: this.singlePublication.articleURL,
      };
      console.log(id, saveData);
      try {
        const res = await api.put(`/publications/${id}`, saveData, headers);
        console.log(res);
        this.notify("Successfully saved");
        NProgress.done();
      } catch (e) {
        console.log(e);
        this.error = e;
        this.notify("Error. Not saved. Please contact ISU.");
        NProgress.done();
      }
      this.fetchAllPublications();
      // this.$vuetify.goTo(0, { duration: 10 });
    },
    notify(msg) {
      //console.log(msg);
      this.snackbarText = msg;
      this.snackbar = true;
    },
    cancel() {
      this.singlePublication = null;
      this.$vuetify.goTo(0, { duration: 10 });
    },
    // eslint-disable-next-line no-unused-vars
    async unpublish(id) {
      let headers = {
        headers: { Authorization: `Bearer ${this.$store.state.auth.jwt}` },
      };
      //console.log(headers);
      try {
        const res = await api.put(
          `/publications/${id}`,
          {
            published_at: null,
          },
          headers
        );
        console.log(res);
        this.notify("Successfully unpublished");
        NProgress.done();
      } catch (e) {
        console.log(e);
        this.error = e;
        this.notify("Error. Not unpublished. Please contact ISU.");
        NProgress.done();
      }
      this.fetchAllPublications();
      this.singlePublication = null;
      this.$vuetify.goTo(0, { duration: 10 });
    },
    checkArticleURL() {
      let url = this.$refs.articleURL.value;
      //TODO: Fix replacement when site is live
      url = url.replace(
        "https://icjia.illinois.gov/researchhub/",
        "https://agency.icjia.cloud/researchhub/"
      );
      window.open(url, "noopener,resizable,scrollbars").focus();
    },
    checkFileURL() {
      let url = this.$refs.fileURL.value;
      window.open(url, "noopener,resizable,scrollbars").focus();
    },
    getPermaLink(slug) {
      return `https://agency.icjia.cloud/about/publications/${slug}`;
    },
    rowClick(value) {
      //console.log(value);
      this.fetchSinglePublication(value.id);
    },
    async fetchAllPublications() {
      try {
        let { data } = await api.get("/publications?_limit=1500", {
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });
        this.publications = data;
        this.publications = _.orderBy(
          this.publications,
          ["publicationDate"],
          ["desc"]
        );

        NProgress.done();
      } catch (e) {
        console.log(e);
        this.error = e;
        NProgress.done();
      }
    },
    async fetchSinglePublication(id) {
      //this.$vuetify.goTo(0, { duration: 10 });
      try {
        let { data } = await api.get(`/publications/${id}`, {
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });
        this.singlePublication = data;
        this.pubTypeSelect = {};
        this.pubTypeSelect.text = this.singlePublication.pubType;
        this.pubTypeSelect.value = this.singlePublication.pubType;

        NProgress.done();
      } catch (e) {
        console.log(e);
        this.error = e;
        NProgress.done();
      }
    },
  },
};
</script>

<style>
tr {
  cursor: pointer !important;
}
.permalink {
  /* These are technically the same, but use both */
  overflow-wrap: break-word;
  word-wrap: break-word;

  -ms-word-break: break-all;
  /* This is the dangerous one in WebKit, as it breaks things wherever */
  word-break: break-all;
  /* Instead use this non-standard one: */
  word-break: break-word;

  /* Adds a hyphen where the word breaks, if supported (No Blink) */
  /* -ms-hyphens: auto;
  -moz-hyphens: auto;
  -webkit-hyphens: auto;
  hyphens: auto; */
}
</style>

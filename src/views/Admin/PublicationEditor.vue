<template>
  <div class="markdown-body text-center">
    <div>
      <v-container v-if="publications" fluid
        ><v-row
          ><v-col cols="12" md="6"
            ><v-card
              class="px-5 py-5 mt-10 text-center"
              style="width: 100% !important"
            >
              <h1>ICJIA Publication Editor</h1>

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
                    <span class="">{{ getPublicationType(item.pubType) }}</span>
                  </div>
                </template>
                <template v-slot:item.id="{ item }">
                  <div class="my-2">
                    <span class=""
                      ><v-btn x-small @click="fetchSinglePublication(item.id)"
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
              </v-data-table> </v-card
          ></v-col>

          <v-col cols="12" md="6" class="mt-12">
            <div v-if="!singlePublication">
              <h3>Select a publication to edit</h3>
            </div>
            <div v-else>
              <v-card class="px-5 py-10">
                <v-text-field
                  :value="singlePublication.title"
                  style="font-weight: 900 !important"
                  label="Title"
                  ref="title"
                ></v-text-field>
                <v-textarea
                  label="Summary"
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
              </v-card>
              {{ singlePublication }}
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
      expanded: [],
      search: "",
      singleExpand: true,
      publications: null,
      getPublicationType,
      singlePublication: null,

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
  },
  methods: {
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
      this.$vuetify.goTo(0, { duration: 10 });
      try {
        let { data } = await api.get(`/publications/${id}`, {
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });
        this.singlePublication = data;
        NProgress.done();
      } catch (e) {
        console.log(e);
        this.error = e;
        NProgress.done();
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

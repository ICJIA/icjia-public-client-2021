<template>
  <div class="markdown-body text-center">
    <div>
      <v-container v-if="publications"
        ><v-row
          ><v-card
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
              dense
              class="text-center"
              :sort-by.sync="sortBy"
              :sort-desc.sync="sortDesc"
              :footer-props="{
                'items-per-page-options': [100, 150, 200, 250],
              }"
              :items-per-page="200"
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
                  <span class=""
                    ><strong>{{ item.title }}</strong></span
                  >
                </div>
              </template>
              <template v-slot:item.pubType="{ item }">
                <div class="my-2">
                  <span class="">{{ getPublicationType(item.pubType) }}</span>
                </div>
              </template>
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
                      :to="item.localArticlePath"
                      >Web Article</v-btn
                    ></span
                  >
                </div>
              </template>
              <template v-slot:item.fileURL="{ item }">
                <div class="my-2">
                  <span v-if="item.pubType !== 'application'"
                    ><v-btn :href="item.fileURL" target="_blank" x-small
                      >Download PDF<v-icon right>download</v-icon></v-btn
                    ></span
                  >
                  <span v-else
                    ><v-btn x-small
                      >Open Application<v-icon right>open_in_new</v-icon></v-btn
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
            ></v-data-table> </v-card></v-row
      ></v-container>
      <v-container v-else
        ><v-row
          ><v-col><Loader loaderType="skeleton"></Loader></v-col
        ></v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { GET_ALL_PUBLICATIONS_QUERY } from "@/graphql/publications";
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
  mounted() {
    NProgress.start();
  },
  methods: {
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
  apollo: {
    publications: {
      prefetch: true,
      query: GET_ALL_PUBLICATIONS_QUERY,
      variables() {
        return {};
      },

      error(error) {
        this.error = JSON.stringify(error.message);
        NProgress.done();
      },
      result(ApolloQueryResult) {
        let publications = ApolloQueryResult.data.publications.map((e) => ({
          ...e,
          fullPath: `/about/publications/${e.slug}/`,
          contentType: "publication",
          localArticlePath:
            e.articleURL &&
            e.articleURL.includes("https://icjia.illinois.gov/researchhub")
              ? e.articleURL.replace("https://icjia.illinois.gov", "")
              : null,
        }));

        //TODO: ad hoc mutations for URL capitalization
        publications.forEach((p) => {
          if (p.fileURL && p.fileURL.includes("/Compiler/")) {
            p.fileURL = p.fileURL.replace("/Compiler/", "/compiler/");
          }
        });

        this.publications = _.orderBy(
          publications,
          ["publicationDate"],
          ["desc"]
        );
        NProgress.done();
      },
    },
  },
};
</script>

<style>
tr {
  cursor: pointer !important;
}
</style>

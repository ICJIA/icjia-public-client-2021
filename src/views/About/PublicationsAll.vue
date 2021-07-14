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
              class="text-center"
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
              </template></v-data-table
            >
          </v-card></v-row
        ></v-container
      >
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
      publications: null,
      getPublicationType,
      search: "",
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

<style lang="scss" scoped></style>

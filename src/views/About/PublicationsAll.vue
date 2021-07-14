<template>
  <div class="markdown-body">
    <div>
      <v-container v-if="publications"
        ><v-row
          ><v-card>
            <h1>ICJIA Publications</h1>
            <v-card>
              <v-card-title>
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
                :footer-props="{
                  'items-per-page-options': [50, 100, 150, 200],
                }"
                :items-per-page="100"
              ></v-data-table>
            </v-card> </v-card></v-row
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
import _ from "lodash";
export default {
  name: "Publications",
  data() {
    return {
      publications: null,
      search: "",
      headers: [
        { text: "Publication Date", value: "publicationDate" },
        {
          text: "Title",
          align: "start",
          sortable: false,
          value: "title",
        },
        { text: "Type", value: "pubType" },

        { text: "Article Link", value: "articleURL" },
        { text: "File Link", value: "fileURL" },
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

<template>
  <div>
    <v-container>
      <v-row v-if="initialLoad">
        <v-col cols="12" md="4" v-for="n in 3" :key="n">
          <Loader loaderType="skeleton" :repeat="1"></Loader>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <div class="text-right">
            <v-btn-toggle v-model="orientation" borderless>
              <v-btn value="list" small aria-label="List view">
                <span class="hidden-sm-and-down">List</span>

                <span aria-hidden="true" class="mdi mdi-format-list-bulleted">
                </span>
              </v-btn>

              <v-btn value="grid" small>
                <span class="hidden-sm-and-down" aria-label="Grid view"
                  >Grid</span
                >

                <span class="mdi mdi-view-module" aria-hidden="true"> </span>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>

      <v-row dense v-if="orientation === 'grid'">
        <v-col v-for="(item, index) in content" :key="index" cols="12" md="4">
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="false"
            :cardHeight="525"
          ></HubCard>
        </v-col>
      </v-row>
      <v-row dense v-else>
        <v-col v-for="(item, index) in content" :key="index" cols="12">
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="false"
          ></HubCard>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { GET_ALL_APPS_QUERY } from "@/graphql/hub";
import moment from "moment";
import _ from "lodash";
import nprogress from "nprogress";
export default {
  name: "Apps",
  data() {
    return {
      error: null,
      loading: true,
      content: [],
      initialLoad: true,
      orientation: "grid",
    };
  },

  methods: {
    progress() {
      nprogress.start();
      if (!this.$apollo.loading) {
        nprogress.done();
      }
    },
    toggle(e) {
      this.view = e;
      this.initialView = true;
      // console.log('view: ', this.view)
      this.resize();
      nprogress.done();
    },
  },
  mounted() {
    nprogress.start();
  },
  apollo: {
    apps: {
      prefetch: true,

      query: GET_ALL_APPS_QUERY,
      variables() {
        return {};
      },
      context: {
        uri: "https://researchhub.icjia-api.cloud/graphql",
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        //console.log(ApolloQueryResult.data.articles);
        this.initialLoad = false;
        let content = ApolloQueryResult.data.apps;

        content = content.map((e) => ({
          ...e,
          fullPath: `/researchhub/apps/${e.slug}/`,
          imagePath: `https://icjia.illinois.gov/researchhub/images/${e.id}-image.png`,
          contentType: "app",
          abstract: e.description,
        }));
        this.content = content;
        this.initialLoad = false;
        nprogress.done();
      },
    },
  },
};
</script>

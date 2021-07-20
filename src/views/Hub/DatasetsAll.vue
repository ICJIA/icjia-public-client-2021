<template>
  <div class="mt-2 pb-12 markdown-body">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1>ICJIA Datasets</h1>
        </v-col>
      </v-row>
      <v-row v-if="initialLoad">
        <v-col cols="12" md="4" v-for="n in 3" :key="n">
          <Loader loaderType="skeleton" :repeat="1"></Loader>
        </v-col>
      </v-row>

      <v-row v-if="!initialLoad" style="margin-top: -25px">
        <v-col class="text-left" md="6">
          <div style="font-weight: 900; font-size: 12px">
            Showing: {{ content.length }} of {{ content.length }} datasets
          </div>
        </v-col>
        <v-col cols="12" md="6" class="hidden-sm-and-down">
          <div class="text-right">
            <v-btn-toggle v-model="orientation" borderless>
              <v-btn value="list" small aria-label="List view">
                <span>List</span>

                <span aria-hidden="true" class="mdi mdi-format-list-bulleted">
                </span>
              </v-btn>

              <v-btn value="grid" small>
                <span aria-label="Grid view">Grid</span>

                <span class="mdi mdi-view-module" aria-hidden="true"> </span>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col> </v-col>
      </v-row>

      <v-row dense v-if="orientation === 'grid' && !initialLoad">
        <v-col v-for="(item, index) in content" :key="index" cols="12" md="4">
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="true"
            :showUpdated="true"
          ></HubCard>
        </v-col>
      </v-row>
      <v-row dense v-if="orientation === 'list' && !initialLoad">
        <v-col v-for="(item, index) in content" :key="index" cols="12">
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="true"
            :showUpdated="true"
          ></HubCard>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { GET_ALL_DATASETS_QUERY } from "@/graphql/hub";
import moment from "moment";
import _ from "lodash";
import nprogress from "nprogress";
import { EventBus } from "@/event-bus";
export default {
  name: "Datasets",
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
    datasets: {
      prefetch: true,
      // fetchPolicy: "no-cache",
      query: GET_ALL_DATASETS_QUERY,
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
        let content = ApolloQueryResult.data.datasets;

        content = content.map((e) => ({
          ...e,
          fullPath: `/researchhub/datasets/${e.slug}/`,
          imagePath: null,
          abstract: e.description,
          contentType: "dataset",
        }));
        this.content = content;
        this.initialLoad = false;
        nprogress.done();
        EventBus.$emit("context-label", "Datasets");
      },
    },
  },
};
</script>

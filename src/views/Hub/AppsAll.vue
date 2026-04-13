<template>
  <div class="pt-10 pb-12 markdown-body">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1>Web Applications</h1>
        </v-col>
      </v-row>
      <v-row v-if="loading">
        <v-col cols="12" md="4" v-for="n in 3" :key="n">
          <Loader loaderType="skeleton" :repeat="1"></Loader>
        </v-col>
      </v-row>

      <v-row v-if="!loading">
        <v-col class="text-left" style="margin-top: -35px" cols="12" md="6">
          <div style="font-weight: 900; font-size: 12px">
            Showing: {{ content.length }} of {{ content.length }} web apps
          </div>
        </v-col>
        <v-col
          cols="12"
          md="6"
          style="margin-top: -35px"
          class="hidden-sm-and-down"
        >
          <div class="text-right">
            <v-btn-toggle v-model="orientation">
              <v-btn value="list" small aria-label="List view">
                <span>List</span>

                <span aria-hidden="true" class="mdi mdi-format-list-bulleted">
                </span>
              </v-btn>

              <v-btn value="grid" small aria-label="Grid view">
                <span>Grid</span>

                <span class="mdi mdi-view-module" aria-hidden="true"> </span>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>

      <v-row dense v-if="orientation === 'grid'" style="margin-top: 30px">
        <v-col
          v-for="(item, index) in content"
          :key="index"
          cols="12"
          md="4"
          class="flex-container"
        >
          <HubCard
            :item="item"
            class="flex-item"
            :orientation="orientation"
            :textOnly="false"
            :showUpdated="true"
          ></HubCard>
        </v-col>
      </v-row>
      <v-row dense v-else style="margin-top: 30px">
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
import { GET_ALL_APPS_QUERY } from "@/graphql/hub";
import dayjs from "@/plugins/dayjs";
import _ from "lodash";
import NProgress from "@/services/Progress";
import { EventBus } from "@/event-bus";
export default {
  name: "Apps",
  data() {
    return {
      error: null,
      loading: true,
      content: [],
      initialLoad: true,
      // Bookmarkable view-toggle: ?view=list survives refresh + back/forward.
      orientation: this.$route.query.view === "list" ? "list" : "grid",
    };
  },

  watch: {
    orientation(next) {
      const desired = next === "list" ? "list" : undefined;
      if ((this.$route.query.view || undefined) === desired) return;
      const query = { ...this.$route.query };
      if (desired) query.view = desired;
      else delete query.view;
      this.$router.replace({ path: this.$route.path, query }).catch(() => {});
    },
  },

  methods: {
    progress() {
      NProgress.start();
      if (!this.$apollo.loading) {
        NProgress.done();
      }
    },
    toggle(e) {
      this.view = e;
      this.initialView = true;
      // console.log('view: ', this.view)
      this.resize();
      NProgress.done();
    },
  },
  mounted() {
    NProgress.start();
    EventBus.$emit("context-label", "Web Applications");
  },
  apollo: {
    apps: {
      prefetch: true,
      // fetchPolicy: "no-cache",
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
        this.loading = false;
        NProgress.done();
      },
    },
  },
};
</script>

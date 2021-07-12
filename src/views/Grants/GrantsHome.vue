<template>
  <div class="pb-12">
    <div class="markdown-body">
      <div
        style="background: #31597a; border-bottom: 1px solid #ccc"
        class="pt-6 pb-8"
        v-if="unit"
      >
        <v-container v-if="!unit">
          <v-row>
            <v-col>
              <Loader loaderType="skeleton"></Loader>
            </v-col>
          </v-row>
        </v-container>
        <v-container>
          <v-row>
            <v-col cols="12">
              <h1
                v-html="render(unit.title)"
                style="color: #fff"
                v-if="unit.title"
              ></h1>
              <div
                v-html="render(unit.summary)"
                style="color: #fff"
                v-if="unit.summary"
              ></div>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <v-container class="mt-3" v-if="unit">
        <v-row>
          <v-col cols="12">
            <div v-html="render(unit.body)" v-if="unit.body"></div>
          </v-col>
        </v-row>
      </v-container>
      <div style="" class="mt-3 pt-3">
        <v-container v-if="allPrograms">
          <v-row>
            <v-col cols="12" sm="6">
              <v-btn-toggle v-model="toggle_category">
                <v-btn small> All Programs </v-btn>

                <v-btn small> Federal </v-btn>
                <v-btn small> State </v-btn>
              </v-btn-toggle>
            </v-col>
            <v-col cols="12" sm="6" class="text-right">
              <v-btn-toggle v-model="toggle_status">
                <v-btn small> Current </v-btn>

                <v-btn small> Archived </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
          <v-row class="mt-8">
            <v-col>
              <div
                v-for="program in filteredAndSortedPrograms"
                :key="program.id"
                class="mb-3"
              >
                {{ program }}
              </div></v-col
            >
          </v-row>
        </v-container>
        <v-container v-if="!allPrograms">
          <v-row>
            <v-col>
              <Loader loaderType="skeleton"></Loader>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";

import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import { GET_ALL_PROGRAMS_QUERY } from "@/graphql/grants";
import { renderToHtml } from "@/services/Markdown";
import _ from "lodash";
import NProgress from "nprogress";

export default {
  data() {
    return {
      contentLoading: true,
      content: null,
      unit: null,
      allPrograms: null,
      filteredAndSortedPrograms: [],
      category: "all",
      toggle_category: 0,
      toggle_status: 0,
      status: "current",
    };
  },
  watch: {
    toggle_category(newVal) {
      if (newVal === 0) {
        this.category = "all";
        this.filterPrograms();
      }
      if (newVal === 1) {
        this.category = "federal";
        this.filterPrograms();
      }
      if (newVal === 2) {
        this.category = "state";
        this.filterPrograms();
      }
    },
    toggle_status(newVal) {
      if (newVal === 0) {
        this.status = "current";
        this.filterPrograms();
      }
      if (newVal === 1) {
        this.status = "archived";
        this.filterPrograms();
      }
    },
  },
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    filterPrograms() {
      this.filteredAndSortedPrograms = this.allPrograms.filter((program) => {
        if (this.category === "all") {
          return (this.filteredAndSortedPrograms =
            program.status === this.status);
        } else {
          return (
            program.category === this.category && program.status === this.status
          );
        }
      });
    },
  },
  apollo: {
    units: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "federal-and-state-grants-unit",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.units.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.unit = ApolloQueryResult.data.units[0];
          NProgress.done();
        }
      },
    },
    programs: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_ALL_PROGRAMS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.programs.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.allPrograms = _.orderBy(ApolloQueryResult.data.programs, [
            "title",
          ]);
          this.filterPrograms();
          NProgress.done();
        }
      },
    },
  },
};
</script>

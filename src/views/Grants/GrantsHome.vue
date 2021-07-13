<template>
  <div class="pb-12 markdown-body">
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
    <v-container>
      <v-row>
        <v-col cols="12" md="9">
          <v-container class="mt-3" v-if="unit">
            <v-row>
              <v-col cols="12">
                <div v-html="render(unit.body)" v-if="unit.body"></div>
              </v-col>
            </v-row>
          </v-container>

          <v-container fluid v-if="allGrants && allPrograms">
            <v-row>
              <v-col cols="12"
                ><h2 id="current-funding-opportunities">
                  Current Funding Opportunities
                </h2></v-col
              >

              <v-col
                cols="12"
                :class="{
                  'text-center':
                    $vuetify.breakpoint.sm || $vuetify.breakpoint.xs,
                  'text-right':
                    $vuetify.breakpoint.md ||
                    $vuetify.breakpoint.lg ||
                    $vuetify.breakpoint.xl,
                }"
              >
                <v-btn-toggle v-model="toggle_nofoStatus">
                  <v-btn small> Current </v-btn>

                  <v-btn small> Expired </v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col cols="12">
                <div
                  v-for="grant in filteredAndSortedGrants"
                  :key="grant.id"
                  class="mb-6"
                >
                  <BaseCardExpandable
                    :item="grant"
                    :summaryOnly="true"
                    :openSearch="false"
                    :showLink="false"
                    :showReadMore="true"
                  ></BaseCardExpandable>
                </div>
              </v-col>

              <v-col cols="12">
                <h2 id="current-grant-programs">Current Grant Programs</h2>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                :class="{
                  'text-center':
                    $vuetify.breakpoint.sm || $vuetify.breakpoint.xs,
                  'text-left':
                    $vuetify.breakpoint.md ||
                    $vuetify.breakpoint.lg ||
                    $vuetify.breakpoint.xl,
                }"
              >
                <v-btn-toggle v-model="toggle_category">
                  <v-btn small> All Programs </v-btn>

                  <v-btn small> Federal </v-btn>
                  <v-btn small> State </v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                :class="{
                  'text-center':
                    $vuetify.breakpoint.sm || $vuetify.breakpoint.xs,
                  'text-right':
                    $vuetify.breakpoint.md ||
                    $vuetify.breakpoint.lg ||
                    $vuetify.breakpoint.xl,
                }"
              >
                <v-btn-toggle v-model="toggle_status">
                  <v-btn small> Current </v-btn>

                  <v-btn small> Archived </v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col>
                <div
                  v-for="program in filteredAndSortedPrograms"
                  :key="program.id"
                  class="mb-6"
                >
                  <BaseCardExpandable :item="program"></BaseCardExpandable></div
              ></v-col>
            </v-row>
          </v-container>
          <v-container v-else>
            <v-row>
              <v-col>
                <Loader loaderType="skeleton"></Loader>
              </v-col>
            </v-row>
          </v-container>
        </v-col>
        <v-col cols="12" md="3" class="hidden-sm-and-down mt-5"
          ><Toc v-if="allGrants && allPrograms"></Toc
        ></v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";

import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import {
  GET_ALL_PROGRAMS_QUERY,
  GET_ALL_FUNDING_QUERY,
} from "@/graphql/grants";
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
      allGrants: null,
      filteredAndSortedPrograms: [],
      filteredAndSortedGrants: [],
      category: "all",
      toggle_category: 0,
      toggle_status: 0,
      toggle_nofoStatus: 0,
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
    toggle_nofoStatus(newVal) {
      if (newVal === 0) {
        this.filterGrants("current");
      }
      if (newVal === 1) {
        this.status = "archived";
        this.filterGrants("expired");
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
    filterGrants(status) {
      if (status === "current") {
        this.filteredAndSortedGrants = _.filter(this.allGrants, (grant) => {
          if (new Date(grant.end) > new Date()) {
            return grant;
          }
        });
      }
      if (status === "expired") {
        this.filteredAndSortedGrants = _.filter(this.allGrants, (grant) => {
          if (new Date(grant.end) < new Date()) {
            return grant;
          }
        });
      }
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

      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "federal-and-state-grants-unit",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        NProgress.done();
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

      query: GET_ALL_PROGRAMS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        NProgress.done();
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
          this.allPrograms = this.allPrograms.map((e) => ({
            ...e,
            fullPath: `/grants/programs/${e.slug}/`,
            contentType: "program",
          }));

          this.filterPrograms();
          NProgress.done();
        }
      },
    },
    grants: {
      prefetch: true,

      query: GET_ALL_FUNDING_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.grants.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.allGrants = _.orderBy(
            ApolloQueryResult.data.grants,
            ["end"],
            ["desc"]
          );
          this.allGrants = this.allGrants.map((e) => ({
            ...e,
            fullPath: `/grants/fsgu-funding/${e.slug}/`,
            contentType: "grant",
          }));
          this.filterGrants("current");
          NProgress.done();
        }
      },
    },
  },
};
</script>

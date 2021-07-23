<template>
  <div class="pb-12 markdown-body">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-container fluid v-if="allGrants">
            <v-row>
              <v-col cols="12" class="page-heading"
                ><h1 id="current-funding-opportunities">
                  ICJIA Funding Opportunities
                </h1>
              </v-col>

              <v-col
                cols="12"
                class="page-heading mb-6"
                style="margin-top: -25px"
              >
                <v-btn-toggle v-model="toggle_nofoStatus" mandatory>
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
            </v-row>
          </v-container>
          <v-container v-else>
            <v-row>
              <v-col>
                <Loader></Loader>
              </v-col>
            </v-row>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";
import { EventBus } from "@/event-bus";
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
    EventBus.$emit("context-label", "ICJIA Funding Opportunities");
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
            fullPath: `/grants/funding/${e.slug}/`,
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

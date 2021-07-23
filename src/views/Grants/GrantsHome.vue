<template>
  <div class="pb-12 markdown-body mt-2">
    <template>
      <div>
        <BaseContent :error="error" :loading="$apollo.loading">
          <template slot="content">
            <v-container style="margin-top: -15px">
              <v-row v-if="page">
                <v-col cols="12" :md="page && page.showTOC ? 9 : 12">
                  <h1 v-html="render(page.title)"></h1>
                  <div v-html="render(page.body)"></div>
                  <h2 id="current-funding-opportunities">
                    ICJIA Funding Opportunities
                  </h2>
                  <div class="text-center">
                    <v-btn-toggle
                      mandatory
                      v-model="toggle_nofoStatus"
                      class="mb-10"
                    >
                      <v-btn small> Current </v-btn>

                      <v-btn small> Expired </v-btn>
                    </v-btn-toggle>
                  </div>
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
                  <div>
                    <ClickthroughBoxes
                      :boxes="page.clickthrough"
                      v-if="page.clickthrough"
                    ></ClickthroughBoxes>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  v-if="page && page.showTOC"
                  md="3"
                  class="px-3 hidden-sm-and-down"
                  ><Toc :key="page.title"></Toc>
                  <div
                    v-for="grant in filteredAndSortedGrants"
                    :key="grant.id"
                    class="mb-6"
                  ></div
                ></v-col>
              </v-row>
            </v-container>
          </template>
        </BaseContent>
      </div>
    </template>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { EventBus } from "@/event-bus";
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
      page: null,
      error: null,
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
    EventBus.$emit("context-label", "Home");
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
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "fsgu-home",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.pages.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          this.page = ApolloQueryResult.data.pages[0];
          this.loading = false;
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
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

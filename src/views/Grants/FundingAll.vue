<template>
  <div class="pb-12 markdown-body">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-container fluid v-if="allGrants">
            <v-row>
              <v-col cols="12" class="page-heading" v-if="content"
                ><h1 id="current-funding-opportunities">
                  {{ content.title }}
                </h1>
                <div v-html="render(content.body)"></div>
              </v-col>

              <v-col
                cols="12"
                class="page-heading mb-6"
                style="margin-top: -25px"
              >
                <v-btn-toggle v-model="toggle_nofoStatus" mandatory>
                  <v-btn small elevation="1" class="button-weight">
                    Current
                  </v-btn>

                  <v-btn small elevation="1" class="button-weight">
                    Expired
                  </v-btn>
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
const addOneDayToDate = function (date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom";
import { EventBus } from "@/event-bus";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { GET_ALL_FUNDING_QUERY } from "@/graphql/grants";
import { renderToHtml } from "@/services/Markdown";
import { getUnifiedTags } from "@/utils/content";
import _ from "lodash";
import NProgress from "nprogress";

export default {
  name: "Funding",
  metaInfo() {
    return {
      title: "Funding Opportunities",
    };
  },
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
    content(newVal) {
      if (newVal) {
        console.log("content changed");
        attachInternalLinks(this);
        attachSearchEvents(this);
      } else {
        console.log("content not changed.");
      }
    },
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
          if (new Date(addOneDayToDate(grant.end)) >= new Date()) {
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
          slug: "funding",
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
          let content = ApolloQueryResult.data.pages;
          content = getUnifiedTags(content);
          this.content = content[0];
          this.loading = false;
          EventBus.$emit("context-label", this.content.title);
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
          let allGrants = _.orderBy(
            ApolloQueryResult.data.grants,
            ["end"],
            ["desc"]
          );
          allGrants = allGrants.map((e) => ({
            ...e,
            fullPath: `/grants/funding/${e.slug}/`,
            contentType: "grant",
          }));
          allGrants = getUnifiedTags(allGrants);
          // console.log("all grants: ", allGrants);
          this.allGrants = allGrants;
          this.filterGrants("current");
          // attachInternalLinks(this);
          // attachSearchEvents(this);
          NProgress.done();
        }
      },
    },
  },
};
</script>

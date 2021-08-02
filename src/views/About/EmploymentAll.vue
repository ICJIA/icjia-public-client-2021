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
                  <h2 id="current-icjia-opportunities">
                    Employment Opportunities
                  </h2>
                  <div class="text-left">
                    <v-btn-toggle
                      mandatory
                      v-model="toggle_employmentStatus"
                      class="mb-10"
                    >
                      <v-btn small elevation="1" class="button-weight">
                        Current
                      </v-btn>

                      <v-btn small elevation="1" class="button-weight">
                        Expired
                      </v-btn>
                    </v-btn-toggle>
                  </div>

                  <!-- <div
                    v-for="job in filteredAndSortedEmployment"
                    :key="job.id"
                    class="mb-6"
                  >
                    <BaseCardExpandable
                      :item="job"
                      :summaryOnly="true"
                      :openSearch="false"
                      :showLink="false"
                      :showReadMore="true"
                    ></BaseCardExpandable>
                  </div> -->
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
                  ><Toc :key="page.title" :tocHeading="page.title"></Toc>
                </v-col>
              </v-row>
            </v-container>
          </template>
        </BaseContent>
      </div>
    </template>
  </div>
</template>

<script>
const addOneDayToDate = function (date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";

import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { EventBus } from "@/event-bus";

// eslint-disable-next-line no-unused-vars
import { getUnifiedTags } from "@/utils/content";
import { renderToHtml } from "@/services/Markdown";
import _ from "lodash";
import NProgress from "nprogress";

export default {
  data() {
    return {
      contentLoading: true,
      page: null,
      error: null,
      allEmployment: null,
      filteredAndSortedEmployment: [],
      category: "all",
      toggle_category: 0,
      toggle_employmentStatus: 0,
      status: "current",
    };
  },
  watch: {
    toggle_status(newVal) {
      if (newVal === 0) {
        this.status = "current";
        this.filterEmployment();
      }
      if (newVal === 1) {
        this.status = "archived";
        this.filterEmployment();
      }
    },
  },
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
    EventBus.$emit("context-label", "Employment");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    filterEmployment(status) {
      if (status === "current") {
        this.filteredAndSortedEmployment = _.filter(
          this.allEmployment,
          (job) => {
            if (new Date(addOneDayToDate(job.end)) > new Date()) {
              return job;
            }
          }
        );
      }
      if (status === "expired") {
        this.filteredAndSortedEmployment = _.filter(
          this.allEmployment,
          (job) => {
            if (new Date(addOneDayToDate(job.end)) < new Date()) {
              return job;
            }
          }
        );
      }
    },
  },
  apollo: {
    pages: {
      prefetch: true,
      // fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "employment",
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
  },
};
</script>

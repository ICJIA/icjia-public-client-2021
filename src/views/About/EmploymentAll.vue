<template>
  <div class="pb-12 markdown-body mt-2">
    <template>
      <div>
        <BaseContent :error="error" :loading="$apollo.loading">
          <template slot="content">
            <v-container style="margin-top: -15px">
              <v-row v-if="page">
                <v-col cols="12" :md="page && page.showTOC ? 8 : 12">
                  <h1 v-html="render(page.title)"></h1>
                  <div v-html="render(page.body)"></div>
                  <h2 id="current-icjia-opportunities">
                    Employment Opportunities
                  </h2>
                  <div class="text-left">
                    <v-btn-toggle
                      mandatory
                      v-model="toggle_jobStatus"
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
                  <div v-if="filteredAndSortedJobs.length">
                    <div
                      v-for="job in filteredAndSortedJobs"
                      :key="job.id"
                      class="mb-6"
                    >
                      <JobCard
                        :item="job"
                        :summaryOnly="true"
                        :openSearch="false"
                        :showLink="true"
                        :showReadMore="true"
                      ></JobCard>
                    </div>
                  </div>
                  <div v-else class="text-center">
                    <strong v-if="toggle_jobStatus === 0"
                      >There are no current employment opportunities.</strong
                    >
                    <strong v-else
                      >There are no expired employment opportunities.</strong
                    ><br /><br />
                    <p>
                      Please check back soon or subscribe to the
                      <a
                        target="_blank"
                        href="https://visitor.r20.constantcontact.com/manage/optin?v=001MqUcqqvjwLCJXlLMSWbTe3zHHmEQgFeBuHvBcJWTbwgrxFbDSGx4HSUPpI6DJWMUPgbljtLxffqIcGFTgCnr-auak88ybvRxpoJlTMGPtZs%3D"
                        >CJ Dispatch</a
                      >
                      for the latest ICJIA news and information.
                    </p>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  v-if="page && page.showTOC"
                  md="4"
                  class="px-3 hidden-sm-and-down"
                  ><Toc :key="page.title" :tocHeading="page.title"></Toc>
                </v-col>
              </v-row>
            </v-container>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <ClickthroughBoxes
                    :boxes="page.clickthrough"
                    v-if="page && page.clickthrough"
                  ></ClickthroughBoxes>
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
import { GET_ALL_JOBS_QUERY } from "@/graphql/employment";
// eslint-disable-next-line no-unused-vars
import { getUnifiedTags } from "@/utils/content";
import { renderToHtml } from "@/services/Markdown";
import _ from "lodash";
import NProgress from "nprogress";

export default {
  name: "Employment",
  metaInfo() {
    return {
      title: "Employment",
    };
  },
  data() {
    return {
      contentLoading: true,
      page: null,
      error: null,
      allJobs: null,
      filteredAndSortedJobs: [],
      category: "all",
      toggle_category: 0,
      toggle_jobStatus: 0,
      status: "current",
    };
  },
  watch: {
    toggle_jobStatus(newVal) {
      if (newVal === 0) {
        this.status = "current";
        this.filterJobs(this.status);
      }
      if (newVal === 1) {
        this.status = "expired";
        this.filterJobs(this.status);
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
    filterJobs(status) {
      if (status === "current") {
        console.log("filter current");
        this.filteredAndSortedJobs = _.filter(this.allJobs, (job) => {
          if (new Date(addOneDayToDate(job.end)) > new Date()) {
            return job;
          }
        });
      }
      if (status === "expired") {
        console.log("filter expired");
        this.filteredAndSortedJobs = _.filter(this.allJobs, (job) => {
          if (new Date(addOneDayToDate(job.end)) < new Date()) {
            return job;
          }
        });
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

          attachInternalLinks(this);
          attachSearchEvents(this);
          EventBus.$emit("context-label", this.page.title);
          NProgress.done();
        }
      },
    },

    jobs: {
      prefetch: true,
      // fetchPolicy: "no-cache",
      query: GET_ALL_JOBS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log(this.id);
        let allJobs = ApolloQueryResult.data.jobs;
        this.allJobs = allJobs.map((u) => ({
          ...u,
          fullPath: `/about/employment/${u.slug}/`,
          contentType: "employment",
          show: false,
        }));
        this.allJobs = getUnifiedTags(this.allJobs);
        this.loading = false;
        NProgress.done();
        this.status = "current";
        this.filterJobs(this.status);
        attachInternalLinks(this);
        attachSearchEvents(this);
      },
    },
  },
};
</script>

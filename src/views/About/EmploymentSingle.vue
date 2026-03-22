<template>
  <div class="pb-12 markdown-body mt-10">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container style="margin-top: -15px">
          <v-row v-if="job">
            <v-col cols="12">
              <h1 class="sr-only">{{ job.title }}</h1>
              <JobCard
                :item="job"
                :summaryOnly="false"
                :openSearch="true"
                :showLink="false"
                :showReadMore="false"
                :isClickable="false"
              ></JobCard>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";

import { EventBus } from "@/event-bus";
import { GET_SINGLE_JOB_QUERY } from "@/graphql/employment";
// eslint-disable-next-line no-unused-vars
import { getUnifiedTags } from "@/utils/content";
import { renderToHtml } from "@/services/Markdown";
// import _ from "lodash";
import NProgress from "nprogress";

export default {
  name: "EmploymentSingle",
  metaInfo() {
    return {
      title: this.job && this.job.title ? this.job.title : null,
    };
  },
  data() {
    return {
      contentLoading: true,
      page: null,
      error: null,
      job: null,
    };
  },
  watch: {},
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
    EventBus.$emit("context-label", "Employment at ICJIA");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    jobs: {
      prefetch: true,
      // fetchPolicy: "no-cache",
      query: GET_SINGLE_JOB_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
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
          ApolloQueryResult.data.jobs.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          let jobs = ApolloQueryResult.data.jobs;
          jobs = jobs.map((u) => ({
            ...u,
            fullPath: `/about/employment/${u.slug}/`,
            contentType: "employment",
            show: false,
          }));
          let job = getUnifiedTags(jobs);
          this.job = job[0];
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

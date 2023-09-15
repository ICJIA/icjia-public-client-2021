<template>
  <div class="mt-10 mb-12">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container style="margin-top: -25px">
          <v-row>
            <v-col cols="12">
              <div class="markdown-body mb-2 page-heading">
                <h1>Rules, Regulations, and Policies</h1>
              </div>
            </v-col>

            <v-col>
              <div class="mb-10 pl-5">
                <v-btn-toggle v-model="viewToggle" mandatory>
                  <v-btn
                    value="category"
                    elevation="1"
                    small
                    aria-label="By category"
                  >
                    <span class="button-weight" aria-label="By category"
                      >By category</span
                    >

                    <span
                      aria-hidden="true"
                      class="mdi mdi-format-list-bulleted"
                    >
                    </span>
                  </v-btn>
                  <v-btn value="date" small elevation="1">
                    <span class="button-weight" aria-label="By date"
                      >By date</span
                    >

                    <span class="mdi mdi-calendar" aria-hidden="true"> </span>
                  </v-btn>
                </v-btn-toggle></div
            ></v-col>
          </v-row>
        </v-container>

        <v-container style="margin-top: 0px" v-if="viewToggle === 'category'">
          <v-row>
            <v-col cols="12" md="8">
              <div
                v-for="(category, index) in categoryMap"
                :key="index"
                class="mb-10 px-5"
              >
                <PolicyTable
                  v-if="policies"
                  :items="filterByCategory(category.category)"
                  :heading="category.label"
                  :text="null"
                  class="elevation-1"
                ></PolicyTable>
              </div>
            </v-col>
            <v-col
              cols="12"
              v-if="policies"
              md="4"
              class="px-12 hidden-sm-and-down"
            >
              <TocPolicies
                :key="viewToggle"
                tocHeading="Navigation"
              ></TocPolicies>
            </v-col>
          </v-row>
        </v-container>
        <v-container v-if="viewToggle == 'date'" style="margin-top: -25px">
          <v-row>
            <v-col cols="12" md="12">
              <PolicyTable
                :items="policies"
                v-if="policies"
                :showByDate="true"
              ></PolicyTable>
            </v-col>
          </v-row>
        </v-container>

        <!-- {{ policies }}<br /> -->

        <!-- {{ categoryMap }} -->
      </template>
    </BaseContent>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";

import { GET_ALL_POLICIES_QUERY } from "@/graphql/policies";
import { getUnifiedTags } from "@/utils/content";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      viewToggle: "category",
      loading: true,
      error: null,
      content: null,
      policies: null,
      categoryMap: this.$myApp.config.maps.policies,
    };
  },

  created() {
    NProgress.start();
  },
  mounted() {
    EventBus.$emit("context-label", "Policies");
  },
  methods: {
    filterByCategory(category) {
      let filteredContent = this.policies.filter((policy) => {
        if (policy.category === category) {
          return policy;
        }
      });

      return filteredContent;
    },
  },
  apollo: {
    policies: {
      prefetch: true,

      query: GET_ALL_POLICIES_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log(ApolloQueryResult);
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.policies.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          let policies = ApolloQueryResult.data.policies;
          console.log("policies fetch here");
          policies = getUnifiedTags(policies);
          this.policies = _.orderBy(policies, ["title"], ["asc"]);
          // this.policies = policies;
          NProgress.done();
          // attachInternalLinks(this);
          // attachSearchEvents(this);
          this.loading = false;
        }
      },
    },
  },
};
</script>

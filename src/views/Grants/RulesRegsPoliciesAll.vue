<template>
  <div class="mt-10 mb-12">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container style="margin-top: -25px">
          <v-row>
            <v-col cols="12">
              <div class="markdown-body mb-12 page-heading">
                <h1>Rules, Regulations, and Policies</h1>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-container
          ><v-row
            ><v-col>
              <h2
                style="
                  background: #0d4474;
                  width: 100%;
                  display: block;
                  color: #fff;
                  font-weight: 900;
                  font-size: 26px;
                  margin: 0;
                "
                class="px-2 py-2"
              >
                Rules
              </h2>
              <v-simple-table class="markdown-body">
                <template v-slot:default>
                  <tbody>
                    <tr v-for="item in rules" :key="item.title">
                      <td style="font-size: 13px">
                        <a :href="item.citationURL" target="_blank">{{
                          item.title
                        }}</a>
                      </td>
                      <td>{{ item.citation }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col></v-row
          ></v-container
        >

        <v-container
          ><v-row
            ><v-col>
              <h2
                style="
                  background: #0d4474;
                  width: 100%;
                  display: block;
                  color: #fff;
                  font-weight: 900;
                  font-size: 26px;
                  margin: 0;
                "
                class="px-2 py-2"
              >
                Regulations
              </h2>
              <v-simple-table class="markdown-body">
                <template v-slot:default>
                  <tbody>
                    <tr v-for="item in regulations" :key="item.title">
                      <td style="font-size: 14px">
                        <a :href="item.url" target="_blank">
                          {{ item.title }}</a
                        >
                      </td>
                      <td style="font-size: 14px" class="text-left">
                        <a :href="item.url" target="_blank"> {{ item.url }}</a>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table></v-col
            ></v-row
          ></v-container
        >

        <v-container
          ><v-row
            ><v-col>
              <h2
                style="
                  background: #0d4474;
                  width: 100%;
                  display: block;
                  color: #fff;
                  font-weight: 900;
                  font-size: 26px;
                  margin: 0;
                "
                class="px-2 py-2"
              >
                Policies
              </h2>
              <v-simple-table class="markdown-body">
                <template v-slot:default>
                  <tbody>
                    <tr v-for="item in policies" :key="item.title">
                      <td style="font-size: 14px">
                        <a
                          :href="
                            `https://agency.icjia-api.cloud` +
                            item.attachments[0].url
                          "
                          target="_blank"
                        >
                          {{ item.title }} {{
                        }}</a>
                      </td>
                      <td style="font-size: 14px" class="text-center">
                        <a
                          :href="fileUrl(item.attachments[0])"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="download-link-btn"
                          :aria-label="`Download ${item.title} (opens in new tab)`"
                          @click="trackDownload(item.attachments[0])"
                        >
                          Download
                          <v-icon right color="blue" small
                            >mdi mdi-download-circle-outline</v-icon
                          >
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table></v-col
            ></v-row
          >
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "@/services/Progress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";

import { GET_ALL_RULES_QUERY } from "@/graphql/rules";
import { GET_ALL_POLICIES_QUERY } from "@/graphql/policies";
import { GET_ALL_REGULATIONS_QUERY } from "@/graphql/regulations";
import { getUnifiedTags } from "@/utils/content";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      viewToggle: "all",
      loading: true,
      error: null,
      content: null,
      rules: null,
      policies: null,
      regulations: null,
    };
  },

  created() {
    NProgress.start();
  },
  mounted() {
    EventBus.$emit("context-label", "Rules");
  },
  methods: {
    fileUrl(attachment) {
      return attachment && attachment.url
        ? "https://agency.icjia-api.cloud" + attachment.url
        : "#";
    },
    trackDownload(attachment) {
      // Native <a href> drives the download; this only logs analytics.
      try {
        if (typeof window.plausible === "function") {
          const url = this.fileUrl(attachment);
          window.plausible("file_download", { props: { url } });
          window.plausible("Outbound Link: Click", { props: { url } });
        }
      } catch (_e) { /* ignore — never block downloads */ }
    },
  },
  apollo: {
    rules: {
      prefetch: true,

      query: GET_ALL_RULES_QUERY,
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
          ApolloQueryResult.data.rules.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          let rules = ApolloQueryResult.data.rules;
          console.log("rules fetch here");
          rules = getUnifiedTags(rules);
          this.rules = _.orderBy(rules, ["title"], ["asc"]);
          // this.rules = rules;
          NProgress.done();
          // attachInternalLinks(this);
          // attachSearchEvents(this);
          this.loading = false;
        }
      },
    },
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
          console.log("rulpolicieses fetch here");
          policies = getUnifiedTags(policies);
          this.policies = _.orderBy(policies, ["title"], ["asc"]);
          // this.rules = rules;
          NProgress.done();
          // attachInternalLinks(this);
          // attachSearchEvents(this);
          this.loading = false;
        }
      },
    },

    regulations: {
      prefetch: true,

      query: GET_ALL_REGULATIONS_QUERY,
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
          ApolloQueryResult.data.regulations.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          let regulations = ApolloQueryResult.data.regulations;
          console.log("regulations fetch here");
          regulations = getUnifiedTags(regulations);
          this.regulations = _.orderBy(regulations, ["title"], ["asc"]);
          // this.rules = rules;
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

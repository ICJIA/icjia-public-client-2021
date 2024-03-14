<template>
  <div class="mt-10 mb-12">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <!-- <v-container style="margin-top: -25px">
          <v-row>
            <v-col cols="12">
              <div class="markdown-body mb-12 page-heading">
                <h1>Rules, Regulations, and Policies</h1>
              </div>
            </v-col>
          </v-row>
        </v-container> -->
        <v-container
          ><v-row
            ><v-col>
              <v-sheet
                style="
                  background: #0d4474;
                  width: 100%;
                  display: block;
                  color: #fff;
                  font-weight: 900;
                  font-size: 26px;
                "
                class="px-2 py-2"
                >Rules</v-sheet
              >
              <v-simple-table class="markdown-body">
                <template v-slot:default>
                  <!-- <thead>
                    <tr>
                      <th class="text-left">Rule</th>
                      <th class="text-left">Citation</th>
                    </tr>
                  </thead> -->
                  <tbody>
                    <tr v-for="item in rules" :key="item.title">
                      <td>
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
      </template>
    </BaseContent>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";

import { GET_ALL_RULES_QUERY } from "@/graphql/rules";
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
    };
  },

  created() {
    NProgress.start();
  },
  mounted() {
    EventBus.$emit("context-label", "Rules");
  },
  methods: {},
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
  },
};
</script>

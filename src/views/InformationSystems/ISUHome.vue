<template>
  <div class="pb-12 markdown-body mt-5">
    <template>
      <div>
        <BaseContent :error="error" :loading="$apollo.loading">
          <template slot="content">
            <v-container style="margin-top: -15px">
              <v-row v-if="page">
                <v-col cols="12" :md="page && page.showTOC ? 9 : 12">
                  <h1 v-html="render(page.title)"></h1>
                  <div v-html="render(page.body)"></div>
                </v-col>
                <v-col
                  cols="12"
                  v-if="page && page.showTOC"
                  md="3"
                  class="px-3 hidden-sm-and-down"
                  ><Toc :key="page.title"></Toc>
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
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { EventBus } from "@/event-bus";

import { renderToHtml } from "@/services/Markdown";
// import _ from "lodash";
import NProgress from "nprogress";

export default {
  data() {
    return {
      contentLoading: true,
      page: null,
      error: null,
    };
  },
  watch: {},
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "information-systems-home",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
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

            NProgress.done();
          });
        } else {
          //console.log(this.id);
          this.page = ApolloQueryResult.data.pages[0];

          attachInternalLinks(this);
          attachSearchEvents(this);
          EventBus.$emit("context-label", "Home");
          NProgress.done();
        }
      },
    },
  },
};
</script>

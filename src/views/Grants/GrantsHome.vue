<template>
  <div class="pb-12">
    <div class="markdown-body" v-if="unit">
      <div
        style="background: #31597a; border-bottom: 1px solid #ccc"
        class="pt-6 pb-8"
      >
        <v-container>
          <v-row>
            <v-col cols="12">
              <h1
                v-html="render(unit.title)"
                style="color: #fff"
                v-if="unit.title"
              ></h1>
              <div
                v-html="render(unit.summary)"
                style="color: #fff"
                v-if="unit.summary"
              ></div>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <v-container class="mt-3">
        <v-row>
          <v-col cols="12">
            <div v-html="render(unit.body)" v-if="unit.body"></div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div v-else>
      <v-container>
        <v-row>
          <v-col>
            <Loader loaderType="skeleton"></Loader>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";

import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import { renderToHtml } from "@/services/Markdown";
import NProgress from "nprogress";

export default {
  data() {
    return {
      contentLoading: true,
      content: null,
      unit: null,
    };
  },
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
    units: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "federal-and-state-grants-unit",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
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
  },
};
</script>

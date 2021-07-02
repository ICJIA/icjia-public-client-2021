<template>
  <div class="pb-12">
    <div class="markdown-body">
      <div
        style="background: #31597a; border-bottom: 1px solid #ccc"
        class="pt-6 pb-8"
        v-if="content"
        data-aos="fade-in"
      >
        <v-container>
          <v-row>
            <v-col cols="12" v-if="unit">
              <h1 v-html="render(unit.title)" style="color: #fff"></h1>
              <div v-html="render(unit.summary)" style="color: #fff"></div>
            </v-col>
            <v-col v-else cols="12">
              <Loader
                loaderType="skeleton"
                :repeat="1"
                loaderDisplayType="article"
              ></Loader>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <v-container class="mt-3" v-if="content">
        <v-row>
          <v-col cols="12">
            <div v-html="render(content.body)" v-if="content.body"></div>
          </v-col>
        </v-row>
      </v-container>
      <v-contaner v-else>
        <Loader
          loaderType="skeleton"
          :repeat="1"
          loaderDisplayType="article"
        ></Loader>
      </v-contaner>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
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
        this.contentLoading = false;
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
          });
        } else {
          //console.log(this.id);
          this.content = ApolloQueryResult.data.pages[0];
          this.contentLoading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>

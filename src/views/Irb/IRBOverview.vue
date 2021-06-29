<template>
  <div class="pb-12">
    <div class="markdown-body" v-if="!contentLoading">
      <div
        style="background: #31597a; border-bottom: 1px solid #ccc"
        class="pt-6 pb-8"
        v-if="content"
        data-aos="fade-in"
      >
        <v-container>
          <v-row>
            <v-col cols="12">
              <h1 v-html="render(content.title)" style="color: #fff"></h1>
              <div v-html="render(content.summary)" style="color: #fff"></div>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <v-container v-if="content" class="mt-3">
        <v-row>
          <v-col cols="12">
            <div v-html="render(content.body)"></div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div v-else>
      <Loader></Loader>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { renderToHtml } from "@/services/Markdown";
import NProgress from "nprogress";

export default {
  data() {
    return {
      content: null,
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
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "irb-overview",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
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

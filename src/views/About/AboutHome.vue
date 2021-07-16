<template>
  <div class="markdown-body">
    <div
      style="background: #31597a; border-bottom: 1px solid #ccc"
      class="pt-6 pb-8"
      v-if="content"
    >
      <v-container v-if="loading">
        <v-row>
          <v-col>
            <Loader loaderType="skeleton"></Loader>
          </v-col>
        </v-row>
      </v-container>
      <v-container>
        <v-row>
          <v-col cols="12">
            <h1
              v-html="render(content.title)"
              style="color: #fff"
              v-if="content.title"
            ></h1>
            <div
              v-html="render(content.summary)"
              style="color: #fff"
              v-if="content.summary"
            ></div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-container class="mt-8">
          <v-row v-if="content">
            <v-col cols="12" :md="content && content.showTOC ? 9 : 12">
              <div v-html="render(content.body)"></div>
            </v-col>
            <v-col
              cols="12"
              v-if="content && content.showTOC"
              md="3"
              class="px-3 hidden-sm-and-down"
              ><Toc :key="content.title"></Toc
            ></v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  data() {
    return {
      loading: true,
      error: null,
      content: null,
    };
  },
  created() {
    NProgress.start();
  },

  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  mounted() {},
  apollo: {
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "about-the-authority",
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
          this.content = ApolloQueryResult.data.pages[0];
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

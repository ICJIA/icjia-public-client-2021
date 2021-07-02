<template>
  <div>
    <v-container v-if="$apollo.loading">
      <v-row>
        <v-col>
          <Loader loaderType="skeleton"></Loader>
        </v-col>
      </v-row>
    </v-container>
    <v-container class="pt-10 pb-12 markdown-body" v-if="pageContent">
      <v-row>
        <v-col>
          <h1>{{ pageContent.title }}</h1>
        </v-col>
      </v-row>
    </v-container>
    <v-container style="margin-top: -25px" v-if="pageContent">
      <v-row>
        <v-col
          cols="12"
          :md="pageContent.showTOC ? 9 : 12"
          class="markdown-body"
          style="margin-top: -40px"
        >
          <div v-html="render(pageContent.body)"></div>
          <div class="markdown-body" v-for="(item, i) in listing" :key="i">
            <BiographyCard :item="item"></BiographyCard>
          </div>
        </v-col>
        <v-col cols="12" md="3" v-if="pageContent.showTOC"
          ><Toc :key="pageContent.title"></Toc
        ></v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_ALL_BIOGRAPHIES_QUERY } from "@/graphql/biographies";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      loading: true,
      error: null,
      content: null,
      pageContent: null,
      listing: null,
      tab: 0,
    };
  },

  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    search(name) {
      let opts = {
        query: name,
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
  },
  apollo: {
    pages: {
      prefetch: true,

      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "icjia-board",
        };
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
          this.pageContent = ApolloQueryResult.data.pages[0];
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
    biographies: {
      prefetch: true,
      //   fetchPolicy: "no-cache",
      query: GET_ALL_BIOGRAPHIES_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.biographies.length > 0 === false
        ) {
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
          console.log(ApolloQueryResult);
        } else {
          this.content = ApolloQueryResult.data.biographies;

          this.content = _.orderBy(this.content, ["sortModifier"], ["asc"]);
          this.listing = this.content.filter((item) => {
            if (item.affiliation === "board") {
              return item;
            }
          });

          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>
<style>
a.unit {
  font-weight: bold;
}
</style>

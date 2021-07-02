<template>
  <div v-if="pageContent">
    <v-container class="pt-10 pb-12 markdown-body">
      <v-row>
        <v-col>
          <h1>{{ pageContent.title }}</h1>
        </v-col>
      </v-row>
    </v-container>
    <v-container style="margin-top: -25px">
      <v-row>
        <v-col cols="12" class="markdown-body" style="margin-top: -40px">
          <div v-html="render(pageContent.body)"></div>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="" style="margin-top: -20px" v-if="content">
      <v-row>
        <v-col cols="12" class="markdown-body">
          <v-card
            elevation="0"
            class="mb-2 py-2 px-2"
            style="border-bottom: 1px solid #eee"
            v-for="(item, i) in listing"
            :key="i"
          >
            <div class="d-flex flex-no-wrap">
              <v-avatar
                class="ma-3 hidden-sm-and-down"
                size="125"
                tile
                v-if="item.headshot && item.headshot.url"
              >
                <v-img
                  :src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
                  :lazy-src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
                ></v-img>
              </v-avatar>
              <div>
                <v-card-title
                  class="text-h5 author-name hover"
                  @click="search(item.fullName)"
                  >{{ item.fullName }}<span v-if="item.suffix">,&nbsp;</span
                  >{{ item.suffix }}</v-card-title
                >

                <v-card-subtitle>
                  <span>{{ item.title }}</span>
                </v-card-subtitle>
                <v-card-text class="text-left" v-html="item.body"></v-card-text>
              </div>
            </div>
          </v-card>
        </v-col>
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
      items: ["Board Members", "ICJIA Staff"],
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

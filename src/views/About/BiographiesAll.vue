<template>
  <div>
    <v-container class="pt-10 pb-12 markdown-body">
      <v-row>
        <v-col>
          <h1>Authority Members & Staff</h1>
        </v-col>
      </v-row>
    </v-container>
    <v-container style="margin-top: -25px">
      <v-row>
        <v-col
          cols="12"
          class="markdown-body"
          style="margin-top: -40px"
          v-if="pageContent"
        >
          <div v-html="render(pageContent.body)"></div>
        </v-col>
        <v-col v-else>
          <Loader></Loader>
        </v-col>
      </v-row>
    </v-container>
    <v-container class="mt-12">
      <v-row>
        <v-col cols="12" class="markdown-body" style="margin-top: -40px">
          <div v-if="!content">
            <Loader loaderType="skeleton"></Loader>
          </div>
          <v-tabs
            v-model="tab"
            background-color="transparent"
            grow
            v-if="content"
          >
            <v-tab
              v-for="item in items"
              :key="item"
              class="px-3"
              style="font-weight: 900; font-size: 20px"
            >
              {{ item }}
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item v-if="listing">
              <v-col v-for="(item, i) in listing" :key="i" cols="12">
                <v-card
                  elevation="0"
                  class="mb-2 py-2 px-2"
                  style="border-bottom: 1px solid #eee"
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
                        >{{ item.fullName
                        }}<span v-if="item.suffix">,&nbsp;</span
                        >{{ item.suffix }}</v-card-title
                      >

                      <v-card-subtitle>
                        <span>{{ item.title }}</span>
                      </v-card-subtitle>
                      <v-card-text
                        class="text-left"
                        v-html="item.body"
                      ></v-card-text>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-tab-item>
            <v-tab-item v-else
              ><Loader
                loaderType="skeleton"
                loaderDisplayType="card"
                :repeat="5"
              ></Loader
            ></v-tab-item>
            <v-tab-item v-if="listing">
              <v-col v-for="(item, i) in listing" :key="i" cols="12">
                <v-card
                  elevation="0"
                  class="mb-2 py-2 px-2"
                  style="border-bottom: 1px solid #eee"
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
                        >{{ item.fullName
                        }}<span v-if="item.suffix">,&nbsp;</span
                        >{{ item.suffix }}</v-card-title
                      >

                      <v-card-subtitle
                        v-if="
                          item.unit &&
                          item.unit.url &&
                          item.unit.url.length &&
                          item.unit.title
                        "
                      >
                        <router-link :to="item.unit.url" class="unit">
                          {{ item.unit.title }}
                        </router-link>
                        | <span>{{ item.title }}</span>
                      </v-card-subtitle>
                      <v-card-subtitle
                        v-else-if="item.unit && item.unit.title && !item.url"
                      >
                        <span> {{ item.unit.title }} </span>
                      </v-card-subtitle>

                      <v-card-text
                        class="text-left"
                        v-html="item.body"
                      ></v-card-text>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-tab-item>
            <v-tab-item v-else
              ><Loader loaderType="skeleton"></Loader
            ></v-tab-item>
          </v-tabs-items>
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
  watch: {
    tab(newValue, oldValue) {
      if (newValue === 1) {
        this.listing = this.content.filter((item) => {
          if (item.affiliation === "staff") {
            return item;
          }
        });
      }

      if (newValue === 0) {
        this.listing = this.content.filter((item) => {
          if (item.affiliation === "board") {
            return item;
          }
        });
      }
    },
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
          slug: "icjia-members-and-staff",
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

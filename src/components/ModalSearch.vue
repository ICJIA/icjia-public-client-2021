<template>
  <v-dialog v-model="searchModal" ref="searchTop" style="z-index: 999999">
    <v-card color="#eee" min-height="600" class="px-3 py-1">
      <v-card-title class="text-h5 grey lighten-2">
        Search ICJIA<v-spacer></v-spacer
        ><v-btn small @click="searchModal = false">Close</v-btn>
      </v-card-title>

      <div class="">
        <div style="font-size: 12px" class="mb-9 d-flex">
          <v-spacer></v-spacer>
          <span style="font-weight: 900" v-if="query && query.length">
            Displaying {{ queryResults.length }} result{{ resultNumber }}</span
          >

          <!-- <v-btn-toggle v-model="searchFilter" mandatory>
            <v-btn x-small>Grants Only</v-btn>
            <v-btn x-small>ResearchHub Only</v-btn>
            <v-btn x-small>All ICJIA</v-btn>
          </v-btn-toggle> -->
        </div>
        <v-form class="pl-2" style="margin-top: -15px">
          <v-text-field
            ref="textfield"
            clearable
            v-model="query"
            label="Search"
            placeholder="Search"
            @input="instantSearch"
            style="font-weight: 900"
          />

          <div v-if="query && query.length" class="mb-12">
            <div
              v-for="(result, index) in queryResults"
              :key="index"
              class="my-4"
            >
              <v-card
                elevation="0"
                color="#fff"
                @click="route(result.item.fullPath)"
                class="hover px-2 py-3 mb-2 card"
              >
                <div
                  style="font-size: 12px"
                  v-if="result.item && result.item.date"
                >
                  <span
                    v-if="
                      result.item.category && result.item.contentType !== 'news'
                    "
                    style="font-weight: 700"
                    >{{ result.item.category.toUpperCase() }}</span
                  >&nbsp;<span style="font-weight: 700">{{
                    result.item.contentType.toUpperCase()
                  }}</span>
                  | {{ result.item.date | format }}
                </div>
                <div
                  style="font-size: 12px"
                  v-else-if="result.item && result.item.start"
                >
                  <span
                    v-if="
                      result.item.category && result.item.contentType !== 'news'
                    "
                    style="font-weight: 700"
                    >{{ result.item.category.toUpperCase() }}</span
                  >&nbsp;<span
                    style="font-weight: 700"
                    v-if="result.item.contentType !== 'funding'"
                    >{{ result.item.contentType.toUpperCase() }}</span
                  >
                  | {{ result.item.start | format }} to
                  {{ result.item.end | format }}
                </div>
                <div
                  style="font-size: 12px"
                  v-else-if="result.item && result.item.category"
                >
                  <span
                    v-if="
                      result.item.category && result.item.contentType !== 'news'
                    "
                    style="font-weight: 700"
                    >{{ result.item.category.toUpperCase() }}</span
                  >&nbsp;
                  <span
                    style="font-weight: 700; margin-left: -5px"
                    v-if="result.item.displayCategory"
                    >{{
                      getProperCategory(
                        $myApp.config.maps.news,
                        result.item.displayCategory
                      ).toUpperCase()
                    }}</span
                  >
                  <span style="font-weight: 700" v-else>{{
                    result.item.contentType.toUpperCase()
                  }}</span>
                </div>
                <div style="font-size: 12px" v-else>
                  <span v-if="result.item.category" style="font-weight: 700">{{
                    result.item.category.toUpperCase()
                  }}</span
                  >&nbsp;<span style="font-weight: 700">{{
                    result.item.contentType.toUpperCase()
                  }}</span>
                </div>

                <div v-if="result.item.title" class="mt-2">
                  <span
                    style="font-size: 16px; font-weight: bold"
                    class=""
                    v-html="result.item.title"
                  ></span>

                  <div v-if="result.item.position">
                    <span
                      style="font-size: 14px"
                      class=""
                      v-html="result.item.position"
                    ></span>
                  </div>

                  <div v-if="result.item.authors">
                    <span
                      style="font-size: 14px"
                      v-for="(author, index) in result.item.authors"
                      :key="index"
                    >
                      <span
                        @click.stop.prevent="updateQuery(author.title)"
                        class="author"
                        >{{ author.title }}</span
                      >
                      <span v-if="index < result.item.authors.length - 2"
                        >,
                      </span>
                      <span v-if="index === result.item.authors.length - 2">
                        and
                      </span>
                    </span>
                  </div>
                </div>
                <v-card-text
                  v-if="result.item.abstract"
                  v-html="result.item.abstract"
                ></v-card-text>
                <v-card-text
                  v-else-if="result.item.summary"
                  v-html="result.item.summary"
                ></v-card-text>
                <v-card-text v-else>No summary available.</v-card-text>

                <template v-if="result.item.tags">
                  <BasePropChip
                    v-for="(tag, index) of result.item.tags"
                    :key="index"
                    class="mt-1"
                  >
                    <template>{{ tag }}</template>
                  </BasePropChip>
                </template>
              </v-card>
            </div>
          </div>
        </v-form>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
/* eslint-disable no-unused-vars */
import DOMPurify from "dompurify";
import Fuse from "fuse.js";
import _ from "lodash";
// import searchIndex from "@/config/searchIndex.json";
function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
export default {
  data() {
    return {
      searchFilter: null,
      searchModal: false,
      opts: null,
      query: null,
      queryResults: [],
      content: "",
      fuse: this.$myApp.fuse,
      resultNumber: "s",
      arrayToList,
      getProperCategory,
    };
  },
  created() {
    // this.fuse = new Fuse(
    //   this.$myApp.searchIndex,
    //   this.$myApp.config.search.site
    // );
  },
  mounted() {
    EventBus.$on("closeSearch", () => {
      this.searchModal = false;
    });
    EventBus.$on("search", (opts) => {
      //console.log("fire search: ", opts);
      this.opts = opts;
      if (this.opts && this.opts.query && this.opts.query.length) {
        this.query = this.opts.query;
        this.instantSearch();
      } else {
        this.query = "";
      }
      this.searchModal = true;
      this.$nextTick(() => {
        let el = document.getElementsByClassName("v-dialog--active");
        if (el && el.length) {
          el[0].scrollTop = 0;
        }
      });
    });
    this.$nextTick(() => {
      console.log(this.$refs);
    });
  },
  methods: {
    focusInput() {
      this.$refs.textfield.focus();
    },
    truncate(string, maxWords = 50) {
      var strippedString = string.trim();
      var array = strippedString.split(" ");
      var wordCount = array.length;
      string = array.splice(0, maxWords).join(" ");

      if (wordCount > maxWords) {
        string += "...";
      }

      return string;
    },
    updateQuery(author) {
      this.query = author;
      this.instantSearch();
    },
    goToExternal(url) {
      //
      if (url.indexOf("://") > 0 || url.indexOf("//") === 0) {
        window.open(url);
        console.log("absolute: ", url);
      } else {
        this.$router.push(url);
        console.log("relative: ", url);
      }
    },
    download(result) {
      let download = `${result.path}`;
      console.log("download: ", download);
      //console.log("ext: ", result.ext);
      if (download.includes("pdf")) {
        window.open(download);
      } else {
        location.href = download;
      }
    },
    displayExtension(item) {
      if (!item.ext) return;
      const cleanExt = DOMPurify.sanitize(item.ext).replace(
        /(<([^>]+)>)/gi,
        ""
      );
      return cleanExt.substring(1);
    },
    route(path) {
      this.searchModal = false;
      this.$router.push(path).catch((err) => {
        this.$vuetify.goTo(0);
      });
    },
    instantSearch() {
      if (!this.query.length) return;
      if (this.query.length < 2) return;
      this.queryResults = this.fuse.search(this.query).slice(0, 99);
    },
    displayHeadings(headings) {
      if (typeof headings === "string") {
        return headings;
      }
      return null;
    },
  },
};
</script>

<style>
.author {
  font-weight: 700;
  color: #666;
}
.author:hover {
  color: #aaa;
}
</style>

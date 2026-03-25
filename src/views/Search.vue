<template>
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
      </div>
      <v-form class="pl-2" style="margin-top: -15px">
        <v-text-field
          ref="textfield"
          clearable
          autofocus
          v-model="query"
          label="Search"
          placeholder="Search"
          aria-label="Search ICJIA"
          @input="instantSearch"
          style="font-weight: 900"
        />

        <div v-if="query && query.length" class="mb-12">
          <div
            v-for="(result, index) in queryResults"
            :key="index"
            class="my-4"
          >
            <div
              style="background: #fff; border: 1px solid #eee"
              class="px-3 py-3"
            >
              <div style="font-size: 14px">
                <!-- ------------------------------------------------
                Default 
                -----------------------------------------------  -->
                <div>
                  <div>
                    <span
                      style="font-weight: 700"
                      v-if="result.item.contentType"
                    >
                      {{ result.item.contentType.toUpperCase() }}
                    </span>
                  </div>
                  <div
                    style="font-size: 16px; font-weight: bold"
                    class="mt-2 mb-2"
                    v-html="result.item.title"
                    v-if="result.item.title"
                  ></div>
                </div>
                <div
                  v-if="result.item.abstract"
                  v-html="truncate(result.item.abstract)"
                ></div>
                <div
                  v-else-if="result.item.summary"
                  v-html="truncate(result.item.summary)"
                  class="mt-2 mb-2"
                ></div>
                <span
                  v-for="tag of result.item.tags"
                  :key="tag"
                  class="px-2 mt-2 mr-2 search-tag"
                  >{{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </v-form>
    </div>
  </v-card>
</template>

<script>
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
/* eslint-disable no-unused-vars */
import DOMPurify from "dompurify";

import _ from "lodash";

function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
export default {
  data() {
    return {
      searchFilter: null,
      searchModal: false,
      opts: null,
      query: "",
      queryResults: [],
      content: "",
      searchInput: this.$refs.textfield,
      fuse: this.$myApp.fuse,
      resultNumber: "s",
      arrayToList,
      getProperCategory,
    };
  },
  created() {},
  mounted() {
    EventBus.$on("closeSearch", () => {
      this.searchModal = false;
    });
    EventBus.$on("search", (opts) => {
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
      // if (!this.query.length) return;
      if (!this.query) return;
      if (!this.query.length) return;
      this.queryResults = this.fuse.search(this.query);
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

<template>
  <v-dialog
    v-model="searchModal"
    width="98%"
    ref="searchTop"
    style="z-index: 999999"
  >
    <v-card color="#eee" min-height="600" class="px-1 py-1">
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

          <!-- <v-btn-toggle v-model="hubOnly" mandatory>
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
              class="my-2"
            >
              <v-card
                elevation="0"
                color="#fff"
                @click="route(result.item.fullPath)"
                class="hover px-1 py-3 mb-2 card"
              >
                <div style="font-size: 12px">
                  <span style="font-weight: 700">{{
                    result.item.contentType.toUpperCase()
                  }}</span>
                  | {{ result.item.date | format }}
                </div>
                <div v-if="result.item.title" class="mt-2">
                  <span
                    style="font-size: 16px; font-weight: bold"
                    class=""
                    v-html="result.item.title"
                  ></span>
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
                <v-card-text v-if="result.item.abstract">{{
                  result.item.abstract
                }}</v-card-text>

                <template v-if="result.item.tags">
                  <BasePropChip
                    v-for="tag of result.item.tags"
                    :key="tag"
                    class="mt-1"
                  >
                    <template>{{ tag }}</template>
                  </BasePropChip>
                </template>
              </v-card>
            </div>
          </div>
        </v-form>

        <!-- <v-divider></v-divider> -->

        <!-- <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="searchModal = false">
          I accept
        </v-btn>
      </v-card-actions> -->
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { EventBus } from "@/event-bus";
/* eslint-disable no-unused-vars */
import DOMPurify from "dompurify";
import Fuse from "fuse.js";
import _ from "lodash";
import searchIndex from "@/hub.json";
function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
export default {
  data() {
    return {
      hubOnly: true,
      searchModal: false,
      opts: null,
      query: null,
      queryResults: [],
      content: "",
      fuse: null,
      resultNumber: "s",
      arrayToList,
    };
  },
  created() {
    this.fuse = new Fuse(searchIndex, this.$myApp.config.search.hub);
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
  },
  methods: {
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

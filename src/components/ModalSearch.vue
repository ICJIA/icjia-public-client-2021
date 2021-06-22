<template>
  <v-dialog
    v-model="searchModal"
    width="80%"
    transition="dialog-bottom-transition"
    ref="searchTop"
  >
    <v-card color="#fff" min-height="600">
      <v-card-title class="text-h5 grey lighten-2"> Search ICJIA </v-card-title>
      <div class="px-4 py-4">
        <div style="font-size: 12px" class="text-right mb-9">
          {{ queryResults.length }} result{{ resultNumber }}
        </div>
        <v-form class="pl-2">
          <v-text-field
            ref="textfield"
            v-model="query"
            label="Search"
            placeholder="Search"
            @input="instantSearch"
          />

          <div v-if="query && query.length" class="mb-12">
            <div
              v-for="(result, index) in queryResults"
              :key="index"
              class="my-2"
            >
              <!-- <v-card
              elevation="1"
              color="#f1f3f5"
              @click="route(result)"
              class="hover py-2 px-2 mb-5 card"
            >
              <v-card-text>{{ result.item.contentType }}</v-card-text>
              <div v-if="result.item.title">
                <span
                  style="font-size: 20px; font-weight: bold"
                  class=""
                  v-html="result.item.title"
                ></span>
              </div>
              <v-card-text v-html="result.item.abstract"></v-card-text>
              <v-card-text v-if="result.item.authors"
                ><span
                  v-for="(author, index) in result.item.authors"
                  :key="index"
                >
                  {{ author.title
                  }}<span v-if="index < result.item.authors.length - 2"
                    >,
                  </span>
                  <span v-if="index === result.item.authors.length - 2">
                    and
                  </span>
                </span>
              </v-card-text>
            </v-card> -->
              {{ result }}
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
    EventBus.$on("search", (opts) => {
      console.log("fire search: ", opts);
      this.opts = opts;
      if (this.opts && this.opts.query && this.opts.query.length) {
        this.query = this.opts.query;
        this.instantSearch();
      }
      this.searchModal = true;
      this.$nextTick(() => {
        let el = document.getElementsByClassName("v-dialog--active");
        el[0].scrollTop = 0;
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
    route(item) {
      this.$router.push(item.route);
    },
    instantSearch() {
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

<style lang="scss" scoped></style>

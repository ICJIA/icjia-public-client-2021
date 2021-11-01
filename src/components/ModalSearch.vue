<template>
  <v-dialog v-model="searchModal" ref="searchTop" style="z-index: 999999">
    <v-card color="#eee" min-height="600" class="px-3 py-1">
      <v-card-title class="text-h5 grey lighten-2">
        Search ICJIA<v-spacer></v-spacer
        ><v-btn small @click="searchModal = false">Close</v-btn>
      </v-card-title>

      <div class="">
        <v-form class="pl-2 mt-4" style="margin-top: -15px">
          <v-text-field
            ref="textfield"
            clearable
            autofocus
            v-model="query"
            label="Search"
            placeholder="Search"
            @input="instantSearch"
            style="font-weight: 900"
          />

          <div style="font-size: 12px" class="mb-9 d-flex">
            <span style="font-weight: 900" v-if="query && query.length">
              Displaying {{ queryResults.length }} result{{
                resultNumber
              }}</span
            >
            <!-- <v-spacer></v-spacer>
          <v-switch
            v-model="sortSwitch"
            :label="`Sort by published date`"
            @click="sortResults()"
          ></v-switch> -->
          </div>

          <div v-if="query && query.length" class="mb-12">
            <div
              v-for="(result, index) in queryResults"
              :key="index"
              class="my-4"
            >
              <SearchCard :item="result.item" :query="query"></SearchCard>
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
import NProgress from "nprogress";
function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
export default {
  data() {
    return {
      sortSwitch: false,
      searchFilter: null,
      searchModal: false,
      opts: null,
      query: null,
      queryResults: [],
      content: "",
      searchInput: this.$refs.textfield,
      fuse: null,
      resultNumber: "s",
      arrayToList,
      getProperCategory,
    };
  },
  async created() {
    //console.log(process.env.NODE_ENV);
    NProgress.start();
    let searchURL;
    if (process.env.NODE_ENV === "development") {
      searchURL = "/.netlify/functions/search";
    } else {
      searchURL = "https://agency.icjia.cloud/.netlify/functions/search";
    }
    let response = await fetch(searchURL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();
    const fuse = new Fuse(data.message, this.$myApp.config.search.site);
    this.$myApp.fuse = fuse;
    console.warn(
      "Getting search data from lambda. Length: ",
      data.message.length
    );
    this.fuse = this.$myApp.fuse;
    NProgress.done();
  },
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
    sortResults() {
      console.log("sorting");
      this.queryResults = this.fuse.search(this.query.trim());
      if (this.sortSwitch) {
        this.instantSearch();
        this.queryResults = _.orderBy(
          this.queryResults,
          ["item.publicationDate"],
          ["desc"]
        );
      } else {
        this.instantSearch();
      }
    },
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
      if (!this.query) return;
      if (!this.query.length) return;
      if (this.query.length < 2) return;
      this.queryResults = this.fuse.search(this.query.trim());
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

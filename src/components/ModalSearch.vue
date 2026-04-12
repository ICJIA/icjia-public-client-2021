<template>
  <v-dialog
    v-model="searchModal"
    ref="searchTop"
    style="z-index: 999999"
    aria-label="Search ICJIA"
  >
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

          <div style="font-size: 12px" class="mb-9 d-flex" aria-live="polite">
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
import NProgress from "@/services/Progress";
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
  // ModalSearch is mounted in App.vue at boot, so we deliberately do NOT
  // load the Fuse index in created() — that would fire the 2.7 MB fetch on
  // every cold load and defeat lazy loading. Instead, kick it off the moment
  // the user opens the search modal (in the EventBus.$on("search") handler).
  // The promise is cached in AppInit, so subsequent opens reuse it for free.
  mounted() {
    EventBus.$on("closeSearch", () => {
      this.searchModal = false;
    });
    EventBus.$on("search", (opts) => {
      // Start fetching the index immediately on open; getFuse() caches the
      // promise so repeated opens (and the data() consumers) share one fetch.
      this.ensureFuse();
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
    // Lazy-load the search index on demand. Safe to call repeatedly —
    // AppInit.getFuse() caches the promise so this is a no-op after the
    // first invocation. Once the Fuse instance is ready, re-run any query
    // the user typed before it landed (so the UI catches up automatically).
    async ensureFuse() {
      if (this.fuse) return;
      NProgress.start();
      try {
        this.fuse = await this.$myApp.getFuse();
        // If the user already typed something while we were loading, run it.
        if (this.query && this.query.length >= 2) {
          this.instantSearch();
        }
      } finally {
        NProgress.done();
      }
    },
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
      // Fuse may still be loading on first paint (lazy-fetched in created()).
      if (!this.fuse) return;
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
  color: #222;
}
.author:hover {
  color: #000;
}
</style>

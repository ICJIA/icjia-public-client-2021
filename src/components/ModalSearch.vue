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
            @input="debouncedSearch"
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
      // Monotonic counter used by instantSearch() to discard stale worker
      // responses when the user types faster than the worker can reply.
      searchSeq: 0,
      resultNumber: "s",
      arrayToList,
      getProperCategory,
    };
  },
  created() {
    // Debounce the input handler so typing fires one Fuse search per
    // pause instead of one per keystroke. 250ms is the sweet spot —
    // fast enough to feel live, slow enough to skip mid-word work.
    this.debouncedSearch = _.debounce(this.instantSearch, 250);
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
    async sortResults() {
      console.log("sorting");
      this.queryResults = await this.fuse.search(this.query.trim());
      if (this.sortSwitch) {
        await this.instantSearch();
        this.queryResults = _.orderBy(
          this.queryResults,
          ["item.publicationDate"],
          ["desc"]
        );
      } else {
        await this.instantSearch();
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
    async instantSearch() {
      if (!this.query) return;
      if (!this.query.length) return;
      if (this.query.length < 2) return;
      // Fuse may still be loading (lazy-fetched on modal open).
      if (!this.fuse) return;
      // Sequence guard: when the user types fast, multiple worker round-trips
      // are in flight. Only the latest query's results should land in the UI;
      // earlier ones are discarded if a newer search has been issued.
      const seq = ++this.searchSeq;
      const results = await this.fuse.search(this.query.trim());
      if (seq !== this.searchSeq) return; // a newer search superseded this one
      this.queryResults = results;
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

/* ───────────────────────────────────────────────────────────────────
 * Remove the redundant outer focus outline on the search input.
 *
 * Vuetify draws a 2px solid #1565c0 outline around the entire .v-input
 * wrapper on focus. That's redundant — the same v-input ALREADY shows
 * two other focus indicators that are WCAG 2.4.7 compliant on their own:
 *   1. A 1px solid #1565c0 underline via .v-input__slot::after
 *      (~7:1 contrast vs the white modal background — well over the
 *      3:1 required by WCAG 1.4.11 for non-text UI components)
 *   2. The floating label color shifts to #1565c0
 *
 * We can't use :focus-visible to gate this (the spec mandates that text
 * inputs always match :focus-visible because typing is interaction-heavy)
 * — but the right fix is to drop the duplicate outer ring entirely and
 * trust Vuetify's existing inline focus styling.
 *
 * Scoped to .v-dialog so other v-inputs across the site keep their
 * original styling until we make a broader decision.
 * ─────────────────────────────────────────────────────────────────── */
.v-dialog .v-input.v-input--is-focused {
  outline: none !important;
}
</style>

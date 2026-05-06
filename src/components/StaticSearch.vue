<template>
  <div v-if="queryResults && queryResults.length" class="markdown-body">
    <h2 v-if="title" class="ml-4">{{ title }}</h2>
    <div class="ml-4" v-if="queryResults && queryResults.length > 2">
      <!-- <span style="font-size: 12px; font-weight: 900">SORT BY:</span> -->
      <v-btn-toggle v-model="toggle_sort" mandatory class="mb-4">
        <v-btn small elevation="1" class="button-weight"> Title </v-btn>
        <v-btn small elevation="1" class="button-weight"> Date </v-btn>
      </v-btn-toggle>
      &nbsp;&nbsp;
      <v-btn-toggle v-model="toggle_direction" mandatory class="mb-4">
        <v-btn small elevation="1" class="button-weight"> Ascending </v-btn>
        <v-btn small elevation="1" class="button-weight"> Descending </v-btn>
      </v-btn-toggle>
    </div>
    <div v-for="(result, index) in queryResults" :key="index" class="px-3 mt-6">
      <SearchCardAlt :item="result.item" :threshold="0.2"></SearchCardAlt>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { EventBus } from "@/event-bus";
import DOMPurify from "dompurify";
import Fuse from "fuse.js";
import _ from "lodash";

export default {
  data() {
    return {
      queryResults: null,
      fuse: null,
      searchSeq: 0,
      filteredQueryResults: null,
      toggle_sort: 1,
      toggle_direction: 1,
    };
  },
  watch: {
    toggle_sort(newValue) {
      if (this.toggle_sort === 0) {
        this.toggle_direction = 0;
      }
      if (this.toggle_sort === 1) {
        this.toggle_direction = 1;
      }
      this.sort();
    },
    toggle_direction(newValue) {
      this.sort();
    },
  },
  async created() {
    // Lazy-fetch the search index instead of importing it into the bundle.
    this.fuse = await this.$myApp.getFuse();
    // The in-process fallback exposes the raw Fuse instance under .options;
    // the worker-backed client does not (Fuse lives on the worker thread).
    // Mutating threshold only affects the in-process path — the worker uses
    // the threshold baked into config.search.site at INIT time. Since static
    // search is rare and the difference is small (0.2 vs 0.25), this is fine.
    if (this.fuse.options) {
      this.fuse.options.threshold = this.threshold;
    }
    // Run the initial search now that fuse is ready (replaces the call
    // that used to live in mounted() — fuse may not have been ready then).
    this.instantSearch(this.query);
  },
  methods: {
    sort() {
      let direction;
      if (this.toggle_direction === 0) {
        direction = "asc";
      } else {
        direction = "desc";
      }
      switch (this.toggle_sort) {
        case 0:
          this.queryResults = _.orderBy(
            this.queryResults,
            ["item.title"],
            [direction]
          );
          break;
        case 1:
          this.queryResults = _.orderBy(
            this.queryResults,
            ["item.date", "item.end"],
            [direction, direction]
          );
          break;

        default:
          console.log("Default case -- not sorted");
      }
    },
    async instantSearch(query) {
      if (!this.query.length) return;
      if (!this.fuse) return;
      // Sequence guard for fast typists (worker may answer out of order).
      const seq = ++this.searchSeq;
      const queryResults = await this.fuse.search(this.query);
      if (seq !== this.searchSeq) return;
      // prevent duplicated item
      let filteredQueryResults = queryResults.filter((result) => {
        let currentPath = this.$route.fullPath;
        currentPath += currentPath.endsWith("/") ? "" : "/";
        let searchResultPath = result.item.fullPath;
        searchResultPath += searchResultPath.endsWith("/") ? "" : "/";
        if (currentPath !== searchResultPath) return result;
      });
      this.queryResults = filteredQueryResults;
      this.sort();
    },
  },
  props: {
    threshold: {
      type: Number,
      default: 0.2,
    },
    query: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    hideBiography: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style lang="scss" scoped></style>

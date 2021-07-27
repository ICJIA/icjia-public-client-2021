<template>
  <div>
    <div v-for="(result, index) in queryResults" :key="index">
      <SearchCard :item="result.item" :threshold="0.2"></SearchCard>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { EventBus } from "@/event-bus";
import DOMPurify from "dompurify";
import Fuse from "fuse.js";
import _ from "lodash";
// import searchIndex from "@/config/searchIndex.json";
export default {
  data() {
    return {
      queryResults: null,
    };
  },
  created() {
    let searchConfigUpdated = this.$myApp.config.search.site;
    searchConfigUpdated.threshold = this.threshold;
    this.fuse = new Fuse(this.$myApp.searchIndex, searchConfigUpdated);
  },
  mounted() {
    this.instantSearch(this.query);
  },
  methods: {
    instantSearch(query) {
      if (!this.query.length) return;
      this.queryResults = this.fuse.search(this.query);
      this.queryResults = _.orderBy(this.queryResults, ["category"], ["asc"]);
    },
  },
  props: {
    threshold: {
      type: Number,
      default: 0.3,
    },
    query: {
      type: String,
      default: "",
    },
  },
};
</script>

<style lang="scss" scoped></style>

<template>
  <div v-if="queryResults && queryResults.length" class="markdown-body">
    <h3 v-if="title">{{ title }}</h3>
    <div v-for="(result, index) in queryResults" :key="index" class="px-3 mt-6">
      {{ result.item.fullName }}
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
      fuse: this.$myApp.fuse,
      filteredQueryResults: null,
    };
  },
  created() {
    this.fuse.options.threshold = this.threshold;
  },
  mounted() {
    this.instantSearch(this.query);
  },
  methods: {
    instantSearch(query) {
      if (!this.query.length) return;
      let queryResults = this.fuse.search(this.query);
      queryResults = _.orderBy(queryResults, ["category"], ["asc"]);
      let filteredQueryResults = queryResults.filter((result) => {
        console.log(result.item.contentType);
        if (result.item.contentType !== "biography") return result;
      });
      this.queryResults = filteredQueryResults;
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
    title: {
      type: String,
      default: "",
    },
  },
};
</script>

<style lang="scss" scoped></style>

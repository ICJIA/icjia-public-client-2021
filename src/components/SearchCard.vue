<template>
  <div>
    <v-card
      elevation="1"
      color="#fff"
      @click="route(item.fullPath)"
      class="hover px-4 py-3 mb-2 card"
      v-if="item"
    >
      <div style="font-size: 12px" v-if="item && item.date">
        <span style="font-weight: 700" v-if="item.contentType">{{
          item.contentType.toUpperCase()
        }}</span>
        | {{ item.date | format }}
      </div>
      <div style="font-size: 12px" v-else-if="item && item.start">
        <span style="font-weight: 700">{{
          item.contentType.toUpperCase()
        }}</span>
        | {{ item.start | format }} to
        {{ item.end | format }}
      </div>
      <div style="font-size: 12px" v-else-if="item && item.category">
        <span style="font-weight: 700">{{
          item.contentType.toUpperCase()
        }}</span>
      </div>
      <div style="font-size: 12px" v-else>
        <span style="font-weight: 700">{{
          item.contentType.toUpperCase()
        }}</span>
      </div>
      <div v-if="item.title" class="mt-2">
        <span
          style="font-size: 16px; font-weight: bold"
          class=""
          v-html="item.title"
        ></span>

        <div v-if="item.position">
          <span style="font-size: 14px" class="" v-html="item.position"></span>
        </div>

        <div v-if="item.authors">
          <span
            style="font-size: 14px"
            v-for="(author, index) in item.authors"
            :key="index"
          >
            <span
              @click.stop.prevent="updateQuery(author.title)"
              class="author"
              >{{ author.title }}</span
            >
            <span v-if="index < item.authors.length - 2">, </span>
            <span v-if="index === item.authors.length - 2"> and </span>
          </span>
        </div>
      </div>
      <v-card-text v-if="item.abstract" v-html="item.abstract"></v-card-text>
      <v-card-text
        v-else-if="item.summary"
        v-html="render(item.summary)"
      ></v-card-text>
      <v-card-text v-else>No summary available.</v-card-text>

      <template v-if="item.tags">
        <BasePropChip v-for="tag of item.tags" :key="tag" class="mt-1">
          <template>{{ tag }}</template>
        </BasePropChip>
      </template>
    </v-card>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { EventBus } from "@/event-bus";
import DOMPurify from "dompurify";
import { renderToHtml } from "@/services/Markdown";
import _ from "lodash";
// import searchIndex from "@/config/searchIndex.json";
export default {
  methods: {
    render(content) {
      return renderToHtml(content);
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
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
};
</script>

<style lang="scss" scoped></style>

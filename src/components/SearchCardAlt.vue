<template>
  <div>
    <v-card
      elevation="1"
      color="#fff"
      @click="route(item.fullPath)"
      class="hover px-4 py-3 mb-2 card"
      v-if="item"
    >
      <div style="font-size: 14px">
        <!-- ------------------------------------------------
           News 
        -----------------------------------------------  -->
        <div v-if="item.contentType === 'news'">
          <div>
            <span style="font-weight: 700">{{
              getProperCategory(
                $myApp.config.maps.news,
                item.category
              ).toUpperCase()
            }}</span>
            | {{ item.publicationDate | format }}
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
          ></div>
        </div>
        <!-- ------------------------------------------------
           Hub Articles 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'article'">
          <div>
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
            | {{ item.date | format }}
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
          ></div>
          <div v-if="item.authors" class="mt-1">
            <span
              style="font-size: 12px"
              v-for="(author, index) in item.authors"
              :key="index"
            >
              <span @click.stop.prevent="search(author.title)" class="author">{{
                author.title
              }}</span>
              <span v-if="index < item.authors.length - 2">, </span>
              <span v-if="index === item.authors.length - 2"> and </span>
            </span>
          </div>
        </div>
        <!-- ------------------------------------------------
           Biographies 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'biography'">
          <!-- <div>
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
          </div> -->

          <div v-if="item.fullName" class="mt-1">
            <span
              style="font-size: 16px; font-weight: bold"
              class=""
              v-html="item.fullName"
            ></span>

            <div v-if="item.position">
              <span
                v-if="item.unit && item.unit.title"
                style="font-weight: 700"
                @click.stop.prevent="search(item.unit.title)"
              >
                {{ item.unit.title }}&nbsp;|&nbsp;
              </span>
              <span
                style="font-size: 14px"
                class=""
                v-html="item.position"
              ></span>
            </div>
          </div>
        </div>
        <!-- ------------------------------------------------
           Publications 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'publication'">
          <div>
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
            | {{ item.publicationDate | format }}
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
          ></div>
        </div>
        <!-- ------------------------------------------------
           Events 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'event'">
          <div>
            <span style="font-weight: 700">
              {{ item.category.toUpperCase() }}
              {{ item.contentType.toUpperCase() }}
            </span>
            | {{ item.start | dateFormatFull }}
            {{ getEndText(item.start, item.end, item.timed) }}
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
          ></div>
        </div>

        <!-- ------------------------------------------------
           Meetings 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'meeting'">
          <div>
            <span style="font-weight: 700"
              >{{
                getProperCategory(
                  $myApp.config.maps.meetings,
                  item.category
                ).toUpperCase()
              }}
              MEETING</span
            >
            | {{ item.start | dateFormatFull }}
            {{ getEndText(item.start, item.end, true) }}
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
          ></div>
        </div>
        <!-- ------------------------------------------------
           Funding 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'funding'">
          <div>
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
            | {{ item.start | dateFormatFull }} to
            {{ item.end | dateFormatFull }}
            &nbsp;
            <v-chip dark x-small v-if="isItExpired(item.end)" color="grey"
              >Expired</v-chip
            >
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
          ></div>
        </div>
        <!-- ------------------------------------------------
           Page 
        -----------------------------------------------  -->
        <div v-else-if="item.contentType === 'page'">
          <div class="d-flex">
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
            <v-spacer></v-spacer>
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
            v-if="item.title"
          ></div>
        </div>
        <!-- ------------------------------------------------
           Default 
        -----------------------------------------------  -->
        <div v-else>
          <div>
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
          </div>
          <div
            style="font-size: 16px; font-weight: bold"
            class="mt-2"
            v-html="item.title"
            v-if="item.title"
          ></div>
        </div>
      </div>
      <v-card-text
        v-if="item.abstract"
        v-html="render(item.abstract)"
      ></v-card-text>
      <v-card-text
        v-else-if="item.summary"
        v-html="render(item.summary)"
      ></v-card-text>
      <v-card-text v-else></v-card-text>
      <div class="pl-2 pb-3" style="margin-top: -15px">
        <template v-if="item.tags">
          <BasePropChip v-for="tag of item.tags" :key="tag" class="mt-1">
            <template>{{ tag }}</template>
          </BasePropChip>
        </template>
      </div>
      <!-- <span style="font-weight: 400; font-size: 12px" v-if="item.updated_at">
        Last updated: {{ item.updated_at | format }}
      </span> -->
    </v-card>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
import DOMPurify from "dompurify";
import { renderToHtml } from "@/services/Markdown";
import moment from "moment";
import _ from "lodash";
// import searchIndex from "@/config/searchIndex.json";
export default {
  data() {
    return {
      getProperCategory,
    };
  },
  methods: {
    isItExpired(expiration) {
      //console.log(expiration);
      let now = new Date();
      let expired = new Date(expiration);
      if (now > expired) {
        return true;
      } else {
        return false;
      }
    },
    getStartText(eventStart) {
      let start = moment(eventStart);
      return `${start.format("dddd, MMM DD, YYYY")}`;
    },
    getEndText(eventStart, eventEnd, eventTimed) {
      let start = moment(eventStart);
      let end = moment(eventEnd);
      let days = end.diff(start, "days");
      let hours = end.diff(start, "hours");
      if (!eventTimed) {
        return ` | All Day`;
      }
      if (days > 0) {
        return ` to ${end.format("dddd, MMM DD, YYYY")}`;
      } else {
        return ` | ${start.format("hh:mm A")} to ${end.format("hh:mm A")}`;
      }
    },
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

    search(name) {
      let opts = {
        query: name,
        type: "general",
      };
      EventBus.$emit("search", opts);
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
      EventBus.$emit("closeSearch");

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

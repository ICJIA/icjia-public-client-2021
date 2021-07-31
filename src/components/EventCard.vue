<template>
  <div class="markdown-body">
    <v-card
      color="white"
      v-if="item"
      class="mb-5"
      elevation="1"
      @click="isClickable ? $router.push(item.fullPath) : null"
    >
      <v-toolbar :color="item.color" dark elevation="0">
        <v-toolbar-title v-html="item.name" style="font-weight: 700">
        </v-toolbar-title>

        <v-spacer></v-spacer>
        <v-btn
          x-small
          outlined
          @click.prevent.stop="$emit('clicked')"
          v-if="showClose"
          class="ml-3"
          >CLOSE</v-btn
        >
      </v-toolbar>

      <!-- <div style="font-size: 16px" class="px-3 py-3">
        <span style="color: #333; font-weight: bold">{{
          item.category | upperCase
        }}</span>
        <span
          style="color: #333; font-weight: bold"
          v-if="item.contentType === 'meeting'"
        >
          MEETING</span
        >
        <span
          style="color: #333; font-weight: bold"
          v-if="item.contentType === 'event'"
        >
          EVENT</span
        >

        <span
          style="color: #555"
          v-html="getRange(item.start, item.end, item.timed)"
        ></span
        >&nbsp;&nbsp;&nbsp;<span v-if="showURL">|&nbsp;</span>
        <v-icon v-if="showURL" @click="$router.push(`${item.fullPath}/`)"
          >link</v-icon
        
      </div> -->
      hide from calendar: {{ item.hideFromCalendar }}
      <br />
      hide from list: {{ item.hideFromList }}
      <br />
      <div style="font-size: 14px" class="mt-2 pl-3">
        <!-- ------------------------------------------------
           Funding 
        -----------------------------------------------  -->
        <div v-if="item.contentType === 'funding'">
          <div>
            <span style="font-weight: 700">
              {{ item.contentType.toUpperCase() }}
            </span>
            | {{ item.startDate | dateFormatFull }} to
            {{ item.endDate | dateFormatFull }}
            &nbsp;
            <v-chip dark x-small v-if="isItExpired(item.endDate)" color="grey"
              >Expired</v-chip
            >
            <!-- <v-chip dark small v-else color="grey"
              >Deadline: {{ item.endDate | fromNow }}</v-chip
            > -->
          </div>
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
      </div>

      <!-- <div
        style="font-size: 16px; font-weight: bold"
        class="mt-2"
        v-html="item.title"
      ></div> -->
      <div class="py-0 px-3" v-if="item.details">
        <div class="pl-2" style="margin-top: 10px">
          <div v-html="render(item.details)"></div>
        </div>
      </div>

      <div class="py-3 px-3" v-else-if="item.summary">
        <div class="pl-2" style="margin-top: 10px">
          <div v-html="render(item.summary)"></div>
        </div>
      </div>

      <div v-if="item.tags" class="py-2 px-3">
        <BasePropChip
          v-for="(tag, index) of item.tags"
          :key="index + nanoid()"
          class="mt-1"
        >
          <template>{{ tag }}</template>
        </BasePropChip>
      </div>
      <RelatedList
        v-if="isRelated"
        :content="item"
        title="Related"
        class="mt-4"
      ></RelatedList>
    </v-card>
  </div>
</template>

<script>
import { nanoid } from "nanoid";
/* eslint-disable no-unused-vars */
const moment = require("moment");
const tz = require("moment-timezone");
// import { handleClicks } from "@/mixins/handleClicks";
import { renderToHtml } from "@/services/Markdown";
import { isRelatedContent } from "@/utils/content";
import { getProperCategory } from "@/utils/content";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  data() {
    return {
      nanoid,
      show: false,
      isRelated: false,
      getProperCategory,
    };
  },
  mounted() {
    this.isRelated = isRelatedContent(this.item);
    attachInternalLinks(this);
    attachSearchEvents(this);
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
    getColor(item) {
      let color = "#0d4474";
      if (this.$myApp.config.events[item.category] && this.showColor) {
        color = this.$myApp.config.events[item.category]["color"];
      }
      return color;
    },
    render(content) {
      return renderToHtml(content);
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
    download(file) {
      let download = `${this.$myApp.config.api.base}${file.url}`;
      //console.log("download: ", download);
      if (file.ext === ".pdf") {
        window.open(download);
      } else {
        location.href = download;
      }
    },
    getRange(start, end, timed) {
      let range;
      let localStart = moment(start).tz(this.$myApp.config.timezone);
      let localEnd = moment(end).tz(this.$myApp.config.timezone);
      let daysBetween = moment(localEnd).diff(moment(localStart), "days");

      if (daysBetween === 0 && timed) {
        range = ` | ${localStart.format("h:mm a")} to ${localEnd.format(
          "h:mm a"
        )} | <span style='font-weight: 400'>${localStart.format(
          "dddd, MMMM DD, YYYY"
        )}</span>`;
      } else if (daysBetween === 0 && !timed) {
        range = ` | All Day  | <span style='font-weight: 400'>${localStart.format(
          "dddd, MMMM DD, YYYY"
        )}</span>`;
      } else if (daysBetween > 0) {
        range = ` | <span style='font-weight: 400'>${localStart.format(
          "dddd, MMMM D"
        )}</span> <span style='font-weight: 400'>through</span> <span style='font-weight: 400'>${localEnd.format(
          "dddd, MMMM D, YYYY"
        )}</span>`;
      }
      return range;
    },
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },

    showTitle: {
      type: Boolean,
      default: false,
    },
    showURL: {
      type: Boolean,
      default: true,
    },
    showClose: {
      type: Boolean,
      default: true,
    },
    isClickable: {
      type: Boolean,
      default: true,
    },
    showColor: {
      type: Boolean,
      default: true,
    },
    showRelated: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style></style>

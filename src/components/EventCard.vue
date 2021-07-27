<template>
  <div class="markdown-body reduce-85">
    <v-card
      color="white"
      class="mb-5 card"
      elevation="1"
      @click="isClickable ? $router.push(item.fullPath) : null"
      style="border: 1px solid #ddd !important"
    >
      <div
        style="
          border-left: 0px solid #ccc;
          background: #fafafa;
          width: 100% !important;
        "
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
        <div class="px-5 py-6">
          <div style="font-size: 16px">
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
            >
          </div>

          <div class="py-3" v-if="item.details">
            <div class="pl-2" style="margin-top: 10px">
              <div v-html="render(item.details)"></div>
            </div>
          </div>

          <div class="py-3" v-else-if="item.summary">
            <div class="pl-2" style="margin-top: 10px">
              <div v-html="render(item.summary)"></div>
            </div>
          </div>
          <div
            v-if="item.documents && item.documents.length"
            style="background: #eee"
          >
            <v-sheet color="grey lighten-3" class="px-3 py-3">
              <div
                style="
                  font-weight: bold;
                  border-bottom: 1px solid #ccc;
                  padding-bottom: 5px;
                  margin-bottom: 15px;
                "
              >
                Related Documents
              </div>

              <ul class="mt-2">
                <span
                  v-for="(document, index) in item.documents"
                  :key="`eventDoc-${index}`"
                  class="download-link"
                >
                  <li
                    v-if="document.file"
                    class="hover"
                    @click.stop.prevent="download(document.file)"
                  >
                    <v-tooltip right>
                      <template v-slot:activator="{ on, attrs }">
                        <span v-bind="attrs" v-on="on">
                          {{ document.title }}
                        </span>
                      </template>
                      <span style="font-size: 12px">
                        {{ document.file.name }}
                      </span>
                    </v-tooltip>
                  </li>
                  <li
                    v-else
                    class="hover"
                    @click.stop.prevent="goToExternal(document.externalURL)"
                  >
                    <v-tooltip right>
                      <template v-slot:activator="{ on, attrs }">
                        <span v-bind="attrs" v-on="on">
                          {{ document.title }}&nbsp;<v-icon x-small
                            >open_in_new</v-icon
                          >
                        </span>
                      </template>
                      <span style="font-size: 12px">
                        {{ document.externalURL }}
                      </span>
                    </v-tooltip>
                  </li>
                </span>
              </ul>
            </v-sheet>
          </div>
          <template v-if="item.tags">
            <BasePropChip v-for="tag of item.tags" :key="tag" class="mt-1">
              <template>{{ tag }}</template>
            </BasePropChip>
          </template>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
const moment = require("moment");
const tz = require("moment-timezone");
// import { handleClicks } from "@/mixins/handleClicks";
import { renderToHtml } from "@/services/Markdown";
export default {
  //   mixins: [handleClicks],
  methods: {
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
  },
};
</script>

<style></style>

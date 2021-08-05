<template>
  <div>
    <div
      style="background: #fff; border: 1px solid #eee"
      class="px-3 py-3 mb-3 card"
      @click="route(item.fullPath)"
    >
      <div style="font-size: 14px">
        <!-- ------------------------------------------------
                Default 
                -----------------------------------------------  -->
        <div>
          <div>
            <span
              style="font-weight: 700"
              v-if="item.contentType"
              class="search-content-type"
              @click.prevent.stop="click($event)"
            >
              <span v-if="item.category && item.contentType === 'news'"
                >{{
                  getProperCategory(
                    $myApp.config.maps.news,
                    item.category
                  ).toUpperCase()
                }}
              </span>
              <span v-if="item.category && item.contentType === 'meeting'">{{
                getProperCategory(
                  $myApp.config.maps.meetings,
                  item.category
                ).toUpperCase()
              }}</span>
              <span v-if="item.category && item.contentType === 'program'">{{
                item.category.toUpperCase()
              }}</span>
              <span v-if="item.contentType !== 'news'">
                {{ item.contentType.toUpperCase() }}</span
              >
            </span>
            <span v-if="item.publicationDate"
              >&nbsp;|&nbsp;{{ item.publicationDate | format }}</span
            >
            <span v-if="item.date">&nbsp;|&nbsp;{{ item.date | format }}</span>
            <span v-if="item.start && item.end"
              >&nbsp;|&nbsp;{{ item.start | format
              }}<span v-if="isWithinOneDay(item.start, item.end) >= 24">
                to {{ item.end | format }}</span
              ></span
            >
          </div>
          <div
            style="font-size: 16px; font-weight: bold; display: inline"
            class="mt-2 mb-2"
            v-html="item.title"
            v-if="item.title"
          ></div>
        </div>
        <div v-if="item.abstract" v-html="truncate(item.abstract)"></div>
        <div
          v-else-if="item.summary"
          v-html="truncate(item.summary)"
          class="mt-2 mb-2"
        ></div>
        <span
          v-for="tag of item.tags"
          :key="tag"
          class="px-2 py-1 mt-2 mr-2 search-tag lato"
          @click.prevent.stop="click($event)"
          >{{ tag }}
        </span>
      </div>
    </div>
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
    isWithinOneDay(eventStart, eventEnd) {
      let start = moment(eventStart);
      let end = moment(eventEnd);
      let hours = end.diff(start, "hours");
      return hours;
    },
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
    click(e) {
      //console.log("chip click: ", e.target.innerHTML);
      let opts = {
        query: e.target.innerText,
        type: "general",
      };
      EventBus.$emit("search", opts);
    },
    // download(result) {
    //   let download = `${path}`;
    //   console.log("download: ", download);
    //   //console.log("ext: ", ext);
    //   if (download.includes("pdf")) {
    //     window.open(download);
    //   } else {
    //     location.href = download;
    //   }
    // },
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

<style>
.search-tag {
  background: #eee;
  border-radius: 25px;
  font-family: "Lato", sans-serif !important;
  font-size: 10px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  cursor: pointer;
}
.search-tag:hover {
  background: #ddd;
  text-decoration: underline;
}
.search-content-type {
  color: #333;
  cursor: pointer;
}

.search-content-type:hover {
  color: #666;
  text-decoration: underline;
}

.search-title {
  color: #000;
  cursor: pointer;
}

.search-title:hover {
  color: #333;
  text-decoration: underline;
}
.search-card:hover {
  /* box-shadow: 0px 0px 8px #aaa;
  z-index: 2;
  -webkit-transition: all 100ms ease-in;
  -webkit-transform: scale(1.001);
  -ms-transition: all 100ms ease-in;
  -ms-transform: scale(1.001);
  -moz-transition: all 100ms ease-in;
  -moz-transform: scale(1.001);
  transition: all 100ms ease-in;
  transform: scale(1.001); */
  cursor: pointer;
  background: #fafafa !important;
  border: 1px solid #ccc !important;
}
</style>

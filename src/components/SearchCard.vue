<template>
  <div>
    <!-- The title is the result's link (WCAG 2.1.1, 4.1.2): the card used to
         be a <div> with a click handler, which a keyboard cannot reach. A
         click anywhere else on the card still opens the result. -->
    <div
      style="background: #fff; border: 1px solid #ccc; border-radius: 4px"
      class="px-3 py-3 mb-3 card"
      @click="onCardClick"
      elevation="2"
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
            >
              <router-link
                v-if="item.category && item.contentType === 'news'"
                :to="
                  searchFor(
                    getProperCategory($myApp.config.maps.news, item.category)
                  )
                "
                class="search-chip-link"
                >{{
                  getProperCategory(
                    $myApp.config.maps.news,
                    item.category
                  ).toUpperCase()
                }}
              </router-link>
              <router-link
                v-if="item.category && item.contentType === 'meeting'"
                :to="
                  searchFor(
                    getProperCategory(
                      $myApp.config.maps.meetings,
                      item.category
                    )
                  )
                "
                class="search-chip-link"
                >{{
                  getProperCategory(
                    $myApp.config.maps.meetings,
                    item.category
                  ).toUpperCase()
                }}</router-link
              >
              <router-link
                v-if="item.category && item.contentType === 'program'"
                :to="searchFor(item.category)"
                class="search-chip-link"
                >{{ item.category.toUpperCase() }}</router-link
              >
              <router-link
                v-if="item.contentType !== 'news'"
                :to="searchFor(item.contentType)"
                class="search-chip-link"
              >
                {{ item.contentType.toUpperCase() }}</router-link
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
            <span v-if="item.isCancelled"
              >&nbsp;|&nbsp;

              <span
                style="
                  color: #000 !important;
                  font-weight: 900;
                  padding-top: 0px;
                "
              >
                CANCELLED
              </span>
            </span>
          </div>
          <div style="height: 10px"></div>
          <div
            style="font-size: 16px; font-weight: bold; display: inline"
            class="mt-2 mb-2"
            v-if="item.title"
          >
            <a
              v-if="isStatic"
              :href="item.fullPath"
              target="_blank"
              rel="noopener noreferrer"
              class="card-title-link"
              v-html="item.title"
            ></a>
            <router-link v-else :to="item.fullPath" class="card-title-link"
              ><span v-html="item.title"></span
            ></router-link>
          </div>
        </div>
        <div v-if="item.abstract" v-html="truncate(item.abstract)"></div>
        <div
          v-else-if="item.summary"
          v-html="truncate(item.summary)"
          class="mt-2 mb-2"
        ></div>
        <router-link
          v-for="tag of item.tags"
          :key="tag"
          :to="searchFor(tag)"
          class="px-2 py-1 mr-3 search-tag lato"
          >{{ tag }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
import { goToSearch, openInNewTab, searchLocation } from "@/utils/search";
import { isClickOnLink } from "@/utils/focus";
import DOMPurify from "dompurify";
import { renderToHtml } from "@/services/Markdown";
import dayjs from "@/plugins/dayjs";
import _ from "lodash";

export default {
  data() {
    return {
      getProperCategory,
    };
  },
  methods: {
    isWithinOneDay(eventStart, eventEnd) {
      let start = dayjs(eventStart);
      let end = dayjs(eventEnd);
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
      let start = dayjs(eventStart);
      return `${start.format("dddd, MMM DD, YYYY")}`;
    },
    getEndText(eventStart, eventEnd, eventTimed) {
      let start = dayjs(eventStart);
      let end = dayjs(eventEnd);
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
      goToSearch(this.$router, { query: name, type: "general" });
    },

    goToExternal(url) {
      //
      if (url.indexOf("://") > 0 || url.indexOf("//") === 0) {
        window.open(url, "_blank", "noopener,noreferrer");
        console.log("absolute: ", url);
      } else {
        this.$router.push(url);
        console.log("relative: ", url);
      }
    },
    // Search for a chip's text, as its old click handler did with the
    // chip's rendered (upper-cased) text: lower case, spaces collapsed.
    searchFor(text) {
      const query = String(text || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      return searchLocation({ query, type: "general" });
    },
    onCardClick(e) {
      if (isClickOnLink(e)) return;
      this.route(this.item.fullPath);
    },
    // download(result) {
    //   let download = `${path}`;
    //   console.log("download: ", download);
    //   //console.log("ext: ", ext);
    //   if (download.includes("pdf")) {
    //     window.open(download, "_blank", "noopener,noreferrer");
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
      // When the card is rendered on the static /search page we open the
      // destination in a new tab so users keep their result list intact
      // (the #1 complaint about the old modal was losing the result set
      // the moment they clicked a hit). When rendered inside the modal
      // we keep the legacy same-tab navigation + close-modal behavior.
      if (this.isStatic) {
        openInNewTab(path);
        return;
      }
      EventBus.$emit("closeSearch");
      this.$router.push(path).catch(() => {
        this.$vuetify.goTo(0);
      });
    },
  },
  props: {
    query: {
      type: String,
      default: "",
    },
    elevation: {
      type: Number,
      default: 0,
    },
    item: {
      type: Object,
      default: () => {},
    },
    isStatic: {
      type: Boolean,
      default: false,
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
/* The chips are links now; keep their chip look (see app.css). */
.v-application a.search-tag {
  color: #000;
  text-decoration: none;
}
.v-application a.search-tag:hover {
  color: #000;
  text-decoration: underline;
}
.v-application a.search-chip-link,
.v-application a.search-chip-link:hover {
  color: inherit;
  font-weight: inherit;
  text-decoration: none;
}
.search-content-type {
  color: #000;
  cursor: pointer;
}

.search-content-type:hover {
  color: #000;
  text-decoration: underline;
}

.search-title {
  color: #000;
  cursor: pointer;
}

.search-title:hover {
  color: #000;
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

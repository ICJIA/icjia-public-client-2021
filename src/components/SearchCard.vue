<template>
  <div>
    <!-- The title is the result's link (WCAG 2.1.1, 4.1.2): the card used to
         be a <div> with a click handler, which a keyboard cannot reach. A
         click anywhere else on the card still opens the result. The title is
         a heading, below the page's "Search ICJIA", so a screen reader can
         move from result to result (WCAG 1.3.1); it was a bold <div>. -->
    <div
      style="background: #fff; border: 1px solid #ccc; border-radius: 4px"
      class="px-3 py-3 mb-3 card"
      @click="onCardClick"
      elevation="2"
    >
      <!-- A long address breaks at the card's edge (WCAG 1.4.10): a WebEx
           link in a meeting's summary made the results for "violence" 346 px
           wide at 320 px. -->
      <div style="font-size: 14px; overflow-wrap: break-word">
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
          <h2
            style="font-size: 16px; font-weight: bold; display: inline"
            class="mt-2 mb-2"
            v-if="item.title"
          >
            <!-- A result on another site (the Partners menu's links) opens in
                 a new tab and says so, as the menu's links do. -->
            <a
              v-if="isExternal"
              :href="item.fullPath"
              target="_blank"
              rel="noopener noreferrer"
              class="card-title-link"
              ><span v-html="highlight(item.title)"></span
              ><v-icon small right color="black" aria-hidden="true"
                >mdi-open-in-new</v-icon
              ><span class="sr-only"> (opens in a new tab)</span></a
            >
            <router-link v-else :to="item.fullPath" class="card-title-link"
              ><span v-html="highlight(item.title)"></span
            ></router-link>
          </h2>
        </div>
        <div
          v-if="item.abstract"
          v-html="highlight(truncate(item.abstract))"
        ></div>
        <div
          v-else-if="item.summary"
          v-html="highlight(truncate(item.summary))"
          class="mt-2 mb-2"
        ></div>
        <router-link
          v-for="tag of item.tags"
          :key="tag"
          :to="searchFor(tag)"
          class="px-2 py-1 mr-3 search-tag lato"
          :class="{ 'search-tag-hit': tagHit(tag) }"
          >{{ tag }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { highlightHtml, holdsSearchWord } from "@/utils/highlight";
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
import { goToSearch, openInNewTab, searchLocation } from "@/utils/search";
import { isClickOnLink } from "@/utils/focus";
import { goToOptions } from "@/utils/motion";
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
  computed: {
    // A record for another site carries its whole address.
    isExternal() {
      return /^https?:\/\//i.test((this.item && this.item.fullPath) || "");
    },
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
    // Marks the search terms in a title or summary (src/utils/highlight.js).
    highlight(html) {
      return this.query ? highlightHtml(html, this.query) : html;
    },
    // A tag that holds a typed word, whole or in part, is shown as a hit: the
    // tags are small and easy to miss.
    tagHit(tag) {
      return Boolean(this.query) && holdsSearchWord(tag, this.query);
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
      // As on the title link, Ctrl or Command with the click opens a new tab.
      if (e.metaKey || e.ctrlKey) {
        openInNewTab(this.item.fullPath);
        return;
      }
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
      // A result opens in this tab. On the /search page that used to be a new
      // tab, to keep the result list (the #1 complaint about the old modal
      // was losing it the moment a hit was clicked); since v1.5.87 the search
      // page returns to the list on Back, as it was left. Inside the modal
      // the dialog is closed first, as before.
      if (!this.isStatic) EventBus.$emit("closeSearch");
      // Another site: a new tab, as its title link opens.
      if (this.isExternal) {
        openInNewTab(path);
        return;
      }
      this.$router.push(path).catch(() => {
        this.$vuetify.goTo(0, goToOptions());
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
/* A search term found in a result's title or summary. Black on pale yellow is
   18:1; the hover rule keeps it readable when the title link turns black. */
.search-hit {
  background-color: #fff2a8;
  color: #000000;
  border-radius: 2px;
  padding: 0 1px;
}
@media (forced-colors: active) {
  .search-hit,
  .v-application a.search-tag-hit {
    background-color: Mark;
    color: MarkText;
  }
}
/* Each tag is one box. As inline text a tag that did not fit on its line
   broke onto the next as two pieces, and its padding overlapped the lines
   above and below: at 375 px the middle of 9 focused tags was a neighbouring
   tag. */
.search-tag {
  display: inline-block;
  margin-top: 6px;
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
/* A tag that holds a typed word: the marks' pale yellow (black on it is 18:1)
   and a dark ring, 6:1 on the yellow, so the hit does not rest on colour
   alone. The ring is drawn inside the chip: its size does not change. */
.search-tag-hit {
  background: #fff2a8;
  box-shadow: inset 0 0 0 1px #595959;
}
.search-tag-hit:hover {
  background: #ffe97a;
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

<template>
  <div>
    <v-container :fluid="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
      ><v-col cols="12">
        <h1>Search the ICJIA ResearchHub</h1>
        <v-form class="pl-2">
          <v-text-field
            ref="textfield"
            v-model="query"
            label="Search"
            placeholder="Search"
            @input="instantSearch"
          />
          <div style="font-size: 12px" class="text-right mb-9">
            {{ queryResults.length }} result{{ resultNumber }}
          </div>

          <div v-if="query && query.length" class="mb-12">
            <div
              v-for="(result, index) in queryResults"
              :key="index"
              class="my-2"
            >
              <v-card
                elevation="1"
                color="#f1f3f5"
                @click="route(result)"
                class="hover py-2 px-2 mb-5 card"
              >
                <v-card-text>{{ result.item.contentType }}</v-card-text>
                <div v-if="result.item.title">
                  <span
                    style="font-size: 20px; font-weight: bold"
                    class="ml-3"
                    v-html="result.item.title"
                  ></span>
                </div>
                <v-card-text>{{ result.item.abstract }}</v-card-text>
                <v-card-text v-if="result.item.authors"
                  ><div v-html="result.item.authors"></div
                ></v-card-text>
              </v-card>
            </div>
          </div>
        </v-form> </v-col
    ></v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import DOMPurify from "dompurify";
import Fuse from "fuse.js";
import _ from "lodash";
import searchIndex from "@/hub.json";
function sortByKey(array, key) {
  return array.sort(function (a, b) {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}
// const highlight = (fuseSearchResult, highlightClassName = "highlight") => {
//   const set = (obj, path, value) => {
//     const pathValue = path.split(".");
//     let i;
//     for (i = 0; i < pathValue.length - 1; i++) {
//       obj = obj[pathValue[i]];
//     }
//     obj[pathValue[i]] = value;
//   };
//   const generateHighlightedText = (inputText, regions = []) => {
//     let content = "";
//     let nextUnhighlightedRegionStartingIndex = 0;
//     regions.forEach((region) => {
//       const lastRegionNextIndex = region[1] + 1;
//       content += [
//         inputText.substring(nextUnhighlightedRegionStartingIndex, region[0]),
//         `<span class="${highlightClassName}">`,
//         inputText.substring(region[0], lastRegionNextIndex),
//         "</span>",
//       ].join("");
//       nextUnhighlightedRegionStartingIndex = lastRegionNextIndex;
//     });
//     content += inputText.substring(nextUnhighlightedRegionStartingIndex);
//     return content;
//   };
//   return fuseSearchResult
//     .filter(({ matches }) => matches && matches.length)
//     .map(({ item, matches }) => {
//       const highlightedItem = Object.assign({}, item);
//       matches.forEach((match) => {
//         set(
//           highlightedItem,
//           match.key,
//           generateHighlightedText(match.value, match.indices)
//         );
//       });
//       return highlightedItem;
//     });
// };
export default {
  data() {
    return {
      query: "",
      queryResults: [],
      content: "",
      fuse: null,
      resultNumber: "s",
    };
  },
  created() {
    this.fuse = new Fuse(searchIndex, this.$myApp.config.search.hub);
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.textfield.focus();
      this.query = "";
    });
  },
  methods: {
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
    route(item) {
      this.$router.push(item.route);
    },
    instantSearch() {
      //this.queryResults = highlight(this.fuse.search(this.query));
      this.queryResults = this.fuse.search(this.query);
      //console.log(this.queryResults);
    },
    displayHeadings(headings) {
      if (typeof headings === "string") {
        return headings;
      }
      return null;
    },
  },
  head() {
    return {
      title: "Search",
    };
  },
};
</script>

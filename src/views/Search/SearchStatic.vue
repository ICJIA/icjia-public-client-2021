<template>
  <div class="mt-12">
    <v-container>
      <h1>Search ICJIA</h1>
      <v-sheet color="#fff" class="px-3 py-1" style="min-height: 100vh">
        <div class="">
          <v-form class="pl-2 mt-4" style="margin-top: -15px">
            <v-text-field
              ref="textfield"
              clearable
              autofocus
              v-model="query"
              label="Search"
              placeholder="Search"
              aria-label="Search ICJIA"
              @input="debouncedSearch"
              style="font-weight: 900"
            />
            <!--
              Filter toolbar — replaces the heavy navy panel + select that
              used to live here. Pattern: a quiet single-line summary
              ("17 of 96 results for 'domestic'") above an inline chip row
              of available content types with their counts. Chips that
              have zero hits for the current query are hidden so the row
              stays scannable. The active chip inverts (solid #1565c0 on
              white) so it's obvious which filter is on. One click = one
              filter applied; no dropdown indirection.
            -->
            <div
              v-if="query && query.length"
              class="search-toolbar"
              role="region"
              aria-label="Filter search results"
            >
              <div class="search-toolbar__summary">
                <span class="search-toolbar__count">
                  <strong>{{ filteredResults.length }}</strong>
                  of <strong>{{ queryResults.length }}</strong> result{{
                    queryResults.length === 1 ? "" : "s"
                  }}
                </span>
                <span class="search-toolbar__for">
                  for <em>&ldquo;{{ query }}&rdquo;</em>
                </span>
              </div>

              <div
                class="search-toolbar__chips"
                role="group"
                aria-label="Filter by content type"
              >
                <button
                  v-for="chip in availableFilterChips"
                  :key="chip.value || 'all'"
                  type="button"
                  class="filter-chip"
                  :class="{ 'filter-chip--active': isChipActive(chip) }"
                  :aria-pressed="isChipActive(chip) ? 'true' : 'false'"
                  @click="selectChip(chip)"
                >
                  {{ chip.label }}
                  <span class="filter-chip__count">{{ chip.count }}</span>
                </button>
              </div>
            </div>

            <!-- <div style="font-size: 12px" class="mb-9 d-flex">
              <v-select
                :items="contentItems"
                v-model="contentSelected"
                label="Select filter"
                dense
                solo
              ></v-select>
              <v-spacer></v-spacer>
              <span style="font-weight: 900" v-if="query && query.length">
                Displaying {{ queryResults.length }} result{{
                  resultNumber
                }}</span
              > -->
            <!-- <v-switch
                v-model="sortSwitch"
                :label="`Sort by published date`"
                @click="sortResults()"
              ></v-switch> -->
            <!-- </div> -->

            <!-- Query vars: {{ $route.query.filter }} -->

            <div v-if="query && query.length" class="mt-12 mb-12">
              <div
                v-for="(result, index) in filteredResults"
                :key="index"
                class="my-4"
              >
                <SearchCard
                  :item="result.item"
                  :query="query"
                  :elevation="5"
                  :isStatic="true"
                ></SearchCard>
              </div>
              <!-- Empty state — was: silent empty list. Now tells the
                   user no hits matched and offers a recovery path. -->
              <div
                v-if="query.length >= 2 && fuse && queryResults.length === 0"
                class="search-empty"
              >
                <p class="search-empty__title">
                  No results for <em>&ldquo;{{ query }}&rdquo;</em>.
                </p>
                <p class="search-empty__hint">
                  Try a shorter or differently-spelled term, or
                  <router-link to="/researchhub/articles"
                    >browse all articles</router-link
                  >, <router-link to="/news/">news</router-link>, or
                  <router-link to="/grants/">grants</router-link>.
                </p>
              </div>
              <div
                v-else-if="query.length > 0 && query.length < 2"
                class="search-empty search-empty--hint"
              >
                Keep typing — search starts at 2 characters.
              </div>
            </div>
          </v-form>
        </div>
      </v-sheet>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
/* eslint-disable no-unused-vars */
import DOMPurify from "dompurify";
import Fuse from "fuse.js";
import _ from "lodash";
import NProgress from "@/services/Progress";
function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
export default {
  data() {
    return {
      sortSwitch: false,
      searchFilter: null,
      searchModal: false,
      opts: null,
      query: null,
      filter: null,

      contentItems: [
        "No filter",
        "Articles",
        "Pages",
        "Biographies",
        "Programs",
        "Funding Announcements",
        "Meetings",
        "News",
        "Job Listings",
      ],
      contentValues: [
        null,
        "article",
        "page",
        "biography",
        "program",
        "funding",
        "meeting",
        "news",
        "employment",
      ],
      contentSelected: "No filter",
      queryResults: [],
      filteredResults: [],
      content: "",
      searchInput: this.$refs.textfield,
      fuse: null,
      searchSeq: 0,
      resultNumber: "s",
      arrayToList,
      getProperCategory,
    };
  },
  async created() {
    NProgress.start();
    // Debounce the input handler so typing fires one Fuse search per
    // pause instead of one per keystroke. 250ms is the sweet spot —
    // fast enough to feel live, slow enough to skip mid-word work.
    this.debouncedSearch = _.debounce(this.instantSearch, 250);
    // let searchURL;
    // if (process.env.NODE_ENV === "development") {
    //   searchURL = "/.netlify/functions/search";
    // } else {
    //   searchURL = "https://icjia.illinois.gov/api/search";
    // }
    // let response = await fetch(searchURL);
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
    // let data = await response.json();
    // const fuse = new Fuse(data.message, this.$myApp.config.search.site);
    // this.$myApp.fuse = fuse;
    // console.warn(
    //   "Getting search data from lambda. Length: ",
    //   data.message.length
    // );
    this.fuse = await this.$myApp.getFuse();
    NProgress.done();
    // Run the initial query now that fuse is ready. This used to live in
    // mounted() and raced the async getFuse() — clicking a tag link would
    // navigate here, mount synchronously, and crash on this.fuse.search()
    // before getFuse resolved.
    if (this.$route.params.query) {
      this.query = decodeURIComponent(this.$route.params.query);
      this.instantSearch();
      this.filterResults(null);
    }
  },
  mounted() {
    // Always land with the cursor in the search input. The HTML5
    // `autofocus` attribute on the v-text-field only fires once per
    // element mount, which is unreliable across Vue Router transitions
    // (the SearchStatic component is reused when navigating from
    // /search → /search/foo, so autofocus doesn't re-run). Explicit
    // focus() guarantees the cursor lands here regardless of how the
    // user got here — header icon, footer icon, tag click, direct URL,
    // or browser back/forward. Inlined (not delegated to a method) so
    // that partial-HMR cache scenarios can never strand it.
    this.$nextTick(() => {
      const tf = this.$refs.textfield;
      if (tf && typeof tf.focus === "function") tf.focus();
    });
  },
  computed: {
    // Unique content-type chips for the toolbar, sorted by count desc.
    // "All" leads, then each contentType present in current results.
    // Hidden when no results yet so the empty toolbar doesn't flash.
    availableFilterChips() {
      if (!this.queryResults.length) return [];
      const counts = {};
      for (const r of this.queryResults) {
        const t = (r.item && r.item.contentType) || "other";
        counts[t] = (counts[t] || 0) + 1;
      }
      const chips = Object.keys(counts)
        .map((t) => ({
          value: t,
          label: this.prettifyType(t),
          count: counts[t],
        }))
        .sort((a, b) => b.count - a.count);
      return [
        { value: null, label: "No filter", count: this.queryResults.length },
        ...chips,
      ];
    },
  },
  watch: {
    contentSelected(newValue, oldValue) {
      let arrayPosition = null;
      if (newValue !== oldValue) {
        arrayPosition = this.contentItems.indexOf(newValue);
      } else {
        arrayPosition = 0;
      }
      this.filterResults(this.contentValues[arrayPosition]);
    },
    query() {
      this.filterResults(null);
      this.contentSelected = "No filter";
    },
    // React to in-page navigations to a new query (e.g. user clicks a
    // tag chip on the result page itself, which calls goToSearch and
    // pushes /search/:newQuery). Without this watcher the URL changes
    // but the query input stays on the previous term until refresh.
    // Also handles the "header search icon clicked" case: nav goes to
    // /search (no query param), and we clear the input + results so
    // the user lands on a fresh search page.
    "$route.params.query"(next) {
      if (next) {
        const decoded = decodeURIComponent(next);
        if (decoded === this.query) return;
        this.query = decoded;
        this.instantSearch();
      } else {
        // Header search icon (or footer / context bar) was clicked
        // — wipe the previous search so the user can start over.
        this.query = "";
        this.queryResults = [];
        this.filteredResults = [];
        this.contentSelected = "No filter";
        this.focusSearchInput();
      }
    },
    "$route.query.filter"(next) {
      // Optional ?filter=article|news|... param sets the dropdown so
      // tag clicks from the news section land filtered to news, etc.
      if (!next) return;
      const idx = this.contentValues.indexOf(next);
      if (idx >= 0 && this.contentItems[idx] !== this.contentSelected) {
        this.contentSelected = this.contentItems[idx];
      }
    },
  },
  methods: {
    focusSearchInput() {
      // Vuetify's v-text-field exposes a $refs.textfield wrapper whose
      // own .focus() walks down to the inner <input>. Wrapped in
      // $nextTick so it runs after the template is in the DOM (matters
      // for the watcher path where focus is called inside the watcher
      // body, not at mount time).
      this.$nextTick(() => {
        const tf = this.$refs.textfield;
        if (tf && typeof tf.focus === "function") tf.focus();
      });
    },
    isChipActive(chip) {
      // The "All" chip carries value:null and represents the "No filter"
      // state stored in contentSelected. Every other chip carries the raw
      // contentType string and matches contentSelected directly.
      if (chip.value === null) return this.contentSelected === "No filter";
      return chip.value === this.contentSelected;
    },
    selectChip(chip) {
      this.contentSelected = chip.value === null ? "No filter" : chip.value;
    },
    prettifyType(t) {
      // Map raw contentType strings (e.g. "article") to display labels
      // ("Articles") that read naturally in the chip row. Plural where
      // it makes grammatical sense; falls back to title-cased input.
      const map = {
        article: "Articles",
        page: "Pages",
        biography: "Biographies",
        program: "Programs",
        funding: "Funding",
        meeting: "Meetings",
        news: "News",
        employment: "Job Listings",
        dataset: "Datasets",
        app: "Apps",
        publication: "Publications",
      };
      if (map[t]) return map[t];
      return t.charAt(0).toUpperCase() + t.slice(1);
    },
    filterResults() {
      this.filter = this.contentSelected;
      if (this.filter === "No filter") {
        this.filteredResults = this.queryResults;
      } else {
        this.filteredResults = _.filter(this.queryResults, [
          "item.contentType",
          this.filter,
        ]);
      }
    },
    async sortResults() {
      if (!this.fuse) return;
      console.log("sorting");
      this.queryResults = await this.fuse.search(this.query.trim());
      if (this.sortSwitch) {
        await this.instantSearch();
        this.queryResults = _.orderBy(
          this.queryResults,
          ["item.publicationDate"],
          ["desc"]
        );
      } else {
        await this.instantSearch();
      }
    },
    focusInput() {
      this.$refs.textfield.focus();
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
    async instantSearch() {
      if (!this.query) return;
      if (!this.query.length) return;
      if (this.query.length < 2) return;
      if (!this.fuse) return;
      // Sequence guard discards stale worker responses if the user types
      // faster than the worker can reply.
      const seq = ++this.searchSeq;
      const results = await this.fuse.search(this.query.trim());
      if (seq !== this.searchSeq) return;
      this.queryResults = results;
      let contentTypes = this.queryResults.map((item) => {
        return item.item.contentType;
      });
      const uniques = [...new Set(contentTypes.map((item) => item))].sort();
      uniques.unshift("No filter");
      this.contentItems = uniques;
      this.filterResults(null);
      this.contentSelected = "No filter";
      //iterate through all queryresults
    },
    displayHeadings(headings) {
      if (typeof headings === "string") {
        return headings;
      }
      return null;
    },
  },
};
</script>

<style>
.author {
  font-weight: 700;
  color: #222;
}
.author:hover {
  color: #000;
}

/* Search-results filter toolbar — replaces the old navy panel + select.
   Quiet single-line summary on top, chip row beneath. Chips are buttons
   so keyboard users can Tab through them; aria-pressed reflects state. */
.search-toolbar {
  margin-top: 4px;
  padding: 14px 4px 6px;
  border-top: 1px solid #e6e6e6;
  border-bottom: 1px solid #e6e6e6;
}

.search-toolbar__summary {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.4;
}

.search-toolbar__count strong {
  font-weight: 700;
  color: #000;
}

.search-toolbar__for {
  color: #666;
}

.search-toolbar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #fff;
  color: #000;
  border: 2px solid #222;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  line-height: 1.4;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease,
    border-color 0.12s ease;
}

.filter-chip:hover {
  background: #1565c0;
  color: #fff;
  border-color: #1565c0;
}

.filter-chip--active,
.filter-chip--active:hover {
  background: #000;
  color: #fff;
  border-color: #000;
}

.filter-chip__count {
  font-size: 10px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
  padding: 1px 6px;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
}

.filter-chip--active .filter-chip__count,
.filter-chip:hover .filter-chip__count {
  background: rgba(255, 255, 255, 0.22);
}

.search-empty {
  padding: 32px 16px;
  text-align: center;
  color: #333;
}

.search-empty__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #000;
}

.search-empty__hint {
  font-size: 14px;
  color: #555;
  margin: 0;
}

.search-empty__hint a {
  color: #1565c0;
  text-decoration: underline;
}

.search-empty--hint {
  font-size: 13px;
  color: #777;
  font-style: italic;
}
</style>

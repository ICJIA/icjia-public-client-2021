<template>
  <div class="mt-12">
    <v-container>
      <h1>Search ICJIA</h1>
      <v-sheet color="#fff" class="px-3 py-1" style="min-height: 100vh">
        <div class="">
          <!-- Enter in the field runs the search in place. It submitted the
               form, which reloaded the page ("/search/violence?") and lost
               the chosen filter and anything typed since the page loaded. -->
          <v-form
            class="pl-2 mt-4"
            style="margin-top: -15px"
            @submit.prevent="onSearchSubmit"
          >
            <!-- No placeholder: it repeated the label, which stays in view,
                 in #9e9e9e, 2.68:1 (WCAG 1.4.3). -->
            <v-text-field
              ref="textfield"
              clearable
              autofocus
              v-model="query"
              label="Search"
              aria-label="Search ICJIA"
              @input="onQueryInput"
              style="font-weight: 900"
            />
            <!-- The result count and the no-results and keep-typing messages
                 are status messages (WCAG 4.1.3). This region repeats the text
                 shown below once typing has paused for a second and the
                 results for the query have arrived, and not again while the
                 message is unchanged; a filter chip's result is announced at
                 once. -->
            <div class="sr-only" role="status" aria-live="polite">
              {{ statusMessage }}
            </div>
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
                <!-- How many of them hold the typed words: the rest are a
                     letter away, or hold the word inside a longer one, and
                     are listed after them, folded away. -->
                <div
                  v-if="similarResults.length"
                  class="search-toolbar__groups"
                >
                  <span v-if="wordResults.length"
                    ><strong>{{ wordResults.length }}</strong> contain{{
                      wordResults.length === 1 ? "s" : ""
                    }}
                    {{ quotedWords }}</span
                  >
                  <span v-else>None contain {{ quotedWords }}</span>
                  &middot; <strong>{{ similarResults.length }}</strong> similar
                </div>
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

            <div
              v-if="query && query.length"
              class="mt-12 mb-12"
              @focusin="noteResult"
              @click.capture="noteResult"
            >
              <div
                v-for="(result, index) in visibleWordResults"
                :key="index"
                :data-result-index="index"
                class="my-4"
              >
                <!-- The cards highlight the query that produced these results,
                     not the text being typed: given the live text, every card
                     re-rendered on every keystroke. -->
                <SearchCard
                  :item="result.item"
                  :query="searchedQuery"
                  :elevation="5"
                  :isStatic="true"
                ></SearchCard>
              </div>
              <!-- Similar results: a letter away from a typed word ("Sharone",
                   "the Job Done" for "drone"), or holding it inside a longer
                   word. After the last result that holds the words, folded
                   away until asked for (a disclosure: the button says whether
                   it is open, and focus stays on it); open from the start when
                   they are all there is, as for a misspelt word. -->
              <div
                v-if="
                  similarResults.length &&
                  visibleWordResults.length === wordResults.length
                "
                class="search-similar"
              >
                <h2 class="search-similar__title">
                  Similar spellings and partial matches
                </h2>
                <p class="search-similar__note">{{ similarNote }}</p>
                <v-btn
                  v-if="wordResults.length"
                  :aria-expanded="similarOpen ? 'true' : 'false'"
                  aria-controls="search-similar-results"
                  @click="toggleSimilar()"
                >
                  <template v-if="similarOpen">Hide similar results</template>
                  <template v-else
                    >Show {{ similarResults.length }} similar result{{
                      similarResults.length === 1 ? "" : "s"
                    }}</template
                  >
                </v-btn>
              </div>
              <div id="search-similar-results">
                <div
                  v-for="(result, index) in visibleSimilarResults"
                  :key="wordResults.length + index"
                  :data-result-index="wordResults.length + index"
                  class="my-4"
                >
                  <SearchCard
                    :item="result.item"
                    :query="searchedQuery"
                    :elevation="5"
                    :isStatic="true"
                  ></SearchCard>
                </div>
              </div>
              <!-- Fifty results at a time: rendering every result froze the
                   page when a long list arrived. As on the Research Hub's
                   articles page, the count is shown and focus moves to the
                   first new result (WCAG 2.4.3). -->
              <div
                v-if="visibleResults.length < listedResults.length"
                class="text-center mt-8"
              >
                <v-btn @click="showMore()">Show more results</v-btn>
              </div>
              <div
                v-if="listedResults.length > resultsPerPage"
                class="text-center mt-3"
                style="font-size: 12px; font-weight: 900"
              >
                <span v-if="visibleResults.length < listedResults.length"
                  >Showing {{ visibleResults.length }} of
                  {{ listedResults.length }} results</span
                >
                <span v-else
                  >Showing all {{ listedResults.length }} results</span
                >
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
import { goToOptions } from "@/utils/motion";
import { searchLocation } from "@/utils/search";
import { searchWords } from "@/utils/searchFields";
import {
  historyKey,
  keepSearchView,
  keptSearchView,
} from "@/utils/searchReturn";
function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
const KEEP_TYPING = "Keep typing — search starts at 2 characters.";
// Research Hub pages send their author and tag searches here with ?filter=hub.
// "hub" is not a content type: it stands for the three types the Hub publishes.
const HUB_TYPES = ["article", "web application", "dataset"];
// Results are rendered this many at a time; "Show more results" adds as many.
const RESULTS_PER_PAGE = 50;
export default {
  metaInfo: {
    title: "Search ICJIA",
  },
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
      // True while a search that came from the address (a link, a reload) is
      // running: its ?filter= is applied. A typed search clears the filter.
      searchFromRoute: false,
      // This page's history entry, noted while it is the current one: by the
      // time the page is destroyed the browser is on the next entry.
      entryKey: null,
      // The result that last had focus or was clicked: Back returns to it.
      lastResultIndex: null,
      queryResults: [],
      filteredResults: [],
      resultsPerPage: RESULTS_PER_PAGE,
      shownCount: RESULTS_PER_PAGE,
      // Whether the similar results have been asked for.
      showSimilar: false,
      content: "",
      searchInput: this.$refs.textfield,
      fuse: null,
      searchSeq: 0,
      statusMessage: "",
      lastAnnounced: "",
      searchedQuery: null,
      announceWhenSearched: false,
      resultNumber: "s",
      arrayToList,
      getProperCategory,
    };
  },
  async created() {
    this.entryKey = historyKey();
    NProgress.start();
    // Debounce the input handler so typing fires one Fuse search per
    // pause instead of one per keystroke. 250ms is the sweet spot —
    // fast enough to feel live, slow enough to skip mid-word work.
    this.debouncedSearch = _.debounce(this.instantSearch, 250);
    // The result is announced a second after the last keystroke, not after
    // every search: typing slowly announced a count after each key.
    this.debouncedAnnounce = _.debounce(this.announceResults, 1000);
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
      this.announceWhenSearched = true;
      this.searchFromRoute = true;
      this.instantSearch();
      this.filterResults(null);
    }
  },
  // Leaving for another page, or for another search: the view is kept now,
  // while it can still be read. By beforeDestroy the results have left the
  // document and the browser has pulled the scroll position in.
  beforeRouteLeave(to, from, next) {
    this.keepView();
    next();
  },
  beforeRouteUpdate(to, from, next) {
    this.keepView();
    next();
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
    // The results that hold every typed word, and the rest, which the search
    // marks similar and lists after them (src/utils/searchFields.js).
    wordResults() {
      return this.filteredResults.filter((result) => !result.similar);
    },
    similarResults() {
      return this.filteredResults.filter((result) => result.similar);
    },
    // Similar results are folded away until asked for, unless they are all
    // there is (a misspelt word).
    similarOpen() {
      return this.showSimilar || !this.wordResults.length;
    },
    listedResults() {
      return this.similarOpen ? this.filteredResults : this.wordResults;
    },
    // The results on the page: the first fifty of the list, and fifty more
    // for each "Show more results".
    visibleResults() {
      return this.listedResults.slice(0, this.shownCount);
    },
    visibleWordResults() {
      return this.visibleResults.filter((result) => !result.similar);
    },
    visibleSimilarResults() {
      return this.visibleResults.filter((result) => result.similar);
    },
    // The words the results were searched for ("use of force": use, force),
    // and as they are named on the page: “use” and “force”.
    searchedWords() {
      return searchWords(this.searchedQuery || this.query);
    },
    quotedWords() {
      return this.arrayToList(this.searchedWords.map((word) => `“${word}”`));
    },
    similarNote() {
      const count = this.similarResults.length;
      const lacking =
        this.searchedWords.length > 1
          ? `every word (${this.quotedWords})`
          : `the word ${this.quotedWords}`;
      return count === 1
        ? `This result does not contain ${lacking}. It matches a similar spelling, or part of a longer word.`
        : `These ${count} results do not contain ${lacking}. They match a similar spelling, or part of a longer word.`;
    },
    // Unique content-type chips for the toolbar, sorted by count desc.
    // "All" leads, then the Research Hub and its types, then each other
    // contentType present in current results.
    // Hidden when no results yet so the empty toolbar doesn't flash.
    availableFilterChips() {
      if (!this.queryResults.length) return [];
      const counts = {};
      for (const r of this.queryResults) {
        const t = (r.item && r.item.contentType) || "other";
        counts[t] = (counts[t] || 0) + 1;
      }
      const chip = (t) => ({
        value: t,
        label: this.prettifyType(t),
        count: counts[t],
      });
      const chips = Object.keys(counts)
        .filter((t) => !HUB_TYPES.includes(t))
        .map(chip)
        .sort((a, b) => b.count - a.count);
      // The Research Hub chip, then the Hub's own types side by side, in the
      // order of the Research menu.
      const hubTypes = HUB_TYPES.filter((t) => counts[t]).map(chip);
      const hub = hubTypes.length
        ? [
            {
              value: "hub",
              label: "Research Hub",
              count: hubTypes.reduce((n, c) => n + c.count, 0),
            },
            ...hubTypes,
          ]
        : [];
      return [
        { value: null, label: "No filter", count: this.queryResults.length },
        ...hub,
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
        this.announceWhenSearched = true;
        this.searchFromRoute = true;
        this.instantSearch();
      } else {
        // Header search icon (or footer / context bar) was clicked
        // — wipe the previous search so the user can start over.
        this.query = "";
        this.queryResults = [];
        this.filteredResults = [];
        this.contentSelected = "No filter";
        this.statusMessage = "";
        this.lastAnnounced = "";
        this.focusSearchInput();
      }
    },
    "$route.query.filter"(next) {
      // Optional ?filter=hub|article|news|... selects that filter chip, so
      // a tag or author link from the Research Hub lands on Hub content.
      if (!next) return;
      this.contentSelected = this.routeFilter();
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
    // The filter named in the address, when the results offer it as a chip.
    routeFilter() {
      const wanted = this.$route.query.filter;
      const offered = this.availableFilterChips.some(
        (chip) => chip.value !== null && chip.value === wanted
      );
      return offered ? wanted : "No filter";
    },
    selectChip(chip) {
      this.contentSelected = chip.value === null ? "No filter" : chip.value;
      this.syncAddress();
      // After the filter has been applied.
      this.$nextTick(() => this.announceStatus(this.resultStatus()));
    },
    // Writes the search on the page (query and filter chip) into the address,
    // so Back, a reload, a bookmark and a shared link all return to it. The
    // browser's replaceState, not the router: a new route would rebuild this
    // page while the visitor is typing (App.vue keys the view by its address)
    // and add a history entry for every search. The router's state object is
    // kept, so the entry keeps its key and its saved scroll position.
    syncAddress() {
      const query = (this.searchedQuery || "").trim();
      const filter =
        query && this.contentSelected !== "No filter"
          ? this.contentSelected
          : null;
      const href = this.$router.resolve(searchLocation({ query, filter })).href;
      if (href === window.location.pathname + window.location.search) return;
      window.history.replaceState(window.history.state, "", href);
    },
    // Leaving the page: what the address cannot say is kept for this history
    // entry (src/utils/searchReturn.js).
    keepView() {
      const query = (this.searchedQuery || "").trim();
      if (!query) return;
      keepSearchView(this.entryKey, {
        query,
        shownCount: this.shownCount,
        showSimilar: this.showSimilar,
        scrollY: window.scrollY,
        focusIndex: this.lastResultIndex,
      });
    },
    // The router moves focus to the page before it asks this page to leave
    // for another search, so the result in use is noted as focus and clicks
    // land in the list.
    noteResult(event) {
      const target = event.target;
      const result =
        target && target.closest && target.closest("[data-result-index]");
      this.lastResultIndex = result ? Number(result.dataset.resultIndex) : null;
    },
    // Back (or Forward) to a search left from this history entry: as many
    // results showing, similar ones too if they were, the page scrolled to the
    // same place, focus on the
    // result that was opened (WCAG 2.4.3). After the filter's watcher, which
    // starts the list again from the first fifty.
    restoreView() {
      const query = (this.searchedQuery || "").trim();
      const view = keptSearchView(this.entryKey, query);
      if (!view) return;
      this.$nextTick(() => {
        this.showSimilar = Boolean(view.showSimilar);
        this.shownCount = view.shownCount;
        this.$nextTick(() => {
          window.scrollTo(0, view.scrollY);
          if (view.focusIndex === null) return;
          const link = this.$el.querySelector(
            `[data-result-index="${view.focusIndex}"] a.card-title-link`
          );
          if (link) link.focus({ preventScroll: true });
        });
      });
    },
    // The text of the visible summary or no-results message. The query is
    // trimmed, as it is for the search, so a trailing space is not a new
    // message.
    resultStatus() {
      const count = this.queryResults.length;
      const query = (this.query || "").trim();
      if (!count) return `No results for “${query}”.`;
      const status = `${this.filteredResults.length} of ${count} result${
        count === 1 ? "" : "s"
      } for “${query}”`;
      // The two groups, when there are two.
      const similar = this.similarResults.length;
      if (!similar) return status;
      const held = this.wordResults.length;
      if (!held)
        return `${status}. None contain ${this.quotedWords}; these are similar spellings and partial matches.`;
      const results = `${similar} similar result${similar === 1 ? "" : "s"}`;
      return `${status}. ${held} contain${held === 1 ? "s" : ""} ${
        this.quotedWords
      }; ${results} ${
        this.showSimilar ? `follow${similar === 1 ? "s" : ""}` : "can be shown"
      }.`;
    },
    // Cleared first, so a message that repeats the last one is still heard:
    // a filter chip's result is announced at once, every time.
    announceStatus(message) {
      this.lastAnnounced = message;
      this.statusMessage = "";
      this.$nextTick(() => {
        this.statusMessage = message;
      });
    },
    // Typing: search shortly after each keystroke, and announce the result
    // once typing has paused (WCAG 4.1.3).
    onQueryInput() {
      this.announceWhenSearched = false;
      this.debouncedSearch();
      this.debouncedAnnounce();
    },
    // Enter: a search still waiting for typing to pause runs now, and the
    // result is announced as soon as it is ready, even when it repeats the
    // last announcement. The query is not searched again, which would reset
    // the chosen filter.
    onSearchSubmit() {
      this.debouncedSearch.flush();
      this.debouncedAnnounce.cancel();
      const query = this.query || "";
      if (!query.length) return;
      if (query.length < 2) {
        this.announceStatus(KEEP_TYPING);
      } else if (this.searchedQuery !== query) {
        this.announceWhenSearched = true;
      } else {
        this.announceStatus(this.resultStatus());
      }
    },
    // A second after the last keystroke: announce the result for the query in
    // the field, or, if its search is still running, as soon as it is done.
    announceResults() {
      const query = this.query || "";
      if (!query.length) return;
      if (query.length < 2) {
        this.announceOnce(KEEP_TYPING);
      } else if (this.searchedQuery !== query) {
        this.announceWhenSearched = true;
      } else {
        this.announceOnce(this.resultStatus());
      }
    },
    // Not repeated while the message is unchanged.
    announceOnce(message) {
      if (message === this.lastAnnounced) return;
      this.lastAnnounced = message;
      this.statusMessage = message;
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
        "web application": "Web Applications",
        "partner site": "Partner Sites",
        plan: "Plans",
        app: "Apps",
        publication: "Publications",
      };
      if (map[t]) return map[t];
      return t.charAt(0).toUpperCase() + t.slice(1);
    },
    // Opens or folds the similar results. Opened, a page of them is shown
    // whatever the count had reached: fifty results that hold the words would
    // otherwise be followed by none.
    toggleSimilar() {
      this.showSimilar = !this.showSimilar;
      if (this.showSimilar)
        this.shownCount = Math.max(
          this.shownCount,
          this.wordResults.length + RESULTS_PER_PAGE
        );
    },
    showMore() {
      const firstNew = this.shownCount;
      this.shownCount += RESULTS_PER_PAGE;
      this.$nextTick(() => {
        const link = this.$el.querySelector(
          `[data-result-index="${firstNew}"] a.card-title-link`
        );
        if (link) link.focus();
      });
    },
    // New results, or another filter, start again from the first fifty, with
    // the similar results folded away.
    filterResults() {
      this.shownCount = RESULTS_PER_PAGE;
      this.showSimilar = false;
      this.filter = this.contentSelected;
      if (this.filter === "No filter") {
        this.filteredResults = this.queryResults;
      } else if (this.filter === "hub") {
        this.filteredResults = this.queryResults.filter((result) =>
          HUB_TYPES.includes(result.item.contentType)
        );
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
        this.$vuetify.goTo(0, goToOptions());
      });
    },
    async instantSearch() {
      const fromRoute = this.searchFromRoute;
      this.searchFromRoute = false;
      if (!this.query || !this.query.length) {
        this.statusMessage = "";
        this.lastAnnounced = "";
        // The box was cleared: so is the search in the address.
        this.searchedQuery = null;
        this.syncAddress();
        return;
      }
      if (this.query.length < 2) {
        if (this.announceWhenSearched) {
          this.announceWhenSearched = false;
          this.announceOnce(KEEP_TYPING);
        }
        return;
      }
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
      this.contentSelected = fromRoute ? this.routeFilter() : "No filter";
      this.filterResults(null);
      this.searchedQuery = this.query;
      if (fromRoute) this.restoreView();
      else this.syncAddress();
      if (this.announceWhenSearched) {
        this.announceWhenSearched = false;
        // Once the filter reset above has been applied.
        this.$nextTick(() => this.announceOnce(this.resultStatus()));
      }
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

/* Only the active chip's count gets the light tint. On a hovered chip it
   turned the badge behind the white count to #4887ce, 3.73:1 (WCAG 1.4.3);
   the count keeps its dark tint over the hover blue instead. */
.filter-chip--active .filter-chip__count {
  background: rgba(255, 255, 255, 0.22);
}

.search-toolbar__groups {
  margin-top: 2px;
}

.search-toolbar__groups strong {
  font-weight: 700;
  color: #000;
}

/* The similar results' heading, note and button, between the two lists. */
.search-similar {
  margin: 40px 0 8px;
  padding: 24px 16px 8px;
  border-top: 1px solid #e6e6e6;
  text-align: center;
}

.search-similar__title {
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin: 0 0 6px;
}

.search-similar__note {
  font-size: 14px;
  color: #333;
  margin: 0 0 16px;
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

/* #777 was 4.48:1 on white (WCAG 1.4.3); #666 is 5.74:1. */
.search-empty--hint {
  font-size: 13px;
  color: #666;
  font-style: italic;
}
</style>

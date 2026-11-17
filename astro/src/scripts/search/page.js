// The search page (/search/ and /search/<query>/), v1.5.146: a port of the live
// site's src/views/Search/SearchStatic.vue and src/components/SearchCard.vue,
// so the two behave alike — the chips and their groups, "Newest first",
// similar results folded away, synonyms and words left out, fifty results at a
// time, highlighted words, the empty state, Back to the same place, the
// Plausible "Search" and "Search Download" events, and the downloads.
//
// A bundled module (checklist §11 trap 1): it registers Alpine.data("icjiaSearch")
// on alpine:init, which @astrojs/alpinejs fires at DOMContentLoaded, after
// every module script has run. The worker and its pending requests live in this
// module, never on the reactive object: Alpine's Proxy would make
// worker.postMessage throw "Illegal invocation".
//
// CMS text is never rendered as HTML: titles and summaries are escaped first,
// and only the highlight's <mark> elements are added (the Vue card renders the
// summary with v-html).
import config from "../../config/config.json";
import synonyms from "../../config/searchSynonyms.json";
import { searchWords, synonymsOf, PAGE_TYPES } from "./searchFields.js";
import { highlightHtml, holdsSearchWord } from "./highlight.js";
import { searchEvent, newestFirst } from "./search.js";
import {
  toCsv,
  toJson,
  toXlsx,
  exportFileName,
  saveFile,
  downloadEvent,
} from "./searchExport.js";

// ── The worker client (src/services/searchClient.js) ──────────────────────────
const client = (() => {
  let worker = null;
  let ready = false;
  let error = false;
  let nextId = 1;
  const pending = new Map();
  const waiting = [];
  const settle = () => {
    ready = true;
    waiting.splice(0).forEach((cb) => cb());
  };
  try {
    if (typeof Worker !== "function") throw new Error("no Worker");
    worker = new Worker("/searchWorker.js");
    worker.addEventListener("message", (e) => {
      const msg = e.data || {};
      if (msg.type === "READY") settle();
      else if (msg.type === "ERROR") {
        error = true;
        settle();
      } else if (msg.type === "RESULTS") {
        const resolve = pending.get(msg.id);
        if (resolve) {
          pending.delete(msg.id);
          resolve(msg.results || []);
        }
      }
    });
    worker.addEventListener("error", () => {
      error = true;
      settle();
    });
    worker.postMessage({
      type: "INIT",
      fuseOptions: config.search.site,
      indexUrl: "/searchIndex.json",
      synonyms,
    });
  } catch {
    error = true;
    ready = true;
  }
  return {
    onReady(cb) {
      if (ready) cb();
      else waiting.push(cb);
    },
    get error() {
      return error;
    },
    search(query) {
      if (!worker || error) return Promise.resolve([]);
      return new Promise((resolve) => {
        const id = nextId++;
        pending.set(id, resolve);
        worker.postMessage({ type: "SEARCH", id, query });
      });
    },
  };
})();

// ── Constants (SearchStatic.vue) ──────────────────────────────────────────────
const KEEP_TYPING = "Keep typing — search starts at 2 characters.";
const HUB_TYPES = ["article", "web application", "dataset"];
const PRESS_CATEGORIES = ["pressRelease", "mediaAdvisory"];
const isPressRelease = (item) =>
  !!item && item.contentType === "news" && PRESS_CATEGORIES.includes(item.category);
const CHIP_GROUPS = [
  {
    key: "hub",
    values: ["hub", ...HUB_TYPES],
    caption: "Research Hub includes Articles, Web Apps, and Datasets",
  },
  {
    key: "publications",
    values: ["publication"],
    caption: "ICJIA’s library since 1983",
  },
];
const EMPTY_STATE_PAGES = [
  { label: "Funding Opportunities", path: "/grants/funding/" },
  { label: "Employment", path: "/about/employment/" },
  { label: "Research Hub", path: "/researchhub/" },
  { label: "Publications", path: "/about/publications/" },
  { label: "News", path: "/news/" },
  { label: "Meetings", path: "/news/meetings/" },
  { label: "Contact ICJIA", path: "/about/contact/" },
];
const TITLED_FIRST = 5;
const RESULTS_PER_PAGE = 50;
const RECORD_SEARCH_AFTER = 1500;
const TYPE_LABELS = {
  article: "Articles",
  page: "Pages",
  biography: "Biographies",
  program: "Programs",
  funding: "Funding",
  meeting: "Meetings",
  news: "News",
  employment: "Job Listings",
  dataset: "Datasets",
  "web application": "Web Apps",
  "partner site": "Partner Sites",
  plan: "Plans",
  app: "Apps",
  publication: "Publications",
};
const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December",
];

function arrayToList(array) {
  return array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
}
const quoted = (words) => arrayToList(words.map((word) => `“${word}”`));

function debounce(fn, wait) {
  let timer = null;
  let lastArgs = null;
  const run = () => {
    timer = null;
    fn(...lastArgs);
  };
  const debounced = (...args) => {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(run, wait);
  };
  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      run();
    }
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// The live site's date filter (src/filters.js "format"): "September 08, 2026".
function formatDate(value) {
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return "";
  const day = t.getUTCDate();
  return `${MONTHS[t.getUTCMonth()]} ${day < 10 ? "0" + day : day}, ${t.getUTCFullYear()}`;
}

function categoryLabel(map, category) {
  const found = (map || []).find((entry) => entry.category === category);
  return found ? found.label : "Undefined";
}

// A link that searches for a chip's text (SearchCard.vue searchFor).
function searchHref(text) {
  const query = String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  return `/search/?q=${encodeURIComponent(query)}`;
}

// The view of this history entry, kept when the page is left and given back
// on Back (src/utils/searchReturn.js; this site is not a single-page app, so
// it is sessionStorage, by a key in the entry's history state).
const VIEW_PREFIX = "icjia-search-view:";
function entryKey() {
  const state = history.state || {};
  if (state.searchKey) return state.searchKey;
  const key = Math.random().toString(36).slice(2);
  history.replaceState({ ...state, searchKey: key }, "");
  return key;
}
function readView(key) {
  try {
    return JSON.parse(sessionStorage.getItem(VIEW_PREFIX + key) || "null");
  } catch {
    return null;
  }
}
function writeView(key, view) {
  try {
    sessionStorage.setItem(VIEW_PREFIX + key, JSON.stringify(view));
  } catch {
    /* private mode or full: Back starts at the top */
  }
}

function icjiaSearch(initialQuery = "") {
  return {
    query: "",
    searchedQuery: null,
    queryResults: [],
    contentSelected: "No filter",
    sortSwitch: true,
    shownCount: RESULTS_PER_PAGE,
    showSimilar: false,
    statusMessage: "",
    lastAnnounced: "",
    announceWhenSearched: false,
    searchFromRoute: false,
    ready: false,
    error: false,
    downloading: false,
    lastResultIndex: null,
    searchSeq: 0,
    emptyStatePages: EMPTY_STATE_PAGES,
    resultsPerPage: RESULTS_PER_PAGE,
    downloadFormats: [
      { ext: "xlsx", label: "Excel (.xlsx)", icon: "excel" },
      { ext: "csv", label: "CSV (.csv)", icon: "csv" },
      { ext: "json", label: "JSON (.json)", icon: "json" },
    ],

    init() {
      this.key = entryKey();
      this.debouncedSearch = debounce(() => this.instantSearch(), 250);
      this.debouncedAnnounce = debounce(() => this.announceResults(), 1000);
      const params = new URLSearchParams(location.search);
      const q = initialQuery || params.get("q") || "";
      this.query = q;
      window.addEventListener("pagehide", () => this.keepView());
      this.$nextTick(() => this.$refs.input && this.$refs.input.focus());
      client.onReady(() => {
        this.error = client.error;
        this.ready = true;
        if (this.query) {
          this.announceWhenSearched = true;
          this.searchFromRoute = true;
          this.instantSearch();
        }
      });
    },

    // ── Results in the order shown ──
    get filteredResults() {
      const f = this.contentSelected;
      if (f === "No filter") return this.queryResults;
      if (f === "hub")
        return this.queryResults.filter((r) => HUB_TYPES.includes(r.item.contentType));
      if (f === "press") return this.queryResults.filter((r) => isPressRelease(r.item));
      return this.queryResults.filter((r) => r.item && r.item.contentType === f);
    },
    get orderedResults() {
      const titled = this.queryResults.filter((result) => result.titled);
      const keepTitled = titled.length <= TITLED_FIRST;
      return this.sortSwitch
        ? newestFirst(
            this.filteredResults,
            (result) =>
              PAGE_TYPES.includes(result.item && result.item.contentType) ||
              (keepTitled && !!result.titled),
          )
        : this.filteredResults;
    },
    get wordResults() {
      return this.orderedResults.filter((r) => !r.similar);
    },
    get similarResults() {
      return this.orderedResults.filter((r) => r.similar);
    },
    get similarOpen() {
      return this.showSimilar || !this.wordResults.length;
    },
    get listedResults() {
      return this.similarOpen ? this.orderedResults : this.wordResults;
    },
    get visibleResults() {
      return this.listedResults.slice(0, this.shownCount);
    },
    get visibleWordResults() {
      return this.visibleResults.filter((r) => !r.similar);
    },
    get visibleSimilarResults() {
      return this.visibleResults.filter((r) => r.similar);
    },

    // ── What the summary says ──
    get missingWords() {
      const first = this.queryResults[0];
      return (first && first.missing) || [];
    },
    get searchedWords() {
      return searchWords(this.searchedQuery || this.query).filter(
        (word) => !this.missingWords.includes(word),
      );
    },
    get quotedWords() {
      return quoted(this.searchedWords);
    },
    get quotedMissing() {
      return quoted(this.missingWords);
    },
    get searchedSynonyms() {
      const all = [].concat(...this.searchedWords.map(synonymsOf));
      return all.filter((word, index) => all.indexOf(word) === index);
    },
    get quotedSynonyms() {
      return quoted(this.searchedSynonyms);
    },
    get similarNote() {
      const count = this.similarResults.length;
      const lacking =
        this.searchedWords.length > 1
          ? `every word (${this.quotedWords})`
          : `the word ${this.quotedWords}`;
      return count === 1
        ? `This result does not contain ${lacking}. It matches a similar spelling, or part of a longer word.`
        : `These ${count} results do not contain ${lacking}. They match a similar spelling, or part of a longer word.`;
    },
    get showEmpty() {
      return this.query.length >= 2 && this.ready && !this.error &&
        this.searchedQuery !== null && this.queryResults.length === 0;
    },

    // ── The chips ──
    get availableFilterChips() {
      if (!this.queryResults.length) return [];
      const exact = this.queryResults.filter((r) => !r.similar);
      const counted = exact.length ? exact : this.queryResults;
      const counts = {};
      for (const r of counted) {
        const t = (r.item && r.item.contentType) || "other";
        counts[t] = (counts[t] || 0) + 1;
      }
      const chip = (t) => ({ value: t, label: this.prettifyType(t), count: counts[t] });
      const chips = Object.keys(counts)
        .filter((t) => !HUB_TYPES.includes(t))
        .map(chip)
        .sort((a, b) => b.count - a.count);
      const press = counted.filter((r) => isPressRelease(r.item));
      const news = chips.findIndex((c) => c.value === "news");
      if (press.length && news > -1)
        chips.splice(news + 1, 0, { value: "press", label: "Press Releases", count: press.length });
      const hubTypes = HUB_TYPES.filter((t) => counts[t]).map(chip);
      const hub = hubTypes.length
        ? [
            { value: "hub", label: "Research Hub", count: hubTypes.reduce((n, c) => n + c.count, 0) },
            ...hubTypes,
          ]
        : [];
      return [{ value: null, label: "No filter", count: counted.length }, ...hub, ...chips];
    },
    get filterChipColumns() {
      const [all, ...rest] = this.availableFilterChips;
      if (!all) return [];
      const inSet = (set, chip) => set.values.includes(chip.value);
      const sets = CHIP_GROUPS.map((set) => ({
        key: set.key,
        caption: { id: `${set.key}-chips-caption`, text: set.caption },
        chips: rest.filter((chip) => inSet(set, chip)),
      })).filter((group) => group.chips.length);
      const loose = rest.filter((chip) => !CHIP_GROUPS.some((set) => inSet(set, chip)));
      return [
        [{ key: "all", label: null, groups: [{ key: "all", caption: null, chips: [all] }] }],
        [
          { key: "collections", label: "Research and publications", groups: sets },
          {
            key: "elsewhere",
            label: "Elsewhere on the site",
            groups: loose.length ? [{ key: "loose", caption: null, chips: loose }] : [],
          },
        ].filter((row) => row.groups.length),
      ];
    },
    isChipActive(chip) {
      if (chip.value === null) return this.contentSelected === "No filter";
      return chip.value === this.contentSelected;
    },
    selectChip(chip) {
      this.contentSelected = chip.value === null ? "No filter" : chip.value;
      this.resetList();
      this.syncAddress();
      this.$nextTick(() => this.announceStatus(this.resultStatus()));
    },
    routeFilter() {
      const wanted = new URLSearchParams(location.search).get("filter");
      const offered = this.availableFilterChips.some(
        (chip) => chip.value !== null && chip.value === wanted,
      );
      return offered ? wanted : "No filter";
    },
    prettifyType(t) {
      if (TYPE_LABELS[t]) return TYPE_LABELS[t];
      return t.charAt(0).toUpperCase() + t.slice(1);
    },

    // ── Searching ──
    onQueryInput() {
      this.contentSelected = "No filter";
      this.resetList();
      this.announceWhenSearched = false;
      this.debouncedSearch();
      this.debouncedAnnounce();
    },
    onSearchSubmit() {
      this.debouncedSearch.flush();
      this.debouncedAnnounce.cancel();
      const query = this.query || "";
      if (!query.length) return;
      if (query.length < 2) this.announceStatus(KEEP_TYPING);
      else if (this.searchedQuery !== query) this.announceWhenSearched = true;
      else this.announceStatus(this.resultStatus());
    },
    clearQuery() {
      this.query = "";
      this.onQueryInput();
      this.$refs.input.focus();
    },
    async instantSearch() {
      const fromRoute = this.searchFromRoute;
      this.searchFromRoute = false;
      if (!this.query || !this.query.length) {
        this.statusMessage = "";
        this.lastAnnounced = "";
        this.searchedQuery = null;
        this.queryResults = [];
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
      if (!this.ready || this.error) return;
      const seq = ++this.searchSeq;
      const results = await client.search(this.query.trim());
      if (seq !== this.searchSeq) return;
      this.queryResults = results;
      this.contentSelected = fromRoute ? this.routeFilter() : "No filter";
      this.resetList();
      this.searchedQuery = this.query;
      this.recordSearch();
      if (fromRoute) this.restoreView();
      else this.syncAddress();
      if (this.announceWhenSearched) {
        this.announceWhenSearched = false;
        this.$nextTick(() => this.announceOnce(this.resultStatus()));
      }
    },
    resetList() {
      this.shownCount = RESULTS_PER_PAGE;
      this.showSimilar = false;
    },
    recordSearch(after = RECORD_SEARCH_AFTER) {
      clearTimeout(this.recordTimer);
      this.recordTimer = setTimeout(() => {
        const event = searchEvent(this.searchedQuery, this.queryResults);
        if (event && typeof window.plausible === "function")
          window.plausible(event.name, { props: event.props });
      }, after);
    },
    // The search on the page, in the address: /search/?q=…&filter=…
    syncAddress() {
      const query = (this.searchedQuery || "").trim();
      const u = new URL(location.href);
      u.pathname = "/search/";
      u.search = "";
      if (query) u.searchParams.set("q", query);
      if (query && this.contentSelected !== "No filter")
        u.searchParams.set("filter", this.contentSelected);
      const href = u.pathname + u.search;
      if (href === location.pathname + location.search) return;
      history.replaceState(history.state, "", href);
    },

    // ── Back to the same place ──
    keepView() {
      const query = (this.searchedQuery || "").trim();
      if (!query) return;
      writeView(this.key, {
        query,
        shownCount: this.shownCount,
        showSimilar: this.showSimilar,
        scrollY: window.scrollY,
        focusIndex: this.lastResultIndex,
      });
    },
    noteResult(event) {
      const target = event.target;
      const result = target && target.closest && target.closest("[data-result-index]");
      this.lastResultIndex = result ? Number(result.dataset.resultIndex) : null;
    },
    restoreView() {
      const query = (this.searchedQuery || "").trim();
      const view = readView(this.key);
      if (!view || view.query !== query) return;
      // The browser's own restoration would scroll the page before the results
      // are back; the results are rendered over a few frames (x-for, x-if), so
      // the scroll and the focus wait for the opened result to be there.
      history.scrollRestoration = "manual";
      this.$nextTick(() => {
        this.showSimilar = Boolean(view.showSimilar);
        this.shownCount = view.shownCount;
        const index = view.focusIndex === null ? view.shownCount - 1 : view.focusIndex;
        let frames = 60;
        const settle = () => {
          const link = this.$root.querySelector(
            `[data-result-index="${index}"] a.card-title-link`,
          );
          if (!link && frames-- > 0) return requestAnimationFrame(settle);
          window.scrollTo(0, view.scrollY);
          if (link && view.focusIndex !== null) link.focus({ preventScroll: true });
        };
        requestAnimationFrame(settle);
      });
    },

    // ── Status messages (WCAG 4.1.3) ──
    resultStatus() {
      const count = this.queryResults.length;
      const query = (this.query || "").trim();
      if (!count) return `No results for “${query}”.`;
      let status = `${this.filteredResults.length} of ${count} result${count === 1 ? "" : "s"} for “${query}”`;
      if (this.missingWords.length)
        status += `. Nothing contains ${this.quotedMissing}; these are results for ${this.quotedWords}`;
      const similar = this.similarResults.length;
      if (!similar) return status;
      const held = this.wordResults.length;
      if (!held)
        return `${status}. None contain ${this.quotedWords}; these are similar spellings and partial matches.`;
      const results = `${similar} similar result${similar === 1 ? "" : "s"}`;
      return `${status}. ${held} contain${held === 1 ? "s" : ""} ${this.quotedWords}; ${results} ${
        this.showSimilar ? `follow${similar === 1 ? "s" : ""}` : "can be shown"
      }.`;
    },
    announceStatus(message) {
      this.lastAnnounced = message;
      this.statusMessage = "";
      this.$nextTick(() => {
        this.statusMessage = message;
      });
    },
    announceResults() {
      const query = this.query || "";
      if (!query.length) return;
      if (query.length < 2) this.announceOnce(KEEP_TYPING);
      else if (this.searchedQuery !== query) this.announceWhenSearched = true;
      else this.announceOnce(this.resultStatus());
    },
    announceOnce(message) {
      if (message === this.lastAnnounced) return;
      this.lastAnnounced = message;
      this.statusMessage = message;
    },
    announceSort() {
      this.announceStatus(
        this.sortSwitch ? "Results in date order, newest first." : "Results by best match.",
      );
    },

    // ── More results, similar results ──
    toggleSimilar() {
      this.showSimilar = !this.showSimilar;
      if (this.showSimilar)
        this.shownCount = Math.max(this.shownCount, this.wordResults.length + RESULTS_PER_PAGE);
    },
    showMore() {
      const firstNew = this.shownCount;
      this.shownCount += RESULTS_PER_PAGE;
      this.$nextTick(() => {
        const link = this.$root.querySelector(`[data-result-index="${firstNew}"] a.card-title-link`);
        if (link) link.focus();
      });
    },

    // ── The result card (SearchCard.vue) ──
    isExternal(item) {
      return /^https?:\/\//i.test((item && item.fullPath) || "");
    },
    // Escaped text with the typed words marked.
    highlight(text) {
      const html = escapeHtml(text || "");
      return this.searchedQuery ? highlightHtml(html, this.searchedQuery) : html;
    },
    cardText(item) {
      const text = item.abstract || item.summary || "";
      const words = text.trim().split(" ");
      return words.length > 50 ? words.slice(0, 50).join(" ") + "..." : words.join(" ");
    },
    tagHit(tag) {
      return Boolean(this.searchedQuery) && holdsSearchWord(tag, this.searchedQuery);
    },
    searchHref,
    // The type links above the title: a news post's category, a meeting's
    // category and "MEETING", a program's category and "PROGRAM", the type.
    typeLinks(item) {
      const links = [];
      if (!item.contentType) return links;
      if (item.category && item.contentType === "news") {
        const label = categoryLabel(config.maps.news, item.category);
        links.push({ label: label.toUpperCase(), href: searchHref(label) });
      }
      if (item.category && item.contentType === "meeting") {
        const label = categoryLabel(config.maps.meetings, item.category);
        links.push({ label: label.toUpperCase(), href: searchHref(label) });
      }
      if (item.category && item.contentType === "program")
        links.push({ label: item.category.toUpperCase(), href: searchHref(item.category) });
      if (item.contentType !== "news")
        links.push({ label: item.contentType.toUpperCase(), href: searchHref(item.contentType) });
      return links;
    },
    // The dates after them, each after " | ".
    cardDates(item) {
      const parts = [];
      if (item.publicationDate) parts.push(formatDate(item.publicationDate));
      if (item.date) parts.push(formatDate(item.date));
      if (item.start && item.end) {
        const hours = (new Date(item.end) - new Date(item.start)) / 3600000;
        parts.push(
          hours >= 24 ? `${formatDate(item.start)} to ${formatDate(item.end)}` : formatDate(item.start),
        );
      }
      return parts;
    },
    // A click on the card, not on one of its links, opens the result; with
    // Ctrl or Command, in a new tab. Another site always opens in a new tab.
    onCardClick(event, item) {
      if (event.target.closest("a, button")) return;
      if (event.metaKey || event.ctrlKey || this.isExternal(item)) {
        window.open(item.fullPath, "_blank", "noopener,noreferrer");
        return;
      }
      location.href = item.fullPath;
    },

    // ── Downloads (v1.5.144, v1.5.145) ──
    downloadAbout(now) {
      const chip = this.availableFilterChips.find((c) => this.isChipActive(c));
      const results = this.orderedResults;
      return [
        ["Search", (this.searchedQuery || this.query || "").trim()],
        ["Filter", chip && chip.value !== null ? chip.label : "No filter"],
        ["Order", this.sortSwitch ? "Newest first (the site's pages first)" : "Best match first"],
        ["Results", results.length],
        ["Containing the search words", results.filter((r) => !r.similar).length],
        ["Similar spellings or partial matches", results.filter((r) => r.similar).length],
        ["Words left out", this.missingWords.join(", ")],
        ["Also searched for", this.searchedSynonyms.join(", ")],
        ["Search page", location.href],
        ["Downloaded", now.toISOString()],
        ["Source", "Illinois Criminal Justice Information Authority"],
      ];
    },
    async downloadResults(ext) {
      if (this.downloading) return;
      this.downloading = true;
      const now = new Date();
      // Plain objects: exceljs and JSON.stringify are given no Proxies.
      const results = JSON.parse(JSON.stringify(this.orderedResults));
      const filter = this.contentSelected !== "No filter" ? this.contentSelected : null;
      const name = exportFileName(this.searchedQuery, filter, ext, now);
      try {
        if (ext === "xlsx") {
          const data = await toXlsx(results, this.downloadAbout(now), now, this.searchedQuery);
          saveFile(data, name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else if (ext === "json") {
          saveFile(toJson(results, this.downloadAbout(now), now, this.searchedQuery), name, "application/json;charset=utf-8");
        } else {
          saveFile(toCsv(results, now, this.searchedQuery), name, "text/csv;charset=utf-8");
        }
        const event = downloadEvent(ext, this.searchedQuery, filter, results.length);
        if (typeof window.plausible === "function")
          window.plausible(event.name, { props: event.props });
        this.announceStatus(
          `Downloading ${results.length} result${results.length === 1 ? "" : "s"} as ${name}.`,
        );
      } catch (err) {
        console.error("search download:", err);
        this.announceStatus("The download could not be made. Please try again.");
      } finally {
        this.downloading = false;
      }
    },
  };
}

document.addEventListener("alpine:init", () => {
  window.Alpine.data("icjiaSearch", icjiaSearch);
});

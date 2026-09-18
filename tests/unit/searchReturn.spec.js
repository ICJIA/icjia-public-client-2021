/* eslint-env mocha */
// =============================================================================
// Coming back to a search (v1.5.87)
//
// A typed query lived only in the search box: the address stayed /search/, a
// result opened in a new tab, and Back from a tag link returned to an empty
// page. Now the search on the page is written into the address (query and
// filter chip), a result opens in the same tab, and Back returns to the search
// as it was left: the same results, as many of them showing, the page scrolled
// to the same place, focus on the result that was opened. The component's
// methods run against plain objects.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import SearchStatic from "@/views/Search/SearchStatic.vue";
import SearchCard from "@/components/SearchCard.vue";
import {
  keepSearchView,
  keptSearchView,
  forgetSearchView,
} from "@/utils/searchReturn";

const source = (file) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("searchReturn: how a search looked, per history entry", () => {
  it("returns what was kept for the entry, for the same query only", () => {
    const view = { query: "violence", shownCount: 150, scrollY: 4200 };
    keepSearchView("entry-1", view);
    expect(keptSearchView("entry-1", "violence")).to.deep.equal(view);
    expect(keptSearchView("entry-1", "police")).to.equal(null);
    expect(keptSearchView("entry-2", "violence")).to.equal(null);
    expect(keptSearchView(undefined, "violence")).to.equal(null);
  });

  it("forgets an entry, and keeps no more than the newest twenty", () => {
    forgetSearchView("entry-1");
    expect(keptSearchView("entry-1", "violence")).to.equal(null);
    for (let i = 0; i < 25; i++)
      keepSearchView(`k${i}`, { query: "q", shownCount: 50, scrollY: i });
    expect(keptSearchView("k0", "q")).to.equal(null);
    expect(keptSearchView("k4", "q")).to.equal(null);
    expect(keptSearchView("k5", "q").scrollY).to.equal(5);
    expect(keptSearchView("k24", "q").scrollY).to.equal(24);
  });
});

describe("Search page: the search on the page is in the address", () => {
  let replaced;
  let original;
  beforeEach(() => {
    replaced = [];
    original = window.history.replaceState;
    window.history.replaceState = (state, title, url) =>
      replaced.push({ state, url });
  });
  afterEach(() => {
    window.history.replaceState = original;
  });

  const page = (state = {}) => ({
    searchedQuery: null,
    contentSelected: "No filter",
    $router: {
      resolve: (location) => ({
        href:
          (location.name === "Search2"
            ? `/search/${location.params.query}`
            : "/search/") +
          (location.query ? `?filter=${location.query.filter}` : ""),
      }),
    },
    ...state,
  });

  it("writes a typed search into the address without a new history entry", () => {
    SearchStatic.methods.syncAddress.call(page({ searchedQuery: "violence " }));
    expect(replaced.map((r) => r.url)).to.deep.equal(["/search/violence"]);
    expect(replaced[0].state).to.equal(window.history.state);
  });

  it("adds the chosen filter chip, and encodes the query as search links do", () => {
    SearchStatic.methods.syncAddress.call(
      page({ searchedQuery: "task force", contentSelected: "hub" })
    );
    expect(replaced[0].url).to.equal("/search/task%20force?filter=hub");
  });

  it("returns the address to /search/ when the box is cleared", () => {
    SearchStatic.methods.syncAddress.call(page({ searchedQuery: null }));
    expect(replaced[0].url).to.equal("/search/");
  });

  it("leaves the address alone when it already says so", () => {
    const here = window.location.pathname + window.location.search;
    const vm = page({ searchedQuery: "violence" });
    vm.$router.resolve = () => ({ href: here });
    SearchStatic.methods.syncAddress.call(vm);
    expect(replaced).to.deep.equal([]);
  });

  const search = async (state) => {
    const calls = { sync: 0, restore: 0 };
    const vm = {
      query: "violence",
      searchSeq: 0,
      searchFromRoute: false,
      announceWhenSearched: false,
      queryResults: [],
      contentSelected: "No filter",
      fuse: { search: async () => [{ item: { contentType: "news" } }] },
      filterResults() {},
      routeFilter: () => "No filter",
      syncAddress: () => calls.sync++,
      restoreView: () => calls.restore++,
      ...state,
    };
    await SearchStatic.methods.instantSearch.call(vm);
    return calls;
  };

  it("does so when a typed search has arrived, not for a search that came from the address", async () => {
    expect(await search({})).to.deep.equal({ sync: 1, restore: 0 });
    expect(await search({ searchFromRoute: true })).to.deep.equal({
      sync: 0,
      restore: 1,
    });
  });

  it("does so when the box is cleared", async () => {
    const vm = { query: "", searchedQuery: "violence", sync: 0 };
    vm.syncAddress = () => vm.sync++;
    await SearchStatic.methods.instantSearch.call(vm);
    expect(vm.searchedQuery).to.equal(null);
    expect(vm.sync).to.equal(1);
  });

  it("does so when a filter chip is chosen", () => {
    const vm = { contentSelected: "No filter", sync: 0, $nextTick() {} };
    vm.syncAddress = () => vm.sync++;
    SearchStatic.methods.selectChip.call(vm, { value: "hub" });
    expect(vm.contentSelected).to.equal("hub");
    expect(vm.sync).to.equal(1);
  });
});

describe("Search page: Back returns to the search as it was left", () => {
  it("keeps how the results looked when the page is left", () => {
    const vm = {
      entryKey: "entry-9",
      searchedQuery: "violence ",
      shownCount: 150,
      lastResultIndex: 59,
    };
    window.scrollTo = () => {};
    Object.defineProperty(window, "scrollY", {
      value: 4200,
      configurable: true,
    });
    SearchStatic.methods.keepView.call(vm);
    expect(keptSearchView("entry-9", "violence")).to.deep.equal({
      query: "violence",
      shownCount: 150,
      scrollY: 4200,
      focusIndex: 59,
    });
  });

  // The router moves focus to the page before a search-to-search navigation
  // reaches this page, so the result in use is noted as focus and clicks land.
  it("notes the result that has focus or was clicked", () => {
    const vm = { lastResultIndex: null };
    const inResult = (index) => ({
      target: {
        closest: (selector) =>
          selector === "[data-result-index]"
            ? { dataset: { resultIndex: String(index) } }
            : null,
      },
    });
    SearchStatic.methods.noteResult.call(vm, inResult(59));
    expect(vm.lastResultIndex).to.equal(59);
    SearchStatic.methods.noteResult.call(vm, {
      target: { closest: () => null },
    });
    expect(vm.lastResultIndex).to.equal(null);
  });

  it("keeps nothing for a page with no search on it", () => {
    SearchStatic.methods.keepView.call({
      entryKey: "entry-10",
      searchedQuery: null,
    });
    expect(keptSearchView("entry-10", "")).to.equal(null);
  });

  it("shows as many results again, scrolls back, and returns focus to the result that was opened", () => {
    keepSearchView("entry-11", {
      query: "violence",
      shownCount: 150,
      scrollY: 4200,
      focusIndex: 120,
    });
    const did = {};
    window.scrollTo = (x, y) => (did.scrolledTo = y);
    const vm = {
      entryKey: "entry-11",
      searchedQuery: "violence",
      shownCount: 50,
      $nextTick: (fn) => fn(),
      $el: {
        querySelector(selector) {
          did.asked = selector;
          return { focus: (options) => (did.focus = options) };
        },
      },
    };
    SearchStatic.methods.restoreView.call(vm);
    expect(vm.shownCount).to.equal(150);
    expect(did.scrolledTo).to.equal(4200);
    expect(did.asked).to.equal('[data-result-index="120"] a.card-title-link');
    expect(did.focus).to.deep.equal({ preventScroll: true });
  });

  it("does nothing for a search that was not left from this history entry", () => {
    const vm = {
      entryKey: "entry-12",
      searchedQuery: "violence",
      shownCount: 50,
    };
    SearchStatic.methods.restoreView.call(vm);
    expect(vm.shownCount).to.equal(50);
  });

  // Before the page is taken down: by beforeDestroy its results have left the
  // document and the browser has already pulled the scroll position in (a
  // page left at 9,172 px was kept as 370).
  it("notes its history entry when created, and keeps its view before leaving", () => {
    const page = source("src/views/Search/SearchStatic.vue");
    expect(page).to.match(/this\.entryKey = historyKey\(\);/);
    expect(page).to.match(
      /beforeRouteLeave\(to, from, next\) \{\s*this\.keepView\(\);\s*next\(\);/
    );
    expect(page).to.match(
      /beforeRouteUpdate\(to, from, next\) \{\s*this\.keepView\(\);\s*next\(\);/
    );
    expect(page).to.not.match(/beforeDestroy\(\) \{\s*this\.keepView/);
    const template = page
      .slice(0, page.indexOf("<script>"))
      .replace(/\s+/g, " ");
    expect(template).to.include('@focusin="noteResult"');
    expect(template).to.include('@click.capture="noteResult"');
  });
});

describe("A result opens in the same tab", () => {
  it("the title is a router link, with no new tab", () => {
    const card = source("src/components/SearchCard.vue");
    const template = card.slice(0, card.indexOf("<script>"));
    expect(template).to.not.include('target="_blank"');
    expect(template.replace(/\s+/g, " ")).to.include(
      '<router-link :to="item.fullPath" class="card-title-link"'
    );
  });

  it("a click on the card goes to the result in this tab, on the search page too", () => {
    let pushed = null;
    const vm = {
      isStatic: true,
      item: { fullPath: "/about/foia/" },
      $router: { push: (to) => ((pushed = to), Promise.resolve()) },
    };
    vm.route = SearchCard.methods.route;
    SearchCard.methods.onCardClick.call(vm, { target: null });
    expect(pushed).to.equal("/about/foia/");
  });

  it("Ctrl or Command with the click still opens a new tab", () => {
    let opened = null;
    const open = window.open;
    window.open = (url) => (opened = url);
    const vm = {
      isStatic: true,
      item: { fullPath: "/about/foia/" },
      route() {},
    };
    SearchCard.methods.onCardClick.call(vm, { target: null, metaKey: true });
    window.open = open;
    expect(opened).to.include("/about/foia/");
  });
});

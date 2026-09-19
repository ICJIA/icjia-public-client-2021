/* eslint-env mocha */
// =============================================================================
// Search page: results are shown fifty at a time (v1.5.86)
//
// Every result used to be rendered at once, at about 3 ms a card: 297 results
// for "violence" froze the page for about a second when they arrived, 842 for
// "vi" for about two and a half. The first fifty are rendered; "Show more
// results" adds fifty and moves keyboard focus to the first new result, as
// "Load more" does on the Research Hub's articles page. The filter chips still
// count every result. The component's computed property and methods run
// against plain objects.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import SearchStatic from "@/views/Search/SearchStatic.vue";

const results = (n, contentType = "article") =>
  Array.from({ length: n }, (_, i) => ({
    item: { contentType, title: `Result ${i + 1}` },
    refIndex: i,
  }));
const page = (state = {}) => {
  const vm = {
    queryResults: [],
    filteredResults: [],
    contentSelected: "No filter",
    shownCount: 50,
    showSimilar: false,
    $route: { query: {} },
    ...state,
  };
  // visibleResults and what it is computed from (the similar results, folded
  // away: tests/unit/searchSimilar.spec.js).
  [
    "wordResults",
    "similarResults",
    "similarOpen",
    "listedResults",
    "visibleResults",
  ].forEach((name) => {
    Object.defineProperty(vm, name, {
      get: () => SearchStatic.computed[name].call(vm),
    });
  });
  return vm;
};

describe("Search page: results fifty at a time", () => {
  it("renders the first fifty results", () => {
    const vm = page({ filteredResults: results(297) });
    expect(vm.visibleResults.length).to.equal(50);
    expect(vm.visibleResults[49].item.title).to.equal("Result 50");
  });

  it("renders a short list whole", () => {
    expect(
      page({ filteredResults: results(7) }).visibleResults.length
    ).to.equal(7);
  });

  it("shows fifty more, and moves focus to the first new result", () => {
    let asked = null;
    let focused = false;
    const vm = page({
      filteredResults: results(120),
      $nextTick: (fn) => fn(),
      $el: {
        querySelector(selector) {
          asked = selector;
          return { focus: () => (focused = true) };
        },
      },
    });
    SearchStatic.methods.showMore.call(vm);
    expect(vm.visibleResults.length).to.equal(100);
    expect(asked).to.equal('[data-result-index="50"] a.card-title-link');
    expect(focused).to.equal(true);
    SearchStatic.methods.showMore.call(vm);
    expect(vm.visibleResults.length).to.equal(120);
  });

  it("starts again from the first fifty for new results or another filter", () => {
    const vm = page({ queryResults: results(297), shownCount: 200 });
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.shownCount).to.equal(50);
    expect(vm.filteredResults.length).to.equal(297);
    expect(vm.visibleResults.length).to.equal(50);
  });

  it("lists the visible results, with a button and a count for the rest", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    // The formatter wraps long lines, so whitespace is not significant here.
    const template = source
      .slice(0, source.indexOf("<script>"))
      .replace(/\s+/g, " ");
    expect(template).to.include(
      'v-for="(result, index) in visibleWordResults"'
    );
    expect(template).to.not.include("in filteredResults");
    expect(template).to.not.include("in listedResults");
    expect(template).to.include(':data-result-index="index"');
    expect(template).to.match(
      /@click="showMore\(\)"[^>]*>\s*Show more results/
    );
    expect(template).to.include(
      "Showing {{ visibleResults.length }} of {{ listedResults.length }}"
    );
  });
});

describe("Search page: the shortest query", () => {
  const search = async (query) => {
    let asked = null;
    const vm = page({
      query,
      searchSeq: 0,
      searchFromRoute: false,
      announceWhenSearched: false,
      fuse: {
        search: async (q) => {
          asked = q;
          return results(3);
        },
      },
    });
    vm.filterResults = SearchStatic.methods.filterResults;
    vm.syncAddress = () => {}; // the address: tests/unit/searchReturn.spec.js
    await SearchStatic.methods.instantSearch.call(vm);
    return { asked, found: vm.queryResults.length };
  };

  // Two characters, not three: "R3" (Restore, Reinvest, Renew) is a program,
  // and with fifty results rendered a two-letter search is no longer slow.
  it('searches two characters: "R3" is a program', async () => {
    expect(await search("R3")).to.deep.equal({ asked: "R3", found: 3 });
  });

  it("does not search one character", async () => {
    expect(await search("R")).to.deep.equal({ asked: null, found: 0 });
  });
});

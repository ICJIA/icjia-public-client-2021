/* eslint-env mocha */
// =============================================================================
// Searches recorded in Plausible (v1.5.121)
//
// Plausible's script records a page view on the router's pushState: a click on
// a tag or a name, and the front page's search box, reach it as
// /search/<words>, but a search typed on the search page is written into the
// address with replaceState and never did. So the "top searches" were mostly
// clicks, and a search that found nothing was invisible. The page now sends a
// "Search" event with the words and the counts, once a search has settled.
// =============================================================================
import { expect } from "chai";
import { searchEvent } from "@/utils/search";
import SearchStatic from "@/views/Search/SearchStatic.vue";

describe("The Search event", () => {
  it("carries the words, lowercased and trimmed, and the counts as strings", () => {
    expect(
      searchEvent("  Domestic Violence ", [
        { item: {} },
        { item: {}, similar: true },
        { item: {} },
      ])
    ).to.deep.equal({
      name: "Search",
      props: { query: "domestic violence", results: "3", matched: "2" },
    });
  });

  it("records a search that found nothing", () => {
    expect(searchEvent("expungement", []).props).to.deep.equal({
      query: "expungement",
      results: "0",
      matched: "0",
    });
  });

  it("is nothing for a blank or one-letter query", () => {
    expect(searchEvent("", [])).to.equal(null);
    expect(searchEvent("  ", [])).to.equal(null);
    expect(searchEvent("a", [])).to.equal(null);
  });
});

describe("The search page sends it", () => {
  const vm = (state) => ({
    searchedQuery: "drone",
    queryResults: [{ item: {} }],
    recordTimer: null,
    ...state,
  });

  it("once the search has settled, through window.plausible", (done) => {
    const sent = [];
    window.plausible = (...args) => sent.push(args);
    const page = vm();
    SearchStatic.methods.recordSearch.call(page, 5);
    // A second search within the wait replaces the first.
    page.searchedQuery = "drones";
    SearchStatic.methods.recordSearch.call(page, 5);
    setTimeout(() => {
      expect(sent).to.deep.equal([
        ["Search", { props: { query: "drones", results: "1", matched: "1" } }],
      ]);
      delete window.plausible;
      done();
    }, 40);
  });

  it("sends nothing without Plausible, or for a cleared box", (done) => {
    delete window.plausible;
    SearchStatic.methods.recordSearch.call(vm(), 5);
    setTimeout(() => {
      // Plausible arrives after that timer fired: nothing was sent, and a
      // cleared box sends nothing now either.
      const sent = [];
      window.plausible = (...args) => sent.push(args);
      SearchStatic.methods.recordSearch.call(vm({ searchedQuery: null }), 5);
      setTimeout(() => {
        expect(sent).to.deep.equal([]);
        delete window.plausible;
        done();
      }, 40);
    }, 40);
  });
});

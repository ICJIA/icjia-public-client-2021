// =============================================================================
// Search status announcements (src/views/Search/SearchStatic.vue)
// The polite live region repeats the result once typing has paused and the
// search for the query in the field has finished, and not again while the
// message is unchanged; a filter chip's result is announced at once, every
// time. The component's methods run against a plain object.
// =============================================================================
import { expect } from "chai";
import SearchStatic from "@/views/Search/SearchStatic.vue";

const makeSearch = (state = {}) => {
  const vm = {
    query: "",
    searchedQuery: null,
    lastAnnounced: "",
    announceWhenSearched: false,
    queryResults: [],
    filteredResults: [],
    $nextTick: (fn) => fn(),
    ...state,
  };
  // Every value written to the live region, in order.
  vm.written = [];
  let message = "";
  Object.defineProperty(vm, "statusMessage", {
    get: () => message,
    set: (value) => {
      message = value;
      vm.written.push(value);
    },
  });
  ["resultStatus", "announceStatus", "announceOnce", "announceResults"].forEach(
    (name) => {
      vm[name] = SearchStatic.methods[name].bind(vm);
    }
  );
  return vm;
};
const results = (n) => Array.from({ length: n }, (_, i) => ({ item: { i } }));

describe("Search status announcements", () => {
  it("announces the result once the search for the query has finished", () => {
    const vm = makeSearch({
      query: "violence",
      searchedQuery: "violence",
      queryResults: results(3),
      filteredResults: results(3),
    });
    vm.announceResults();
    expect(vm.written).to.deep.equal(["3 of 3 results for “violence”"]);
  });

  it("waits for a search that is still running", () => {
    const vm = makeSearch({ query: "violence", searchedQuery: "violenc" });
    vm.announceResults();
    expect(vm.written).to.deep.equal([]);
    expect(vm.announceWhenSearched).to.equal(true);
  });

  it("does not repeat an unchanged message, a trailing space included", () => {
    const vm = makeSearch({
      query: "grant",
      searchedQuery: "grant",
      queryResults: results(2),
      filteredResults: results(2),
    });
    vm.announceResults();
    vm.announceResults();
    vm.query = vm.searchedQuery = "grant ";
    vm.announceResults();
    expect(vm.written).to.deep.equal(["2 of 2 results for “grant”"]);
  });

  it("asks for more characters after one, once", () => {
    const vm = makeSearch({ query: "d" });
    vm.announceResults();
    vm.announceResults();
    expect(vm.written).to.deep.equal([
      "Keep typing — search starts at 2 characters.",
    ]);
  });

  it("says nothing for an empty field", () => {
    const vm = makeSearch({ query: "" });
    vm.announceResults();
    expect(vm.written).to.deep.equal([]);
  });

  it("announces a filter chip's result at once, even when it repeats", () => {
    const vm = makeSearch({
      query: "violence",
      queryResults: results(4),
      filteredResults: results(1),
    });
    vm.announceStatus(vm.resultStatus());
    vm.announceStatus(vm.resultStatus());
    expect(vm.written).to.deep.equal([
      "",
      "1 of 4 results for “violence”",
      "",
      "1 of 4 results for “violence”",
    ]);
    // …and the typing announcement does not repeat it afterwards.
    vm.searchedQuery = "violence";
    vm.announceResults();
    expect(vm.written.length).to.equal(4);
  });
});

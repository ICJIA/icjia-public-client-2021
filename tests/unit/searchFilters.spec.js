/* eslint-env mocha */
// =============================================================================
// Search page filters, and the Research Hub filter (v1.5.85)
//
// Research Hub pages send their author and tag searches to the search page
// with ?filter=hub. "hub" is not a content type, and the page reset the filter
// after every search, so the hint did nothing. It now selects a "Research Hub"
// filter: articles, web applications and datasets. The component's computed
// property and methods run against plain objects.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import SearchStatic from "@/views/Search/SearchStatic.vue";

const result = (contentType, title) => ({ item: { contentType, title } });
const RESULTS = [
  result("biography", "Jessica Reichert"),
  result("article", "An article"),
  result("publication", "A publication"),
  result("web application", "A dashboard"),
  result("dataset", "A dataset"),
  result("news", "A news post"),
];
const page = (state = {}) => {
  const vm = {
    queryResults: RESULTS,
    contentSelected: "No filter",
    $route: { query: {} },
    ...state,
  };
  vm.prettifyType = SearchStatic.methods.prettifyType;
  Object.defineProperty(vm, "availableFilterChips", {
    get: () => SearchStatic.computed.availableFilterChips.call(vm),
  });
  return vm;
};

describe("Search page: Research Hub filter", () => {
  it("offers a Research Hub chip counting articles, web applications and datasets", () => {
    const chips = page().availableFilterChips;
    expect(chips[0]).to.deep.equal({
      value: null,
      label: "No filter",
      count: 6,
    });
    expect(chips[1]).to.deep.equal({
      value: "hub",
      label: "Research Hub",
      count: 3,
    });
    expect(chips.map((c) => c.label)).to.include("Web Applications");
  });

  // The Hub's three types are its parts, so their chips sit together after it,
  // in the order of the Research menu. The other types follow, largest first.
  it("keeps the Hub's own types beside the Research Hub chip", () => {
    const queryResults = [
      result("news", "n1"),
      result("dataset", "d1"),
      result("publication", "p1"),
      result("news", "n2"),
      result("web application", "w1"),
      result("biography", "b1"),
      result("dataset", "d2"),
      result("news", "n3"),
      result("publication", "p2"),
      result("article", "a1"),
    ];
    const chips = page({ queryResults }).availableFilterChips;
    expect(chips.map((c) => `${c.label} ${c.count}`)).to.deep.equal([
      "No filter 10",
      "Research Hub 4",
      "Articles 1",
      "Web Applications 1",
      "Datasets 2",
      "News 3",
      "Publications 2",
      "Biographies 1",
    ]);
  });

  it("groups them even when only some of the Hub's types were found", () => {
    const queryResults = [
      result("meeting", "m1"),
      result("meeting", "m2"),
      result("dataset", "d1"),
    ];
    const chips = page({ queryResults }).availableFilterChips;
    expect(chips.map((c) => `${c.label} ${c.count}`)).to.deep.equal([
      "No filter 3",
      "Research Hub 1",
      "Datasets 1",
      "Meetings 2",
    ]);
  });

  it("offers no Research Hub chip when nothing from the Hub was found", () => {
    const chips = page({
      queryResults: [result("news", "x"), result("page", "y")],
    }).availableFilterChips;
    expect(chips.map((c) => c.value)).to.not.include("hub");
  });

  it("keeps only Hub content when the Research Hub filter is chosen", () => {
    const vm = page({ contentSelected: "hub" });
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.filteredResults.map((r) => r.item.contentType)).to.deep.equal([
      "article",
      "web application",
      "dataset",
    ]);
  });

  it("still filters by one content type, and by none", () => {
    const vm = page({ contentSelected: "news" });
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.filteredResults.length).to.equal(1);
    vm.contentSelected = "No filter";
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.filteredResults.length).to.equal(6);
  });

  it("applies the filter named in the address when the results have it", () => {
    const routeFilter = (filter, state) =>
      SearchStatic.methods.routeFilter.call(
        page({ $route: { query: { filter } }, ...state })
      );
    expect(routeFilter("hub")).to.equal("hub");
    expect(routeFilter("news")).to.equal("news");
    expect(routeFilter("meeting")).to.equal("No filter");
    expect(routeFilter(undefined)).to.equal("No filter");
    expect(
      routeFilter("hub", { queryResults: [result("news", "x")] })
    ).to.equal("No filter");
  });
});

describe("Who asks for the Research Hub filter", () => {
  const source = (file) =>
    fs.readFileSync(path.join(process.cwd(), file), "utf8");

  it("Research Hub components do", () => {
    for (const file of [
      "src/utils/dom.js",
      "src/components/Hub/HubCard.vue",
      "src/components/Hub/BasePropChip.vue",
      "src/components/Hub/ArticleView.vue",
      "src/components/Hub/DatasetView.vue",
      "src/views/Hub/HubStaff.vue",
    ]) {
      expect(source(file), file).to.match(/type: "hub"/);
    }
  });

  it("news cards, grants staff and board members do not: their searches stay unfiltered", () => {
    for (const file of [
      "src/components/NewsCard.vue",
      "src/views/Grants/GrantsStaff.vue",
      "src/views/About/CompositionAndMembership.vue",
    ]) {
      expect(source(file), file).to.not.match(/type: "hub"/);
    }
  });
});

// The Research Hub chip stands for three of the chips beside it, and nothing
// on the page said so: the four looked like any other chips. They are one
// group now, with a line under it and a caption (v1.5.100).
describe("Search page: the Research Hub chips are shown as one group", () => {
  const groups = (state) =>
    SearchStatic.computed.filterChipGroups.call(page(state));

  it("groups the Research Hub chip with the Hub's own types", () => {
    const all = groups();
    expect(all.map((g) => g.hub)).to.deep.equal([false, true, false]);
    expect(all[0].chips.map((c) => c.label)).to.deep.equal(["No filter"]);
    expect(all[1].chips.map((c) => c.label)).to.deep.equal([
      "Research Hub",
      "Articles",
      "Web Applications",
      "Datasets",
    ]);
    // the same chips, in the same order, as before
    expect([].concat(...all.map((g) => g.chips))).to.deep.equal(
      page().availableFilterChips
    );
  });

  it("makes no group when no result is from the Hub", () => {
    const all = groups({
      queryResults: [result("news", "n1"), result("publication", "p1")],
    });
    expect(all.map((g) => g.hub)).to.deep.equal([false]);
    expect(all[0].chips.length).to.equal(3);
    expect(groups({ queryResults: [] })).to.deep.equal([]);
  });

  it("names the group with a caption that says what the Hub chip includes", () => {
    const view = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    expect(view).to.include(":role=\"group.hub ? 'group' : null\"");
    expect(view).to.include(
      ":aria-labelledby=\"group.hub ? 'hub-chips-caption' : null\""
    );
    expect(view).to.match(
      /id="hub-chips-caption"[^>]*>\s*Research Hub includes Articles, Web Applications, and\s+Datasets\s*</
    );
  });

  // One colour marks the group (v1.5.101): its chips' outlines and text, the
  // bracket under them and the caption. The chip in use stays black and a
  // hovered one blue: their own rules colour them, and a plainer selector here
  // would outrank them.
  it("gives the group one colour, but not the chip in use or hovered", () => {
    const css = fs
      .readFileSync(
        path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
        "utf8"
      )
      .split("<style")[1];
    const chips = css.match(
      /\.filter-chip-set--hub\s+\.filter-chip:not\(\.filter-chip--active\):not\(:hover\)\s*\{\s*border-color: (#[0-9a-f]{6});\s*color: (#[0-9a-f]{6});/
    );
    expect(chips, "the chips' rule").to.not.equal(null);
    const bracket = css.match(
      /\.filter-chip-set__caption::before\s*\{[^}]*border: solid (#[0-9a-f]{6});/
    );
    expect(bracket, "the bracket rule").to.not.equal(null);
    const caption = css.match(
      /\.filter-chip-set--hub \.filter-chip-set__caption\s*\{[^}]*\bcolor: (#[0-9a-f]{6});/
    );
    expect(caption, "the caption rule").to.not.equal(null);
    expect([chips[1], chips[2], caption[1]]).to.deep.equal([
      bracket[1],
      bracket[1],
      bracket[1],
    ]);
  });
});

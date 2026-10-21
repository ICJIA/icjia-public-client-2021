/* eslint-env mocha */
// =============================================================================
// Search page filters, and the Research Hub filter (v1.5.85)
//
// Research Hub pages send their author and tag searches to the search page
// with ?filter=hub. "hub" is not a content type, and the page reset the filter
// after every search, so the hint did nothing. It now selects a "Research Hub"
// filter: articles, web applications and datasets. The component's computed
// property and methods run against plain objects.
//
// v1.5.112: nothing on the site asks for that filter any more. A click on a
// tag, a category or a name opens the whole search, from a Research Hub page
// too: a visitor may want everything the site has, and the Research Hub chip is
// there on the search page to narrow it down. The filter itself, and
// ?filter=hub in the address once the chip is chosen, work as before.
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
    expect(chips.map((c) => c.label)).to.include("Web Apps");
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
      "Web Apps 1",
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

  // They did, from v1.5.85 to v1.5.111.
  it("Research Hub components do not: a tag, a category or a name opens the whole search", () => {
    for (const file of [
      "src/utils/dom.js",
      "src/components/Hub/HubCard.vue",
      "src/components/Hub/BasePropChip.vue",
      "src/components/Hub/ArticleView.vue",
      "src/components/Hub/DatasetView.vue",
      "src/views/Hub/HubStaff.vue",
    ]) {
      // (comment lines, which tell of the search modal's { type: "hub" }, left out)
      const code = source(file).replace(/^\s*\/\/.*$/gm, "");
      expect(code, file).to.not.match(/(type|filter): "hub"/);
      // and they still search
      expect(source(file), file).to.match(/goToSearch\(|searchLocation\(/);
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
// group now, with a line under it and a caption (v1.5.100). The Publications
// chip has a line and a caption too (v1.5.102): Publications is the agency's
// library, apart from the Hub, and nothing said that either.
describe("Search page: chips shown as a group, with a line and a caption", () => {
  // The chips as the page draws them (v1.5.127): No filter in a column of its
  // own; beside it, a labelled row of the captioned groups and a labelled row
  // of the other chips.
  const columns = (state) =>
    SearchStatic.computed.filterChipColumns.call(page(state));
  const labels = (group) => group.chips.map((c) => c.label);
  const rows = (state) => columns(state)[1];

  it("puts No filter apart, and the groups in a row above the other chips", () => {
    const [left, right] = columns();
    expect(left.map((r) => r.label)).to.deep.equal([null]);
    expect(labels(left[0].groups[0])).to.deep.equal(["No filter"]);
    expect(right.map((r) => r.label)).to.deep.equal([
      "Research and publications",
      "Elsewhere on the site",
    ]);
    expect(right[0].groups.map((g) => g.key)).to.deep.equal([
      "hub",
      "publications",
    ]);
    expect(labels(right[0].groups[0])).to.deep.equal([
      "Research Hub",
      "Articles",
      "Web Apps",
      "Datasets",
    ]);
    expect(labels(right[0].groups[1])).to.deep.equal(["Publications"]);
    expect(right[1].groups.map(labels)).to.deep.equal([
      ["Biographies", "News"],
    ]);
    // the same chips as before, none lost and none twice
    const shown = [].concat(
      ...[left, right].map((col) =>
        [].concat(...col.map((r) => [].concat(...r.groups.map(labels))))
      )
    );
    expect(shown.slice().sort()).to.deep.equal(
      page()
        .availableFilterChips.map((c) => c.label)
        .sort()
    );
  });

  it("leaves out a row with nothing in it", () => {
    const noHub = rows({
      queryResults: [result("news", "n1"), result("publication", "p1")],
    });
    expect(noHub.map((r) => r.groups.map((g) => g.key))).to.deep.equal([
      ["publications"],
      ["loose"],
    ]);
    const neither = rows({
      queryResults: [result("news", "n1"), result("meeting", "m1")],
    });
    expect(neither.map((r) => r.key)).to.deep.equal(["elsewhere"]);
    const onlyHub = rows({ queryResults: [result("article", "a1")] });
    expect(onlyHub.map((r) => r.key)).to.deep.equal(["collections"]);
    expect(columns({ queryResults: [] })).to.deep.equal([]);
  });

  it("names each group with its caption, and each row with its label", () => {
    const [hub, publications] = rows()[0].groups;
    expect(hub.caption).to.deep.equal({
      id: "hub-chips-caption",
      text: "Research Hub includes Articles, Web Apps, and Datasets",
    });
    expect(publications.caption).to.deep.equal({
      id: "publications-chips-caption",
      text: "ICJIA’s library since 1983",
    });
    expect(rows()[1].groups[0].caption).to.equal(null);
    const view = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    expect(view).to.include(":role=\"group.caption ? 'group' : null\"");
    expect(view).to.match(
      /:aria-labelledby="\s*group\.caption \? group\.caption\.id : null\s*"/
    );
    expect(view).to.match(
      /<p\s+v-if="group\.caption"\s+:id="group\.caption\.id"\s+class="filter-chip-set__caption"\s*>\s*\{\{ group\.caption\.text \}\}\s*<\/p>/
    );
    expect(view).to.include(":role=\"row.label ? 'group' : null\"");
    expect(view).to.include(
      ':aria-labelledby="row.label ? `${row.key}-row-label` : null"'
    );
  });

  // The row labels sit above the chips; No filter has an empty label, hidden
  // from screen readers, so that it lines up with the chips of the first row.
  // At phone width it is on a line of its own and the empty label goes.
  it("lines No filter up with the first row of chips", () => {
    const view = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    expect(view).to.include(":aria-hidden=\"row.label ? null : 'true'\"");
    expect(view).to.include('{{ row.label || "\\u00a0" }}');
    expect(view.split("<style")[1]).to.match(
      /@media \(max-width: 600px\)[^@]*\.search-toolbar__row-label\[aria-hidden="true"\]\s*\{\s*display: none;/
    );
  });

  // One colour marks a group: its chips' outlines and text, the bracket under
  // them and the caption (v1.5.101). The chip in use stays black and a hovered
  // one blue: their own rules colour them, and a plainer selector here would
  // outrank them. Each group has a colour of its own (v1.5.102).
  it("gives each group one colour, but not the chip in use or hovered", () => {
    const css = fs
      .readFileSync(
        path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
        "utf8"
      )
      .split("<style")[1];
    expect(css).to.match(
      /\.filter-chip-set--captioned\s+\.filter-chip:not\(\.filter-chip--active\):not\(:hover\)\s*\{\s*border-color: var\(--set-colour\);\s*color: var\(--set-colour\);/
    );
    expect(css).to.match(
      /\.filter-chip-set__caption::before\s*\{[^}]*border: solid var\(--set-colour\);/
    );
    expect(css).to.match(
      /\.filter-chip-set--captioned \.filter-chip-set__caption\s*\{[^}]*\bcolor: var\(--set-colour\);/
    );
    const colourOf = (key) =>
      (css.match(
        new RegExp(
          `\\.filter-chip-set--${key}\\s*\\{\\s*--set-colour: (#[0-9a-f]{6});`
        )
      ) || [])[1];
    expect(colourOf("hub")).to.equal("#0d47a1");
    expect(colourOf("publications")).to.match(/^#[0-9a-f]{6}$/);
    expect(colourOf("publications")).to.not.equal(colourOf("hub"));
  });

  // Squeezed to the width of its one chip, the Publications caption took three
  // lines, at phone width too, beside an empty row. It is one line, and the
  // group is as wide as the longer of the chip and the caption.
  it("keeps the Publications caption on one line", () => {
    const css = fs
      .readFileSync(
        path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
        "utf8"
      )
      .split("<style")[1];
    const shared = css.indexOf(
      ".filter-chip-set--captioned .filter-chip-set__caption {"
    );
    const own = css.indexOf(
      ".filter-chip-set--publications .filter-chip-set__caption {"
    );
    expect(shared, "the shared caption rule").to.be.above(-1);
    expect(own, "the Publications caption rule, after it").to.be.above(shared);
    expect(css.slice(own, css.indexOf("}", own))).to.match(
      /width: auto;\s*min-width: 0;\s*white-space: nowrap;/
    );
  });
});

// v1.5.120: a "Press Releases" chip, for the news posts that are press
// releases and media advisories (by their category, as the press page lists
// them). Like "hub", "press" is not a content type. The chip follows the News
// chip, whose count keeps them: they are news posts, and the chip narrows.
describe("Search page: Press Releases filter", () => {
  const post = (category, title) => ({
    item: { contentType: "news", category, title },
  });
  const MIXED = [
    result("page", "A page"),
    post("news", "A news post"),
    post("pressRelease", "A press release"),
    post("mediaAdvisory", "A media advisory"),
    post("news", "Another news post"),
    result("publication", "A publication"),
  ];

  it("offers a Press Releases chip after the News chip, counting press releases and media advisories", () => {
    const chips = page({ queryResults: MIXED }).availableFilterChips;
    const at = chips.findIndex((c) => c.value === "news");
    expect(at).to.be.greaterThan(0);
    expect(chips[at].count).to.equal(4);
    expect(chips[at + 1]).to.deep.equal({
      value: "press",
      label: "Press Releases",
      count: 2,
    });
  });

  it("offers no Press Releases chip when no press release was found", () => {
    const chips = page().availableFilterChips;
    expect(chips.map((c) => c.value)).to.not.include("press");
    expect(chips.map((c) => c.value)).to.include("news");
  });

  it("keeps only press releases and media advisories when the chip is chosen; the News chip keeps them all", () => {
    const vm = page({ queryResults: MIXED, contentSelected: "press" });
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.filteredResults.map((r) => r.item.title)).to.deep.equal([
      "A press release",
      "A media advisory",
    ]);
    vm.contentSelected = "news";
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.filteredResults.length).to.equal(4);
  });

  it("applies ?filter=press from the address when the results have one", () => {
    const routeFilter = (state) =>
      SearchStatic.methods.routeFilter.call(
        page({ $route: { query: { filter: "press" } }, ...state })
      );
    expect(routeFilter({ queryResults: MIXED })).to.equal("press");
    expect(routeFilter()).to.equal("No filter");
  });

  it("is a loose chip, in no group", () => {
    const vm = page({ queryResults: MIXED });
    const groups = [].concat(
      ...SearchStatic.computed.filterChipColumns
        .call(vm)[1]
        .map((row) => row.groups)
    );
    const run = groups.find((g) => g.chips.some((c) => c.value === "press"));
    expect(run.caption).to.equal(null);
  });
});

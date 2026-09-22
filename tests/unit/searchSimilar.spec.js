/* eslint-env mocha */
// =============================================================================
// Site search: results that hold the typed words, and similar results (v1.5.95)
//
// The search allows one wrong letter in a word of five to nine letters, and a
// match may sit anywhere, even across a space: "drone" also returned "Sharone
// Mitchell", "New Ways to get the Job Done" and "Violence Prevention Planning
// and One Time Supports" ("d One"). Across 70 everyday searches on the public
// index a third of all results did not hold the typed word, and for "contact"
// ("Contractual" job postings) and "forms" ("Reform", "Uniform") they reached
// the first ten. Fuse's score cannot tell the two apart: it multiplies over
// every field that matched, so the biography scored beside a drone report.
//
// What can be checked is whether every typed word begins a word of the record.
// Those results come first; the rest are marked similar and the page keeps
// them folded away until they are asked for. Within each group the site's
// pages (and the partner sites and plans of the Partners menu) come before
// individual posts: "jobs" is a search for the Employment page, which was
// 218th of 228, behind every posting.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import { searchOptions, searchAll } from "@/utils/searchFields";
import SearchStatic from "@/views/Search/SearchStatic.vue";
import { keptSearchView } from "@/utils/searchReturn";

const sample = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "tests/unit/fixtures/searchSample.json"),
    "utf8"
  )
);
const build = (records) =>
  new Fuse(records, searchOptions(Fuse, config.search.site));
const search = (query, records = sample.records) =>
  searchAll(build(records), query);
const titles = (results) => results.map((r) => r.item.title.trim());
const record = (title, contentType = "article", more = {}) => ({
  title,
  contentType,
  fullPath: `/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`,
  ...more,
});

describe("Site search: results that hold the typed words come first", () => {
  it('marks what is only a letter away from "drone" as similar, and lists it last', () => {
    const results = search("drone");
    const similar = results.filter((r) => r.similar);
    expect(titles(similar)).to.have.members([
      "Sharone Mitchell",
      "New Ways to get the Job Done",
      "Violence Prevention Planning and One Time Supports",
    ]);
    const holds = results.filter((r) => !r.similar);
    expect(holds.length).to.equal(5);
    holds.forEach((r) => expect(r.item.title).to.match(/drone/i));
    expect(results.slice(0, holds.length)).to.deep.equal(holds);
  });

  it("finds the singular of a typed plural", () => {
    const results = search("drones");
    expect(results.length).to.be.greaterThan(0);
    const drone = results.filter((r) => /drone/i.test(r.item.title));
    expect(drone.length).to.equal(5);
    drone.forEach((r) => expect(r).to.not.have.property("similar"));
  });

  it("a word is held where it begins a word, not inside one", () => {
    const results = search("ari", [
      record("Adult Redeploy Illinois (ARI) sites"),
      record("Maria Lopez", "biography", { fullName: "Maria Lopez" }),
    ]);
    expect(titles(results)).to.deep.equal([
      "Adult Redeploy Illinois (ARI) sites",
      "Maria Lopez",
    ]);
    expect(results.map((r) => Boolean(r.similar))).to.deep.equal([false, true]);
  });

  it("a word still being typed is held by the words it begins", () => {
    const results = search("homic");
    expect(results.length).to.be.greaterThan(0);
    results
      .filter((r) => /homicide/i.test(r.item.title))
      .forEach((r) => expect(r).to.not.have.property("similar"));
  });

  it('does not take "statute" for "status", nor "United" for "units"', () => {
    const results = search("status", [
      record("Grant status request"),
      record("Statute of limitations"),
    ]);
    expect(titles(results.filter((r) => !r.similar))).to.deep.equal([
      "Grant status request",
    ]);
    expect(titles(results.filter((r) => r.similar))).to.deep.equal([
      "Statute of limitations",
    ]);
    // The singular of a typed plural is held as a whole word only.
    const units = search("units", [
      record("Research units"),
      record("United Way partnership"),
      record("A unit of local government"),
    ]);
    expect(titles(units.filter((r) => !r.similar))).to.have.members([
      "Research units",
      "A unit of local government",
    ]);
    expect(titles(units.filter((r) => r.similar))).to.deep.equal([
      "United Way partnership",
    ]);
  });

  it('"policy" is contained in "policies", and not in "police"', () => {
    const results = search("policy", [
      record("IRB policies and procedures"),
      record("Police use of discretion"),
      record("Privacy policy"),
    ]);
    expect(titles(results.filter((r) => !r.similar))).to.have.members([
      "IRB policies and procedures",
      "Privacy policy",
    ]);
    expect(titles(results.filter((r) => r.similar))).to.deep.equal([
      "Police use of discretion",
    ]);
  });

  it("reads a typeset apostrophe as the typed one", () => {
    const results = search("state's attorney", [
      record("Cook County State’s Attorney pilot"),
    ]);
    expect(results.length).to.equal(1);
    expect(results[0]).to.not.have.property("similar");
  });

  it("a misspelt word is held by nothing: every result is similar", () => {
    const results = search("homocide");
    expect(results.length).to.be.greaterThan(0);
    results.forEach((r) => expect(r.similar).to.equal(true));
    expect(results[0].item.fullPath).to.equal("/homicide/");
  });

  it("with several words, every word must be held", () => {
    const results = search("use force", [
      record("Police use of force policies"),
      record("House enforcement rules"),
    ]);
    expect(titles(results.filter((r) => !r.similar))).to.deep.equal([
      "Police use of force policies",
    ]);
    expect(titles(results.filter((r) => r.similar))).to.deep.equal([
      "House enforcement rules",
    ]);
    const reform = search("police reform");
    expect(reform[0].item.title).to.match(/police reform/i);
    expect(reform[0]).to.not.have.property("similar");
  });

  it("returns the item, its index and the mark, and nothing else", () => {
    const results = search("drone");
    results.forEach((r) => {
      const keys = Object.keys(r).sort();
      expect(keys).to.deep.equal(
        r.similar ? ["item", "refIndex", "similar"] : ["item", "refIndex"]
      );
    });
  });
});

describe("Site search: pages come before individual posts", () => {
  it('"jobs" leads with the Employment page, not with a posting', () => {
    const results = search("jobs");
    expect(results[0].item.fullPath).to.equal("/about/employment/");
    expect(results.length).to.be.greaterThan(4);
    results
      .slice(1)
      .forEach((r) => expect(r.item.contentType).to.equal("employment"));
  });

  it('"drone" leads with the drone reporting page', () => {
    expect(search("drone")[0].item.fullPath).to.equal(
      "/innovation-and-digital-services/drone/"
    );
  });

  it("a partner site or a plan counts as a page", () => {
    const results = search("widgetry", [
      record("Widgetry", "news"),
      record("The Widgetry Council of Illinois", "partner site"),
      record("Statewide Widgetry Plan: 2025-2029", "plan"),
    ]);
    // "Widgetry", the news post, is the search's own first result.
    const types = results.map((r) => r.item.contentType);
    expect(types.slice(0, 2)).to.have.members(["partner site", "plan"]);
    expect(types[2]).to.equal("news");
  });

  it("pages keep the order the search gave them", () => {
    const pages = search("research")
      .filter((r) => !r.similar && r.item.contentType === "page")
      .map((r) => r.item.fullPath);
    const plain = build(sample.records)
      .search("research")
      .filter((r) => r.item.contentType === "page")
      .map((r) => r.item.fullPath);
    expect(pages.length).to.be.greaterThan(1);
    expect(pages).to.deep.equal(plain.filter((p) => pages.includes(p)));
  });

  it("a page that only resembles the word stays below a post that holds it", () => {
    const results = search("drone", [
      record("Sharone Mitchell biography page", "page"),
      record("Drone surveillance report", "publication"),
    ]);
    expect(titles(results)).to.deep.equal([
      "Drone surveillance report",
      "Sharone Mitchell biography page",
    ]);
  });
});

describe("Site search: a post titled with the typed words comes before other posts", () => {
  // "safe-t": the two records titled "The 2021 SAFE-T Act: ..." were third and
  // fourth, behind a literature review that holds the word in a tag. The
  // search favours a short field that matches exactly, so one exact tag beats
  // a long title, and a search of one word had no rule for titles at all. A
  // title that holds every typed word is a direct hit.
  const review = record(
    "The Effectiveness and Implications of Police Reform: A Review of the Literature",
    "article",
    { tags: ["SAFE-T Act", "use of force"] }
  );
  const act = record(
    "The 2021 SAFE-T Act: ICJIA Roles and Responsibilities",
    "publication",
    { tags: ["legislation"] }
  );
  const overview = record(
    "An Overview of Police Use of Force Policies and Research",
    "article",
    { tags: ["policing"] }
  );

  it('"safe-t" leads with the record titled "SAFE-T Act"', () => {
    expect(titles(search("safe-t", [review, act]))).to.deep.equal([
      act.title,
      review.title,
    ]);
  });

  it("with several words, the title must hold every one of them", () => {
    expect(titles(search("use of force", [review, overview]))).to.deep.equal([
      overview.title,
      review.title,
    ]);
  });

  // A page is found by the keywords it is given, not by its title: titles do
  // not reorder the pages, and no post comes before a page.
  it("pages stay first, in the order the search gave them", () => {
    const records = [
      record("Widgetry Status Request", "page"),
      record("Funded Programs", "page", { searchMeta: "widgetry" }),
      record("Widgetry in Illinois", "news"),
    ];
    const plain = build(records)
      .search("widgetry")
      .filter((r) => r.item.contentType === "page")
      .map((r) => r.item.title);
    expect(plain[0]).to.equal("Funded Programs");
    expect(titles(search("widgetry", records))).to.deep.equal(
      plain.concat("Widgetry in Illinois")
    );
  });

  // For a person the name and the position are the title. "executive director"
  // led with the director's biography; counting titles alone, a news post that
  // names the office went ahead of it, and the biography fell to fifth.
  it("a person's position counts as a title", () => {
    const results = search("executive director", [
      record("A Juneteenth Message from the Executive Director", "news"),
      record("Delrice Adams", "biography", {
        fullName: "Delrice Adams",
        position: "Executive Director",
        searchMeta: " OED Office of the Executive Director ",
        unit: { title: "Office of the Executive Director" },
      }),
    ]);
    expect(titles(results)[0]).to.equal("Delrice Adams");
  });
});

describe('Site search: "annual report" is a search for the reports', () => {
  // Pages come first for anything that holds the words, and three pages held
  // "annual report" in their keywords or tags (About the Authority: "latest
  // annual report"), ahead of 97 results titled "... Annual Report". Nothing in
  // the records tells that page from the Funding Opportunities page, which
  // leads "notice of funding opportunity" by the same kind of keyword, so the
  // search is named: for it, results keep the search's own order.
  const records = [
    record("About the Authority", "page", {
      searchMeta: "latest annual report",
    }),
    record("Publications and reports", "page", { tags: ["annual reports"] }),
    record("SFY24 ICJIA Annual Report", "publication"),
    record("ICJIA Releases FY21 Annual Report", "news"),
  ];
  const first = (query) => search(query, records)[0].item;

  it("the reports lead, and the pages are still found", () => {
    [
      "annual report",
      "annual reports",
      "Annual Report",
      "icjia annual report",
    ].forEach((query) => {
      expect(first(query).contentType, query).to.not.equal("page");
      expect(first(query).title, query).to.match(/annual report/i);
    });
    expect(titles(search("annual report", records))).to.include(
      "About the Authority"
    );
  });

  it("a page still leads a search for one of the words", () => {
    expect(first("reports").contentType).to.equal("page");
  });
});

// The results page, its computed properties and methods run against a plain
// object, as in tests/unit/searchPaging.spec.js.
const results = (held, similar = 0) =>
  Array.from({ length: held + similar }, (_, i) => ({
    item: { contentType: "article", title: `Result ${i + 1}` },
    refIndex: i,
    ...(i >= held ? { similar: true } : {}),
  }));
const page = (state = {}) => {
  const vm = {
    query: "drone",
    searchedQuery: "drone",
    queryResults: [],
    filteredResults: [],
    contentSelected: "No filter",
    shownCount: 50,
    showSimilar: false,
    $route: { query: {} },
    ...state,
  };
  [
    "wordResults",
    "similarResults",
    "similarOpen",
    "listedResults",
    "visibleResults",
    "visibleWordResults",
    "visibleSimilarResults",
    "searchedWords",
    "quotedWords",
    "similarNote",
  ].forEach((name) => {
    Object.defineProperty(vm, name, {
      get: () => SearchStatic.computed[name].call(vm),
    });
  });
  vm.arrayToList = (array) =>
    array.join(", ").replace(/, ((?:.(?!, ))+)$/, " and $1");
  return vm;
};

describe("Search page: similar results are folded away", () => {
  it("lists the results that hold the words, and keeps the similar ones back", () => {
    const vm = page({ filteredResults: results(7, 14) });
    expect(vm.wordResults.length).to.equal(7);
    expect(vm.similarResults.length).to.equal(14);
    expect(vm.similarOpen).to.equal(false);
    expect(vm.visibleResults.length).to.equal(7);
    expect(vm.visibleSimilarResults.length).to.equal(0);
  });

  it("shows them when asked, after the results that hold the words", () => {
    const vm = page({ filteredResults: results(7, 14) });
    SearchStatic.methods.toggleSimilar.call(vm);
    expect(vm.showSimilar).to.equal(true);
    expect(vm.similarOpen).to.equal(true);
    expect(vm.visibleResults.length).to.equal(21);
    expect(vm.visibleWordResults.length).to.equal(7);
    expect(vm.visibleSimilarResults.length).to.equal(14);
    expect(vm.visibleSimilarResults[0].item.title).to.equal("Result 8");
    SearchStatic.methods.toggleSimilar.call(vm);
    expect(vm.visibleResults.length).to.equal(7);
  });

  it("shows them at once when nothing holds the words (a misspelling)", () => {
    const vm = page({
      query: "homocide",
      searchedQuery: "homocide",
      filteredResults: results(0, 27),
    });
    expect(vm.similarOpen).to.equal(true);
    expect(vm.visibleResults.length).to.equal(27);
  });

  it("fifty at a time runs on through the similar results", () => {
    const vm = page({ filteredResults: results(60, 58), showSimilar: true });
    expect(vm.visibleWordResults.length).to.equal(50);
    expect(vm.visibleSimilarResults.length).to.equal(0);
    vm.shownCount = 100;
    expect(vm.visibleWordResults.length).to.equal(60);
    expect(vm.visibleSimilarResults.length).to.equal(40);
    const closed = page({ filteredResults: results(60, 58), shownCount: 100 });
    expect(closed.listedResults.length).to.equal(60);
    expect(closed.visibleResults.length).to.equal(60);
  });

  it("opened after exactly fifty results, shows similar results all the same", () => {
    const vm = page({ filteredResults: results(50, 8) });
    SearchStatic.methods.toggleSimilar.call(vm);
    expect(vm.visibleSimilarResults.length).to.equal(8);
  });

  it("another filter folds them away again", () => {
    const vm = page({
      queryResults: results(7, 14),
      showSimilar: true,
      shownCount: 100,
    });
    SearchStatic.methods.filterResults.call(vm);
    expect(vm.showSimilar).to.equal(false);
    expect(vm.visibleResults.length).to.equal(7);
  });

  it("says which words the first results hold", () => {
    const one = page({ filteredResults: results(7, 14) });
    expect(one.searchedWords).to.deep.equal(["drone"]);
    expect(one.similarNote).to.equal(
      "These 14 results do not contain the word “drone”. They match a similar spelling, or part of a longer word."
    );
    const several = page({
      query: "use of force",
      searchedQuery: "use of force",
      filteredResults: results(25, 1),
    });
    expect(several.searchedWords).to.deep.equal(["use", "force"]);
    expect(several.similarNote).to.equal(
      "This result does not contain every word (“use” and “force”). It matches a similar spelling, or part of a longer word."
    );
  });

  it("a new search folds them away again", async () => {
    const vm = page({
      query: "police",
      showSimilar: true,
      searchSeq: 0,
      searchFromRoute: false,
      announceWhenSearched: false,
      fuse: { search: async () => results(3, 2) },
    });
    vm.filterResults = SearchStatic.methods.filterResults;
    vm.syncAddress = () => {};
    vm.recordSearch = () => {}; // Plausible: tests/unit/searchRecording.spec.js
    await SearchStatic.methods.instantSearch.call(vm);
    expect(vm.showSimilar).to.equal(false);
    expect(vm.visibleResults.length).to.equal(3);
  });

  it("Back returns to the list as it was left, similar results and all", () => {
    window.scrollTo = () => {};
    Object.defineProperty(window, "scrollY", {
      value: 900,
      configurable: true,
    });
    SearchStatic.methods.keepView.call({
      entryKey: "similar-1",
      searchedQuery: "drone",
      shownCount: 50,
      lastResultIndex: 9,
      showSimilar: true,
    });
    expect(keptSearchView("similar-1", "drone").showSimilar).to.equal(true);
    const vm = {
      entryKey: "similar-1",
      searchedQuery: "drone",
      shownCount: 50,
      showSimilar: false,
      $nextTick: (fn) => fn(),
      $el: { querySelector: () => null },
    };
    SearchStatic.methods.restoreView.call(vm);
    expect(vm.showSimilar).to.equal(true);
  });
});

describe("Search page: the status message names the two groups", () => {
  const status = (state) => SearchStatic.methods.resultStatus.call(page(state));

  it("is unchanged when every result holds the words", () => {
    expect(
      status({
        query: "violence",
        queryResults: results(3),
        filteredResults: results(3),
      })
    ).to.equal("3 of 3 results for “violence”");
  });

  it("counts the similar results that are folded away", () => {
    expect(
      status({ queryResults: results(7, 14), filteredResults: results(7, 14) })
    ).to.equal(
      "21 of 21 results for “drone”. 7 contain “drone”; 14 similar results can be shown."
    );
  });

  it("or says that they follow, once they have been asked for", () => {
    expect(
      status({
        queryResults: results(1, 1),
        filteredResults: results(1, 1),
        showSimilar: true,
      })
    ).to.equal(
      "2 of 2 results for “drone”. 1 contains “drone”; 1 similar result follows."
    );
  });

  it("says so when nothing holds the words", () => {
    expect(
      status({
        query: "homocide",
        searchedQuery: "homocide",
        queryResults: results(0, 27),
        filteredResults: results(0, 27),
      })
    ).to.equal(
      "27 of 27 results for “homocide”. None contain “homocide”; these are similar spellings and partial matches."
    );
  });
});

describe("Search page: the similar results are a disclosure", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
    "utf8"
  );
  // The formatter wraps long lines, so whitespace is not significant here.
  const template = source
    .slice(0, source.indexOf("<script>"))
    .replace(/\s+/g, " ");

  it("a button that says whether it is open, and what it opens", () => {
    expect(template).to.include(
      ":aria-expanded=\"similarOpen ? 'true' : 'false'\""
    );
    expect(template).to.include('aria-controls="search-similar-results"');
    expect(template).to.include('id="search-similar-results"');
    expect(template).to.include('@click="toggleSimilar()"');
    expect(template).to.match(
      /Show {{ similarResults\.length }} similar result/
    );
    expect(template).to.include("Hide similar results");
  });

  it("has no button when there is nothing else to show", () => {
    expect(template).to.match(
      /<v-btn v-if="wordResults\.length"[^>]*@click="toggleSimilar\(\)"/
    );
  });

  it("comes after the last result that holds the words", () => {
    expect(template).to.match(
      /v-if="\s*similarResults\.length && visibleWordResults\.length === wordResults\.length\s*"/
    );
    expect(template).to.include("Similar spellings and partial matches");
  });

  it("numbers the similar results on from the others, for focus and for Back", () => {
    expect(template).to.include(
      'v-for="(result, index) in visibleWordResults"'
    );
    expect(template).to.include(
      'v-for="(result, index) in visibleSimilarResults"'
    );
    expect(template).to.include(
      ':data-result-index="wordResults.length + index"'
    );
  });
});

describe("Site search: the worker marks and orders results as the app does", () => {
  it("same results, same order, same marks", () => {
    const worker = fs.readFileSync(
      path.join(process.cwd(), "public/searchWorker.js"),
      "utf8"
    );
    const start = worker.indexOf("const SEARCH_HEAD_LENGTH");
    const end = worker.indexOf("// Message dispatcher");
    const source = worker.slice(start, worker.lastIndexOf("// ----", end));
    // eslint-disable-next-line no-new-func
    const api = new Function(
      "Fuse",
      `${source}\nreturn { searchOptions, searchAll };`
    )(Fuse);
    const theirs = new Fuse(
      sample.records,
      api.searchOptions(config.search.site)
    );
    const ours = build(sample.records);
    const shape = (list) =>
      list.map((r) => `${r.similar ? "~" : " "} ${r.item.fullPath}`);
    for (const query of [
      "drone",
      "drones",
      "jobs",
      "homocide",
      "police",
      "use of force",
      "state's attorney",
      "grants",
      "annual report",
    ]) {
      expect(shape(api.searchAll(theirs, query)), query).to.deep.equal(
        shape(searchAll(ours, query))
      );
    }
  });
});

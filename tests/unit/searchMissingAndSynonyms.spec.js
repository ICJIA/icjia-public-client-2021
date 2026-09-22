/* eslint-env mocha */
// =============================================================================
// Two more of the search improvements chosen on 2026-09-22 (v1.5.122)
//
// A word dropped when nothing holds every typed word: "domestic violence
// statistics" found nothing, since no record holds all three words, where
// Google shows the results for "domestic violence" and says "Missing:
// statistics". The search drops the word with the fewest hits, searches the
// rest, and marks every result with the words left out.
//
// Synonyms: the words a visitor types and the words the site uses for the
// same thing (src/config/searchSynonyms.json: "bail" -> "pretrial"). A search
// for the typed word also searches its synonyms, and a result holding a
// synonym holds the word. The worker (public/searchWorker.js) carries the same
// code and is given the table when it starts.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import {
  searchOptions,
  searchAll,
  useSynonyms,
  synonymsOf,
} from "@/utils/searchFields";
import { searchEvent } from "@/utils/search";
import TABLE from "@/config/searchSynonyms.json";

const record = (fullPath, title, summary, contentType = "article") => ({
  fullPath,
  title,
  summary,
  contentType,
  searchMeta: "",
  tags: [],
});
const RECORDS = [
  record("/a/", "Domestic Violence Pretrial Practices", "A working group."),
  record("/b/", "Domestic Violence Fatality Review", "The committee's report."),
  record("/c/", "Uniform Crime Statistics Task Force", "Its final report."),
  record("/d/", "Police Reform in Illinois", "A review of reform."),
  record("/e/", "Law Enforcement Training Needs", "A survey of agencies."),
  record("/f/", "Firearm Offenders and Recidivism", "An analysis."),
  record("/g/", "Pretrial Release Outcomes", "Outcomes after release."),
];
const build = (records = RECORDS) =>
  new Fuse(records, searchOptions(Fuse, config.search.site));
const paths = (results) => results.map((r) => r.item.fullPath);

// The search code the worker carries, run in place.
const workerApi = () => {
  const worker = fs.readFileSync(
    path.join(process.cwd(), "public/searchWorker.js"),
    "utf8"
  );
  const start = worker.indexOf("const SEARCH_HEAD_LENGTH");
  const end = worker.indexOf("// Message dispatcher");
  const source = worker.slice(start, worker.lastIndexOf("// ----", end));
  // eslint-disable-next-line no-new-func
  return new Function(
    "Fuse",
    `${source}\nreturn { searchOptions, searchAll, useSynonyms, synonymsOf };`
  )(Fuse);
};

describe("A word is dropped when nothing holds every typed word", () => {
  beforeEach(() => useSynonyms({}));

  it("searches the other words and says which word is missing", () => {
    const results = searchAll(build(), "domestic violence statistics");
    expect(paths(results.filter((r) => !r.similar))).to.deep.equal([
      "/a/",
      "/b/",
    ]);
    results.forEach((r) => expect(r.missing).to.deep.equal(["statistics"]));
  });

  it("drops the word with the fewest hits", () => {
    // "statistics" is held by one record, "domestic" and "violence" by two.
    const results = searchAll(build(), "statistics domestic violence");
    expect(results[0].missing).to.deep.equal(["statistics"]);
  });

  it("drops one word at a time, and lists every word left out", () => {
    const results = searchAll(build(), "firearm reform outcomes");
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].missing).to.have.length(2);
    expect(results[0].missing).to.include.members(
      results[0].missing.filter((w) =>
        ["reform", "outcomes", "firearm"].includes(w)
      )
    );
    // What is left is one word, held by the results.
    const kept = ["firearm", "reform", "outcomes"].filter(
      (w) => !results[0].missing.includes(w)
    );
    expect(kept).to.have.length(1);
  });

  it("marks nothing missing when a result holds every word", () => {
    const results = searchAll(build(), "domestic violence");
    expect(results.length).to.be.greaterThan(0);
    results.forEach((r) => expect(r).to.not.have.property("missing"));
  });

  it("returns nothing when no typed word is held by anything", () => {
    expect(searchAll(build(), "expungement carjacking")).to.deep.equal([]);
  });

  it("the worker does the same", () => {
    const api = workerApi();
    api.useSynonyms({});
    const fuse = new Fuse(RECORDS, api.searchOptions(config.search.site));
    const theirs = api.searchAll(fuse, "domestic violence statistics");
    const ours = searchAll(build(), "domestic violence statistics");
    expect(theirs).to.deep.equal(ours);
  });

  it("the Search event counts no result as matched", () => {
    const results = searchAll(build(), "domestic violence statistics");
    expect(
      searchEvent("domestic violence statistics", results).props
    ).to.deep.equal({
      query: "domestic violence statistics",
      results: String(results.length),
      matched: "0",
      missing: "statistics",
    });
  });
});

describe("Synonyms", () => {
  afterEach(() => useSynonyms(TABLE));

  it("a search for the typed word finds the site's word, and counts it as held", () => {
    useSynonyms({});
    expect(paths(searchAll(build(), "bail"))).to.deep.equal([]);
    useSynonyms({ bail: ["pretrial"] });
    const results = searchAll(build(), "bail");
    expect(paths(results)).to.include.members(["/a/", "/g/"]);
    results.forEach((r) => expect(r).to.not.have.property("similar"));
    expect(results[0]).to.not.have.property("missing");
  });

  it("in a search of several words too", () => {
    useSynonyms({ bail: ["pretrial"] });
    const results = searchAll(build(), "bail release");
    expect(paths(results.filter((r) => !r.similar))).to.deep.equal(["/g/"]);
    expect(results[0]).to.not.have.property("missing");
  });

  it("a synonym may be a phrase, and a typed plural finds its singular's synonyms", () => {
    useSynonyms({ cops: ["law enforcement"], gun: ["firearm"] });
    expect(paths(searchAll(build(), "cops"))).to.deep.equal(["/e/"]);
    expect(paths(searchAll(build(), "guns"))).to.deep.equal(["/f/"]);
  });

  it("reads the table in any case, and skips its notes", () => {
    useSynonyms({ _about: "a note", Bail: ["Pretrial"], odd: "not a list" });
    expect(synonymsOf("BAIL")).to.deep.equal(["pretrial"]);
    expect(synonymsOf("odd")).to.deep.equal([]);
    expect(synonymsOf("_about")).to.deep.equal([]);
  });

  it("the worker searches with the same table", () => {
    const api = workerApi();
    api.useSynonyms({ bail: ["pretrial"] });
    useSynonyms({ bail: ["pretrial"] });
    const fuse = new Fuse(RECORDS, api.searchOptions(config.search.site));
    expect(api.searchAll(fuse, "bail release")).to.deep.equal(
      searchAll(build(), "bail release")
    );
    expect(api.synonymsOf("bail")).to.deep.equal(["pretrial"]);
  });

  it("the app gives the worker the table when it starts", () => {
    const client = fs.readFileSync(
      path.join(process.cwd(), "src/services/searchClient.js"),
      "utf8"
    );
    const worker = fs.readFileSync(
      path.join(process.cwd(), "public/searchWorker.js"),
      "utf8"
    );
    expect(client).to.include('"@/config/searchSynonyms.json"');
    expect(client).to.match(/type: "INIT"[^}]*synonyms/);
    expect(worker).to.include("useSynonyms(msg.synonyms");
  });
});

describe("The shipped synonym table", () => {
  const entries = Object.entries(TABLE).filter(([key]) => !key.startsWith("_"));

  it("has a note on how to edit it, and well over a hundred entries", () => {
    expect(TABLE._about).to.be.a("string");
    expect(entries.length).to.be.at.least(150);
  });

  it("is in lower case, one typed word to a list of the site's words", () => {
    entries.forEach(([key, values]) => {
      expect(key, key).to.match(/^[a-z0-9'-]+$/);
      expect(values, key).to.be.an("array").that.is.not.empty;
      values.forEach((v) => expect(v, key).to.match(/^[a-z0-9' -]+$/));
    });
  });

  it("starts with the pairs the failed searches showed", () => {
    expect(TABLE.bail).to.include("pretrial");
    expect(TABLE.murder).to.include("homicide");
    expect(TABLE.gun).to.include("firearm");
    expect(TABLE.dv).to.include("domestic violence");
  });
});

// The page says what the search did (v1.5.122): the typed word left out and
// the words the results are for; the synonyms searched with the typed words;
// and, when nothing was found at all, the main pages to start from.
describe("The search page says so", () => {
  const SearchStatic = require("@/views/Search/SearchStatic.vue").default;
  // The page's data, which holds the list helper and the pages offered.
  const DATA = SearchStatic.data.call({
    $refs: {},
    $route: { query: {}, params: {} },
  });
  const page = (state = {}) => {
    const vm = {
      query: "domestic violence statistics",
      searchedQuery: "domestic violence statistics",
      queryResults: [],
      filteredResults: [],
      sortSwitch: false,
      showSimilar: false,
      arrayToList: DATA.arrayToList,
      ...state,
    };
    [
      "missingWords",
      "searchedWords",
      "quotedWords",
      "quotedMissing",
      "searchedSynonyms",
      "quotedSynonyms",
      "orderedResults", // v1.5.123: the order shown
      "wordResults",
      "similarResults",
    ].forEach((name) =>
      Object.defineProperty(vm, name, {
        get: () => SearchStatic.computed[name].call(vm),
      })
    );
    return vm;
  };
  const found = (missing) => [
    { item: { fullPath: "/a/" }, missing },
    { item: { fullPath: "/b/" }, missing },
  ];

  it("names the word left out, and searches the rest", () => {
    const vm = page({
      queryResults: found(["statistics"]),
      filteredResults: found(["statistics"]),
    });
    expect(vm.missingWords).to.deep.equal(["statistics"]);
    expect(vm.searchedWords).to.deep.equal(["domestic", "violence"]);
    expect(vm.quotedMissing).to.equal("“statistics”");
    expect(SearchStatic.methods.resultStatus.call(vm)).to.include(
      "Nothing contains “statistics”"
    );
  });

  it("names nothing when every word was held", () => {
    const vm = page({ queryResults: found(undefined) });
    expect(vm.missingWords).to.deep.equal([]);
    expect(vm.searchedWords).to.deep.equal([
      "domestic",
      "violence",
      "statistics",
    ]);
    expect(SearchStatic.methods.resultStatus.call(vm)).to.not.include(
      "Nothing contains"
    );
  });

  it("names the synonyms searched with the typed words", () => {
    useSynonyms({ bail: ["pretrial"], gun: ["firearm"] });
    const vm = page({ query: "bail guns", searchedQuery: "bail guns" });
    expect(vm.searchedSynonyms).to.deep.equal(["pretrial", "firearm"]);
    expect(vm.quotedSynonyms).to.equal("“pretrial” and “firearm”");
    useSynonyms(TABLE);
    expect(page().searchedSynonyms).to.deep.equal(["data"]);
  });

  it("offers the main pages when nothing was found", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    const pages = DATA.emptyStatePages.map((p) => p.path);
    expect(pages).to.include.members([
      "/grants/funding/",
      "/about/employment/",
      "/researchhub/",
      "/about/publications/",
      "/news/",
      "/news/meetings/",
      "/about/contact/",
    ]);
    expect(source).to.include('v-for="page in emptyStatePages"');
  });
});

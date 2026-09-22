/* eslint-env mocha */
// =============================================================================
// Results in date order, newest first (v1.5.123)
//
// The search page had a "Sort by published date" switch, commented out of the
// template, whose method sorted by a field the index does not carry. A switch
// in the toolbar now orders the results by the date the result card shows:
// a publication's or a news post's publicationDate, a Research Hub item's
// date, and otherwise the record's published_at (a funding notice, a job, a
// meeting). Results with no date (partner sites, plans, some pages) come last.
// The results that hold every typed word stay before the similar ones, each
// group in date order, and the filter chips still apply. Off, the order is
// the search's (best match first), as before.
// =============================================================================
import { expect } from "chai";
import { resultDate, newestFirst } from "@/utils/search";
import SearchStatic from "@/views/Search/SearchStatic.vue";

const result = (fullPath, item = {}, similar = false) =>
  Object.assign({ item: { fullPath, ...item } }, similar ? { similar } : {});

describe("The date of a result", () => {
  it("is the one the card shows: publicationDate, else date, else published_at", () => {
    expect(
      resultDate({
        publicationDate: "2019-03-01",
        date: "2026-01-01",
        published_at: "2026-08-21T19:16:02.800Z",
      })
    ).to.equal(Date.parse("2019-03-01"));
    expect(
      resultDate({
        date: "2026-01-12T00:00:00.000Z",
        published_at: "2020-01-01",
      })
    ).to.equal(Date.parse("2026-01-12T00:00:00.000Z"));
    expect(resultDate({ published_at: "2021-05-24T14:06:46.922Z" })).to.equal(
      Date.parse("2021-05-24T14:06:46.922Z")
    );
  });

  it("is null without one, or with one that is not a date", () => {
    expect(resultDate({})).to.equal(null);
    expect(resultDate({ publicationDate: "unknown" })).to.equal(null);
    expect(resultDate(null)).to.equal(null);
  });
});

describe("Newest first", () => {
  const RESULTS = [
    result("/old/", { publicationDate: "2019-03-01" }),
    result("/undated/", {}),
    result("/new/", { date: "2026-01-12" }),
    result("/mid/", { published_at: "2021-05-24T14:06:46.922Z" }),
    result("/similar-new/", { publicationDate: "2026-05-01" }, true),
    result("/similar-old/", { publicationDate: "2001-05-01" }, true),
  ];

  it("orders by date, newest first, undated last, the similar results after the rest", () => {
    expect(newestFirst(RESULTS).map((r) => r.item.fullPath)).to.deep.equal([
      "/new/",
      "/mid/",
      "/old/",
      "/undated/",
      "/similar-new/",
      "/similar-old/",
    ]);
  });

  it("keeps the given order among equal dates, and leaves the list it is given alone", () => {
    const same = [
      result("/a/", { publicationDate: "2020-01-01" }),
      result("/b/", { publicationDate: "2020-01-01" }),
      result("/c/", {}),
      result("/d/", {}),
    ];
    const copy = same.slice();
    expect(newestFirst(same).map((r) => r.item.fullPath)).to.deep.equal([
      "/a/",
      "/b/",
      "/c/",
      "/d/",
    ]);
    expect(same).to.deep.equal(copy);
  });

  describe("on the page", () => {
    const page = (state = {}) => {
      const vm = {
        filteredResults: RESULTS,
        showSimilar: false,
        sortSwitch: false,
        shownCount: 50,
        ...state,
      };
      [
        "orderedResults",
        "wordResults",
        "similarResults",
        "similarOpen",
        "listedResults",
        "visibleResults",
      ].forEach((name) =>
        Object.defineProperty(vm, name, {
          get: () => SearchStatic.computed[name].call(vm),
        })
      );
      return vm;
    };

    it("the switch orders the results shown, and the similar ones stay folded", () => {
      const vm = page({ sortSwitch: true });
      expect(vm.wordResults.map((r) => r.item.fullPath)).to.deep.equal([
        "/new/",
        "/mid/",
        "/old/",
        "/undated/",
      ]);
      expect(vm.listedResults).to.deep.equal(vm.wordResults);
      vm.showSimilar = true;
      expect(vm.listedResults.map((r) => r.item.fullPath)).to.deep.equal([
        "/new/",
        "/mid/",
        "/old/",
        "/undated/",
        "/similar-new/",
        "/similar-old/",
      ]);
    });

    it("off, the search's own order stands", () => {
      const vm = page();
      expect(vm.wordResults.map((r) => r.item.fullPath)).to.deep.equal([
        "/old/",
        "/undated/",
        "/new/",
        "/mid/",
      ]);
    });

    it("the switch is in the toolbar, labelled, and the old method is gone", () => {
      const source = require("fs").readFileSync(
        require("path").join(
          process.cwd(),
          "src/views/Search/SearchStatic.vue"
        ),
        "utf8"
      );
      expect(source).to.include('v-model="sortSwitch"');
      expect(source).to.include('label="Newest first"');
      expect(source).to.not.include("<!-- <v-switch");
      expect(source).to.not.include("async sortResults()");
    });
  });
});

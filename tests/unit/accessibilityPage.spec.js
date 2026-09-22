/* eslint-env mocha */
// =============================================================================
// The accessibility statement in the search and in the bottom context bar
// (v1.5.118)
//
// The statement (/accessibility/, v1.5.65) is a hand-built view with no CMS
// record. Such a page reaches the search index only through
// generators/manualPages.js, and it was never listed there: a search for
// "accessibility" could not find it. It was in the sitemap alone, through the
// generator's sitemap-only list; its search record covers the sitemap now, so
// the list no longer names it (or the sitemap would hold it twice).
// The bottom context bar (contextMenus.json, "Footer") links to it too,
// between About and Contact, the bar's alphabetical order.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import { searchOptions, searchAll } from "@/utils/searchFields";
import bars from "@/config/contextMenus.json";

const manualPages = require("../../generators/manualPages");

const PAGE = "/accessibility/";

describe("The accessibility statement in the search", () => {
  it("the hand-built page has a record", () => {
    const record = manualPages.find((p) => p.fullPath === PAGE);
    expect(record, PAGE).to.not.equal(undefined);
    expect(record.title).to.equal("Accessibility Statement");
    expect(record.contentType).to.equal("page");
  });

  it("the sitemap gets it from the record, not from the sitemap-only list", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "generators/searchIndexAndSitemap.js"),
      "utf8"
    );
    const list = source.match(/const manualIndex = \[([^\]]*)\]/);
    expect(list, "the sitemap-only list").to.not.equal(null);
    expect(list[1]).to.not.include(PAGE);
  });

  it("a search finds the page first, ahead of records that mention the word", () => {
    // Two records the index holds (2026-09-22) whose summary has the word.
    const records = [
      {
        fullPath: "/about/employment/",
        title: "Employment",
        contentType: "page",
        summary:
          "This system significantly expands access to state employment while increasing transparency, accessibility, accountability, and consistency in the state hiring process.",
        searchMeta: "intern jobs internship intern help careers",
        tags: [],
      },
      {
        fullPath:
          "/researchhub/articles/study-of-self-reported-prescription-drug-use-among-a-sample-of-illinois-prisoners/",
        title:
          "Study of Self-Reported Prescription Drug Use Among a Sample of Illinois Prisoners",
        contentType: "article",
        summary:
          "ICJIA, in collaboration with WestCare Foundation Illinois, surveyed 573 state prisoners on prescription drug use to examine prevalence, accessibility, motivation for use, and effects.",
        searchMeta: "",
        tags: ["drug use", "prison"],
      },
      // eslint-disable-next-line no-unused-vars
    ].concat(manualPages.map(({ shell, ...record }) => record));
    const fuse = new Fuse(records, searchOptions(Fuse, config.search.site));
    [
      "accessibility",
      "accessibility statement",
      "ADA",
      "WCAG",
      "screen reader",
      "disability",
      "assistive technology",
    ].forEach((query) => {
      const found = searchAll(fuse, query)
        .filter((r) => !r.similar)
        .map((r) => r.item.fullPath);
      expect(found[0], query).to.equal(PAGE);
    });
  });
});

describe("The accessibility statement in the bottom context bar", () => {
  const bar = bars.find((b) => b.location === "bottom");

  it("has the link, between About and Contact", () => {
    const labels = bar.items.map((item) => item.label);
    expect(labels.slice(0, 3)).to.deep.equal([
      "About",
      "Accessibility",
      "Contact",
    ]);
  });

  it("leads to the page, and is the bar's one link to it", () => {
    const links = bar.items.filter((item) => item.path === PAGE);
    expect(links).to.have.length(1);
    expect(links[0].label).to.equal("Accessibility");
  });
});

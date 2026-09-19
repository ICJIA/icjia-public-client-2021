/* eslint-env mocha */
// =============================================================================
// Words people search for that a CMS page's own keywords lack (v1.5.95)
//
// "nofo" found 110 funding notices and one job posting, and not the Funding
// Opportunities page, where the notices are listed: the page's keywords in the
// CMS are "funding", and its text says "Notice of Funding Opportunity" only
// further down than the search reads. generators/pageKeywords.js adds the
// words to the page's search record at build time, whatever the CMS holds.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import { searchOptions, searchAll } from "@/utils/searchFields";

const { KEYWORDS, addKeywords } = require("../../generators/pageKeywords");
const sample = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "tests/unit/fixtures/searchSample.json"),
    "utf8"
  )
);
const FUNDING = "/grants/funding/";

describe("Search index: words added to a CMS page's keywords", () => {
  it("adds the words to the page's keywords, and keeps the CMS's own", () => {
    const [page, other] = addKeywords([
      {
        fullPath: FUNDING,
        title: "Funding Opportunities",
        searchMeta: "funding",
      },
      {
        fullPath: "/about/contact/",
        title: "Contact ICJIA",
        searchMeta: "phone",
      },
    ]);
    expect(page.searchMeta).to.match(/^funding /);
    expect(page.searchMeta).to.include("nofo");
    expect(page.searchMeta).to.include("notice of funding opportunity");
    expect(other).to.deep.equal({
      fullPath: "/about/contact/",
      title: "Contact ICJIA",
      searchMeta: "phone",
    });
  });

  it("works for a page with no keywords, and changes nothing it is given", () => {
    const given = [{ fullPath: FUNDING, title: "Funding Opportunities" }];
    const [page] = addKeywords(given);
    expect(page.searchMeta).to.equal(KEYWORDS[FUNDING]);
    expect(given[0]).to.not.have.property("searchMeta");
  });

  it("does not repeat words on a second pass", () => {
    const once = addKeywords([{ fullPath: FUNDING, searchMeta: "funding" }]);
    expect(addKeywords(once)).to.deep.equal(once);
  });

  it("names only pages by their path", () => {
    Object.keys(KEYWORDS).forEach((fullPath) =>
      expect(fullPath).to.match(/^\/.*\/$/)
    );
  });
});

describe('Site search: "nofo" finds the Funding Opportunities page', () => {
  const fuse = new Fuse(
    addKeywords(sample.records),
    searchOptions(Fuse, config.search.site)
  );
  const first = (query) => searchAll(fuse, query)[0];

  it("first, ahead of the notices, singular or plural, in either case", () => {
    ["nofo", "nofos", "NOFO", "NOFOs"].forEach((query) => {
      expect(first(query).item.fullPath, query).to.equal(FUNDING);
      expect(first(query), query).to.not.have.property("similar");
    });
  });

  it("and so does the phrase spelt out", () => {
    expect(first("notice of funding opportunity").item.fullPath).to.equal(
      FUNDING
    );
  });

  it("the notices still follow", () => {
    const results = searchAll(fuse, "nofo");
    expect(results.length).to.be.greaterThan(5);
    expect(results[1].item.contentType).to.equal("funding");
  });

  it('"funding" still leads with the page', () => {
    expect(first("funding").item.fullPath).to.equal(FUNDING);
  });

  it("without the added words the page is not found at all", () => {
    const plain = new Fuse(
      sample.records,
      searchOptions(Fuse, config.search.site)
    );
    expect(searchAll(plain, "nofo").map((r) => r.item.fullPath)).to.not.include(
      FUNDING
    );
  });
});

describe('Site search: "careers" finds the Employment page', () => {
  const EMPLOYMENT = "/about/employment/";
  const fuse = new Fuse(
    addKeywords(sample.records),
    searchOptions(Fuse, config.search.site)
  );

  it("which had no such word, and led nowhere", () => {
    const plain = new Fuse(
      sample.records,
      searchOptions(Fuse, config.search.site)
    );
    expect(searchAll(plain, "careers")).to.deep.equal([]);
    ["careers", "career", "Careers"].forEach((query) => {
      const first = searchAll(fuse, query)[0];
      expect(first.item.fullPath, query).to.equal(EMPLOYMENT);
      expect(first, query).to.not.have.property("similar");
    });
  });

  it('"employment" and "jobs" still find the page, then every posting', () => {
    const postings = sample.records.filter(
      (r) => r.contentType === "employment"
    );
    expect(postings.length).to.be.greaterThan(3);
    ["employment", "jobs"].forEach((query) => {
      const results = searchAll(fuse, query);
      expect(results[0].item.fullPath, query).to.equal(EMPLOYMENT);
      const found = results
        .filter((r) => !r.similar)
        .map((r) => r.item.fullPath);
      postings.forEach((posting) =>
        expect(found, `${query}: ${posting.title}`).to.include(posting.fullPath)
      );
    });
  });
});

describe("Search index: the generator adds the words", () => {
  it("to the CMS pages, before the index is assembled", () => {
    const source = fs
      .readFileSync(
        path.join(process.cwd(), "generators/searchIndexAndSitemap.js"),
        "utf8"
      )
      .replace(/\s+/g, " ");
    expect(source).to.include('require("./pageKeywords")');
    expect(source).to.include("...addKeywords(pages),");
  });
});

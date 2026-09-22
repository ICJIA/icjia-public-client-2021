/* eslint-env mocha */
// =============================================================================
// Press Releases in the search (v1.5.119)
//
// The press page (/news/press/) is a hand-built view, a listing of the news
// posts that are press releases and media advisories. Like the accessibility
// statement before it (v1.5.118), it was in the sitemap alone, through the
// generator's sitemap-only list, and the search could not find it. It has a
// record in generators/manualPages.js now, and the sitemap-only list is empty.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import { searchOptions, searchAll } from "@/utils/searchFields";

const manualPages = require("../../generators/manualPages");

const PAGE = "/news/press/";

describe("Press Releases in the search", () => {
  it("the hand-built page has a record", () => {
    const record = manualPages.find((p) => p.fullPath === PAGE);
    expect(record, PAGE).to.not.equal(undefined);
    expect(record.title).to.equal("Press Releases");
    expect(record.contentType).to.equal("page");
  });

  it("the sitemap-only list is empty: every hand-built page has a record", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "generators/searchIndexAndSitemap.js"),
      "utf8"
    );
    const list = source.match(/const manualIndex = \[([^\]]*)\]/);
    expect(list, "the sitemap-only list").to.not.equal(null);
    expect(list[1].trim()).to.equal("");
  });

  it("a search finds the page first, ahead of a press release", () => {
    const records = [
      {
        fullPath: "/news/icjia-awards-grants-2026/",
        title: "ICJIA Announces Grant Awards",
        contentType: "news",
        category: "pressRelease",
        summary:
          "Press release: the Illinois Criminal Justice Information Authority announced grant awards today.",
        searchMeta: "",
        tags: ["press release"],
      },
      // eslint-disable-next-line no-unused-vars
    ].concat(manualPages.map(({ shell, ...record }) => record));
    const fuse = new Fuse(records, searchOptions(Fuse, config.search.site));
    ["press", "press releases", "press release", "media advisory"].forEach(
      (query) => {
        const found = searchAll(fuse, query)
          .filter((r) => !r.similar)
          .map((r) => r.item.fullPath);
        expect(found[0], query).to.equal(PAGE);
      }
    );
  });
});

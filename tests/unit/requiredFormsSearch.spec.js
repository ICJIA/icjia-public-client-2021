/* eslint-env mocha */
// =============================================================================
// The links on Required Forms, and on Rules, Regulations, and Policies, are
// found by their names (v1.5.97)
//
// /grants/required-forms/ lists 21 forms to download ("100% Time
// Certification", "Budget Revision Request", "Sole Source Justification"...),
// and /grants/rules-regs-policies/ 7 rules, 2 regulations and 9 policies. The
// names come from CMS collections that have no search records: "time
// certification" and "language access plan" found nothing. At build time
// generators/generateIndexPageLinks.js fetches the names, and
// searchIndexAndSitemap.js adds them to each page's keywords
// (generators/pageKeywords.js). They are shown nowhere.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import { searchOptions, searchAll } from "@/utils/searchFields";

const {
  addKeywords,
  linkLabels,
  labelsByPage,
  LINKED_COLLECTIONS,
} = require("../../generators/pageKeywords");
const manualPages = require("../../generators/manualPages");
const sample = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "tests/unit/fixtures/searchSample.json"),
    "utf8"
  )
);

const PAGE = "/grants/required-forms/";
const page = {
  title: "Required Forms",
  altTitle: "required forms",
  searchMeta: "forms gata",
  summary: "ICJIA Required Forms",
  tags: [],
  category: "grants",
  contentType: "page",
  fullPath: PAGE,
};
// As the CMS gives them: mixed case, a stray space, a long one.
const forms = [
  { title: "100% Time Certification" },
  { title: "QUARTERLY TIME KEEPING CERTIFICATION" },
  { title: "BUDGET REVISION REQUEST" },
  { title: "SOLE SOURCE JUSTIFICATION " },
  { title: "DISCLOSURE OF LOBBYING ACTIVITIES" },
  {
    title:
      "EQUAL EMPLOYMENT OPPORTUNITY PROGRAM (EEOP) AND CIVIL RIGHTS COMPLIANCE CERTIFICATION",
  },
  { title: "UNIFORM GRANT AGREEMENT" },
];

describe("Search index: the names of a page's links", () => {
  it("are joined into keywords, tidied", () => {
    expect(
      linkLabels([
        { title: "100% Time Certification" },
        { title: "SOLE  SOURCE JUSTIFICATION " },
        { title: "" },
        {},
      ])
    ).to.equal("100% Time Certification SOLE SOURCE JUSTIFICATION");
    expect(linkLabels([])).to.equal("");
    expect(linkLabels(undefined)).to.equal("");
  });

  it("are added to the page's keywords, after the CMS's own", () => {
    const [record] = addKeywords([page], { [PAGE]: linkLabels(forms) });
    expect(record.searchMeta).to.match(/^forms gata 100% Time Certification /);
    expect(record.searchMeta).to.include("UNIFORM GRANT AGREEMENT");
    expect(page.searchMeta).to.equal("forms gata");
  });

  it("not twice, and not at all when there are none", () => {
    const more = { [PAGE]: linkLabels(forms) };
    const once = addKeywords([page], more);
    expect(addKeywords(once, more)).to.deep.equal(once);
    expect(addKeywords([page], { [PAGE]: "" })).to.deep.equal([page]);
    expect(addKeywords([page], {})).to.deep.equal([page]);
  });

  it("join the words the page is given by hand", () => {
    const funding = { fullPath: "/grants/funding/", searchMeta: "funding" };
    const [record] = addKeywords([funding], {
      "/grants/funding/": "open solicitations",
    });
    expect(record.searchMeta).to.equal(
      "funding nofo nofos notice of funding opportunity rfp apply how to apply grant application open solicitations"
    );
  });
});

describe('Site search: "time certification" finds Required Forms', () => {
  const plain = new Fuse(
    sample.records.concat([page]),
    searchOptions(Fuse, config.search.site)
  );
  const fuse = new Fuse(
    addKeywords(sample.records.concat([page]), { [PAGE]: linkLabels(forms) }),
    searchOptions(Fuse, config.search.site)
  );

  it("which it did not", () => {
    expect(
      searchAll(plain, "time certification").map((r) => r.item.fullPath)
    ).to.not.include(PAGE);
  });

  it("first, by the name of any form on it", () => {
    [
      "time certification",
      "Time Certification",
      "100% time certification",
      "time keeping",
      "budget revision",
      "sole source",
      "lobbying",
      "eeop",
      "uniform grant agreement",
    ].forEach((query) => {
      const first = searchAll(fuse, query)[0];
      expect(first && first.item.fullPath, query).to.equal(PAGE);
      expect(first, query).to.not.have.property("similar");
    });
  });

  it('"required forms" and "forms" still lead with it', () => {
    ["required forms", "forms"].forEach((query) =>
      expect(searchAll(fuse, query)[0].item.fullPath, query).to.equal(PAGE)
    );
  });
});

describe("Search index: which collections name a page's links", () => {
  const RULES = "/grants/rules-regs-policies/";
  // As the CMS answers generateIndexPageLinks.js.
  const data = {
    requiredForms: forms,
    rules: [
      { title: "The Uniform Consideration Of Administrative Appeals" },
      { title: "Violent Crime Witness Protection Program" },
    ],
    regulations: [{ title: "VOCA Regulations" }],
    policies: [
      { title: "Conflict of Interest Policy" },
      { title: "Language Access Plan" },
    ],
  };

  it("Required Forms its forms; Rules, Regulations, and Policies all three", () => {
    expect(LINKED_COLLECTIONS).to.deep.equal({
      [PAGE]: ["requiredForms"],
      [RULES]: ["rules", "regulations", "policies"],
    });
    const labels = labelsByPage(data);
    expect(labels[PAGE]).to.equal(linkLabels(forms));
    expect(labels[RULES]).to.equal(
      "The Uniform Consideration Of Administrative Appeals Violent Crime Witness Protection Program VOCA Regulations Conflict of Interest Policy Language Access Plan"
    );
  });

  it("a collection that was not fetched adds nothing", () => {
    expect(labelsByPage({ rules: data.rules })).to.deep.equal({
      [PAGE]: "",
      [RULES]:
        "The Uniform Consideration Of Administrative Appeals Violent Crime Witness Protection Program",
    });
    expect(labelsByPage(undefined)).to.deep.equal({ [PAGE]: "", [RULES]: "" });
  });

  it("a rule, a regulation or a policy finds its page", () => {
    // The page is hand-built: its record is in generators/manualPages.js.
    const records = sample.records.concat(
      // eslint-disable-next-line no-unused-vars
      addKeywords(manualPages, labelsByPage(data)).map(
        // eslint-disable-next-line no-unused-vars
        ({ shell, ...record }) => record
      )
    );
    const fuse = new Fuse(records, searchOptions(Fuse, config.search.site));
    [
      "administrative appeals",
      "witness protection",
      "voca regulations",
      "conflict of interest policy",
      "language access plan",
    ].forEach((query) => {
      const first = searchAll(fuse, query)[0];
      expect(first && first.item.fullPath, query).to.equal(RULES);
      expect(first, query).to.not.have.property("similar");
    });
    // The Contact page speaks of language access too, and is a page as well.
    const leading = searchAll(fuse, "language access")
      .slice(0, 3)
      .map((r) => r.item.fullPath);
    expect(leading).to.include(RULES);
  });
});

describe("Search index: the build fetches the names", () => {
  const read = (file) =>
    fs.readFileSync(path.join(process.cwd(), file), "utf8");

  it("before the index is assembled", () => {
    const script = JSON.parse(read("package.json")).scripts["generate:search"];
    const fetch = script.indexOf("generateIndexPageLinks");
    expect(fetch).to.be.greaterThan(-1);
    expect(fetch).to.be.lessThan(script.indexOf("searchIndexAndSitemap"));
  });

  it("asks the CMS for every title of every collection named", () => {
    const source = read("generators/generateIndexPageLinks.js");
    expect(source).to.include("LINKED_COLLECTIONS");
    expect(source).to.include("(limit: -1) { title }");
    expect(source).to.include("./public/api/pageLinks.json");
  });

  it("and the index is built even if the names could not be fetched", () => {
    const source = read("generators/searchIndexAndSitemap.js").replace(
      /\s+/g,
      " "
    );
    expect(source).to.include('fs.existsSync("./public/api/pageLinks.json")');
    expect(source).to.include("addKeywords(pages, pageLinks)");
    expect(source).to.include("addKeywords(manualPages, pageLinks)");
  });
});

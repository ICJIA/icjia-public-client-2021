/* eslint-env mocha */
// =============================================================================
// Site search quality
//
// Until v1.5.82 the search scored matches by position (location 0, distance
// 200, threshold 0.25), so only the first 50 or so characters of any field
// could match: a record could be found by a word late in its title about one
// time in four, "funding" put the Funding Opportunities page 111th, and
// "police reform" led with the Privacy Policy. Body text also outweighed
// titles. These tests pin the tuned behaviour on a sample of the public index
// (tests/unit/fixtures/searchSample.json), with the same Fuse build the site
// serves.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import {
  searchOptions,
  searchAll,
  searchWords,
  SEARCH_HEAD_LENGTH,
  HEAD_FIELDS,
} from "@/utils/searchFields";

const sample = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "tests/unit/fixtures/searchSample.json"),
    "utf8"
  )
);
const build = (records) =>
  new Fuse(records, searchOptions(Fuse, config.search.site));
const fuse = build(sample.records);
const rankOf = (query, fullPath) =>
  fuse.search(query).findIndex((r) => r.item.fullPath === fullPath) + 1;

describe("Site search: words anywhere in a title", () => {
  it("finds a record by a word that sits late in its title", () => {
    const missed = sample.probes.filter(([word, fullPath]) => {
      const rank = rankOf(word, fullPath);
      return rank === 0 || rank > 10;
    });
    expect(missed, "not in the first ten results").to.deep.equal([]);
  });

  it("puts the page named for the query at the top", () => {
    expect(rankOf("funding", "/grants/funding/")).to.equal(1);
    expect(rankOf("funding opportunities", "/grants/funding/")).to.equal(1);
    expect(rankOf("homicide", "/homicide/")).to.be.within(1, 2);
    expect(
      rankOf("drone", "/innovation-and-digital-services/drone/")
    ).to.be.within(1, 3);
    expect(rankOf("death in custody", "/researchhub/dicra/")).to.be.within(
      1,
      3
    );
    expect(
      rankOf("infonet", "/innovation-and-digital-services/infonet/")
    ).to.be.within(1, 3);
  });

  it("ranks a title that contains the phrase above a loose match", () => {
    const top = fuse.search("police reform")[0].item.title;
    expect(top).to.match(/police reform/i);
    const useOfForce = fuse
      .search("use of force")
      .slice(0, 5)
      .some((r) => /use of force/i.test(r.item.title));
    expect(useOfForce, "a use-of-force title in the first five").to.equal(true);
  });
});

describe("Site search: several words, in any order", () => {
  // Fuse matches a query as one phrase, so "task force trafic" looked for that
  // run of characters and found nothing, although every word is in the titles
  // of the Traffic and Pedestrian Stop task force's meetings and reports.
  const titles = (query, records = sample.records) =>
    searchAll(build(records), query).map((r) => r.item.title.trim());

  it("finds titles that contain every word, whatever the order, allowing a typo", () => {
    const top = titles("task force trafic").slice(0, 3);
    expect(top.length).to.equal(3);
    top.forEach((title) => expect(title).to.match(/traffic/i));
    expect(titles("reform police")[0]).to.match(/police reform/i);
  });

  it("still puts an exact phrase first", () => {
    expect(titles("police reform")[0]).to.match(/police reform/i);
    expect(titles("funding opportunities")[0]).to.equal(
      "Funding Opportunities"
    );
  });

  it("matches words across fields, and ignores filler words in a question", () => {
    const records = sample.records.concat([
      {
        title: "Widget recidivism study",
        fullPath: "/w/",
        contentType: "article",
        authors: [{ title: "Jane Roe" }],
      },
      {
        title: "Apply now for violence prevention grants",
        fullPath: "/g/",
        contentType: "news",
      },
    ]);
    expect(titles("roe recidivism", records)).to.include(
      "Widget recidivism study"
    );
    expect(titles("how do I apply for a grant", records)).to.include(
      "Apply now for violence prevention grants"
    );
    expect(searchWords("How do I apply for a grant?")).to.deep.equal([
      "apply",
      "grant",
    ]);
  });

  it("leaves one-word searches as they were, and returns no scores", () => {
    const fuse = build(sample.records);
    const plain = fuse.search("homicide").map((r) => r.item.fullPath);
    const results = searchAll(fuse, "homicide");
    expect(results.map((r) => r.item.fullPath)).to.deep.equal(plain);
    expect(results[0]).to.not.have.property("score");
  });

  it("the search worker orders results exactly as the app does", () => {
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
    for (const query of [
      "task force trafic",
      "police reform",
      "use of force",
      "homicide",
      "annual report custody",
    ]) {
      expect(
        api.searchAll(theirs, query).map((r) => r.item.fullPath),
        query
      ).to.deep.equal(searchAll(ours, query).map((r) => r.item.fullPath));
    }
  });
});

describe("Site search: listing pages that have no CMS record", () => {
  // Hand-built views reach the index through generators/manualPages.js.
  const manualPages = require("../../generators/manualPages").map(
    // eslint-disable-next-line no-unused-vars
    ({ shell, ...record }) => record
  );
  const withPages = build(sample.records.concat(manualPages));
  const rank = (query, fullPath) =>
    withPages.search(query).findIndex((r) => r.item.fullPath === fullPath) + 1;

  it("finds each listing page by its everyday name", () => {
    const expected = [
      ["news", "/news/"],
      ["meetings", "/news/meetings/"],
      ["meeting minutes", "/news/meetings/"],
      ["agendas", "/news/meetings/"],
      ["publications", "/researchhub/publications/"],
      ["research hub", "/researchhub/"],
      ["articles", "/researchhub/articles/"],
      ["web applications", "/researchhub/apps/"],
      ["dashboards", "/researchhub/apps/"],
      ["datasets", "/researchhub/datasets/"],
      ["grant status", "/forms/grant-status/"],
      ["programs", "/grants/programs/"],
      ["funded programs", "/grants/programs/"],
      ["events", "/events/"],
      ["calendar", "/events/"],
    ];
    const missed = expected
      .map(([query, fullPath]) => [query, rank(query, fullPath)])
      .filter(([, r]) => r === 0 || r > 3);
    expect(missed, "not in the first three results").to.deep.equal([]);
  });
});

describe("Site search: long text is matched only at its opening", () => {
  const filler =
    "a plain opening sentence that says nothing in particular about it";
  const records = sample.records.concat([
    {
      title: "Opening",
      fullPath: "/opening/",
      contentType: "page",
      summary: "Zebrawood flooring in county courthouses",
    },
    {
      title: "Buried",
      fullPath: "/buried/",
      contentType: "page",
      summary: `${filler} zebrawood`,
    },
  ]);
  const paths = build(records)
    .search("zebrawood")
    .map((r) => r.item.fullPath);

  it("matches a word in the first characters of a summary", () => {
    expect(paths).to.include("/opening/");
  });

  it("does not match the same word deep in a summary", () => {
    expect(filler.length).to.be.greaterThan(SEARCH_HEAD_LENGTH);
    expect(paths).to.not.include("/buried/");
  });
});

describe("Site search: settings", () => {
  const site = config.search.site;
  const weight = (name) =>
    (site.keys.find((k) => k.name === name) || {}).weight;

  it("matches anywhere in a field, tightly, and weighs titles above body text", () => {
    expect(site.ignoreLocation).to.equal(true);
    expect(site.threshold).to.equal(0.2);
    expect(weight("title")).to.be.greaterThan(weight("summary"));
    expect(weight("title")).to.be.greaterThan(weight("abstract"));
  });

  it("the search worker reads long text the same way as the app", () => {
    const worker = fs.readFileSync(
      path.join(process.cwd(), "public/searchWorker.js"),
      "utf8"
    );
    const length = worker.match(/const SEARCH_HEAD_LENGTH = (\d+);/);
    const fields = worker.match(/const HEAD_FIELDS = (\[[^\]]*\]);/);
    expect(length, "SEARCH_HEAD_LENGTH in the worker").to.not.equal(null);
    expect(Number(length[1])).to.equal(SEARCH_HEAD_LENGTH);
    expect(JSON.parse(fields[1])).to.deep.equal(HEAD_FIELDS);
  });
});

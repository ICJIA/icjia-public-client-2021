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

  // A one-word search is one Fuse search. Its results are then arranged like
  // any others: tests/unit/searchSimilar.spec.js.
  it("returns what Fuse finds for a one-word search, and no scores", () => {
    const fuse = build(sample.records);
    const plain = fuse.search("homicide").map((r) => r.item.fullPath);
    const results = searchAll(fuse, "homicide");
    expect(results.map((r) => r.item.fullPath)).to.have.members(plain);
    expect(results.length).to.equal(plain.length);
    expect(results[0]).to.not.have.property("score");
  });

  // Typing "task force trafic" sends "task", "task fo", "task force t"...; without
  // a memory every keystroke searched every word again (v1.5.84).
  const counted = (records) => {
    const fuse = build(records);
    const original = fuse.search.bind(fuse);
    fuse.calls = [];
    fuse.search = (query) => {
      fuse.calls.push(query);
      return original(query);
    };
    return fuse;
  };

  it("remembers each word's results, so a longer query only searches its new word", () => {
    const fuse = counted(sample.records);
    searchAll(fuse, "task force");
    expect(fuse.calls).to.deep.equal(["task force", "task", "force"]);
    fuse.calls.length = 0;
    const paths = searchAll(fuse, "task force trafic").map(
      (r) => r.item.fullPath
    );
    expect(fuse.calls).to.deep.equal(["task force trafic", "trafic"]);
    const fresh = searchAll(build(sample.records), "task force trafic").map(
      (r) => r.item.fullPath
    );
    expect(paths, "same results with and without the memory").to.deep.equal(
      fresh
    );
  });

  it("forgets the oldest words once it holds eighty", () => {
    const fuse = counted(sample.records);
    searchAll(fuse, "homicide reporting");
    for (let i = 0; i < 80; i++) searchAll(fuse, `word${i} filler${i}`);
    fuse.calls.length = 0;
    searchAll(fuse, "homicide reporting");
    expect(fuse.calls).to.include("homicide");
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
      `${source}\nreturn { searchOptions, searchAll, useSynonyms };`
    )(Fuse);
    // The same synonym table as the app (v1.5.122).
    api.useSynonyms(require("@/config/searchSynonyms.json"));
    const theirs = new Fuse(
      sample.records,
      api.searchOptions(config.search.site)
    );
    const ours = build(sample.records);
    for (const query of [
      "task force",
      "task force trafic",
      "police reform",
      "reform police",
      "use of force",
      "homicide",
      "annual report custody",
      "task force trafic",
      "detention",
      "burglary theft",
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

describe("Site search: Research Hub apps and datasets are searched in full", () => {
  // There are only ten of them, they carry few tags, and what they hold is
  // named deep in their descriptions ("detention", "burglary", "IDOC").
  const found = (query) =>
    searchAll(build(sample.records), query)
      .slice(0, 10)
      .map((r) => `${r.item.contentType}: ${r.item.title.trim()}`);

  it("finds an app or a dataset by a word deep in its description", () => {
    expect(found("detention")).to.include(
      "dataset: Illinois Juvenile Justice Data Dashboard"
    );
    expect(found("burglary").join(" | ")).to.match(
      /dataset: Illinois Uniform Crime Reports/
    );
    expect(found("idoc")).to.include("web application: Parole Explorer");
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

describe("Site search: a release reaches people who have searched before", () => {
  // The index and the worker are not content-hashed. Cached for an hour, with
  // a day of stale-while-revalidate, a browser kept running the previous
  // release's worker against the new app: after v1.5.83 it still searched by
  // phrase only, and after v1.5.76 it could not find a newly indexed page.
  const toml = fs.readFileSync(
    path.join(process.cwd(), "netlify.toml"),
    "utf8"
  );
  const cacheRule = (file) => {
    const block = toml
      .split("[[headers]]")
      .find((b) => b.includes(`for = "${file}"`));
    return (block.match(/Cache-Control = "([^"]*)"/) || [])[1];
  };

  it("browsers revalidate the search index and the search worker on every visit", () => {
    expect(cacheRule("/searchIndex.json")).to.equal(
      "public, max-age=0, must-revalidate"
    );
    expect(cacheRule("/searchWorker.js")).to.equal(
      "public, max-age=0, must-revalidate"
    );
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

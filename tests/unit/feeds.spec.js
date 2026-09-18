/* eslint-env mocha */
// =============================================================================
// RSS, Atom and JSON feeds (v1.5.89)
//
// The four feed generators asked the CMS for a collection with no parameters.
// Strapi v3 then returns 100 records, lowest id first, so once a collection
// passed 100 records nothing new reached its feed: on 2026-09-18 the newest
// news item was from January 2025, the newest meeting from April 2023 and the
// newest job from March 2023, in feeds rebuilt that morning. Titles were also
// wrapped in <h2> tags, which readers show as text, and meetings and jobs
// carried an image that no longer exists.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
const {
  FEED_SIZE,
  allRecords,
  plainTitle,
  newestItems,
  applyBy,
  campaignLink,
  copyrightLine,
} = require("../../generators/utils/feedItems");

describe("Feeds: the newest records, not the first hundred", () => {
  it("asks the CMS for the whole collection", () => {
    expect(allRecords("https://cms.example", "posts")).to.equal(
      "https://cms.example/posts?_limit=-1"
    );
  });

  it("keeps the newest fifty items, newest first", () => {
    const items = Array.from({ length: 120 }, (_, i) => ({
      title: `Item ${i}`,
      date: new Date(2020, 0, 1 + i),
    }));
    const kept = newestItems(items.slice().reverse().concat(items.slice(0, 3)));
    expect(FEED_SIZE).to.equal(50);
    expect(kept.length).to.equal(50);
    expect(kept[0].title).to.equal("Item 119");
    expect(kept[49].title).to.equal("Item 70");
  });

  it("drops an item with no usable date instead of failing the build", () => {
    const kept = newestItems([
      { title: "dated", date: new Date("2026-09-16") },
      { title: "undated", date: new Date(undefined) },
      { title: "missing" },
    ]);
    expect(kept.map((i) => i.title)).to.deep.equal(["dated"]);
  });

  it("gives items plain-text titles", () => {
    expect(
      plainTitle("<h2>[BUDGET] Budget  Committee\n Meeting</h2>")
    ).to.equal("[BUDGET] Budget Committee Meeting");
    expect(plainTitle("R3 & Violence Prevention")).to.equal(
      "R3 & Violence Prevention"
    );
    expect(plainTitle(null)).to.equal("");
  });

  it("every generator uses them, with an image that exists", () => {
    for (const name of ["News", "Funding", "Meetings", "Employment"]) {
      const source = fs.readFileSync(
        path.join(process.cwd(), `generators/generateRSS${name}.mjs`),
        "utf8"
      );
      expect(source, name).to.match(
        /axios\.get\(\s*allRecords\(config\.api\.base, "/
      );
      expect(source, name).to.match(/title: plainTitle\(/);
      expect(source, name).to.match(/feed\.items = newestItems\(feed\.items\)/);
      expect(source, name).to.not.include("<h2>${");
      expect(source, name).to.not.include("state_seal_color_e3ae3b7180");
    }
  });
});

// A job was dated by its closing date, so a posting appeared to be published
// in the future, and one added today with an early deadline sat below older
// postings. It is dated by its posting date; the closing date, which the item's
// date used to show, is said in words at the top of the item.
describe("Feeds: a job is dated by its posting date", () => {
  it("says the closing date in words", () => {
    expect(applyBy("2026-09-25")).to.equal(
      "<p><strong>Apply by:</strong> September 25, 2026</p>"
    );
    expect(applyBy("2026-01-01")).to.equal(
      "<p><strong>Apply by:</strong> January 1, 2026</p>"
    );
    expect(applyBy(null)).to.equal("");
    expect(applyBy("not a date")).to.equal("");
  });

  it("the employment feed dates an item by its start, and leads with the closing date", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "generators/generateRSSEmployment.mjs"),
      "utf8"
    );
    expect(source).to.include("date: new Date(job.start || job.published_at)");
    expect(source).to.not.include("new Date(job.end)");
    expect(source).to.include(
      "description: applyBy(job.end) + renderToHtml(job.summary)"
    );
    expect(source).to.include(
      "content: applyBy(job.end) + generateFullContent(job)"
    );
  });
});

// v1.5.90: what makes the feeds findable and countable.
describe("Feeds: found by readers, counted in Plausible", () => {
  // Plausible cannot see a feed being read (readers run no scripts). Tagged
  // links let it count the visits that come from one. Only the link is
  // tagged: the item's id stays as it was, or readers would show every item
  // again as new.
  it("tags an item's link with the feed it came from", () => {
    expect(campaignLink("https://icjia.illinois.gov/news/x/", "news")).to.equal(
      "https://icjia.illinois.gov/news/x/?utm_source=rss&utm_medium=feed&utm_campaign=news"
    );
    expect(
      campaignLink("https://icjia.illinois.gov/news/x/?a=1", "news")
    ).to.equal(
      "https://icjia.illinois.gov/news/x/?a=1&utm_source=rss&utm_medium=feed&utm_campaign=news"
    );
  });

  it("dates the copyright line by the year of the build", () => {
    expect(copyrightLine(new Date("2026-09-18"))).to.equal(
      "All rights reserved 2026, Illinois Criminal Justice Information Authority"
    );
    expect(copyrightLine()).to.include(String(new Date().getFullYear()));
  });

  it("every generator tags links but not ids, names itself, and dates its copyright", () => {
    for (const [name, file] of [
      ["News", "news"],
      ["Funding", "funding"],
      ["Meetings", "meetings"],
      ["Employment", "employment"],
    ]) {
      const source = fs
        .readFileSync(
          path.join(process.cwd(), `generators/generateRSS${name}.mjs`),
          "utf8"
        )
        .replace(/\s+/g, " ");
      expect(source, name).to.match(
        new RegExp(`link: campaignLink\\(\\s*\`[^,]+,\\s*"${file}"\\s*\\)`)
      );
      expect(source, name).to.match(/ id: `\$\{config\.api\.baseClient\}\//);
      expect(source, name).to.not.match(/ id: campaignLink/);
      expect(source, name).to.include(
        `rss: config.api.baseClient + "/${file}-rss2.xml"`
      );
      expect(source, name).to.include("copyright: copyrightLine()");
      expect(source, name).to.not.include("All rights reserved 2021");
    }
  });

  it("the site's pages name the four feeds in their head", () => {
    const html = fs.readFileSync(
      path.join(process.cwd(), "public/index.html"),
      "utf8"
    );
    for (const file of ["news", "funding", "meetings", "employment"]) {
      expect(html, file).to.match(
        new RegExp(
          `<link\\s+rel="alternate"\\s+type="application/rss\\+xml"\\s+title="[^"]+"\\s+href="https://icjia\\.illinois\\.gov/${file}-rss2\\.xml"\\s*/>`
        )
      );
    }
  });
});

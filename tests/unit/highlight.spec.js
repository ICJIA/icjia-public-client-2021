/* eslint-env mocha */
// =============================================================================
// Search terms are highlighted in result cards (v1.5.83)
// The card renders CMS titles and summaries as HTML, so the highlighter works
// on text nodes only: it never touches tags or attributes, and it keeps
// escaped text escaped.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { highlightHtml } from "@/utils/highlight";

const marks = (html) =>
  (html.match(/<mark class="search-hit">(.*?)<\/mark>/g) || []).map((m) =>
    m.replace(/<\/?mark[^>]*>/g, "")
  );

describe("highlightHtml()", () => {
  it("marks a search word wherever it appears, whatever its case", () => {
    const out = highlightHtml(
      "Illinois Homicide Reporting and homicide data",
      "homicide"
    );
    expect(marks(out)).to.deep.equal(["Homicide", "homicide"]);
  });

  it("marks each word of a longer query, in any order, but not filler words", () => {
    const out = highlightHtml(
      "Traffic and Pedestrian Stop Data Use and Collection Task Force Meeting",
      "the task force for traffic"
    );
    expect(marks(out)).to.deep.equal(["Traffic", "Task", "Force"]);
  });

  it("marks the word a misspelled term matched", () => {
    const out = highlightHtml("Traffic Stop Task Force", "trafic");
    expect(marks(out)).to.deep.equal(["Traffic"]);
  });

  it("marks part of a longer word, and joins marks that touch", () => {
    expect(
      marks(highlightHtml("Trafficking in persons", "traffic"))
    ).to.deep.equal(["Traffic"]);
    expect(
      marks(
        highlightHtml(
          "2024 Traffic Pedestrian Stop Taskforce Schedule",
          "task force"
        )
      )
    ).to.deep.equal(["Taskforce"]);
  });

  it("leaves tags and attributes alone and keeps existing markup", () => {
    const out = highlightHtml(
      '<a href="/traffic/">Traffic &amp; <em>pedestrian</em> stops</a>',
      "traffic pedestrian"
    );
    expect(out).to.include('<a href="/traffic/">');
    expect(out).to.include("&amp;");
    expect(marks(out)).to.deep.equal(["Traffic", "pedestrian"]);
  });

  it("keeps escaped text escaped", () => {
    const out = highlightHtml(
      "&lt;img src=x onerror=alert(1)&gt; traffic",
      "traffic img"
    );
    expect(out).to.not.match(/<img/i);
    expect(out).to.include("&lt;");
    expect(marks(out)).to.deep.equal(["img", "traffic"]);
  });

  it("returns the text unchanged when there is nothing to mark", () => {
    expect(highlightHtml("Funding Opportunities", "")).to.equal(
      "Funding Opportunities"
    );
    expect(highlightHtml("Funding Opportunities", "zebra")).to.equal(
      "Funding Opportunities"
    );
    expect(highlightHtml("", "funding")).to.equal("");
    expect(highlightHtml(null, "funding")).to.equal("");
  });
});

describe("Result cards while typing", () => {
  // A card highlights with the text it is given, and re-renders when that text
  // changes. Given the live text of the search box (v1.5.83 to v1.5.85), every
  // card on the page re-rendered on every keystroke, before the typed letter
  // could be painted: on the live site with 297 results, 144 ms to 928 ms per
  // keystroke; with cards that ignore the live text, 16 ms to 18 ms. The cards
  // get the query that produced the results they show.
  it("gives the cards the searched query, not the text being typed", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    const card = page.slice(
      page.indexOf("<SearchCard"),
      page.indexOf("</SearchCard>")
    );
    expect(card).to.include(':query="searchedQuery"');
    expect(card).to.not.include(':query="query"');
  });
});

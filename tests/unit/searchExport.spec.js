/* eslint-env mocha */
// =============================================================================
// Search results as a spreadsheet or data (v1.5.144): src/utils/searchExport.js
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import {
  COLUMNS,
  exportRows,
  toCsv,
  toJson,
  exportFileName,
  absoluteUrl,
  jsonKey,
  downloadEvent,
} from "@/utils/searchExport";

const NOW = new Date("2026-11-17T18:00:00Z");
const col = (header) => COLUMNS.findIndex((c) => c.header === header);

const article = {
  item: {
    title: 'Perspectives of Employers, an "Exploratory" Study',
    contentType: "article",
    fullPath: "/researchhub/articles/perspectives/",
    date: "2026-10-30T00:00:00.000Z",
    categories: ["corrections"],
    authors: [{ title: "Ryan Maranville" }, { title: "Ellie Borgstrom" }],
    tags: ["Prison", "work release"],
    summary: "Prison work\nrelease  programs.",
  },
};
const press = {
  similar: true,
  item: {
    title: '=HYPERLINK("x")',
    contentType: "news",
    category: "pressRelease",
    fullPath: "/news/r3/",
    publicationDate: "2021-07-16",
    tags: [],
    tagsAlt: [{ title: "Cannabis" }],
  },
};
const publication = {
  item: {
    title: "A Summary",
    contentType: "publication",
    fullPath: "/about/publications/a-summary/",
    fileURL: "https://researchhub.icjia-api.cloud/uploads/a.pdf",
    articleURL: "https://icjia.illinois.gov/researchhub/articles/a/",
    pubType: "article",
    publicationDate: "2026-08-21",
  },
};
const job = {
  item: {
    title: "Grant Specialist",
    contentType: "employment",
    fullPath: "/about/employment/x/",
    start: "2026-09-11",
    end: "2026-09-25",
  },
};
const meeting = {
  item: {
    title: "Board",
    contentType: "meeting",
    category: "board",
    fullPath: "/news/meetings/board/",
    start: "2026-09-08T18:00:00.000Z",
    isCancelled: true,
  },
};
const ALL = [article, press, publication, job, meeting];

describe("Search results download (v1.5.144)", () => {
  it("has one row per result, ranked in the order given", () => {
    const rows = exportRows(ALL, NOW);
    expect(rows).to.have.length(5);
    expect(rows.map((r) => r[col("Rank")])).to.deep.equal([1, 2, 3, 4, 5]);
    rows.forEach((r) => expect(r).to.have.length(COLUMNS.length));
  });

  it("fills the columns from the record", () => {
    const [a, p, pub, j, m] = exportRows(ALL, NOW, " Prison ");
    expect(a[col("URL")]).to.equal(
      "https://icjia.illinois.gov/researchhub/articles/perspectives/"
    );
    expect(a[col("Type")]).to.equal("Research Hub article");
    expect(a[col("Category")]).to.equal("corrections");
    expect(a[col("Authors")]).to.equal("Ryan Maranville; Ellie Borgstrom");
    expect(a[col("Tags")]).to.equal("Prison; work release");
    expect(a[col("Summary")]).to.equal("Prison work release programs.");
    // Publication date (v1.5.152), not "Date": blank for what has none.
    expect(col("Date")).to.equal(-1);
    expect(a[col("Publication date")]).to.equal("2026-10-30");
    expect(p[col("Publication date")]).to.equal("2021-07-16");
    expect(pub[col("Publication date")]).to.equal("2026-08-21");
    expect(j[col("Publication date")]).to.equal("");
    expect(m[col("Publication date")]).to.equal("");
    // The search the result was found for (v1.5.146), not "Match".
    expect(col("Match")).to.equal(-1);
    expect(a[col("Query")]).to.equal("Prison");
    expect(p[col("Query")]).to.equal(
      "Prison (similar spelling or partial match)"
    );
    expect(p[col("Category")]).to.equal("Press Release");
    expect(p[col("Tags")]).to.equal("Cannabis");
    expect(pub[col("PDF or file")]).to.equal(publication.item.fileURL);
    expect(pub[col("Research Hub article")]).to.equal(
      publication.item.articleURL
    );
    expect(j[col("Status")]).to.equal("Closed");
    expect(j[col("End")]).to.equal("2026-09-25");
    expect(m[col("Category")]).to.equal("Authority Board");
    expect(m[col("Status")]).to.equal("Cancelled");
    expect(m[col("Start")]).to.equal("2026-09-08 1:00 PM");
  });

  it("writes CSV that Excel reads as UTF-8, quoted, with no formulas", () => {
    const csv = toCsv(ALL, NOW);
    expect(csv.charCodeAt(0)).to.equal(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0].split(",")[0]).to.equal("Rank");
    expect(lines).to.have.length(7); // header, 5 rows, final empty
    expect(csv).to.include(
      '"Perspectives of Employers, an ""Exploratory"" Study"'
    );
    expect(csv).to.include('"\'=HYPERLINK(""x"")"');
  });

  it("writes JSON with the search and a keyed object per result", () => {
    const data = JSON.parse(toJson(ALL, [["Search", "prison"]], NOW, "prison"));
    expect(data.results[0].query).to.equal("prison");
    expect(data.results[1].query).to.equal(
      "prison (similar spelling or partial match)"
    );
    expect(data.search).to.deep.equal({ search: "prison" });
    expect(data.results).to.have.length(5);
    expect(data.results[0].authors).to.deep.equal([
      "Ryan Maranville",
      "Ellie Borgstrom",
    ]);
    expect(data.results[0].pdfOrFile).to.equal("");
    expect(data.results[2].researchHubArticle).to.equal(
      publication.item.articleURL
    );
    expect(jsonKey("First published")).to.equal("firstPublished");
  });

  it("names the file after the search, the filter and the day", () => {
    expect(exportFileName("Use of force!", "hub", "csv", NOW)).to.equal(
      "icjia-search-use-of-force-hub-2026-11-17.csv"
    );
    expect(exportFileName("", null, "xlsx", NOW)).to.equal(
      "icjia-search-results-2026-11-17.xlsx"
    );
  });

  it("records a download in Plausible as Search Download (v1.5.145)", () => {
    expect(downloadEvent("xlsx", "  Prison ", "publication", 88)).to.deep.equal(
      {
        name: "Search Download",
        props: {
          format: "xlsx",
          query: "prison",
          filter: "publication",
          results: "88",
        },
      }
    );
    expect(downloadEvent("csv", "prison", null, 177).props.filter).to.equal(
      "none"
    );
    const vue = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    expect(vue).to.include(
      "window.plausible(event.name, { props: event.props })"
    );
  });

  it("leaves outside addresses alone", () => {
    expect(absoluteUrl("https://example.org/a")).to.equal(
      "https://example.org/a"
    );
    expect(absoluteUrl("")).to.equal("");
  });

  it("puts the download buttons on the search page, in view", () => {
    const vue = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    expect(vue).to.include('class="search-download"');
    expect(vue).to.include("downloadResults(format.ext)");
    ["xlsx", "csv", "json"].forEach((ext) =>
      expect(vue).to.include(`ext: "${ext}"`)
    );
  });
});

// The similar-results toggle keeps focus after a mouse click (v1.5.147):
// Vuetify's v-btn blurs itself on a mouse click unless retain-focus-on-click.
describe("Similar-results toggle focus (v1.5.147)", () => {
  it("keeps focus on the toggle after a mouse click (WCAG 2.4.3)", () => {
    const vue = fs.readFileSync(
      path.join(process.cwd(), "src/views/Search/SearchStatic.vue"),
      "utf8"
    );
    const toggle = vue.slice(
      vue.indexOf('aria-controls="search-similar-results"') - 400,
      vue.indexOf('aria-controls="search-similar-results"')
    );
    expect(toggle).to.include("<v-btn");
    expect(toggle).to.include("retain-focus-on-click");
  });
});

// Search addresses (v1.5.152): written encoded once; links encoded twice
// before it ("task%2520force", shared widely) still open the same search.
describe("Search addresses (v1.5.152)", () => {
  const { searchLocation, queryFromParam } = require("@/utils/search");
  it("hands the router the words as typed, so they are encoded once", () => {
    expect(searchLocation({ query: " task force " })).to.deep.equal({
      name: "Search2",
      params: { query: "task force" },
    });
  });
  it("reads every form of the address as the same words", () => {
    // What the router hands over after decoding the address once:
    expect(queryFromParam("task force")).to.equal("task force"); // task%20force
    expect(queryFromParam("task%20force")).to.equal("task force"); // task%2520force
    expect(queryFromParam("100%")).to.equal("100%"); // 100%25 (threw before)
    expect(queryFromParam("100%25")).to.equal("100%"); // 100%2525
    expect(queryFromParam(undefined)).to.equal("");
  });
});

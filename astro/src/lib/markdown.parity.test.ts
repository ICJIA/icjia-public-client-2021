// @vitest-environment jsdom
//
// CLIENT/BUILD parity gate for the live-detail fallback (docs/LIVE-DETAIL-FALLBACK.md).
//
// The live-detail fallback renders a brand-new (post-build) record's body markdown
// CLIENT-SIDE via markdown.client.js. For the rendered page to match the eventual
// nightly-built page, the client wrapper must produce output IDENTICAL to the Node
// build wrapper (markdown.js). Both delegate to markdown-core.js; this suite proves
// the two bindings agree, running the client wrapper in a browser-like (jsdom) env.
//
// (server-side linkedom ≈ jsdom is separately proven by contentSanitizer.parity.test.ts,
//  so build-linkedom ≈ jsdom-here ≈ real-browser is covered end to end.)
import { describe, it, expect } from "vitest";
import * as nodeMd from "./markdown.js";
import * as clientMd from "./markdown.client.js";

// Realistic CMS fixtures. Footnotes + headings are called out by the owner as
// required, so they are first-class fixtures (and asserted explicitly below).
const FIXTURES: Record<string, string> = {
  headings: `## First Section\n\nIntro paragraph.\n\n### A Subheading\n\nMore text.\n\n## Second Section\n\nClosing.`,
  footnotes: `The Authority published findings.[^1] A second claim.[^note]\n\n[^1]: First footnote with a [link](https://icjia.illinois.gov/about).\n\n[^note]: Second footnote text.`,
  table: `| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n| Beta | 2 |`,
  genericLink: `Please [click here](https://agency.icjia-api.cloud/uploads/report_2025_abc123.pdf) to download.`,
  emphasisAndCode: `A paragraph with **bold**, _italic_, and \`inline code\`. Plus a [normal link](https://example.org/page).`,
  imageFigure: `![Chart of crime statistics](https://agency.icjia-api.cloud/uploads/chart.png)`,
  combined: `## Report\n\nSummary with a footnote.[^a]\n\n| Col A | Col B |\n| --- | --- |\n| x | y |\n\n[Read more](https://example.com/here)\n\n[^a]: Footnote body.`,
};

// contentSanitizer assigns table ids from a module-level counter
// (`tableIdCounter`, contentSanitizer.js:208) that is never reset, so the absolute
// number in `cmstbl<n>-h<k>` depends on how many tables were rendered earlier in
// the process — NOT on the wrapper. Within any single page the ids are internally
// consistent (the `headers="…"` references match), so normalizing the counter is
// the correct comparison; the number is invisible + transient (rebuilt nightly).
const norm = (html: string) => html.replace(/cmstbl\d+/g, "cmstbl#");

describe("markdown client/build parity", () => {
  for (const [name, md] of Object.entries(FIXTURES)) {
    it(`renderToHtml matches between build and client wrappers — ${name}`, () => {
      expect(norm(clientMd.renderToHtml(md))).toBe(norm(nodeMd.renderToHtml(md)));
    });
  }

  it("renderInline matches between build and client wrappers", () => {
    const input = "A **title** with a [link](https://example.org) and `code`.";
    expect(clientMd.renderInline(input)).toBe(nodeMd.renderInline(input));
  });

  it("parseHeadings returns the same h2 text between wrappers", () => {
    const toText = (nodes: NodeListOf<Element>) =>
      Array.from(nodes).map((n) => (n.textContent || "").trim());
    expect(toText(clientMd.parseHeadings(FIXTURES.headings))).toEqual(
      toText(nodeMd.parseHeadings(FIXTURES.headings)),
    );
  });

  // Explicit feature coverage (owner: "I need footnote rendering and heading rendering").
  it("renders heading anchors (markdown-it-anchor): h2 carries a slug id", () => {
    const html = clientMd.renderToHtml(FIXTURES.headings);
    expect(html).toMatch(/<h2[^>]*\bid="first-section"/);
    expect(html).toMatch(/<h2[^>]*\bid="second-section"/);
  });

  it("renders footnotes (markdown-it-footnote): in-text ref + footnotes section", () => {
    const html = clientMd.renderToHtml(FIXTURES.footnotes);
    expect(html).toContain("footnote-ref");
    expect(html).toMatch(/class="footnotes/);
  });
});

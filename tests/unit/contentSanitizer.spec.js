// =============================================================================
// contentSanitizer plugin tests
// Exercises the HTML pipeline plugins that fix SiteImprove-flagged issues at
// pre-render time (tables, empty containers, link alt text, duplicate link
// text, Word-blue contrast).
// =============================================================================
import { expect } from "chai";
import {
  fixCmsTables,
  fixCmsEmptyContainers,
  fixCmsLinkAltText,
  fixCmsDuplicateLinkText,
  fixCmsSameHrefLinkLabels,
  fixCmsContrast,
  sanitizeContent,
} from "@/utils/contentSanitizer";

describe("fixCmsTables — simple tables", () => {
  it("promotes <td> first cell to <th scope=row> when label is non-numeric", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody>" +
      "<tr><td>Illinois</td><td>42</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.match(/<th scope="row"[^>]*>Illinois<\/th>/);
  });

  it("adds scope=col to existing thead th cells", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.match(/<th scope="col"[^>]*>A<\/th>/);
    expect(out).to.match(/<th scope="col"[^>]*>B<\/th>/);
  });

  it("wraps loose <tr> rows in <tbody>", () => {
    const html =
      "<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>";
    const out = fixCmsTables(html);
    expect(out).to.include("<tbody>");
  });
});

describe("fixCmsTables — complex tables", () => {
  it("assigns id to <th> and headers attribute to <td> for colspan tables", () => {
    const html =
      '<table><thead><tr><th colspan="2">Group</th></tr>' +
      "<tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.match(/<th[^>]*id="cmstbl\d+-h\d+"/);
    expect(out).to.match(/<td[^>]*headers="cmstbl\d+-h\d+( cmstbl\d+-h\d+)*"/);
  });

  it("assigns id to <th> and headers to <td> on rowspan tables", () => {
    const html =
      '<table><tbody><tr><th scope="col" rowspan="2">X</th><td>1</td></tr>' +
      "<tr><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    // The complex pass assigns an explicit id to each <th> and writes that id
    // into a headers="..." attribute on the governed <td> cells (WCAG H43).
    // scope is intentionally retained alongside headers (belt-and-suspenders).
    expect(out).to.match(/<th[^>]*id="cmstbl\d+-h\d+"[^>]*>X<\/th>/);
    expect(out).to.match(/<td[^>]*headers="cmstbl\d+-h\d+"[^>]*>1<\/td>/);
  });
});

describe("fixCmsTables — orphan headers", () => {
  it("marks header-only tables (no <td>) as presentational", () => {
    const html = "<table><thead><tr><th>A</th><th>B</th></tr></thead></table>";
    const out = fixCmsTables(html);
    expect(out).to.include('role="presentation"');
  });

  it("leaves normal (multi-column) tables without role=presentation", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.not.include('role="presentation"');
  });

  it("marks single-column tables presentational (a list, not tabular data)", () => {
    const html =
      "<table><thead><tr><th>A</th></tr></thead>" +
      "<tbody><tr><td>1</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.include('role="presentation"');
  });

  it("removes empty <tr> rows (sia-r68) and unblocks header assignment", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr></tr><tr><td>Illinois</td><td>42</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.not.include("<tr></tr>");
    expect(out).to.match(/<th scope="row"[^>]*>Illinois<\/th>/);
  });

  it("demotes empty <th> corner cells to presentational spacer <td>", () => {
    const html =
      "<table><thead><tr><th></th><th>Score</th></tr></thead>" +
      "<tbody><tr><td>Illinois</td><td>42</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    // The empty header becomes a presentational <td>, not an orphan <th>.
    expect(out).to.match(/<td[^>]*role="presentation"[^>]*><\/td>|<td[^>]*><\/td>/);
    expect(out).to.not.match(/<th[^>]*>\s*<\/th>/);
  });
});

describe("fixCmsEmptyContainers", () => {
  it("removes empty <p> elements", () => {
    const out = fixCmsEmptyContainers("<div><p></p><p>Hello</p></div>");
    expect(out).to.include("<p>Hello</p>");
    expect(out.match(/<p>/g)).to.have.lengthOf(1);
  });

  it("removes empty headings", () => {
    const out = fixCmsEmptyContainers("<h2></h2><h3>Real heading</h3>");
    expect(out).to.not.include("<h2");
    expect(out).to.include("<h3>Real heading</h3>");
  });

  it("preserves containers that wrap images", () => {
    const out = fixCmsEmptyContainers('<p><img src="foo.png" alt="foo"></p>');
    expect(out).to.include("<img");
    expect(out).to.include("<p>");
  });

  it("removes nested empty containers", () => {
    const out = fixCmsEmptyContainers("<div><div><p></p></div></div>");
    expect(out).to.not.include("<p>");
  });
});

describe("fixCmsLinkAltText", () => {
  it("adds aria-label from img alt for image-only links", () => {
    const out = fixCmsLinkAltText(
      '<a href="/foo"><img alt="Interactive dashboard" src="/x.png"></a>'
    );
    expect(out).to.include('aria-label="Interactive dashboard"');
  });

  it("derives label from href when img alt is empty", () => {
    const out = fixCmsLinkAltText(
      '<a href="/grants/fy25-applications"><img alt="" src="/x.png"></a>'
    );
    expect(out).to.match(/aria-label="[^"]+"/);
  });

  it("leaves links with visible text untouched", () => {
    const out = fixCmsLinkAltText('<a href="/foo">Click here</a>');
    expect(out).to.not.include("aria-label");
  });
});

describe("fixCmsDuplicateLinkText", () => {
  it("disambiguates duplicate link text with href-derived qualifier", () => {
    const html =
      "<ul>" +
      '<li><a href="/feeds/news.xml">RSS</a></li>' +
      '<li><a href="/feeds/funding.xml">RSS</a></li>' +
      "</ul>";
    const out = fixCmsDuplicateLinkText(html);
    expect(out).to.match(/aria-label="RSS: news"/i);
    expect(out).to.match(/aria-label="RSS: funding"/i);
  });

  it("leaves unique links untouched", () => {
    const html = '<p><a href="/a">First</a> and <a href="/b">Second</a></p>';
    const out = fixCmsDuplicateLinkText(html);
    expect(out).to.not.include("aria-label");
  });
});

describe("fixCmsSameHrefLinkLabels", () => {
  it("normalizes aria-label when unifying stays label-in-name safe", () => {
    // Both links share the href; the shorter link's visible text ("Annual
    // Report") is contained in the canonical ("Annual Report 2024"), so
    // adopting it as the accessible name does not violate WCAG 2.5.3.
    const html =
      "<ul>" +
      '<li><a href="/article/x">Annual Report 2024</a></li>' +
      '<li><a href="/article/x">Annual Report</a></li>' +
      "</ul>";
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.include('aria-label="Annual Report 2024"');
    // Only the shorter link gets the aria-label
    expect((out.match(/aria-label=/g) || []).length).to.equal(1);
  });

  it("does NOT unify when it would break label-in-name (WCAG 2.5.3)", () => {
    // "Read more" is not contained in "Annual Report 2024", so overriding its
    // accessible name would make the visible label absent from the accessible
    // name — the exact SiteImprove sia-r14 failure. Leave it alone.
    const html =
      "<ul>" +
      '<li><a href="/article/x">Annual Report 2024</a></li>' +
      '<li><a href="/article/x">Read more</a></li>' +
      "</ul>";
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.not.include('aria-label="Annual Report 2024"');
  });

  it("does not touch different-href links with different text", () => {
    const html = '<p><a href="/a">Alpha</a> and <a href="/b">Beta</a></p>';
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.not.include("aria-label");
  });

  it("does not touch same-href links with identical text", () => {
    const html = '<p><a href="/x">Same</a> and <a href="/x">Same</a></p>';
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.not.include("aria-label");
  });
});

describe("fixCmsContrast — Word-blue tables", () => {
  it("replaces #4F81BD bgcolor attribute with darker shade", () => {
    const out = fixCmsContrast('<th bgcolor="#4F81BD">Header</th>');
    expect(out).to.include('bgcolor="#2E5E97"');
    expect(out).to.not.include("#4F81BD");
  });

  it("replaces #4F81BD in inline style", () => {
    const out = fixCmsContrast(
      '<th style="background:#4F81BD;color:#fff">X</th>'
    );
    expect(out).to.include("#2E5E97");
    expect(out).to.not.include("#4F81BD");
  });

  it("replaces rgb form", () => {
    const out = fixCmsContrast(
      '<th style="background: rgb(79, 129, 189)">X</th>'
    );
    expect(out).to.include("rgb(46, 94, 151)");
  });
});

describe("sanitizeContent — full pipeline", () => {
  it("runs all plugins without throwing and returns a string", () => {
    const html =
      '<p></p><a href="/x"><img alt="" src="/y.png"></a>' +
      "<table><tr><th>X</th><td>1</td></tr></table>" +
      '<th bgcolor="#4F81BD">Header</th>';
    const out = sanitizeContent(html);
    expect(out).to.be.a("string");
    expect(out.length).to.be.greaterThan(0);
  });
});

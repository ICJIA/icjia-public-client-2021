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
  deepSanitize,
} from "@/utils/contentSanitizer";
import { renderToHtml } from "@/services/Markdown";

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
    expect(out).to.match(
      /<td[^>]*role="presentation"[^>]*><\/td>|<td[^>]*><\/td>/
    );
    expect(out).to.not.match(/<th[^>]*>\s*<\/th>/);
  });
});

describe("fixCmsTables — tables authored without <th>", () => {
  // Header text each data cell is associated with, via headers="…".
  const headersOf = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const out = {};
    doc.querySelectorAll("td").forEach((td) => {
      const text = td.textContent.trim();
      if (!text) return;
      out[text] = (td.getAttribute("headers") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => doc.getElementById(id).textContent.trim());
    });
    return { doc, out };
  };

  it("promotes a header row styled only by class, and keeps the first column as data", () => {
    // The shape of Table 1 in "Addressing Opioid Use Disorders in Corrections".
    const html =
      '<table><tbody><tr><td class="tg-0lax shaded bold">Methadone</td>' +
      '<td class="tg-0lax shaded bold">Buprenorphine</td>' +
      '<td class="tg-0lax shaded bold">Naltrexone</td></tr>' +
      "<tr><td>Full agonist</td><td>Partial agonist</td><td>Antagonist</td></tr>" +
      "<tr><td>Taken daily</td><td>Taken twice</td><td>Injectable</td></tr>" +
      "</tbody></table>";
    // Twice: later passes of the pipeline must keep the decision.
    const { doc, out } = headersOf(fixCmsTables(fixCmsTables(html)));
    expect(doc.querySelectorAll('th[scope="col"]').length).to.equal(3);
    expect(doc.querySelectorAll('th[scope="row"]').length).to.equal(0);
    expect(out["Full agonist"]).to.deep.equal(["Methadone"]);
    expect(out["Partial agonist"]).to.deep.equal(["Buprenorphine"]);
    expect(out["Injectable"]).to.deep.equal(["Naltrexone"]);
  });

  it("keeps row headers when the header row has a blank corner", () => {
    const html =
      "<table><tbody><tr><td><strong> </strong></td><td><strong>n</strong></td>" +
      "<td><strong>Percent</strong></td></tr>" +
      "<tr><td>Northern</td><td>10</td><td>27.8</td></tr>" +
      "<tr><td>Central</td><td>16</td><td>44.4</td></tr></tbody></table>";
    const { doc, out } = headersOf(fixCmsTables(html));
    expect(doc.querySelectorAll('th[scope="col"]').length).to.equal(2);
    expect(out["16"]).to.deep.equal(["n", "Central"]);
    expect(out["44.4"]).to.deep.equal(["Percent", "Central"]);
  });

  it("reads a two-row header with group headers, and keeps row headers", () => {
    // The shape of the drug-testing table: blank corner over two rows,
    // group headers spanning two columns, then n / Percent.
    const html =
      '<table><tbody><tr><td rowspan="2"></td><td colspan="2">Initial</td>' +
      '<td colspan="2">Sporadic</td></tr>' +
      "<tr><td>n</td><td>Percent</td><td>n</td><td>Percent</td></tr>" +
      "<tr><td>Sanctions</td><td>18</td><td>47%</td><td>21</td><td>57%</td></tr>" +
      "</tbody></table>";
    const { doc, out } = headersOf(fixCmsTables(fixCmsTables(html)));
    expect(doc.querySelectorAll('th[scope="col"]').length).to.equal(6);
    expect(out["47%"]).to.deep.equal(["Percent", "Initial", "Sanctions"]);
    expect(out["21"]).to.deep.equal(["n", "Sporadic", "Sanctions"]);
  });

  it("keeps row headers when text labels sit beside numbers", () => {
    const html =
      "<table><tbody><tr><td><b>Region</b></td><td><b>2019</b></td><td><b>2020</b></td></tr>" +
      "<tr><td>Cook</td><td>2,062</td><td>2,475</td></tr>" +
      "<tr><td>Collar</td><td>1,104</td><td>998</td></tr></tbody></table>";
    const { out } = headersOf(fixCmsTables(html));
    expect(out["2,475"]).to.deep.equal(["2020", "Cook"]);
  });

  it("keeps the decision through the content pipeline a CMS body takes", () => {
    // API responses are deep-sanitized before the markdown is rendered, and
    // the rendered HTML is sanitized again: the header row is inferred on the
    // first pass, and the later passes must not add row headers.
    const markdown =
      "Intro\n\n" +
      '<table><tbody><tr><td class="bold">Methadone</td><td class="bold">Naltrexone</td></tr>' +
      "<tr><td>Full agonist</td><td>Antagonist</td></tr></tbody></table>\n";
    const html = sanitizeContent(renderToHtml(deepSanitize(markdown)));
    const { doc, out } = headersOf(html);
    expect(doc.querySelectorAll('th[scope="row"]').length).to.equal(0);
    expect(out["Antagonist"]).to.deep.equal(["Naltrexone"]);
  });

  it("still gives row headers to a table with an authored header row", () => {
    const html =
      "<table><thead><tr><th>Housing authority</th><th>Region</th></tr></thead>" +
      "<tbody><tr><td>Adams County</td><td>Central</td></tr></tbody></table>";
    const { out } = headersOf(fixCmsTables(html));
    expect(out["Central"]).to.deep.equal(["Region", "Adams County"]);
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

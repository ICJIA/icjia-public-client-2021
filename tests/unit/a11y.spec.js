// =============================================================================
// Accessibility function tests
// Validates the a11y utility functions in src/a11y/index.js.
// These functions do DOM manipulation, so we test against a jsdom document.
// =============================================================================
import { expect } from "chai";
import {
  fixBlankTableHeadings,
  fixExpandButtons,
  fixFigureTabindex,
  fixHeadingOrder,
  fixEmptyTableHeaders,
  fixFootnoteTargetSize,
  fixNavHeaderRoles,
  fixOverlayContainer,
  fixNestedInteractive,
  fixDataTableHeaders,
  fixAriaHiddenFocus,
  fixEmptyAriaLabel,
  fixInlineColorContrast,
  fixLabelInName,
  fixTableCellContext,
} from "@/a11y/index";
import { fixCmsTables } from "@/utils/contentSanitizer";

// Helper: reset document body between tests
beforeEach(() => {
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// fixBlankTableHeadings
// ---------------------------------------------------------------------------
describe("fixBlankTableHeadings()", () => {
  it("replaces blank <th><span></span></th> with sr-only text", () => {
    document.body.innerHTML =
      "<table><thead><tr><th><span></span></th></tr></thead></table>";
    fixBlankTableHeadings();
    const th = document.querySelector("th");
    expect(th.innerHTML).to.include("This cell is intentionally blank");
    expect(th.innerHTML).to.include("aria-hidden");
  });

  it("leaves non-blank th headings alone", () => {
    document.body.innerHTML =
      "<table><thead><tr><th>Name</th></tr></thead></table>";
    fixBlankTableHeadings();
    const th = document.querySelector("th");
    expect(th.textContent).to.equal("Name");
  });

  it("removes role attributes from th elements", () => {
    document.body.innerHTML =
      '<table><thead><tr><th role="columnheader">Col</th></tr></thead></table>';
    fixBlankTableHeadings();
    const th = document.querySelector("th");
    expect(th.hasAttribute("role")).to.be.false;
  });
});

// ---------------------------------------------------------------------------
// fixExpandButtons
// ---------------------------------------------------------------------------
describe("fixExpandButtons()", () => {
  it("adds aria-label to expand icon buttons", () => {
    document.body.innerHTML =
      '<button class="v-data-table__expand-icon"></button>';
    fixExpandButtons();
    const btn = document.querySelector(".v-data-table__expand-icon");
    expect(btn.getAttribute("aria-label")).to.equal("Expand");
  });

  it("accepts custom class and label", () => {
    document.body.innerHTML = '<button class="custom-expand"></button>';
    fixExpandButtons("custom-expand", "Show details");
    const btn = document.querySelector(".custom-expand");
    expect(btn.getAttribute("aria-label")).to.equal("Show details");
  });

  it("names a row's button from the row, and does not repeat itself when run again", () => {
    // Tables re-run it after sorting, when the buttons already carry a label.
    document.body.innerHTML =
      '<table><tbody><tr><td><button class="v-data-table__expand-icon"></button></td>' +
      "<td>Budget Committee Meeting</td><td>Aug 27, 2026</td></tr></tbody></table>";
    // jsdom has no layout, so innerText falls back to textContent
    document.querySelectorAll("td").forEach((td) => {
      Object.defineProperty(td, "innerText", {
        get: () => td.textContent,
      });
    });
    fixExpandButtons();
    fixExpandButtons();
    const btn = document.querySelector("button");
    expect(btn.getAttribute("aria-label")).to.equal(
      "Toggle details for Budget Committee Meeting"
    );
  });
});

// ---------------------------------------------------------------------------
// fixFigureTabindex
// ---------------------------------------------------------------------------
describe("fixFigureTabindex()", () => {
  it("replaces positive tabindex with 0", () => {
    document.body.innerHTML = '<figure tabindex="3">content</figure>';
    fixFigureTabindex();
    expect(document.querySelector("figure").getAttribute("tabindex")).to.equal(
      "0"
    );
  });

  it("leaves tabindex=0 unchanged", () => {
    document.body.innerHTML = '<figure tabindex="0">content</figure>';
    fixFigureTabindex();
    expect(document.querySelector("figure").getAttribute("tabindex")).to.equal(
      "0"
    );
  });

  it("does not add tabindex to figures without one", () => {
    document.body.innerHTML = "<figure>content</figure>";
    fixFigureTabindex();
    // querySelectorAll("figure[tabindex]") won't match, so nothing changes
    expect(document.querySelector("figure").hasAttribute("tabindex")).to.be
      .false;
  });
});

// ---------------------------------------------------------------------------
// fixHeadingOrder
// ---------------------------------------------------------------------------
describe("fixHeadingOrder()", () => {
  it("fixes heading level skip (h2 → h4 becomes h2 → h3)", () => {
    document.body.innerHTML =
      '<h1>Page Title</h1><div class="article-body"><h2>Section</h2><h4>Subsection</h4></div>';
    fixHeadingOrder();
    const headings = document.querySelectorAll(
      ".article-body h2, .article-body h3"
    );
    expect(headings.length).to.equal(2);
    expect(headings[1].tagName).to.equal("H3");
    expect(headings[1].textContent).to.equal("Subsection");
  });

  it("preserves correct heading order", () => {
    document.body.innerHTML =
      '<h1>Title</h1><div class="article-body"><h2>A</h2><h3>B</h3></div>';
    fixHeadingOrder();
    const h3 = document.querySelector(".article-body h3");
    expect(h3.tagName).to.equal("H3");
    expect(h3.textContent).to.equal("B");
  });

  it("copies attributes to replacement heading", () => {
    document.body.innerHTML =
      '<h1>Title</h1><div class="article-body"><h2>A</h2><h4 id="my-id" class="special">B</h4></div>';
    fixHeadingOrder();
    const fixed = document.querySelector(".article-body h3");
    expect(fixed.getAttribute("id")).to.equal("my-id");
    expect(fixed.getAttribute("class")).to.equal("special");
  });
});

// ---------------------------------------------------------------------------
// fixEmptyTableHeaders
// ---------------------------------------------------------------------------
describe("fixEmptyTableHeaders()", () => {
  it("fills empty th with sr-only text", () => {
    document.body.innerHTML =
      "<table><thead><tr><th></th><th>Name</th></tr></thead></table>";
    fixEmptyTableHeaders();
    const headers = document.querySelectorAll("th");
    expect(headers[0].innerHTML).to.include("Column header");
    expect(headers[0].innerHTML).to.include("sr-only");
    expect(headers[1].textContent).to.equal("Name");
  });

  it("fills whitespace-only th", () => {
    document.body.innerHTML =
      "<table><thead><tr><th>   </th></tr></thead></table>";
    fixEmptyTableHeaders();
    expect(document.querySelector("th").innerHTML).to.include("Column header");
  });
});

// ---------------------------------------------------------------------------
// fixFootnoteTargetSize
// ---------------------------------------------------------------------------
describe("fixFootnoteTargetSize()", () => {
  it("sets minimum 28px dimensions on footnote links", () => {
    document.body.innerHTML = '<a href="#fn1" class="footnote-ref">1</a>';
    // The selector in the function matches a[href^='#fn']
    fixFootnoteTargetSize();
    const link = document.querySelector("a");
    expect(link.style.minWidth).to.equal("28px");
    expect(link.style.minHeight).to.equal("28px");
    expect(link.style.display).to.equal("inline-block");
  });

  it("sets target size on footnote-backref links", () => {
    document.body.innerHTML =
      '<a class="footnote-backref" href="#fnref1">↩</a>';
    fixFootnoteTargetSize();
    const link = document.querySelector("a");
    expect(link.style.minWidth).to.equal("28px");
  });
});

// ---------------------------------------------------------------------------
// fixNavHeaderRoles
// ---------------------------------------------------------------------------
describe("fixNavHeaderRoles()", () => {
  it("sets role=none on header inside nav", () => {
    document.body.innerHTML =
      '<nav aria-label="Main navigation"><header>Nav Content</header></nav>';
    fixNavHeaderRoles();
    const header = document.querySelector("header");
    expect(header.getAttribute("role")).to.equal("none");
  });

  it("does not affect header outside nav", () => {
    document.body.innerHTML = "<header>Site Header</header>";
    fixNavHeaderRoles();
    const header = document.querySelector("header");
    expect(header.hasAttribute("role")).to.be.false;
  });

  it("does not affect nav without aria-label", () => {
    document.body.innerHTML = "<nav><header>Content</header></nav>";
    fixNavHeaderRoles();
    const header = document.querySelector("header");
    expect(header.hasAttribute("role")).to.be.false;
  });
});

// ---------------------------------------------------------------------------
// fixOverlayContainer
// ---------------------------------------------------------------------------
describe("fixOverlayContainer()", () => {
  // fixOverlayContainer uses MutationObserver internally; skip if unavailable
  const hasMO = typeof MutationObserver !== "undefined";

  it("marks overlay container as role=presentation", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML = '<div class="v-overlay-container">Overlay</div>';
    fixOverlayContainer();
    const overlay = document.querySelector(".v-overlay-container");
    expect(overlay.getAttribute("role")).to.equal("presentation");
  });

  it("does not re-mark already-fixed overlays", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML =
      '<div class="v-overlay-container" role="presentation">OK</div>';
    fixOverlayContainer();
    const overlay = document.querySelector(".v-overlay-container");
    expect(overlay.getAttribute("role")).to.equal("presentation");
  });
});

// ---------------------------------------------------------------------------
// fixNestedInteractive
// ---------------------------------------------------------------------------
describe("fixNestedInteractive()", () => {
  // fixNestedInteractive uses MutationObserver internally; skip if unavailable
  const hasMO = typeof MutationObserver !== "undefined";
  // The observer is installed once per window and later calls are no-ops, so
  // reset it: each test then gets the synchronous first pass.
  const run = () => {
    if (window._nestedInteractiveObserver) {
      window._nestedInteractiveObserver.disconnect();
      delete window._nestedInteractiveObserver;
    }
    fixNestedInteractive();
  };
  // Vuetify 2.5 v-select markup (wrapper attributes as Vuetify renders them)
  const vSelect = (selection) =>
    '<div class="v-input v-select"><div class="v-input__control">' +
    '<div class="v-input__slot" role="button" aria-haspopup="listbox" aria-expanded="false" aria-owns="list-1">' +
    '<div class="v-select__slot"><label for="input-1">Show events from</label>' +
    '<div class="v-select__selections">' +
    (selection ? `<div class="v-select__selection">${selection}</div>` : "") +
    '<input id="input-1" aria-label="Show events from time range" readonly type="text">' +
    '</div><input type="hidden"></div></div></div></div>';

  it("removes role=button and the popup state from the v-select wrapper", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML = vSelect("Past 12 months");
    run();
    const el = document.querySelector(".v-input__slot");
    expect(el.hasAttribute("role")).to.be.false;
    expect(el.hasAttribute("aria-expanded")).to.be.false;
    expect(el.hasAttribute("aria-haspopup")).to.be.false;
    expect(el.hasAttribute("aria-owns")).to.be.false;
  });

  it("moves the select's role and popup state to the focusable input", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML = vSelect("Past 12 months");
    run();
    const input = document.querySelector("#input-1");
    expect(input.getAttribute("role")).to.equal("combobox");
    expect(input.getAttribute("aria-haspopup")).to.equal("listbox");
    expect(input.getAttribute("aria-expanded")).to.equal("false");
    expect(input.getAttribute("aria-controls")).to.equal("list-1");
  });

  it("names the input by its own label, then the chosen value", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML = vSelect("Past 12 months");
    run();
    const input = document.querySelector("#input-1");
    const selection = document.querySelector(".v-select__selection");
    expect(selection.id).to.equal("input-1-selection-0");
    expect(input.getAttribute("aria-labelledby")).to.equal(
      "input-1 input-1-selection-0"
    );
  });

  it("names an input with no value by its own label only", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML = vSelect(null);
    run();
    expect(
      document.querySelector("#input-1").getAttribute("aria-labelledby")
    ).to.equal("input-1");
  });

  it("keeps aria-expanded in step when Vuetify rewrites it on the wrapper", async function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML = vSelect("Past 12 months");
    run();
    const slot = document.querySelector(".v-input__slot");
    slot.setAttribute("aria-expanded", "true");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      document.querySelector("#input-1").getAttribute("aria-expanded")
    ).to.equal("true");
    expect(slot.hasAttribute("aria-expanded")).to.be.false;
  });

  it("does not affect div[role=button] outside a v-select", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML =
      '<div role="button" aria-haspopup="menu">Toggle</div>';
    run();
    const el = document.querySelector("div");
    expect(el.getAttribute("role")).to.equal("button");
  });
});

// ---------------------------------------------------------------------------
// fixDataTableHeaders
// ---------------------------------------------------------------------------
describe("fixDataTableHeaders()", () => {
  it('adds scope="col" to <th> elements inside v-data-table', () => {
    document.body.innerHTML =
      '<div class="v-data-table"><table><thead><tr><th>Date</th><th>Title</th></tr></thead></table></div>';
    fixDataTableHeaders();
    const ths = document.querySelectorAll("th");
    expect(ths[0].getAttribute("scope")).to.equal("col");
    expect(ths[1].getAttribute("scope")).to.equal("col");
  });

  it("fills empty expand-column header with sr-only Details text", () => {
    document.body.innerHTML =
      '<div class="v-data-table"><table><thead><tr><th></th><th>Title</th></tr></thead></table></div>';
    fixDataTableHeaders();
    const firstTh = document.querySelector("th");
    expect(firstTh.innerHTML).to.include("sr-only");
    expect(firstTh.innerHTML).to.include("Details");
  });

  it("does not touch <th> outside v-data-table", () => {
    document.body.innerHTML =
      "<table><thead><tr><th>Regular</th></tr></thead></table>";
    fixDataTableHeaders();
    const th = document.querySelector("th");
    expect(th.hasAttribute("scope")).to.be.false;
  });

  it("preserves existing scope attribute", () => {
    document.body.innerHTML =
      '<div class="v-data-table"><table><thead><tr><th scope="row">RowHeader</th></tr></thead></table></div>';
    fixDataTableHeaders();
    const th = document.querySelector("th");
    expect(th.getAttribute("scope")).to.equal("row");
  });

  it("does not add Details text to non-empty headers", () => {
    document.body.innerHTML =
      '<div class="v-data-table"><table><thead><tr><th>Real Header</th></tr></thead></table></div>';
    fixDataTableHeaders();
    const th = document.querySelector("th");
    expect(th.innerHTML).to.not.include("sr-only");
    expect(th.textContent).to.equal("Real Header");
  });
});

// ---------------------------------------------------------------------------
// fixAriaHiddenFocus
// ---------------------------------------------------------------------------
describe("fixAriaHiddenFocus()", () => {
  it('sets tabindex="-1" on <a href> inside aria-hidden container', () => {
    document.body.innerHTML =
      '<div aria-hidden="true"><a href="/page">Link</a></div>';
    fixAriaHiddenFocus();
    const link = document.querySelector("a");
    expect(link.getAttribute("tabindex")).to.equal("-1");
  });

  it('sets tabindex="-1" on button inside aria-hidden container', () => {
    document.body.innerHTML =
      '<div aria-hidden="true"><button>Click</button></div>';
    fixAriaHiddenFocus();
    const btn = document.querySelector("button");
    expect(btn.getAttribute("tabindex")).to.equal("-1");
  });

  it("sets tabindex=-1 on input, select, and textarea inside aria-hidden", () => {
    document.body.innerHTML =
      '<div aria-hidden="true"><input type="text"><select></select><textarea></textarea></div>';
    fixAriaHiddenFocus();
    expect(document.querySelector("input").getAttribute("tabindex")).to.equal(
      "-1"
    );
    expect(document.querySelector("select").getAttribute("tabindex")).to.equal(
      "-1"
    );
    expect(
      document.querySelector("textarea").getAttribute("tabindex")
    ).to.equal("-1");
  });

  it("does not affect focusable elements outside aria-hidden", () => {
    document.body.innerHTML = '<a href="/page">Outside</a>';
    fixAriaHiddenFocus();
    const link = document.querySelector("a");
    expect(link.hasAttribute("tabindex")).to.be.false;
  });

  it('sets tabindex="-1" on elements with tabindex > 0 inside aria-hidden', () => {
    document.body.innerHTML =
      '<div aria-hidden="true"><div tabindex="0">Focusable</div></div>';
    fixAriaHiddenFocus();
    const el = document.querySelector("div[tabindex]");
    expect(el.getAttribute("tabindex")).to.equal("-1");
  });

  it('does not re-process already tabindex="-1" elements', () => {
    document.body.innerHTML =
      '<div aria-hidden="true"><div tabindex="-1">Already hidden</div></div>';
    fixAriaHiddenFocus();
    const el = document.querySelector("div[tabindex]");
    expect(el.getAttribute("tabindex")).to.equal("-1");
  });
});

// ---------------------------------------------------------------------------
// fixEmptyAriaLabel
// ---------------------------------------------------------------------------
describe("fixEmptyAriaLabel()", () => {
  it('removes empty aria-label="" from any element', () => {
    document.body.innerHTML = '<div aria-label="">Content</div>';
    fixEmptyAriaLabel();
    const div = document.querySelector("div");
    expect(div.hasAttribute("aria-label")).to.be.false;
  });

  it('removes empty aria-label="" from Vuetify v-image wrapper', () => {
    document.body.innerHTML =
      '<div aria-label="" class="v-image" role="img">img</div>';
    fixEmptyAriaLabel();
    const div = document.querySelector(".v-image");
    expect(div.hasAttribute("aria-label")).to.be.false;
    expect(div.getAttribute("role")).to.equal("img");
  });

  it("preserves non-empty aria-label", () => {
    document.body.innerHTML =
      '<div aria-label="Meaningful label">Content</div>';
    fixEmptyAriaLabel();
    const div = document.querySelector("div");
    expect(div.getAttribute("aria-label")).to.equal("Meaningful label");
  });

  it("handles multiple empty aria-label elements", () => {
    document.body.innerHTML =
      '<div aria-label="">A</div><span aria-label="">B</span><button aria-label="">C</button>';
    fixEmptyAriaLabel();
    document.querySelectorAll("div, span, button").forEach((el) => {
      expect(el.hasAttribute("aria-label")).to.be.false;
    });
  });

  it("does not affect elements with no aria-label", () => {
    document.body.innerHTML = "<div>Plain</div>";
    fixEmptyAriaLabel();
    const div = document.querySelector("div");
    expect(div.hasAttribute("aria-label")).to.be.false;
    expect(div.textContent).to.equal("Plain");
  });
});

// ---------------------------------------------------------------------------
// fixInlineColorContrast
// ---------------------------------------------------------------------------
describe("fixInlineColorContrast()", () => {
  const colorOf = (id) => document.getElementById(id).style.color;

  it("resets a low-contrast colour on the page background, through transparent wrappers", () => {
    // Transparent ancestors used to count as a dark background, so this
    // element was skipped.
    document.body.innerHTML =
      '<div class="markdown-body"><div><div><p id="t" style="color: #bbbbbb">Light grey, 1.99:1</p></div></div></div>';
    fixInlineColorContrast();
    expect(colorOf("t")).to.equal("rgb(0, 0, 0)");
  });

  it("resets a low-contrast colour on an opaque background of its own section", () => {
    document.body.innerHTML =
      '<div class="markdown-body"><div style="background-color: #fafafa"><span id="t" style="color: #999999">Grey, 2.72:1</span></div></div>';
    fixInlineColorContrast();
    expect(colorOf("t")).to.equal("rgb(0, 0, 0)");
  });

  it("leaves colours that meet 4.5:1 unchanged", () => {
    document.body.innerHTML =
      '<div class="markdown-body"><p id="blue" style="color: #1565c0">Blue, 5.75:1</p><p id="grey" style="color: #444444">Grey, 9.74:1</p></div>';
    fixInlineColorContrast();
    expect(colorOf("blue")).to.equal("rgb(21, 101, 192)");
    expect(colorOf("grey")).to.equal("rgb(68, 68, 68)");
  });

  it("uses white for low-contrast text on a dark background and keeps white text there", () => {
    document.body.innerHTML =
      '<div class="markdown-body" style="background-color: #0d4474"><span id="dark" style="color: #1a1a1a">Near-black, 1.74:1</span><span id="white" style="color: #ffffff">White, 10.02:1</span></div>';
    fixInlineColorContrast();
    expect(colorOf("dark")).to.equal("rgb(255, 255, 255)");
    expect(colorOf("white")).to.equal("rgb(255, 255, 255)");
  });

  it("applies 3:1 to large text and 4.5:1 to other text", () => {
    document.body.innerHTML =
      '<div class="markdown-body"><h2 id="large" style="color: #8a8a8a; font-size: 24px">Large, 3.46:1</h2><p id="small" style="color: #8a8a8a; font-size: 16px">Small, 3.46:1</p></div>';
    fixInlineColorContrast();
    expect(colorOf("large")).to.equal("rgb(138, 138, 138)");
    expect(colorOf("small")).to.equal("rgb(0, 0, 0)");
  });

  it("leaves text over an image alone", () => {
    document.body.innerHTML =
      '<div class="markdown-body"><div class="v-image"><div class="v-responsive__content"><h2 id="t" style="color: #ffffff">White over a photo</h2></div></div></div>';
    fixInlineColorContrast();
    expect(colorOf("t")).to.equal("rgb(255, 255, 255)");
  });

  it("leaves elements that set their own background alone", () => {
    document.body.innerHTML =
      '<div class="markdown-body"><span id="t" style="background: #ffff00; color: #ffffff">Author-set pair</span></div>';
    fixInlineColorContrast();
    expect(colorOf("t")).to.equal("rgb(255, 255, 255)");
  });

  it("keeps an !important colour important", () => {
    document.body.innerHTML =
      '<div class="markdown-body"><p id="t" style="color: #cccccc !important">Pale grey</p></div>';
    fixInlineColorContrast();
    const el = document.getElementById("t");
    expect(el.style.color).to.equal("rgb(0, 0, 0)");
    expect(el.style.getPropertyPriority("color")).to.equal("important");
  });

  it("ignores content outside the CMS containers", () => {
    document.body.innerHTML =
      '<div><p id="t" style="color: #bbbbbb">Template text</p></div>';
    fixInlineColorContrast();
    expect(colorOf("t")).to.equal("rgb(187, 187, 187)");
  });
});

// ---------------------------------------------------------------------------
// fixTableCellContext: the runtime table repair uses the content pipeline's
// header heuristic (src/utils/contentSanitizer.js fixSimpleTable), so both
// paths reach the same header decisions.
// ---------------------------------------------------------------------------
describe("fixTableCellContext() — the content pipeline's header decisions", () => {
  // Header text each data cell is associated with, via headers="…".
  const headersOf = (root) => {
    const out = {};
    root.querySelectorAll("td").forEach((td) => {
      const text = td.textContent.trim();
      if (!text) return;
      out[text] = (td.getAttribute("headers") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => root.querySelector(`[id="${id}"]`).textContent.trim());
    });
    return out;
  };
  const runtime = (html) => {
    document.body.innerHTML = `<div class="article-body">${html}</div>`;
    fixTableCellContext();
    return document.body;
  };
  const pipeline = (html) =>
    new DOMParser().parseFromString(fixCmsTables(html), "text/html").body;

  const TABLES = {
    // Table 1 of "Addressing Opioid Use Disorders in Corrections": a header
    // row styled only by class, and no row labels.
    classStyledHeaderRow:
      '<table><tbody><tr><td class="tg-0lax shaded bold">Methadone</td>' +
      '<td class="tg-0lax shaded bold">Buprenorphine</td>' +
      '<td class="tg-0lax shaded bold">Naltrexone</td></tr>' +
      "<tr><td>Full agonist</td><td>Partial agonist</td><td>Antagonist</td></tr>" +
      "<tr><td>Taken daily</td><td>Taken twice</td><td>Injectable</td></tr>" +
      "</tbody></table>",
    blankCorner:
      "<table><tbody><tr><td><strong> </strong></td><td><strong>n</strong></td>" +
      "<td><strong>Percent</strong></td></tr>" +
      "<tr><td>Northern</td><td>10</td><td>27.8</td></tr>" +
      "<tr><td>Central</td><td>16</td><td>44.4</td></tr></tbody></table>",
    twoRowGroupHeaders:
      '<table><tbody><tr><td rowspan="2"></td><td colspan="2">Initial</td>' +
      '<td colspan="2">Sporadic</td></tr>' +
      "<tr><td>n</td><td>Percent</td><td>n</td><td>Percent</td></tr>" +
      "<tr><td>Sanctions</td><td>18</td><td>47%</td><td>21</td><td>57%</td></tr>" +
      "</tbody></table>",
    labelsBesideNumbers:
      "<table><tbody><tr><td><b>Region</b></td><td><b>2019</b></td><td><b>2020</b></td></tr>" +
      "<tr><td>Cook</td><td>2,062</td><td>2,475</td></tr>" +
      "<tr><td>Collar</td><td>1,104</td><td>998</td></tr></tbody></table>",
    // The Research Hub dataset "Variables" table, which only this runtime
    // path repairs: an authored header row, and names in the first column.
    authoredHeaderRow:
      "<table><thead><tr><th>Name</th><th>Type</th><th>Definition</th></tr></thead>" +
      "<tbody><tr><td>year</td><td>integer</td><td>The year events were reported</td></tr>" +
      "<tr><td>county</td><td>string</td><td>County name</td></tr></tbody></table>",
  };

  Object.entries(TABLES).forEach(([name, html]) => {
    it(`associates the same headers as the content pipeline: ${name}`, () => {
      const expected = headersOf(pipeline(html));
      const actual = headersOf(runtime(html));
      expect(Object.keys(actual).length).to.be.greaterThan(0);
      expect(actual).to.deep.equal(expected);
    });
  });

  it("gives the opioid table column headers and no row headers, and keeps them on a second pass", () => {
    const body = runtime(TABLES.classStyledHeaderRow);
    fixTableCellContext();
    expect(body.querySelectorAll('th[scope="col"]').length).to.equal(3);
    expect(body.querySelectorAll('th[scope="row"]').length).to.equal(0);
    const headers = headersOf(body);
    expect(headers["Partial agonist"]).to.deep.equal(["Buprenorphine"]);
    expect(headers["Injectable"]).to.deep.equal(["Naltrexone"]);
  });

  it("still makes the first column row headers under an authored header row", () => {
    const headers = headersOf(runtime(TABLES.authoredHeaderRow));
    expect(headers["integer"]).to.deep.equal(["Type", "year"]);
    expect(headers["County name"]).to.deep.equal(["Definition", "county"]);
  });
});

// ---------------------------------------------------------------------------
// fixLabelInName: icon buttons
// ---------------------------------------------------------------------------
describe("fixLabelInName() — icon buttons", () => {
  it("keeps the aria-label of a button that is itself an icon", () => {
    // A data table's expand button: the glyph is generated content of the
    // button, and would join the accessible name if the label went.
    document.body.innerHTML =
      '<button class="v-icon mdi mdi-chevron-down v-data-table__expand-icon" aria-label="Toggle details for Budget">' +
      '<span class="sr-only">Toggle details for Budget</span></button>';
    fixLabelInName();
    expect(
      document.querySelector("button").getAttribute("aria-label")
    ).to.equal("Toggle details for Budget");
  });

  it("still removes an aria-label that repeats a button's visible text", () => {
    document.body.innerHTML =
      '<button class="v-btn" aria-label="Download">Download</button>';
    fixLabelInName();
    expect(document.querySelector("button").hasAttribute("aria-label")).to.be
      .false;
  });
});

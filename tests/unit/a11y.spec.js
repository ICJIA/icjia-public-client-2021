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
} from "@/a11y/index";

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
  it("sets minimum 24px dimensions on footnote links", () => {
    document.body.innerHTML = '<a href="#fn1" class="footnote-ref">1</a>';
    // The selector in the function matches a[href^='#fn']
    fixFootnoteTargetSize();
    const link = document.querySelector("a");
    expect(link.style.minWidth).to.equal("24px");
    expect(link.style.minHeight).to.equal("24px");
    expect(link.style.display).to.equal("inline-block");
  });

  it("sets target size on footnote-backref links", () => {
    document.body.innerHTML =
      '<a class="footnote-backref" href="#fnref1">↩</a>';
    fixFootnoteTargetSize();
    const link = document.querySelector("a");
    expect(link.style.minWidth).to.equal("24px");
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

  it("removes role=button from v-select wrapper", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML =
      '<div role="button" aria-haspopup="listbox" aria-expanded="false" aria-owns="list-1"><input type="text"></div>';
    fixNestedInteractive();
    const el = document.querySelector("div");
    expect(el.hasAttribute("role")).to.be.false;
    expect(el.hasAttribute("aria-expanded")).to.be.false;
    expect(el.hasAttribute("aria-haspopup")).to.be.false;
    expect(el.hasAttribute("aria-owns")).to.be.false;
  });

  it("does not affect div[role=button] without aria-haspopup=listbox", function () {
    if (!hasMO) return this.skip();
    document.body.innerHTML =
      '<div role="button" aria-haspopup="menu">Toggle</div>';
    fixNestedInteractive();
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
    expect(document.querySelector("textarea").getAttribute("tabindex")).to.equal(
      "-1"
    );
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

  it('preserves non-empty aria-label', () => {
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

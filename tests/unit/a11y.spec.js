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
  it("removes role=button from v-select wrapper", () => {
    document.body.innerHTML =
      '<div role="button" aria-haspopup="listbox" aria-expanded="false" aria-owns="list-1"><input type="text"></div>';
    fixNestedInteractive();
    const el = document.querySelector("div");
    expect(el.hasAttribute("role")).to.be.false;
    expect(el.hasAttribute("aria-expanded")).to.be.false;
    expect(el.hasAttribute("aria-haspopup")).to.be.false;
    expect(el.hasAttribute("aria-owns")).to.be.false;
  });

  it("does not affect div[role=button] without aria-haspopup=listbox", () => {
    document.body.innerHTML =
      '<div role="button" aria-haspopup="menu">Toggle</div>';
    fixNestedInteractive();
    const el = document.querySelector("div");
    expect(el.getAttribute("role")).to.equal("button");
  });
});

// Server-side port of src/services/Markdown.js.
//
// Pipeline (unchanged from the legacy site, so rendered output matches):
//   md.render(markdown)              markdown-it + the exact legacy plugin set
//   → DOMPurify.sanitize(...)        XSS sanitize with the legacy ADD_TAGS/ADD_ATTR
//   → fixTableHeaders(...)           promote header rows, scope, thead/tbody
//   → fixImageLinks(...)             accessible names for image-only links
//   → sanitizeContent(...)           the SiteImprove/a11y content pipeline
//
// Two DOM engines, by design:
//   - DOMPurify is backed by jsdom (complete + battle-tested for server-side
//     XSS sanitization — correctness is non-negotiable here).
//   - fixTableHeaders / fixImageLinks / contentSanitizer use the global
//     `DOMParser`, shimmed to the lighter linkedom (see server-dom.ts), which
//     the parity suite proved produces browser-identical output.
import "./server-dom"; // installs globalThis.DOMParser (linkedom) — must precede the DOM helpers
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { sanitizeContent } from "./contentSanitizer";
import MarkdownIt from "markdown-it";
import markdownItAnchorRaw from "markdown-it-anchor";
import markdownItFootnoteRaw from "markdown-it-footnote";
import markdownItLinkAttributesRaw from "markdown-it-link-attributes";
import markdownItMultimdTableRaw from "markdown-it-multimd-table";
import markdownItImplicitFiguresRaw from "markdown-it-implicit-figures";
import markdownItAttrsRaw from "markdown-it-attrs";

// CJS/ESM interop: some plugins expose the function on `.default`, others
// directly. Normalize both.
const interop = (m) => (m && m.default ? m.default : m);
const markdownItAnchor = interop(markdownItAnchorRaw);
const markdownItFootnote = interop(markdownItFootnoteRaw);
const markdownItLinkAttributes = interop(markdownItLinkAttributesRaw);
const markdownItMultimdTable = interop(markdownItMultimdTableRaw);
const markdownItImplicitFigures = interop(markdownItImplicitFiguresRaw);
const markdownItAttrs = interop(markdownItAttrsRaw);

const DOMPurify = createDOMPurify(new JSDOM("").window);

const mdAnchorOpts = {
  level: 2,
  slugify: (s) =>
    String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, ""),
};

const mdLinkAttrOpts = {
  attrs: {
    target: "_blank",
    rel: "noopener noreferrer",
  },
};

const mdMultimdTableOpts = {
  multiline: true,
  enableRowspan: true,
};

const mdAttrs = {
  leftDelimiter: "{",
  rightDelimiter: "}",
  allowedAttributes: [],
};

const mdImplicitFigureOpts = {
  dataType: false,
  figcaption: false,
  tabindex: true,
  link: false,
};

const md = new MarkdownIt({
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  typographer: true,
  quotes: "“”‘’",
})
  .use(markdownItAnchor, mdAnchorOpts)
  .use(markdownItFootnote)
  .use(markdownItLinkAttributes, mdLinkAttrOpts)
  .use(markdownItMultimdTable, mdMultimdTableOpts)
  .use(markdownItImplicitFigures, mdImplicitFigureOpts)
  .use(markdownItAttrs, mdAttrs);

const fixTableHeaders = function (html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = doc.querySelectorAll("table");
  let changed = false;

  tables.forEach((table) => {
    // Pass 1: promote first row to <th> if table has no headers at all
    if (!table.querySelector("th")) {
      const firstRow = table.querySelector("tr");
      if (!firstRow) return;

      let thead = table.querySelector("thead");
      if (!thead) {
        thead = doc.createElement("thead");
        table.insertBefore(thead, table.firstChild);
      }

      firstRow.querySelectorAll("td").forEach((td) => {
        const th = doc.createElement("th");
        th.innerHTML = td.innerHTML;
        th.setAttribute("scope", "col");
        Array.from(td.attributes).forEach((attr) =>
          th.setAttribute(attr.name, attr.value)
        );
        td.replaceWith(th);
      });

      if (firstRow.parentNode !== thead) {
        thead.appendChild(firstRow);
      }

      const remainingRows = table.querySelectorAll("tr");
      if (remainingRows.length && !table.querySelector("tbody")) {
        const tbody = doc.createElement("tbody");
        remainingRows.forEach((row) => {
          if (row.parentNode !== thead) tbody.appendChild(row);
        });
        table.appendChild(tbody);
      }

      changed = true;
    }

    // Pass 2: fix misaligned rows with an extra empty leading cell
    const headerRow = table.querySelector("thead tr");
    if (!headerRow) return;
    const colCount = headerRow.children.length;

    table.querySelectorAll("tbody tr").forEach((row) => {
      const cells = Array.from(row.children);
      if (
        cells.length === colCount + 1 &&
        cells[0].tagName === "TD" &&
        !cells[0].textContent.trim()
      ) {
        cells[0].remove();
        const first = row.children[0];
        if (first && first.tagName === "TD") {
          const th = doc.createElement("th");
          th.innerHTML = first.innerHTML;
          th.setAttribute("scope", "row");
          Array.from(first.attributes).forEach((attr) =>
            th.setAttribute(attr.name, attr.value)
          );
          first.replaceWith(th);
        }
        changed = true;
      }
    });
  });

  return changed ? doc.body.innerHTML : html;
};

const fixImageLinks = function (html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const links = doc.querySelectorAll("a");
  let changed = false;

  links.forEach((a) => {
    if (a.textContent.trim() || a.getAttribute("aria-label")) return;
    const img = a.querySelector("img");
    if (!img) return;
    if ((img.getAttribute("alt") || "").trim()) return;

    const href = a.getAttribute("href") || "";
    const segment = href.split("/").filter(Boolean).pop() || "link";
    const label = segment.replace(/[-_]/g, " ");
    a.setAttribute("aria-label", label);
    img.setAttribute("alt", label);
    changed = true;
  });

  return changed ? doc.body.innerHTML : html;
};

const renderToHtml = function (markdown) {
  const raw = md.render(markdown || "");
  const sanitized = DOMPurify.sanitize(raw, {
    ADD_TAGS: ["figure", "figcaption", "iframe", "style"],
    ADD_ATTR: [
      "target",
      "id",
      "class",
      "style",
      "tabindex",
      "aria-label",
      "aria-hidden",
      "role",
      "data-type",
      "colspan",
      "rowspan",
      "scope",
      "headers",
      "allow",
      "allowfullscreen",
      "frameborder",
    ],
  });
  return sanitizeContent(fixImageLinks(fixTableHeaders(sanitized)));
};

const parseHeadings = function (markdown) {
  return new DOMParser()
    .parseFromString(md.render(markdown || ""), "text/html")
    .querySelectorAll("h2");
};

// Inline render (no block <p> wrapper) — for short single-line fields like a CMS
// page title that go inside an <h1>. md.renderInline parses inline markdown
// (emphasis, links, code) without wrapping in a paragraph, then we sanitize with
// the same allowlist so a title can't smuggle markup. Avoids the invalid
// <h1><p>…</p></h1> nesting that the block renderer produced.
const renderInline = function (markdown) {
  const raw = md.renderInline(markdown || "");
  const sanitized = DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "id", "class", "aria-label", "aria-hidden", "role"],
  });
  return sanitizeContent(sanitized);
};

export { renderToHtml, renderInline, parseHeadings };

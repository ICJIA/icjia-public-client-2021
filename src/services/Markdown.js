import DOMPurify from "dompurify";
// const config = require("@/config/config.json");
// import { EventBus } from "@/event-bus.js";
// const namedHeaders = require("markdown-it-named-headers");
// const attrs = require("markdown-it-attrs/markdown-it-attrs.browser.js");

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
  dataType: false, // <figure data-type="image">, default: false
  figcaption: false, // <figcaption>alternative text</figcaption>, default: false
  tabindex: true, // <figure tabindex="1+n">..., default: false
  link: false, // <a href="img.png"><img src="img.png"></a>, default: false
};

let md = require("markdown-it")({
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  typographer: true,
  quotes: "“”‘’",
})
  .use(require("markdown-it-anchor").default, mdAnchorOpts)
  .use(require("markdown-it-footnote"))
  .use(require("markdown-it-link-attributes"), mdLinkAttrOpts)
  .use(require("markdown-it-multimd-table"), mdMultimdTableOpts)
  .use(require("markdown-it-implicit-figures"), mdImplicitFigureOpts)
  .use(require("markdown-it-attrs"), mdAttrs);

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

const renderToHtml = function (markdown) {
  const raw = md.render(markdown);
  const sanitized = DOMPurify.sanitize(raw, {
    ADD_TAGS: ["figure", "figcaption", "iframe"],
    ADD_ATTR: [
      "target",
      "id",
      "class",
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
  return fixTableHeaders(sanitized);
};

const parseHeadings = function (markdown) {
  return new DOMParser()
    .parseFromString(md.render(markdown), "text/html")
    .querySelectorAll("h2");
};

export { renderToHtml, parseHeadings };

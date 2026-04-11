import DOMPurify from "dompurify";

export { createMarkdownUtils, initMarkdownIt };

const PURIFY_OPTS = {
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

const createMarkdownUtils = (md) => ({
  addImages(images, markdown) {
    return `${markdown}${images
      .map((i) => `\n\n[${i.title}]: ${i.src}`)
      .join("\n")}`;
  },
  parseHeadings(markdown) {
    return new DOMParser()
      .parseFromString(md.render(markdown), "text/html")
      .querySelectorAll("h2");
  },

  renderMarkdown(markdown) {
    const raw = md
      .render(markdown)
      .replace(/#fn/g, window.location.href + "#fn");
    const sanitized = DOMPurify.sanitize(raw, PURIFY_OPTS);
    return fixImageLinks(fixTableHeaders(sanitized));
  },
});

const initMarkdownIt = () =>
  require("markdown-it")(mdOpts)
    .use(require("markdown-it-anchor").default, mdAnchorOpts)
    .use(require("markdown-it-footnote"))
    .use(require("markdown-it-link-attributes"), mdLinkAttrOpts)
    .use(require("markdown-it-multimd-table"), mdMultimdTableOpts);

const mdOpts = {
  html: true,
  linkify: true,
  typographer: true,
};

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

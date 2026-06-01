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

// CMS-embedded <iframe> is allowed (renderToHtml ADD_TAGS) for legitimate embeds,
// but ONLY from trusted hosts — otherwise a malicious/compromised author could embed
// an arbitrary external page (phishing / disinformation). This hook drops any iframe
// whose src is not https + an allowlisted host. **EXTEND this list** if a legitimate
// embed is blocked (confirm against actual CMS content before/at cutover).
const IFRAME_HOST_ALLOWLIST = [
  /(^|\.)icjia\.illinois\.gov$/i,
  /(^|\.)icjia-api\.cloud$/i,
  /(^|\.)icjia\.cloud$/i,
  /(^|\.)youtube\.com$/i,
  /(^|\.)youtube-nocookie\.com$/i,
  /(^|\.)youtu\.be$/i,
  /(^|\.)vimeo\.com$/i,
  /(^|\.)arcgis\.com$/i,
  /(^|\.)dwcdn\.net$/i, // Datawrapper
  /(^|\.)tableau\.com$/i,
  /(^|\.)google\.com$/i, // Maps / Docs embeds
];
function iframeSrcAllowed(src) {
  try {
    const u = new URL(src, "https://icjia.illinois.gov");
    return u.protocol === "https:" && IFRAME_HOST_ALLOWLIST.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}
DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "iframe") {
    const src = node.getAttribute ? node.getAttribute("src") : null;
    if (!src || !iframeSrcAllowed(src)) node.parentNode?.removeChild(node);
  }
});

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

// CMS link-text fixer (Lighthouse SEO "link-text" / WCAG 2.4.4): CMS authors write
// non-descriptive links — "click here", "read more", a bare "here" pointing at a PDF.
// Give them a descriptive ACCESSIBLE NAME derived from the href, PREFIXED with the
// visible text so it (a) survives fixLabelInName (which keeps labels that contain the
// visible text) and (b) has no WCAG 2.5.3 label-in-name mismatch. Visible text is
// UNCHANGED (prod parity); only the accessible name improves → the link-text audit
// passes. Bare-URL link text is left alone (Lighthouse doesn't flag it).
const GENERIC_LINK_TEXT = new Set([
  "click here", "click this", "click", "go", "here", "this", "this page", "start",
  "right here", "more", "learn more", "learn", "read more", "read", "read on",
  "see more", "see", "details", "link", "this link", "download", "view", "view more",
  "continue", "more info", "more information", "info",
]);
const deriveLinkContext = function (href) {
  let u;
  try {
    u = new URL(href, "https://icjia.illinois.gov");
  } catch (e) {
    return null;
  }
  let seg = (u.pathname.split("/").filter(Boolean).pop() || "").trim();
  try {
    seg = decodeURIComponent(seg);
  } catch (e) {
    /* keep raw */
  }
  const extM = seg.match(/\.([a-z0-9]{2,5})$/i);
  let base = extM ? seg.slice(0, -extM[0].length) : seg;
  // strip a trailing Strapi upload hash (…-240808T19411840) then tidy separators
  base = base.replace(/[-_]\d{6,}t?\d*$/i, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  if (!base) base = u.hostname.replace(/^www\./, "");
  if (!base) return null;
  return extM ? `${base} (${extM[1].toUpperCase()})` : base;
};
const fixCmsLinkText = function (html) {
  if (!html || html.indexOf("<a") === -1) return html;
  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (e) {
    return html;
  }
  let changed = false;
  doc.querySelectorAll("a[href]").forEach((a) => {
    if (a.getAttribute("aria-label")) return; // already labeled — leave it
    const text = (a.textContent || "").replace(/\s+/g, " ").trim();
    const norm = text.toLowerCase().replace(/[\s.!?:;»›—–|>-]+$/g, "").trim();
    if (!norm || !GENERIC_LINK_TEXT.has(norm)) return;
    const ctx = deriveLinkContext(a.getAttribute("href") || "");
    if (!ctx) return;
    a.setAttribute("aria-label", `${text} — ${ctx}`);
    changed = true;
  });
  return changed ? doc.body.innerHTML : html;
};

// Port of the legacy a11y `fixLabelInName` (src/a11y/index.js), as a build-time
// content fixer. CMS authors sometimes give a link an aria-label that does NOT
// contain its visible text (e.g. visible "730 ILCS 210/3-5(e)" but aria-label
// "...3-5(b)(2)" — a copy-paste slip), which fails WCAG 2.5.3 (label-in-name).
// When a link has substantial visible text AND an aria-label that neither
// contains nor is contained by it, drop the aria-label so the visible text is
// the single accessible name (the legacy runtime did exactly this).
const fixLabelInName = function (html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let changed = false;
  doc.querySelectorAll("a[aria-label], [role='link'][aria-label]").forEach((el) => {
    const visible = (el.textContent || "").trim().replace(/\s+/g, " ").toLowerCase();
    const label = (el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").toLowerCase();
    if (visible.length > 3 && label.length > 0) {
      if (!label.includes(visible) && !visible.includes(label)) {
        el.removeAttribute("aria-label");
        changed = true;
      }
    }
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
  // fixLabelInName runs LAST: contentSanitizer has its own <a> pass that can set
  // aria-labels, so stripping mismatched ones must happen after it (otherwise the
  // sanitizer re-introduces the mismatch). Order matters here.
  // fixCmsLinkText before fixLabelInName: the former adds visible-text-prefixed
  // aria-labels to generic links; the latter then validates them (and strips any
  // genuinely mismatched ones). Order matters.
  return fixLabelInName(fixCmsLinkText(sanitizeContent(fixImageLinks(fixTableHeaders(sanitized)))));
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

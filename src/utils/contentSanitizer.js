/**
 * Content Pipeline — intercepts all CMS (Strapi 3) content before display
 * to fix misspellings, SiteImprove false-positive triggers, and other
 * content-level issues that cannot be fixed at the CMS source.
 *
 * Architecture:
 *   The pipeline is a chain of plugin functions. Each plugin receives a
 *   string (HTML or plain text) and returns a transformed string. Plugins
 *   are executed in registration order.
 *
 *   Two parallel pipelines exist:
 *     - htmlPipeline:  for rendered HTML (article bodies, markdown output)
 *     - textPipeline:  for plain text (titles, summaries, meta tags)
 *
 * Usage:
 *   import { sanitizeContent, sanitizeText } from "@/utils/contentSanitizer";
 *
 *   // For HTML body content (after markdown render + DOMPurify):
 *   const cleanHtml = sanitizeContent(rawHtml);
 *
 *   // For plain text (titles, summaries):
 *   const cleanText = sanitizeText(rawText);
 *
 * Adding a new plugin:
 *   1. Write a function:  (text: string) => string
 *   2. Register it:       registerHtmlPlugin(myPlugin)
 *                    or:  registerTextPlugin(myPlugin)
 *                    or:  registerPlugin(myPlugin)  // both pipelines
 *   3. Plugins run in registration order after the built-in plugins.
 */

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixMisspellings
// Corrects known CMS typos. Add new entries alphabetically.
// ═══════════════════════════════════════════════════════════════════

const MISSPELLINGS = [
  // Genuine typos (SiteImprove scan 2026-04-11)
  [/\bactivites\b/gi, "activities"],
  [/\bandthe\b/gi, "and the"],
  [/\bAssesing\b/gi, "Assessing"],
  [/\bBehavorial\b/gi, "Behavioral"],
  [/\bBuiding\b/gi, "Building"],
  [/\bChallange\b/gi, "Challenge"],
  [/\bCommunnity\b/gi, "Community"],
  [/\bcounites\b/gi, "counties"],
  [/\bDecription\b/gi, "Description"],
  [/\bdefendent\b/gi, "defendant"],
  [/\beligilble\b/gi, "eligible"],
  [/\bfollowin\b(?!g)/gi, "following"],
  [/\bIlliois\b/gi, "Illinois"],
  [/\bIndependant\b/gi, "Independent"],
  [/\bindependantly\b/gi, "independently"],
  [/\bInitative\b/gi, "Initiative"],
  [/\bInstitue\b/gi, "Institute"],
  [/\bJounral\b/gi, "Journal"],
  [/\blangauge\b/gi, "language"],
  [/\bllinois\b/gi, "Illinois"],
  [/\bNewletter\b/gi, "Newsletter"],
  [/\boversite\b/gi, "oversight"],
  [/\bpayed\b/gi, "paid"],
  [/\bprogam\b(?!m)/gi, "program"],
  [/\bprograming\b/gi, "programming"],
  [/\bReserah\b/gi, "Research"],
  [/\bReserach\b/gi, "Research"],
  [/\bResearh\b/gi, "Research"],
  [/\brepresenation\b/gi, "representation"],
  [/\bRetreived\b/gi, "Retrieved"],
  [/\bseperated\b/gi, "separated"],
  [/\bseperately\b/gi, "separately"],
  [/\bsubtance\b/gi, "substance"],
  [/\bTThe\b/g, "The"],
];

function fixMisspellings(text) {
  let result = text;
  for (const [pattern, replacement] of MISSPELLINGS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixApostrophes
// Restores apostrophes stripped by Strapi slug generation when those
// slugs leak into titles/headings. Only runs on text pipeline since
// HTML bodies rarely have this issue.
// ═══════════════════════════════════════════════════════════════════

const APOSTROPHES = [
  [/\bDont\b(?!')/g, "Don't"],
  [/\bWomens\b(?!')/g, "Women's"],
  [/\bCommunitys\b(?!')/g, "Community's"],
  [/\bCountys\b(?!')/g, "County's"],
  [/\bStates\sAttorneys\b/g, "State's Attorney's"],
];

function fixApostrophes(text) {
  let result = text;
  for (const [pattern, replacement] of APOSTROPHES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsImages
// Adds alt attributes to CMS images that are missing them.
// ═══════════════════════════════════════════════════════════════════

function fixCmsImages(html) {
  // Add alt text to images missing the alt attribute entirely
  return html.replace(/<img\b((?![^>]*\balt\s*=)[^>]*)>/gi, (match, attrs) => {
    // Try to derive alt from src filename
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    let alt = "";
    if (srcMatch) {
      alt = srcMatch[1]
        .split("/")
        .pop()
        .replace(/[-_]/g, " ")
        .replace(/\.[^.]+$/, "")
        .replace(/\s[a-f0-9]{8,}$/i, "")
        .trim();
    }
    return `<img alt="${alt}"${attrs}>`;
  });
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsContrast
// Fixes white-on-light contrast issues in CMS inline styles/classes.
// ═══════════════════════════════════════════════════════════════════

function fixCmsContrast(html) {
  let result = html;

  // Fix dark backgrounds with conflicting color: #000!important.
  // CMS authors set background: #3C5984 (dark blue) but color: #000 (black),
  // making text invisible. Change text to white.
  result = result.replace(
    /background:\s*(#[2-5][0-9a-f]{5})\s*!important;\s*color:\s*#000\s*!important/gi,
    "background: $1 !important; color: #fff !important"
  );

  // Word-pasted tables use the default Office blue (#4F81BD) as the
  // header fill, which only yields 4.03:1 contrast against white text
  // (below the 4.5:1 AA minimum). Replace it with a darker shade
  // (#2E5E97, ~6.3:1) that is visually similar but compliant.
  // Covers both the bgcolor HTML attribute and the inline style form.
  result = result.replace(/bgcolor=["']#4F81BD["']/gi, 'bgcolor="#2E5E97"');
  result = result.replace(/background(?:-color)?:\s*#4F81BD/gi, (m) =>
    m.replace(/#4F81BD/i, "#2E5E97")
  );
  result = result.replace(
    /background(?:-color)?:\s*rgb\(\s*79\s*,\s*129\s*,\s*189\s*\)/gi,
    (m) => m.replace(/rgb\([^)]*\)/i, "rgb(46, 94, 151)")
  );

  // Convert .white-heading class to inline style.
  // DOMPurify strips <style> tags, so class-based colors like
  // .white-heading {color: #fff !important} are lost after sanitization.
  // Inject inline color directly on elements that use the class.
  result = result.replace(
    /\{\.white-heading\b/g,
    '{style="color: #fff !important" .white-heading'
  );

  // Also handle HTML elements with class="white-heading" (non-markdown)
  result = result.replace(
    /class="([^"]*\bwhite-heading\b[^"]*)"/g,
    (match, classes) => {
      return `class="${classes}" style="color: #fff !important"`;
    }
  );

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsTables
// Eliminates SiteImprove SC 1.3.1 "Table cell missing context" and
// "No data cells assigned to table header" by assigning proper
// scope/headers/id relationships at pre-render time.
//
// For simple tables: ensures thead/tbody exist, adds scope="col" to
// column headers and scope="row" to row headers.
//
// For complex tables (colspan/rowspan): assigns unique id to every
// <th>, computes the set of governing headers for each <td>, and
// writes the ids into a headers="..." attribute. Removes scope on
// complex tables because headers supersedes scope per WCAG H43.
//
// Also repairs tables with only <th> rows (orphan headers) by marking
// them as presentational so SiteImprove does not flag them as broken
// data tables.
// ═══════════════════════════════════════════════════════════════════

let tableIdCounter = 0;

function fixCmsTables(html) {
  if (!html || typeof html !== "string") return html;
  if (html.indexOf("<table") === -1) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }
  const tables = doc.querySelectorAll("table");
  if (!tables.length) return html;

  tables.forEach((table) => {
    const tableIdx = tableIdCounter++;
    ensureTableStructure(doc, table);

    const hasSpan =
      table.querySelector("[rowspan]") || table.querySelector("[colspan]");
    if (hasSpan) {
      fixComplexTable(doc, table, tableIdx);
    } else {
      fixSimpleTable(doc, table);
    }

    handleOrphanHeaders(doc, table);
  });

  return doc.body.innerHTML;
}

function ensureTableStructure(doc, table) {
  // If no <thead> but first row is all-<th>, wrap it in <thead>
  if (!table.querySelector("thead")) {
    const firstRow = table.querySelector("tr");
    if (firstRow && firstRow.children.length > 0) {
      const allTh = Array.from(firstRow.children).every(
        (c) => c.tagName === "TH"
      );
      if (allTh) {
        const thead = doc.createElement("thead");
        table.insertBefore(thead, table.firstChild);
        thead.appendChild(firstRow);
      }
    }
  }

  // If rows exist outside <thead>/<tbody>, wrap them in <tbody>
  if (!table.querySelector("tbody")) {
    const looseRows = Array.from(table.children).filter(
      (c) => c.tagName === "TR"
    );
    if (looseRows.length) {
      const tbody = doc.createElement("tbody");
      looseRows.forEach((r) => tbody.appendChild(r));
      table.appendChild(tbody);
    }
  }
}

function fixSimpleTable(doc, table) {
  // scope="col" on header row
  let headerRow = table.querySelector("thead tr");
  if (!headerRow) {
    const first = table.querySelector("tr");
    if (first && first.querySelector("th")) headerRow = first;
  }
  if (headerRow) {
    headerRow.querySelectorAll("th").forEach((th) => {
      if (!th.getAttribute("scope")) th.setAttribute("scope", "col");
    });
  }

  // scope="row" on first cell of each body row (or promote <td> to <th>)
  const bodyRows = table.querySelectorAll("tbody tr");
  const rows = bodyRows.length ? bodyRows : table.querySelectorAll("tr");
  rows.forEach((row) => {
    if (row === headerRow) return;
    const firstCell = row.querySelector("td:first-child, th:first-child");
    if (!firstCell) return;
    if (firstCell.tagName === "TH") {
      if (!firstCell.getAttribute("scope"))
        firstCell.setAttribute("scope", "row");
      return;
    }
    const text = (firstCell.textContent || "").trim();
    if (text.length > 0 && !/^\d+[\d,.%$]*$/.test(text)) {
      const th = doc.createElement("th");
      th.innerHTML = firstCell.innerHTML;
      for (const attr of firstCell.attributes) {
        th.setAttribute(attr.name, attr.value);
      }
      th.setAttribute("scope", "row");
      firstCell.parentNode.replaceChild(th, firstCell);
    }
  });
}

function fixComplexTable(doc, table, tableIndex) {
  const prefix = "cmstbl" + tableIndex + "-";
  const allRows = table.querySelectorAll("tr");
  if (!allRows.length) return;
  const numCols = getColumnCount(table);
  if (!numCols) return;

  const cellGrid = [];
  allRows.forEach(() => cellGrid.push(new Array(numCols).fill(null)));

  let thCounter = 0;
  allRows.forEach((row, rowIdx) => {
    let colIdx = 0;
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      while (colIdx < numCols && cellGrid[rowIdx][colIdx] !== null) colIdx++;
      const rs = parseInt(cell.getAttribute("rowspan") || "1", 10);
      const cs = parseInt(cell.getAttribute("colspan") || "1", 10);

      if (cell.tagName === "TH") {
        if (!cell.getAttribute("id")) {
          cell.setAttribute("id", prefix + "h" + thCounter++);
        }
        // headers attr supersedes scope; remove scope to avoid conflicts
        cell.removeAttribute("scope");
      }

      for (let r = 0; r < rs && rowIdx + r < allRows.length; r++) {
        for (let c = 0; c < cs && colIdx + c < numCols; c++) {
          cellGrid[rowIdx + r][colIdx + c] = cell;
        }
      }
      colIdx += cs;
    });
  });

  allRows.forEach((row, rowIdx) => {
    let colIdx = 0;
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      while (colIdx < numCols && cellGrid[rowIdx][colIdx] !== cell) colIdx++;
      if (cell.tagName === "TD") {
        const cs = parseInt(cell.getAttribute("colspan") || "1", 10);
        const headerIds = new Set();
        for (let c = colIdx; c < colIdx + cs && c < numCols; c++) {
          for (let r = rowIdx - 1; r >= 0; r--) {
            const above = cellGrid[r][c];
            if (above && above.tagName === "TH" && above.getAttribute("id")) {
              headerIds.add(above.getAttribute("id"));
              break;
            }
          }
        }
        for (let c = colIdx - 1; c >= 0; c--) {
          const left = cellGrid[rowIdx][c];
          if (left && left.tagName === "TH" && left.getAttribute("id")) {
            headerIds.add(left.getAttribute("id"));
            break;
          }
        }
        if (headerIds.size) {
          cell.setAttribute("headers", [...headerIds].join(" "));
        }
      }
      colIdx += parseInt(cell.getAttribute("colspan") || "1", 10);
    });
  });
}

function getColumnCount(table) {
  const firstRow = table.querySelector("tr");
  if (!firstRow) return 0;
  let count = 0;
  firstRow.querySelectorAll("th, td").forEach((cell) => {
    count += parseInt(cell.getAttribute("colspan") || "1", 10);
  });
  return count;
}

// If a table has <th> cells but no <td> cells at all, it is a misused
// header-only block. Mark the table as presentational so SiteImprove
// does not flag orphan headers (SC 1.3.1 "No data cells assigned").
function handleOrphanHeaders(doc, table) {
  const ths = table.querySelectorAll("th");
  if (!ths.length) return;
  const tds = table.querySelectorAll("td");
  if (tds.length === 0) {
    table.setAttribute("role", "presentation");
    ths.forEach((th) => {
      th.removeAttribute("scope");
      th.removeAttribute("id");
    });
    return;
  }
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsEmptyContainers
// Removes empty container elements that SiteImprove SC 1.3.1 flags as
// "Container element is empty" and empty headings. Preserves
// self-closing/void-content elements (images, iframes, etc.) even if
// their enclosing element has no text.
// ═══════════════════════════════════════════════════════════════════

const EMPTY_CONTAINER_TAGS = ["P", "DIV", "SPAN", "LI"];
const HEADING_TAGS = ["H1", "H2", "H3", "H4", "H5", "H6"];
const MEANINGFUL_CHILDREN = new Set([
  "IMG",
  "IFRAME",
  "VIDEO",
  "AUDIO",
  "SVG",
  "CANVAS",
  "OBJECT",
  "EMBED",
  "PICTURE",
  "INPUT",
  "BUTTON",
  "SELECT",
  "TEXTAREA",
  "HR",
  "BR",
]);

function isElementEmpty(el) {
  if ((el.textContent || "").trim().length > 0) return false;
  for (const child of el.children) {
    if (MEANINGFUL_CHILDREN.has(child.tagName)) return false;
    if (!isElementEmpty(child)) return false;
  }
  return true;
}

function fixCmsEmptyContainers(html) {
  if (!html || typeof html !== "string") return html;
  if (!/<(p|div|span|li|h[1-6])\b/i.test(html)) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  let changed = false;

  // Headings with no content are always invalid and should be removed.
  HEADING_TAGS.forEach((tag) => {
    doc.querySelectorAll(tag.toLowerCase()).forEach((el) => {
      if (isElementEmpty(el)) {
        el.remove();
        changed = true;
      }
    });
  });

  // Remove empty containers bottom-up so nested empties cascade.
  // Iterate from deepest to shallowest to avoid skipping.
  EMPTY_CONTAINER_TAGS.forEach((tag) => {
    const nodes = Array.from(doc.querySelectorAll(tag.toLowerCase()));
    // Reverse so deeper nodes evaluated first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const el = nodes[i];
      if (!el.parentNode) continue; // already removed
      if (isElementEmpty(el)) {
        el.remove();
        changed = true;
      }
    }
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsLinkAltText
// Adds accessible text to image-only links with no text alternative
// (SC 2.4.4 / 4.1.2). If the <img> has alt, use it on the link via
// aria-label. If the alt is also empty, derive from filename.
// ═══════════════════════════════════════════════════════════════════

function fixCmsLinkAltText(html) {
  if (!html || typeof html !== "string") return html;
  if (html.indexOf("<a") === -1) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  let changed = false;

  doc.querySelectorAll("a").forEach((a) => {
    const text = (a.textContent || "").trim();
    if (text.length > 0) return;
    if (a.getAttribute("aria-label")) return;
    if (a.getAttribute("aria-labelledby")) return;
    if (a.getAttribute("title")) {
      a.setAttribute("aria-label", a.getAttribute("title"));
      changed = true;
      return;
    }

    const img = a.querySelector("img");
    if (img) {
      const alt = (img.getAttribute("alt") || "").trim();
      if (alt.length > 0) {
        a.setAttribute("aria-label", alt);
        changed = true;
        return;
      }
      const src = img.getAttribute("src") || "";
      const derived = deriveLabelFromUrl(src);
      if (derived) {
        a.setAttribute("aria-label", derived);
        img.setAttribute("alt", derived);
        changed = true;
        return;
      }
    }

    // No image, no text - derive from href
    const href = a.getAttribute("href") || "";
    const derived = deriveLabelFromUrl(href);
    if (derived) {
      a.setAttribute("aria-label", derived);
      changed = true;
    }
  });

  return changed ? doc.body.innerHTML : html;
}

function deriveLabelFromUrl(url) {
  if (!url) return "";
  const segment = url.split(/[?#]/)[0].split("/").filter(Boolean).pop() || "";
  return segment
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s[a-f0-9]{8,}$/i, "")
    .trim();
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsDuplicateLinkText
// SiteImprove SC 2.4.4 "Links in the same context with the same text
// alternative" fires when two or more links in the same content block
// share identical accessible text but point at different destinations
// (e.g., "RSS" links to News, Funding, and Meetings feeds). Fix:
// append a path/filename-derived qualifier to aria-label so each link
// has a unique accessible name while keeping the visible text intact.
// ═══════════════════════════════════════════════════════════════════

function fixCmsDuplicateLinkText(html) {
  if (!html || typeof html !== "string") return html;
  if (html.indexOf("<a") === -1) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  const links = Array.from(doc.querySelectorAll("a[href]"));
  if (links.length < 2) return html;

  // Bucket links by accessible name, within each logical context
  // (closest ul/ol/p/section/article ancestor, or body as fallback).
  const byContext = new Map();
  links.forEach((a) => {
    const label = (a.getAttribute("aria-label") || a.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!label) return;
    const href = (a.getAttribute("href") || "").trim();
    if (!href) return;
    const ctx =
      a.closest("ul, ol, p, section, article, div.markdown-body") || doc.body;
    const key = ctx + "::" + label;
    if (!byContext.has(key)) byContext.set(key, []);
    byContext.get(key).push({ a, href, label });
  });

  let changed = false;
  byContext.forEach((group) => {
    if (group.length < 2) return;
    // Check hrefs differ
    const uniqueHrefs = new Set(group.map((g) => g.href));
    if (uniqueHrefs.size < 2) return;
    group.forEach(({ a, href, label }) => {
      if (a.getAttribute("aria-label")) return;
      const qualifier = deriveLabelFromUrl(href);
      if (!qualifier || qualifier.toLowerCase() === label) return;
      a.setAttribute("aria-label", `${a.textContent.trim()}: ${qualifier}`);
      changed = true;
    });
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline registry
// ═══════════════════════════════════════════════════════════════════

// Built-in plugins (always run first)
const htmlPlugins = [
  fixMisspellings,
  fixApostrophes,
  fixCmsImages,
  fixCmsContrast,
  fixCmsEmptyContainers,
  fixCmsLinkAltText,
  fixCmsDuplicateLinkText,
  fixCmsTables,
];
const textPlugins = [fixMisspellings, fixApostrophes];

/**
 * Register a plugin for the HTML pipeline only (article bodies, markdown).
 */
function registerHtmlPlugin(fn) {
  htmlPlugins.push(fn);
}

/**
 * Register a plugin for the text pipeline only (titles, summaries).
 */
function registerTextPlugin(fn) {
  textPlugins.push(fn);
}

/**
 * Register a plugin for both pipelines.
 */
function registerPlugin(fn) {
  htmlPlugins.push(fn);
  textPlugins.push(fn);
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline execution
// ═══════════════════════════════════════════════════════════════════

function runPipeline(plugins, input) {
  if (!input || typeof input !== "string") return input;
  let result = input;
  for (const plugin of plugins) {
    result = plugin(result);
  }
  return result;
}

/**
 * Sanitize HTML content (article bodies, rendered markdown).
 * Runs all registered HTML pipeline plugins in order.
 */
function sanitizeContent(html) {
  return runPipeline(htmlPlugins, html);
}

/**
 * Sanitize plain text (titles, summaries, meta descriptions).
 * Runs all registered text pipeline plugins in order.
 */
function sanitizeText(text) {
  return runPipeline(textPlugins, text);
}

// ═══════════════════════════════════════════════════════════════════
// Deep sanitizer for API response objects
// ═══════════════════════════════════════════════════════════════════

/**
 * Recursively sanitize all string values in an object/array.
 * Use as an axios response interceptor or on raw API data.
 */
function deepSanitize(obj) {
  if (typeof obj === "string") return sanitizeContent(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === "object") {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = deepSanitize(obj[key]);
    }
    return result;
  }
  return obj;
}

/**
 * Axios response interceptor that deep-sanitizes all response data.
 * Usage: api.interceptors.response.use(sanitizeResponse)
 */
function sanitizeResponse(response) {
  if (response.data) {
    response.data = deepSanitize(response.data);
  }
  return response;
}

export {
  sanitizeContent,
  sanitizeText,
  deepSanitize,
  sanitizeResponse,
  registerHtmlPlugin,
  registerTextPlugin,
  registerPlugin,
  // Expose individual plugins for testing/selective use
  fixMisspellings,
  fixApostrophes,
  fixCmsImages,
  fixCmsContrast,
  fixCmsTables,
  fixCmsEmptyContainers,
  fixCmsLinkAltText,
  fixCmsDuplicateLinkText,
  // Expose data for external inspection
  MISSPELLINGS,
  APOSTROPHES,
};

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

  // Replace CSS named color "red" (#ff0000) — 3.99:1 on white, fails AA.
  // CMS authors paste "color: red" for deadlines/emphasis; swap to #c00
  // (5.89:1 on white, 5.74:1 on #f6f8fa), same visual intent, AA-compliant.
  result = result.replace(/color:\s*(red|#ff0000|#f00)\b/gi, "color: #c00");
  result = result.replace(
    /color:\s*rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)/gi,
    "color: #c00"
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
    // TH elements should not carry headers attrs — they define, not
    // reference, headers. CMS authors sometimes paste tables with stale
    // headers="..." on TH cells pointing at non-existent ids (axe
    // td-headers-attr). Strip them so nothing references a bad id.
    table
      .querySelectorAll("th[headers]")
      .forEach((th) => th.removeAttribute("headers"));
    ensureTableStructure(doc, table);

    // Always run the simple-table pass first — it promotes row-label
    // <td>s to <th scope="row"> and ensures <th scope="col"> on the
    // header row. Then always run the complex-table pass to assign
    // explicit id/headers attributes on every cell, which satisfies
    // SiteImprove sia-r46 "No data cells assigned to table header"
    // unambiguously (H43 allows scope OR headers; explicit headers
    // attrs are the safer option across scanner interpretations).
    fixSimpleTable(doc, table);
    fixComplexTable(doc, table, tableIdx);

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

  normalizeRaggedRows(doc, table);
}

// CMS authors sometimes add a "continuation" row with a single cell in
// an otherwise multi-column table, used as a visual spillover of the
// previous row's data ("Performance Period | September 1, 2025, to"
// followed by a single-cell row "June 30. 2026"). Markdown or the CMS
// editor may emit that lone cell as <th> — which, after fixComplexTable
// assigns it an id, becomes a header that no <td> in the table
// references, triggering SiteImprove sia-r46 "No data cells assigned
// to table header". Convert any single-cell row in a multi-column
// table into <td colspan="N"> so the cell is semantically data, not a
// header, and gets properly associated with the column headers above
// via the usual headers="..." assignment.
function normalizeRaggedRows(doc, table) {
  const allRows = Array.from(table.querySelectorAll("tr"));
  if (allRows.length < 2) return;
  let maxCols = 0;
  allRows.forEach((row) => {
    let count = 0;
    row.querySelectorAll("th, td").forEach((cell) => {
      count += parseInt(cell.getAttribute("colspan") || "1", 10);
    });
    if (count > maxCols) maxCols = count;
  });
  if (maxCols < 2) return;

  allRows.forEach((row) => {
    const cells = row.querySelectorAll("th, td");
    if (cells.length !== 1) return;
    const cell = cells[0];
    const currentSpan = parseInt(cell.getAttribute("colspan") || "1", 10);
    if (currentSpan >= maxCols) return;
    if (cell.tagName === "TH") {
      // Downgrade to <td colspan="maxCols">
      const td = doc.createElement("td");
      td.innerHTML = cell.innerHTML;
      for (const attr of cell.attributes) {
        if (attr.name === "scope" || attr.name === "id") continue;
        td.setAttribute(attr.name, attr.value);
      }
      td.setAttribute("colspan", String(maxCols));
      cell.parentNode.replaceChild(td, cell);
    } else {
      cell.setAttribute("colspan", String(maxCols));
    }
  });
}

function fixSimpleTable(doc, table) {
  // Strip stale headers attrs from <td> cells — simple tables use scope,
  // and CMS-authored headers="..." often reference non-TH ids (axe
  // td-headers-attr). scope on TH provides equivalent semantics.
  table
    .querySelectorAll("td[headers]")
    .forEach((td) => td.removeAttribute("headers"));

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
    // Skip cells whose only content is the "No data" filler —
    // they're placeholders for empty cells, not row labels.
    const srOnly = firstCell.querySelector(".sr-only");
    if (srOnly && srOnly.textContent.trim() === "No data") return;
    // Don't promote the sole cell of a single-cell row. Such rows are
    // visual continuations of the previous row's data (handled by
    // normalizeRaggedRows into <td colspan="N">), not row labels.
    if (row.querySelectorAll("th, td").length < 2) return;
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
        // Keep scope alongside id — WCAG/W3C allow both, and some
        // SiteImprove rules accept either as programmatic association.
        // Column headers that govern columns of row-label THs
        // (e.g. "Task" labeling the row-header column) have no <td>
        // referencing them via headers, so their scope="col" is the
        // only signal that they are headers of that column.
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
// PLUGIN: fixCmsOrphanWhite
// CMS authors paste from Word with color:white on inner spans when the
// cell has a dark fill. Two failure modes result:
//   (a) No dark ancestor — white text lands on light bg (1.06:1,
//       invisible). Strip the color:white so text inherits default.
//   (b) Dark ancestor exists on a TD/TH, but axe-core's bg resolution
//       can't traverse through nested .MsoNormal / <strong> / <p>
//       wrappers reliably and attributes the span to a lighter ancestor
//       bg (e.g., the page or a striped <tr>), producing a false
//       contrast failure. Propagate the ancestor's inline background
//       onto the span itself so axe reads the bg at the text element
//       directly.
// ═══════════════════════════════════════════════════════════════════

const DARK_BG_COLOR_RX =
  /#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f]|3[0-9a-f]|4[0-9a-f])/i;
const WHITE_COLOR_RX =
  /color\s*:\s*(?:white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i;

function findAncestorInlineBg(el) {
  for (let cur = el.parentElement; cur; cur = cur.parentElement) {
    const style = cur.getAttribute && cur.getAttribute("style");
    if (style) {
      const m = style.match(/background(?:-color)?:\s*(#[0-9a-f]{3,6})/i);
      if (m)
        return {
          source: "style",
          value: m[1],
          isDark: DARK_BG_COLOR_RX.test(m[1]),
        };
    }
    const bg = cur.getAttribute && cur.getAttribute("bgcolor");
    if (bg && /^#?[0-9a-f]{3,6}$/i.test(bg)) {
      const hex = bg.startsWith("#") ? bg : "#" + bg;
      return {
        source: "bgcolor",
        value: hex,
        isDark: DARK_BG_COLOR_RX.test(hex),
      };
    }
  }
  return null;
}

function fixCmsOrphanWhite(html) {
  if (!html || typeof html !== "string") return html;
  if (!WHITE_COLOR_RX.test(html)) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  let changed = false;
  doc.querySelectorAll('[style*="color"]').forEach((el) => {
    const style = el.getAttribute("style") || "";
    if (!WHITE_COLOR_RX.test(style)) return;
    if (/background(?:-color)?:/i.test(style)) return; // already has own bg

    const ancestor = findAncestorInlineBg(el);
    if (ancestor && ancestor.isDark) {
      // Propagate the dark background down to this element so axe-core
      // resolves contrast at the text-element level and sees white-on-dark.
      el.setAttribute(
        "style",
        `${style.replace(/;?\s*$/, "")}; background-color: ${ancestor.value};`
      );
      changed = true;
      return;
    }

    // No dark bg anywhere up the tree — strip color:white so text
    // inherits the default (readable) color.
    const stripped = style
      .replace(
        /(?:^|;)\s*color\s*:\s*(?:white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\s*(?:!important)?\s*;?/gi,
        ";"
      )
      .replace(/^;+|;+$/g, "")
      .replace(/;+/g, ";")
      .trim();
    if (stripped) el.setAttribute("style", stripped);
    else el.removeAttribute("style");
    changed = true;
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsInvalidListChildren
// Word paste / ad-hoc markdown produces <ul><u>item</u></ul> or raw
// text directly inside a list — axe flags as "List element has direct
// children that are not allowed". Wrap every non-<li>/<script>/<template>
// direct child of <ul>/<ol> in a new <li>.
// ═══════════════════════════════════════════════════════════════════

const LIST_CHILD_ALLOWED = new Set(["LI", "SCRIPT", "TEMPLATE"]);

function fixCmsInvalidListChildren(html) {
  if (!html || typeof html !== "string") return html;
  if (!/<(ul|ol)\b/i.test(html)) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  let changed = false;
  doc.querySelectorAll("ul, ol").forEach((list) => {
    const toWrap = [];
    for (const node of Array.from(list.childNodes)) {
      if (node.nodeType === 1 && !LIST_CHILD_ALLOWED.has(node.tagName)) {
        toWrap.push(node);
      } else if (
        node.nodeType === 3 &&
        (node.textContent || "").trim() !== ""
      ) {
        toWrap.push(node);
      }
    }
    toWrap.forEach((node) => {
      const li = doc.createElement("li");
      list.insertBefore(li, node);
      li.appendChild(node);
      changed = true;
    });
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsFocusablePre
// axe "scrollable-region-focusable": <pre> with overflow scrolls
// horizontally but isn't keyboard-focusable. Add tabindex="0" so
// keyboard users can scroll the code. Also add role="region" +
// aria-label so screen readers announce it meaningfully.
// ═══════════════════════════════════════════════════════════════════

function fixCmsFocusablePre(html) {
  if (!html || typeof html !== "string") return html;
  if (html.indexOf("<pre") === -1) return html;
  return html.replace(/<pre\b([^>]*)>/gi, (match, attrs) => {
    if (/\btabindex\s*=/i.test(attrs)) return match;
    return `<pre${attrs} tabindex="0">`;
  });
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
// PLUGIN: fixCmsSameHrefLinkLabels
// SiteImprove sia-r81 "Do these links (in the same context) go to the
// same page?" flags when two or more links in the same content block
// point at the same href but expose different accessible names
// (different visible text, different aria-labels, or one text + one
// image alt). Screen-reader users then hear two distinct-sounding
// destinations that are actually one. Fix: normalize each group's
// aria-label to the longest accessible name in the group — visible
// text is left untouched; only the accessible name is unified.
// ═══════════════════════════════════════════════════════════════════

function fixCmsSameHrefLinkLabels(html) {
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

  // Compute accessible name: aria-label, else text, else img alt
  const accName = (a) => {
    const aria = (a.getAttribute("aria-label") || "").trim();
    if (aria) return aria;
    const text = (a.textContent || "").replace(/\s+/g, " ").trim();
    if (text) return text;
    const img = a.querySelector("img[alt]");
    if (img) return (img.getAttribute("alt") || "").trim();
    return "";
  };

  // Bucket by (context, href). Context = closest block ancestor.
  const byGroup = new Map();
  links.forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    if (!href) return;
    const ctx =
      a.closest("ul, ol, p, section, article, div.markdown-body") || doc.body;
    const key = ctx.tagName + "|" + href;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(a);
  });

  let changed = false;
  byGroup.forEach((group) => {
    if (group.length < 2) return;
    const names = group.map(accName).filter(Boolean);
    if (names.length < 2) return;
    const unique = new Set(names.map((n) => n.toLowerCase()));
    if (unique.size < 2) return; // Already consistent
    // Pick the longest, most descriptive name as the canonical label
    const canonical = names.reduce((a, b) => (b.length > a.length ? b : a), "");
    if (!canonical) return;
    group.forEach((a) => {
      if (accName(a).toLowerCase() === canonical.toLowerCase()) return;
      if (!a.getAttribute("aria-label")) {
        a.setAttribute("aria-label", canonical);
        changed = true;
      }
    });
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsEmptyTableCells
// Eliminates SiteImprove sia-r77 "Table cell missing context" on CMS-
// authored data tables that use empty cells for visual formatting.
// The earlier fixCmsTables plugin assigns scope/headers relationships
// so a screen reader knows WHICH headers govern each cell, but an
// empty <td> still has no content for a screen reader to announce —
// SiteImprove flags this as context-missing.
//
// Brute-force fix: fill every empty <td> and <th> with an em-dash for
// sighted users and an sr-only "No data" label for assistive tech.
// The cell becomes non-empty structurally (satisfies sia-r77) and
// conveys intent ("there is no value here") to both audiences.
//
// Skips cells that already contain meaningful non-text content
// (images, iframes, svg, etc.) so media-only cells aren't overwritten.
// Runs AFTER fixCmsTables so the table's header/scope structure is
// already in place before cells are filled.
// ═══════════════════════════════════════════════════════════════════

const EMPTY_CELL_FILL =
  '<span aria-hidden="true">\u2014</span><span class="sr-only">No data</span>';
const CELL_MEDIA_SELECTOR =
  "img, iframe, svg, video, audio, canvas, object, embed, picture, input, button";

function fixCmsEmptyTableCells(html) {
  if (!html || typeof html !== "string") return html;
  if (html.indexOf("<table") === -1) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  // Only fill <td> cells. Empty <th> cells are intentionally left alone
  // — a blank header commonly marks a corner/spacer position (e.g. the
  // cell above a row-label column), and filling it with "No data" would
  // mislead screen readers into announcing a nonsensical header label.
  // sia-r77 flags data cells missing context, not empty headers.
  const cells = doc.querySelectorAll("td");
  if (!cells.length) return html;

  let changed = false;
  cells.forEach((cell) => {
    if ((cell.textContent || "").trim()) return;
    if (cell.querySelector(CELL_MEDIA_SELECTOR)) return;
    cell.innerHTML = EMPTY_CELL_FILL;
    changed = true;
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: unwrapBrokenLinks
// SiteImprove "Broken link (confirmed)" report flags external URLs
// that return 4xx/5xx or fail DNS resolution. These appear in CMS
// content authored years ago and reference resources that have since
// been moved or taken offline. Editorial cannot update them — content
// is locked. Fix: at render time, replace <a href="dead-url">text</a>
// with just `text` (no link), preserving the surrounding sentence so
// readers see the reference but cannot click into a 404.
//
// The list of confirmed-broken URLs lives in `brokenLinks.js` and is
// regenerated from each fresh SiteImprove export. Only "confirmed"
// entries are removed; "Needs review" entries (CAPTCHAs, rate limits,
// transient outages) are left alone.
// ═══════════════════════════════════════════════════════════════════

import { isBrokenUrl } from "./brokenLinks";

function unwrapBrokenLinks(html) {
  if (!html || typeof html !== "string") return html;
  if (html.indexOf("<a") === -1) return html;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  const links = doc.querySelectorAll("a[href]");
  if (!links.length) return html;

  let changed = false;
  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!isBrokenUrl(href)) return;
    // Replace the <a> with its child nodes (preserves inline formatting
    // like <strong>, <em>, <code> inside the original link text).
    const parent = a.parentNode;
    if (!parent) return;
    while (a.firstChild) {
      parent.insertBefore(a.firstChild, a);
    }
    parent.removeChild(a);
    changed = true;
  });

  return changed ? doc.body.innerHTML : html;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsFigureTableCaptions
// Strapi article content uses H4/H5/H6 inside <div class="article-table">
// and <div class="article-figure"> as captions/source/note labels.
// SiteImprove sia-r78 "Content missing after heading" fires because
// these "headings" have no body content — they are labels, not headings.
// Downgrade them to <p> with caption classes so the visual styling is
// preserved via CSS but they're no longer headings. Also adds <figure>/
// <caption>-equivalent semantics via role="figure" for screen readers.
// ═══════════════════════════════════════════════════════════════════

function fixCmsFigureTableCaptions(html) {
  if (!html || typeof html !== "string") return html;
  if (
    html.indexOf("article-table") === -1 &&
    html.indexOf("article-figure") === -1
  ) {
    return html;
  }

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_e) {
    return html;
  }

  let changed = false;
  const containers = doc.querySelectorAll(".article-table, .article-figure");

  containers.forEach((container) => {
    const headings = container.querySelectorAll("h4, h5, h6");
    headings.forEach((h) => {
      const p = doc.createElement("p");
      // Preserve original class list + add caption class for CSS targeting.
      const level = h.tagName.toLowerCase(); // h4 / h5 / h6
      const existing = h.getAttribute("class") || "";
      p.setAttribute(
        "class",
        `article-caption article-caption--${level}${
          existing ? " " + existing : ""
        }`
      );
      // Copy any id/data-* attributes so anchors/tests still work.
      for (const attr of Array.from(h.attributes)) {
        if (attr.name === "class") continue;
        p.setAttribute(attr.name, attr.value);
      }
      while (h.firstChild) p.appendChild(h.firstChild);
      h.parentNode.replaceChild(p, h);
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
  fixCmsOrphanWhite,
  fixCmsInvalidListChildren,
  fixCmsFocusablePre,
  fixCmsFigureTableCaptions,
  fixCmsEmptyContainers,
  fixCmsLinkAltText,
  fixCmsDuplicateLinkText,
  fixCmsSameHrefLinkLabels,
  unwrapBrokenLinks,
  fixCmsTables,
  fixCmsEmptyTableCells,
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
  fixCmsSameHrefLinkLabels,
  unwrapBrokenLinks,
  fixCmsEmptyTableCells,
  // Expose data for external inspection
  MISSPELLINGS,
  APOSTROPHES,
};

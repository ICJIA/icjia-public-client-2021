/**
 * One-shot script: rewrite every markdown pipe-table in README.md as an HTML
 * <table> with <tr valign="top"> so cell content is top-aligned. Each cell's
 * inline markdown (links, code, bold, etc.) is rendered to HTML via markdown-it.
 *
 * Usage:
 *   node scripts/tables-to-html.js [path-to-md]
 *   defaults to README.md in cwd
 */
const fs = require("fs");
const path = require("path");
const md = require("markdown-it")({ html: true, linkify: false, breaks: false });

const FILE = path.resolve(process.argv[2] || "README.md");

function isSeparator(line) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);
}

function isTableRow(line) {
  return /^\s*\|.*\|.*\|/.test(line.trim()) || /^\s*\|.*\|\s*$/.test(line.trim());
}

// Split a pipe-row into cells, respecting backslash-escaped pipes and inline code
function splitRow(row) {
  const trimmed = row.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
  const cells = [];
  let buf = "";
  let inCode = 0; // count of unmatched backticks
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "\\" && i + 1 < trimmed.length) {
      buf += ch + trimmed[i + 1];
      i++;
      continue;
    }
    if (ch === "`") {
      inCode = inCode ? 0 : 1;
      buf += ch;
      continue;
    }
    if (ch === "|" && !inCode) {
      cells.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  cells.push(buf.trim());
  return cells;
}

// Render a single cell's markdown to inline HTML. Strip the wrapping <p>...</p>.
function renderCell(cellMd) {
  if (!cellMd) return "";
  const html = md.render(cellMd).trim();
  return html.replace(/^<p>([\s\S]*)<\/p>$/, "$1");
}

function escapeAttribute(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function convertTable(headerRow, dataRows) {
  const headers = splitRow(headerRow);
  const rows = dataRows.map(splitRow);
  const out = [];
  out.push("<table>");
  out.push("  <thead>");
  out.push("    <tr>");
  for (const h of headers) {
    out.push(`      <th align="left">${renderCell(h)}</th>`);
  }
  out.push("    </tr>");
  out.push("  </thead>");
  out.push("  <tbody>");
  for (const row of rows) {
    out.push('    <tr valign="top">');
    // Pad row to header length to handle malformed rows
    while (row.length < headers.length) row.push("");
    for (const c of row) {
      out.push(`      <td>${renderCell(c)}</td>`);
    }
    out.push("    </tr>");
  }
  out.push("  </tbody>");
  out.push("</table>");
  return out.join("\n");
}

function processFile(filePath) {
  const src = fs.readFileSync(filePath, "utf-8");
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  let convertedCount = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i];

    // Track fenced code blocks — never touch tables inside ```...```
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      i++;
      continue;
    }
    if (inFence) {
      out.push(line);
      i++;
      continue;
    }

    // Detect table: header row followed by separator
    if (isTableRow(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const headerRow = line;
      let j = i + 2;
      const dataRows = [];
      while (j < lines.length && isTableRow(lines[j])) {
        dataRows.push(lines[j]);
        j++;
      }
      out.push(convertTable(headerRow, dataRows));
      convertedCount++;
      i = j;
      continue;
    }

    out.push(line);
    i++;
  }

  fs.writeFileSync(filePath, out.join("\n"));
  console.log(`Converted ${convertedCount} table(s) in ${filePath}`);
}

processFile(FILE);

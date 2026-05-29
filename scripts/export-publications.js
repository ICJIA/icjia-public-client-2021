#!/usr/bin/env node
/* eslint-disable no-console */
// =============================================================================
// export-publications.js
//
// Exports ALL ICJIA publications to a spreadsheet (.xlsx + .csv) for
// accessibility analysis. One row per publication, sorted most-recent-first.
//
// - Fetches every publication via the public Strapi REST collection endpoint,
//   paginated with _limit/_start (sidesteps the GraphQL row-count ceiling).
// - Builds the absolute on-site detail-page URL from each slug.
// - Normalizes each hosted file URL to an absolute, case-corrected link.
// - Issues a HEAD request per file for size + HTTP status (link-health check).
// - Writes a formatted, hyperlinked .xlsx and a plain .csv to scripts/output/.
//
// No authentication required — all data is public.
//
// Run:  npm run export:publications
//   or: node scripts/export-publications.js [--no-head] [--limit=500]
// =============================================================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const _ = require("lodash");
const ExcelJS = require("exceljs");
const { createApiClient } = require("../generators/apiClient");
const {
  API_BASE,
  buildPageUrl,
  normalizeFileUrl,
  parseFileType,
  formatBytes,
  csvEscape,
} = require("./lib/publications-export-helpers");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PAGE_SIZE = 500; // REST page size for fetching publications
const HEAD_CONCURRENCY = 15; // simultaneous HEAD requests during enrichment
const HEAD_TIMEOUT_MS = 20000; // per-file HEAD timeout
const OUTPUT_DIR = path.join(__dirname, "output");

const args = process.argv.slice(2);
const SKIP_HEAD = args.includes("--no-head");
const limitArg = args.find((a) => a.startsWith("--limit="));
const pageSize = limitArg ? parseInt(limitArg.split("=")[1], 10) : PAGE_SIZE;

const api = createApiClient(API_BASE);

// Column definitions — order here IS the spreadsheet column order.
// Publication Date leads; sheet is sorted by it, most-recent-first.
const COLUMNS = [
  { header: "Publication Date", key: "publicationDate", width: 16 },
  { header: "Title", key: "title", width: 60 },
  { header: "Type", key: "pubType", width: 18 },
  { header: "Page URL", key: "pageUrl", width: 60, link: true },
  { header: "File URL", key: "fileUrl", width: 60, link: true },
  { header: "Web Article URL", key: "articleURL", width: 60, link: true },
  { header: "File Type", key: "fileType", width: 10 },
  { header: "File Size", key: "fileSize", width: 12 },
  { header: "File Size (bytes)", key: "fileSizeBytes", width: 16 },
  { header: "File Status", key: "fileStatus", width: 12 },
  { header: "Has Hosted File", key: "hasFile", width: 14 },
  // Dataset URL, Application URL, and Slug are intentionally NOT emitted for
  // now (see toRow — still fetched and kept on the row object so they can be
  // re-added as columns later by listing them here again).
];

// ---------------------------------------------------------------------------
// Fetch all publications via paginated REST.
// ---------------------------------------------------------------------------
async function fetchAllPublications() {
  const countRes = await api.getWithRetry(`${API_BASE}/publications/count`);
  const total = Number(countRes.data);
  console.log(`Publications reported by API: ${total}`);

  const iterations = Math.ceil(total / pageSize);
  let records = [];
  for (let i = 0; i < iterations; i++) {
    const start = i * pageSize;
    const url = `${API_BASE}/publications?_limit=${pageSize}&_start=${start}&_sort=published_at:desc`;
    const res = await api.getWithRetry(url);
    records = records.concat(res.data);
    console.log(`  fetched ${Math.min(start + pageSize, total)}/${total} ...`);
  }

  records = _.uniqBy(records, "id");
  console.log(`Unique publications after de-dupe: ${records.length}`);
  return records;
}

// ---------------------------------------------------------------------------
// Transform a raw API record into a spreadsheet row (pre-enrichment).
// ---------------------------------------------------------------------------
function toRow(p) {
  const fileUrl = normalizeFileUrl(p.fileURL);
  return {
    publicationDate: (p.publicationDate || p.published_at || "").slice(0, 10),
    title: p.title || "",
    pubType: p.pubType || "",
    pageUrl: buildPageUrl(p.slug),
    fileUrl,
    fileType: parseFileType(fileUrl),
    fileSize: "",
    fileSizeBytes: "",
    fileStatus: "",
    hasFile: fileUrl ? "yes" : "no",
    articleURL: p.articleURL || "",
    datasetURL: p.datasetURL || "",
    applicationURL: p.applicationURL || "",
    slug: p.slug || "",
  };
}

// ---------------------------------------------------------------------------
// HEAD one file URL: capture HTTP status + Content-Length. Never throws.
// ---------------------------------------------------------------------------
async function headFile(url) {
  const attempt = async () => {
    const res = await axios.head(url, {
      timeout: HEAD_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: () => true, // capture 404 etc. instead of throwing
    });
    const len = res.headers["content-length"];
    return {
      status: res.status,
      bytes: len !== undefined ? Number(len) : null,
    };
  };
  try {
    return await attempt();
  } catch (e1) {
    // one retry on network/timeout error
    try {
      return await attempt();
    } catch (e2) {
      return { status: "error", bytes: null };
    }
  }
}

// ---------------------------------------------------------------------------
// Enrich rows with file metadata using a bounded concurrency pool.
// ---------------------------------------------------------------------------
async function enrichRows(rows) {
  const targets = rows.filter((r) => r.fileUrl);
  console.log(
    `HEAD-checking ${targets.length} hosted files (concurrency ${HEAD_CONCURRENCY}) ...`
  );
  let done = 0;
  let index = 0;

  async function worker() {
    while (index < targets.length) {
      const row = targets[index++];
      const meta = await headFile(row.fileUrl);
      row.fileStatus = meta.status;
      if (meta.bytes !== null && Number.isFinite(meta.bytes)) {
        row.fileSizeBytes = meta.bytes;
        row.fileSize = formatBytes(meta.bytes);
      }
      done++;
      if (done % 100 === 0 || done === targets.length) {
        console.log(`  HEAD ${done}/${targets.length} ...`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(HEAD_CONCURRENCY, targets.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Write the .xlsx workbook (formatted, hyperlinked).
// ---------------------------------------------------------------------------
async function writeXlsx(rows, filePath) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ICJIA export-publications.js";
  wb.created = new Date();
  const ws = wb.addWorksheet("Publications");
  ws.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  rows.forEach((r) => {
    const added = ws.addRow(r);
    // Render URL columns as real clickable hyperlinks.
    COLUMNS.forEach((c) => {
      if (c.link && r[c.key]) {
        const cell = added.getCell(c.key);
        cell.value = { text: r[c.key], hyperlink: r[c.key] };
        cell.font = { color: { argb: "FF0563C1" }, underline: true };
      }
    });
  });

  // Header styling, freeze, and autofilter.
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  };

  await wb.xlsx.writeFile(filePath);
}

// ---------------------------------------------------------------------------
// Write the .csv companion (plain absolute URLs).
// ---------------------------------------------------------------------------
function writeCsv(rows, filePath) {
  const head = COLUMNS.map((c) => csvEscape(c.header)).join(",");
  const lines = rows.map((r) =>
    COLUMNS.map((c) => csvEscape(r[c.key])).join(",")
  );
  fs.writeFileSync(filePath, [head, ...lines].join("\n") + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// Remove every previously generated report so /output holds exactly one set —
// the dated report this run is about to write. Matches publications-*.{xlsx,csv}
// (any date, plus legacy publications-latest.* if present).
// ---------------------------------------------------------------------------
function clearOldReports(dir) {
  const removed = fs
    .readdirSync(dir)
    .filter((name) => /^publications-.*\.(xlsx|csv)$/.test(name));
  removed.forEach((name) => fs.unlinkSync(path.join(dir, name)));
  if (removed.length) {
    console.log(`Cleared ${removed.length} previous report file(s).`);
  }
}

// ---------------------------------------------------------------------------
// Summary line for the operator.
// ---------------------------------------------------------------------------
function printSummary(rows) {
  const withFile = rows.filter((r) => r.fileUrl);
  const without = rows.length - withFile.length;
  const dead = withFile.filter(
    (r) => r.fileStatus === "error" || Number(r.fileStatus) >= 400
  );
  const byType = _.countBy(withFile, "fileType");

  console.log("\n========== SUMMARY ==========");
  console.log(`Total publications : ${rows.length}`);
  console.log(`With hosted file   : ${withFile.length}`);
  console.log(`Without hosted file: ${without}`);
  if (!SKIP_HEAD) {
    console.log(`Dead/broken links  : ${dead.length}`);
  }
  console.log(
    `File types         : ${Object.entries(byType)
      .map(([k, v]) => `${k || "(none)"}=${v}`)
      .join(", ")}`
  );
  if (!SKIP_HEAD && dead.length) {
    console.log("\nBroken file links:");
    dead
      .slice(0, 25)
      .forEach((r) => console.log(`  [${r.fileStatus}] ${r.fileUrl}`));
    if (dead.length > 25) console.log(`  ... and ${dead.length - 25} more`);
  }
  console.log("=============================\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const startedAt = Date.now();
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const records = await fetchAllPublications();
  let rows = records.map(toRow);
  rows = _.orderBy(rows, ["publicationDate"], ["desc"]);

  if (!SKIP_HEAD) {
    await enrichRows(rows);
  } else {
    console.log("Skipping HEAD enrichment (--no-head).");
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const xlsxPath = path.join(OUTPUT_DIR, `publications-${stamp}.xlsx`);
  const csvPath = path.join(OUTPUT_DIR, `publications-${stamp}.csv`);

  // Only ever keep one report set: clear old reports, then write today's.
  // Done after the data is gathered so a failed fetch never wipes a good report.
  clearOldReports(OUTPUT_DIR);
  await writeXlsx(rows, xlsxPath);
  writeCsv(rows, csvPath);

  printSummary(rows);
  console.log(`Wrote: ${path.relative(process.cwd(), xlsxPath)}`);
  console.log(`Wrote: ${path.relative(process.cwd(), csvPath)}`);
  console.log(`Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`);
}

main().catch((err) => {
  console.error("\nExport failed:", err.message);
  process.exit(1);
});

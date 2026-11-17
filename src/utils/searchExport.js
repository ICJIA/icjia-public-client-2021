// =============================================================================
// Search results as a spreadsheet (v1.5.144)
//
// The search page's "Download results" buttons write the results on the page
// (the chosen filter, in the order shown, similar results included and marked)
// as an Excel workbook, a CSV file or a JSON file. One row per result; the columns are
// COLUMNS below. The workbook adds a second sheet, "About this search": the
// query, the filter, the order and when the file was made.
//
// exceljs is loaded only when the Excel button is pressed (its browser build,
// a chunk of its own), so the search page does not carry it.
// =============================================================================
import config from "@/config/config.json";
import { resultDate } from "@/utils/search";
import { isPastLastDay, isMeetingOver } from "@/utils/ended";

const SITE = "https://icjia.illinois.gov";

// "2026-09-21" from a date or a timestamp, or "" without one.
function day(value) {
  if (!value) return "";
  const time = typeof value === "number" ? value : Date.parse(value);
  return Number.isNaN(time) ? "" : new Date(time).toISOString().slice(0, 10);
}

// A timestamp with its time, in Chicago: "2026-09-08 1:00 PM". A date alone
// ("2026-09-25", funding and jobs) is left as it is.
function dateTime(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(time));
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.dayPeriod}`;
}

// The full web address: the site's own paths are made absolute.
export function absoluteUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return SITE + (path.startsWith("/") ? path : `/${path}`);
}

// Line breaks and runs of spaces in the CMS's text, made single spaces.
function clean(text) {
  return typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
}

function list(values) {
  return names(values).join("; ");
}

function names(values) {
  return (values || [])
    .map((value) =>
      clean(typeof value === "string" ? value : value && value.title)
    )
    .filter(Boolean);
}

function tags(item) {
  return item.tags && item.tags.length ? item.tags : item.tagsAlt;
}

const TYPE_LABELS = {
  article: "Research Hub article",
  "web application": "Research Hub web app",
  dataset: "Research Hub dataset",
  publication: "Publication",
  news: "News",
  meeting: "Meeting",
  funding: "Funding opportunity",
  employment: "Job listing",
  program: "Grant program",
  biography: "Biography",
  page: "Page",
  unit: "ICJIA unit",
  event: "Event",
  "partner site": "Partner site",
  plan: "Plan",
};

function typeLabel(type) {
  if (!type) return "";
  return TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function mapped(map, category) {
  const found = (map || []).find((entry) => entry.category === category);
  return found ? found.label : category;
}

// The category the result card names (news and meetings by their labels), or
// a Hub item's categories.
function category(item) {
  if (item.contentType === "news")
    return mapped(config.maps.news, item.category);
  if (item.contentType === "meeting")
    return mapped(config.maps.meetings, item.category);
  if (Array.isArray(item.categories)) return list(item.categories);
  return clean(item.category);
}

// Open or closed, for what has a closing day; a meeting's or a program's own
// status otherwise.
function status(item, now) {
  if (item.contentType === "meeting") {
    if (item.isCancelled) return "Cancelled";
    return isMeetingOver(item, now) ? "Ended" : "Upcoming";
  }
  if (item.contentType === "funding" || item.contentType === "employment") {
    if (!item.end) return "";
    return isPastLastDay(item.end, now) ? "Closed" : "Open";
  }
  return item.status ? clean(item.status) : "";
}

// The links a result has besides its own page: a publication's file, its Hub
// article, its web app or dataset; a Hub app's or unit's own address.
function otherLinks(item) {
  return {
    file: absoluteUrl(item.fileURL),
    article: item.articleURL ? absoluteUrl(item.articleURL) : "",
    app: absoluteUrl(item.applicationURL || item.url || ""),
    dataset: absoluteUrl(item.datasetURL || ""),
  };
}

// The columns, in order: a heading, a width in the workbook, and the value.
// A column whose `link` is set is a web address (a hyperlink in Excel).
export const COLUMNS = [
  { header: "Rank", width: 7, value: (r) => r.rank },
  // The search the result was found for (v1.5.146): the words as typed, and
  // for a similar result, that it matched a similar spelling or part of a
  // longer word. It was "Match": "Contains search words".
  {
    header: "Query",
    width: 30,
    value: (r) =>
      r.result.similar
        ? `${r.query} (similar spelling or partial match)`
        : r.query,
  },
  { header: "Title", width: 60, value: (r) => clean(r.item.title) },
  { header: "Type", width: 22, value: (r) => typeLabel(r.item.contentType) },
  { header: "Category", width: 24, value: (r) => category(r.item) },
  {
    header: "URL",
    width: 60,
    link: true,
    value: (r) => absoluteUrl(r.item.fullPath),
  },
  { header: "Date", width: 12, value: (r) => day(resultDate(r.item)) },
  { header: "Start", width: 20, value: (r) => dateTime(r.item.start) },
  { header: "End", width: 20, value: (r) => dateTime(r.item.end) },
  { header: "Status", width: 12, value: (r) => status(r.item, r.now) },
  {
    header: "Authors",
    width: 30,
    value: (r) => list(r.item.authors),
    json: (r) => names(r.item.authors),
  },
  {
    header: "Tags",
    width: 40,
    value: (r) => list(tags(r.item)),
    json: (r) => names(tags(r.item)),
  },
  {
    header: "Summary",
    width: 80,
    wrap: true,
    value: (r) => clean(r.item.summary),
  },
  { header: "PDF or file", width: 50, link: true, value: (r) => r.links.file },
  {
    header: "Research Hub article",
    width: 50,
    link: true,
    value: (r) => r.links.article,
  },
  { header: "Web app", width: 40, link: true, value: (r) => r.links.app },
  { header: "Dataset", width: 40, link: true, value: (r) => r.links.dataset },
  {
    header: "Publication type",
    width: 16,
    value: (r) => clean(r.item.pubType),
  },
  { header: "Position", width: 30, value: (r) => clean(r.item.position) },
  {
    header: "Unit",
    width: 30,
    value: (r) => clean(r.item.unit && r.item.unit.title),
  },
  {
    header: "First published",
    width: 14,
    value: (r) => day(r.item.published_at),
  },
  { header: "Last updated", width: 14, value: (r) => day(r.item.updated_at) },
];

/**
 * The rows of the spreadsheet: one array of values per result, in COLUMNS'
 * order.
 *
 * @param {Array} results  Search results ({ item, similar }), in page order.
 * @param {Date} [now]  For Open/Closed and Upcoming/Ended.
 * @param {string} [query]  The search, for the Query column.
 * @returns {Array<Array<string|number>>}
 */
function contexts(results, now, query) {
  return (results || [])
    .filter((result) => result && result.item)
    .map((result, index) => ({
      rank: index + 1,
      result,
      item: result.item,
      links: otherLinks(result.item),
      now,
      query: (query || "").trim(),
    }));
}

export function exportRows(results, now = new Date(), query = "") {
  return contexts(results, now, query).map((row) =>
    COLUMNS.map((column) => column.value(row))
  );
}

// "First published" → "firstPublished", "PDF or file" → "pdfOrFile".
export function jsonKey(header) {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-z0-9]/gi, "");
}

/**
 * The results as JSON text: { search: { ...about }, results: [ {...} ] }, one
 * object per result with a key per column (authors and tags as lists).
 * `about` is the [label, value] pairs of the workbook's second sheet.
 */
export function toJson(results, about, now = new Date(), query = "") {
  const search = {};
  (about || []).forEach(([label, value]) => {
    search[jsonKey(label)] = value;
  });
  const rows = contexts(results, now, query).map((row) => {
    const out = {};
    COLUMNS.forEach((column) => {
      out[jsonKey(column.header)] = (column.json || column.value)(row);
    });
    return out;
  });
  return JSON.stringify({ search, results: rows }, null, 2) + "\n";
}

// A value that a spreadsheet would read as a formula (= + - @, or a tab or
// return first) gets an apostrophe in front, so that opening the CSV never
// runs one (CSV injection). Numbers are left alone.
function safe(value) {
  if (typeof value !== "string") return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value) {
  const text = String(safe(value) === undefined ? "" : safe(value));
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The results as CSV text: a header row, then a row per result; CRLF line
 * ends, and a byte-order mark so that Excel reads the text as UTF-8 (curly
 * quotes, accents).
 */
export function toCsv(results, now = new Date(), query = "") {
  const lines = [COLUMNS.map((column) => column.header)]
    .concat(exportRows(results, now, query))
    .map((row) => row.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * The file name: icjia-search-<query>-<filter>-<YYYY-MM-DD>.<ext>.
 */
export function exportFileName(query, filter, ext, now = new Date()) {
  const slug = (text) =>
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  const parts = ["icjia-search", slug(query) || "results"];
  if (filter) parts.push(slug(filter));
  parts.push(day(now.getTime()));
  return `${parts.join("-")}.${ext}`;
}

/**
 * The results as an Excel workbook (an ArrayBuffer): a "Results" sheet with a
 * bold, frozen header row, filters on every column, and web addresses as
 * links; and an "About this search" sheet from `about` ([label, value] pairs).
 */
export async function toXlsx(results, about, now = new Date(), query = "") {
  const module = await import(
    /* webpackChunkName: "exceljs" */ "exceljs/dist/exceljs.min.js"
  );
  const ExcelJS = module.default || module;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Illinois Criminal Justice Information Authority";
  workbook.created = now;

  const sheet = workbook.addWorksheet("Results", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map((column) => ({
    header: column.header,
    width: column.width,
  }));
  sheet.getRow(1).font = { bold: true };
  exportRows(results, now, query).forEach((values) => {
    const row = sheet.addRow(values);
    COLUMNS.forEach((column, i) => {
      const cell = row.getCell(i + 1);
      if (column.link && values[i]) {
        cell.value = { text: values[i], hyperlink: values[i] };
        cell.font = { color: { argb: "FF0D47A1" }, underline: true };
      }
      if (column.wrap) cell.alignment = { wrapText: true, vertical: "top" };
    });
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  };

  const info = workbook.addWorksheet("About this search");
  info.columns = [{ width: 24 }, { width: 90 }];
  (about || []).forEach(([label, value]) => {
    const row = info.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  });

  return workbook.xlsx.writeBuffer();
}

/**
 * The Plausible event for a download (v1.5.145): "Search Download", with the
 * format, the search words (lowercased, as the Search event has them), the
 * filter chip and the number of results in the file, as text (Plausible shows
 * a property's values as text).
 *
 * @param {string} format   "xlsx", "csv" or "json".
 * @param {string} query    The search the results are for.
 * @param {string|null} filter  The chip's value ("publication"), or null.
 * @param {number} count    The results in the file.
 * @returns {{name: string, props: object}}
 */
export function downloadEvent(format, query, filter, count) {
  return {
    name: "Search Download",
    props: {
      format,
      query: (query || "").trim().toLowerCase(),
      filter: filter || "none",
      results: String(count),
    },
  };
}

/**
 * Hands the visitor a file: a Blob, a link with `download`, a click.
 */
export function saveFile(data, fileName, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

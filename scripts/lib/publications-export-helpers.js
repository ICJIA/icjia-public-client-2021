// =============================================================================
// Pure helpers for scripts/export-publications.js
//
// No network, no filesystem, no DOM — just string/number transforms, so they
// are unit-testable in isolation (see tests/unit/publications-export-helpers.spec.js).
// =============================================================================

// Base URLs, mirrored from src/config/config.json (api.base / api.baseClient).
const CLIENT_BASE = "https://icjia.illinois.gov";
const API_BASE = "https://agency.icjia-api.cloud";

// Ad-hoc fileURL case corrections, mirrored from
// src/views/About/PublicationsSingle.vue:90-103 so every link resolves.
const FILE_URL_CASE_FIXES = [
  ["/Compiler/", "/compiler/"],
  ["/OGA/", "/oga/"],
  ["/researchreports/", "/ResearchReports/"],
];

/**
 * Build the absolute on-site detail page URL for a publication slug.
 * The /about/publications/ prefix is hardcoded in src/router/about/index.js.
 * @param {string} slug
 * @param {string} [clientBase]
 * @returns {string} absolute URL with trailing slash, or "" if no slug
 */
function buildPageUrl(slug, clientBase = CLIENT_BASE) {
  if (!slug) return "";
  return `${clientBase}/about/publications/${slug}/`;
}

/**
 * Return an absolute, case-corrected file URL.
 * - empty/null -> ""
 * - applies the same case fixes the live site applies
 * - absolute (http...) URLs pass through; relative (/...) get the API base
 * - existing URL-encoding is preserved
 * @param {string} fileURL
 * @param {string} [apiBase]
 * @returns {string}
 */
function normalizeFileUrl(fileURL, apiBase = API_BASE) {
  if (!fileURL) return "";
  let url = fileURL;
  for (const [from, to] of FILE_URL_CASE_FIXES) {
    url = url.split(from).join(to);
  }
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${apiBase}${url}`;
  return url;
}

/**
 * Extract the uppercased file extension from a URL (e.g. "PDF").
 * Strips query/hash, looks only at the last path segment.
 * @param {string} url
 * @returns {string} extension without dot, uppercased, or ""
 */
function parseFileType(url) {
  if (!url) return "";
  // Drop query string and hash fragment.
  const clean = url.split("?")[0].split("#")[0];
  // Last path segment only.
  const segment = clean.split("/").pop() || "";
  const dot = segment.lastIndexOf(".");
  if (dot === -1 || dot === segment.length - 1) return "";
  return segment.slice(dot + 1).toUpperCase();
}

/**
 * Human-readable byte size, base 1024 (e.g. "2.5 MB").
 * Bytes under 1 KB are shown as an integer count; KB and up use one decimal.
 * @param {number|string} bytes
 * @returns {string} formatted size, or "" if not a finite number
 */
function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === "") return "";
  const n = Number(bytes);
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = n;
  let i = -1;
  do {
    value /= 1024;
    i++;
  } while (value >= 1024 && i < units.length - 1);
  return `${value.toFixed(1)} ${units[i]}`;
}

/**
 * Escape a value for a CSV field (RFC 4180 style).
 * Wraps in double quotes when the value contains a comma, quote, or newline,
 * doubling any embedded quotes. null/undefined become "".
 * @param {*} value
 * @returns {string}
 */
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.split('"').join('""')}"`;
  }
  return str;
}

module.exports = {
  CLIENT_BASE,
  API_BASE,
  buildPageUrl,
  normalizeFileUrl,
  parseFileType,
  formatBytes,
  csvEscape,
};

/**
 * Purify staff names from CMS searchMeta fields at build time.
 *
 * Why this exists:
 *   CMS editors add staff names (grant managers, unit directors) to
 *   `searchMeta` fields so pages surface when users search for those
 *   names. This leaks an internal personnel roster in the static JSON
 *   API files — useful for spear phishing.
 *
 * What this does:
 *   Reads the full staff roster from biographies.json and strips any
 *   first-name / last-name / full-name occurrences from searchMeta
 *   values in generated JSON arrays. Non-name search keywords (topics,
 *   program abbreviations, etc.) are preserved.
 *
 * Usage (in a generator script):
 *   const { purifySearchMeta } = require('./utils/purifyStaffNames');
 *   const cleaned = purifySearchMeta(records);
 *   // records: array of CMS records with optional `searchMeta` field
 */

const path = require("path");

// Extras blocklist: former/external staff names found in CMS searchMeta
// that are not (or no longer) in the public biographies roster.
// Add names here when SiteImprove/security scans surface new leaks.
const EXTRAS = [
  "Aisha Williams",
  "Alan Blackmon",
  "Andy Krupin",
  "Gregory Stevenson",
  "Haley Aubrey",
  "Jashay Fisher",
  "Karen Sheley",
  "Mary Ratliff",
  "Mitchell Troup",
  "Nathan Bossick",
  "Reshma Desai",
  "Roberto Lopez",
  "Ronnie Reichgelt",
  "Schweda",
  "Shai Hoffman",
  "Zina Smith",
];

// Build the name blocklist once on require
let BLOCKLIST = null;

function loadBlocklist() {
  if (BLOCKLIST) return BLOCKLIST;

  const bios = require(path.join(__dirname, "../../public/api/biographies.json"));
  const names = new Set();

  for (const bio of bios) {
    const { firstName, lastName, fullName } = bio;
    if (fullName && fullName.trim()) names.add(fullName.trim());
    if (firstName && lastName) names.add(`${firstName.trim()} ${lastName.trim()}`);
    // Also add lastName alone (common in searchMeta like "Ratliff")
    if (lastName && lastName.trim().length > 2) names.add(lastName.trim());
  }

  // Add extras (former/external staff)
  for (const name of EXTRAS) {
    names.add(name);
    // Also add the last-name-only form for two-word entries
    const parts = name.split(/\s+/);
    if (parts.length === 2 && parts[1].length > 2) names.add(parts[1]);
  }

  // Sort longest-first so "Mary Ratliff" is matched before "Ratliff"
  BLOCKLIST = [...names].sort((a, b) => b.length - a.length);
  return BLOCKLIST;
}

/**
 * Remove staff names from a single searchMeta string value.
 * Case-insensitive word-boundary matching. Leaves other keywords intact.
 */
function purifyString(input) {
  if (!input || typeof input !== "string") return input;
  const blocklist = loadBlocklist();
  let out = input;
  for (const name of blocklist) {
    // Escape regex metacharacters in the name (none expected but defensive)
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    out = out.replace(pattern, "");
  }
  // Collapse whitespace and trim
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Purify a single CMS record: strips staff names from searchMeta.
 * Returns a new object — does not mutate.
 */
function purifyRecord(record) {
  if (!record || typeof record !== "object") return record;
  if (!("searchMeta" in record)) return record;
  return { ...record, searchMeta: purifyString(record.searchMeta) };
}

/**
 * Purify an array of CMS records.
 */
function purifySearchMeta(records) {
  if (!Array.isArray(records)) return records;
  return records.map(purifyRecord);
}

module.exports = {
  purifySearchMeta,
  purifyRecord,
  purifyString,
  loadBlocklist,
};

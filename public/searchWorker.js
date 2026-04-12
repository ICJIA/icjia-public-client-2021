/* global Fuse, importScripts */
// =============================================================================
// Search Worker
//
// Owns the entire search pipeline off the main thread:
//   1. fetch('/searchIndex.json')                (~2.7 MB)
//   2. JSON.parse                                 (~200-500ms on mobile)
//   3. Light text sanitize (regex misspellings)   (~200-1000ms on mobile)
//   4. new Fuse(records, options)                 (~200-500ms on mobile)
//   5. fuse.search(query) per keystroke           (~50-300ms each)
//
// All of (1)-(4) ran on the main thread before this worker existed and froze
// the input handler the moment the user typed the first character. With the
// worker, the main thread stays free; results come back via postMessage.
//
// Wire protocol (main <-> worker):
//   main -> worker:
//     { type: 'INIT', fuseOptions, indexUrl }
//     { type: 'SEARCH', id, query }
//   worker -> main:
//     { type: 'READY' }                  // index loaded, Fuse built
//     { type: 'ERROR', error }           // anything fatal
//     { type: 'RESULTS', id, results }   // response to a SEARCH (id matches)
//
// Each SEARCH carries a request id. The main-thread client keeps a Map of
// pending ids and resolves the matching promise when RESULTS arrives. This
// keeps out-of-order responses safe (later searches that finish first).
// =============================================================================

importScripts("/fuse.min.js");

let fuse = null;

// ---------------------------------------------------------------------------
// Worker-safe text sanitizer (mirrors the regex plugins in
// src/utils/contentSanitizer.js — DOMPurify intentionally skipped because
// search-index fields are plain text and DOMPurify needs DOM).
// ---------------------------------------------------------------------------
const MISSPELLINGS = [
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

const APOSTROPHES = [
  [/\bDont\b(?!')/g, "Don't"],
  [/\bWomens\b(?!')/g, "Women's"],
  [/\bCommunitys\b(?!')/g, "Community's"],
  [/\bCountys\b(?!')/g, "County's"],
  [/\bStates\sAttorneys\b/g, "State's Attorney's"],
];

function sanitizeString(s) {
  if (typeof s !== "string" || !s) return s;
  let out = s;
  for (const [re, sub] of MISSPELLINGS) out = out.replace(re, sub);
  for (const [re, sub] of APOSTROPHES) out = out.replace(re, sub);
  return out;
}

function deepSanitize(obj) {
  if (obj == null) return obj;
  if (typeof obj === "string") return sanitizeString(obj);
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) obj[i] = deepSanitize(obj[i]);
    return obj;
  }
  if (typeof obj === "object") {
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = deepSanitize(obj[k]);
      }
    }
    return obj;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Message dispatcher
// ---------------------------------------------------------------------------
self.addEventListener("message", async (e) => {
  const msg = e.data || {};

  if (msg.type === "INIT") {
    try {
      const url = msg.indexUrl || "/searchIndex.json";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`searchIndex fetch failed: ${res.status}`);
      const records = deepSanitize(await res.json());
      fuse = new Fuse(records, msg.fuseOptions || {});
      self.postMessage({ type: "READY" });
    } catch (err) {
      self.postMessage({ type: "ERROR", error: String(err && err.message) });
    }
    return;
  }

  if (msg.type === "SEARCH") {
    if (!fuse) {
      self.postMessage({ type: "RESULTS", id: msg.id, results: [] });
      return;
    }
    const q = (msg.query || "").trim();
    if (!q) {
      self.postMessage({ type: "RESULTS", id: msg.id, results: [] });
      return;
    }
    const results = fuse.search(q);
    self.postMessage({ type: "RESULTS", id: msg.id, results });
  }
});

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
// How a record is read. Short fields (title, tags, names, search keywords) are
// matched anywhere in the field; long text is matched only within its opening
// characters, so a common word in 2,000 abstracts does not swamp the results.
// A query of several words is also matched word by word (searchAll, below).
// Mirrors src/utils/searchFields.js, which this file cannot import;
// tests/unit/searchQuality.spec.js checks that the two order results identically.
// ---------------------------------------------------------------------------
const SEARCH_HEAD_LENGTH = 60;
const HEAD_FIELDS = ["summary", "abstract"];
// Words that carry no meaning in a search: "how do I apply for a grant" is a
// search for "apply" and "grant".
const STOP_WORDS =
  "a an and are at by can do for from how i in is of on or the to what where with".split(
    " "
  );

function searchOptions(options) {
  const read = Fuse.config.getFn;
  return Object.assign({}, options, {
    includeScore: true, // needed to rank word matches; removed from the results
    getFn(record, path) {
      const value = read(record, path);
      const name = Array.isArray(path) ? path.join(".") : path;
      return HEAD_FIELDS.includes(name) && typeof value === "string"
        ? value.slice(0, SEARCH_HEAD_LENGTH)
        : value;
    },
  });
}

// The meaningful words of a query, at most six, without repeats.
function searchWords(query) {
  const all = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter((word) => word.length >= 2);
  const kept = all.filter((word) => !STOP_WORDS.includes(word));
  return Array.from(new Set(kept.length ? kept : all)).slice(0, 6);
}

// Typing "task force trafic" sends a query per keystroke, and each one would
// search every word again. The index does not change during a visit, so each
// word's results are remembered (the newest eighty words per index).
const WORD_MEMORY = new WeakMap();
const WORD_MEMORY_SIZE = 80;

function wordHits(fuse, word) {
  let memory = WORD_MEMORY.get(fuse);
  if (!memory) {
    memory = new Map();
    WORD_MEMORY.set(fuse, memory);
  }
  let hits = memory.get(word);
  if (!hits) {
    hits = new Map(fuse.search(word).map((r) => [r.refIndex, r]));
    memory.set(word, hits);
    if (memory.size > WORD_MEMORY_SIZE)
      memory.delete(memory.keys().next().value);
  }
  return hits;
}

// Fuse matches a query as one phrase. A query of several words is also matched
// word by word: a record qualifies when every word matches somewhere in it, in
// any order and in any field, each word allowing for a typo. Order of results:
// records that contain the query as typed, then records that match every word
// (best combined score first), then records that match only as a loose phrase.
function searchAll(fuse, query) {
  const bare = (result) => ({ item: result.item, refIndex: result.refIndex });
  const phrase = fuse.search(query);
  const words = searchWords(query);
  if (words.length < 2) return phrase.map(bare);

  let every = null; // refIndex -> { result, score }
  for (const word of words) {
    const hits = wordHits(fuse, word);
    if (every === null) {
      every = new Map();
      hits.forEach((r, ref) => every.set(ref, { result: r, score: r.score }));
    } else {
      every.forEach((entry, ref) => {
        const hit = hits.get(ref);
        if (hit) entry.score += hit.score;
        else every.delete(ref);
      });
    }
    if (!every.size) break;
  }

  // A fuzzy phrase match can be a loose one ("reform police" resembles "Force
  // Polic-ies"), so only a record that really contains the query as typed is
  // promoted; the rest are ordered by how well they match every word.
  const typed =
    words.length && String(query).toLowerCase().trim().replace(/\s+/g, " ");
  const containsTyped = (item) =>
    [item.title, item.fullName, item.searchMeta]
      .concat(Array.isArray(item.tags) ? item.tags : [])
      .some(
        (text) => typeof text === "string" && text.toLowerCase().includes(typed)
      );
  const phraseRank = new Map(phrase.map((r, index) => [r.refIndex, index]));
  // Fuse favours short fields, so one exact tag can outrank a title that holds
  // every word. Among word matches, a title holding more of the words wins.
  const inTitle = (item) => {
    const title =
      typeof item.title === "string" ? item.title.toLowerCase() : "";
    return words.filter((word) => title.includes(word)).length;
  };
  const byScore = (a, b) =>
    inTitle(b.result.item) - inTitle(a.result.item) || a.score - b.score;
  const matched = Array.from(every.values());
  const exact = matched
    .filter((entry) => containsTyped(entry.result.item))
    .sort((a, b) => {
      const ra = phraseRank.has(a.result.refIndex)
        ? phraseRank.get(a.result.refIndex)
        : Infinity;
      const rb = phraseRank.has(b.result.refIndex)
        ? phraseRank.get(b.result.refIndex)
        : Infinity;
      return ra - rb || byScore(a, b);
    });
  const rest = matched
    .filter((entry) => !containsTyped(entry.result.item))
    .sort(byScore);
  const phraseOnly = phrase.filter((r) => !every.has(r.refIndex));
  return exact
    .concat(rest)
    .map((entry) => entry.result)
    .concat(phraseOnly)
    .map(bare);
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
      fuse = new Fuse(records, searchOptions(msg.fuseOptions || {}));
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
    const results = searchAll(fuse, q);
    self.postMessage({ type: "RESULTS", id: msg.id, results });
  }
});

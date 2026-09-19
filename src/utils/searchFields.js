// How the site search reads a record and answers a query (v1.5.82, v1.5.83).
//
// Short fields (title, tags, names, search keywords) are matched anywhere in
// the field. Long text (summary, abstract) is matched only within its opening
// characters, which is what the old position-based settings amounted to:
// matching whole abstracts multiplied the results for common words several
// times over without putting better pages first.
//
// The Research Hub's web applications and datasets are the exception
// (v1.5.85): their descriptions are searched in full. There are about ten of
// them, they carry few tags, and what they hold ("detention", "burglary") is
// named deep in the description.
//
// Results that hold every typed word come first, and the rest are marked
// similar (v1.5.95): the search allows a wrong letter in a word of five to nine
// letters, anywhere, even across a space, so "drone" also returns "Sharone
// Mitchell", "the Job Done" and "and One Time Supports". In each group the
// site's pages come before individual posts.
//
// The search normally runs in public/searchWorker.js, which cannot import this
// file and carries the same code; tests/unit/searchQuality.spec.js checks that
// the two order results identically. This copy serves the in-process fallback
// and the tests.
export const SEARCH_HEAD_LENGTH = 60;
export const HEAD_FIELDS = ["summary", "abstract"];
export const FULL_TEXT_TYPES = ["web application", "dataset"];
// Words that carry no meaning in a search: "how do I apply for a grant" is a
// search for "apply" and "grant".
const STOP_WORDS =
  "a an and are at by can do for from how i in is of on or the to what where with".split(
    " "
  );
// The site's pages, and the partner sites and plans of the Partners menu, are
// what a search is most often for: "jobs" is a search for the Employment page,
// which was 218th of 228, behind every posting. They come before posts.
export const PAGE_TYPES = ["page", "partner site", "plan"];
// A search for a kind of document is not a search for a page: three pages hold
// "annual report" in their keywords or tags (About the Authority: "latest
// annual report") and came before 97 results titled "... Annual Report".
// Nothing in the records tells such a page from the Funding Opportunities
// page, which leads "notice of funding opportunity" by the same kind of
// keyword, so the search is named here. For a query with every word of one of
// these, singular or plural, posts come before pages.
export const DOCUMENT_SEARCHES = [["annual", "report"]];

export function searchOptions(Fuse, options) {
  const read = Fuse.config.getFn;
  return {
    ...options,
    includeScore: true, // needed to rank word matches; removed from the results
    getFn(record, path) {
      const value = read(record, path);
      const name = Array.isArray(path) ? path.join(".") : path;
      return HEAD_FIELDS.includes(name) &&
        typeof value === "string" &&
        !FULL_TEXT_TYPES.includes(record.contentType)
        ? value.slice(0, SEARCH_HEAD_LENGTH)
        : value;
    },
  };
}
// The meaningful words of a query, at most six, without repeats.
export function searchWords(query) {
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

// A test for one typed word: true of text in which the word begins a word, so
// "drone" is held by "Drones" and "homic", still being typed, by "Homicide",
// while "ari" is not held by "Maria". Two other forms of the word count, both
// a letter or two away and so found by the search: "policy" is held by
// "policies" (and not by "police"), and a typed plural by its singular as a
// whole word ("drones" by "drone"; not "units" by "United"). A word in "ss",
// "us" or "is" is singular already: "status" would look for "statu", and find
// "statute".
function heldBy(word) {
  const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const typed = word.replace(/[\u2018\u2019]/g, "'");
  const forms = [literal(typed)];
  if (typed.length >= 4 && /[^aeiou]y$/.test(typed))
    forms.push(literal(`${typed.slice(0, -1)}ies`));
  if (typed.length >= 4 && /s$/.test(typed) && !/(ss|us|is)$/.test(typed)) {
    const singular = [typed.slice(0, -1)];
    if (typed.endsWith("es")) singular.push(typed.slice(0, -2));
    singular.forEach((form) => forms.push(`${literal(form)}(?![a-z0-9])`));
  }
  return new RegExp(`(^|[^a-z0-9])(${forms.join("|")})`);
}

// Everything the search reads in a record, in lower case, remembered per record
// (the index does not change during a visit).
const RECORD_TEXT = new WeakMap();

function recordText(fuse, result) {
  let texts = RECORD_TEXT.get(fuse);
  if (!texts) {
    texts = new Map();
    RECORD_TEXT.set(fuse, texts);
  }
  let text = texts.get(result.refIndex);
  if (text === undefined) {
    const strings = [];
    const keep = (value) => {
      if (typeof value === "string") strings.push(value);
    };
    for (const key of fuse.options.keys) {
      const value = fuse.options.getFn(
        result.item,
        typeof key === "string" ? key : key.name
      );
      if (Array.isArray(value)) value.forEach(keep);
      else keep(value);
    }
    text = strings
      .join("\n")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'");
    texts.set(result.refIndex, text);
  }
  return text;
}

// The results that hold every typed word, then the rest, marked similar. In
// each group pages come before posts (posts before pages when the search is
// for a kind of document); otherwise the order given is kept.
// Fuse's score cannot make this split: it multiplies over every field that
// matched, so a biography one letter from the word in its title, its name and
// its summary scores beside a page that holds the word.
function arrange(fuse, results, words) {
  const tests = words.map(heldBy);
  const held = [];
  const similar = [];
  results.forEach((result) => {
    const text = recordText(fuse, result);
    (tests.every((test) => test.test(text)) ? held : similar).push(result);
  });
  const forDocuments = DOCUMENT_SEARCHES.some((phrase) =>
    phrase.every((word) => words.includes(word) || words.includes(`${word}s`))
  );
  const isPage = (result) => PAGE_TYPES.includes(result.item.contentType);
  const byKind = (list) => {
    const pages = list.filter(isPage);
    const posts = list.filter((result) => !isPage(result));
    return forDocuments ? posts.concat(pages) : pages.concat(posts);
  };
  return byKind(held)
    .map((result) => ({ item: result.item, refIndex: result.refIndex }))
    .concat(
      byKind(similar).map((result) => ({
        item: result.item,
        refIndex: result.refIndex,
        similar: true,
      }))
    );
}

// Fuse matches a query as one phrase. A query of several words is also matched
// word by word: a record qualifies when every word matches somewhere in it, in
// any order and in any field, each word allowing for a typo. Order of results:
// records that contain the query as typed, then records that match every word
// (best combined score first), then records that match only as a loose phrase;
// and, over that order, arrange() above.
export function searchAll(fuse, query) {
  const phrase = fuse.search(query);
  const words = searchWords(query);
  if (words.length < 2) return arrange(fuse, phrase, words);

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
  return arrange(
    fuse,
    exact
      .concat(rest)
      .map((entry) => entry.result)
      .concat(phraseOnly),
    words
  );
}

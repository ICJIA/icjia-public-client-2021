// How the site search reads a record and answers a query (v1.5.82, v1.5.83).
//
// Short fields (title, tags, names, search keywords) are matched anywhere in
// the field. Long text (summary, abstract) is matched only within its opening
// characters, which is what the old position-based settings amounted to:
// matching whole abstracts multiplied the results for common words several
// times over without putting better pages first.
//
// The search normally runs in public/searchWorker.js, which cannot import this
// file and carries the same code; tests/unit/searchQuality.spec.js checks that
// the two order results identically. This copy serves the in-process fallback
// and the tests.
export const SEARCH_HEAD_LENGTH = 60;
export const HEAD_FIELDS = ["summary", "abstract"];
// Words that carry no meaning in a search: "how do I apply for a grant" is a
// search for "apply" and "grant".
const STOP_WORDS =
  "a an and are at by can do for from how i in is of on or the to what where with".split(
    " "
  );

export function searchOptions(Fuse, options) {
  const read = Fuse.config.getFn;
  return {
    ...options,
    includeScore: true, // needed to rank word matches; removed from the results
    getFn(record, path) {
      const value = read(record, path);
      const name = Array.isArray(path) ? path.join(".") : path;
      return HEAD_FIELDS.includes(name) && typeof value === "string"
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

// Fuse matches a query as one phrase. A query of several words is also matched
// word by word: a record qualifies when every word matches somewhere in it, in
// any order and in any field, each word allowing for a typo. Order of results:
// records that contain the query as typed, then records that match every word
// (best combined score first), then records that match only as a loose phrase.
export function searchAll(fuse, query) {
  const bare = (result) => ({ item: result.item, refIndex: result.refIndex });
  const phrase = fuse.search(query);
  const words = searchWords(query);
  if (words.length < 2) return phrase.map(bare);

  let every = null; // refIndex -> { result, score }
  for (const word of words) {
    const hits = new Map(fuse.search(word).map((r) => [r.refIndex, r]));
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

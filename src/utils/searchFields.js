// How the site search reads a record (v1.5.82).
//
// Short fields (title, tags, names, search keywords) are matched anywhere in
// the field. Long text (summary, abstract) is matched only within its opening
// characters, which is what the old position-based settings amounted to:
// matching whole abstracts multiplied the results for common words several
// times over without putting better pages first.
//
// The search normally runs in public/searchWorker.js, which cannot import this
// file and carries the same few lines; tests/unit/searchQuality.spec.js checks
// that the two agree. This copy serves the in-process fallback and the tests.
export const SEARCH_HEAD_LENGTH = 60;
export const HEAD_FIELDS = ["summary", "abstract"];

export function searchOptions(Fuse, options) {
  const read = Fuse.config.getFn;
  return {
    ...options,
    getFn(record, path) {
      const value = read(record, path);
      const name = Array.isArray(path) ? path.join(".") : path;
      return HEAD_FIELDS.includes(name) && typeof value === "string"
        ? value.slice(0, SEARCH_HEAD_LENGTH)
        : value;
    },
  };
}

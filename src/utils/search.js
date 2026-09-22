/**
 * Search navigation helper.
 *
 * Replaces the legacy `EventBus.$emit("search", opts)` pattern that opened
 * the ModalSearch dialog for tag/name/category click-throughs. Users
 * reported that the modal destroyed their browsing context: they couldn't
 * Back-button to their results, and there was no way to open a result in
 * a new tab and keep the result set visible.
 *
 * The new flow:
 *   - Click a tag / name / category → navigate to /search/:query (same tab)
 *   - Click a result card on /search → the result opens in the same tab
 *     (v1.5.87; it was a new tab). SearchCardAlt's related-content lists
 *     still open a new tab when isStatic=true.
 *   - Back → the search page returns to the search as it was left: the query
 *     and filter are in the address (SearchStatic.syncAddress), and the rest
 *     is kept per history entry (src/utils/searchReturn.js). There is no
 *     keep-alive: the page is rebuilt and the search is run again.
 *
 * This module is intentionally a tiny helper (no Vue dependency) so it's
 * importable from any component — container or presentational — without
 * pulling in a store or event bus.
 */

/**
 * The router location of the static /search page for a query.
 *
 * Tag, category and content-type chips render as real links to this
 * location (WCAG 2.1.1: a <span> with a click handler cannot be reached
 * or activated by keyboard), and goToSearch() pushes the same location,
 * so a link and a programmatic search always land on the same URL.
 *
 * @param {object} opts  { query, type, filter } — `type` is a
 *                       content-type filter (e.g. "article",
 *                       "biography", "news"). `filter` is accepted
 *                       as an alias for `type` for call-site
 *                       compatibility with older EventBus payloads.
 */
export function searchLocation(opts) {
  const query = ((opts && opts.query) || "").toString().trim();
  const filter = (opts && (opts.filter || opts.type)) || null;
  // Blank query lands on the bare /search page so the user can start
  // typing in the page's own search input. This is the path the header
  // and footer search icons take.
  const target = query
    ? {
        name: "Search2",
        params: { query: encodeURIComponent(query) },
      }
    : { name: "Search1" };
  if (filter && query) {
    target.query = { filter };
  }
  return target;
}

/**
 * Navigate to the static /search page with a pre-filled query.
 *
 * @param {VueRouter} router  The component's $router instance.
 * @param {object}    opts    See searchLocation().
 */
export function goToSearch(router, opts) {
  if (!router) return;
  router.push(searchLocation(opts)).catch((err) => {
    // vue-router 3 throws on redundant navigations (same route). That's
    // benign here — user re-clicked the same tag. Swallow it silently.
    if (err && err.name !== "NavigationDuplicated") {
      // Surface unexpected errors so we notice during development.
      // eslint-disable-next-line no-console
      console.warn("goToSearch navigation error:", err);
    }
  });
}

/**
 * The Plausible event for a search that has settled (v1.5.121): the words,
 * lowercased, and the counts, as strings (Plausible shows a property's values
 * as text). `matched` is the results that hold every typed word; the rest
 * are similar, or were found with a typed word left out (v1.5.122). A search
 * that found nothing is recorded too: that is the one to learn from. Nothing
 * for a blank box or a single letter, which the page does not search.
 *
 * Plausible's own script records page views on the router's pushState, so a
 * click on a tag or a name reaches it as /search/<words>; a search typed on
 * the search page is written into the address with replaceState, and did not.
 *
 * @param {string} query    The query the results are for.
 * @param {Array}  results  The results, each with `similar` when it is.
 * @returns {{name: string, props: object}|null}
 */
export function searchEvent(query, results) {
  const words = (query || "").trim().toLowerCase();
  if (words.length < 2) return null;
  const list = results || [];
  const props = {
    query: words,
    results: String(list.length),
    matched: String(
      list.filter((r) => !r.similar && !(r.missing && r.missing.length)).length
    ),
  };
  // The typed words the search left out, when it did (v1.5.123): "ball" for
  // "ball reform". Absent otherwise, so Plausible shows "(none)".
  const missing = (list[0] && list[0].missing) || [];
  if (missing.length) props.missing = missing.join(" ");
  return { name: "Search", props };
}

/**
 * The date of a result, as the result card shows it (v1.5.123): a
 * publication's or a news post's publicationDate, a Research Hub item's date,
 * and otherwise the record's published_at (a funding notice, a job, a
 * meeting). Null without one: a partner site, a plan, some pages.
 *
 * @param {object} item  A search record.
 * @returns {number|null}  Milliseconds since the epoch.
 */
export function resultDate(item) {
  if (!item) return null;
  const value = item.publicationDate || item.date || item.published_at;
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? null : time;
}

/**
 * The results in date order, newest first, the undated last; the results that
 * hold every typed word before the similar ones, each group in that order
 * (the search's own order otherwise puts the best match first). A stable
 * sort: equal dates keep the order given. The list given is left alone.
 *
 * @param {Array} results  Search results, each with `similar` when it is.
 * @returns {Array}
 */
export function newestFirst(results) {
  const byDate = (list) =>
    list
      .map((result, index) => ({
        result,
        index,
        time: resultDate(result.item),
      }))
      .sort((a, b) => {
        if (a.time === null && b.time === null) return a.index - b.index;
        if (a.time === null) return 1;
        if (b.time === null) return -1;
        return b.time - a.time || a.index - b.index;
      })
      .map((entry) => entry.result);
  const list = results || [];
  return byDate(list.filter((r) => !r.similar)).concat(
    byDate(list.filter((r) => r.similar))
  );
}

/**
 * Open a destination path in a new browser tab with hardened rel.
 * Used by SearchCard when rendered on the static /search page so users
 * can drill into a result without losing their list of results.
 *
 * @param {string} path  Internal SPA path (e.g. "/researchhub/articles/x/").
 */
export function openInNewTab(path) {
  if (!path) return;
  // Absolute URL for window.open so origin-relative paths open at the
  // current site origin in every browser.
  const url = path.startsWith("http") ? path : window.location.origin + path;
  window.open(url, "_blank", "noopener,noreferrer");
}

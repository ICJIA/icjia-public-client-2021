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
 *   - Click a result card on /search → open the target in a new tab
 *     (handled in SearchCard/SearchCardAlt when isStatic=true)
 *   - Back from a same-tab navigation → keep-alive restores results
 *
 * This module is intentionally a tiny helper (no Vue dependency) so it's
 * importable from any component — container or presentational — without
 * pulling in a store or event bus.
 */

/**
 * Navigate to the static /search page with a pre-filled query.
 *
 * @param {VueRouter} router  The component's $router instance.
 * @param {object}    opts    { query, type, filter } — `type` is a
 *                            content-type filter (e.g. "article",
 *                            "biography", "news"). `filter` is accepted
 *                            as an alias for `type` for call-site
 *                            compatibility with older EventBus payloads.
 */
export function goToSearch(router, opts) {
  if (!router) return;
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
  router.push(target).catch((err) => {
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

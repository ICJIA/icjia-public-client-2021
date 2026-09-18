// Coming back to a search (v1.5.87).
//
// The search page writes its query and filter into the address, so Back
// returns to the same search. What the address cannot say is kept here, per
// history entry: how many results were showing, how far the page was scrolled,
// and which result had focus. It lives in memory for this visit only, for the
// newest twenty entries; nothing is stored on the device.
const MAX_ENTRIES = 20;
const kept = new Map();

// vue-router gives every history entry a key, and the browser hands it back
// when the visitor returns to the entry.
export function historyKey() {
  const state = typeof window !== "undefined" && window.history.state;
  return (state && state.key) || null;
}

export function keepSearchView(key, view) {
  if (!key) return;
  kept.delete(key);
  kept.set(key, view);
  if (kept.size > MAX_ENTRIES) kept.delete(kept.keys().next().value);
}

// The view kept for this entry, if it was of the same query.
export function keptSearchView(key, query) {
  const view = key ? kept.get(key) : null;
  return view && view.query === query ? view : null;
}

export function forgetSearchView(key) {
  kept.delete(key);
}

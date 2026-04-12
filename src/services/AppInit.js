import config from "@/config/config.json";
import disclaimers from "@/config/disclaimers.json";
import context from "@/config/contextMenus.json";
import menus from "@/config/menus.json";
import Fuse from "fuse.js";
import { deepSanitize } from "@/utils/contentSanitizer";
import { createSearchClient, workersAvailable } from "@/services/searchClient";

// Lazy search loader.
//
// History:
//   v1.3.35 and earlier — `searchIndex.json` (~2.7 MB) was statically imported
//     here, inlining the entire blob into the entry bundle and running
//     deepSanitize() over every string before first paint.
//   v1.3.36 — replaced the static import with an on-demand fetch + in-process
//     Fuse build. The fetch is async, but its `.then()` (parse + sanitize +
//     Fuse construction) runs synchronously on the main thread, freezing
//     input on the first keystroke after the modal opens.
//   v1.3.37 — moves the entire pipeline (fetch + parse + sanitize + Fuse +
//     per-keystroke search) into a Web Worker via `searchClient`. The main
//     thread stays free; results stream back via postMessage.
//
// Public API (unchanged): callers `await myApp.getFuse()` and receive an
// object with a `.search(query)` method that returns a Promise<results[]>.
// In the worker path the method is naturally async; in the in-process
// fallback we wrap the sync Fuse.search() in Promise.resolve() so consumers
// are always awaiting the same shape.

let fusePromise = null;

const buildInProcessFuse = async () => {
  const r = await fetch("/searchIndex.json");
  if (!r.ok) throw new Error(`searchIndex fetch failed: ${r.status}`);
  const records = deepSanitize(await r.json());
  const inner = new Fuse(records, config.search.site);
  // Wrap so the shape matches the worker-backed client (async search).
  return {
    usingWorker: false,
    search: (q) => Promise.resolve(inner.search(q)),
  };
};

const getFuse = () => {
  if (fusePromise) return fusePromise;

  if (workersAvailable()) {
    const client = createSearchClient({
      fuseOptions: config.search.site,
      indexUrl: "/searchIndex.json",
    });
    if (client) {
      fusePromise = client
        .ready()
        .then(() => client)
        .catch((err) => {
          // Worker failed to load the index — clear cache so callers can
          // retry, and fall back to the in-process path on the next call.
          fusePromise = null;
          throw err;
        });
      return fusePromise;
    }
  }

  // Fallback: no Worker support, run Fuse on the main thread (the v1.3.36
  // behavior). Tests, SSR, and very old browsers land here.
  fusePromise = buildInProcessFuse().catch((err) => {
    fusePromise = null;
    throw err;
  });
  return fusePromise;
};

let myApp = {
  config,
  context,
  disclaimers,
  fuse: null, // legacy slot — callers should use getFuse() instead
  getFuse,
  publications: null,
  menus,
};

export { myApp };

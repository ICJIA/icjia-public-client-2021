import config from "@/config/config.json";
import disclaimers from "@/config/disclaimers.json";
import context from "@/config/contextMenus.json";
import menus from "@/config/menus.json";
import Fuse from "fuse.js";
import { deepSanitize } from "@/utils/contentSanitizer";

// Lazy search index loader.
//
// Previously `searchIndex.json` (~2.7 MB) was statically imported here, which
// inlined the entire blob into the main bundle and ran `deepSanitize()` over
// it before the first paint. By fetching it on demand from /searchIndex.json
// (already a static asset emitted into dist/) we shave the index off the
// entry chunk and defer the sanitize work until the user opens search.
//
// The promise is cached so concurrent callers share one fetch+build.
let fusePromise = null;
const getFuse = () => {
  if (fusePromise) return fusePromise;
  fusePromise = fetch("/searchIndex.json")
    .then((r) => {
      if (!r.ok) throw new Error(`searchIndex fetch failed: ${r.status}`);
      return r.json();
    })
    .then((idx) => new Fuse(deepSanitize(idx), config.search.site))
    .catch((err) => {
      // Reset on failure so a retry is possible
      fusePromise = null;
      throw err;
    });
  return fusePromise;
};

let myApp = {
  config,
  context,
  disclaimers,
  // `fuse` is kept as null for backward compat with any code path that still
  // reads it synchronously; new callers should use `getFuse()` and await.
  fuse: null,
  getFuse,
  publications: null,
  menus,
};

export { myApp };

// =============================================================================
// SearchClient — main-thread façade for /searchWorker.js
//
// Exposes the same shape the existing UI expects (`search(query) -> results`)
// but routes the call through a Web Worker so neither the initial 2.7 MB
// index load nor per-keystroke Fuse queries block the input handler.
//
// Lifecycle:
//   const client = createSearchClient({ fuseOptions });
//   await client.ready();              // resolves when worker loaded the index
//   const results = await client.search("research hub");
//
// Concurrency: each search() carries an incrementing request id. The client
// keeps a Map<id, resolver> and resolves the matching promise when the worker
// posts RESULTS back. Out-of-order responses are safe — later searches that
// finish first don't clobber earlier resolvers.
//
// Fallback: if Worker isn't available (SSR, tests, very old browsers), the
// caller can detect this via `client.usingWorker === false` and fall back to
// the in-process Fuse path. Right now AppInit picks one or the other at boot.
// =============================================================================

let nextId = 1;

export function workersAvailable() {
  return typeof window !== "undefined" && typeof window.Worker === "function";
}

export function createSearchClient({
  workerUrl = "/searchWorker.js",
  indexUrl = "/searchIndex.json",
  fuseOptions = {},
} = {}) {
  if (!workersAvailable()) {
    return null;
  }

  const worker = new Worker(workerUrl);
  const pending = new Map(); // id -> { resolve, reject }
  let readyResolve;
  let readyReject;
  const readyPromise = new Promise((res, rej) => {
    readyResolve = res;
    readyReject = rej;
  });

  worker.addEventListener("message", (e) => {
    const msg = e.data || {};
    if (msg.type === "READY") {
      readyResolve();
      return;
    }
    if (msg.type === "ERROR") {
      const err = new Error(msg.error || "search worker error");
      // If the index load failed, reject ready() so callers can retry.
      if (readyReject) readyReject(err);
      // Reject any in-flight searches too.
      for (const [, { reject }] of pending) reject(err);
      pending.clear();
      return;
    }
    if (msg.type === "RESULTS") {
      const slot = pending.get(msg.id);
      if (!slot) return; // stale or unknown id — ignore
      pending.delete(msg.id);
      slot.resolve(msg.results || []);
    }
  });

  worker.addEventListener("error", (e) => {
    const err = new Error(e.message || "search worker crashed");
    if (readyReject) readyReject(err);
    for (const [, { reject }] of pending) reject(err);
    pending.clear();
  });

  // Kick off the index load immediately. The promise stored in `readyPromise`
  // resolves when the worker has finished building Fuse and is ready to search.
  worker.postMessage({ type: "INIT", fuseOptions, indexUrl });

  return {
    usingWorker: true,
    ready: () => readyPromise,
    search(query) {
      // Allow searching before ready resolves — the worker queues the message
      // anyway, but searches dispatched pre-READY will return [] (the worker
      // checks for `fuse` and short-circuits). Safer: callers should await
      // ready() first or guard their UI on a `loaded` flag.
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ type: "SEARCH", id, query });
      });
    },
    terminate() {
      worker.terminate();
      pending.clear();
    },
  };
}

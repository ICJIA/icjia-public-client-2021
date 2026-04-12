/* eslint-env mocha */
// =============================================================================
// Lazy search-index loader tests
// Verifies that AppInit.getFuse() correctly fetches /searchIndex.json,
// sanitizes its contents, builds a Fuse instance, caches the promise, and
// resets on fetch failure so retries are possible.
//
// Why this exists:
// Pre-v1.3.36 the 2.7 MB searchIndex.json was statically imported into
// AppInit.js, which inlined it into the entry bundle and ran deepSanitize()
// over the whole blob before first paint. The lazy loader replaces that with
// an on-demand fetch — these tests pin the new contract.
//
// Test ordering matters: the module's `fusePromise` is private and lives for
// the lifetime of the test run. We exercise the failure path FIRST (which
// resets the cache on rejection), then the success path, and finally the
// cache-reuse contract.
// =============================================================================
import { expect } from "chai";
import { myApp } from "@/services/AppInit";

// Helpers -------------------------------------------------------------------

const SAMPLE_INDEX = [
  {
    title: "About the Authority",
    fullPath: "/about/about-the-authority/",
    summary: "ICJIA is the state criminal justice planning agency.",
    type: "page",
  },
  {
    title: "Research Hub",
    fullPath: "/researchhub/hub-home/",
    summary: "ICJIA's research efforts on criminal justice in Illinois.",
    type: "hub",
  },
];

function makeFetchOk(body) {
  return function fakeFetch() {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    });
  };
}

function makeFetchNetworkError() {
  return function fakeFetch() {
    return Promise.reject(new Error("network down"));
  };
}

let originalFetch;

// ---------------------------------------------------------------------------
// Module shape
// ---------------------------------------------------------------------------
describe("AppInit module shape", () => {
  it("exports a getFuse() function", () => {
    expect(myApp.getFuse).to.be.a("function");
  });

  it("keeps fuse=null until getFuse() is called (no eager load)", () => {
    expect(myApp.fuse).to.equal(null);
  });

  it("still exposes config/menus/disclaimers/context", () => {
    expect(myApp.config).to.be.an("object");
    expect(myApp.menus).to.exist;
    expect(myApp.disclaimers).to.exist;
    expect(myApp.context).to.exist;
  });
});

// ---------------------------------------------------------------------------
// Failure path FIRST — must run before any successful call so the module's
// internal `fusePromise` is still null. On rejection, the loader clears the
// promise so the next call retries.
// ---------------------------------------------------------------------------
describe("getFuse() — failure handling (must run before success path)", () => {
  before(() => {
    originalFetch = global.fetch;
  });

  it("rejects when fetch throws a network error", async () => {
    global.fetch = makeFetchNetworkError();
    let err = null;
    try {
      await myApp.getFuse();
    } catch (e) {
      err = e;
    }
    expect(err).to.exist;
    expect(err.message).to.match(/network down/);
  });

  it("clears the cache after a network failure (next call re-fetches)", async () => {
    // fetchCallCount is implicit — if the cache wasn't cleared, the second
    // call would reuse the rejected promise and skip our new (200) fetch.
    let calls = 0;
    global.fetch = (...args) => {
      calls += 1;
      return makeFetchOk(SAMPLE_INDEX)(...args);
    };
    const fuse = await myApp.getFuse();
    expect(fuse).to.be.an("object");
    expect(fuse.search).to.be.a("function");
    expect(calls).to.equal(1); // re-fetch happened, proving cache was cleared
  });
});

// ---------------------------------------------------------------------------
// Success path — at this point the previous test left a successful Fuse
// instance cached. Subsequent calls must return that same cached instance
// without re-fetching.
// ---------------------------------------------------------------------------
describe("getFuse() — successful path & caching", () => {
  it("returns a Promise that resolves to a Fuse instance", async () => {
    const result = myApp.getFuse();
    expect(result).to.be.an.instanceOf(Promise);
    const fuse = await result;
    expect(fuse).to.be.an("object");
    expect(fuse.search).to.be.a("function");
  });

  it("caches the promise — subsequent calls do NOT re-fetch", async () => {
    let calls = 0;
    // Replace fetch with a counter; if the cache works, this is never invoked.
    global.fetch = (...args) => {
      calls += 1;
      return makeFetchOk(SAMPLE_INDEX)(...args);
    };
    const a = await myApp.getFuse();
    const b = await myApp.getFuse();
    const c = await myApp.getFuse();
    expect(a).to.equal(b);
    expect(b).to.equal(c);
    expect(calls).to.equal(0); // cached — no new fetches
  });

  it("returns a client whose search() can search the loaded index", async () => {
    // search() is async (Promise<results>) regardless of whether the worker
    // path or the in-process fallback is in use. In the test environment
    // there's no Worker (jsdom), so we exercise the in-process fallback.
    const client = await myApp.getFuse();
    const results = await client.search("authority");
    expect(results).to.be.an("array");
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].item.fullPath).to.equal("/about/about-the-authority/");
  });

  it("the cached client returns matches with item shape", async () => {
    const client = await myApp.getFuse();
    const results = await client.search("research hub");
    expect(results.length).to.be.greaterThan(0);
    expect(results[0]).to.have.property("item");
    expect(results[0].item).to.have.property("fullPath");
    // Note: includeScore/includeMatches are disabled in config.search.site
    // for performance — neither was read anywhere in the UI. This test pins
    // that contract: results should NOT carry score or matches.
    expect(results[0]).to.not.have.property("score");
    expect(results[0]).to.not.have.property("matches");
  });

  it("client.search() returns a Promise (worker-compatible API)", async () => {
    const client = await myApp.getFuse();
    const result = client.search("authority");
    expect(result).to.be.an.instanceOf(Promise);
  });

  it("test environment uses the in-process fallback (no Web Worker)", async () => {
    const client = await myApp.getFuse();
    expect(client.usingWorker).to.equal(false);
  });

  after(() => {
    // Restore the original fetch (likely undefined in jsdom) so other test
    // files don't accidentally rely on our stub.
    global.fetch = originalFetch;
  });
});

// ---------------------------------------------------------------------------
// Bundle contract — verify the module no longer statically imports the
// 2.7 MB searchIndex.json. This is the perf guarantee we care about most.
// ---------------------------------------------------------------------------
describe("AppInit bundle contract", () => {
  it("does NOT statically import searchIndex.json (perf guarantee)", () => {
    // Read the source and assert the static import is gone. Using a regex
    // because a literal substring match would also catch comments mentioning
    // the file. This pins the perf win in CI.
    // (process.cwd() is the repo root when tests run via npm.)
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/services/AppInit.js"),
      "utf8"
    );
    // Static import would look like: import searchIndex from "...searchIndex.json"
    expect(src).to.not.match(
      /^import\s+\w+\s+from\s+["'][^"']*searchIndex\.json/m
    );
  });
});

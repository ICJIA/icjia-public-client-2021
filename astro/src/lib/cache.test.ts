// Unit tests for setCache (the per-route edge-cache + purge-tag headers). Critical
// path: wrong headers = no edge caching (perf collapse) or stale content; wrong tags
// = purge-on-publish misses. Deterministic (reads TTLs from icjia.config.mjs).
import { describe, it, expect } from "vitest";
import { setCache } from "./cache";

function headersFor(kind: any, extra?: string[]) {
  const res = new Response("");
  setCache(res, kind, extra);
  return res.headers;
}

describe("setCache", () => {
  it("sets Netlify-CDN-Cache-Control with s-maxage + stale-while-revalidate + durable", () => {
    const cdn = headersFor("home").get("Netlify-CDN-Cache-Control");
    expect(cdn).toMatch(/^public, s-maxage=\d+, stale-while-revalidate=\d+, durable$/);
  });

  it("sets the browser Cache-Control to always-revalidate (never holds stale HTML)", () => {
    expect(headersFor("news").get("Cache-Control")).toBe("public, max-age=0, must-revalidate");
  });

  it("tags the response with its content kind (purge-on-publish)", () => {
    expect(headersFor("meetings").get("Netlify-Cache-Tag")).toBe("meetings");
  });

  it("prepends the kind then appends aggregator extras, de-duplicated", () => {
    // home is tagged with every live section it surfaces; setCache must dedupe.
    const tag = headersFor("home", ["news", "hub", "home", "news"]).get("Netlify-Cache-Tag");
    expect(tag).toBe("home,news,hub");
  });

  it("bios is edit-sensitive: 120s s-maxage (so Strapi edits surface within ~2 min)", () => {
    expect(headersFor("bios").get("Netlify-CDN-Cache-Control")).toContain("s-maxage=120");
  });
});

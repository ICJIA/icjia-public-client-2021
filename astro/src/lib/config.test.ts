// Invariants for icjia.config.mjs — the single source of truth for render strategy +
// cache TTLs + keep-warm. These catch drift that would silently break caching/perf or
// serve stale content (e.g. a route in BOTH buckets, a keep-warm SWR ≤ the ping).
import { describe, it, expect } from "vitest";
import { renderStrategy, cacheTTL, keepWarm } from "../../icjia.config.mjs";

describe("renderStrategy manifest", () => {
  it("a route is never in BOTH live and static", () => {
    const overlap = renderStrategy.live.filter((r: string) => renderStrategy.static.includes(r));
    expect(overlap).toEqual([]);
  });
  it("bios moved to live (edit-sensitive); publications are static", () => {
    expect(renderStrategy.live).toContain("/about/biographies");
    expect(renderStrategy.live).toContain("/about/icjia-staff");
    expect(renderStrategy.static).toContain("/about/publications");
  });
});

describe("cacheTTL", () => {
  it("every kind is [s-maxage, swr] with swr >= s-maxage", () => {
    for (const [, v] of Object.entries<any>(cacheTTL)) {
      expect(Array.isArray(v)).toBe(true);
      expect(v).toHaveLength(2);
      expect(typeof v[0]).toBe("number");
      expect(v[1]).toBeGreaterThanOrEqual(v[0]);
    }
  });
  it("keep-warmed kinds have SWR ≫ the 300s ping (edge copy never expires between pings)", () => {
    // home + the researchhub family + the warmed list/landing pages.
    for (const k of ["home", "news", "meetings", "grants", "hub"]) {
      expect((cacheTTL as any)[k][1]).toBeGreaterThan(300);
    }
  });
});

describe("keepWarm", () => {
  it("warms only absolute, trailing-slash paths", () => {
    for (const r of keepWarm.routes) {
      expect(r.startsWith("/")).toBe(true);
      expect(r.endsWith("/")).toBe(true);
    }
  });
});

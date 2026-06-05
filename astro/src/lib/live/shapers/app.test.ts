// App shaper coverage (docs/LIVE-DETAIL-FALLBACK.md): shapeApp maps a raw
// researchhub Strapi v3 REST/GraphQL record to the same shape research.ts's
// getApp() returns — list-item base + external + http-guarded url + funding +
// rendered citation + sorted related — with two deliberate live-detail behaviours
// vs getApp: imagePath is ALWAYS null (no build manifest client-side) so the raw
// base64 `image` is the fallback (§4), and there are no authors. The reused pure
// helpers (formatResearchDate/truncateBySentence/isNewResearch/categoriesArray/
// hubRelated) are pinned by shapers/dataset.test.ts.
import { describe, it, expect } from "vitest";
import { shapeApp } from "./app";
import { renderToHtml } from "../../markdown.js";

describe("app shaper — shapeApp correctness (getApp parity)", () => {
  const raw = {
    id: 3,
    title: "Crime Dashboard & Map",
    slug: "crime-dashboard-map",
    date: "2026-05-22T00:00:00.000Z",
    description: "Dashboard. Maps trends. Third sentence.",
    contributors: [{ title: "Jane", url: "https://j.example" }],
    image: "data:image/png;base64,AAAA",
    external: "yes",
    categories: ["law enforcement"],
    tags: ["mapping", "data"],
    url: "https://apps.example/dash",
    funding: "Funded.",
    citation: "**cite**",
    datasets: [{ title: "DS1", slug: "ds1" }],
    articles: [{ title: "Art1", slug: "art1" }],
  };

  it("maps every field to the getApp shape", () => {
    const out = shapeApp(raw, renderToHtml);
    expect(out.id).toBe("3");
    expect(out.fullPath).toBe("/researchhub/apps/crime-dashboard-map/");
    expect(out.dateLabel).toBe("May 22, 2026");
    expect(out.teaser).toBe("Dashboard.  Maps trends."); // 3 sentences → first 2 (double space, verbatim research.ts join)
    expect(out.categories).toEqual(["LAW ENFORCEMENT"]);
    expect(out.tags).toEqual(["mapping", "data"]);
    expect(out.contributors).toEqual([{ title: "Jane", url: "https://j.example" }]);
    expect(out.external).toBe("yes");
    expect(out.funding).toBe("Funded.");
    expect(out.url).toBe("https://apps.example/dash");
    // related: datasets then articles, each sorted; citation rendered.
    expect(out.related).toEqual([
      { displayTitle: "[Dataset]: DS1", fullPath: "/researchhub/datasets/ds1/" },
      { displayTitle: "[Article]: Art1", fullPath: "/researchhub/articles/art1/" },
    ]);
    expect(out.citation).toContain("<strong>cite</strong>");
  });

  it("§4 image: imagePath always null client-side, raw base64 image kept", () => {
    const out = shapeApp(raw, renderToHtml);
    expect(out.imagePath).toBeNull();
    expect(out.image).toBe("data:image/png;base64,AAAA");
    // no image on the record → image null.
    expect(shapeApp({ ...raw, image: null }, renderToHtml).image).toBeNull();
  });

  it("url http-guard: non-http(s) dropped (defense-in-depth, matches getApp)", () => {
    expect(shapeApp({ ...raw, url: "javascript:alert(1)" }, renderToHtml).url).toBeUndefined();
    expect(shapeApp({ ...raw, url: "" }, renderToHtml).url).toBeUndefined();
    expect(shapeApp({ ...raw, url: "http://ok.example" }, renderToHtml).url).toBe(
      "http://ok.example",
    );
  });

  it("citation passthrough when empty; empty relations tolerated", () => {
    const out = shapeApp(
      { ...raw, citation: "", datasets: undefined, articles: undefined },
      renderToHtml,
    );
    expect(out.citation).toBe("");
    expect(out.related).toEqual([]);
  });
});

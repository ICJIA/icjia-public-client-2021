// App shaper coverage (docs/LIVE-DETAIL-FALLBACK.md): shapeApp maps a raw
// researchhub Strapi v3 REST/GraphQL record to the same shape research.ts's
// getApp() returns — list-item base + external + http-guarded url + funding +
// rendered citation + sorted related — with two deliberate live-detail behaviours
// vs getApp: imagePath is ALWAYS null (no build manifest client-side) so the raw
// base64 `image` is the fallback (§4), and there are no authors. The reused pure
// helpers (formatResearchDate/truncateBySentence/isNewResearch/categoriesArray/
// hubRelated) are pinned by shapers/dataset.test.ts.
import { describe, it, expect } from "vitest";
import { shapeApp, shapeAppRow } from "./app";
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

describe("contributors normalization (axe link-name regression 2026-06-10: safeUrl on an ABSENT url minted '#' links)", () => {
  const base = {
    id: 9,
    title: "App",
    slug: "app",
    date: "2026-01-01T00:00:00.000Z",
    description: "One. Two.",
  };
  const contribs = [
    { title: "ICJIA R&A staff" }, // url-less object → must stay LINKLESS (no '#')
    { title: "X", url: "javascript:alert(1)" }, // present-but-dangerous → neutralized '#'
    { title: "Y", url: "https://ok.example" }, // legit → untouched
  ];
  it("shapeApp: url-less contributor has NO url; real urls scheme-guarded", () => {
    const out = shapeApp({ ...base, contributors: contribs }, renderToHtml);
    expect(out.contributors[0].url).toBeUndefined();
    expect(out.contributors[0].title).toBe("ICJIA R&A staff");
    expect(out.contributors[1].url).toBe("#");
    expect(out.contributors[2].url).toBe("https://ok.example");
  });
  it("shapeApp: a bare-STRING contributor (live CMS shape) becomes {title} — text, never an empty link", () => {
    const out = shapeApp({ ...base, contributors: ["ICJIA R&A Staff"] }, renderToHtml);
    expect(out.contributors[0]).toEqual({ title: "ICJIA R&A Staff" });
  });
  it("shapeAppRow: live listing rows get the SAME normalization (parity + scheme guard on :href)", () => {
    const row = shapeAppRow({ ...base, contributors: contribs });
    expect(row.contrib![0].url).toBeUndefined();
    expect(row.contrib![1].url).toBe("#");
    expect(row.contrib![2].url).toBe("https://ok.example");
    expect(shapeAppRow({ ...base, contributors: ["Solo"] }).contrib).toEqual([{ title: "Solo" }]);
  });
});

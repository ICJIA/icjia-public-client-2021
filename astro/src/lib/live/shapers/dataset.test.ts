// Dataset shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. PURE-HELPER correctness — the formatters duplicated into this client-safe
//      shaper from research.ts (formatResearchDate, truncateBySentence,
//      isNewResearch, categoriesArray, hubFileUrl, hubRelated) are NOT exported by
//      research.ts (module-private `function` decls), so they can't be imported for
//      an import-equality drift guard like grant.test.ts uses. Instead we pin their
//      behaviour here against the documented research.ts semantics — the live-detail
//      render cannot silently diverge from the nightly-built page.
//   2. shapeDataset correctness — maps a raw researchhub Strapi v3 REST/GraphQL
//      record to the same shape research.ts's getDataset() returns: list-item base +
//      filtered sources + timeperiod/notes/variables passthrough + rendered citation
//      + datafile URL + sorted related.
import { describe, it, expect } from "vitest";
import {
  formatResearchDate,
  truncateBySentence,
  isNewResearch,
  categoriesArray,
  hubFileUrl,
  hubRelated,
  shapeDataset,
} from "./dataset";
import { renderToHtml } from "../../markdown.js";

describe("dataset shaper — pure-helper correctness (research.ts parity)", () => {
  it("formatResearchDate: full month, zero-padded day, year (UTC calendar day)", () => {
    expect(formatResearchDate("2026-05-20T00:00:00.000Z")).toBe("May 20, 2026");
    expect(formatResearchDate("2026-01-05T00:00:00.000Z")).toBe("January 05, 2026");
    expect(formatResearchDate("")).toBe("");
    expect(formatResearchDate(undefined)).toBe("");
    expect(formatResearchDate("not-a-date")).toBe("");
  });

  it("truncateBySentence: first n sentences only when strictly more than n", () => {
    // Faithful research.ts behaviour: each regex match keeps its leading space, and
    // the slices are re-joined with " ", so a truncated result has a double space
    // between sentences. (Verbatim port — must match, not "fix".)
    expect(truncateBySentence("One. Two. Three.", 2)).toBe("One.  Two.");
    expect(truncateBySentence("One. Two.", 2)).toBe("One. Two."); // not > n → full string verbatim
    expect(truncateBySentence("Only one sentence with no period", 2)).toBe(
      "Only one sentence with no period",
    );
    expect(truncateBySentence("", 2)).toBe("");
    expect(truncateBySentence(undefined, 2)).toBe("");
  });

  it("isNewResearch: ≤10 days → true; older/invalid → false", () => {
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 20 * 86_400_000).toISOString();
    expect(isNewResearch(now)).toBe(true);
    expect(isNewResearch(old)).toBe(false);
    expect(isNewResearch("")).toBe(false);
    expect(isNewResearch(undefined)).toBe(false);
    expect(isNewResearch("not-a-date")).toBe(false);
  });

  it("categoriesArray: array → uppercased; comma-string → split+upper; else []", () => {
    expect(categoriesArray(["a", "b"])).toEqual(["A", "B"]);
    expect(categoriesArray("corrections, law enforcement")).toEqual([
      "CORRECTIONS",
      "LAW ENFORCEMENT",
    ]);
    expect(categoriesArray(["", "x"])).toEqual(["X"]); // filter falsy
    expect(categoriesArray(undefined)).toEqual([]);
    expect(categoriesArray(123)).toEqual([]);
  });

  it("hubFileUrl: HUB /uploads/{hash}{ext} or null", () => {
    expect(hubFileUrl({ hash: "abc", ext: ".csv" })).toBe(
      "https://researchhub.icjia-api.cloud/uploads/abc.csv",
    );
    expect(hubFileUrl({ hash: "abc" })).toBe(
      "https://researchhub.icjia-api.cloud/uploads/abc",
    );
    expect(hubFileUrl(null)).toBeNull();
    expect(hubFileUrl({})).toBeNull();
  });

  it("hubRelated: '[Type]: title' → route, sorted, slug-filtered", () => {
    expect(
      hubRelated(
        [
          { title: "Zed", slug: "zed" },
          { title: "Alpha", slug: "alpha" },
          { title: "NoSlug" }, // dropped (no slug)
        ],
        "App",
        "/researchhub/apps/",
      ),
    ).toEqual([
      { displayTitle: "[App]: Alpha", fullPath: "/researchhub/apps/alpha/" },
      { displayTitle: "[App]: Zed", fullPath: "/researchhub/apps/zed/" },
    ]);
    expect(hubRelated(null, "App", "/x/")).toEqual([]);
  });
});

describe("dataset shaper — shapeDataset correctness (getDataset parity)", () => {
  const raw = {
    id: 7,
    title: "Crime & Justice Dataset",
    slug: "crime-justice-dataset",
    date: "2026-05-20T00:00:00.000Z",
    description: "Indicators. Two. Three sentences total.",
    external: "yes",
    categories: ["corrections", "law enforcement"],
    tags: ["crime", "data"],
    project: "proj",
    timeperiod: { yearmin: 2010, yearmax: 2024, yeartype: "calendar" },
    sources: [
      { title: "A", url: "https://a.example" },
      { title: "Bad", url: "undefined" }, // filtered out
    ],
    notes: ["n1"],
    variables: [{ name: "year" }],
    funding: "Funded.",
    citation: "**cite**",
    datafile: { hash: "h1", ext: ".csv" },
    apps: [{ title: "App1", slug: "app1" }],
    articles: [{ title: "Art1", slug: "art1" }],
  };

  it("maps every field to the getDataset shape", () => {
    const out = shapeDataset(raw, renderToHtml);
    expect(out.id).toBe("7");
    expect(out.fullPath).toBe("/researchhub/datasets/crime-justice-dataset/");
    expect(out.dateLabel).toBe("May 20, 2026");
    expect(out.teaser).toBe("Indicators.  Two."); // 3 sentences → first 2 (double space, verbatim)
    expect(out.categories).toEqual(["CORRECTIONS", "LAW ENFORCEMENT"]);
    expect(out.tags).toEqual(["crime", "data"]);
    expect(out.project).toBe("proj");
    expect(out.timeperiod).toEqual({ yearmin: 2010, yearmax: 2024, yeartype: "calendar" });
    // sources filters the literal "undefined" url.
    expect(out.sources).toEqual([{ title: "A", url: "https://a.example" }]);
    expect(out.notes).toEqual(["n1"]);
    expect(out.variables).toEqual([{ name: "year" }]);
    expect(out.dataFileUrl).toBe("https://researchhub.icjia-api.cloud/uploads/h1.csv");
    // related: apps then articles, each sorted; citation rendered to HTML.
    expect(out.related).toEqual([
      { displayTitle: "[App]: App1", fullPath: "/researchhub/apps/app1/" },
      { displayTitle: "[Article]: Art1", fullPath: "/researchhub/articles/art1/" },
    ]);
    expect(out.citation).toContain("<strong>cite</strong>");
  });

  it("citation passthrough when empty (no render)", () => {
    const out = shapeDataset({ ...raw, citation: "" }, renderToHtml);
    expect(out.citation).toBe("");
  });

  it("non-array sources/notes/variables tolerated", () => {
    const out = shapeDataset(
      { ...raw, sources: undefined, datafile: null, apps: undefined, articles: undefined },
      renderToHtml,
    );
    expect(out.sources).toEqual([]);
    expect(out.dataFileUrl).toBeNull();
    expect(out.related).toEqual([]);
  });
});

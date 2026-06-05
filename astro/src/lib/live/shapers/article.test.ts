// ResearchHub article shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — the pure helpers duplicated into this client-safe shaper
//      (formatResearchDate / isNewResearch / joinAuthors / categoriesArray /
//      hubFileUrl) must stay identical to research.ts's build originals, so the
//      live-detail render cannot silently diverge from the nightly-built page.
//      research.ts does NOT export them (and is server-only → cannot be imported
//      here), so they are pinned to research.ts's EXACT documented behavior with
//      explicit reference values — the strongest guard available without editing
//      research.ts (which the spec forbids). These expectations mirror the logic at
//      src/lib/research.ts: formatResearchDate (~L66), isNewResearch (~L97),
//      joinAuthors (~L87), categoriesArray (~L225), hubFileUrl (~L236).
//   2. CORRECTNESS — shapeArticle maps a raw HUB REST record to the expected
//      ArticleItem (the subset of research.ts getArticle() output that ArticleView
//      reads): rendered/sanitized abstract+citation+body, image ref-link appends,
//      flattened authors/categories/tags, resolved download URLs, raw splash, and
//      imgPath null on the transient render.
import { describe, it, expect } from "vitest";
import {
  formatResearchDate,
  isNewResearch,
  joinAuthors,
  categoriesArray,
  hubFileUrl,
  shapeArticle,
} from "./article";
import { renderToHtml } from "../../markdown.js";

describe("article shaper — pure-helper drift guard (vs research.ts behavior)", () => {
  it("formatResearchDate: full month, zero-padded day, year (UTC-origin date)", () => {
    // research.ts: tz-offset-adjusted calendar day. On the test runner (UTC) the
    // offset is 0, so a midnight-UTC date renders its own day.
    expect(formatResearchDate("2015-08-18T00:00:00.000Z")).toBe("August 18, 2015");
    expect(formatResearchDate("2026-05-22T00:00:00.000Z")).toBe("May 22, 2026");
    expect(formatResearchDate("2026-01-05T00:00:00.000Z")).toBe("January 05, 2026");
    expect(formatResearchDate("")).toBe("");
    expect(formatResearchDate(undefined)).toBe("");
    expect(formatResearchDate("not-a-date")).toBe("");
  });

  it("isNewResearch: ≤10 days since date", () => {
    const now = Date.now();
    const days = (n: number) => new Date(now - n * 86_400_000).toISOString();
    expect(isNewResearch(days(3))).toBe(true);
    expect(isNewResearch(days(9))).toBe(true);
    expect(isNewResearch(days(30))).toBe(false);
    expect(isNewResearch(undefined)).toBe(false);
    expect(isNewResearch("nope")).toBe(false);
  });

  it("joinAuthors: Oxford-comma join of .title", () => {
    expect(joinAuthors(undefined)).toBe("");
    expect(joinAuthors([])).toBe("");
    expect(joinAuthors([{ title: "A" }])).toBe("A");
    expect(joinAuthors([{ title: "A" }, { title: "B" }])).toBe("A and B");
    expect(joinAuthors([{ title: "A" }, { title: "B" }, { title: "C" }])).toBe("A, B, and C");
    // empty/missing titles are filtered out before joining
    expect(joinAuthors([{ title: "A" }, { title: "" }, { title: "C" }])).toBe("A and C");
  });

  it("categoriesArray: array → uppercased; comma-string → split+upper; else []", () => {
    expect(categoriesArray(["other", "violence prevention"])).toEqual([
      "OTHER",
      "VIOLENCE PREVENTION",
    ]);
    expect(categoriesArray("a, b ,c")).toEqual(["A", "B", "C"]);
    expect(categoriesArray("")).toEqual([]);
    expect(categoriesArray(undefined)).toEqual([]);
    expect(categoriesArray(123)).toEqual([]);
  });

  it("hubFileUrl: {HUB_UPLOADS}/{hash}{ext}; null without a hash", () => {
    expect(hubFileUrl({ hash: "h-123", ext: ".pdf" })).toBe(
      "https://researchhub.icjia-api.cloud/uploads/h-123.pdf",
    );
    expect(hubFileUrl({ hash: "h-123" })).toBe(
      "https://researchhub.icjia-api.cloud/uploads/h-123",
    );
    expect(hubFileUrl(null)).toBe(null);
    expect(hubFileUrl(undefined)).toBe(null);
    expect(hubFileUrl({ ext: ".pdf" })).toBe(null);
  });
});

describe("article shaper — shapeArticle correctness", () => {
  const raw = {
    id: "5da0e173551f4c3d4ac159ac",
    title: "Evaluation of Youth Summer Job Program",
    slug: "evaluation-of-youth-summer-job-program",
    date: "2015-08-18T00:00:00.000Z",
    external: true,
    categories: ["other"],
    tags: ["juvenile", "evaluation", "prevention"],
    authors: [
      { title: "Jessica Reichert", description: "Manages ICJIA's research center." },
      { title: "Co Author", description: "" },
    ],
    images: [{ title: "figure1", src: "data:image/png;base64,AAAA" }],
    abstract: "A concise abstract.",
    markdown: "## Background\n\nText with a reference ![fig][figure1].",
    splash: "data:image/jpeg;base64,/9j/AAAA",
    thumbnail: "data:image/jpeg;base64,/9j/BBBB",
    citation: "Reichert, J. (2015). Evaluation.",
    doi: "https://doi.org/10.1/x",
    funding: "Funded by ICJIA.",
    mainfiletype: "full report",
    mainfile: { hash: "YEP_Report_0815-191011T20092384", ext: ".pdf" },
    extrafile: null,
  };

  it("maps a raw HUB REST record to an ArticleItem (research.ts getArticle parity)", () => {
    const a = shapeArticle(raw, renderToHtml);
    expect(a.id).toBe(raw.id);
    expect(a.title).toBe(raw.title);
    expect(a.slug).toBe(raw.slug);
    expect(a.fullPath).toBe(
      "/researchhub/articles/evaluation-of-youth-summer-job-program/",
    );
    expect(a.authors).toBe("Jessica Reichert and Co Author");
    expect(a.authorBios).toEqual([
      { title: "Jessica Reichert", description: "Manages ICJIA's research center." },
      { title: "Co Author", description: "" },
    ]);
    expect(a.date).toBe(raw.date);
    expect(a.dateLabel).toBe("August 18, 2015");
    expect(a.categories).toEqual(["OTHER"]);
    expect(a.tags).toEqual(["juvenile", "evaluation", "prevention"]);
    expect(a.external).toBe(true as any);
    expect(a.doi).toBe("https://doi.org/10.1/x");
    expect(a.funding).toBe("Funded by ICJIA.");
    expect(a.mainFileType).toBe("full report");
    expect(a.mainFileUrl).toBe(
      "https://researchhub.icjia-api.cloud/uploads/YEP_Report_0815-191011T20092384.pdf",
    );
    expect(a.extraFileUrl).toBe(null);
    // §4: transient render → no build manifest → imgPath null, raw splash passthrough.
    expect(a.imgPath).toBe(null);
    expect(a.splash).toBe("data:image/jpeg;base64,/9j/AAAA");
    expect(a.thumbnail).toBe("data:image/jpeg;base64,/9j/BBBB");
    // abstract + citation rendered + sanitized (wrapped in <p>), like research.ts.
    expect(a.abstract).toMatch(/<p>A concise abstract\.<\/p>/);
    expect(a.citation).toMatch(/<p>Reichert, J\. \(2015\)\. Evaluation\.<\/p>/);
    // body: markdown rendered with the image appended as a reference-link def, so the
    // ![fig][figure1] reference resolves to a figure (anchored h2 from the heading).
    expect(a.bodyHtml).toMatch(/<h2[^>]*id="background"/);
    expect(a.bodyHtml).toMatch(/data:image\/png;base64,AAAA/);
  });

  it("empty optional fields stay falsy / empty (no body, no images, no files)", () => {
    const a = shapeArticle(
      { id: "7", title: "Bare", slug: "bare", categories: [], tags: [] },
      renderToHtml,
    );
    expect(a.bodyHtml).toBe("");
    expect(a.abstract).toBeUndefined();
    expect(a.citation).toBeUndefined();
    expect(a.authors).toBe("");
    expect(a.authorBios).toEqual([]);
    expect(a.categories).toEqual([]);
    expect(a.tags).toEqual([]);
    expect(a.splash).toBe(null);
    expect(a.thumbnail).toBe(null);
    expect(a.mainFileUrl).toBe(null);
    expect(a.extraFileUrl).toBe(null);
    expect(a.dateLabel).toBe("");
  });
});

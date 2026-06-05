// News-post shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — the pure helpers duplicated into this client-safe shaper
//      (shapeAttachments / buildRelated) must stay identical to data.ts's build
//      originals, so the live-detail render cannot silently diverge from the
//      nightly-built page. (buildToc is a private fn in data.ts — not exported —
//      so it's covered by the correctness test below rather than a drift diff.)
//   2. CORRECTNESS — shapePost maps a raw Strapi v3 REST record to the expected
//      PostItem (body render, publication date, splash raw-URL, attachments,
//      related, tags, TOC), matching getNewsPost's output shape.
import { describe, it, expect } from "vitest";
import {
  shapeAttachments as d_attach,
  buildRelated as d_related,
} from "../../data";
import {
  shapeAttachments as s_attach,
  buildRelated as s_related,
  buildToc,
  shapePost,
} from "./post";
import { renderToHtml } from "../../markdown.js";

describe("post shaper — drift guard vs data.ts originals", () => {
  it("shapeAttachments matches (sorted, absolutized url, ext, niceBytes, dateFormatAlt)", () => {
    const arr = [
      { name: "Zeta.pdf", url: "/uploads/z.pdf", ext: ".PDF", size: 122880, updated_at: "2026-06-01T12:00:00.000Z" },
      { name: "Alpha.docx", url: "https://x.com/a.docx", ext: ".docx", size: 5_400_000, updated_at: "2026-06-02" },
      { name: "Mid.xlsx", url: "/uploads/m.xlsx", ext: "xlsx", size: 0 },
    ];
    expect(s_attach(arr)).toEqual(d_attach(arr));
    expect(s_attach(undefined)).toEqual(d_attach(undefined));
  });

  it("buildRelated matches (all relation kinds, sorted by displayTitle)", () => {
    const content = {
      events: [{ title: "Ev", slug: "ev" }],
      meetings: [{ title: "Mtg", slug: "mtg" }],
      posts: [{ title: "Post", slug: "post" }],
      grants: [{ title: "Grant", slug: "grant" }],
      programs: [{ title: "Prog", slug: "prog" }],
      biographies: [{ title: "Bio", slug: "bio" }],
    };
    expect(s_related(content)).toEqual(d_related(content));
    expect(s_related({})).toEqual(d_related({}));
  });
});

describe("post shaper — shapePost correctness", () => {
  const raw = {
    id: 42,
    slug: "icjia-launches-new-tool",
    title: "ICJIA Launches New Tool & Dashboard",
    summary: "A short summary.",
    body: "## Overview\n\nIntro.\n\n## Details\n\nMore.",
    showTOC: true,
    category: "pressRelease",
    dateOverride: "",
    published_at: "2026-05-05T12:00:00.000Z",
    updated_at: "2026-05-06T12:00:00.000Z",
    hideSplash: false,
    splash: {
      url: "/uploads/hero_orig.png",
      alternativeText: "Hero alt",
      caption: "Photo: ICJIA",
      formats: { large: { url: "/uploads/large.png", width: 1000, height: 500 } },
    },
    attachmentLabel: "",
    attachments: [
      { name: "Doc.pdf", url: "/uploads/doc.pdf", ext: ".pdf", size: 122880, updated_at: "2026-06-01T12:00:00.000Z" },
    ],
    posts: [{ title: "Related Post", slug: "related-post" }],
    tags: [{ title: "data" }, { title: "tools" }],
  };

  it("maps the record to a PostItem", () => {
    const p = shapePost(raw, renderToHtml);
    expect(p.id).toBe("42");
    expect(p.slug).toBe("icjia-launches-new-tool");
    expect(p.catLabel).toBe("Press Release");
    expect(p.showTOC).toBe(true);
    // dateOverride empty → published_at → formatNewsDate "May 05, 2026".
    expect(p.publicationDate).toBe("May 05, 2026");
    expect(p.tags).toEqual(["data", "tools"]);
    expect(p.attachmentLabel).toBe("");
    expect(p.attachments).toHaveLength(1);
    expect(p.attachments[0]).toMatchObject({
      name: "Doc.pdf",
      url: "https://agency.icjia-api.cloud/uploads/doc.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jun 01, 2026",
    });
    expect(p.related).toEqual([
      { displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" },
    ]);
    // splash → RAW Strapi URL (§4 deviation), alt from alternativeText, caption.
    expect(p.splash).toEqual({
      url: "https://agency.icjia-api.cloud/uploads/hero_orig.png",
      alt: "Hero alt",
      caption: "Photo: ICJIA",
    });
    // body rendered via the injected pipeline (heading anchors present).
    expect(p.safeBodyHtml).toMatch(/<h2[^>]*id="overview"/);
    // TOC built from the body h2s (markdown-it-anchor ids).
    expect(p.toc).toEqual([
      { id: "overview", text: "Overview" },
      { id: "details", text: "Details" },
    ]);
  });

  it("dateOverride wins over published_at when set", () => {
    const p = shapePost({ ...raw, dateOverride: "2025-12-25" }, renderToHtml);
    expect(p.publicationDate).toBe("December 25, 2025");
  });

  it("hideSplash drops the splash (null)", () => {
    const p = shapePost({ ...raw, hideSplash: true }, renderToHtml);
    expect(p.splash).toBeNull();
    expect(p.hideSplash).toBe(true);
  });

  it("no splash record → null", () => {
    const p = shapePost({ ...raw, splash: null }, renderToHtml);
    expect(p.splash).toBeNull();
  });

  it("splash without alternativeText falls back to the default alt", () => {
    const p = shapePost(
      { ...raw, splash: { url: "/uploads/h.png" } },
      renderToHtml,
    );
    expect(p.splash).toEqual({
      url: "https://agency.icjia-api.cloud/uploads/h.png",
      alt: "ICJIA Internet news item image",
      caption: undefined,
    });
  });

  it("buildToc skips headings inside #disclaimer", () => {
    const html =
      '<h2 id="keep">Keep</h2><div id="disclaimer"><h2 id="drop">Drop</h2></div>';
    expect(buildToc(html)).toEqual([{ id: "keep", text: "Keep" }]);
    expect(buildToc("")).toEqual([]);
  });
});

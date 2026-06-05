// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderArticleView(item) must produce the SAME HTML as the real
// researchhub/ArticleView.astro (which composes ArticleToc + MarkerExternal +
// InfoBlock) for the same shaped article, so a live-detail-fallback article looks
// identical to the nightly-built page. Rendered via the Astro Container API; we
// slice the real component's #article-view subtree (everything BEFORE the trailing
// ScholarlyArticle JSON-LD <script> — which the twin intentionally omits, along with
// the footnote/print inline scripts + scoped <style>) and diff after normalization.
//
// norm() (extends meeting/post.parity.test.ts) strips the INVISIBLE dev/prod diffs —
// data-astro-source-* and data-astro-cid-* (scoped-style hash, stripped in prod) —
// plus the cmstbl<n> table counter and insignificant whitespace. The §4 HERO is the
// base64 SPLASH-ISLAND branch (imgPath null on a transient render), which is fully
// reproducible client-side, so the hero is byte-matched; the volatile <img>
// src/srcset/etc. are still stripped on BOTH sides (defensive, mirrors post.parity).
//
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import "../../markdown.js"; // installs globalThis.DOMParser (linkedom) for the container render
import ArticleView from "../../../components/researchhub/ArticleView.astro";
import { renderToHtml } from "../../markdown.js";
import { renderArticleView, renderArticleDetail } from "./article";
import { shapeArticle, type ArticleItem } from "../shapers/article";

const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[\w-]+(?:="[^"]*")?/g, "")
    .replace(/\s+(?:src|srcset|width|height|loading|decoding)="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// Render the REAL ArticleView component and return only its #article-view subtree
// (drop the trailing JSON-LD <script> + footnote/print scripts + scoped <style>).
async function realView(item: ArticleItem): Promise<string> {
  const c = await AstroContainer.create();
  // ArticleView's prop is ResearchArticleDetail; ArticleItem is a structural subset
  // with identical field names → satisfies every property the component reads.
  const html = await c.renderToString(ArticleView, { props: { article: item as any } });
  const end = html.indexOf('<script type="application/ld+json"');
  if (end === -1) throw new Error("could not locate JSON-LD boundary in ArticleView");
  return html.slice(0, end);
}

// A rendered body with two <h2 id> headings (markdown-it-anchor ids) so the TOC and
// the twin's heading-extraction regex both have anchors to work with.
const bodyHtml = renderToHtml(
  "## Overview\n\nIntro text.\n\n## Findings\n\nMore text with a [link](https://example.com).",
);

const full: ArticleItem = {
  id: "101",
  title: "Evaluation of the Program & Its Outcomes",
  slug: "evaluation-of-the-program",
  fullPath: "/researchhub/articles/evaluation-of-the-program/",
  abstract: "<p>A concise <strong>abstract</strong> of the study.</p>",
  authors: "Jessica Reichert and Jane Doe",
  date: "2026-05-22T00:00:00.000Z",
  dateLabel: "May 22, 2026",
  isNew: false,
  categories: ["VIOLENCE PREVENTION", "CORRECTIONS"],
  tags: ["juvenile", "evaluation & data"],
  external: "true",
  citation: "<p>Reichert, J. (2026). <em>Evaluation</em>.</p>",
  doi: "https://doi.org/10.1234/abc&xyz",
  funding: "Funded by ICJIA under grant #12345.",
  authorBios: [
    { title: "Jessica Reichert", description: "Manages ICJIA's research center." },
    { title: "Jane Doe", description: "Senior research analyst." },
  ],
  imgPath: null,
  splash: "data:image/jpeg;base64,/9j/4AAQSkZJRg<abc>==",
  thumbnail: null,
  bodyHtml,
  mainFileType: "full report",
  mainFileUrl: "https://researchhub.icjia-api.cloud/uploads/report-hash.pdf",
  extraFileUrl: "https://researchhub.icjia-api.cloud/uploads/appendix-hash.pdf",
};

// Edge: no hero, no TOC headings, no downloads, no external, no abstract, no author
// descriptions, no funding/citation, single category, no tags — every empty branch.
const minimal: ArticleItem = {
  id: "102",
  title: "Bare Article",
  slug: "bare-article",
  fullPath: "/researchhub/articles/bare-article/",
  abstract: undefined,
  authors: "",
  date: undefined,
  dateLabel: "",
  isNew: false,
  categories: [],
  tags: [],
  external: undefined,
  citation: undefined,
  doi: undefined,
  funding: undefined,
  authorBios: [{ title: "Anon", description: "" }],
  imgPath: null,
  splash: null,
  thumbnail: null,
  bodyHtml: "<p>Just a paragraph, no headings.</p>",
  mainFileType: undefined,
  mainFileUrl: null,
  extraFileUrl: null,
};

// Edge: downloads present but NO headings (sidebar shows only the download buttons,
// TOC renders nothing), single author with a bio (singular heading), citation w/o DOI.
const downloadsNoToc: ArticleItem = {
  ...minimal,
  id: "103",
  title: "Downloads Only",
  slug: "downloads-only",
  authors: "Solo Author",
  dateLabel: "Jan 01, 2026",
  citation: "<p>Cite me.</p>",
  doi: undefined,
  authorBios: [{ title: "Solo Author", description: "The one author." }],
  mainFileType: "summary",
  mainFileUrl: "https://researchhub.icjia-api.cloud/uploads/summary-hash.pdf",
  extraFileUrl: null,
};

describe("ArticleView twin/component parity", () => {
  it("matches ArticleView.astro — full (hero island + TOC + downloads + all blocks)", async () => {
    expect(norm(renderArticleView(full))).toBe(norm(await realView(full)));
  });

  it("matches ArticleView.astro — minimal (every empty branch)", async () => {
    expect(norm(renderArticleView(minimal))).toBe(norm(await realView(minimal)));
  });

  it("matches ArticleView.astro — downloads sidebar w/o TOC, single author bio", async () => {
    expect(norm(renderArticleView(downloadsNoToc))).toBe(norm(await realView(downloadsNoToc)));
  });
});

describe("renderArticleDetail composition + shaped-record path", () => {
  it("wraps the view in the page's <div class=\"pt-2 pb-12\"> wrapper", () => {
    const html = renderArticleDetail(minimal);
    expect(html.startsWith('<div class="pt-2 pb-12"><div id="article-view">')).toBe(true);
    expect(html.endsWith("</div></div>")).toBe(true);
  });

  it("shapeArticle(raw REST) → renderArticleView matches the component", async () => {
    // Raw HUB REST record (field shape verified live against /articles?status=published).
    const raw = {
      id: "5da0e173",
      title: "Youth Summer Job Program",
      slug: "youth-summer-job-program",
      date: "2015-08-18T00:00:00.000Z",
      external: false,
      categories: ["other"],
      tags: ["juvenile", "evaluation"],
      authors: [{ title: "Jessica Reichert", description: "Manages the research center." }],
      images: [{ title: "figure1", src: "data:image/png;base64,AAAA" }],
      abstract: "An abstract.",
      markdown: "## Background\n\nText referencing ![fig][figure1].",
      splash: "data:image/jpeg;base64,/9j/AAAA",
      thumbnail: "data:image/jpeg;base64,/9j/BBBB",
      citation: "Reichert, J. (2015).",
      doi: "",
      funding: "",
      mainfiletype: "full report",
      mainfile: { hash: "YEP_Report_0815-191011T20092384", ext: ".pdf" },
      extrafile: null,
    };
    const item = shapeArticle(raw, renderToHtml);
    // Spot-check the shaper reproduced research.ts getArticle output.
    expect(item.fullPath).toBe("/researchhub/articles/youth-summer-job-program/");
    expect(item.authors).toBe("Jessica Reichert");
    expect(item.categories).toEqual(["OTHER"]);
    expect(item.dateLabel).toBe("August 18, 2015");
    expect(item.imgPath).toBe(null);
    expect(item.splash).toBe("data:image/jpeg;base64,/9j/AAAA");
    expect(item.mainFileUrl).toBe(
      "https://researchhub.icjia-api.cloud/uploads/YEP_Report_0815-191011T20092384.pdf",
    );
    expect(item.extraFileUrl).toBe(null);
    // abstract sanitized+rendered (wrapped in <p>); empty doi/funding/citation falsy.
    expect(item.abstract).toMatch(/<p>An abstract\.<\/p>/);
    expect(item.citation).toMatch(/Reichert/);
    // And the twin still matches the real component for the shaped record.
    expect(norm(renderArticleView(item))).toBe(norm(await realView(item)));
  });
});

// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin for a news
// post must produce the SAME HTML as the real news/[slug].astro composition, so a
// live-detail-fallback post looks identical to the nightly-built page. The page
// composes four components — Splash, PageToc, AttachmentList, RelatedList — plus a
// small wrapper (meta header + h1 + body grid) defined inline in the page. We lock
// each COMPONENT's markup here via the Astro Container API (render the real .astro,
// diff the twin fragment), covering the with/without toggles, then assert the full
// renderPostDetail composes those fragments for the splash/toc/attachments/related
// permutations.
//
// norm() (extends meeting.parity.test.ts) strips the two INVISIBLE dev/prod diffs —
// data-astro-source-* and data-astro-cid-* (scoped-style hash, stripped in prod) —
// plus the cmstbl<n> counter and insignificant whitespace, AND the accepted §4
// SPLASH image deviation: the real <img> uses an astro:assets-optimized /_image
// URL (src + width/height + loading/decoding + data-image-component); the twin uses
// the raw Strapi URL. Those volatile <img> attributes are stripped on BOTH sides so
// only the stable markup (tag position, alt, class) is compared. Body/TOC/headings
// still match exactly.
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import "../../markdown.js"; // installs globalThis.DOMParser (linkedom) for buildToc parity w/ build
import Splash from "../../../components/Splash.astro";
import PageToc from "../../../components/PageToc.astro";
import AttachmentList from "../../../components/AttachmentList.astro";
import RelatedList from "../../../components/RelatedList.astro";
import { renderToHtml } from "../../markdown.js";
import {
  renderSplash,
  renderPageToc,
  renderAttachmentList,
  renderRelatedList,
  renderPostDetail,
} from "./post";
import { shapePost } from "../shapers/post";

const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[\w-]+(?:="[^"]*")?/g, "")
    // §4 splash <img>: strip the build-vs-transient volatile attributes on both
    // sides (optimized /_image src + dimensions + loading/decoding + the
    // data-image-component marker) so only stable markup is compared.
    .replace(/\s+(?:src|srcset|width|height|loading|decoding)="[^"]*"/g, "")
    .replace(/\s+data-image-component="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// ── Splash.astro parity (raw-URL <img>, normalized; + caption / no-caption) ────
describe("Splash twin/component parity", () => {
  const splashFull = {
    url: "/uploads/hero_orig.png",
    width: 1600,
    height: 800,
    alternativeText: "A hero alt & label",
    caption: "Photo: ICJIA",
    formats: {
      large: { url: "/uploads/large_hero.png", width: 1000, height: 500 },
      medium: { url: "/uploads/medium_hero.png", width: 750, height: 375 },
      small: { url: "/uploads/small_hero.png", width: 500, height: 250 },
    },
  };
  const twinSplashFull = {
    url: "https://agency.icjia-api.cloud/uploads/hero_orig.png",
    alt: "A hero alt & label",
    caption: "Photo: ICJIA",
  };

  it("matches Splash.astro — with caption", async () => {
    const c = await AstroContainer.create();
    const real = await c.renderToString(Splash, { props: { splash: splashFull } });
    expect(norm(renderSplash(twinSplashFull))).toBe(norm(real));
  });

  it("matches Splash.astro — no caption", async () => {
    const c = await AstroContainer.create();
    const { caption, ...noCap } = splashFull;
    const real = await c.renderToString(Splash, { props: { splash: noCap } });
    expect(norm(renderSplash({ url: twinSplashFull.url, alt: twinSplashFull.alt }))).toBe(
      norm(real),
    );
  });
});

// ── AttachmentList.astro parity (hideUpdated, as NewsSingle passes) ────────────
describe("AttachmentList twin/component parity", () => {
  const items = [
    {
      name: "Report & Data.pdf",
      url: "https://agency.icjia-api.cloud/uploads/report.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jun 01, 2026",
    },
    {
      name: "Slides.pptx",
      url: "https://agency.icjia-api.cloud/uploads/slides.pptx",
      ext: "pptx",
      niceSize: "2.0 MB",
      updatedAlt: "Jun 02, 2026",
    },
  ];

  it("matches AttachmentList.astro — hideUpdated, default label", async () => {
    const c = await AstroContainer.create();
    const real = await c.renderToString(AttachmentList, {
      props: { items, label: "Attachments", hideUpdated: true },
    });
    expect(norm(renderAttachmentList(items, "", true))).toBe(norm(real));
  });

  it("matches AttachmentList.astro — hideUpdated, custom label", async () => {
    const c = await AstroContainer.create();
    const real = await c.renderToString(AttachmentList, {
      props: { items, label: "Documents", hideUpdated: true },
    });
    expect(norm(renderAttachmentList(items, "Documents", true))).toBe(norm(real));
  });
});

// ── RelatedList.astro parity ──────────────────────────────────────────────────
describe("RelatedList twin/component parity", () => {
  const items = [
    { displayTitle: "[News]: Another Post", fullPath: "/news/another-post/" },
    { displayTitle: "[Meeting]: Board Agenda", fullPath: "/news/meetings/board-agenda/" },
  ];
  it("matches RelatedList.astro", async () => {
    const c = await AstroContainer.create();
    const real = await c.renderToString(RelatedList, { props: { items } });
    expect(norm(renderRelatedList(items))).toBe(norm(real));
  });
});

// ── PageToc.astro parity (x-data + links; default heading) ─────────────────────
describe("PageToc twin/component parity", () => {
  const items = [
    { id: "agenda", text: "Agenda & Notes" },
    { id: "minutes", text: "Minutes" },
  ];
  it("matches PageToc.astro", async () => {
    const c = await AstroContainer.create();
    const real = await c.renderToString(PageToc, { props: { items } });
    expect(norm(renderPageToc(items))).toBe(norm(real));
  });
});

// ── Full composition: renderPostDetail wires the parity-locked fragments for the
//    splash/toc/attachments/related permutations (shaped from a raw Strapi record). ─
describe("renderPostDetail composition (shaped record)", () => {
  const rawBase = {
    id: 42,
    slug: "icjia-launches-new-tool",
    title: "ICJIA Launches New Tool & Dashboard",
    summary: "A short summary.",
    body: "## Overview\n\nBody text with a [link](https://example.com).\n\n## Details\n\nMore.",
    showTOC: true,
    category: "pressRelease",
    dateOverride: "",
    published_at: "2026-05-05T12:00:00.000Z",
    updated_at: "2026-05-06T12:00:00.000Z",
    hideSplash: false,
    splash: {
      url: "/uploads/hero_orig.png",
      alternativeText: "Hero",
      caption: "Cap",
      formats: { large: { url: "/uploads/large.png", width: 1000, height: 500 } },
    },
    attachmentLabel: "",
    attachments: [
      {
        name: "Doc.pdf",
        url: "/uploads/doc.pdf",
        ext: ".pdf",
        size: 122880,
        updated_at: "2026-06-01T12:00:00.000Z",
      },
    ],
    posts: [{ title: "Related", slug: "related" }],
    tags: [{ title: "data" }, { title: "tools" }],
  };

  const render = (raw: any) => renderPostDetail(shapePost(raw, renderToHtml));

  it("full record: splash + TOC sidebar + attachments + related + tags", () => {
    const item = shapePost(rawBase, renderToHtml);
    const html = renderPostDetail(item);
    // splash + grid (flex, has toc) + body col (min-w-0) + sidebar present.
    expect(html).toContain('<div class="splash-bleed">');
    expect(html).toContain('class="md:flex md:items-start md:gap-[109px]"');
    expect(html).toContain('class="md:min-w-0 md:flex-1"');
    expect(html).toContain('<aside class="mt-8 md:mt-0 md:w-[270px] md:shrink-0">');
    expect(html).toContain('<nav class="page-toc hidden md:block"');
    expect(html).toContain('<div class="attachment-list">');
    expect(html).toContain('<div class="related-list">');
    expect(html).toContain('<a class="chip" href="/search/?q=data">data</a>');
    // body is the injected-render output (anchored h2 from markdown-it-anchor).
    expect(html).toMatch(/<h2[^>]*id="overview"/);
    // catLabel kicker + publication date header.
    expect(html).toContain('<span class="category">PRESS RELEASE</span> | May 05, 2026');
  });

  it("no splash: grid gets the -mt-[15px] nudge, no splash-bleed", () => {
    const html = render({ ...rawBase, hideSplash: true });
    expect(html).not.toContain("splash-bleed");
    // showToc still true → grid has BOTH -mt and the flex classes.
    expect(html).toContain('class="-mt-[15px] md:flex md:items-start md:gap-[109px]"');
  });

  it("no TOC: no sidebar, body col + grid have no class attr", () => {
    const html = render({ ...rawBase, showTOC: false });
    expect(html).not.toContain("page-toc");
    expect(html).not.toContain("<aside");
    // splash present + no toc → grid class:list empty → bare <div>; body col bare
    // too. After the splash-caption close, the grid + body-col are both bare divs.
    expect(html).toContain('<div class="splash-caption">Cap</div></div><div><div><div class="news-meta">');
  });

  it("no attachments / no related: those blocks are omitted", () => {
    const html = render({ ...rawBase, attachments: [], posts: [] });
    expect(html).not.toContain("attachment-list");
    expect(html).not.toContain("related-list");
    // the wrapper divs still render (mt-12 / mt-10), just empty.
    expect(html).toContain('<div class="mt-12"><div class="mt-10"></div></div>');
  });
});

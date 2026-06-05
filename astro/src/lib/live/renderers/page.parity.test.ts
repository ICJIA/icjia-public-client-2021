// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderPageDetail(item) must produce the SAME HTML as the real BasePage.astro for
// the same shaped page, so a live-detail-fallback CMS page looks identical to the
// nightly-built page. ONE twin serves all four section catch-alls — /about/<slug>,
// /grants/<slug>, /irb/<slug>, /innovation-and-digital-services/<slug> — whose
// [slug].astro bodies are IDENTICAL (`<BaseLayout …><BasePage page={page} /></BaseLayout>`,
// differing only in the BaseLayout title/description chrome the 404 shell supplies),
// so they all render the SAME <BasePage>.
//
// Two gates:
//   1. STRICT equality vs the BasePage component rendered DIRECTLY (the shared twin
//      target) via the Astro Container API — full page, minimal page, two-column TOC
//      page, hideTitle page.
//   2. ROUTE-DELEGATION: render the REAL about/[slug].astro (+ spot-check irb/[slug].
//      astro) with getPage()/getAllPages() mocked, and assert the normalized twin
//      output is CONTAINED in the rendered page — proving each route's body delegates
//      to <BasePage> with the same prop (without slicing BaseLayout chrome).
//
// §4 deviations (splash hero via astro:assets; clickthrough icons via astro-icon) are
// NOT exercised here — every sampled real page has neither — so the strict fixtures
// omit them; they're documented in renderers/page.ts.
//
// norm() (same family as grant/article.parity.test.ts) strips the INVISIBLE diffs —
// data-astro-source-* + data-astro-cid-* (scoped-style hash, absent in prod) — the
// cmstbl<n> table counter, and insignificant whitespace.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import "../../markdown.js"; // installs globalThis.DOMParser (linkedom) for buildToc + the container render
import { renderToHtml, renderInline } from "../../markdown.js";
import BasePage from "../../../components/BasePage.astro";
import { renderPageDetail } from "./page";
import { shapePage, type PageItem } from "../shapers/page";

const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[\w-]+(?:="[^"]*")?/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// Shape a raw Strapi page record with the Node build-path renderers — identical to
// what data.ts's getPage feeds the real BasePage, so the twin and the component get
// byte-identical body/title HTML.
const shape = (raw: any): PageItem => shapePage(raw, renderToHtml, renderInline);

// Render the REAL BasePage component (defaults: showSummary=false, hideUpdated=false,
// matching the section [slug].astro `<BasePage page={page} />` call).
async function realBasePage(item: PageItem): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(BasePage, { props: { page: item } });
}

// ── raw fixtures (Strapi `pages` REST shape) ─────────────────────────────────

// Full page: title + body (with an h2 the TOC would pick up IF showTOC) + tags +
// attachments. showTOC false → single column, no aside.
const rawFull = {
  id: 1,
  slug: "foia",
  title: "Freedom of Information Act",
  body: "## Overview\n\nA paragraph with a [link](https://icjia.illinois.gov) and a **bold** word.\n\n## Requests\n\nMore text.",
  summary: "FOIA at ICJIA.",
  showTOC: false,
  attachmentLabel: "",
  attachments: [
    { name: "Beta.pdf", url: "/uploads/beta.pdf", ext: ".pdf", size: 120000, updated_at: "2026-06-01T00:00:00.000Z" },
    { name: "Alpha.docx", url: "https://agency.icjia-api.cloud/uploads/alpha.docx", ext: ".docx", size: 8000, updated_at: "2026-05-01T00:00:00.000Z" },
  ],
  tags: [{ title: "transparency" }, { title: "public records" }],
  published_at: "2026-01-01T00:00:00.000Z",
};

// Minimal page: only a title; every conditional empty branch (no body, no tags, no
// attachments, no TOC, not hidden).
const rawMinimal = {
  id: 2,
  slug: "contact",
  title: "Contact",
  body: "",
  showTOC: false,
  attachments: [],
  tags: [],
};

// TOC page: showTOC true + a body with two h2s → two-column layout + PageToc aside.
const rawToc = {
  id: 3,
  slug: "icjia-committees",
  title: "ICJIA Committees & Boards",
  body: "## First Section\n\nText one.\n\n## Second Section\n\nText two.\n\n### Sub heading\n\nNot in TOC.",
  showTOC: true,
  attachmentLabel: "Documents",
  attachments: [
    { name: "Report.pdf", url: "/uploads/report.pdf", ext: ".pdf", size: 50000, updated_at: "2026-04-01T00:00:00.000Z" },
  ],
  tags: [{ title: "committees" }],
};

// hideTitle page: the <h1> is suppressed.
const rawHidden = {
  id: 4,
  slug: "icjia-values",
  title: "ICJIA Values",
  hideTitle: true,
  body: "## Our Values\n\nIntegrity and service.",
  showTOC: false,
  attachments: [],
  tags: [],
};

describe("renderPageDetail twin / BasePage parity (strict)", () => {
  it("matches BasePage — full page (body + tags + attachments, no TOC)", async () => {
    const item = shape(rawFull);
    expect(norm(renderPageDetail(item))).toBe(norm(await realBasePage(item)));
  });

  it("matches BasePage — minimal page (title only, all empty branches)", async () => {
    const item = shape(rawMinimal);
    expect(norm(renderPageDetail(item))).toBe(norm(await realBasePage(item)));
  });

  it("matches BasePage — two-column TOC page (PageToc aside)", async () => {
    const item = shape(rawToc);
    // sanity: the TOC actually populated (2 h2s, not the h3)
    expect(item.toc.map((t) => t.text)).toEqual(["First Section", "Second Section"]);
    expect(norm(renderPageDetail(item))).toBe(norm(await realBasePage(item)));
  });

  it("matches BasePage — hideTitle page (no h1)", async () => {
    const item = shape(rawHidden);
    expect(norm(renderPageDetail(item))).toBe(norm(await realBasePage(item)));
  });
});

// ── route-delegation gate: the REAL section [slug].astro pages render <BasePage> ──

// One mutable fixture the mocked getPage returns; each test sets CURRENT first.
// (vi.mock is hoisted, so it reads CURRENT lazily.)
let CURRENT: PageItem;
vi.mock("../../data", async (orig) => {
  const actual = await orig<typeof import("../../data")>();
  return {
    ...actual,
    getPage: async () => CURRENT,
    // getStaticPaths isn't run by the Container, but the routes import getAllPages —
    // stub it so the module never reaches a live fetch on import.
    getAllPages: async () => [],
  };
});

// Render a real route page (its default export) and return its full normalized HTML
// (BaseLayout chrome + the <BasePage> content). The twin output (normalized) must be
// a substring of it. Routes import literally (matching the grant parity test) so Vite
// transforms the .astro page; CURRENT is set first (the mocked getPage returns it).
// `slug` is the route param (PageItem carries no slug — getPage's CmsPage drops it —
// so the route's `Astro.params.slug` guard needs it passed explicitly).
async function realRoute(Page: any, slug: string, item: PageItem): Promise<string> {
  CURRENT = item;
  const container = await AstroContainer.create();
  return container.renderToString(Page, { params: { slug } });
}

describe("renderPageDetail / real route body delegation", () => {
  it("about/[slug].astro renders the same <BasePage> content as the twin", async () => {
    const item = shape(rawFull);
    const Page = (await import("../../../pages/about/[slug].astro")).default;
    const page = norm(await realRoute(Page, rawFull.slug, item));
    const twin = norm(renderPageDetail(item));
    expect(page).toContain(twin);
  });

  it("irb/[slug].astro (spot-check) renders the same <BasePage> content as the twin", async () => {
    const item = shape(rawToc);
    const Page = (await import("../../../pages/irb/[slug].astro")).default;
    const page = norm(await realRoute(Page, rawToc.slug, item));
    const twin = norm(renderPageDetail(item));
    expect(page).toContain(twin);
  });
});

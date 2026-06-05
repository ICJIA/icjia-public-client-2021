// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderPublicationDetail(item) must produce the SAME HTML as the real
// about/publications/[slug].astro page content, so a live-detail-fallback
// publication looks identical to the nightly-built page. The detail markup is the
// sr-only h1 + the standalone PublicationCard.astro + the "View all publications »"
// link — all inline in [slug].astro (the page only extracts the card component), so
// we render the REAL PAGE via the Astro Container API — with getPublication() mocked
// to return the fixture instead of hitting Strapi — then slice out the page-content
// region (the .publications div), stopping at the SEO JSON-LD script the twin
// intentionally omits, and diff after the same normalization the meeting/grant
// parity tests use.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { renderPublicationDetail } from "./publication";
import type { PublicationItem } from "../shapers/publication";

// One mutable fixture the mocked getPublication returns; each test sets CURRENT
// before rendering the real page. (vi.mock is hoisted, so it reads CURRENT lazily.)
let CURRENT: PublicationItem;
vi.mock("../../data", async (orig) => {
  const actual = await orig<typeof import("../../data")>();
  return {
    ...actual,
    getPublication: async () => CURRENT,
    // getStaticPaths isn't run by the Container, but the page imports
    // getAllPublicationSlugs — stub it so the module never reaches a live fetch.
    getAllPublicationSlugs: async () => [],
  };
});

// Same normalization as meeting/grant parity tests:
//   1. data-astro-source-{file,loc} — dev-only debug attrs (stripped in prod builds).
//   2. data-astro-cid-* — dev-only scoped-style markers (absent in the twin).
//   3. insignificant tag/text-boundary whitespace (browsers collapse it).
// Plus the stateful contentSanitizer table-id counter (cmstbl<n>) — irrelevant here
// (no markdown tables) but kept for parity with the other gates.
const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[^=]+="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[^\s>]+/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// Render the REAL page and return only its content region (the .publications div),
// dropping BaseLayout chrome and the trailing JSON-LD <script>.
async function realContent(item: PublicationItem): Promise<string> {
  CURRENT = item;
  const Page = (await import("../../../pages/about/publications/[slug].astro")).default;
  const container = await AstroContainer.create();
  const html = await container.renderToString(Page, { params: { slug: item.slug } });
  const start = html.indexOf('<div class="publications');
  // The content div is the LAST thing in <main>; the page's article JSON-LD is
  // CONDITIONAL (BaseLayout omits it when summary+publicationDate are absent — see
  // the `minimal` fixture), so anchor the end on </main>, which always follows.
  const end = html.indexOf("</main>", start);
  if (start === -1 || end === -1 || end < start)
    throw new Error("could not locate publication content region in rendered page");
  // BaseLayout wraps <slot/> in `<div class="min-h-…">…</div>` inside <main>, so the
  // slice picks up that wrapper's closing </div> after the page content — strip the
  // single trailing </div> (+ surrounding whitespace) so we compare ONLY the page body.
  return html.slice(start, end).replace(/\s*<\/div>\s*$/, "");
}

// Full record: local article link + downloadable file + summary + tags (every block).
const full: PublicationItem = {
  id: "4788",
  title: "Assessing the Quality & Completeness of InfoNet Data",
  slug: "assessing-infonet-data",
  summary: "A summary with an <ampersand> & quote \" inside.",
  pubType: "article",
  publicationDate: "2026-06-05",
  tags: ["infonet", "domestic violence", "sexual assault"],
  fileURL: "https://researchhub.icjia-api.cloud/uploads/InfoNet_Data.pdf",
  articleURL:
    "https://icjia.illinois.gov/researchhub/articles/assessing-infonet-data",
  fullPath: "/about/publications/assessing-infonet-data/",
  localArticlePath: "/researchhub/articles/assessing-infonet-data",
  typeLabel: "Article",
  dateAlt: "Jun 05, 2026",
  isNew: true,
  fileType: "PDF",
  haystack: "",
};

// Edge: a file but NO local article (external articleURL → localArticlePath null);
// confirms the Article <li> is omitted while the Download <li> renders.
const fileOnly: PublicationItem = {
  ...full,
  id: "2",
  title: "File Only Report",
  slug: "file-only",
  articleURL: "https://example.com/external-article",
  localArticlePath: null,
  fullPath: "/about/publications/file-only/",
  fileType: "DOCX",
  fileURL: "https://researchhub.icjia-api.cloud/uploads/report.docx",
};

// Edge: no summary, no file, no article, no tags, no date — every empty branch
// ("No summary available", no pub-links ul, no tags div, no date span).
const minimal: PublicationItem = {
  id: "3",
  title: "Bare Publication",
  slug: "bare",
  summary: undefined,
  pubType: undefined,
  publicationDate: undefined,
  tags: [],
  fileURL: undefined,
  articleURL: undefined,
  fullPath: "/about/publications/bare/",
  localArticlePath: null,
  typeLabel: "General",
  dateAlt: "",
  isNew: false,
  fileType: "",
  haystack: "",
};

// Edge: a local article but NO file — confirms the Article <li> renders alone (the
// pub-links ul is present, the Download <li> omitted).
const articleOnly: PublicationItem = {
  ...full,
  id: "4",
  title: "Article Only",
  slug: "article-only",
  fullPath: "/about/publications/article-only/",
  fileURL: undefined,
  fileType: "",
};

describe("renderPublicationDetail twin/page parity", () => {
  it("matches the real [slug].astro — full record (article + file + tags)", async () => {
    expect(norm(renderPublicationDetail(full))).toBe(norm(await realContent(full)));
  });

  it("matches the real [slug].astro — file only (no local article)", async () => {
    expect(norm(renderPublicationDetail(fileOnly))).toBe(
      norm(await realContent(fileOnly)),
    );
  });

  it("matches the real [slug].astro — minimal (all empty branches)", async () => {
    expect(norm(renderPublicationDetail(minimal))).toBe(
      norm(await realContent(minimal)),
    );
  });

  it("matches the real [slug].astro — article only (no file)", async () => {
    expect(norm(renderPublicationDetail(articleOnly))).toBe(
      norm(await realContent(articleOnly)),
    );
  });
});

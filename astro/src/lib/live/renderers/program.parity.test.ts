// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderProgramDetail(item) must produce the SAME HTML as the real
// grants/programs/[slug].astro page content, so a live-detail-fallback program
// looks identical to the nightly-built page. The program page has NO extracted
// component (its markup is inline in [slug].astro), so we render the REAL page via
// the Astro Container API — with getProgram() mocked so it returns the fixture
// instead of hitting Strapi — then slice out the page-content region (the main
// .funding div, stopping at the SEO JSON-LD script the twin intentionally omits)
// and diff after the same normalization the grant parity test uses.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { renderProgramDetail } from "./program";
import type { ProgramItem } from "../shapers/program";

// One mutable fixture the mocked getProgram returns; each test sets CURRENT before
// rendering the real page. (vi.mock is hoisted, so it reads CURRENT lazily.)
let CURRENT: ProgramItem;
vi.mock("../../data", async (orig) => {
  const actual = await orig<typeof import("../../data")>();
  return {
    ...actual,
    getProgram: async () => CURRENT,
    // getStaticPaths isn't run by the Container, but the page imports getAllPrograms
    // — stub it so the module never reaches a live fetch on import.
    getAllPrograms: async () => [],
  };
});

// Same two-invisible-difference normalization as grant.parity.test.ts:
//   1. data-astro-source-{file,loc} — dev-only debug attrs (stripped in prod builds).
//   2. insignificant tag/text-boundary whitespace (browsers collapse it).
// Plus the stateful contentSanitizer table-id counter (cmstbl<n>) — irrelevant here
// (no markdown tables in these fixtures) but kept for parity with the grant gate.
const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// Render the REAL page and return only its content region (the main .funding div),
// dropping BaseLayout chrome and the trailing JSON-LD <script>.
async function realContent(item: ProgramItem): Promise<string> {
  CURRENT = item;
  const Page = (await import("../../../pages/grants/programs/[slug].astro")).default;
  const container = await AstroContainer.create();
  const html = await container.renderToString(Page, { params: { slug: item.slug } });
  const start = html.indexOf('<div class="funding');
  const end = html.indexOf('<script type="application/ld+json"');
  if (start === -1 || end === -1 || end < start)
    throw new Error("could not locate program content region in rendered page");
  return html.slice(start, end);
}

const full: ProgramItem = {
  id: "1",
  slug: "test-program",
  title: "Test Program & Co",
  status: "current",
  category: "federal",
  catLabel: "FEDERAL PROGRAM",
  bodyHtml: "<p>Body paragraph with a <strong>bold</strong> word.</p>",
  summary: "A grant program.",
  published_at: "2026-01-01",
  attachments: [
    {
      name: "Agenda.pdf",
      url: "https://agency.icjia-api.cloud/uploads/agenda.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jun 01, 2026",
    },
  ],
  related: [{ displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" }],
  tags: ["crime", "statistics & data"],
};

// Edge: an archived program with no body, no attachments, no related, no tags —
// exercises every conditional's empty branch.
const minimal: ProgramItem = {
  id: "2",
  slug: "bare-program",
  title: "Bare Program",
  status: "archived",
  category: "state",
  catLabel: "STATE PROGRAM",
  bodyHtml: "",
  summary: undefined,
  published_at: undefined,
  attachments: [],
  related: [],
  tags: [],
};

// Edge: a program with a body + multiple attachments/related (confirms sort order
// + every block renders together).
const richProgram: ProgramItem = {
  ...full,
  id: "3",
  slug: "rich-program",
  title: "Rich Program",
  attachments: [
    {
      name: "Beta.docx",
      url: "https://agency.icjia-api.cloud/uploads/beta.docx",
      ext: "docx",
      niceSize: "8 KB",
      updatedAlt: "May 01, 2026",
    },
    {
      name: "Alpha.pdf",
      url: "https://agency.icjia-api.cloud/uploads/alpha.pdf",
      ext: "pdf",
      niceSize: "20 KB",
      updatedAlt: "Apr 30, 2026",
    },
  ],
  related: [
    { displayTitle: "[Funding]: Other Grant", fullPath: "/grants/funding/other/" },
    { displayTitle: "[News]: A Post", fullPath: "/news/a-post/" },
  ],
  tags: ["grants"],
};

describe("renderProgramDetail twin/page parity", () => {
  it("matches the real [slug].astro — full federal program", async () => {
    expect(norm(renderProgramDetail(full))).toBe(norm(await realContent(full)));
  });

  it("matches the real [slug].astro — minimal archived program (all empty branches)", async () => {
    expect(norm(renderProgramDetail(minimal))).toBe(norm(await realContent(minimal)));
  });

  it("matches the real [slug].astro — program with body + multiple blocks", async () => {
    expect(norm(renderProgramDetail(richProgram))).toBe(norm(await realContent(richProgram)));
  });
});

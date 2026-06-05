// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderGrantDetail(item) must produce the SAME HTML as the real
// grants/funding/[slug].astro page content, so a live-detail-fallback grant looks
// identical to the nightly-built page. The grant page has NO extracted component
// (its markup is inline in [slug].astro), so we render the REAL page via the Astro
// Container API — with getGrant() mocked so it returns the fixture instead of
// hitting Strapi — then slice out the page-content region (the optional expired
// banner + the main .funding div, stopping at the SEO JSON-LD script the twin
// intentionally omits) and diff after the same normalization the meeting parity
// test uses.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { renderGrantDetail } from "./grant";
import type { GrantItem } from "../shapers/grant";

// One mutable fixture the mocked getGrant returns; each test sets CURRENT before
// rendering the real page. (vi.mock is hoisted, so it reads CURRENT lazily.)
let CURRENT: GrantItem;
vi.mock("../../data", async (orig) => {
  const actual = await orig<typeof import("../../data")>();
  return {
    ...actual,
    getGrant: async () => CURRENT,
    // getStaticPaths isn't run by the Container, but the page imports getFunding —
    // stub it so the module never reaches a live fetch on import.
    getFunding: async () => [],
  };
});

// Same two-invisible-difference normalization as meeting.parity.test.ts:
//   1. data-astro-source-{file,loc} — dev-only debug attrs (stripped in prod builds).
//   2. insignificant tag/text-boundary whitespace (browsers collapse it).
// Plus the stateful contentSanitizer table-id counter (cmstbl<n>) — irrelevant here
// (no markdown tables in these fixtures) but kept for parity with the meeting gate.
const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// Render the REAL page and return only its content region (banner + main .funding
// div), dropping BaseLayout chrome and the trailing JSON-LD <script>.
async function realContent(item: GrantItem): Promise<string> {
  CURRENT = item;
  const Page = (await import("../../../pages/grants/funding/[slug].astro")).default;
  const container = await AstroContainer.create();
  const html = await container.renderToString(Page, { params: { slug: item.slug } });
  const start = html.indexOf('<div class="funding');
  const end = html.indexOf('<script type="application/ld+json"');
  if (start === -1 || end === -1 || end < start)
    throw new Error("could not locate grant content region in rendered page");
  return html.slice(start, end);
}

const full: GrantItem = {
  id: "1",
  slug: "test-nofo",
  title: "Test NOFO & Co",
  category: "nofo",
  catLabel: "NOTICE OF FUNDING OPPORTUNITY",
  bodyHtml: "<p>Body paragraph with a <strong>bold</strong> word.</p>",
  summary: "A funding opportunity.",
  start: "2026-01-01",
  end: "2026-06-06",
  published_at: "2026-01-01",
  isExpired: true,
  endFormatted: "June 06, 2026",
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

// Edge: an active (not expired) RFI with no body, no attachments, no related, no
// tags — exercises every conditional's empty branch (no banner, no nofo-header).
const minimal: GrantItem = {
  id: "2",
  slug: "bare-rfi",
  title: "Bare RFI",
  category: "rfi",
  catLabel: "REQUEST FOR INFORMATION",
  bodyHtml: "",
  summary: undefined,
  start: undefined,
  end: undefined,
  published_at: undefined,
  isExpired: false,
  endFormatted: "",
  attachments: [],
  related: [],
  tags: [],
};

// Edge: a NOFO with a body but no banner (active) and multiple attachments/related
// — confirms the nofo-header renders while the expired banner does not.
const activeNofo: GrantItem = {
  ...full,
  id: "3",
  slug: "active-nofo",
  title: "Active NOFO",
  isExpired: false,
  endFormatted: "",
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
    { displayTitle: "[Event]: Kickoff", fullPath: "/events/kickoff/" },
  ],
  tags: ["grants"],
};

describe("renderGrantDetail twin/page parity", () => {
  it("matches the real [slug].astro — full expired NOFO", async () => {
    expect(norm(renderGrantDetail(full))).toBe(norm(await realContent(full)));
  });

  it("matches the real [slug].astro — minimal active RFI (all empty branches)", async () => {
    expect(norm(renderGrantDetail(minimal))).toBe(norm(await realContent(minimal)));
  });

  it("matches the real [slug].astro — active NOFO with body + multiple blocks", async () => {
    expect(norm(renderGrantDetail(activeNofo))).toBe(norm(await realContent(activeNofo)));
  });
});

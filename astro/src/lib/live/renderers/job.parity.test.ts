// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderJobDetail(item) must produce the SAME HTML as the real
// about/employment/[slug].astro page content, so a live-detail-fallback job looks
// identical to the nightly-built page. The employment detail page has no extracted
// content component beyond JobCard (the page is `.employment` wrapper + sr-only H1 +
// <JobCard summaryOnly={false}>), so we render the REAL page via the Astro Container
// API — with getJob()/getAllJobs() mocked so they return the fixture instead of
// hitting Strapi — then slice out the `.employment` content region (a balanced-div
// walk from the wrapper, since the page's JobPosting JSON-LD is emitted in <head>,
// not in the body) and diff after the same normalization the meeting/grant gates use.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { renderJobDetail } from "./job";
import type { JobItem } from "../shapers/job";

// One mutable fixture the mocked getJob returns; each test sets CURRENT before
// rendering the real page. (vi.mock is hoisted, so it reads CURRENT lazily.)
let CURRENT: JobItem;
vi.mock("../../data", async (orig) => {
  const actual = await orig<typeof import("../../data")>();
  return {
    ...actual,
    getJob: async () => CURRENT,
    // getStaticPaths isn't run by the Container, but the page imports getAllJobs —
    // stub it so the module never reaches a live fetch on import.
    getAllJobs: async () => [],
  };
});

// Same two-invisible-difference normalization as meeting.parity.test.ts:
//   1. data-astro-source-{file,loc} — dev-only debug attrs (stripped in prod builds).
//   2. insignificant tag/text-boundary whitespace (browsers collapse it).
// Plus the stateful contentSanitizer table-id counter (cmstbl<n>) — irrelevant here
// (no markdown tables in these fixtures) but kept for parity with the other gates.
const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[^=]+="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// Extract the `.employment` content region from the rendered page: a balanced walk
// over <div …>/</div> starting at the wrapper, returning through its matching close.
function sliceEmployment(html: string): string {
  const start = html.indexOf('<div class="employment markdown-body mx-auto');
  if (start === -1) throw new Error("could not locate employment content region");
  let depth = 0;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = start;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("</")) depth--;
    else depth++;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  throw new Error("unbalanced employment content region");
}

async function realContent(item: JobItem): Promise<string> {
  CURRENT = item;
  const Page = (await import("../../../pages/about/employment/[slug].astro")).default;
  const container = await AstroContainer.create();
  const html = await container.renderToString(Page, { params: { slug: item.slug } });
  return sliceEmployment(html);
}

const full: JobItem = {
  id: "6",
  slug: "deputy-general-counsel",
  title: "Deputy General Counsel & Co",
  fullPath: "/about/employment/deputy-general-counsel/",
  category: "fullTime",
  catLabel: "FULL TIME EMPLOYMENT",
  summaryHtml: "<p>Summary.</p>",
  postedLine: "Posted August 23, 2021",
  start: "2021-08-23",
  end: "2026-09-03",
  published_at: "2021-09-04T18:42:15.766Z",
  expired: false,
  acceptingLine: "Accepting applications through September 03, 2026",
  expiredChip: "",
  endMs: 0,
  bodyHtml: "<p>Body paragraph with a <strong>bold</strong> word.</p>",
  tags: ["crime", "statistics & data"],
  attachments: [
    {
      name: "Posting.pdf",
      url: "https://agency.icjia-api.cloud/uploads/posting.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jun 01, 2026",
    },
  ],
  external: [
    {
      title: "Link to full description & application",
      url: "https://illinois.jobs2web.com/job/123/",
    },
  ],
  related: [{ displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" }],
};

// Edge: an EXPIRED job with no body, no tags, no attachments, no external, no
// related — exercises every conditional's empty branch + the expired chip path.
const minimal: JobItem = {
  id: "7",
  slug: "bare-job",
  title: "Bare Job",
  fullPath: "/about/employment/bare-job/",
  category: "internship",
  catLabel: "INTERNSHIP EMPLOYMENT",
  summaryHtml: "",
  postedLine: "",
  start: undefined,
  end: "2020-01-01",
  published_at: undefined,
  expired: true,
  acceptingLine: "",
  expiredChip: "Expired: Jan 01, 2020",
  endMs: 0,
  bodyHtml: "",
  tags: [],
  attachments: [],
  external: [],
  related: [],
};

// Edge: a job with body + multiple attachments/external/related (sort-stable order).
const rich: JobItem = {
  ...full,
  id: "8",
  slug: "rich-job",
  title: "Rich Job",
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
  external: [
    { title: "Apply", url: "https://example.com/apply" },
    { title: "Details", url: "https://example.com/details" },
  ],
  related: [
    { displayTitle: "[News]: Beta Post", fullPath: "/news/beta/" },
    { displayTitle: "[News]: Alpha Post", fullPath: "/news/alpha/" },
  ],
  tags: ["grants"],
};

describe("renderJobDetail twin/page parity", () => {
  it("matches the real [slug].astro — full active job", async () => {
    expect(norm(renderJobDetail(full))).toBe(norm(await realContent(full)));
  });

  it("matches the real [slug].astro — minimal expired job (all empty branches)", async () => {
    expect(norm(renderJobDetail(minimal))).toBe(norm(await realContent(minimal)));
  });

  it("matches the real [slug].astro — job with body + multiple blocks", async () => {
    expect(norm(renderJobDetail(rich))).toBe(norm(await realContent(rich)));
  });
});

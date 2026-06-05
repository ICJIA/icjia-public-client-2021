// Page shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — shapePage(raw, renderToHtml, renderInline) must produce the SAME
//      shape as data.ts's build-time getPage(), so the live-detail render cannot
//      silently diverge from the nightly-built page. getPage's buildToc + attachment
//      shaping + clickthrough/title/body rendering are module-internal (not exported),
//      so the strongest lock is a FULL deep-equal of the two shapes: we mock the
//      gql-client runQuery to feed getPage the SAME raw record, render both through the
//      identical markdown.js pipeline, and assert structural equality. Any drift in the
//      ported buildToc (or anything else) fails here.
//   2. CORRECTNESS — spot assertions on titleHtml (inline render, no <p>), the TOC
//      (h2s only, #disclaimer excluded), sorted attachments, and tags.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { renderToHtml, renderInline } from "../../markdown.js";

// Mock the gql-client so data.ts's getPage returns our raw record instead of fetching.
// (vi.mock is hoisted; the factory reads RAW lazily via the closure.)
let RAW: any;
vi.mock("../../gql-client.js", async (orig) => {
  const actual = await orig<any>();
  return {
    ...actual,
    runQuery: async () => ({ data: { pages: RAW ? [RAW] : [] } }),
  };
});

import { getPage } from "../../data";
import { shapePage } from "./page";

const shape = (raw: any) => shapePage(raw, renderToHtml, renderInline);

// A realistic Strapi `pages` record exercising every shaped field: a markdown title,
// a body with two h2s (TOC) + an h2 inside #disclaimer (excluded) + an h3 (excluded),
// out-of-order attachments, a clickthrough box, tags.
const raw = {
  id: 7,
  slug: "foia",
  title: "Freedom of *Information* Act",
  hideTitle: false,
  summary: "FOIA at ICJIA.",
  body:
    "## Overview\n\nIntro paragraph.\n\n## How to Request\n\nSteps.\n\n### Details\n\nSub.\n\n" +
    '<div id="disclaimer">\n\n## Disclaimer\n\nFine print.\n\n</div>',
  showTOC: true,
  attachmentLabel: "Documents",
  attachments: [
    { name: "Beta.pdf", url: "/uploads/beta.pdf", ext: ".pdf", size: 120000, updated_at: "2026-06-01T00:00:00.000Z" },
    { name: "Alpha.docx", url: "https://agency.icjia-api.cloud/uploads/alpha.docx", ext: ".DOCX", size: 8000, updated_at: "2026-05-01T00:00:00.000Z" },
  ],
  clickthrough: [
    { title: "Box", teaser: "A **teaser**.", icon: "info", url: "https://example.com", datePosted: "2026-06-01" },
  ],
  splash: { url: "/uploads/hero.jpg", alternativeText: "Hero", caption: "A caption" },
  tags: [{ title: "transparency" }, { title: "records" }],
  published_at: "2026-01-01T00:00:00.000Z",
};

describe("page shaper — drift guard vs data.ts getPage()", () => {
  it("shapePage deep-equals getPage for the same raw record", async () => {
    RAW = raw;
    const fromData = await getPage(raw.slug);
    expect(fromData).not.toBeNull();
    expect(shape(raw)).toEqual(fromData);
  });

  it("matches getPage on a minimal record (empty branches)", async () => {
    const min = { id: 1, slug: "contact", title: "Contact" };
    RAW = min;
    expect(shape(min)).toEqual(await getPage(min.slug));
  });
});

describe("page shaper — shapePage correctness", () => {
  const item = shape(raw);

  it("titleHtml is inline-rendered (emphasis, no <p> wrapper)", () => {
    expect(item.titleHtml).toContain("<em>Information</em>");
    expect(item.titleHtml).not.toContain("<p>");
  });

  it("toc has only the two non-disclaimer h2s, in order", () => {
    expect(item.toc.map((t) => t.text)).toEqual(["Overview", "How to Request"]);
    expect(item.toc.map((t) => t.id)).toEqual(["overview", "how-to-request"]);
  });

  it("attachments are sorted by name and normalized (url, ext, size)", () => {
    expect(item.attachments.map((a) => a.name)).toEqual(["Alpha.docx", "Beta.pdf"]);
    expect(item.attachments[0].url).toBe("https://agency.icjia-api.cloud/uploads/alpha.docx");
    expect(item.attachments[0].ext).toBe("docx");
    expect(item.attachments[1].url).toBe("https://agency.icjia-api.cloud/uploads/beta.pdf");
  });

  it("attachmentLabel passthrough, tags flattened, clickthrough teaser rendered", () => {
    expect(item.attachmentLabel).toBe("Documents");
    expect(item.tags).toEqual(["transparency", "records"]);
    expect(item.clickthrough[0].teaserHtml).toContain("<strong>teaser</strong>");
  });

  it("empty attachmentLabel falls back to 'Attachments'", () => {
    expect(shape({ slug: "x", title: "X", attachmentLabel: "" }).attachmentLabel).toBe("Attachments");
  });
});

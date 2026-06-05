// Grant shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — the pure formatters duplicated into this client-safe shaper
//      (fundingCategoryLabel, isExpired) must stay identical to data.ts's build
//      originals, so the live-detail render cannot silently diverge from the
//      nightly-built page. (The attachment/related/date helpers it REUSES from the
//      meeting shaper + format.ts are already pinned by their own drift tests.)
//   2. CORRECTNESS — shapeGrant maps a raw Strapi v3 REST record to the expected
//      GrantItem (the same shape data.ts's getGrant() returns): uppercase label,
//      rendered body, sorted attachments, related, tags, expired flag + banner date.
import { describe, it, expect } from "vitest";
import {
  fundingCategoryLabel as d_label,
  isExpired as d_expired,
  formatNewsDate as d_fmt,
} from "../../data";
import {
  fundingCategoryLabel as s_label,
  isExpired as s_expired,
  shapeGrant,
} from "./grant";
import { renderToHtml } from "../../markdown.js";

describe("grant shaper — drift guard vs data.ts originals", () => {
  it("fundingCategoryLabel matches", () => {
    for (const c of ["nofo", "rfi", "other", "", undefined])
      expect(s_label(c)).toBe(d_label(c));
  });
  it("isExpired matches (past, future, none, invalid)", () => {
    const past = "2000-01-01";
    const future = "2999-01-01";
    for (const v of [past, future, "", undefined, "not-a-date"])
      expect(s_expired(v)).toBe(d_expired(v));
  });
});

describe("grant shaper — shapeGrant correctness", () => {
  const raw = {
    id: 42,
    slug: "fy26-violence-prevention-nofo",
    title: "FY26 Violence Prevention NOFO & Update",
    category: "nofo",
    summary: "Funding to support violence prevention programs.",
    body: "## Overview\n\nApply by the deadline.",
    start: "2026-01-15",
    end: "2000-06-06", // in the past → expired
    published_at: "2026-01-10T12:00:00.000Z",
    tags: [{ title: "violence prevention" }, { title: "grants" }],
    attachments: [
      {
        name: "Zeta.pdf",
        url: "/uploads/zeta_abc.pdf",
        ext: ".PDF",
        size: 122880,
        updated_at: "2026-01-12T12:00:00.000Z",
      },
      {
        name: "Alpha.docx",
        url: "https://cdn.example.com/alpha.docx",
        ext: ".docx",
        size: 8192,
        updated_at: "2026-01-11T12:00:00.000Z",
      },
    ],
    // related relations a grant may carry
    posts: [{ title: "Announcement", slug: "announcement" }],
    programs: [{ title: "VP Program", slug: "vp-program" }],
  };

  it("maps the record to a GrantItem (parity with getGrant output)", () => {
    const g = shapeGrant(raw, renderToHtml);
    expect(g.id).toBe("42");
    expect(g.slug).toBe(raw.slug);
    expect(g.title).toBe(raw.title);
    expect(g.category).toBe("nofo");
    expect(g.catLabel).toBe("NOTICE OF FUNDING OPPORTUNITY");
    expect(g.isExpired).toBe(true);
    expect(g.endFormatted).toBe("June 06, 2000");
    expect(g.tags).toEqual(["violence prevention", "grants"]);
    // body rendered via the injected pipeline (heading anchor present)
    expect(g.bodyHtml).toMatch(/<h2[^>]*id="overview"/);
    // attachments: sorted by name asc, absolutized url, ext sans-dot lowercase, niceBytes
    expect(g.attachments.map((a) => a.name)).toEqual(["Alpha.docx", "Zeta.pdf"]);
    expect(g.attachments[1]).toMatchObject({
      name: "Zeta.pdf",
      url: "https://agency.icjia-api.cloud/uploads/zeta_abc.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jan 12, 2026",
    });
    expect(g.attachments[0].url).toBe("https://cdn.example.com/alpha.docx");
    // related: built from posts + programs, sorted by displayTitle
    expect(g.related).toEqual([
      { displayTitle: "[News]: Announcement", fullPath: "/news/announcement/" },
      { displayTitle: "[Program]: VP Program", fullPath: "/grants/programs/vp-program/" },
    ]);
  });

  it("renders no body when body is empty and reports RFI label / not-expired", () => {
    const g = shapeGrant(
      { id: 7, slug: "rfi-x", title: "RFI X", category: "rfi", end: "2999-01-01" },
      renderToHtml,
    );
    expect(g.bodyHtml).toBe("");
    expect(g.catLabel).toBe("REQUEST FOR INFORMATION");
    expect(g.isExpired).toBe(false);
    expect(g.attachments).toEqual([]);
    expect(g.related).toEqual([]);
    expect(g.tags).toEqual([]);
  });

  it("endFormatted is consistent with data.ts formatNewsDate", () => {
    const g = shapeGrant({ id: 1, slug: "s", title: "t", end: "2026-06-06" }, renderToHtml);
    expect(g.endFormatted).toBe(d_fmt("2026-06-06"));
  });
});

// Meeting shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — the pure formatters duplicated into this client-safe shaper
//      must stay identical to data.ts's build originals (so the live-detail render
//      cannot silently diverge from the nightly-built page).
//   2. CORRECTNESS — shapeMeeting maps a raw Strapi v3 REST record to the expected
//      MeetingItem (field mapping, attachment formatting, related/external/tags).
import { describe, it, expect } from "vitest";
import {
  meetingCategoryLabel as d_label,
  dateFormatAlt as d_alt,
  meetingDateLine as d_line,
  niceBytes as d_bytes,
  strapiUrl as d_url,
} from "../../data";
import {
  meetingCategoryLabel as s_label,
  dateFormatAlt as s_alt,
  meetingDateLine as s_line,
  niceBytes as s_bytes,
  strapiUrl as s_url,
  shapeMeeting,
} from "./meeting";
import { renderToHtml } from "../../markdown.js";

describe("meeting shaper — drift guard vs data.ts originals", () => {
  it("meetingCategoryLabel matches", () => {
    for (const c of ["board", "budget", "irb", "special", "unknown", "", undefined])
      expect(s_label(c)).toBe(d_label(c));
  });
  it("dateFormatAlt matches (timestamp + date-only + empty)", () => {
    for (const v of ["2026-06-09T18:00:00.000Z", "2026-06-09", "", undefined])
      expect(s_alt(v)).toBe(d_alt(v));
  });
  it("meetingDateLine matches (same-day, multi-day, start-only)", () => {
    const cases: [string | undefined, string | undefined][] = [
      ["2026-06-09T18:00:00.000Z", "2026-06-09T19:30:00.000Z"],
      ["2026-05-14T15:00:00.000Z", "2026-05-16T15:00:00.000Z"],
      ["2026-06-09T18:00:00.000Z", undefined],
      [undefined, undefined],
    ];
    for (const [a, b] of cases) expect(s_line(a, b)).toBe(d_line(a, b));
  });
  it("niceBytes matches", () => {
    for (const n of [0, 500, 1024, 122880, 1048576, 5_400_000])
      expect(s_bytes(n)).toBe(d_bytes(n));
  });
  it("strapiUrl matches", () => {
    for (const u of ["/uploads/x.pdf", "https://x.com/y.png", null, undefined])
      expect(s_url(u)).toBe(d_url(u));
  });
});

describe("meeting shaper — shapeMeeting correctness", () => {
  const raw = {
    id: 311,
    slug: "uniform-statewide-crime-statistics-task-force-agenda-june-9-2026",
    title: "Uniform Statewide Crime Statistics Task Force Agenda: June 9, 2026",
    start: "2026-06-09T18:00:00.000Z",
    end: "2026-06-09T19:30:00.000Z",
    body: "## Agenda\n\nWelcome and roll call.",
    summary: "Task force agenda.",
    category: "special",
    isCancelled: false,
    tags: [{ title: "crime" }, { title: "statistics" }],
    attachments: [
      {
        name: "Agenda.pdf",
        url: "/uploads/agenda_abc.pdf",
        ext: ".pdf",
        size: 122880,
        updated_at: "2026-06-01T12:00:00.000Z",
      },
    ],
    external: [{ title: "WebEx", url: "https://example.com/webex" }],
    events: [],
    posts: [{ title: "Related Post", slug: "related-post" }],
  };

  it("maps the record to a MeetingItem", () => {
    const m = shapeMeeting(raw, renderToHtml);
    expect(m.id).toBe("311");
    expect(m.fullPath).toBe(`/news/meetings/${raw.slug}/`);
    expect(m.catLabel).toBe("Special");
    expect(m.isCancelled).toBe(false);
    expect(m.tags).toEqual(["crime", "statistics"]);
    expect(m.dateLine).toContain("2026");
    // attachment: absolutized url, ext sans dot, niceBytes, dateFormatAlt
    expect(m.attachments).toHaveLength(1);
    expect(m.attachments[0]).toMatchObject({
      name: "Agenda.pdf",
      url: "https://agency.icjia-api.cloud/uploads/agenda_abc.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jun 01, 2026",
    });
    expect(m.related).toEqual([
      { displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" },
    ]);
    expect(m.external).toEqual([{ title: "WebEx", url: "https://example.com/webex" }]);
    // body rendered via the injected pipeline (heading anchor present)
    expect(m.bodyHtml).toMatch(/<h2[^>]*id="agenda"/);
  });

  it("renders no body for a cancelled meeting", () => {
    const m = shapeMeeting({ ...raw, isCancelled: true }, renderToHtml);
    expect(m.isCancelled).toBe(true);
    expect(m.bodyHtml).toBe("");
  });
});

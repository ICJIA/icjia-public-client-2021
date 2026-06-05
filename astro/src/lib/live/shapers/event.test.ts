// Event shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — the pure helpers duplicated into this client-safe shaper
//      (eventRangeLine, buildRelated) must stay identical to data.ts's build
//      originals, so the live-detail render cannot silently diverge from the
//      nightly-built page.
//   2. CORRECTNESS — shapeEvent maps a raw Strapi v3 REST/GraphQL event record to
//      the expected EventItem (field mapping, range line, related, tags, body from
//      details||summary).
import { describe, it, expect } from "vitest";
import {
  eventRangeLine as d_range,
  buildRelated as d_related,
} from "../../data";
import {
  eventRangeLine as s_range,
  buildRelated as s_related,
  shapeEvent,
} from "./event";
import { renderToHtml } from "../../markdown.js";

describe("event shaper — drift guard vs data.ts originals", () => {
  it("eventRangeLine matches (timed same-day, all-day, multi-day, missing)", () => {
    const cases: [string | undefined, string | undefined, boolean][] = [
      ["2026-06-09T18:00:00.000Z", "2026-06-09T19:30:00.000Z", true],
      ["2026-06-09T05:00:00.000Z", "2026-06-10T04:59:00.000Z", false],
      ["2026-05-14T15:00:00.000Z", "2026-05-16T15:00:00.000Z", true],
      ["2026-05-14T15:00:00.000Z", "2026-05-16T15:00:00.000Z", false],
      ["2026-06-09T18:00:00.000Z", undefined, true],
      [undefined, undefined, false],
    ];
    for (const [a, b, t] of cases) expect(s_range(a, b, t)).toBe(d_range(a, b, t));
  });

  it("buildRelated matches (events/meetings/posts, sorted by displayTitle)", () => {
    const content = {
      events: [{ title: "Zeta Event", slug: "zeta" }],
      meetings: [{ title: "Board Meeting", slug: "board" }],
      posts: [{ title: "Alpha Post", slug: "alpha" }],
    };
    expect(s_related(content)).toEqual(d_related(content));
    expect(s_related({})).toEqual(d_related({}));
  });
});

describe("event shaper — shapeEvent correctness", () => {
  const raw = {
    id: 42,
    name: "Budget Forum & Q&A",
    slug: "budget-forum-2026",
    start: "2026-06-09T18:00:00.000Z",
    end: "2026-06-09T19:30:00.000Z",
    timed: true,
    summary: "Public budget forum.",
    details: "## Agenda\n\nWelcome and roll call.",
    category: "training",
    tags: [{ title: "crime" }, { title: "statistics" }],
    meetings: [{ title: "Board Meeting", slug: "board-meeting" }],
    posts: [{ title: "Related Post", slug: "related-post" }],
    published_at: "2026-06-01T12:00:00.000Z",
  };

  it("maps the record to an EventItem (body from details)", () => {
    const e = shapeEvent(raw, renderToHtml);
    expect(e.id).toBe("42");
    expect(e.name).toBe("Budget Forum & Q&A");
    expect(e.fullPath).toBe(`/events/${raw.slug}/`);
    expect(e.category).toBe("training");
    expect(e.timed).toBe(true);
    expect(e.tags).toEqual(["crime", "statistics"]);
    expect(e.rangeLine).toContain("June");
    expect(e.related).toEqual([
      { displayTitle: "[Meeting]: Board Meeting", fullPath: "/news/meetings/board-meeting/" },
      { displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" },
    ]);
    // body rendered from `details` via the injected pipeline (heading anchor present)
    expect(e.bodyHtml).toMatch(/<h2[^>]*id="agenda"/);
    expect(e.published_at).toBe("2026-06-01T12:00:00.000Z");
  });

  it("falls back to summary for the body when details is absent", () => {
    const e = shapeEvent({ ...raw, details: "" }, renderToHtml);
    expect(e.bodyHtml).toMatch(/Public budget forum\./);
  });

  it("renders no body when neither details nor summary is present", () => {
    const e = shapeEvent({ ...raw, details: "", summary: "" }, renderToHtml);
    expect(e.bodyHtml).toBe("");
  });
});

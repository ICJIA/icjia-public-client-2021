// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderMeetingCard(item) must produce the SAME HTML as the real MeetingCard.astro
// for the same MeetingItem, so a live-detail-fallback meeting looks identical to
// the nightly-built page. Rendered via the Astro Container API; compared after
// normalizing the invisible table-id counter and insignificant inter-tag whitespace
// (both sides share the same set:html body, so body whitespace is identical anyway).
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import MeetingCard from "../../../components/MeetingCard.astro";
import { renderMeetingCard } from "./meeting";
import type { MeetingItem } from "../shapers/meeting";

// Normalize the two INVISIBLE differences between the dev-container render and the
// production build / client twin:
//   1. data-astro-source-{file,loc} — dev-only debug attributes Astro injects on
//      every element; STRIPPED in production builds, so the twin already matches prod.
//   2. insignificant whitespace at tag/text boundaries (Astro emits the template's
//      newlines+indent around interpolations, e.g. `<a> Name </a>`; browsers collapse
//      it — visually identical). The set:html body is byte-identical on both sides.
// Also normalize the invisible stateful table-id counter (contentSanitizer.js:208).
const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

const base: MeetingItem = {
  id: "311",
  slug: "test-meeting",
  title: "Test Meeting & Review",
  fullPath: "/news/meetings/test-meeting/",
  isCancelled: false,
  category: "board",
  catLabel: "Authority Board",
  start: "2026-06-09T18:00:00.000Z",
  end: "2026-06-09T19:30:00.000Z",
  summary: "Summary",
  altDate: "Jun 09, 2026",
  startMs: 0,
  dateLine: "Tuesday Jun 09, 2026, 01:00 PM - 02:30 PM",
  bodyHtml: "<p>Body paragraph with a <strong>bold</strong> word.</p>",
  tags: ["crime", "statistics & data"],
  attachments: [
    {
      name: "Agenda.pdf",
      url: "https://agency.icjia-api.cloud/uploads/agenda.pdf",
      ext: "pdf",
      niceSize: "120 KB",
      updatedAlt: "Jun 01, 2026",
    },
  ],
  external: [{ title: "WebEx Link", url: "https://example.com/webex" }],
  related: [{ displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" }],
  haystack: "",
};

const cancelled: MeetingItem = {
  ...base,
  isCancelled: true,
  bodyHtml: "",
  tags: [],
  attachments: [],
  external: [],
  related: [],
};

describe("MeetingCard twin/component parity", () => {
  it("matches the real MeetingCard.astro — full record", async () => {
    const container = await AstroContainer.create();
    const real = await container.renderToString(MeetingCard, { props: { item: base } });
    expect(norm(renderMeetingCard(base))).toBe(norm(real));
  });

  it("matches the real MeetingCard.astro — cancelled meeting", async () => {
    const container = await AstroContainer.create();
    const real = await container.renderToString(MeetingCard, { props: { item: cancelled } });
    expect(norm(renderMeetingCard(cancelled))).toBe(norm(real));
  });
});

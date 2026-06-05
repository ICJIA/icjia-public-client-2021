// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderEventCard(item) must produce the SAME HTML as the real EventCard.astro
// (single-event-page branch: clickable={false}) for the same EventItem, so a
// live-detail-fallback event looks identical to the nightly-built page. Rendered
// via the Astro Container API; compared after normalizing the dev-only
// data-astro-source-* debug attributes and insignificant inter-tag whitespace
// (both sides share the same set:html body + name, so those bytes are identical
// anyway). EventCard is text-only (no astro:assets image) → no img normalization.
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import EventCard from "../../../components/EventCard.astro";
import { renderEventCard } from "./event";
import type { EventItem } from "../shapers/event";

// Normalize the two INVISIBLE differences between the dev-container render and the
// production build / client twin:
//   1. data-astro-source-{file,loc} — dev-only debug attributes Astro injects on
//      every element; STRIPPED in production builds, so the twin already matches prod.
//   2. insignificant whitespace at tag/text boundaries (Astro emits the template's
//      newlines+indent around interpolations); browsers collapse it — visually
//      identical. The set:html body + name are byte-identical on both sides.
const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// The single-event page always supplies clickable={false}, bodyHtml + related.
// The real EventCard.astro takes flat props (not an `item`), so map EventItem
// fields onto the same prop set the page passes.
const cardProps = (item: EventItem) => ({
  name: item.name,
  category: item.category,
  rangeLine: item.rangeLine,
  bodyHtml: item.bodyHtml,
  summary: item.summary,
  tags: item.tags,
  related: item.related,
  clickable: false as const,
});

const base: EventItem = {
  id: "42",
  name: "Budget Forum &amp; Q&amp;A",
  slug: "budget-forum-2026",
  fullPath: "/events/budget-forum-2026/",
  category: "training",
  summary: "Public budget forum.",
  start: "2026-06-09T18:00:00.000Z",
  end: "2026-06-09T19:30:00.000Z",
  timed: true,
  rangeLine: "1:00 pm to 2:30 pm | June 09, 2026",
  bodyHtml: "<p>Body paragraph with a <strong>bold</strong> word.</p>",
  related: [
    { displayTitle: "[Meeting]: Board Meeting", fullPath: "/news/meetings/board-meeting/" },
    { displayTitle: "[News]: Related Post", fullPath: "/news/related-post/" },
  ],
  tags: ["crime", "statistics & data"],
  published_at: "2026-06-01T12:00:00.000Z",
};

// Edge cases: no category (catLabel collapses to "EVENT"), no tags, no related,
// and bodyHtml absent → the summary-paragraph fallback branch.
const summaryFallback: EventItem = {
  ...base,
  category: undefined,
  bodyHtml: "",
  rangeLine: "",
  tags: [],
  related: [],
};

describe("EventCard twin/component parity", () => {
  it("matches the real EventCard.astro — full single-event record", async () => {
    const container = await AstroContainer.create();
    const real = await container.renderToString(EventCard, { props: cardProps(base) });
    expect(norm(renderEventCard(base))).toBe(norm(real));
  });

  it("matches the real EventCard.astro — no category, summary fallback, no tags/related", async () => {
    const container = await AstroContainer.create();
    const real = await container.renderToString(EventCard, { props: cardProps(summaryFallback) });
    expect(norm(renderEventCard(summaryFallback))).toBe(norm(real));
  });
});

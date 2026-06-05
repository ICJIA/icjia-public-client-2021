/**
 * Event DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as events/[slug].astro (the "ICJIA Events" heading +
 * EventCard.astro with clickable={false} + the "View all events »" link) for the
 * live-detail fallback. Locked to the real components by event.parity.test.ts
 * (Astro Container API), so it cannot drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` is already sanitized markdown (from the injected renderToHtml in
 * the shaper) and is emitted raw, exactly as the component's `set:html` does. Like
 * the component, `item.name` is also emitted raw (the toolbar title uses set:html —
 * the name may carry HTML entities). Every other interpolated value is HTML-escaped,
 * matching Astro's auto-escaping.
 */
import type { EventItem } from "../shapers/event";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of EventCard.astro (single-page branch: clickable={false}). */
export function renderEventCard(item: EventItem): string {
  const category = item.category ?? "";
  const catLabel = `${category.toUpperCase()}${category ? " " : ""}EVENT`;

  const range = item.rangeLine
    ? `<span class="event-range">&nbsp;|&nbsp;${esc(item.rangeLine)}</span>`
    : "";

  const body = item.bodyHtml
    ? `<div class="event-body">${item.bodyHtml}</div>`
    : item.summary
      ? `<div class="event-body"><p>${esc(item.summary)}</p></div>`
      : "";

  const tags =
    item.tags.length > 0
      ? `<div class="event-tags">${item.tags
          .map(
            (t) =>
              `<a class="chip" href="/search/?q=${encodeURIComponent(t)}">${esc(t)}</a>`,
          )
          .join("")}</div>`
      : "";

  const related =
    item.related.length > 0
      ? `<div class="related"><h3 class="sub-heading">Related</h3><ul class="event-list">${item.related
          .map(
            (r) =>
              `<li><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`,
          )
          .join("")}</ul></div>`
      : "";

  return `<div class="event-card markdown-body"><div class="event-toolbar"><span class="event-toolbar-title">${item.name}</span></div><div class="event-meta"><span class="event-cat">${esc(catLabel)}</span>${range}</div>${body}${tags}${related}</div>`;
}

/** Mirror of events/[slug].astro's body (heading + card + "view all"). */
export function renderEventDetail(item: EventItem): string {
  return `<div class="events mx-auto max-w-4xl px-4 py-8 md:px-6"><div class="markdown-body"><h1>ICJIA Events</h1></div><div class="mt-8">${renderEventCard(item)}</div><div class="mt-5 text-right"><a class="view-all" href="/events/">View all events&nbsp;&raquo;</a></div></div>`;
}

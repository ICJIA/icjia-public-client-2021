/**
 * Meeting DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as news/meetings/[slug].astro (the "ICJIA Meetings"
 * heading + MeetingCard.astro + the "View all meetings »" link) for the
 * live-detail fallback. Locked to the real components by meeting.parity.test.ts
 * (Astro Container API), so it cannot drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` is already sanitized markdown (from the injected renderToHtml in
 * the shaper) and is emitted raw, exactly as the component's `set:html` does. Every
 * other interpolated value is HTML-escaped, matching Astro's auto-escaping.
 */
import type { MeetingItem } from "../shapers/meeting";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of MeetingCard.astro. */
export function renderMeetingCard(item: MeetingItem): string {
  const cancelBanner = item.isCancelled
    ? `<div class="cancel-banner">THIS MEETING IS CANCELLED</div>`
    : "";

  const titleClass = item.isCancelled ? "meeting-title cancelled" : "meeting-title";

  const dateBlock = !item.isCancelled
    ? `<div><span class="meeting-date">${esc(item.dateLine)}</span><span class="meeting-cat">&nbsp;|&nbsp;${esc(item.catLabel)}</span></div>`
    : "";

  const body = !item.isCancelled
    ? item.bodyHtml
      ? `<div class="mt-5 px-3">${item.bodyHtml}</div>`
      : ""
    : `<div class="mt-5 px-3">This meeting is cancelled.</div>`;

  const tags =
    item.tags.length > 0
      ? `<div class="mt-2">${item.tags
          .map(
            (t) =>
              `<a class="chip" href="/search/?q=${encodeURIComponent(t)}">${esc(t)}</a>`,
          )
          .join("")}</div>`
      : "";

  const attachments =
    item.attachments.length > 0
      ? `<div class="mt-8"><h3 class="sub-heading">Attachments</h3><div class="table-scroll" role="region" tabindex="0" aria-label="Attachments"><table class="att-table"><thead><tr><th>Filename</th><th>Last Updated</th><th>Size</th></tr></thead><tbody>${item.attachments
          .map(
            (a) =>
              `<tr><td><a class="attachment" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.name)}</a></td><td class="att-updated">${esc(a.updatedAlt)}</td><td class="att-size">${esc(a.niceSize)}</td></tr>`,
          )
          .join("")}</tbody></table></div></div>`
      : "";

  const related =
    item.related.length > 0
      ? `<div class="mt-5"><h3 class="sub-heading">Related Web Content</h3><ul class="meeting-list">${item.related
          .map(
            (r) =>
              `<li class="related-link"><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`,
          )
          .join("")}</ul></div>`
      : "";

  const external =
    item.external.length > 0
      ? `<div class="mt-4"><h3 class="sub-heading">External Links</h3><ul class="meeting-list">${item.external
          .map(
            (e) =>
              `<li class="attachment-link"><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" title="${esc(e.url)}">${esc(e.title)}<span class="sr-only"> (opens in new tab)</span></a></li>`,
          )
          .join("")}</ul></div>`
      : "";

  return `<div>${cancelBanner}<div class="meeting-card markdown-body reduce-90"><h2 class="${titleClass}"><a href="${esc(item.fullPath)}">${esc(item.title)}</a></h2>${dateBlock}${body}<div class="mt-5 mb-5">${tags}${attachments}${related}${external}</div></div></div>`;
}

/** Mirror of news/meetings/[slug].astro's body (heading + card + "view all"). */
export function renderMeetingDetail(item: MeetingItem): string {
  return `<div class="meetings mx-auto max-w-4xl px-4 py-8 md:px-6"><div class="page-heading"><h1>ICJIA Meetings</h1></div>${renderMeetingCard(item)}<div class="mt-5 text-right"><a class="view-all" href="/news/meetings/">View all meetings&nbsp;&raquo;</a></div></div>`;
}

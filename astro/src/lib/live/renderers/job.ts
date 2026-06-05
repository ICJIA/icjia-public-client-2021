/**
 * Employment (job) DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as about/employment/[slug].astro's page content (the
 * centered `.employment` container + the sr-only H1 + the full JobCard.astro with
 * summaryOnly=false: head, non-linking title, "Posted …" line, the `set:html` body,
 * and the tags / attachments / external / related "Related ICJIA Content" blocks)
 * for the live-detail fallback. Locked to the real page by job.parity.test.ts
 * (Astro Container API), so it cannot drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` is already sanitized markdown (from the injected renderToHtml in
 * the shaper) and is emitted raw, exactly as the page's `set:html` does. Every
 * other interpolated value is HTML-escaped, matching Astro's auto-escaping.
 *
 * The page's `<script type="application/ld+json">` (JobPosting SEO) is intentionally
 * NOT reproduced — the transient view is non-indexed (docs §2 non-goals).
 */
import type { JobItem } from "../shapers/job";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of JobCard.astro with summaryOnly=false (the single-job card). */
export function renderJobCard(item: JobItem): string {
  const head = `<div class="job-head"><span class="job-kicker">${esc(item.catLabel)}</span>${
    item.acceptingLine
      ? `<span class="job-accepting">&nbsp;|&nbsp;${esc(item.acceptingLine)}</span>`
      : ""
  }<span class="job-spacer"></span>${
    item.expired ? `<span class="job-chip-expired">${esc(item.expiredChip)}</span>` : ""
  }</div>`;

  // summaryOnly=false → plain-text title (no self-link).
  const title = `<h2 class="job-title">${esc(item.title)}</h2>`;

  const posted = item.postedLine
    ? `<span class="job-posted">${esc(item.postedLine)}</span>`
    : "";

  // Detail uses bodyHtml (set:html), not summaryHtml.
  const body = item.bodyHtml
    ? `<div class="job-body pt-3 pl-3">${item.bodyHtml}</div>`
    : "";

  const tags =
    item.tags.length > 0
      ? `<div class="mt-2 mb-5">${item.tags
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
              `<tr><td><a class="attachment" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.name)}<span class="sr-only"> (opens in new tab)</span></a></td><td class="att-updated">${esc(a.updatedAlt)}</td><td class="att-size">${esc(a.niceSize)}</td></tr>`,
          )
          .join("")}</tbody></table></div></div>`
      : "";

  const external =
    item.external.length > 0
      ? `<div class="mt-8"><h3 class="sub-heading">External Links</h3><ul class="meeting-list">${item.external
          .map(
            (e) =>
              `<li class="attachment-link"><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" title="${esc(e.url)}">${esc(e.title)}<span class="sr-only"> (opens in new tab)</span></a></li>`,
          )
          .join("")}</ul></div>`
      : "";

  const related =
    item.related.length > 0
      ? `<div class="mt-8 related-box"><h3 class="sub-heading">Related ICJIA Content</h3><ul class="meeting-list">${item.related
          .map(
            (r) =>
              `<li class="related-link"><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`,
          )
          .join("")}</ul></div>`
      : "";

  return `<div class="job-card markdown-body">${head}${title}${posted}${body}<div class="ml-2">${tags}${attachments}${external}${related}</div></div>`;
}

/** Mirror of about/employment/[slug].astro's body (centered container + sr-only H1 + card). */
export function renderJobDetail(item: JobItem): string {
  return `<div class="employment markdown-body mx-auto max-w-4xl px-4 py-8 md:px-6"><h1 class="sr-only">${esc(item.title)}</h1>${renderJobCard(item)}</div>`;
}

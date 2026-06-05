/**
 * Grant / funding (NOFO) DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as grants/funding/[slug].astro's page content (the
 * optional expired banner, the NOFO header, the title, the `set:html` body, and
 * the attachments / related / tags blocks) for the live-detail fallback. Locked to
 * the real page by grant.parity.test.ts (Astro Container API), so it cannot drift.
 * See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` is already sanitized markdown (from the injected renderToHtml in
 * the shaper) and is emitted raw, exactly as the page's `set:html` does. Every
 * other interpolated value is HTML-escaped, matching Astro's auto-escaping.
 *
 * The page's `<script type="application/ld+json">` (SEO) is intentionally NOT
 * reproduced — the transient view is non-indexed (docs §2 non-goals).
 */
import type { GrantItem } from "../shapers/grant";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of grants/funding/[slug].astro's page content (sans BaseLayout + JSON-LD). */
export function renderGrantDetail(item: GrantItem): string {
  const expiredBanner = item.isExpired
    ? `<div class="funding"><div class="expired-banner">This Funding Opportunity Expired on ${esc(item.endFormatted)}</div></div>`
    : "";

  const nofoHeader =
    item.category === "nofo"
      ? `<div class="nofo-header">Notice of Funding Opportunity</div>`
      : "";

  const body = item.bodyHtml ? `<div>${item.bodyHtml}</div>` : "";

  const attachments =
    item.attachments.length > 0
      ? `<div class="mt-4"><h2 class="sub-heading">Attachments</h2><div class="table-scroll" role="region" tabindex="0" aria-label="Attachments"><table class="att-table"><thead><tr><th>Filename</th><th>Size</th></tr></thead><tbody>${item.attachments
          .map(
            (a) =>
              `<tr><td><a class="attachment" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.name)}</a></td><td>${esc(a.niceSize)}</td></tr>`,
          )
          .join("")}</tbody></table></div></div>`
      : "";

  const related =
    item.related.length > 0
      ? `<div class="mt-5"><h2 class="sub-heading">Related Web Content</h2><ul class="meeting-list">${item.related
          .map((r) => `<li><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`)
          .join("")}</ul></div>`
      : "";

  const tags =
    item.tags.length > 0
      ? `<div class="mt-4">${item.tags
          .map(
            (t) =>
              `<a class="chip" href="/search/?q=${encodeURIComponent(t)}">${esc(t)}</a>`,
          )
          .join("")}</div>`
      : "";

  return `${expiredBanner}<div class="funding markdown-body mx-auto max-w-4xl px-4 py-8 md:px-6">${nofoHeader}<h1 class="mt-1">${esc(item.title)}</h1>${body}<div class="my-5">${attachments}${related}${tags}</div></div>`;
}

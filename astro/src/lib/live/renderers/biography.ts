/**
 * Biography DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as about/biographies/[slug].astro's page body (the
 * `markdown-body` wrapper + the <h1> of fullNameWithSuffix + <BiographyCard
 * item showName={false} />) for the live-detail fallback. Locked to the real
 * page/component by biography.parity.test.ts (Astro Container API), so it cannot
 * drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` is already sanitized markdown (from the injected renderToHtml in
 * the shaper) and is emitted raw, exactly as the component's `set:html` does. Every
 * other interpolated value is HTML-escaped, matching Astro's auto-escaping.
 *
 * HEADSHOT: BiographyCard.astro optimizes the avatar via astro:assets (CmsImage →
 * <Image>); a transient client render can't, so the twin emits the RAW Strapi URL
 * (§4). The parity test normalizes the resulting <img> src/width/height/loading/
 * decoding (+ data-image-component) differences. showName={false} on the detail
 * page → the card's own name heading is omitted (the page's <h1> carries the name).
 */
import type { BiographyItem } from "../shapers/biography";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of BiographyCard.astro with showName={false}, color default '#fff'. */
export function renderBiographyCard(item: BiographyItem): string {
  // CmsImage with an image → optimized <Image> (raw-URL <img> for the transient
  // render — §4). BiographyCard passes no `class` to CmsImage, so astro:assets'
  // <Image> renders a BARE `class` attribute (it interpolates the empty-string
  // class as `class` with no value) — emit it identically so parity holds after
  // norm() strips the volatile <img> attrs. Attribute order after norm (alt, class)
  // matches the component.
  const avatar = item.headshotUrl
    ? `<div class="bio-avatar"><img src="${esc(
        item.headshotUrl,
      )}" alt="${esc(item.headshotAlt)}" loading="lazy" decoding="async" class></div>`
    : "";

  // showName=false → the <h2 class="author-name"> block is omitted.
  const subtitle = `<div class="bio-subtitle">${
    item.unit?.title
      ? `<span class="bio-unit">${esc(item.unit.title)}&nbsp;|&nbsp;</span>`
      : ""
  }${item.title ? `<span class="bio-role">${esc(item.title)}</span>` : ""}</div>`;

  // Component: <div class="bio-text" set:html={item.bodyHtml} /> — raw body, only
  // when present.
  const body = item.bodyHtml
    ? `<div class="bio-text">${item.bodyHtml}</div>`
    : "";

  return `<div><div class="bio-card" style="background-color:#fff"><div class="bio-row">${avatar}<div class="bio-body markdown-body">${subtitle}${body}</div></div></div></div>`;
}

/** Mirror of about/biographies/[slug].astro's body (wrapper + h1 + card). */
export function renderBiographyDetail(item: BiographyItem): string {
  return `<div class="markdown-body mx-auto max-w-5xl px-4 py-8 md:px-6"><h1 class="mb-4">${esc(
    item.fullNameWithSuffix,
  )}</h1>${renderBiographyCard(item)}</div>`;
}

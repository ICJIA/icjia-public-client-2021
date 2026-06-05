/**
 * Unit DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as about/units/[slug].astro (the markdown-body wrapper +
 * .unit-single-frame border + the visually-hidden <h1> + UnitCard.astro, which
 * itself renders the unit title h2, the unit body — or "No description available."
 * — an optional "Read more »" link, and the unit's staff as BiographyCards) for the
 * live-detail fallback. Locked to the real components by unit.parity.test.ts (Astro
 * Container API), so it cannot drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` (and each staff `bodyHtml`) is already sanitized markdown (from the
 * injected renderToHtml in the shaper) and is emitted raw, exactly as the components'
 * `set:html` does. Every other interpolated value is HTML-escaped, matching Astro's
 * auto-escaping.
 *
 * STAFF (§4 image + the noted gap): on the live transient render item.staff is always
 * [] (the single unit REST record carries no bios and the registry can't make the
 * extra async fetch — see shapers/unit.ts). The staff branch is still rendered here
 * (and parity-locked) so the component markup can't silently drift; when staff ARE
 * present each BiographyCard headshot is an astro:assets <Image> on the build but a
 * raw-URL <img> here (the parity test strips the volatile <img> attributes — §4).
 */
import type { UnitItem, UnitStaffItem } from "../shapers/unit";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of CmsImage.astro's <img> for a staff headshot (raw-URL — §4). CmsImage
 *  emits a same-origin astro:assets <Image> on the build; the transient twin emits
 *  the raw Strapi URL. The parity test strips src/width/height/loading/decoding on
 *  both sides, so only the stable markup (the bare <img> with its alt) is compared. */
function renderHeadshot(headshot: NonNullable<UnitStaffItem["headshot"]>, alt: string): string {
  return `<img src="${esc(headshot.url)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}

/** Mirror of BiographyCard.astro as UnitCard uses it (color="#fdfdfd",
 *  showName default true). */
export function renderBiographyCard(item: UnitStaffItem, color = "#fdfdfd"): string {
  const avatar = item.headshot
    ? `<div class="bio-avatar">${renderHeadshot(item.headshot, `${item.fullName} headshot`)}</div>`
    : "";

  // <h2 id={slug ? `bio-${slug}` : undefined}> — Astro omits the attr when undefined.
  const nameId = item.slug ? ` id="bio-${esc(item.slug)}"` : "";
  const nameInner = item.slug
    ? `<a href="/about/biographies/${esc(item.slug)}/" class="bio-name-link">${esc(item.fullNameWithSuffix)}</a>`
    : esc(item.fullNameWithSuffix);
  const name = `<h2${nameId} class="author-name">${nameInner}</h2>`;

  const unitSpan = item.unit?.title
    ? `<span class="bio-unit">${esc(item.unit.title)}&nbsp;|&nbsp;</span>`
    : "";
  const roleSpan = item.title ? `<span class="bio-role">${esc(item.title)}</span>` : "";
  const subtitle = `<div class="bio-subtitle">${unitSpan}${roleSpan}</div>`;

  const text = item.bodyHtml ? `<div class="bio-text">${item.bodyHtml}</div>` : "";

  return `<div><div class="bio-card" style="background-color:${esc(color)}"><div class="bio-row">${avatar}<div class="bio-body markdown-body">${name}${subtitle}${text}</div></div></div></div>`;
}

/** Mirror of UnitCard.astro (single-unit usage: showActions=false → no staff toggle,
 *  staff column always open). */
export function renderUnitCard(item: UnitItem): string {
  const body = item.bodyHtml
    ? `<div>${item.bodyHtml}</div>`
    : `<p>No description available.</p>`;

  const actions = item.url
    ? `<div class="unit-actions"><a href="${esc(item.url)}" class="unit">Read more&nbsp;&raquo;</a></div>`
    : "";

  const staff =
    item.staff.length > 0
      ? `<hr class="unit-divider"><div class="unit-staff-list">${item.staff
          .map(
            (s) => `<div class="markdown-body">${renderBiographyCard(s, "#fdfdfd")}</div>`,
          )
          .join("")}</div>`
      : "";

  return `<div class="unit-card markdown-body"><h2>${esc(item.title)}</h2>${body}${actions}${staff}</div>`;
}

/** Mirror of about/units/[slug].astro's body (markdown-body wrapper + the 1px-border
 *  frame + the sr-only h1 + the UnitCard). */
export function renderUnitDetail(item: UnitItem): string {
  return `<div class="markdown-body mx-auto max-w-5xl px-4 py-8 md:px-6"><div class="unit-single-frame"><h1 class="sr-only">${esc(item.title)}</h1>${renderUnitCard(item)}</div></div>`;
}

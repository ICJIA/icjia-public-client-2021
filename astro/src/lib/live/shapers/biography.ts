/**
 * Biography DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `shapeBiography` so the live-detail fallback can
 * render a brand-new (post-build) staff/board bio CLIENT-SIDE from the Strapi v3
 * REST record, byte-identical to the eventual nightly-built page EXCEPT for the
 * headshot image (see docs/LIVE-DETAIL-FALLBACK.md §4). The single bio detail page
 * (about/biographies/[slug].astro) renders an <h1> of fullNameWithSuffix + a
 * <BiographyCard showName={false}> (subtitle "unit | role" + rendered bio body +
 * 125px headshot avatar) — every field that needs: fullName, suffix, title, unit
 * ({title,...}), bio body, headshot media. Verified live against
 * agency.icjia-api.cloud/biographies.
 *
 * BODY FIELD: the GraphQL query aliases `body: bio`, so data.ts's shapeBiography
 * reads `b.body`. The RAW REST record (which this shaper takes) carries the field
 * under its real name `bio`, so we read `b.bio ?? b.body` — handling both sources.
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The headshot uses imageUrl() (raw Strapi URL): a transient client
 * render can't run astro:assets (CmsImage) — the accepted §4 deviation; the nightly
 * rebuild then mints the optimized image. headshotAlt mirrors the component's
 * `alt={`${item.fullName} headshot`}`.
 */
import { AGENCY } from "../sources";
import { imageUrl } from "../imageUrl";

export interface BiographyUnit {
  title?: string;
  shortName?: string;
  slug?: string;
  url?: string;
}
export interface BiographyItem {
  id: string;
  slug: string;
  fullName: string;
  suffix?: string;
  /** "{fullName}, {suffix}" when a suffix exists, else fullName. */
  fullNameWithSuffix: string;
  title?: string;
  unit: BiographyUnit | null;
  /** Raw headshot URL for the transient render's <img> (null when no headshot). */
  headshotUrl: string | null;
  /** `${fullName} headshot` — the BiographyCard.astro CmsImage alt. */
  headshotAlt: string;
  /** bio markdown rendered + sanitized via the injected renderToHtml. */
  bodyHtml: string;
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi biography (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time shapeBiography does: build fullNameWithSuffix, flatten unit, render the
 * bio body. `render` is the environment's markdown→HTML renderer (markdown.js at
 * build / markdown.client.js in the browser). The headshot resolves to the RAW URL
 * (imageUrl) — the accepted transient deviation (§4) — vs the component's optimized
 * astro:assets <Image>; null when the record has no headshot.
 */
export function shapeBiography(b: any, render: (md: string) => string): BiographyItem {
  const fullName = b.fullName || "";
  const suffix = b.suffix || undefined;
  const unit: BiographyUnit | null = b.unit
    ? {
        title: b.unit.title,
        shortName: b.unit.shortName,
        slug: b.unit.slug,
        url: b.unit.url,
      }
    : null;
  // RAW REST → `bio`; GraphQL aliases it `body` (data.ts reads b.body).
  const bodyMd = b.bio ?? b.body;
  return {
    id: String(b.id ?? b.slug),
    slug: b.slug,
    fullName,
    suffix,
    fullNameWithSuffix: suffix ? `${fullName}, ${suffix}` : fullName,
    title: b.title,
    unit,
    headshotUrl: b.headshot ? imageUrl(b.headshot.url, AGENCY) : null,
    headshotAlt: `${fullName} headshot`,
    bodyHtml: bodyMd ? render(bodyMd) : "",
  };
}

/**
 * Unit DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getUnit` SHAPE so the live-detail fallback can
 * render a brand-new (post-build) unit CLIENT-SIDE from the Strapi v3 REST record,
 * byte-identical to the eventual nightly-built page (see
 * docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record carries the same
 * fields the build's GraphQL query reads (title, slug, shortName, url, summary,
 * body) — verified live against /units?slug= — so the same shaping works on both.
 *
 * RELATED STAFF (the gap): the unit detail page ALSO renders its staff
 * (BiographyCards) via a SECOND data call, getBiographiesByUnit(shortName). The
 * single unit REST record does NOT embed those biographies (bios reference their
 * unit via bio.unit.shortName, not vice-versa), and the 404 resolver / detail-preview
 * registry contract is single-record + synchronous — it cannot make the extra async
 * bios-by-unit fetch. So the transient client render produces the unit card with NO
 * staff (UnitItem.staff = []); the nightly rebuild fills the staff list. This is the
 * accepted "render everything else, note the gap" tradeoff (docs §2/§4 spirit).
 *
 * Because staff are always [] on the transient render, this shaper carries the
 * Biography[] field but the live path never populates it; the twin's staff branch is
 * still locked to the real UnitCard.astro by the parity test (so it cannot drift).
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The image helper uses imageUrl() (raw Strapi URL) — a transient
 * client render can't run astro:assets (docs §4).
 */
import { imageUrl } from "../imageUrl";
import { safeUrl } from "../safe-url";

/** Raw-URL headshot for the transient client render (§4) — mirror of the fields a
 *  BiographyCard reads off a shaped Biography.headshot (url/width/height). */
export interface UnitStaffHeadshot {
  url: string;
  width?: number;
  height?: number;
}

/** The staff card shape UnitCard.astro renders (subset of data.ts Biography: only
 *  the fields BiographyCard.astro actually reads). Always [] on the transient render
 *  (see the file header), but typed + shaped so the twin's branch is parity-locked. */
export interface UnitStaffItem {
  id: string;
  slug: string;
  fullName: string;
  fullNameWithSuffix: string;
  title?: string;
  unit: { title?: string; shortName?: string; slug?: string; url?: string } | null;
  /** raw-URL headshot (null when the bio has none — 75/109 records). */
  headshot: UnitStaffHeadshot | null;
  /** bio markdown rendered + sanitized via the injected renderToHtml. */
  bodyHtml: string;
}

export interface UnitItem {
  id: string;
  slug: string;
  title: string;
  shortName?: string;
  url?: string;
  /** unit body markdown rendered + sanitized via the injected renderToHtml. */
  bodyHtml: string;
  /** related staff — [] on the transient client render (see file header). */
  staff: UnitStaffItem[];
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi v3 REST unit (`?slug=`) the way data.ts's build-time getUnit
 * does: pass title/slug/shortName/url through, render the body. `render` is the
 * environment's markdown→HTML renderer (markdown.js at build / markdown.client.js in
 * the browser).
 *
 * `staff` is accepted (default []) for symmetry with the build (which renders
 * getBiographiesByUnit results) and to drive the parity test, but the live 404 path
 * passes none — the transient unit card has no staff (see file header).
 */
export function shapeUnit(
  u: any,
  render: (md: string) => string,
  staff: UnitStaffItem[] = [],
): UnitItem {
  return {
    id: String(u.id),
    slug: u.slug,
    title: u.title,
    shortName: u.shortName,
    // url reaches an href in the unit card — scheme-guard before render.
    url: u.url ? safeUrl(u.url) : u.url,
    bodyHtml: u.body ? render(u.body) : "",
    staff,
  };
}

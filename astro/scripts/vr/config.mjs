// Visual-regression harness config.
//
// Compares the live production site against the new Astro site (local dev by
// default, or a deploy URL via env) at the Vuetify breakpoints, pixel-diffing
// with pixelmatch. Captures are normalized (frozen clock, disabled animations,
// fonts-ready gate, maskable regions) so live CMS content doesn't create noise.
//
//   VR_PROD  reference (production)      default https://icjia.illinois.gov
//   VR_NEW   candidate (new Astro site)  default http://localhost:4321
//            (visual output is identical between local dev and the Netlify
//             branch deploy — only gzip/perf differ, which VR doesn't measure)

export const PROD_BASE = (process.env.VR_PROD || "https://icjia.illinois.gov").replace(/\/$/, "");
export const NEW_BASE = (process.env.VR_NEW || "http://localhost:4321").replace(/\/$/, "");

// Vuetify 2 breakpoints. dsf = deviceScaleFactor.
// Full 5-width set for the FINAL pre-cutover VR run. Set VR_ONLY to re-check
// specific routes at these widths.
export const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 900, dsf: 2 },
  { name: "tablet-768", width: 768, height: 1024, dsf: 2 },
  { name: "md-960", width: 960, height: 1024, dsf: 1 },
  { name: "desktop-1280", width: 1280, height: 1024, dsf: 1 },
  { name: "xl-1920", width: 1920, height: 1080, dsf: 1 },
];

// Routes to compare.
//   clipTop  : diff only the top N CSS px (the 90px app bar) — chrome-focused.
//   fullPage : diff the entire scrollable page (use once a template is built).
//   mask     : CSS selectors painted out before diffing (volatile content;
//              applied on whichever site has them).
// Full per-template set. Paths confirmed to exist on prod via the legacy router
// (src/router) so we never diff against prod's SPA 404 view. Detail slugs are real
// (same Strapi feeds both sites → same content back-to-back). CAROUSEL_MASK paints
// out the auto-rotating carousels (prod Vuetify .v-carousel/.v-window + Astro
// .hub-carousel) so a slide-position difference between captures isn't a false diff.
const CAROUSEL_MASK = [".hub-carousel", ".v-carousel", ".v-window"];
export const ROUTES = [
  // Chrome (clipped/element) — fast structural check of the app bar + footer.
  { id: "header-home", path: "/", clipTop: 90, mask: [] },
  { id: "footer-home", path: "/", selector: "footer", mask: [] },
  // Home — the client-fetched Research strip needs settle to paint its imagery.
  { id: "home", path: "/", fullPage: true, settleMs: 2500, mask: [] },
  // News / Press / Meetings / Events
  { id: "news-list", path: "/news/", fullPage: true, mask: [] },
  { id: "news-article", path: "/news/co-responder-programs-serve-people-in-crisis/", fullPage: true, mask: [] },
  { id: "press", path: "/news/press/", fullPage: true, mask: [] },
  { id: "meetings", path: "/news/meetings/", fullPage: true, mask: [] },
  { id: "events", path: "/events/", fullPage: true, mask: [] },
  // Publications
  { id: "publications", path: "/about/publications/", fullPage: true, mask: [] },
  // Grants
  { id: "funding", path: "/grants/funding/", fullPage: true, mask: [] },
  { id: "nofo", path: "/grants/funding/2020-casa/", fullPage: true, mask: [] },
  { id: "rules-regs", path: "/grants/rules-regs-policies/", fullPage: true, mask: [] },
  { id: "forms", path: "/forms/grant-status/", fullPage: true, mask: [] },
  // About / Staff / Bios / Units
  { id: "about-page", path: "/about/about-the-authority/", fullPage: true, mask: [] },
  { id: "staff", path: "/about/icjia-staff/", fullPage: true, mask: [] },
  { id: "board", path: "/about/composition-and-membership/", fullPage: true, mask: [] },
  { id: "bio", path: "/about/biographies/ahmadou-drame/", fullPage: true, mask: [] },
  { id: "unit", path: "/about/units/federal-and-state-grants-unit/", fullPage: true, mask: [] },
  { id: "employment", path: "/about/employment/", fullPage: true, mask: [] },
  // ResearchHub (mask the rotating carousel on the landing)
  { id: "researchhub", path: "/researchhub/", fullPage: true, settleMs: 2500, mask: CAROUSEL_MASK },
  { id: "hub-article", path: "/researchhub/articles/2019-illinois-methamphetamine-study/", fullPage: true, mask: [] },
  { id: "dataset", path: "/researchhub/datasets/illinois-uniform-crime-reports-ucr-index-crime-offense/", fullPage: true, mask: [] },
  { id: "app", path: "/researchhub/apps/parole-explorer/", fullPage: true, mask: [] },
  // IRB
  { id: "irb", path: "/irb/", fullPage: true, mask: [] },
  { id: "irb-meetings", path: "/irb/irb-meetings/", fullPage: true, mask: [] },
];

// pixelmatch per-pixel sensitivity. 0.2 tolerates the sub-pixel anti-aliasing
// differences inherent to comparing two render engines (Vue/Vuetify vs Astro)
// even with identical fonts — without it, visually-identical text reads as diff.
export const PIXEL_THRESHOLD = 0.2;

// Per-capture pass gates on mismatched-pixel ratio. Calibrated for cross-engine
// text rendering: a visually-identical text-heavy region still floors at ~1-2%
// from sub-pixel anti-aliasing, so the gate's real job is catching STRUCTURAL
// diffs (layout/size/missing elements show as high %); fine parity is confirmed
// by eye on the diff PNGs.
//   <= 1%  PASS   (visually matched; AA floor)
//   <= 3%  WARN   (human triage on the diff PNG)
//   >  3%  FAIL   (structural diff — fix it)
export const GATES = { pass: 0.01, warn: 0.03 };

// Frozen wall-clock for client-computed dates / "NEW" badges (America/Chicago).
// Keep this within the CURRENT month: prod (SPA) reads it client-side, but the new SSR
// site computes dates server-side with the REAL clock — if the two straddle a month
// boundary, date-relative content (news buckets, NEW/expired badges) shows spurious
// shifts that aren't regressions. Robust long-term fix: freeze the server clock too.
export const FROZEN_TS = Date.parse("2026-06-01T12:00:00-05:00");

// Per-attempt navigation + settle timing.
export const NAV_TIMEOUT_MS = 45000;
export const SETTLE_MS = 700;

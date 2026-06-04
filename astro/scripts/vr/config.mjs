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
  // Article batch for the post-fix VR sweep (Vue prod vs Astro branch) — a spread of
  // reports/studies/evaluations/reviews/surveys that exercise the fixed paths: nested
  // lists, in-text footnotes + numbered endnotes, bordered+striped tables, TOC, download.
  { id: "hub-cbc", path: "/researchhub/articles/community-based-corrections-task-force-report/", fullPage: true, mask: [] },
  { id: "hub-death-custody", path: "/researchhub/articles/2022-illinois-death-in-custody-annual-report/", fullPage: true, mask: [] },
  { id: "hub-victim-needs", path: "/researchhub/articles/2022-victim-needs-assessment/", fullPage: true, mask: [] },
  { id: "hub-bullying", path: "/researchhub/articles/a-content-analysis-of-illinois-school-bullying-policies/", fullPage: true, mask: [] },
  { id: "hub-mhc-review", path: "/researchhub/articles/a-review-of-literature-on-mental-health-court-goals-effectiveness-and-future-implications/", fullPage: true, mask: [] },
  { id: "hub-victim-assist", path: "/researchhub/articles/a-multi-site-evaluation-of-illinois-police-department-based-victim-assistance-programs/", fullPage: true, mask: [] },
  { id: "hub-drug-testing", path: "/researchhub/articles/a-study-of-drug-testing-practices-in-probation/", fullPage: true, mask: [] },
  { id: "hub-traffic-stop", path: "/researchhub/articles/2024-2025-illinois-traffic-and-pedestrian-stop-data-use-and-collection-task-force-findings/", fullPage: true, mask: [] },
  { id: "hub-arrest-covid", path: "/researchhub/articles/a-preliminary-look-at-illinois-arrest-trends-during-the-covid-19-pandemic-in-2020/", fullPage: true, mask: [] },
  { id: "hub-legal-aid", path: "/researchhub/articles/a-survey-of-civil-legal-aid-service-providers-in-illinois/", fullPage: true, mask: [] },
  { id: "hub-deflection", path: "/researchhub/articles/a-multi-site-evaluation-of-law-enforcement-deflection-in-the-united-states/", fullPage: true, mask: [] },
  { id: "dataset", path: "/researchhub/datasets/illinois-uniform-crime-reports-ucr-index-crime-offense/", fullPage: true, mask: [] },
  { id: "app", path: "/researchhub/apps/parole-explorer/", fullPage: true, mask: [] },
  // ── ResearchHub Datasets + Apps — strict full-section sweep (user-requested) ──
  // The two LIST pages (the real gap — never diffed before) + EVERY detail page
  // within each section: all 5 datasets + all 5 apps (status:"published" — the
  // filter both prod and Astro use; the other 30 datasets / 9 apps are unpublished
  // and render on neither site). Dataset cards are TEXT-ONLY (no images); APP cards
  // carry lazy base64 images (fetched from /api/hub-app-images.json or same-origin
  // imagePath) so the apps list + app details get extra settle to paint them.
  // Run just this set:  VR_ONLY=rh- pnpm vr
  { id: "rh-datasets-list", path: "/researchhub/datasets/", fullPage: true, mask: [] },
  { id: "rh-apps-list", path: "/researchhub/apps/", fullPage: true, settleMs: 2500, mask: [] },
  { id: "rh-ds-custody", path: "/researchhub/datasets/death-in-custody-reports/", fullPage: true, mask: [] },
  { id: "rh-ds-jj", path: "/researchhub/datasets/illinois-juvenile-justice-data-dashboard-dataset/", fullPage: true, mask: [] },
  { id: "rh-ds-ucr-hate", path: "/researchhub/datasets/illinois-uniform-crime-reports-ucr-hate-crime-offense/", fullPage: true, mask: [] },
  { id: "rh-ds-ucr-arrest", path: "/researchhub/datasets/illinois-uniform-crime-reports-ucr-index-crime-arrest/", fullPage: true, mask: [] },
  { id: "rh-ds-ucr-offense", path: "/researchhub/datasets/illinois-uniform-crime-reports-ucr-index-crime-offense/", fullPage: true, mask: [] },
  { id: "rh-app-arrest", path: "/researchhub/apps/arrest-explorer/", fullPage: true, settleMs: 1500, mask: [] },
  { id: "rh-app-idot", path: "/researchhub/apps/idot-traffics-stops-dashboard/", fullPage: true, settleMs: 1500, mask: [] },
  { id: "rh-app-custody", path: "/researchhub/apps/illinois-death-in-custody-dashboard/", fullPage: true, settleMs: 1500, mask: [] },
  { id: "rh-app-jj", path: "/researchhub/apps/illinois-juvenile-justice-data-dashboard-2025/", fullPage: true, settleMs: 1500, mask: [] },
  { id: "rh-app-parole", path: "/researchhub/apps/parole-explorer/", fullPage: true, settleMs: 1500, mask: [] },
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

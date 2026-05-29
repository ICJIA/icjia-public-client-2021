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

// Vuetify 2 breakpoints (+ 768 sm/md band). dsf = deviceScaleFactor.
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
export const ROUTES = [
  // Chrome: header band + footer element — meaningful now (chrome is built).
  { id: "header-home", path: "/", clipTop: 90, mask: [] },
  { id: "footer-home", path: "/", selector: "footer", mask: [] },
  // Full-page routes — large diffs until the matching template is built; the
  // diff PNGs still show where the chrome differs at the top.
  { id: "home", path: "/", fullPage: true, mask: [] },
  {
    id: "news-article",
    path: "/news/co-responder-programs-serve-people-in-crisis/",
    fullPage: true,
    mask: [],
  },
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
export const FROZEN_TS = Date.parse("2026-05-29T12:00:00-05:00");

// Per-attempt navigation + settle timing.
export const NAV_TIMEOUT_MS = 45000;
export const SETTLE_MS = 700;

// Computed-style PARITY ASSERTIONS — the deterministic half of the VR harness.
//
// WHY THIS FILE EXISTS (read this before dismissing a "passing" pixel run):
// run.mjs reduces each page to ONE full-page mismatch %. Two whole CLASSES of real
// regression are INVISIBLE to that number, and both shipped to production on the
// datasets pages despite the pixel run "looking fine":
//
//   1. SUBTLE-COLOR diffs. A zebra stripe is #f6f8fa vs #ffffff — a ~3.5% per-pixel
//      delta. pixelmatch's PIXEL_THRESHOLD is 0.2 (20%), so a striped row and a flat
//      white row are scored as IDENTICAL. The Variables table shipped flat white and
//      the pixel diff never twitched.
//   2. LOCALIZED diffs. A tag-row spacing/style change touches a few hundred px out
//      of a ~3000px-tall page — under 0.5% of pixels — so it drowns in the ~10%
//      cross-engine anti-aliasing floor that EVERY page already carries.
//
// You cannot fix this by lowering the pixel threshold: drop it toward 0 and the AA
// floor explodes, every page goes red, and you have LESS signal, not more. The right
// answer is to stop averaging pixels and instead compare COMPUTED STYLES / rendered
// geometry on a curated list of parity-critical properties. That is what this file
// does. It reads the SAME properties off prod and off the new site and fails on any
// difference — immune to AA noise, localized to the exact element + property, with
// the prod-vs-new values printed. Zero tolerance by design ("not forgiving").
//
// THIS LIST IS MEANT TO GROW. Every time a real visual regression is found that the
// pixel % missed, add a case here so it can never silently regress again. That is the
// authentic, ongoing maintenance the harness needs — not magic, just engineering.
//
// Each `extract` runs INSIDE the page (prod and new) and must be self-contained:
// no imports, no closures over Node scope. It returns a small normalized descriptor
// so the prod (Vuetify) DOM and the new (Astro) DOM can be compared even though their
// markup differs — we compare what the user SEES (rendered height, pill-ness, the
// stripe color), not the raw box model.

/* ── extractors (serialized to the browser) ─────────────────────────────── */

// First tag-chip's rendered look + the gap to the next chip. Works on prod
// (button.chip.v-btn) and new (a.chip) because both carry class "chip".
export function chipMetrics(sel) {
  const chips = Array.from(document.querySelectorAll(sel)).filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (!chips.length) return { found: 0 };
  const e = chips[0];
  const s = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  let gap = null;
  if (chips.length >= 2) {
    const r2 = chips[1].getBoundingClientRect();
    // same row only (chips can wrap)
    if (Math.abs(r2.top - r.top) < 4) gap = Math.round(r2.left - r.right);
  }
  const radius = parseFloat(s.borderRadius) || 0;
  return {
    found: chips.length,
    h: Math.round(r.height),
    pill: radius >= 12, // 28px prod / 28px new = pill; 0/12px square box = not
    borderPx: Math.round(parseFloat(s.borderTopWidth) || 0),
    transform: s.textTransform,
    weight: String(s.fontWeight),
    sizePx: Math.round(parseFloat(s.fontSize) || 0),
    gap,
  };
}

// Is the first real data table zebra-striped, and with which colors? Picks the first
// table with a header row of >= 3 cells (the Variables table on a dataset detail).
export function tableZebra(sel) {
  const t = Array.from(document.querySelectorAll(sel)).find(
    (x) => x.querySelectorAll('th').length >= 3 || x.querySelectorAll('tbody tr').length >= 2,
  );
  if (!t) return { found: false };
  const rows = Array.from(t.querySelectorAll('tbody tr'));
  if (rows.length < 2) return { found: false, rows: rows.length };
  const bg = (tr) => getComputedStyle(tr).backgroundColor;
  const odd = bg(rows[0]);
  const even = bg(rows[1]);
  return { found: true, odd, even, striped: odd !== even };
}

// First real card image's rendered box. Normalizes prod's <v-image> background-div
// (background-size:cover, height set on the wrapper) and the new <img class=hc-img>
// (object-fit:cover, height set on the img) to the same { h, cover }.
export function imageBox(sel) {
  const e = Array.from(document.querySelectorAll(sel)).find((x) => {
    const r = x.getBoundingClientRect();
    return r.width > 100 && r.height > 80;
  });
  if (!e) return { found: false };
  const s = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  return { found: true, h: Math.round(r.height), cover: s.objectFit === 'cover' || s.backgroundSize === 'cover' };
}

// Resolved first font-family token + weight of an element (catches an Oswald↔Lato
// regression on headings/titles, which a pixel diff buries in AA noise).
export function fontOf(sel) {
  const e = document.querySelector(sel);
  if (!e) return { found: false };
  const s = getComputedStyle(e);
  return {
    found: true,
    family: s.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase(),
    weight: String(s.fontWeight),
  };
}

/* ── the checks ─────────────────────────────────────────────────────────────
   Each case: { desc, prodSel, newSel, extract, waitFor?, compare }.
   compare is a list of { key } (exact ===) or { key, tol } (numeric within ±tol).
   prodSel/newSel may differ when the two DOMs name the element differently. */

export const ASSERTIONS = [
  {
    id: 'ds-detail',
    path: '/researchhub/datasets/illinois-juvenile-justice-data-dashboard-dataset/',
    waitFor: '.chip',
    cases: [
      {
        desc: 'dataset tag chips = prod pill (UPPERCASE, 2px border, 24px tall, 4px gap, 10px/700)',
        prodSel: '.chip',
        newSel: '.chip',
        extract: chipMetrics,
        compare: [{ key: 'pill' }, { key: 'transform' }, { key: 'borderPx' }, { key: 'weight' }, { key: 'sizePx' }, { key: 'h', tol: 2 }, { key: 'gap', tol: 2 }],
      },
      {
        desc: 'Variables table is zebra-striped, even rows #f6f8fa (prod parity)',
        prodSel: 'table',
        newSel: 'table',
        extract: tableZebra,
        compare: [{ key: 'striped' }, { key: 'even' }, { key: 'odd' }],
      },
    ],
  },
  {
    id: 'apps-list',
    path: '/researchhub/apps/',
    settleMs: 2500,
    waitFor: 'h1',
    cases: [
      {
        desc: 'app card image box = 250px tall, cover-cropped (prod v-img parity)',
        // prod's cover lives on the inner .v-image__image bg-div, NOT the .v-responsive
        // sizer wrapper (which has no background) — selecting the wrapper falsely reads
        // cover=false. A reminder that these selectors are DOM-specific + need tuning.
        prodSel: '.v-image__image',
        newSel: '.hc-img',
        extract: imageBox,
        compare: [{ key: 'h', tol: 3 }, { key: 'cover' }],
      },
      {
        desc: 'researchhub list <h1> renders Lato (NOT Oswald), weight 900',
        prodSel: 'h1',
        newSel: '.page-heading h1',
        extract: fontOf,
        compare: [{ key: 'family' }, { key: 'weight' }],
      },
    ],
  },
];

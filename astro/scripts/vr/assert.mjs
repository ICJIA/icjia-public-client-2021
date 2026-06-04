// VR computed-style ASSERTIONS runner — the strict, AA-immune half of the harness.
// See assertions.mjs for WHY this exists (the pixel % can't see subtle-color or
// localized diffs; this reads computed styles off prod + new and fails on any
// difference). Usage:
//   node scripts/vr/assert.mjs                 (prod from config vs VR_NEW)
//   VR_NEW=https://deploy-preview-… node scripts/vr/assert.mjs
//
// Exits non-zero if ANY case mismatches, so it can gate CI alongside run.mjs.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROD_BASE, NEW_BASE, FROZEN_TS, NAV_TIMEOUT_MS, SETTLE_MS } from "./config.mjs";
import { ASSERTIONS } from "./assertions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "__diffs__");

// One viewport is enough — computed-style parity is viewport-independent, and 1280
// is wide enough to show the md-only Variables table (hidden below 960).
const VP = { width: 1280, height: 1024, dsf: 1 };

async function load(context, base, a) {
  const page = await context.newPage();
  // Freeze the clock before any script runs (prod is a client-rendered SPA whose
  // dates/badges would otherwise drift between captures).
  await page.addInitScript((ts) => {
    const Real = Date;
    class Frozen extends Real {
      constructor(...x) {
        super(...(x.length ? x : [ts]));
      }
      static now() {
        return ts;
      }
    }
    // eslint-disable-next-line no-global-assign
    globalThis.Date = Frozen;
  }, FROZEN_TS);
  await page.setViewportSize({ width: VP.width, height: VP.height });
  await page.goto(base + a.path, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" }).catch(() => {});
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  if (a.waitFor) await page.waitForSelector(a.waitFor, { timeout: 8000 }).catch(() => {});
  // Scroll through to trigger lazy/below-fold imagery (apps base64/webp), then settle.
  await page
    .evaluate(
      () =>
        new Promise((res) => {
          let y = 0;
          const tick = () => {
            window.scrollTo(0, y);
            y += Math.round(window.innerHeight * 0.8);
            if (y < document.body.scrollHeight) setTimeout(tick, 100);
            else {
              window.scrollTo(0, 0);
              setTimeout(res, 200);
            }
          };
          tick();
        }),
    )
    .catch(() => {});
  await page.waitForTimeout(a.settleMs || SETTLE_MS);
  return page;
}

function compareVals(prod, neu, spec) {
  const mism = [];
  const missing = (v) => !v || v.error || v.found === false || v.found === 0;
  if (missing(prod)) mism.push({ key: "prod element", prod: JSON.stringify(prod), new: "" });
  if (missing(neu)) mism.push({ key: "new element", prod: "", new: JSON.stringify(neu) });
  if (mism.length) return mism; // can't field-compare if either side is missing
  for (const { key, tol } of spec) {
    const a = prod[key];
    const b = neu[key];
    let ok;
    if (tol != null) ok = a != null && b != null ? Math.abs(a - b) <= tol : a == null && b == null;
    else ok = a === b;
    if (!ok) mism.push({ key: tol != null ? `${key} (±${tol})` : key, prod: a, new: b });
  }
  return mism;
}

(async () => {
  await mkdir(OUT, { recursive: true });
  console.log(`VR assertions: ${PROD_BASE}  vs  ${NEW_BASE}\n`);
  const browser = await chromium.launch();
  const results = [];

  for (const a of ASSERTIONS) {
    const ctxP = await browser.newContext({ deviceScaleFactor: VP.dsf });
    const ctxN = await browser.newContext({ deviceScaleFactor: VP.dsf });
    try {
      const pProd = await load(ctxP, PROD_BASE, a);
      const pNew = await load(ctxN, NEW_BASE, a);
      for (const c of a.cases) {
        const prodVal = await pProd.evaluate(c.extract, c.prodSel).catch((e) => ({ error: String((e && e.message) || e) }));
        const newVal = await pNew.evaluate(c.extract, c.newSel).catch((e) => ({ error: String((e && e.message) || e) }));
        const mism = compareVals(prodVal, newVal, c.compare);
        results.push({ id: a.id, desc: c.desc, ok: mism.length === 0, mism, prodVal, newVal });
      }
    } catch (e) {
      results.push({ id: a.id, desc: "(page load error)", ok: false, mism: [{ key: "load", prod: "", new: String((e && e.message) || e) }] });
    } finally {
      await ctxP.close().catch(() => {});
      await ctxN.close().catch(() => {});
    }
  }
  await browser.close();

  // ── console ──
  for (const r of results) {
    const tag = r.ok ? "PASS" : "FAIL";
    console.log(`  [${tag}] ${r.id.padEnd(10)} ${r.desc}`);
    if (!r.ok) for (const m of r.mism) console.log(`         ↳ ${m.key}: prod=${JSON.stringify(m.prod)}  new=${JSON.stringify(m.new)}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\nassertions: ${results.length - failed.length}/${results.length} passed${failed.length ? `  ·  ${failed.length} FAILED` : ""}`);

  // ── report.md ──
  const lines = [
    `# VR computed-style assertions`,
    ``,
    `Deterministic, anti-aliasing-immune parity checks. Unlike the pixel diff, these`,
    `compare COMPUTED STYLES (not pixels), so they catch subtle-color (zebra) and`,
    `localized (chip spacing) regressions that a full-page mismatch % cannot see.`,
    ``,
    `- **prod (reference):** ${PROD_BASE}`,
    `- **new (candidate):** ${NEW_BASE}`,
    `- **result:** ${results.length - failed.length}/${results.length} passed${failed.length ? ` · ${failed.length} FAILED` : ""}`,
    ``,
    `| check | status | detail (prod vs new) |`,
    `|---|---|---|`,
    ...results.map((r) => {
      const detail = r.ok ? "—" : r.mism.map((m) => `\`${m.key}\`: ${JSON.stringify(m.prod)} ≠ ${JSON.stringify(m.new)}`).join("; ");
      return `| ${r.desc} | ${r.ok ? "PASS" : "**FAIL**"} | ${detail} |`;
    }),
  ];
  await writeFile(path.join(OUT, "assert-report.md"), lines.join("\n") + "\n");
  console.log(`report → scripts/vr/__diffs__/assert-report.md`);
  process.exit(failed.length ? 1 : 0);
})();

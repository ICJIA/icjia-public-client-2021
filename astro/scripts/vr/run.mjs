// Visual-regression runner. Usage:
//   node scripts/vr/run.mjs            (compares VR_PROD vs VR_NEW; see config)
//   VR_NEW=https://feat-...netlify.app node scripts/vr/run.mjs
//
// Writes prod/new/diff PNGs to scripts/vr/__diffs__/ and a report.md, and exits
// non-zero if any capture FAILs (> 1% mismatch).
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROD_BASE,
  NEW_BASE,
  VIEWPORTS,
  ROUTES,
  PIXEL_THRESHOLD,
  GATES,
  FROZEN_TS,
  NAV_TIMEOUT_MS,
  SETTLE_MS,
} from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "__diffs__");

const ANIM_OFF =
  "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important}";

async function snap(context, base, route, vp) {
  const page = await context.newPage();
  // Freeze the clock BEFORE any script runs so client-computed dates/badges
  // (prod is a client-rendered SPA) are deterministic across captures.
  await page.addInitScript((ts) => {
    const Real = Date;
    class Frozen extends Real {
      constructor(...a) {
        super(...(a.length ? a : [ts]));
      }
      static now() {
        return ts;
      }
    }
    // eslint-disable-next-line no-global-assign
    globalThis.Date = Frozen;
  }, FROZEN_TS);

  await page.setViewportSize({ width: vp.width, height: vp.height });
  const url = base + route.path;
  await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await page.addStyleTag({ content: ANIM_OFF }).catch(() => {});
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  for (const sel of route.mask || []) {
    await page
      .evaluate((s) => {
        document.querySelectorAll(s).forEach((el) => (el.style.visibility = "hidden"));
      }, sel)
      .catch(() => {});
  }
  // Remove the Astro dev toolbar (NEW site in dev only — a bottom-of-page
  // overlay absent on prod). No-op on prod.
  await page.evaluate(() => document.querySelector("astro-dev-toolbar")?.remove()).catch(() => {});
  // Full-page diffs: scroll through to trigger lazy / below-fold images (both
  // sites lazy-load CMS imagery — e.g. the home Research strip fetches client-
  // side), then return to top and let the network settle so everything is
  // painted before capture.
  if (route.fullPage) {
    await page
      .evaluate(
        () =>
          new Promise((resolve) => {
            let y = 0;
            const tick = () => {
              window.scrollTo(0, y);
              y += Math.round(window.innerHeight * 0.8);
              if (y < document.body.scrollHeight) setTimeout(tick, 120);
              else {
                window.scrollTo(0, 0);
                setTimeout(resolve, 200);
              }
            };
            tick();
          }),
      )
      .catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(route.settleMs || SETTLE_MS);

  let buf;
  if (route.selector) {
    // Element-level capture (e.g. the footer, which sits at a variable
    // page-bottom). Same selector must resolve on both sites.
    const el = page.locator(route.selector).first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(200);
    buf = await el.screenshot();
  } else {
    const opts = route.fullPage
      ? { fullPage: true }
      : route.clipTop
        ? { clip: { x: 0, y: 0, width: vp.width, height: route.clipTop } }
        : {};
    buf = await page.screenshot(opts);
  }
  await page.close();
  return PNG.sync.read(buf);
}

// Crop both frames to the COMMON (min) area. The two sites are live with different
// content LENGTHS, so a full-page HEIGHT difference would otherwise white-pad the
// shorter frame → every padded row reads as "diff" and floods the ratio. We compare
// the shared top region instead; tail-length differences are content, not a parity
// regression. (Width is the fixed viewport, so in practice only height differs.)
function align(a, b) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const crop = (img) => {
    if (img.width === w && img.height === h) return img;
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(img, out, 0, 0, w, h, 0, 0);
    return out;
  };
  return [crop(a), crop(b), w, h];
}

(async () => {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  console.log(`VR: ${PROD_BASE}  vs  ${NEW_BASE}\n`);

  const browser = await chromium.launch();
  const results = [];

  // VR_ONLY=<substring> limits routes for fast iteration (e.g. VR_ONLY=header).
  const only = process.env.VR_ONLY;
  const routes = only ? ROUTES.filter((r) => r.id.includes(only)) : ROUTES;

  for (const route of routes) {
    for (const vp of VIEWPORTS) {
      const ctxProd = await browser.newContext({ deviceScaleFactor: vp.dsf });
      const ctxNew = await browser.newContext({ deviceScaleFactor: vp.dsf });
      let ratio = null;
      let status = "ERR";
      let note = "";
      try {
        // Back-to-back per route×viewport to minimize CMS drift between captures.
        const prodImg = await snap(ctxProd, PROD_BASE, route, vp);
        const newImg = await snap(ctxNew, NEW_BASE, route, vp);
        const [a, b, w, h] = align(prodImg, newImg);
        const diff = new PNG({ width: w, height: h });
        const bad = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: PIXEL_THRESHOLD });
        ratio = bad / (w * h);
        status = ratio <= GATES.pass ? "PASS" : ratio <= GATES.warn ? "WARN" : "FAIL";
        const stem = `${route.id}__${vp.name}`;
        await writeFile(path.join(OUT, `${stem}__prod.png`), PNG.sync.write(a));
        await writeFile(path.join(OUT, `${stem}__new.png`), PNG.sync.write(b));
        await writeFile(path.join(OUT, `${stem}__diff.png`), PNG.sync.write(diff));
      } catch (e) {
        note = (e && e.message) || String(e);
      }
      await ctxProd.close();
      await ctxNew.close();
      results.push({ route: route.id, vp: vp.name, ratio, status, note });
      const pct = ratio != null ? (ratio * 100).toFixed(2) + "%" : "—";
      console.log(`  ${route.id.padEnd(14)} ${vp.name.padEnd(13)} ${status.padEnd(5)} ${pct.padStart(7)}  ${note}`);
    }
  }

  await browser.close();

  const lines = [
    `# Visual regression report`,
    ``,
    `- **prod (reference):** ${PROD_BASE}`,
    `- **new (candidate):** ${NEW_BASE}`,
    `- gates: PASS ≤ ${GATES.pass * 100}% · WARN ≤ ${GATES.warn * 100}% · else FAIL`,
    ``,
    `| route | viewport | status | mismatch |`,
    `|---|---|---|---|`,
    ...results.map(
      (r) =>
        `| ${r.route} | ${r.vp} | ${r.status} | ${r.ratio != null ? (r.ratio * 100).toFixed(2) + "%" : r.note || "—"} |`,
    ),
  ];
  await writeFile(path.join(OUT, "report.md"), lines.join("\n") + "\n");

  const fails = results.filter((r) => r.status === "FAIL").length;
  const warns = results.filter((r) => r.status === "WARN").length;
  const errs = results.filter((r) => r.status === "ERR").length;
  console.log(`\nPASS ${results.length - fails - warns - errs} · WARN ${warns} · FAIL ${fails} · ERR ${errs}`);
  console.log(`diffs + report → scripts/vr/__diffs__/`);
  process.exit(fails > 0 ? 1 : 0);
})();

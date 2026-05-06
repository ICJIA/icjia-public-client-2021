// One-off probe: run axe-core's target-size rule against the biography page
// IBM flagged, to understand why axe-core's standard sitemap audit reports
// it clean while IBM reports a violation. Reads target-size results,
// incomplete (cantTell), and passes — all three buckets.
//
// Usage: node scripts/probe-target-size.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AXE_PATH = path.join(ROOT, "node_modules", "axe-core", "axe.min.js");

const URL = "http://localhost:8080/about/biographies/sharyn-adams/";

(async () => {
  const axeSource = fs.readFileSync(AXE_PATH, "utf8");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(2500);

  await page.addScriptTag({ content: axeSource });

  // Standard run — same tags as the sitemap audit
  const standardRun = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      resultTypes: ["violations", "incomplete", "passes"],
    });
  });

  const ts = (arr) => arr.filter((r) => r.id === "target-size");
  console.log("=== STANDARD wcag22aa run (current sitemap-audit config) ===");
  console.log(`violations.target-size:   ${ts(standardRun.violations).length}`);
  console.log(`incomplete.target-size:   ${ts(standardRun.incomplete).length}`);
  console.log(`passes.target-size:       ${ts(standardRun.passes).length}`);
  for (const r of ts(standardRun.incomplete)) {
    console.log(`  incomplete reason: ${r.help} — ${r.nodes.length} nodes`);
    for (const n of r.nodes.slice(0, 2)) {
      console.log(`    target: ${n.target.join(" | ")}`);
      console.log(`    any:    ${(n.any || []).map(c => c.id + ': ' + c.message).join(' / ')}`);
      console.log(`    none:   ${(n.none || []).map(c => c.id + ': ' + c.message).join(' / ')}`);
    }
  }
  for (const r of ts(standardRun.violations)) {
    console.log(`  violation: ${r.help} — ${r.nodes.length} nodes`);
    for (const n of r.nodes.slice(0, 2)) {
      console.log(`    target: ${n.target.join(" | ")}`);
      console.log(`    failureSummary: ${n.failureSummary}`);
    }
  }

  // Explicit target-size only — to see what axe says about that rule directly
  const targetOnly = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, {
      runOnly: { type: "rule", values: ["target-size"] },
      resultTypes: ["violations", "incomplete", "passes"],
    });
  });
  console.log("\n=== target-size rule only ===");
  console.log(`violations: ${targetOnly.violations.length} rules, ${targetOnly.violations.flatMap(r => r.nodes).length} nodes`);
  console.log(`incomplete: ${targetOnly.incomplete.length} rules, ${targetOnly.incomplete.flatMap(r => r.nodes).length} nodes`);
  console.log(`passes:     ${targetOnly.passes.length} rules, ${targetOnly.passes.flatMap(r => r.nodes).length} nodes`);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

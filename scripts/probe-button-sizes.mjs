// Measure actual rendered button sizes on the bio page IBM flagged.
// WCAG 2.5.8 (Target Size Minimum, Level AA): targets must be ≥ 24×24 CSS px,
// OR have ≥ 24px circular spacing to the next target. axe-core and IBM
// disagree on this page; this probe extracts the truth from the rendered DOM.
import { chromium } from "playwright";

const URL = "http://localhost:8080/about/biographies/sharyn-adams/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(2500);

  const results = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.map((b) => {
      const rect = b.getBoundingClientRect();
      const text = (b.innerText || b.textContent || "").trim().slice(0, 40);
      const cls = b.className.toString().slice(0, 80);
      return {
        text,
        cls,
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        ok24: rect.width >= 24 && rect.height >= 24,
      };
    }).filter((b) => b.cls.includes("v-btn"));
  });

  console.log(`Total v-btn elements on page: ${results.length}`);
  console.log("\n=== Buttons UNDER 24px in either dimension ===");
  const small = results.filter((b) => !b.ok24);
  for (const b of small) {
    console.log(`  ${b.w}x${b.h}px  text="${b.text}"  cls="${b.cls.slice(0, 60)}"`);
  }
  console.log(`\n${small.length} of ${results.length} buttons under 24×24 minimum.`);

  console.log("\n=== Distribution by size bucket ===");
  const buckets = {};
  for (const b of results) {
    const k = `${Math.round(b.w/4)*4}x${Math.round(b.h/4)*4}`;
    buckets[k] = (buckets[k] || 0) + 1;
  }
  for (const [k, n] of Object.entries(buckets).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${k}: ${n}`);
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

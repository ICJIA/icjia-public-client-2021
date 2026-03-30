/**
 * Targeted axe-core audit for SiteImprove sia-r14 "Visible label and accessible name do not match"
 * Tests the 3 pages flagged in the SiteImprove report.
 */
const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");

const BASE_URL = "http://localhost:8080";

const PAGES = [
  { url: "/researchhub/dicra/", name: "DICRA (3 occ)" },
  { url: "/about/employment/", name: "Employment (2 occ)" },
  { url: "/about/", name: "About (2 occ)" },
];

async function run() {
  console.log("Targeted axe-core audit: sia-r14 label in name\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let totalViolations = 0;
  let cleanPages = 0;

  for (const pageInfo of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      await page.goto(`${BASE_URL}${pageInfo.url}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await new Promise((r) => setTimeout(r, 4000));

      const results = await new AxePuppeteer(page)
        .options({
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        })
        .analyze();

      if (results.violations.length === 0) {
        console.log(`  CLEAN  ${pageInfo.name}`);
        cleanPages++;
      } else {
        console.log(`  ${results.violations.length} violation(s)  ${pageInfo.name}`);
        results.violations.forEach((v) => {
          const nodes = v.nodes.length;
          console.log(`         [${v.impact}] ${v.id}: ${v.help} (${nodes} element${nodes > 1 ? "s" : ""})`);
          v.nodes.slice(0, 3).forEach((n) => {
            const html = n.html.length > 120 ? n.html.substring(0, 120) + "..." : n.html;
            console.log(`           -> ${html}`);
          });
          if (nodes > 3) console.log(`           ... and ${nodes - 3} more`);
        });
        totalViolations += results.violations.length;
      }
    } catch (err) {
      console.log(`  ERROR  ${pageInfo.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n--- Summary ---`);
  console.log(`Pages tested: ${PAGES.length}`);
  console.log(`Clean pages: ${cleanPages}/${PAGES.length}`);
  console.log(`Total violation types: ${totalViolations}`);
}

run().catch(console.error);

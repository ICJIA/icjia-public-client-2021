/**
 * Targeted axe-core audit for SiteImprove sia-r68 "Container element is empty"
 * Tests the 6 pages flagged in the SiteImprove report.
 */
const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");

const BASE_URL = "http://localhost:8080";

const PAGES = [
  { url: "/mhcontinuum/print-friendly", name: "MH Continuum Print" },
  { url: "/sudcontinuum/print-friendly", name: "SUD Continuum Print" },
  { url: "/researchhub/articles/violence-prevention-basic-ideas-for-approaches-and-coordination", name: "Violence Prevention" },
  { url: "/mhcontinuum/", name: "MH Continuum" },
  { url: "/sudcontinuum/", name: "SUD Continuum" },
  { url: "/researchhub/articles/an-exploratory-evaluation-of-redeploy-illinois-findings-on-incentive-based-juvenile-diversion-services", name: "Redeploy Illinois" },
];

async function run() {
  console.log("Targeted axe-core audit: sia-r68 empty containers\n");

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

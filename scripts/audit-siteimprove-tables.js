/**
 * Targeted axe-core audit for SiteImprove sia-r77 "Table cell missing context"
 * Tests the 9 specific pages flagged in the SiteImprove report.
 */
const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");

const BASE_URL = "http://localhost:8080";

const PAGES = [
  { url: "/researchhub/articles/the-administration-of-naloxone-by-law--enforcement-officers-a-statewide-survey-of-police-chiefs-in-illinois/", name: "Naloxone Administration" },
  { url: "/researchhub/articles/the-cost-of-justice-the-impact-of-criminal-justice-financial-obligations-on-individuals-and-families/", name: "Cost of Justice" },
  { url: "/researchhub/articles/criminal-history-record-checks-for-federally-assisted-housing-applications-2023-report/", name: "Criminal History 2023" },
  { url: "/researchhub/articles/criminal-history-records-check-for-federally-assisted-housing-applications--state-fiscal-year-2023-annual-report/", name: "Criminal History SFY2023" },
  { url: "/researchhub/articles/violence-prevention-basic-ideas-for-approaches-and-coordination", name: "Violence Prevention" },
  { url: "/researchhub/articles/domestic-violence-trends-in-illinois-victimization-characteristics-help-seeking-and-service-utilization/", name: "Domestic Violence Trends" },
  { url: "/researchhub/articles/national-and-illinois-youth-substance-use-risk-factors-prevalence-and-treatment/", name: "Youth Substance Use" },
  { url: "/researchhub/articles/violence-interrupters-a-review-of-the-literature/", name: "Violence Interrupters" },
  { url: "/researchhub/articles/lewd-sexual-display-in-a-penal-institution-2024-report/", name: "Lewd Display 2024" },
];

async function run() {
  console.log("Targeted axe-core audit: sia-r77 table cell context\n");

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

      // Wait for CMS content + a11y fixups (matches App.vue 2000ms delay + buffer)
      await new Promise((r) => setTimeout(r, 4000));

      const results = await new AxePuppeteer(page)
        .options({
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        })
        .analyze();

      // Filter for table-related violations
      const tableViolations = results.violations.filter((v) =>
        ["td-has-header", "th-has-data-cells", "td-headers-attr"].includes(v.id)
      );
      const allViolations = results.violations;

      if (allViolations.length === 0) {
        console.log(`  CLEAN  ${pageInfo.name}`);
        cleanPages++;
      } else {
        console.log(`  ${allViolations.length} violation(s)  ${pageInfo.name}`);
        allViolations.forEach((v) => {
          const nodes = v.nodes.length;
          console.log(`         [${v.impact}] ${v.id}: ${v.help} (${nodes} element${nodes > 1 ? "s" : ""})`);
          // Show first 2 affected elements
          v.nodes.slice(0, 2).forEach((n) => {
            const html = n.html.length > 120 ? n.html.substring(0, 120) + "..." : n.html;
            console.log(`           -> ${html}`);
          });
          if (nodes > 2) console.log(`           ... and ${nodes - 2} more`);
        });
        totalViolations += allViolations.length;
      }

      // Also report table-specific info
      if (tableViolations.length > 0) {
        console.log(`         ^^^ TABLE ISSUES: ${tableViolations.map((v) => v.id).join(", ")}`);
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

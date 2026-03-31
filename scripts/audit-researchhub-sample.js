/**
 * Quick axe-core audit of 20 Research Hub pages (including articles).
 * Usage: node scripts/audit-researchhub-sample.js
 */
const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "http://localhost:8080";
const API_DIR = path.join(__dirname, "..", "public", "api");
const OUTPUT_DIR = path.join(__dirname, "..", "reports", "accessibility-audit-results");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = path.join(OUTPUT_DIR, `audit-researchhub-sample-${TIMESTAMP}.json`);

const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
};

function loadResearchHubPages() {
  const pages = [];

  // Static researchhub page
  pages.push({ url: "/researchhub/", name: "Research Hub", contentType: "static" });

  // Hub articles/apps/datasets from hub.json
  const hub = fs.readJSONSync(path.join(API_DIR, "hub.json"));
  const arr = Array.isArray(hub) ? hub : hub.message || hub.data || [hub];
  for (const item of arr) {
    if (item.fullPath && item.fullPath.startsWith("/researchhub/")) {
      pages.push({
        url: item.fullPath,
        name: item.title || item.fullPath,
        contentType: "hub",
      });
    }
  }

  return pages;
}

async function run() {
  const allPages = loadResearchHubPages();

  // Pick 20: the static hub page + mix of articles and other hub content
  const articles = allPages.filter(p => p.url.includes("/articles/"));
  const others = allPages.filter(p => !p.url.includes("/articles/") && p.url !== "/researchhub/");
  const hubStatic = allPages.find(p => p.url === "/researchhub/");

  // 1 static + 14 articles + 5 other hub pages
  const sample = [
    hubStatic,
    ...articles.sort(() => Math.random() - 0.5).slice(0, 14),
    ...others.sort(() => Math.random() - 0.5).slice(0, 5),
  ].filter(Boolean).slice(0, 20);

  console.log(`Auditing ${sample.length} Research Hub pages`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  await fs.ensureDir(OUTPUT_DIR);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const report = {
    metadata: {
      date: new Date().toISOString(),
      totalPages: sample.length,
      baseUrl: BASE_URL,
      wcagTarget: "WCAG 2.1 Level AA",
      tool: "axe-core via @axe-core/puppeteer",
    },
    summary: { clean: 0, dirty: 0, errors: 0 },
    cleanPages: [],
    dirtyPages: [],
    errorPages: [],
  };

  for (let i = 0; i < sample.length; i++) {
    const pg = sample[i];
    const url = BASE_URL + pg.url;
    const label = `[${i + 1}/${sample.length}]`;

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));

      const results = await new AxePuppeteer(page).options(AXE_OPTIONS).analyze();
      await page.close();

      if (results.violations.length === 0) {
        report.summary.clean++;
        report.cleanPages.push({ url: pg.url, name: pg.name, contentType: pg.contentType, passes: results.passes.length });
        console.log(`${label} CLEAN  ${pg.url}`);
      } else {
        report.summary.dirty++;
        const violations = results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags,
          nodes: v.nodes.map(n => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        }));
        report.dirtyPages.push({
          url: pg.url, name: pg.name, contentType: pg.contentType,
          violationCount: violations.length,
          nodeCount: violations.reduce((s, v) => s + v.nodes.length, 0),
          violations,
        });
        console.log(`${label} DIRTY  ${pg.url}  (${violations.length} violations)`);
      }
    } catch (err) {
      report.summary.errors++;
      report.errorPages.push({ url: pg.url, name: pg.name, error: err.message });
      console.log(`${label} ERROR  ${pg.url}  ${err.message}`);
    }
  }

  await browser.close();
  await fs.writeJSON(OUTPUT_FILE, report, { spaces: 2 });

  console.log(`\n--- Results ---`);
  console.log(`Clean: ${report.summary.clean}`);
  console.log(`Dirty: ${report.summary.dirty}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Report: ${OUTPUT_FILE}`);
}

run().catch(console.error);

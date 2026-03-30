/**
 * ICJIA Full-Site Accessibility Audit
 * Tests EVERY page (2,356+) against WCAG 2.1 Level AA using axe-core.
 *
 * Usage:
 *   node scripts/audit-full-site.js
 *
 * Requires dev server running on localhost:8080
 * Estimated runtime: ~4 hours
 */

const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "http://localhost:8080";
const API_DIR = path.join(__dirname, "..", "public", "api");
const OUTPUT_DIR = path.join(__dirname, "..", "reports", "accessibility-audit-results");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = path.join(OUTPUT_DIR, `full-site-audit-${TIMESTAMP}.json`);

const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
};

// Static pages not in API JSON
const STATIC_PAGES = [
  { url: "/", name: "Home", contentType: "static" },
  { url: "/about/", name: "About", contentType: "static" },
  { url: "/about/overview", name: "About - Overview", contentType: "static" },
  { url: "/about/contact", name: "Contact", contentType: "static" },
  { url: "/news/", name: "News Listing", contentType: "static" },
  { url: "/funding/", name: "Funding Opportunities", contentType: "static" },
  { url: "/events/", name: "Events", contentType: "static" },
  { url: "/about/meetings/", name: "Meetings", contentType: "static" },
  { url: "/about/employment/", name: "Employment", contentType: "static" },
  { url: "/researchhub/", name: "Research Hub", contentType: "static" },
  { url: "/search/", name: "Search", contentType: "static" },
  { url: "/datasets/", name: "Datasets", contentType: "static" },
  { url: "/about/biographies", name: "Staff Biographies", contentType: "static" },
  { url: "/grants/", name: "Grants", contentType: "static" },
  { url: "/grants/required-forms/", name: "Required Forms", contentType: "static" },
  { url: "/forms/grant-status/", name: "Grant Status Form", contentType: "static" },
  { url: "/forms/lap-request/", name: "LAP Request Form", contentType: "static" },
];

function loadAllPages() {
  const pages = [...STATIC_PAGES];
  const files = fs.readdirSync(API_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const contentType = path.basename(file, ".json");
    const raw = fs.readJSONSync(path.join(API_DIR, file));
    const arr = Array.isArray(raw) ? raw : raw.message || raw.data || [raw];
    for (const item of arr) {
      if (item.fullPath) {
        pages.push({
          url: item.fullPath,
          name: item.title || item.name || item.fullPath,
          contentType,
        });
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  return pages.filter((p) => {
    const key = p.url.replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
}

async function run() {
  const pages = loadAllPages();
  console.log(`ICJIA Full-Site Accessibility Audit`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Pages to test: ${pages.length}`);
  console.log(`Target: WCAG 2.1 Level AA`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  await fs.ensureDir(OUTPUT_DIR);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const report = {
    metadata: {
      date: new Date().toISOString(),
      totalPages: pages.length,
      baseUrl: BASE_URL,
      wcagTarget: "WCAG 2.1 Level AA",
      tool: "axe-core via @axe-core/puppeteer",
    },
    summary: {
      clean: 0,
      dirty: 0,
      errors: 0,
      byContentType: {},
    },
    cleanPages: [],
    dirtyPages: [],
    errorPages: [],
  };

  const startTime = Date.now();

  for (let i = 0; i < pages.length; i++) {
    const pageInfo = pages[i];
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const elapsed = Date.now() - startTime;
    const rate = i > 0 ? elapsed / i : 6000;
    const remaining = rate * (pages.length - i);
    const pct = ((i / pages.length) * 100).toFixed(1);

    try {
      await page.goto(`${BASE_URL}${pageInfo.url}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for CMS content + a11y fixups
      await new Promise((r) => setTimeout(r, 3000));

      const results = await new AxePuppeteer(page).options(AXE_OPTIONS).analyze();

      // Init content type counter
      if (!report.summary.byContentType[pageInfo.contentType]) {
        report.summary.byContentType[pageInfo.contentType] = { clean: 0, dirty: 0, errors: 0 };
      }

      if (results.violations.length === 0) {
        report.summary.clean++;
        report.summary.byContentType[pageInfo.contentType].clean++;
        report.cleanPages.push({
          url: pageInfo.url,
          name: pageInfo.name,
          contentType: pageInfo.contentType,
          passes: results.passes.length,
        });
        process.stdout.write(`  [${pct}%] CLEAN  ${pageInfo.url.substring(0, 80)}  (ETA: ${formatDuration(remaining)})\n`);
      } else {
        report.summary.dirty++;
        report.summary.byContentType[pageInfo.contentType].dirty++;
        const violations = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags.filter((t) => t.startsWith("wcag")),
          nodes: v.nodes.map((n) => ({
            html: n.html.substring(0, 300),
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        }));
        report.dirtyPages.push({
          url: pageInfo.url,
          name: pageInfo.name,
          contentType: pageInfo.contentType,
          violationCount: results.violations.length,
          nodeCount: results.violations.reduce((sum, v) => sum + v.nodes.length, 0),
          violations,
        });
        process.stdout.write(`  [${pct}%] DIRTY (${results.violations.length} violations)  ${pageInfo.url.substring(0, 60)}  (ETA: ${formatDuration(remaining)})\n`);
      }
    } catch (err) {
      if (!report.summary.byContentType[pageInfo.contentType]) {
        report.summary.byContentType[pageInfo.contentType] = { clean: 0, dirty: 0, errors: 0 };
      }
      report.summary.errors++;
      report.summary.byContentType[pageInfo.contentType].errors++;
      report.errorPages.push({
        url: pageInfo.url,
        name: pageInfo.name,
        contentType: pageInfo.contentType,
        error: err.message,
      });
      process.stdout.write(`  [${pct}%] ERROR  ${pageInfo.url.substring(0, 80)}: ${err.message.substring(0, 60)}\n`);
    } finally {
      await page.close();
    }

    // Save progress every 50 pages
    if (i % 50 === 0 && i > 0) {
      report.metadata.lastUpdated = new Date().toISOString();
      report.metadata.pagesCompleted = i;
      await fs.writeJSON(OUTPUT_FILE, report, { spaces: 2 });
    }
  }

  await browser.close();

  const totalTime = Date.now() - startTime;
  report.metadata.totalDuration = formatDuration(totalTime);
  report.metadata.completedAt = new Date().toISOString();
  report.metadata.pagesCompleted = pages.length;

  // Write final report
  await fs.writeJSON(OUTPUT_FILE, report, { spaces: 2 });

  // Print summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`FULL-SITE AUDIT COMPLETE`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Date:       ${report.metadata.date}`);
  console.log(`Duration:   ${report.metadata.totalDuration}`);
  console.log(`Total:      ${pages.length} pages`);
  console.log(`Clean:      ${report.summary.clean}`);
  console.log(`Dirty:      ${report.summary.dirty}`);
  console.log(`Errors:     ${report.summary.errors}`);
  console.log(`\nBy content type:`);
  for (const [type, counts] of Object.entries(report.summary.byContentType).sort((a, b) => a[0].localeCompare(b[0]))) {
    const total = counts.clean + counts.dirty + counts.errors;
    console.log(`  ${type.padEnd(15)} ${String(counts.clean).padStart(4)} clean / ${String(counts.dirty).padStart(4)} dirty / ${String(counts.errors).padStart(4)} errors  (${total} total)`);
  }
  if (report.dirtyPages.length > 0) {
    console.log(`\nDirty pages:`);
    report.dirtyPages.forEach((p) => {
      console.log(`  ${p.url}`);
      p.violations.forEach((v) => {
        console.log(`    [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elements)`);
      });
    });
  }
  console.log(`\nReport saved to: ${OUTPUT_FILE}`);
}

run().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});

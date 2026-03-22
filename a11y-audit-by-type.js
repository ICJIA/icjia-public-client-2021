/**
 * ICJIA Accessibility Audit — By Content Type
 *
 * Reads /public/api/*.json to discover all pages, then audits a sample
 * per content type. Run one type at a time so you can fix → re-audit.
 *
 * Usage:
 *   node a11y-audit-by-type.js                  # list available types
 *   node a11y-audit-by-type.js events            # audit "events" (all 6)
 *   node a11y-audit-by-type.js posts --sample 5  # audit 5 random posts
 *   node a11y-audit-by-type.js all --sample 3    # audit 3 per type
 */

const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "http://localhost:8080";
const API_DIR = path.join(__dirname, "public", "api");
const OUTPUT_DIR = path.join(__dirname, "accessibility-audit-results");

// WCAG 2.1 AA target + best practices + Section 508 (no AAA)
const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: [
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22aa",
      "best-practice",
      "section508",
    ],
  },
};

// How many pages to sample per type (override with --sample N)
const DEFAULT_SAMPLE = 5;

// Content type → listing page (audited in addition to detail pages)
const LISTING_PAGES = {
  biographies: "/about/biographies/",
  events: "/events/",
  grants: "/grants/",
  hub: "/researchhub/",
  jobs: "/about/employment/",
  meetings: "/about/meetings/",
  pages: null,
  posts: "/news/",
  publications: null,
  units: null,
};

// ── helpers ──────────────────────────────────────────────────────────

function loadContentType(type) {
  const file = path.join(API_DIR, `${type}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readJSONSync(file);
  const arr = Array.isArray(raw) ? raw : raw.message || raw.data || [raw];
  return arr.filter((item) => item.fullPath);
}

function sample(arr, n) {
  if (n >= arr.length) return arr;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let type = null;
  let sampleSize = DEFAULT_SAMPLE;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sample" && args[i + 1]) {
      sampleSize = parseInt(args[i + 1], 10);
      i++;
    } else if (!args[i].startsWith("-")) {
      type = args[i];
    }
  }
  return { type, sampleSize };
}

// ── audit logic ─────────────────────────────────────────────────────

async function auditPage(browser, url, name) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await page.goto(`${BASE_URL}${url}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const results = await new AxePuppeteer(page).options(AXE_OPTIONS).analyze();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      elements: v.nodes.slice(0, 3).map((n) => ({
        html: n.html.substring(0, 120),
        target: n.target.join(" "),
      })),
    }));

    const icon = violations.length === 0 ? "✅" : "⚠️ ";
    console.log(
      `  ${icon} ${name.padEnd(50)} ${violations.length} violation(s), ${results.passes.length} passes`
    );

    return { name, url, violations, passes: results.passes.length };
  } catch (err) {
    console.log(`  ❌ ${name.padEnd(50)} ERROR: ${err.message}`);
    return { name, url, violations: [], error: err.message };
  } finally {
    await page.close();
  }
}

async function auditContentType(type, sampleSize) {
  const items = loadContentType(type);
  if (items.length === 0) {
    console.log(`No pages found for "${type}".`);
    return;
  }

  const sampled = sample(items, sampleSize);
  const listingPage = LISTING_PAGES[type];

  const totalToAudit = sampled.length + (listingPage ? 1 : 0);

  console.log(
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  );
  console.log(
    `  ${type.toUpperCase()} — ${items.length} total pages, auditing ${totalToAudit}`
  );
  console.log(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  );

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];

  try {
    // Audit listing page first if it exists
    if (listingPage) {
      const r = await auditPage(
        browser,
        listingPage,
        `[listing] ${type}`
      );
      results.push(r);
    }

    // Audit detail pages
    for (const item of sampled) {
      const name = item.title || item.fullName || item.name || item.slug;
      const r = await auditPage(browser, item.fullPath, name);
      results.push(r);
    }
  } finally {
    await browser.close();
  }

  // ── summary ──
  const totalViolations = results.reduce(
    (sum, r) => sum + r.violations.length,
    0
  );
  const pagesClean = results.filter((r) => r.violations.length === 0).length;
  const errors = results.filter((r) => r.error).length;

  console.log(`\n┌─────────────────────────────────────────────────┐`);
  console.log(`│  ${type.toUpperCase()} SUMMARY`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  Pages audited:    ${totalToAudit}`);
  console.log(`│  Pages clean:      ${pagesClean}`);
  console.log(`│  Violation types:  ${totalViolations}`);
  console.log(`│  Errors:           ${errors}`);
  console.log(`└─────────────────────────────────────────────────┘`);

  // Deduplicate violations across pages
  if (totalViolations > 0) {
    const violationMap = {};
    results.forEach((r) => {
      r.violations.forEach((v) => {
        if (!violationMap[v.id]) {
          violationMap[v.id] = {
            id: v.id,
            impact: v.impact,
            help: v.help,
            helpUrl: v.helpUrl,
            totalNodes: 0,
            pages: [],
            sampleElements: [],
          };
        }
        violationMap[v.id].totalNodes += v.nodes;
        violationMap[v.id].pages.push(r.name);
        violationMap[v.id].sampleElements.push(...v.elements);
      });
    });

    console.log(`\n  Unique violations:\n`);
    Object.values(violationMap)
      .sort((a, b) => {
        const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        return (order[a.impact] || 4) - (order[b.impact] || 4);
      })
      .forEach((v) => {
        const icon = { critical: "🔴", serious: "🟠", moderate: "🟡", minor: "🟢" }[
          v.impact
        ] || "⚪";
        console.log(
          `  ${icon} [${v.impact}] ${v.help}`
        );
        console.log(
          `     ${v.totalNodes} element(s) across ${v.pages.length} page(s)`
        );
        v.sampleElements.slice(0, 2).forEach((el) => {
          console.log(`     → ${el.target}`);
        });
        console.log(`     ${v.helpUrl}`);
        console.log();
      });
  }

  // Save results
  await fs.ensureDir(OUTPUT_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(OUTPUT_DIR, `audit-${type}-${ts}.json`);
  await fs.writeJSON(
    outFile,
    {
      type,
      timestamp: new Date().toISOString(),
      totalPages: items.length,
      auditedPages: totalToAudit,
      sampleSize,
      results,
    },
    { spaces: 2 }
  );
  console.log(`  Results saved to: ${outFile}\n`);

  return results;
}

// ── main ────────────────────────────────────────────────────────────

async function main() {
  const { type, sampleSize } = parseArgs();

  // List available types
  const jsonFiles = fs
    .readdirSync(API_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

  if (!type) {
    console.log("\nICJIA Accessibility Audit — By Content Type\n");
    console.log("Available content types:\n");
    jsonFiles.forEach((f) => {
      const items = loadContentType(f);
      const listing = LISTING_PAGES[f] || "(no listing page)";
      console.log(`  ${f.padEnd(16)} ${String(items.length).padStart(5)} pages    ${listing}`);
    });
    console.log(`\nUsage:`);
    console.log(`  node a11y-audit-by-type.js <type>              # audit with ${DEFAULT_SAMPLE} samples`);
    console.log(`  node a11y-audit-by-type.js <type> --sample 10  # audit with 10 samples`);
    console.log(`  node a11y-audit-by-type.js all --sample 3      # audit all types, 3 each`);
    console.log();
    return;
  }

  // Verify server is up
  try {
    const http = require("http");
    await new Promise((resolve, reject) => {
      http.get(BASE_URL, (res) => resolve(res)).on("error", reject);
    });
  } catch {
    console.error(`\n❌ Dev server not running at ${BASE_URL}`);
    console.error(`   Start it with: npm run serve\n`);
    process.exit(1);
  }

  console.log(`\n🔍 ICJIA Accessibility Audit`);
  console.log(`   Target: WCAG 2.1 Level AA`);
  console.log(`   Server: ${BASE_URL}`);
  console.log(`   Sample: ${sampleSize} pages per type`);

  if (type === "all") {
    // Audit all types in order (smallest first)
    const ordered = jsonFiles
      .map((f) => ({ name: f, count: loadContentType(f).length }))
      .sort((a, b) => a.count - b.count);

    let grandTotal = { audited: 0, clean: 0, violations: 0 };

    for (const t of ordered) {
      const results = await auditContentType(t.name, sampleSize);
      if (results) {
        grandTotal.audited += results.length;
        grandTotal.clean += results.filter((r) => r.violations.length === 0).length;
        grandTotal.violations += results.reduce(
          (s, r) => s + r.violations.length,
          0
        );
      }
    }

    console.log(`\n╔═════════════════════════════════════════════════╗`);
    console.log(`║  GRAND TOTAL                                    ║`);
    console.log(`╠═════════════════════════════════════════════════╣`);
    console.log(`║  Pages audited:    ${String(grandTotal.audited).padEnd(29)}║`);
    console.log(`║  Pages clean:      ${String(grandTotal.clean).padEnd(29)}║`);
    console.log(`║  Violation types:  ${String(grandTotal.violations).padEnd(29)}║`);
    console.log(`╚═════════════════════════════════════════════════╝\n`);
  } else {
    if (!jsonFiles.includes(type)) {
      console.error(`\n❌ Unknown type "${type}". Available: ${jsonFiles.join(", ")}\n`);
      process.exit(1);
    }
    await auditContentType(type, sampleSize);
  }
}

main().catch(console.error);

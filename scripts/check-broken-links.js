/**
 * ICJIA Broken Link Checker
 *
 * Crawls the site via the /public/api/*.json files, extracts all links
 * from rendered pages, and checks them. Outputs a CSV of broken links
 * with the source page, broken URL, status code, and content type —
 * so Strapi authors know which content to fix.
 *
 * Usage:
 *   node check-broken-links.js                    # check all types, 5 samples each
 *   node check-broken-links.js --sample 10        # 10 samples per type
 *   node check-broken-links.js --type posts       # only check posts
 *   node check-broken-links.js --full             # check ALL pages (slow)
 *
 * Requires dev server running on localhost:8080.
 * Output: ./broken-links-report-<timestamp>.csv
 */

const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const https = require("https");

const BASE_URL = "http://localhost:8080";
const PROJECT_ROOT = path.join(__dirname, "..");
const API_DIR = path.join(PROJECT_ROOT, "public", "api");
const DEFAULT_SAMPLE = 5;
const CONCURRENT_CHECKS = 10;
const LINK_TIMEOUT = 10000;

// Track already-checked URLs to avoid duplicates
const checkedUrls = new Map();

// ── arg parsing ─────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let sampleSize = DEFAULT_SAMPLE;
  let type = null;
  let full = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sample" && args[i + 1]) {
      sampleSize = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--type" && args[i + 1]) {
      type = args[i + 1];
      i++;
    } else if (args[i] === "--full") {
      full = true;
    }
  }
  return { sampleSize, type, full };
}

// ── helpers ─────────────────────────────────────────────────────────

function loadContentType(typeName) {
  const file = path.join(API_DIR, `${typeName}.json`);
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

// ── link checking ───────────────────────────────────────────────────

function checkUrl(url) {
  return new Promise((resolve) => {
    // Already checked
    if (checkedUrls.has(url)) {
      resolve(checkedUrls.get(url));
      return;
    }

    const mod = url.startsWith("https") ? https : http;

    try {
      const req = mod.request(
        url,
        {
          method: "HEAD",
          timeout: LINK_TIMEOUT,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (ICJIA Link Checker) AppleWebKit/537.36",
          },
        },
        (res) => {
          // Follow redirects
          if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
            const location = res.headers.location;
            if (location) {
              const redirectUrl = location.startsWith("http")
                ? location
                : new URL(location, url).href;
              // Check the redirect target
              checkUrl(redirectUrl).then((redirectResult) => {
                const result = {
                  status: res.statusCode,
                  redirectTo: redirectUrl,
                  finalStatus: redirectResult.status,
                  ok:
                    redirectResult.ok ||
                    (redirectResult.status >= 200 &&
                      redirectResult.status < 400),
                };
                checkedUrls.set(url, result);
                resolve(result);
              });
              return;
            }
          }

          const result = {
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 400,
          };
          checkedUrls.set(url, result);
          resolve(result);
        }
      );

      req.on("error", (err) => {
        const result = { status: 0, ok: false, error: err.code || err.message };
        checkedUrls.set(url, result);
        resolve(result);
      });

      req.on("timeout", () => {
        req.destroy();
        const result = { status: 0, ok: false, error: "TIMEOUT" };
        checkedUrls.set(url, result);
        resolve(result);
      });

      req.end();
    } catch (err) {
      const result = { status: 0, ok: false, error: err.message };
      checkedUrls.set(url, result);
      resolve(result);
    }
  });
}

async function checkBatch(urls) {
  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENT_CHECKS) {
    const batch = urls.slice(i, i + CONCURRENT_CHECKS);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await checkUrl(url);
        return { url, ...result };
      })
    );
    results.push(...batchResults);
  }
  return results;
}

// ── page crawling ───────────────────────────────────────────────────

async function extractLinks(browser, pageUrl) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await page.goto(`${BASE_URL}${pageUrl}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll("a[href]");
      const hrefs = [];
      anchors.forEach((a) => {
        const href = a.href;
        if (
          href &&
          !href.startsWith("javascript:") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:") &&
          !href.startsWith("data:") &&
          !href.includes("#")
        ) {
          hrefs.push({
            url: href,
            text: (a.textContent || "").trim().substring(0, 80),
          });
        }
      });
      return hrefs;
    });

    return links;
  } catch (err) {
    console.log(`    Error extracting links from ${pageUrl}: ${err.message}`);
    return [];
  } finally {
    await page.close();
  }
}

// ── main ────────────────────────────────────────────────────────────

async function main() {
  const { sampleSize, type, full } = parseArgs();

  // Verify server
  try {
    await new Promise((resolve, reject) => {
      http.get(BASE_URL, (res) => resolve(res)).on("error", reject);
    });
  } catch {
    console.error(`\nDev server not running at ${BASE_URL}\n`);
    process.exit(1);
  }

  const jsonFiles = fs
    .readdirSync(API_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

  const typesToCheck = type ? [type] : jsonFiles;

  // Build list of pages to crawl
  const pagesToCrawl = [];

  // Always include core pages
  const corePages = [
    "/",
    "/about/",
    "/news/",
    "/grants/",
    "/events/",
    "/researchhub/",
    "/search/",
    "/about/contact/",
    "/foia/",
  ];
  corePages.forEach((p) => pagesToCrawl.push({ url: p, type: "core" }));

  for (const t of typesToCheck) {
    if (!jsonFiles.includes(t)) {
      console.error(`Unknown type: ${t}`);
      continue;
    }

    const items = loadContentType(t);
    const listing = LISTING_PAGES[t];
    if (listing && !pagesToCrawl.find((p) => p.url === listing)) {
      pagesToCrawl.push({ url: listing, type: t });
    }

    const sampled = full ? items : sample(items, sampleSize);
    sampled.forEach((item) => {
      pagesToCrawl.push({ url: item.fullPath, type: t });
    });
  }

  console.log(`\nICJIA Broken Link Checker`);
  console.log(`Server: ${BASE_URL}`);
  console.log(`Pages to crawl: ${pagesToCrawl.length}`);
  console.log(`Sample size: ${full ? "ALL" : sampleSize} per type\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const allBrokenLinks = [];
  let totalLinksChecked = 0;
  let totalBroken = 0;

  try {
    for (let i = 0; i < pagesToCrawl.length; i++) {
      const { url: pageUrl, type: contentType } = pagesToCrawl[i];
      process.stdout.write(
        `  [${i + 1}/${pagesToCrawl.length}] ${pageUrl.substring(0, 60).padEnd(60)} `
      );

      const links = await extractLinks(browser, pageUrl);

      // Filter to only external links (internal SPA routes won't 404 in a useful way)
      const externalLinks = links.filter(
        (l) =>
          l.url.startsWith("http") &&
          !l.url.startsWith(BASE_URL) &&
          !l.url.includes("localhost")
      );

      if (externalLinks.length === 0) {
        console.log(`0 external links`);
        continue;
      }

      const results = await checkBatch(externalLinks.map((l) => l.url));

      const broken = results.filter((r) => !r.ok);
      totalLinksChecked += results.length;
      totalBroken += broken.length;

      if (broken.length > 0) {
        console.log(
          `${externalLinks.length} links, ${broken.length} BROKEN`
        );
        broken.forEach((b) => {
          const linkInfo = externalLinks.find((l) => l.url === b.url);
          allBrokenLinks.push({
            sourcePage: pageUrl,
            contentType,
            brokenUrl: b.url,
            linkText: linkInfo ? linkInfo.text : "",
            statusCode: b.status,
            error: b.error || "",
            redirectTo: b.redirectTo || "",
          });
        });
      } else {
        console.log(`${externalLinks.length} links, all OK`);
      }
    }
  } finally {
    await browser.close();
  }

  // Deduplicate broken links (same URL broken on multiple pages)
  const deduped = new Map();
  allBrokenLinks.forEach((link) => {
    const key = link.brokenUrl;
    if (!deduped.has(key)) {
      deduped.set(key, {
        ...link,
        sourcePages: [link.sourcePage],
        contentTypes: [link.contentType],
      });
    } else {
      const existing = deduped.get(key);
      if (!existing.sourcePages.includes(link.sourcePage)) {
        existing.sourcePages.push(link.sourcePage);
      }
      if (!existing.contentTypes.includes(link.contentType)) {
        existing.contentTypes.push(link.contentType);
      }
    }
  });

  // Generate CSV
  const ts = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
  const csvFile = path.join(PROJECT_ROOT, "reports", `broken-links-report-${ts}.csv`);

  const csvHeader =
    "Broken URL,Status Code,Error,Link Text,Content Type,Source Page(s),Redirect To\n";
  const csvRows = Array.from(deduped.values())
    .sort((a, b) => a.contentType - b.contentType)
    .map((link) => {
      const escape = (s) => `"${(s || "").replace(/"/g, '""')}"`;
      return [
        escape(link.brokenUrl),
        link.statusCode,
        escape(link.error),
        escape(link.linkText),
        escape(link.contentTypes.join(", ")),
        escape(link.sourcePages.join("; ")),
        escape(link.redirectTo),
      ].join(",");
    })
    .join("\n");

  await fs.writeFile(csvFile, csvHeader + csvRows);

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  BROKEN LINK REPORT`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Pages crawled:      ${pagesToCrawl.length}`);
  console.log(`  External links:     ${totalLinksChecked}`);
  console.log(`  Broken links:       ${totalBroken}`);
  console.log(
    `  Unique broken URLs: ${deduped.size}`
  );
  console.log(`  CSV saved to:       ${csvFile}`);
  console.log(`${"=".repeat(60)}\n`);

  if (deduped.size > 0) {
    console.log("  Top broken links:\n");
    Array.from(deduped.values())
      .slice(0, 20)
      .forEach((link) => {
        const status =
          link.statusCode === 0
            ? link.error
            : `HTTP ${link.statusCode}`;
        console.log(`  ${status.padEnd(14)} ${link.brokenUrl.substring(0, 70)}`);
        console.log(
          `               on: ${link.sourcePages[0]}${link.sourcePages.length > 1 ? ` (+${link.sourcePages.length - 1} more)` : ""}`
        );
      });
  }
}

main().catch(console.error);

#!/usr/bin/env node
// Full-site axe-core audit driven by public/sitemap.xml.
// Parallel, resumable. Appends to _manifest.ndjson so restarts skip completed URLs.
//
// Usage:
//   node scripts/a11y-sitemap-audit.mjs              # audit everything
//   node scripts/a11y-sitemap-audit.mjs --concurrency=4
//   node scripts/a11y-sitemap-audit.mjs --limit=50   # smoke test
//   node scripts/a11y-sitemap-audit.mjs --retry      # re-run failures only
//   node scripts/a11y-sitemap-audit.mjs --summary    # aggregate without auditing
//   node scripts/a11y-sitemap-audit.mjs --fresh      # archive prior run, start over
//   node scripts/a11y-sitemap-audit.mjs --tags=wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa,best-practice
//
// Requires dev server on http://localhost:8080.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITEMAP = path.join(ROOT, "public", "sitemap.xml");
const OUT_DIR = path.join(ROOT, "reports", "a11y-full-audit");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const MANIFEST = path.join(OUT_DIR, "_manifest.ndjson");
const FAILURES = path.join(OUT_DIR, "_failures.ndjson");
const URL_LIST = path.join(OUT_DIR, "_urls.txt");
const AXE_PATH = path.join(ROOT, "node_modules", "axe-core", "axe.min.js");

const BASE_URL = "http://localhost:8080";
const PROD_HOST = "https://icjia.illinois.gov";

const DEFAULT_AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);

const CONCURRENCY = Math.max(1, Math.min(8, Number(args.concurrency) || 4));
const LIMIT = Number(args.limit) || Infinity;
const RETRY_FAILED = Boolean(args.retry);
const SUMMARY_ONLY = Boolean(args.summary);
const FRESH = Boolean(args.fresh);
const NAV_TIMEOUT = Number(args["nav-timeout"]) || 45000;
const SETTLE_MS = Number(args["settle-ms"]) || 2500;
const AXE_TAGS = typeof args.tags === "string" && args.tags.length
  ? args.tags.split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_AXE_TAGS;

fs.mkdirSync(PAGES_DIR, { recursive: true });

function archivePriorRun() {
  const hasPrior = fs.existsSync(MANIFEST) || fs.existsSync(FAILURES) ||
    (fs.existsSync(PAGES_DIR) && fs.readdirSync(PAGES_DIR).length > 0);
  if (!hasPrior) return null;
  const stamp = new Date().toISOString().slice(0, 10);
  let archiveDir = path.join(OUT_DIR, "archive", stamp);
  let n = 1;
  while (fs.existsSync(archiveDir)) archiveDir = path.join(OUT_DIR, "archive", `${stamp}-${++n}`);
  fs.mkdirSync(archiveDir, { recursive: true });
  for (const name of ["_manifest.ndjson", "_failures.ndjson", "_summary.md", "_summary.csv", "_urls.txt", "pages"]) {
    const src = path.join(OUT_DIR, name);
    if (fs.existsSync(src)) fs.renameSync(src, path.join(archiveDir, name));
  }
  fs.mkdirSync(PAGES_DIR, { recursive: true });
  return archiveDir;
}

function extractUrls() {
  const xml = fs.readFileSync(SITEMAP, "utf8");
  const urls = [];
  const rx = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const u = m[1].trim();
    if (u.startsWith(PROD_HOST)) urls.push(u);
  }
  return [...new Set(urls)];
}

function slugify(url) {
  return (
    url
      .replace(PROD_HOST, "")
      .replace(/^\/+|\/+$/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "__")
      .slice(0, 180) || "home"
  );
}

function toLocal(url) {
  return url.replace(PROD_HOST, BASE_URL);
}

async function readNdjson(file) {
  if (!fs.existsSync(file)) return [];
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  const out = [];
  for await (const line of rl) {
    const s = line.trim();
    if (!s) continue;
    try { out.push(JSON.parse(s)); } catch { /* tolerate torn line */ }
  }
  return out;
}

function appendNdjson(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + "\n");
}

async function loadDoneSet() {
  const rows = await readNdjson(MANIFEST);
  return new Set(rows.map((r) => r.url));
}

async function loadFailedSet() {
  const rows = await readNdjson(FAILURES);
  return new Set(rows.map((r) => r.url));
}

async function auditOne(context, url, axeSource) {
  const page = await context.newPage();
  const started = Date.now();
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(toLocal(url), { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch { /* SPAs rarely go idle */ }
    await page.waitForTimeout(SETTLE_MS);

    await page.addScriptTag({ content: axeSource });

    const result = await page.evaluate(async (tags) => {
      // eslint-disable-next-line no-undef
      const res = await axe.run(document, {
        runOnly: { type: "tag", values: tags },
        resultTypes: ["violations", "incomplete"],
      });
      return {
        url: res.url,
        testEngine: res.testEngine,
        testRunner: res.testRunner,
        toolOptions: res.toolOptions,
        violations: res.violations,
        incomplete: res.incomplete,
        passCount: (res.passes || []).length,
        inapplicableCount: (res.inapplicable || []).length,
      };
    }, AXE_TAGS);

    const slug = slugify(url);
    const outPath = path.join(PAGES_DIR, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ url, auditedAt: new Date().toISOString(), durationMs: Date.now() - started, ...result }, null, 2));

    const counts = { violations: result.violations.length, incomplete: result.incomplete.length };
    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of result.violations) byImpact[v.impact || "minor"] = (byImpact[v.impact || "minor"] || 0) + 1;

    return { ok: true, slug, counts, byImpact, durationMs: Date.now() - started, passCount: result.passCount };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err), durationMs: Date.now() - started };
  } finally {
    await page.close().catch(() => {});
  }
}

async function runAudit() {
  if (!fs.existsSync(AXE_PATH)) throw new Error(`axe-core not found at ${AXE_PATH}`);
  const axeSource = fs.readFileSync(AXE_PATH, "utf8");

  let urls = extractUrls();
  fs.writeFileSync(URL_LIST, urls.join("\n") + "\n");

  const done = await loadDoneSet();
  const failed = await loadFailedSet();

  let queue;
  if (RETRY_FAILED) {
    queue = [...failed].filter((u) => !done.has(u));
    // Re-running failures: wipe their prior failure rows so next run starts clean.
    fs.writeFileSync(FAILURES, "");
  } else {
    queue = urls.filter((u) => !done.has(u));
  }

  if (queue.length > LIMIT) queue = queue.slice(0, LIMIT);

  const total = queue.length;
  const startedAt = Date.now();
  let completed = 0;
  let cleanCount = 0;
  let dirtyCount = 0;
  let errorCount = 0;

  console.log(`[a11y-audit] sitemap urls: ${urls.length}`);
  console.log(`[a11y-audit] already done: ${done.size}`);
  console.log(`[a11y-audit] queue: ${total} (concurrency=${CONCURRENCY})`);

  if (total === 0) {
    console.log("[a11y-audit] nothing to do.");
    return;
  }

  const browser = await chromium.launch({ headless: true });

  // Pool: N contexts, each worker pulls from shared index.
  let idx = 0;
  const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    while (true) {
      const i = idx++;
      if (i >= queue.length) break;
      const url = queue[i];
      const res = await auditOne(context, url, axeSource);
      completed++;
      if (res.ok) {
        appendNdjson(MANIFEST, {
          url,
          slug: res.slug,
          auditedAt: new Date().toISOString(),
          durationMs: res.durationMs,
          violations: res.counts.violations,
          incomplete: res.counts.incomplete,
          byImpact: res.byImpact,
          passCount: res.passCount,
        });
        if (res.counts.violations === 0) cleanCount++; else dirtyCount++;
        const tag = res.counts.violations === 0 ? "CLEAN" : `DIRTY(${res.counts.violations})`;
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = completed / elapsed;
        const eta = rate > 0 ? Math.round((total - completed) / rate) : 0;
        process.stdout.write(
          `[${String(completed).padStart(5)}/${total}] w${workerId} ${tag.padEnd(10)} ${url.replace(PROD_HOST, "").slice(0, 70).padEnd(70)} ${res.durationMs}ms  eta ${Math.floor(eta / 60)}m${eta % 60}s\n`
        );
      } else {
        errorCount++;
        appendNdjson(FAILURES, { url, error: res.error, failedAt: new Date().toISOString(), durationMs: res.durationMs });
        process.stdout.write(`[${String(completed).padStart(5)}/${total}] w${workerId} ERROR      ${url.replace(PROD_HOST, "").slice(0, 70).padEnd(70)} ${res.error.slice(0, 60)}\n`);
      }
    }
    await context.close().catch(() => {});
  });

  await Promise.all(workers);
  await browser.close();

  console.log(`\n[a11y-audit] done in ${Math.round((Date.now() - startedAt) / 1000)}s`);
  console.log(`  clean:  ${cleanCount}`);
  console.log(`  dirty:  ${dirtyCount}`);
  console.log(`  errors: ${errorCount}`);
}

async function writeSummary() {
  const rows = await readNdjson(MANIFEST);
  const failures = await readNdjson(FAILURES);
  const urls = extractUrls();

  const byRule = new Map(); // ruleId -> { impact, help, helpUrl, pages:Set, nodes:number, tags:Set }
  let totalViolations = 0;
  let totalIncomplete = 0;
  let clean = 0;
  let dirty = 0;

  for (const row of rows) {
    if (row.violations === 0) clean++; else dirty++;
    totalViolations += row.violations || 0;
    totalIncomplete += row.incomplete || 0;

    // Load per-page detail for rule aggregation
    const file = path.join(PAGES_DIR, `${row.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const detail = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const v of detail.violations || []) {
      const entry = byRule.get(v.id) || {
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: new Set(),
        pages: new Set(),
        nodeCount: 0,
      };
      for (const t of v.tags || []) entry.tags.add(t);
      entry.pages.add(row.url);
      entry.nodeCount += (v.nodes || []).length;
      byRule.set(v.id, entry);
    }
  }

  const ruleRows = [...byRule.values()]
    .map((r) => ({ ...r, pageCount: r.pages.size, tags: [...r.tags].filter((t) => t.startsWith("wcag")).join(" ") }))
    .sort((a, b) => b.pageCount - a.pageCount);

  const md = [];
  md.push("# ICJIA Full-Site Accessibility Audit — Summary");
  md.push("");
  md.push(`- **Generated:** ${new Date().toISOString()}`);
  md.push(`- **Tool:** axe-core (the engine axecap wraps)`);
  md.push(`- **axe-core version:** ${JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules", "axe-core", "package.json"), "utf8")).version}`);
  md.push(`- **WCAG tags:** ${AXE_TAGS.join(", ")}`);
  md.push(`- **Source:** \`public/sitemap.xml\` (${urls.length} URLs)`);
  md.push(`- **Audited:** ${rows.length}`);
  md.push(`- **Clean pages:** ${clean}`);
  md.push(`- **Pages with violations:** ${dirty}`);
  md.push(`- **Total violations (page × rule):** ${totalViolations}`);
  md.push(`- **Total incomplete (needs review):** ${totalIncomplete}`);
  md.push(`- **Errors / unreachable:** ${failures.length}`);
  md.push("");
  md.push("## Violations by rule (sorted by pages affected)");
  md.push("");
  md.push("| Rule | Impact | Pages | Nodes | WCAG |");
  md.push("|---|---|---:|---:|---|");
  for (const r of ruleRows) {
    md.push(`| [${r.id}](${r.helpUrl}) | ${r.impact || ""} | ${r.pageCount} | ${r.nodeCount} | ${r.tags} |`);
  }
  if (ruleRows.length === 0) md.push("| — | — | — | — | — |");
  md.push("");
  if (failures.length) {
    md.push("## Failures");
    md.push("");
    for (const f of failures.slice(0, 50)) md.push(`- \`${f.url}\` — ${f.error}`);
    if (failures.length > 50) md.push(`- …and ${failures.length - 50} more in \`_failures.ndjson\``);
  }
  fs.writeFileSync(path.join(OUT_DIR, "_summary.md"), md.join("\n") + "\n");

  const csv = ["rule,impact,pages,nodes,wcag,helpUrl"];
  for (const r of ruleRows) csv.push([r.id, r.impact || "", r.pageCount, r.nodeCount, `"${r.tags}"`, r.helpUrl].join(","));
  fs.writeFileSync(path.join(OUT_DIR, "_summary.csv"), csv.join("\n") + "\n");

  console.log(`[summary] ${rows.length} audited, ${clean} clean, ${dirty} dirty, ${failures.length} errors`);
  console.log(`[summary] wrote ${path.relative(ROOT, path.join(OUT_DIR, "_summary.md"))}`);
}

(async () => {
  if (SUMMARY_ONLY) {
    await writeSummary();
    return;
  }
  if (FRESH) {
    const archived = archivePriorRun();
    if (archived) console.log(`[a11y-audit] archived prior run to ${path.relative(ROOT, archived)}`);
  }
  await runAudit();
  await writeSummary();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
// Full-site IBM Equal Access (accessibility-checker) audit driven by
// public/sitemap.xml. Mirrors scripts/a11y-sitemap-audit.mjs (axe-core) so the
// two tools can be cross-referenced for SiteImprove triangulation. Parallel,
// resumable. Appends to _manifest.ndjson so restarts skip completed URLs.
//
// Usage:
//   node scripts/a11y-sitemap-audit-ibm.mjs              # audit everything
//   node scripts/a11y-sitemap-audit-ibm.mjs --concurrency=4
//   node scripts/a11y-sitemap-audit-ibm.mjs --limit=10   # smoke test
//   node scripts/a11y-sitemap-audit-ibm.mjs --retry      # re-run failures only
//   node scripts/a11y-sitemap-audit-ibm.mjs --summary    # aggregate without auditing
//   node scripts/a11y-sitemap-audit-ibm.mjs --fresh      # archive prior run, start over
//
// Config: .achecker.yml at repo root (policies, failLevels, reportLevels)
// Requires dev server on http://localhost:8080.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import * as aChecker from "accessibility-checker";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITEMAP = path.join(ROOT, "public", "sitemap.xml");
const OUT_DIR = path.join(ROOT, "reports", "a11y-full-audit-ibm");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const MANIFEST = path.join(OUT_DIR, "_manifest.ndjson");
const FAILURES = path.join(OUT_DIR, "_failures.ndjson");
const URL_LIST = path.join(OUT_DIR, "_urls.txt");

const BASE_URL = "http://localhost:8080";
const PROD_HOST = "https://icjia.illinois.gov";

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

// Trim IBM result objects to the fields we actually use, for compactness.
function compactResult(r) {
  return {
    ruleId: r.ruleId,
    reasonId: r.reasonId,
    level: r.level,
    value: r.value,
    message: r.message,
    snippet: (r.snippet || "").slice(0, 500),
    path: r.path,
    category: r.category,
    ignored: r.ignored,
  };
}

async function auditOne(context, url, slug) {
  const page = await context.newPage();
  const started = Date.now();
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(toLocal(url), { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch { /* SPAs rarely go idle */ }
    await page.waitForTimeout(SETTLE_MS);

    const { report } = await aChecker.getCompliance(page, slug);

    const c = (report && report.summary && report.summary.counts) || {};
    const counts = {
      violation: c.violation || 0,
      potentialviolation: c.potentialviolation || 0,
      recommendation: c.recommendation || 0,
      potentialrecommendation: c.potentialrecommendation || 0,
      manual: c.manual || 0,
      pass: c.pass || 0,
      ignored: c.ignored || 0,
    };

    const violations = (report.results || []).filter((r) => r.level === "violation");
    const potentialviolations = (report.results || []).filter((r) => r.level === "potentialviolation");

    const outPath = path.join(PAGES_DIR, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify({
      url,
      auditedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      tool: "accessibility-checker",
      toolID: report.toolID,
      ruleArchive: report.summary && report.summary.ruleArchive,
      policies: report.summary && report.summary.policies,
      counts,
      violations: violations.map(compactResult),
      potentialviolations: potentialviolations.map(compactResult),
    }, null, 2));

    return { ok: true, slug, counts, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err), durationMs: Date.now() - started };
  } finally {
    await page.close().catch(() => {});
  }
}

async function runAudit() {
  let urls = extractUrls();
  fs.writeFileSync(URL_LIST, urls.join("\n") + "\n");

  const done = await loadDoneSet();
  const failed = await loadFailedSet();

  let queue;
  if (RETRY_FAILED) {
    queue = [...failed].filter((u) => !done.has(u));
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

  console.log(`[ibm-audit] sitemap urls: ${urls.length}`);
  console.log(`[ibm-audit] already done: ${done.size}`);
  console.log(`[ibm-audit] queue: ${total} (concurrency=${CONCURRENCY})`);

  if (total === 0) {
    console.log("[ibm-audit] nothing to do.");
    return;
  }

  const browser = await chromium.launch({ headless: true });

  let idx = 0;
  const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    while (true) {
      const i = idx++;
      if (i >= queue.length) break;
      const url = queue[i];
      const slug = slugify(url);
      const res = await auditOne(context, url, slug);
      completed++;
      if (res.ok) {
        appendNdjson(MANIFEST, {
          url,
          slug: res.slug,
          auditedAt: new Date().toISOString(),
          durationMs: res.durationMs,
          counts: res.counts,
        });
        if ((res.counts.violation || 0) === 0) cleanCount++; else dirtyCount++;
        const tag = (res.counts.violation || 0) === 0
          ? `CLEAN(pv${res.counts.potentialviolation || 0})`
          : `DIRTY(${res.counts.violation}/${res.counts.potentialviolation || 0})`;
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = completed / elapsed;
        const eta = rate > 0 ? Math.round((total - completed) / rate) : 0;
        process.stdout.write(
          `[${String(completed).padStart(5)}/${total}] w${workerId} ${tag.padEnd(18)} ${url.replace(PROD_HOST, "").slice(0, 65).padEnd(65)} ${res.durationMs}ms  eta ${Math.floor(eta / 60)}m${eta % 60}s\n`
        );
      } else {
        errorCount++;
        appendNdjson(FAILURES, { url, error: res.error, failedAt: new Date().toISOString(), durationMs: res.durationMs });
        process.stdout.write(`[${String(completed).padStart(5)}/${total}] w${workerId} ERROR              ${url.replace(PROD_HOST, "").slice(0, 65).padEnd(65)} ${res.error.slice(0, 60)}\n`);
      }
    }
    await context.close().catch(() => {});
  });

  await Promise.all(workers);
  await browser.close();
  await aChecker.close().catch(() => {});

  console.log(`\n[ibm-audit] done in ${Math.round((Date.now() - startedAt) / 1000)}s`);
  console.log(`  clean (no violations):  ${cleanCount}`);
  console.log(`  dirty:  ${dirtyCount}`);
  console.log(`  errors: ${errorCount}`);
}

async function writeSummary() {
  const rows = await readNdjson(MANIFEST);
  const failures = await readNdjson(FAILURES);
  const urls = extractUrls();

  const byRule = new Map(); // ruleId -> { pages:Set, nodes:number, level, message, samples:[] }
  let totalViolations = 0;
  let totalPotential = 0;
  let clean = 0;
  let dirty = 0;

  for (const row of rows) {
    const v = (row.counts && row.counts.violation) || 0;
    const pv = (row.counts && row.counts.potentialviolation) || 0;
    if (v === 0) clean++; else dirty++;
    totalViolations += v;
    totalPotential += pv;

    const file = path.join(PAGES_DIR, `${row.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const detail = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const r of detail.violations || []) {
      const e = byRule.get(r.ruleId) || {
        ruleId: r.ruleId,
        level: r.level,
        firstMessage: r.message,
        firstSnippet: r.snippet,
        pages: new Set(),
        nodeCount: 0,
      };
      e.pages.add(row.url);
      e.nodeCount += 1;
      byRule.set(r.ruleId, e);
    }
  }

  const ruleRows = [...byRule.values()]
    .map((r) => ({ ...r, pageCount: r.pages.size }))
    .sort((a, b) => b.pageCount - a.pageCount);

  const md = [];
  md.push("# ICJIA Full-Site Accessibility Audit — IBM Equal Access Summary");
  md.push("");
  md.push(`- **Generated:** ${new Date().toISOString()}`);
  md.push(`- **Tool:** IBM Equal Access (accessibility-checker)`);
  md.push(`- **Source:** \`public/sitemap.xml\` (${urls.length} URLs)`);
  md.push(`- **Audited:** ${rows.length}`);
  md.push(`- **Pages with 0 violations:** ${clean}`);
  md.push(`- **Pages with violations:** ${dirty}`);
  md.push(`- **Total violation nodes (page × rule × element):** ${totalViolations}`);
  md.push(`- **Total potentialviolation nodes:** ${totalPotential}`);
  md.push(`- **Errors / unreachable:** ${failures.length}`);
  md.push("");
  md.push("## Violations by rule (sorted by pages affected)");
  md.push("");
  md.push("| Rule | Level | Pages | Nodes | First message |");
  md.push("|---|---|---:|---:|---|");
  for (const r of ruleRows) {
    const msg = (r.firstMessage || "").replace(/\|/g, "\\|").slice(0, 120);
    md.push(`| \`${r.ruleId}\` | ${r.level} | ${r.pageCount} | ${r.nodeCount} | ${msg} |`);
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

  const csv = ["rule,level,pages,nodes,firstMessage"];
  for (const r of ruleRows) {
    const msg = `"${(r.firstMessage || "").replace(/"/g, '""').slice(0, 200)}"`;
    csv.push([r.ruleId, r.level, r.pageCount, r.nodeCount, msg].join(","));
  }
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
    if (archived) console.log(`[ibm-audit] archived prior run to ${path.relative(ROOT, archived)}`);
  }
  await runAudit();
  await writeSummary();
})().catch(async (e) => {
  console.error(e);
  await aChecker.close().catch(() => {});
  process.exit(1);
});

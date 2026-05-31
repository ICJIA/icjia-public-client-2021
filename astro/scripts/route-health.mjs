#!/usr/bin/env node
// route-health.mjs — cutover route + redirect health check.
//
// GETs routes and asserts 200; reports the no-slash → 3xx → /slash redirect behavior;
// always tests a fixed CRITICAL_ROUTES "must-200" list (section landings + the routes
// that have silently 404'd before: forms, IRB, DICRA). Default SAMPLES the live sitemap
// (fast, for PR/CI); `--full` tests every sitemap URL (the pre-cutover sweep).
//
// Runs against the DEPLOY and checks STATUS CODES ONLY — content-agnostic, so it's
// stable against live Strapi data (the "hybrid" testing strategy). Exits non-zero on
// any 200-failure so CI can gate on it.
//
// Usage:
//   node scripts/route-health.mjs                       # critical + 1-per-family sample
//   node scripts/route-health.mjs --full                # every sitemap URL
//   node scripts/route-health.mjs --base=https://icjia.illinois.gov
//   HEALTH_BASE=https://… node scripts/route-health.mjs

const args = process.argv.slice(2);
const FULL = args.includes("--full");
const baseArg = args.find((a) => a.startsWith("--base="));
const BASE = (
  (baseArg && baseArg.split("=")[1]) ||
  process.env.HEALTH_BASE ||
  "https://feat-astro-migration--icjia-public.netlify.app"
).replace(/\/$/, "");

const CONCURRENCY = 12;

// Always tested, regardless of sitemap (one per template + the historically-broken ones).
const CRITICAL_ROUTES = [
  "/",
  "/news/", "/news/press/", "/news/meetings/", "/events/",
  "/grants/funding/", "/grants/training/", "/grants/rules-regs-policies/",
  "/grants/required-forms/", "/grants/programs/",
  "/about/", "/about/icjia-staff/", "/about/composition-and-membership/",
  // NOTE: there is NO /about/units/ listing route (legacy router only has
  // /about/units/:slug) — unit DETAIL pages are covered by the sitemap sample.
  "/about/publications/", "/news/publications/",
  "/researchhub/", "/researchhub/articles/", "/researchhub/datasets/", "/researchhub/apps/",
  "/forms/grant-status/", "/forms/lap-request/",
  "/irb/", "/irb/irb-meetings/",
  "/search/",
];

// no-slash variants that should 3xx → /slash (informational, not a gate in v1).
const REDIRECT_SAMPLES = ["/news", "/about", "/grants/funding", "/researchhub", "/irb"];

const toPath = (u) => u.replace(/^https?:\/\/[^/]+/, "");

async function status(path, follow = true) {
  const url = path.startsWith("http") ? path : BASE + path;
  try {
    const r = await fetch(url, { redirect: "manual" });
    if (follow && r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location") || "";
      const next = loc.startsWith("http") ? loc : BASE + loc;
      const r2 = await fetch(next, { redirect: "manual" });
      return { path, status: r2.status, via: r.status };
    }
    return { path, status: r.status, location: r.headers.get("location") };
  } catch (e) {
    return { path, status: 0, error: String(e).slice(0, 80) };
  }
}

async function pool(items, fn, n) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

// Keep ≤2 URLs per dynamic family (collapse the last path segment to /*).
function sampleByFamily(paths) {
  const seen = new Map();
  const out = [];
  for (const p of paths) {
    const family = p.replace(/\/[^/]+\/?$/, "/*");
    const c = seen.get(family) || 0;
    if (c < 2) {
      out.push(p);
      seen.set(family, c + 1);
    }
  }
  return out;
}

(async () => {
  console.log(`route-health: BASE=${BASE} mode=${FULL ? "FULL" : "sample"}`);

  let sitemapPaths = [];
  try {
    const xml = await (await fetch(BASE + "/sitemap.xml")).text();
    sitemapPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toPath(m[1]));
    console.log(`sitemap: ${sitemapPaths.length} URLs`);
  } catch (e) {
    console.warn(`sitemap fetch failed (${String(e).slice(0, 60)}) — testing CRITICAL only`);
  }

  const routes = Array.from(
    new Set([...CRITICAL_ROUTES, ...(FULL ? sitemapPaths : sampleByFamily(sitemapPaths))]),
  );
  console.log(`testing ${routes.length} routes @ concurrency ${CONCURRENCY}…\n`);

  const results = await pool(routes, (p) => status(p, true), CONCURRENCY);
  const fails = results.filter((r) => r.status !== 200);

  const redirects = await pool(REDIRECT_SAMPLES, (p) => status(p, false), 5);

  console.log(`${results.length - fails.length}/${results.length} routes → 200`);
  if (fails.length) {
    console.log("\n200-FAILURES:");
    for (const f of fails) {
      console.log(`  ✗ ${f.status}${f.via ? ` (via ${f.via})` : ""}  ${BASE}${f.path}${f.error ? `  — ${f.error}` : ""}`);
    }
  }

  console.log("\nredirect check (no-slash → 3xx → /, informational):");
  for (const r of redirects) {
    const ok = r.status >= 300 && r.status < 400 && (r.location || "").replace(/^https?:\/\/[^/]+/, "").endsWith("/");
    console.log(`  ${ok ? "✓" : "·"} ${r.path} → ${r.status} ${r.location ? toPath(r.location) : ""}`);
  }

  const pass = fails.length === 0;
  console.log(`\n${pass ? "✓ route-health PASS" : "✗ route-health FAIL"}`);
  process.exit(pass ? 0 : 1);
})();

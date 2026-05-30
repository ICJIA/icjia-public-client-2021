// Keep-warm scheduled function — pings the highest-entry SSR routes so the
// (single, shared) Astro SSR lambda + the Netlify Durable Cache stay warm. A
// real visitor landing on home/research then hits a warm function (~150ms TTFB)
// instead of a cold start (~1s). Cadence + routes are configurable in
// astro/icjia.config.mjs.
//
// ── SAFETY MODEL (defense-in-depth — this could be costly if it ran away) ─────
// THREAT: anything that causes this to invoke the SSR function far more than the
// intended ~6 pings / 5 min — whether an attacker triggering it in a loop, a
// platform misconfiguration exposing it to HTTP, or a bug. Each layer below caps
// the blast radius INDEPENDENTLY, so no single failure can run up the bill.
//
//   L1 INVOCATION SOURCE — schedule() functions are scheduler-triggered and not
//      published at a public HTTP URL. We do NOT trust that alone: if an HTTP
//      event ever reaches us, we ACCEPT ONLY a genuine scheduled invocation
//      (event.httpMethod == null / source 'aws.events') and 403 anything else.
//   L2 DURABLE RATE-GUARD — a Netlify Blobs timestamp gates execution to at most
//      once per MIN_INTERVAL_MS. Even if invoked 1000×/hour, all but ~1/cooldown
//      short-circuit BEFORE any fetch. Survives across invocations (not in-memory).
//   L3 BOUNDED FAN-OUT — ROUTES is hard-sliced to MAX_ROUTES and de-duped, so a
//      misconfigured config can't fan out to hundreds of URLs.
//   L4 SAME-ORIGIN ALLOWLIST — only ever fetches this deploy's own origin; a
//      poisoned base/route can't turn this into an SSRF/outbound amplifier.
//   L5 HARD TIMEOUT + NO RETRY — each ping has an AbortController deadline and
//      never retries, so a slow/hanging route can't pile up wall-clock cost.
//   L6 GLOBAL KILL SWITCHES — keepWarm.enabled:false in icjia.config.mjs (commit
//      → ~1min deploy) OR env KEEP_WARM_DISABLED=1 in the Netlify UI (no redeploy)
//      OR disable the scheduled function in the Netlify UI (instant).
import { schedule } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { keepWarm } from "../../icjia.config.mjs";

const ROUTES = keepWarm.routes;

// CRON SCHEDULE — must be a STRING LITERAL right here. Netlify's function bundler
// statically parses the schedule() call at build time, so the cron CANNOT come
// from an imported variable (that fails the build with "schedule imported but
// unused"). To change cadence, edit this literal. (Routes + the enabled kill
// switch live in astro/icjia.config.mjs.)
const CRON = "*/5 * * * *"; // every 5 minutes

// Hard ceilings — independent of the config, so config edits can't breach them.
const MAX_ROUTES = 12; // L3: absolute cap on fan-out per run
const MIN_INTERVAL_MS = 4 * 60 * 1000; // L2: ≥4 min between real runs (under the */5 cron)
const PER_PING_TIMEOUT_MS = 8000; // L5: per-route deadline
const GUARD_STORE = "keep-warm";
const GUARD_KEY = "last-run";

// L4: only this exact origin may be fetched.
function selfOrigin() {
  const u = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!u) return "https://icjia.illinois.gov";
  try {
    return new URL(u).origin;
  } catch {
    return "https://icjia.illinois.gov";
  }
}

// L3: de-dupe + cap + keep only same-origin absolute paths ("/...").
function safeRoutes() {
  const seen = new Set();
  const out = [];
  for (const r of Array.isArray(ROUTES) ? ROUTES : []) {
    if (typeof r !== "string" || r[0] !== "/" || r.startsWith("//")) continue; // reject "//evil.com", full URLs
    if (seen.has(r)) continue;
    seen.add(r);
    out.push(r);
    if (out.length >= MAX_ROUTES) break;
  }
  return out;
}

async function runKeepWarm(event) {
  // KILL SWITCHES (two independent levels):
  //   • config flag — keepWarm.enabled:false in icjia.config.mjs (commit → ~1min deploy)
  //   • env var     — KEEP_WARM_DISABLED=1 in the Netlify UI (no commit/redeploy)
  // (A third, instant level: disable the scheduled function in the Netlify UI.)
  if (keepWarm.enabled === false || process.env.KEEP_WARM_DISABLED === "1") {
    return { statusCode: 200, body: "disabled" };
  }

  // L1: accept ONLY a genuine scheduled invocation. A scheduled trigger has no
  // real HTTP method (or source aws.events). Any actual HTTP request → 403.
  const method = event && event.httpMethod;
  const isScheduled =
    !method || (event && event.source === "aws.events") || event?.headers?.["x-nf-event"] === "schedule";
  if (method && !isScheduled) {
    return { statusCode: 403, body: "forbidden" };
  }

  // L2: durable rate-guard. Bail if a real run happened < MIN_INTERVAL_MS ago.
  let store = null;
  try {
    store = getStore(GUARD_STORE);
    const last = Number((await store.get(GUARD_KEY)) || 0);
    const now = Date.now();
    if (last && now - last < MIN_INTERVAL_MS) {
      return { statusCode: 429, body: "throttled" };
    }
    // Claim the slot BEFORE doing work (so concurrent invocations don't both run).
    await store.set(GUARD_KEY, String(now));
  } catch {
    // Blobs unavailable: degrade safely — the scheduler already paces us at */5,
    // and L1/L3/L4/L5 still cap the blast radius. Continue without the guard.
  }

  const origin = selfOrigin();
  const routes = safeRoutes();

  const results = await Promise.allSettled(
    routes.map(async (path) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PER_PING_TIMEOUT_MS); // L5
      const t0 = Date.now();
      try {
        const res = await fetch(origin + path, {
          method: "GET",
          headers: { "user-agent": "icjia-keep-warm" },
          redirect: "manual", // never follow a redirect to another host
          signal: ctrl.signal,
        });
        await res.arrayBuffer().catch(() => {}); // drain → SSR render completes
        return { path, status: res.status, ms: Date.now() - t0 };
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  console.log(
    "keep-warm",
    origin,
    JSON.stringify(
      results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: String(r.reason).slice(0, 80) },
      ),
    ),
  );
  return { statusCode: 200, body: "ok" };
}

// schedule() with a LITERAL cron as the direct export — the shape Netlify's
// bundler statically recognizes as a scheduled function.
export const handler = schedule(CRON, runKeepWarm);

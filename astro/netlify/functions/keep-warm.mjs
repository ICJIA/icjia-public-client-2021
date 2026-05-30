// Keep-warm scheduled function — pings the highest-entry SSR routes on a schedule
// so the (single, shared) Astro SSR lambda + the Netlify Durable Cache stay warm.
// A real visitor landing on home/research then hits a warm function (~150ms TTFB)
// instead of paying a cold start (~1s).
//
// Cadence + route list are CONFIGURABLE — edit ../keep-warm.config.mjs.
// Crawlers/SEO unaffected: this just exercises the same SSR routes a user would.
import { schedule } from "@netlify/functions";
import { SCHEDULE, ROUTES } from "../keep-warm.config.mjs";

export const handler = schedule(SCHEDULE, async () => {
  // The deploy's own origin (Netlify sets URL at runtime); fall back to prod.
  const base =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://icjia.illinois.gov";

  const results = await Promise.allSettled(
    ROUTES.map(async (path) => {
      const t0 = Date.now();
      const res = await fetch(base + path, {
        headers: { "user-agent": "icjia-keep-warm" },
        redirect: "manual",
      });
      // Drain the body so the SSR render fully completes (truly warms the fn).
      await res.arrayBuffer().catch(() => {});
      return { path, status: res.status, ms: Date.now() - t0 };
    }),
  );

  console.log(
    "keep-warm",
    base,
    JSON.stringify(
      results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: String(r.reason) },
      ),
    ),
  );
  return { statusCode: 200 };
});

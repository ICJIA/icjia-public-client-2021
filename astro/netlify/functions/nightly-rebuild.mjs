// Nightly full rebuild — triggers a complete Netlify build ~midnight Central so
// the build-time artifacts get refreshed daily WITHOUT a code push:
//   • hub images re-extracted (scripts/generate-hub-images.mjs) → new articles/apps
//     published that day get their splash/thumbnail files (otherwise they ride the
//     live base64 fallback until the next build);
//   • search index + sitemap + RSS regenerated (when wired) so search engines see
//     the day's new/changed content.
//
// Mechanism: POST a Netlify BUILD HOOK (created in the Netlify UI → Site config →
// Build & deploy → Build hooks; paste its URL into the NETLIFY_BUILD_HOOK_URL env
// var). The hook URL is itself the credential, so we keep it in env, never in code.
//
// SAFETY: a build hook just enqueues ONE build. There is no fan-out / loop risk
// here (unlike keep-warm). Still: no-op if the hook URL is unset or the kill
// switch is on, and it only fires on the cron (403 any stray HTTP invocation).
import { schedule } from "@netlify/functions";

// 0 5 * * * UTC ≈ 12:00 AM US Central (CDT, UTC-5). Shifts to 11pm CST in winter —
// fine for a nightly refresh. Edit to taste.
const CRON = "0 5 * * *";

async function runNightlyRebuild(event) {
  if (process.env.NIGHTLY_REBUILD_DISABLED === "1") {
    return { statusCode: 200, body: "disabled" };
  }
  // Only a genuine scheduled invocation (no real HTTP method) may trigger a build.
  const method = event && event.httpMethod;
  // No HTTP method (or source aws.events) = genuine scheduled trigger. The
  // `x-nf-event` header is caller-settable, so it must not gate this.
  const isScheduled = !method || (event && event.source === "aws.events");
  if (method && !isScheduled) return { statusCode: 403, body: "forbidden" };

  const hook = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!hook) {
    console.warn("nightly-rebuild: NETLIFY_BUILD_HOOK_URL not set — skipping");
    return { statusCode: 200, body: "no hook configured" };
  }
  try {
    const res = await fetch(hook, { method: "POST" });
    console.log("nightly-rebuild: triggered build hook →", res.status);
    return { statusCode: 200, body: "triggered " + res.status };
  } catch (e) {
    console.error("nightly-rebuild: failed to POST build hook:", String(e).slice(0, 120));
    return { statusCode: 200, body: "error" }; // never throw — just log
  }
}

export const handler = schedule(CRON, runNightlyRebuild);

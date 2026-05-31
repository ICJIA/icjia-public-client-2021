// Purge-on-publish webhook — makes Strapi edits to LIVE sections appear INSTANTLY
// instead of waiting out the edge cache's s-maxage window. Each Strapi (agency +
// ResearchHub) POSTs here on entry.create/update/delete/publish/unpublish; we map
// the changed content-type to its Netlify-Cache-Tag and purge it, so the very next
// request re-renders fresh from Strapi.
//
// HOW PAGES ARE TAGGED: src/lib/cache.ts `setCache()` stamps each SSR response with
// `Netlify-Cache-Tag: <kind>` (its section). Purging a tag invalidates EVERY page
// carrying it — so purging `news` refreshes /news/, /news/[slug], AND the home page
// (home is tagged with all live sections). One purge → all affected pages.
//
// ── ONE-TIME SETUP ──────────────────────────────────────────────────────────
// 1. Netlify → Site config → Environment variables: add
//      PURGE_SECRET = <a long random string>
//    (optional) PURGE_TRIGGER_BUILD = 1   → also rebuild on STATIC-section edits
//    (NETLIFY_BUILD_HOOK_URL is already set for the nightly rebuild; reused here.)
// 2. In EACH Strapi admin (agency.icjia-api.cloud AND researchhub.icjia-api.cloud)
//    → Settings → Webhooks → Create:
//      URL:     https://icjia.illinois.gov/.netlify/functions/purge-cache
//      Headers: x-icjia-purge-secret : <same value as PURGE_SECRET>
//      Events:  Entry (create, update, delete, publish, unpublish)
//    The secret is the credential — it lives in env + Strapi config, never in code.
//
// SAFETY: rejects any request without the matching secret (401). purgeCache() only
// invalidates cache (no fan-out, no data change). STATIC sections (prerendered) are
// not edge-cached SSR, so a purge can't help them — they refresh on the nightly
// rebuild, or immediately if PURGE_TRIGGER_BUILD=1 fires the build hook.
import { purgeCache } from "@netlify/functions";

// Strapi content-type (singular `model` in the webhook payload) → the
// Netlify-Cache-Tag set by setCache() in src/lib/cache.ts. Models NOT listed here
// belong to a STATIC (prerendered) section and are handled by rebuild, not purge.
const MODEL_TAG = {
  // agency Strapi (agency.icjia-api.cloud) — LIVE sections:
  post: "news", // news articles + press
  meeting: "meetings", // meetings (incl. IRB meetings)
  biography: "bios", // staff / board / individual bios
  event: "events",
  funding: "grants", // NOFOs (/grants/funding/)
  grant: "grants", // grant programs (/grants/programs/)
  job: "jobs", // employment
  // ResearchHub Strapi (researchhub.icjia-api.cloud) — all LIVE under `hub`:
  article: "hub",
  dataset: "hub",
  app: "hub",
};

// Prerendered sections — a purge does nothing (no SSR edge copy); they refresh on
// the nightly rebuild (or now, if PURGE_TRIGGER_BUILD=1).
const STATIC_MODELS = new Set(["page", "publication", "unit"]);

export const handler = async (event) => {
  // 1) Auth — shared secret via header (preferred) or ?secret= query param.
  const secret = process.env.PURGE_SECRET;
  const h = event.headers || {};
  const sent =
    h["x-icjia-purge-secret"] ||
    h["X-Icjia-Purge-Secret"] ||
    (event.queryStringParameters && event.queryStringParameters.secret);
  if (!secret || sent !== secret) {
    return { statusCode: 401, body: "unauthorized" };
  }
  if (event.httpMethod && event.httpMethod !== "POST") {
    return { statusCode: 405, body: "method not allowed" };
  }

  // 2) Parse the Strapi webhook payload → content-type model name.
  let model = "";
  try {
    const body = JSON.parse(event.body || "{}");
    // Strapi v3 sends `model`; be tolerant of `uid` ("application::post.post").
    model = String(body.model || (body.uid || "").split(".").pop() || "").toLowerCase();
  } catch (e) {
    return { statusCode: 400, body: "bad payload" };
  }
  if (!model) return { statusCode: 200, body: "no model — no-op" };

  // 3) LIVE section → purge its cache tag (this also refreshes home, which carries
  //    every live tag). The next request re-renders fresh.
  const tag = MODEL_TAG[model];
  if (tag) {
    try {
      await purgeCache({ tags: [tag] });
      console.log(`purge-cache: ${model} → purged tag "${tag}"`);
      return { statusCode: 200, body: `purged ${tag}` };
    } catch (e) {
      console.error("purge-cache: purge failed:", String(e).slice(0, 160));
      return { statusCode: 200, body: "purge error" }; // never throw — just log
    }
  }

  // 4) STATIC section → optionally trigger a rebuild; else the nightly cron covers it.
  if (STATIC_MODELS.has(model)) {
    const hook = process.env.NETLIFY_BUILD_HOOK_URL;
    if (process.env.PURGE_TRIGGER_BUILD === "1" && hook) {
      try {
        const res = await fetch(hook, { method: "POST" });
        console.log(`purge-cache: static ${model} → build hook ${res.status}`);
        return { statusCode: 200, body: "build triggered" };
      } catch (e) {
        console.error("purge-cache: build hook failed:", String(e).slice(0, 160));
        return { statusCode: 200, body: "build error" };
      }
    }
    console.log(`purge-cache: static ${model} — deferring to nightly rebuild`);
    return { statusCode: 200, body: "static (nightly)" };
  }

  console.log(`purge-cache: unmapped model "${model}" — no-op`);
  return { statusCode: 200, body: "no-op" };
};

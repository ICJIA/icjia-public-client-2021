// Lazy meeting-detail endpoint (?slug=) — the /news/meetings/ table fetches this on
// first row-expand (the list query is light: no body/attachments/relations). A STATIC
// path + query param mirrors /api/home-research.json (a proven pattern); a dynamic
// `[slug].json` route 404s under trailingSlash:'always' unless called with a trailing
// slash. Returns ONLY the detail fields the expand renders (header comes from the list
// item). Live per request, edge-cached at the meetings TTL (per-slug cache key) so a
// popular meeting's detail serves warm from the CDN.
import type { APIRoute } from "astro";
import { getMeeting } from "../../lib/data";
import { setCache } from "../../lib/cache";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug");
  // Validate slug shape BEFORE hitting Strapi — caps a cost/DoS vector where an
  // attacker forces one live CMS query per arbitrary slug. Real slugs are kebab-case.
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,200}$/.test(slug)) {
    return new Response("Bad slug", { status: 400 });
  }

  const m = await getMeeting(slug);
  if (!m) {
    // Cache the negative result so repeat hits for a well-formed but nonexistent slug
    // don't each re-query Strapi (the `meetings` tag purges it when a meeting changes).
    const nf = new Response("Not found", { status: 404 });
    setCache(nf, "meetings");
    return nf;
  }

  const res = new Response(
    JSON.stringify({
      bodyHtml: m.bodyHtml,
      tags: m.tags,
      attachments: m.attachments,
      related: m.related,
      external: m.external,
    }),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
  // Netlify-CDN-Cache-Control (the header Netlify honors for functions) — same TTL as
  // the meetings page so a popular meeting's detail serves warm from the edge.
  setCache(res, "meetings");
  return res;
};

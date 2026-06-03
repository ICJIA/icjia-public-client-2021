// Same-origin SSR endpoint for the /researchhub/apps/ list-page images.
// The apps list ships ~1.67MB of base64 app images when they're inlined in the
// initial HTML (the JSON island + any SSR <img src>). base64 data-URIs are
// downloaded WITH the document, so loading="lazy" can't defer them and FCP/perf
// crater. We keep base64 OUT of the apps HTML and fetch it here AFTER load,
// then lazy-set each card's <img> as it nears the viewport — the same pattern as
// the home "Latest Research" strip (src/pages/api/home-research.json.ts).
//
// Returns { [slug]: base64Image } for every published app that has an image.
// Live per request; edge-cached at the 'hub' TTL (s-maxage 120, swr 600) so
// most views serve from the CDN without re-hitting the ResearchHub Strapi.
import type { APIRoute } from "astro";
import { getAllApps } from "../../lib/research";

export const prerender = true;

export const GET: APIRoute = async () => {
  const apps = await getAllApps();
  const map: Record<string, string> = {};
  for (const a of apps) {
    if (a.slug && a.image) map[a.slug] = a.image;
  }
  const res = new Response(JSON.stringify(map), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  return res;
};

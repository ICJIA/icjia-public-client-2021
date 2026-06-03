// Same-origin SSR endpoint for the home "Latest Research" strip.
// The home page fetches this AFTER load (Alpine init) so the ~2MB of base64
// hub images stay out of the initial HTML. Live per request; edge-cached 120s
// (the plan's hub TTL) so most views serve from the CDN without re-hitting the
// ResearchHub Strapi.
import type { APIRoute } from "astro";
import { getHomeResearch } from "../../lib/research";

export const prerender = true;

export const GET: APIRoute = async () => {
  const data = await getHomeResearch();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
};

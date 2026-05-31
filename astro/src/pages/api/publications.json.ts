// Full publications archive (~1108 rows, island-trimmed) — lazy-loaded by
// PublicationTable AFTER first paint so the /about/publications/ initial doc stays light
// (the page SSR-ships only the recent ~150). Enables whole-archive client search/sort.
// Static path (mirrors /api/home-research.json + /api/meeting.json — a dynamic .json
// route 404s under trailingSlash:'always'). Edge-cached at the publications TTL.
import type { APIRoute } from "astro";
import { getAllPublications } from "../../lib/data";
import { setCache } from "../../lib/cache";

export const prerender = false;

export const GET: APIRoute = async () => {
  const rows = await getAllPublications();
  const res = new Response(JSON.stringify(rows), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  setCache(res, "publications");
  return res;
};

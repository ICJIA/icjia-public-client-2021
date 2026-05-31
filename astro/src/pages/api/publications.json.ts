// Full publications archive (~1108 rows, island-trimmed) — lazy-loaded by
// PublicationTable AFTER first paint so the /about/publications/ initial doc stays light
// (the page SSR-ships only the recent ~150). Enables whole-archive client search/sort.
// Static path (mirrors /api/home-research.json + /api/meeting.json — a dynamic .json
// route 404s under trailingSlash:'always'). PRERENDERED at build → a static
// dist/api/publications.json (no SSR, no per-request REST hit); refreshed on the
// nightly/manual rebuild — publications need not be live (owner's call).
import type { APIRoute } from "astro";
import { getAllPublications } from "../../lib/data";

export const prerender = true;

export const GET: APIRoute = async () => {
  const rows = await getAllPublications();
  return new Response(JSON.stringify(rows), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

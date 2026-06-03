// Per-slug STATIC meeting-detail JSON (was /api/meeting.json?slug=, an on-demand SSR
// function). The /news/meetings/ table (MeetingTable.astro) fetches /api/meeting/<slug>.json
// on first row-expand. Prerendered: one static file per meeting slug, built from the same
// getMeeting() the SSR endpoint used, with the body markdown already rendered at build —
// refreshed on rebuild. ZERO functions. (`.json` files are exempt from trailingSlash:'always',
// so they serve directly as static files.)
import type { APIRoute } from "astro";
import { getMeeting, getAllMeetings } from "../../../lib/data";

export const prerender = true;

export async function getStaticPaths() {
  const meetings = await getAllMeetings();
  return meetings.filter((m) => m.slug).map((m) => ({ params: { slug: m.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const m = params.slug ? await getMeeting(params.slug) : null;
  const body = m
    ? {
        bodyHtml: m.bodyHtml,
        tags: m.tags,
        attachments: m.attachments,
        related: m.related,
        external: m.external,
      }
    : { bodyHtml: "", tags: [], attachments: [], related: [], external: [], error: true };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
